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
 * annotate-pdf may steal focus asynchronously (CommentPopup / editor.focus via
 * setTimeout(0)). Empty Vuetify textareas also use opacity:0 until active — if
 * focus is lost, no caret is visible (unlike dirty fields which stay opaque).
 */
async function focusSelected() {
  const key = commentsStore.selectedKey;
  if (!key) {
    return;
  }

  const getTextarea = () => document.getElementById('app-comment-' + key);

  const tryFocus = () => {
    if (commentsStore.selectedKey !== key) {
      return 'abort';
    }
    const tx = getTextarea();
    if (!tx || tx.disabled) {
      return 'missing';
    }
    if (document.activeElement === tx) {
      return 'done';
    }
    tx.focus();
    // Make caret visible immediately in empty fields
    try {
      const pos = tx.value ? tx.value.length : 0;
      tx.setSelectionRange(pos, pos);
    } catch (_) {
      // ignore unsupported selection on some hosts
    }
    return document.activeElement === tx ? 'done' : 'retry';
  };

  await nextTick();

  // Retry briefly while annotate-pdf re-focuses the iframe after select()
  const deadline = Date.now() + 350;
  let delay = 0;
  while (Date.now() <= deadline) {
    const result = tryFocus();
    if (result === 'abort' || result === 'done') {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = delay === 0 ? 25 : Math.min(delay + 25, 100);
  }
  tryFocus();
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
