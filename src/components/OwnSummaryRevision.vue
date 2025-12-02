<script setup>
/*
* Import TinyMCE
* @see https://www.tiny.cloud/docs/tinymce/latest/vite-es6-npm/
*/
import tinymce from 'tinymce';

/* Default icons are required. After that, import custom icons if applicable */
import 'tinymce/icons/default/icons.min.js';

/* Required TinyMCE components */
import 'tinymce/themes/silver/theme.min.js';
import 'tinymce/models/dom/model.min.js';

/* Import a skin (can be a custom skin instead of the default) */
import 'tinymce/skins/ui/oxide/skin.js';

/* Import plugins */
import '@/plugins/tiny_de.js';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/wordcount';

/* content UI CSS is required */
import 'tinymce/skins/ui/oxide/content.js';

/* The default content CSS can be changed or replaced with appropriate CSS for the editor content. */
import 'tinymce/skins/content/default/content.js';

// Import tiny vue integration
import Editor from '@tinymce/tinymce-vue'
import TinyHelper from '@/lib/TinyHelper';

import contentLocalCss from '@/styles/content.css?inline';
import headlinesThreeCss from '@/styles/headlines-three.css?inline';

import {stores} from "@/store";
import { nextTick, watch } from 'vue';
import Snippet from "@/data/Snippet";
import SumOfPoints from "@/components/SumOfPoints.vue";

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

watch(() => layoutStore.focusChange, handleFocusChange);

function handleInit() {
  helper.init();
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'ownRevision') {
    helper.applyFocus();
    await nextTick();
    helper.restoreScrolling();
  }
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
    <div class="app-own-summary-editor">
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

    <v-container class="app-own-summary-points">
      <v-row dense>
        <v-col cols="10">
          <label for="appOwnSummaryPoints"><strong>{{ $t('ownSummaryPointsRating') }}</strong></label>
          &nbsp;
          <input :disabled="!itemsStore.canRevise" id="appOwnSummaryPoints" class="appPoints" type="number" min="0"
                 :max="settingsStore.Assessment.max_points" v-model="summariesStore.editSummary.revision_points"/>
          {{ $t('allPoints', summariesStore.editSummary.revision_points) }}
          &nbsp;
          <strong>{{ $t('ownSummaryPointsGrade') }}</strong> {{ levelsStore.getLevelForPoints(summariesStore.editSummary.revision_points)?.title}}
          <p>{{ levelsStore.getLevelForPoints(summariesStore.editSummary.revision_points)?.statement }}</p>
        </v-col>
        <v-col cols="2">
          <v-btn density="compact" variant="text" v-if="!itemsStore.canRevise"
                 @click="stores.layout().showRevision = true;">
            <v-icon left icon="mdi-file-certificate-outline"></v-icon>
            <span>{{ $t('allAuthorize') }}</span>
          </v-btn>
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

.app-own-summary-points {
  height: 100px;
  overflow: hidden;
}

.app-own-summary-editor {
  height: calc(100% - 100px);
}

.app-own-summary-text-wrapper {
  height: 100%;
}

.app-summary-text-display {
  height: calc(100% - 100px);
  border: 1px solid #cccccc;
  padding: 10px;
  overflow-y: scroll;
}


</style>
