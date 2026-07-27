<script setup>
import {stores} from "@/store";
import MarkingComment from '@/components/MarkingComment.vue';
import { nextTick, watch } from 'vue';

const commentsStore = stores.comments();

watch(() => commentsStore.selectionChange, focusSelected, { flush: 'post' });
watch(() => commentsStore.focusRequest, focusSelected, { flush: 'post' });
watch(() => commentsStore.firstVisibleKey, scrollToFirstVisible);

/**
 * Focus the currently selected comment textarea.
 *
 * Triggered by selectionChange and by focusRequest (from EssayPdf after
 * annotate-pdf's focus-end, or after setAll/select left focus in the PDF).
 * Empty Vuetify textareas use opacity:0 until active — labels are sr-only here,
 * so setSelectionRange keeps the caret visible on empty fields.
 */
async function focusSelected() {
  const key = commentsStore.selectedKey;
  if (!key) {
    return;
  }

  await nextTick();

  if (commentsStore.selectedKey !== key) {
    return;
  }

  const tx = document.getElementById('app-comment-' + key);
  if (!tx || tx.disabled) {
    return;
  }
  if (document.activeElement === tx) {
    return;
  }

  tx.focus();
  try {
    const pos = tx.value ? tx.value.length : 0;
    tx.setSelectionRange(pos, pos);
  } catch (_) {
    // ignore unsupported selection on some hosts
  }
}


/**
 * Set the scrolling so that the complete mark is visible
 */
async function scrollToFirstVisible() {
  await nextTick();
  let el = document.getElementById('appCommentContainer' + commentsStore.firstVisibleKey);
  if (el) {
    el.scrollIntoView();
  }
}

</script>


<template>
  <div id="appMarkingComments">
    <marking-comment v-for="comment in commentsStore.activeComments" :key="comment.key" :comment="comment"></marking-comment>
  </div>
</template>

<style scoped>

</style>
