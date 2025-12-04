<script setup>
import {ref, watch} from 'vue';
import {stores} from "@/store";

const settingsStore = stores.settings();
const levelsStore = stores.levels();
const summariesStore = stores.summaries();

const props = defineProps(['correction_key']);

const points = ref(0);
const grade = ref('');
const statement = ref('');

function init() {
  const summary = summariesStore.getForCorrection(props.correction_key);
  if (summary) {
    points.value = summary.points;
    const level = levelsStore.getLevel(summary.grade_key);
    if (level) {
      grade.value = level.title;
      statement.value = level.statement;
    }
  }
}
watch(() => props.correction_key, init);
init();

</script>

<template>
  <div id="app-summary-points-wrapper">
    <strong>{{ $t('summaryPointsRating') }}</strong>
    {{ points }}
    {{ $t('allPoints', points) }}
    <strong>{{ $t('allGrade') }}</strong> {{ grade }}
    <p>{{ statement }}</p>
  </div>
</template>

<style scoped>

#app-summary-points-wrapper {
  font-size: 1rem;
  padding-top: 5px;
  padding-left: 10px;

}

.appPoints {
  width: 4em;
  border: 0;
  margin-left: 5px;
  margin-right: 5px;
  padding: 5px;
}
</style>
