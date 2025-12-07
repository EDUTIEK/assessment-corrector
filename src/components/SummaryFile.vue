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
    <object v-if="url()" class="summary-pdf"
            type="application/pdf"
            :data="url()"
    >
    </object>
  </div>
</template>

<style scoped>

.app-summary-text-wrapper {
  height: 100%;
}

object {
  height: 100%;
  width: 100%;
}

</style>
