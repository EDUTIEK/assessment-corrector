<script setup>
import { ref } from 'vue';
import {stores} from "@/store";

const settingsStore = stores.settings();
const levelsStore = stores.levels();
const summariesStore = stores.summaries();

const props = defineProps(['correction_key']);

const points = ref(0);
const grade = ref('');
const statement = ref('');

const summary = summariesStore.getForCorrection(props.correction_key);
if (summary) {
  points.value = summary.points;
  const level = levelsStore.getLevel(summary.grade_key);
  if (level) {
    grade.value = level.title;
    statement.value = level.statement;
  }
}

</script>

<template>
  <div id="app-summary-points-wrapper">
    <label for="appSummaryPoints"><strong>{{ $t('summaryPointsRating') }}</strong></label>
    <input :disabled="true" id="appSummaryPoints" class="appPoints" type="number" min="0"
           :max="settingsStore.Assessment.max_points" v-model="points"/> {{ $t('allPoints', points) }}
    &nbsp;
    <strong>{{ $t('summaryPointsGrade') }}</strong> {{ grade }}

    <p>{{ statement }}</p>
  </div>
</template>

<style scoped>

#app-summary-points-wrapper {
  font-size: 1rem;
}

.appPoints {
  width: 4em;
  border: 0;
  margin-left: 5px;
  margin-right: 5px;
  padding: 5px;
}
</style>
