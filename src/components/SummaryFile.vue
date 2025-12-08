<script setup>
import {stores} from "@/store";
import {ref} from "vue";

const props = defineProps(['correction_key']);

function url() {
  let summary = stores.summaries().getForCorrection(props.correction_key);
  if (summary) {
    return stores.api().getSummaryPdfUrl(summary);
  }
}
</script>

<template>
  <div class="app-summary-file-wrapper">
    <iframe scrolling="no" v-if="url()" class="summary-pdf"
            type="application/pdf"
            :src="url()"
    >
    </iframe>
  </div>
</template>

<style scoped>

div.toolbar {
  display: none !important;
}

.app-summary-text-wrapper {
  height: 100%;
}

iframe {
  height: calc(100% - 10px);
  width: 100%;
  overflow: hidden;
}

</style>
