<script setup>

import Editor from '@tinymce/tinymce-vue'
import TinyHelper from '@/lib/TinyHelper';

import {stores} from "@/store";
import { nextTick, watch } from 'vue';
import Snippet from "@/data/Snippet";

const summariesStore = stores.summaries();
const preferencesStore = stores.preferences();
const layoutStore = stores.layout();
const snippetsStore = stores.snippets();

// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const props = defineProps(['editorId']);
const helper = new TinyHelper(props.editorId);


watch(() => layoutStore.focusChange, handleFocusChange);
watch(() => snippetsStore.selection_open, handleSnippet);

function handleInit() {
  helper.init();
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'ownSummary') {
    helper.applyFocus();
    await nextTick();
    helper.restoreScrolling();
  }
}

function handleChange() {
  summariesStore.updateContent(true);
  helper.applyZoom();
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

</script>

<template>
  <div class="app-own-summary-text-wrapper">
    <label :for="props.editorId" class="hidden">{{ $t('ownSummaryTextHiddenField') }}</label>
    <editor
        :id="props.editorId"
        v-if="!summariesStore.isOwnDisabled"
        v-model="summariesStore.editSummary.text"
        @init="handleInit"
        @change="handleChange"
        @scroll="helper.saveScrolling"
        @focus="snippetsStore.list_purpose = Snippet.FOR_SUMMARY"
        licenseKey = 'gpl'
        :init="helper.getInit()"
    />
  </div>
</template>

<style scoped>

.app-own-summary-text-wrapper {
  height: 100%;
}
</style>
