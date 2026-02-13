<script setup>
import {stores} from "@/store";

const summariesStore = stores.summaries();

const props = defineProps(['correction_key']);

function text() {
  let summary = summariesStore.getForCorrection(props.correction_key);
  if (summary) {
    return summary.text;
  }
}
</script>

<template>
  <div class="app-summary-text-wrapper xlas-content headlines-three" v-html="text()">
  </div>
</template>

<style scoped>

.app-summary-text-wrapper {
  height: 100%;
  border: 1px solid #cccccc;
  padding: 10px;
  overflow-y: scroll;
}

.app-summary-text-display {
  height: 100%;
}

</style>
