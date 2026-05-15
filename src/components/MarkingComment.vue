<script setup xmlns="http://www.w3.org/1999/html">
import {stores} from "@/store";
import {nextTick, onMounted, ref, watch} from 'vue';
import i18n from "@/plugins/i18n";
import Snippet from "@/data/Snippet";

const apiStore = stores.api();
const commentsStore = stores.comments();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const criteriaStore = stores.criteria();
const pointsStore = stores.points();
const layoutStore = stores.layout();
const snippetsStore = stores.snippets();
const configStore = stores.config();

const { t } = i18n.global;
const props = defineProps(['comment']);

const comment = props.comment;

const textRef = ref();

let comment_points = ref(0);
const pointsObject = pointsStore.getObjectByData(comment.correction_key, comment.key, '');
comment_points.value = pointsObject ? pointsObject.points : 0;

function isSelected(comment) {
  return comment.key == commentsStore.selectedKey;
}

function isDisabled(comment) {
  return summariesStore.isOwnDisabled || comment.correction_key != stores.corrections().ownKey
}

function hasTrash(comment) {
  return comment.correction_key == stores.corrections().ownKey && !summariesStore.isOwnDisabled
}

function hasDetails(comment) {
  return comment.rating_excellent || comment.rating_cardinal || pointsStore.getSumOfPointsForComment(comment.key) > 0;
}


/**
 * Ugly fix for accessibility issue in v-textarea component of vuetify
 */
onMounted(() => {
  const container = document.getElementById('appCommentContainer' + comment.key);
  for (const label of container.getElementsByTagName('label')) {
    if (label.getAttribute('for').includes('app-comment-')) {
      label.classList.add('sr-only');
      if (label.getAttribute('aria-hidden') == 'true') {
        if (!label.getAttribute('for').includes('-sizer')) {
          label.setAttribute('for', label.getAttribute('for') + '-sizer');
        }
      } else {
        label.setAttribute('id', 'app-comment-' + comment.key + '-messages');
      }
    }
  }
  for (const textarea of container.getElementsByTagName('textarea')) {
    textarea.style.marginTop = '-15px';
    textarea.style.fontSize = '0.9rem';
  }
  for (const div of container.getElementsByClassName('v-input__details')) {
   div.style.display ='none';
  }
});


/**
 * Get the background color for the text field of a comment
 * @param comment
 * @return {string}
 */
function getBgColor(comment) {

  return configStore.getCommentColor(comment.correction_position, comment.key == commentsStore.selectedKey);
}

function getPointsInputStyle(comment) {
  const sum = pointsStore.getSumOfPointsForCorrection(comment.correction_key);
  if (sum > settingsStore.Assessment.max_points) {
    return 'color: red;';
  }
  return '';
}

function getPointsDisplay(comment) {
  return pointsStore.getSumOfPointsForComment(comment.key);
}

function getPointsLabel(comment) {
 return t('allPoints', getPointsDisplay(comment));
}

async function toggleExcellent(comment) {
  if (comment.rating_excellent) {
    comment.rating_cardinal = false;
  }
  commentsStore.setMarkerChange();
  commentsStore.updateComment(comment);
}

async function toggleCardinal(comment) {
  if (comment.rating_cardinal) {
    comment.rating_excellent = false;
  }
  commentsStore.setMarkerChange();
  commentsStore.updateComment(comment);
}

async function selectComment(comment) {
  if (commentsStore.selectedKey !== comment.key) {
    commentsStore.selectComment(comment.key);
  }
}

async function handleTextKeydown() {
  if (event.altKey) {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        layoutStore.showEssay();
        await nextTick();
        commentsStore.setCaretRequest();
        break;
      case "Delete":
        if (!isDisabled(commentsStore.selectedComment)) {
          event.preventDefault();
          commentsStore.deleteComment(commentsStore.selectedKey);
        }
        break;
    }
  // } else {
  //   switch (event.key) {
  //     case "F1":
  //       event.preventDefault();
  //       openSnippets();
  //       break;
  //   }
  }
}

function handleTextKeyUp() {
  if (isDisabled(comment)) {
    return;
  }

  const textarea = textRef.value;
  const cursor = textarea.selectionEnd;
  let new_text = null;

  switch (event.key) {
    case "F1":
      event.preventDefault();
      openSnippets();
      break;

    case "z":
      if (event.ctrlKey) {
        new_text = snippetsStore.autoUndo(textarea.value);
      }
      break;

    case "Backspace":
      new_text = snippetsStore.autoUndo(textarea.value);
      break;

    default:
      new_text = snippetsStore.autoReplace(Snippet.FOR_COMMENT, textarea.value, cursor)
  }

  if (new_text) {
    const offset = new_text.length - textarea.value.length;
    comment.comment = new_text;
    textarea.setSelectionRange(cursor + offset, cursor + offset);
  }

  commentsStore.updateComment(comment);
}

