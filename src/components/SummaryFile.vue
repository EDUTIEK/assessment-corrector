<script setup>
import {stores} from "@/store";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';
import {ref, onMounted, watchEffect} from "vue";

const props = defineProps(['correction_key']);
const summaryStore = stores.summaries();

const PdfNode = ref();
let pdfjs;

onMounted(() => {
  showPdf(stores.summaries().getForCorrection(props.correction_key));

  // display after file upload
  if (summaryStore.editSummary.correction_key == props.correction_key) {
    watchEffect(summaryStore.editSummary, showPdf(summaryStore.editSummary));
  }
});


async function showPdf(summary) {
  if (summary && summary.pdf) {
    const url = stores.api().getSummaryPdfUrl(summary);
    pdfjs = createPDFJsApi(PdfNode.value, './annotate-pdf/pdfjs-dist/web/viewer.html', url, {viewOnly: true});
  }
}
</script>

<template>
  <div class="app-summary-file-wrapper">
    <div class="appPdfNode" tabindex="0" ref="PdfNode"></div>
  </div>
</template>

<style scoped>

div.toolbar {
  display: none !important;
}

.app-summary-text-wrapper {
  height: 100%;
}

.appPdfNode {
  flex-grow: 1;
  width: 100%;
  height: 100%;
}

</style>
