<script setup>

import Editor from '@tinymce/tinymce-vue'
import TinyHelper from '@/lib/TinyHelper';

import {stores} from "@/store";
import { nextTick, ref, watch } from 'vue';
import Snippet from "@/data/Snippet";

const templateStore = stores.templates();
const snippetsStore = stores.snippets();

// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const editorId = ref('summaryTemplate');
const helper = new TinyHelper( editorId.value);

watch(() => snippetsStore.selection_open, handleSnippet);

function handleInit() {
  helper.init();
}

async function handleFocusChange() {
  helper.applyFocus();
  await nextTick();
  helper.restoreScrolling();
}

function handleChange() {
  templateStore.updateContent(true);
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
  <div class="app-template-text-wrapper">
    <label :for="editorId" class="hidden">{{ $t('templateTextHiddenField') }}</label>
    <editor
        :id="editorId"
        v-model="templateStore.editTemplate.content"
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

.app-template-text-wrapper {
  box-sizing: border-box;
  height: 100%;
  max-width: 80em;
  width: 100%;
  margin-inline: auto;
  padding-block: 1.5rem;
}
</style>