async function handleSumOfPointsKeydown() {
  handleTextKeydown();
  switch (event.key) {
    case "Enter":
      event.preventDefault();
      layoutStore.focusMarkingCommentPoints();
      break;
  }
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'MarkingCommentPointsSum') {
    await nextTick();
    if (comment.key == commentsStore.selectedKey) {
      document.getElementById('pointsInput' + comment.key).focus();
    }
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

function openSnippets() {
  const textarea = textRef.value;
  snippetsStore.openSelection(Snippet.FOR_COMMENT, commentsStore.selectedKey,
      textarea.value.substring(textarea.selectionStart, textarea.selectionEnd));
}

async function handleSnippet() {
  if (!snippetsStore.selection_open
      && !isDisabled(comment)
      && snippetsStore.open_for_purpose == Snippet.FOR_COMMENT
      && snippetsStore.open_for_key == comment.key) {
    const textarea = textRef.value;
    await nextTick();
    textarea.focus();
    if (snippetsStore.insert_text) {
      const insert = snippetsStore.insert_text;
      snippetsStore.insert_text = '';
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      comment.comment = comment.comment.slice(0, start) + insert + comment.comment.slice(end);
      await nextTick();
      textarea.setSelectionRange(start, start + insert.length);
    }
  }
}
watch(() => snippetsStore.selection_open, handleSnippet);

</script>


<template>
  <v-container :id="'appCommentContainer' + comment.key" :key="comment.key" class="commentContainer">

    <v-row dense @click="selectComment(comment)">

      <!-- icon and label -->
      <v-col cols="2">
        <v-icon size="small" :icon="comment.getMarkIcon()"></v-icon> &nbsp;
        <button tabindex="0"
                :class="'v-btn commentLabel ' + (comment.key == commentsStore.selectedKey ? 'selected' : '')"
        >
          {{ comment.label }}
        </button>
      </v-col>

      <v-col cols="9">

        <v-container>

          <!-- COMMENT INPUT -->

          <v-row dense v-show="isSelected(comment)">
            <v-col cols="12">
              <v-textarea class="commentInput" :bg-color="getBgColor(comment)" rounded="0" density="compact" variant="solo"
                          ref="textRef"
                          :id="'app-comment-' + comment.key"
                          :label="$t('markingCommentsCommentForLabel', [comment.label])"
                          rows="1" auto-grow
                          :readonly="isDisabled(comment)"
                          @change="commentsStore.updateComment(comment)"
                          @keyup="handleTextKeyUp()"
                          @keydown="handleTextKeydown()"
                          v-model="comment.comment">
              </v-textarea>
            </v-col>
          </v-row>

          <!-- DETAILS INPUT -->

          <v-row dense v-show="isSelected(comment)">

            <v-col cols="3">
              <!-- select snippets  -->
              <v-btn class="snippetsButton" density="compact" variant="plain" prepend-icon="mdi-plus"
                     :tabindex="isSelected(comment) ? 0 : -1"
                     :disabled="isDisabled(comment)"
                     @keydown="handleTextKeydown()"
                     @click="openSnippets"
              >
                <span class="sr-only">{{ $t('markingOpenSnippets') }}</span>
              </v-btn>
            </v-col>

            <!-- show points -->
            <v-col cols="3">
                <span tabindex="0" class="pointsSum"
                      v-if="stores.settings().Task.enable_partial_points"
                      :id="'pointsInput' + comment.key"
                      @keydown="handleSumOfPointsKeydown()"
                >{{ $t('markingCommentSum')}} {{ getPointsDisplay(comment) }} {{ getPointsLabel(comment) }}</span>
            </v-col>

            <!-- enter rating excellent -->
            <v-col cols="3">
              <span
                  v-if="stores.settings().Task.enable_comment_ratings"
                  v-show="comment.rating_excellent || comment.key == commentsStore.selectedKey">
               <input type="checkbox"
                      class="ratingInput"
                      v-model="comment.rating_excellent"
                      :id="'ratingExcellent' + comment.key"
                      :disabled="isDisabled(comment)"
                      @change="toggleExcellent(comment)"
                      @keydown="handleTextKeydown()"
               />

                <label :for="'ratingExcellent' + comment.key">&nbsp;{{ settingsStore.Task.positive_rating }}</label>
              </span>
            </v-col>

            <!-- enter rating cardinal -->
            <v-col cols="3">
              <span
                  v-if="stores.settings().Task.enable_comment_ratings"
                  v-show="comment.rating_cardinal || comment.key == commentsStore.selectedKey">
                <input type="checkbox"
                       class="ratingInput"
                       v-model="comment.rating_cardinal"
                       :id="'ratingCardinal' + comment.key"
                       :disabled="isDisabled(comment)"
                       @change="toggleCardinal(comment)"
                       @keydown="handleTextKeydown()"
                />
                <label :for="'ratingCardinal' + comment.key">&nbsp;{{ settingsStore.Task.negative_rating }}</label>
              </span>
            </v-col>

          </v-row>

          <!-- COMMENT DISPLAY -->

          <v-row dense>
            <v-col cols="12" v-show="!isSelected(comment)">
              <div class="commentDisplay"
                   v-show="comment.comment"
                   :style="'background-color: ' + getBgColor(comment) + ';'"
              >
                {{comment.comment}}
              </div>
            </v-col>
          </v-row>

          <!-- DETAILS DISPLAY -->

          <v-row dense class="detailsDisplay" v-show="!isSelected(comment) && hasDetails(comment)">

            <!-- show points -->
            <v-col cols=3>
            </v-col>
            <v-col cols=3>
              <span v-show="getPointsDisplay(comment) > 0">
                <span class="pointsSum">{{ $t('markingCommentSum')}} {{ getPointsDisplay(comment) }} {{ getPointsLabel(comment) }}</span>
              </span>
            </v-col>

            <!-- show excellent -->
            <v-col cols=3>
              <span v-show="comment.rating_excellent">
                 <v-icon icon="mdi-checkbox-outline"></v-icon> {{ settingsStore.Task.positive_rating }}
              </span>
            </v-col>

            <!-- show cardinal -->
            <v-col cols=3>
              <span v-show="comment.rating_cardinal">
                <v-icon icon="mdi-checkbox-outline"></v-icon> {{ settingsStore.Task.negative_rating }}
              </span>
            </v-col>
          </v-row>
        </v-container>
      </v-col>

      <!-- trash -->
      <v-col cols="1" class="trashColumn">
        <v-btn class="trashButton" density="compact" size="small" variant="text" prepend-icon="mdi-delete-outline"
               v-show="hasTrash(comment)"
               :tabindex="isSelected(comment) ? 0 : -1"
               :disabled="isDisabled(comment)"
               @keydown="handleTextKeydown()"
               @click="commentsStore.deleteComment(comment.key);"
        >
          <span class="sr-only">{{ $t('markingCommentsDelete') }}</span>
        </v-btn>
      </v-col>

    </v-row>
  </v-container>
</template>

<style scoped>

.v-container {
  padding: 0;
  margin: 0;
}

.v-row {
  font-size: 12px;
  padding: 0;
  margin: 0;
}

.v-col {
  font-size: 12px;
  padding: 0;
  margin: 0;
}

.commentContainer {
  padding: 5px 0;
  border-bottom: 1px dotted gray;
}

.commentLabel {
  font-size: 14px;
  padding: 3px;
}

.commentLabel.selected {
  background-color: #606060;
  font-weight: bold;
  color: white;
}

.commentInput {
  width: 100%;
  font-family: serif;
  margin-bottom: 5px;
}

.commentDisplay {
  width: 100%;
  font-family: serif;
  font-size: 0.9rem;
  padding: 2px 15px;
  margin-bottom: 5px;
}

.detailsDisplay {
  color: #606060;
}

i {
  margin-top: -2px;
}

.pointsSum {
  display: inline-block;
  text-align: left;
  color: #606060;
  padding-left: 3px;
  padding-top: 4px;
}

.pointsInput {
  display: inline-block;
  width: 3rem;
  text-align: left;
  color: #606060;
  padding-left: 3px;
}

input.pointsInput {
  border: 1px solid #aaaaaa;
  border-radius: 5px;
  padding: 3px;
}

.ratingInput {
  display: inline-block;
  width: 1rem;
}

input.ratingInput {
  margin-top: 5px;
}

.trashColumn {
  position: relative;
}

.trashButton {
  position: absolute;
  bottom: 5px;
}

</style>
