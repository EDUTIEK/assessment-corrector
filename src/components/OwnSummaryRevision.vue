<script setup>

import Editor from '@tinymce/tinymce-vue'
import TinyHelper from '@/lib/TinyHelper';

import {stores} from "@/store";
import { nextTick, watch } from 'vue';
import Snippet from "@/data/Snippet";
import ConfirmRevision from '@/components/ConfirmRevision.vue';

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
    <div class="app-summary-editor">
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
      <v-row dense>
        <v-col cols="10">
          <label for="appOwnSummaryPoints"><strong>{{ $t('summaryRevisionRating') }}</strong></label>
          &nbsp;
          <input :disabled="!itemsStore.canRevise" id="appOwnSummaryPoints" class="appPoints" type="number"
                 :min="summariesStore.pointsCorridor.min"
                 :max="summariesStore.pointsCorridor.max"
                 v-model="summariesStore.editSummary.revision_points"/>
          {{ $t('allPoints', Number.isNaN(summariesStore.editSummary.revision_points) ? 0 : summariesStore.editSummary.revision_points) }}
          &nbsp;
          <span v-if="!Number.isNaN(summariesStore.editSummary.revision_points)">
            <strong>{{ $t('allGrade') }}</strong> {{ levelsStore.getLevelForPoints(summariesStore.editSummary.revision_points)?.title}}
          </span>
          <p>{{ levelsStore.getLevelForPoints(summariesStore.editSummary.revision_points)?.statement }}</p>
        </v-col>
        <v-col cols="2">
          <confirm-revision></confirm-revision>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>

.appPoints {
  width: 4em;
  border: 1px solid #aaaaaa;
  border-radius: 5px;
  padding: 3px;
}

.app-summary-points {
  height: 100px;
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
