<script setup>

import Editor from '@tinymce/tinymce-vue'
import TinyHelper from '@/lib/TinyHelper';

import {stores} from "@/store";
import { nextTick, ref, watch } from 'vue';
import Snippet from "@/data/Snippet";
import ConfirmRevision from '@/components/ConfirmRevision.vue';
import i18n from "@/plugins/i18n";

const { t } = i18n.global;
const summariesStore = stores.summaries();
const preferencesStore = stores.preferences();
const layoutStore = stores.layout();
const snippetsStore = stores.snippets();
const itemsStore = stores.items();
const settingsStore = stores.settings();
const levelsStore = stores.levels();

// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const props = defineProps(['editorId']);
const helper = new TinyHelper(props.editorId);

const points = ref(null);
const message = ref('');
const messageClass = ref('');
const withText = ref(true);
const corridor = summariesStore.pointsCorridor;

watch(points, () => {
  summariesStore.updateRevisionPoints(points.value);
  message.value = summariesStore.currentRevisionGradeStatement;
});

points.value = summariesStore.editSummary.revision_points;
withText.value = stores.corrections().ownCorrection.can_enter_revision_text;
message.value = summariesStore.currentRevisionGradeStatement;

function check(value) {
  if (value < corridor.min || value > corridor.max) {
    summariesStore.updateRevisionPoints(null);
    message.value = t('summariesPointsOutsideMinMax', [
      preferencesStore.formatNumber(corridor.min),
      preferencesStore.formatNumber(corridor.max)
    ]);
    messageClass.value = 'alert';
    return false;
  }

  messageClass.value = '';
  return true;
}

function handleInit() {
  helper.init();
}

function handleChange() {
  summariesStore.updateContent(true);
  helper.applyZoom();
}

function handleKeyUp() {
  summariesStore.updateContent(true);
}

function handleKeyDown() {
  switch (event.key) {
    case "F1":
      event.preventDefault();
      helper.openSnippets();
      break;
    default:
      layoutStore.handleKeyDown(event);
  }
}

async function handleSnippet() {
  if (!snippetsStore.selection_open
      && snippetsStore.open_for_purpose == Snippet.FOR_SUMMARY
  ) {
    await handleFocusChange();
    if (snippetsStore.insert_text) {
      const insert = snippetsStore.insert_text;
      snippetsStore.insert_text = '';
      helper.insertContent(insert);
    }
  }
}
watch(() => snippetsStore.selection_open, handleSnippet);

</script>

<template>
  <div class="app-own-summary-text-wrapper">
    <div class="app-summary-editor" v-if="withText">
      <label :for="props.editorId" class="hidden">{{ $t('ownSummaryRevisionTextHiddenField') }}</label>
      <editor
          :id="props.editorId"
          v-if="itemsStore.canRevise"
          v-model="summariesStore.editSummary.revision_text"
          @init="handleInit"
          @change="handleChange"
          @keyup="handleKeyUp"
          @keydown="handleKeyDown"
          @scroll="helper.saveScrolling"
          licenseKey = 'gpl'
          :init="helper.getInit()"
      />
    </div>

    <div class="app-summary-text-display long-essay-content correction-summary"
         v-if="!itemsStore.canRevise"
         v-html="summariesStore.editSummary.revision_text">
    </div>

    <v-container class="app-summary-points">
      <v-row dense class="ma-0 pa-0">
        <v-col cols="10" class="ma-0 pa-0">
          <p>
            <label class="middle" for="appOwnSummaryPoints"><strong>{{ $t('summaryRevisionRating') }}</strong></label>
            &nbsp;
            <v-number-input
                id="appOwnSummaryRevisionPoints"
                class="appPoints middle"
                variant="outlined"
                density="compact"
                width="10em"
                hide-details
                :precision="settingsStore.Assessment.no_manual_decimals ? 0 : 2"
                :decimal-separator="preferencesStore.decimalSeparator"
                :disabled="summariesStore.isOwnRevisionDisabled"
                :rules="[check]"
                v-model="points"
            ></v-number-input>
            &nbsp;
            <span class="middle"><strong>{{ $t('allGrade') }}</strong> {{ summariesStore.currentRevisionGradeTitle }}</span>
          </p>

          <p :class="messageClass">{{ message }}</p>
        </v-col>
        <v-col cols="2" class="ma-0 pa-0">
          <confirm-revision v-show="!summariesStore.isOwnRevised"></confirm-revision>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>

.middle {
  display:inline-block;
  vertical-align: middle;
  margin-top: 5px;
  margin-bottom: 5px;
}

.appPoints {
  zoom: 80%;
}

.alert {
  color:red;
}

.app-summary-editor {
  height: calc(100% - 100px);
}

.app-summary-text-display {
  height: calc(100% - 100px);
  border: 1px solid #cccccc;
  padding: 10px;
  overflow-y: scroll;
}


</style>
