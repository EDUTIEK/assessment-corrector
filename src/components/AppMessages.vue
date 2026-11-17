<script setup>
import { computed, ref, watch } from "vue";
import {stores} from "@/store";

const layout = stores.layout();

const snackbar = ref(false);

watch(() => layout.showFeedback, (open) => {
  snackbar.value = open;
});

function onSnackbar(open) {
  if (snackbar.value === open) {
    return;
  }
  snackbar.value = open;
  if (!open) {
    layout.setHideFeedback();
  }
}

/**
 * Feedback text: all HTML is quoted, only newlines become line breaks
 */
const escapeHtml = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const feedbackHtml = computed(() => escapeHtml(layout.feedbackText ?? '')
    .replace(/\r?\n/g, '<br />'));

const timeout = computed(() => layout.feedbackAutoClose ? 5000 : -1);

</script>

<template>
  <v-snackbar
      :model-value="snackbar"
      :timeout="timeout"
      location="top"
      variant="text"
      content-class="feedback-snackbar"
      @update:model-value="onSnackbar"
  >
    <v-alert
        v-if="snackbar"
        class="ma-0"
        closable
        :type="layout.feedbackType"
        @click:close="onSnackbar(false)"
    >
      <span v-html="feedbackHtml"></span>
    </v-alert>
  </v-snackbar>
</template>

<style scoped>

/* content-class sits on .v-snackbar__wrapper; drop its frame so only the alert shows */
.v-snackbar__wrapper.feedback-snackbar {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  min-width: 0;
  min-height: 0;
  overflow: visible;
  padding: 0;
}

.feedback-snackbar .v-snackbar__content {
  padding: 0;
}

</style>