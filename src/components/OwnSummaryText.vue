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

let prevent_next_keyup_auto_replace = false;

watch(() => layoutStore.focusChange, handleFocusChange);

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

function handleKeyUp(event) {
  let new_text = null;
  const data = helper.getTextNodeAtCursor();

  switch (event.key) {
    case "F1":
      // prevent double handling of F1
      event.preventDefault();
      break;

    case "Backspace":
      break;

    default:
      // mainly for visible characters
      // data.cursor is then already behind the inserted character
      if (!prevent_next_keyup_auto_replace) {
        new_text = snippetsStore.autoReplace(Snippet.FOR_SUMMARY, data.text, data.cursor);
        if (new_text) {
          const offset = new_text.length - data.text.length;
          helper.replaceNodeText(data.node, new_text, data.cursor + offset);
        }
      }
  }
  prevent_next_keyup_auto_replace = false;

  summariesStore.updateContent(true);
}

function handleKeyDown(event) {
  let data;
  let new_text;

  switch (event.key) {
    case "F1":
      // needs to be keydown, otherwise chromium opens its help page
      event.preventDefault();
      helper.openSnippets();
      break;

    case "Tab":
      data = helper.getTextNodeAtCursor();
      new_text = snippetsStore.autoReplace(Snippet.FOR_SUMMARY, data.text, data.cursor, true);
      if (new_text) {
        // Must use TinyMCE's event (not window.event): table_tab_navigation
        // only skips when evt.isDefaultPrevented() is true on the wrapped event.
        event.preventDefault();

        const offset = new_text.length - data.text.length;
        helper.replaceNodeText(data.node, new_text, data.cursor + offset);
        prevent_next_keyup_auto_replace = true;
        return false;
      }
      break;

    case "Backspace":
      data = helper.getTextNodeAtCursor();
      new_text = snippetsStore.autoUndo(data.text);
      if (new_text) {
        event.preventDefault();
        const offset = new_text.length - data.text.length;
        helper.replaceNodeText(data.node, new_text, data.cursor + offset);
        prevent_next_keyup_auto_replace = false;
        return false;
      }
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
        :init="helper.getInit(handleKeyDown, handleKeyUp)"
    />
  </div>
</template>

<style scoped>

.app-own-summary-text-wrapper {
  height: 100%;
}
</style>
