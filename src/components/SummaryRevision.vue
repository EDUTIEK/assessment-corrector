<script setup>
import {ref, watch} from 'vue';
import {stores} from "@/store";

const settingsStore = stores.settings();
const levelsStore = stores.levels();
const summariesStore = stores.summaries();
const preferencesStore = stores.preferences();

const props = defineProps(['correction_key']);

const text = ref('');
const points = ref(0);
const grade = ref('');
const statement = ref('');
const withText = ref(true);

function init() {
  const summary = summariesStore.getForCorrection(props.correction_key);
  if (summary) {
    text.value = summary.revision_text;
    points.value = summary.revision_points;
    const level = levelsStore.getLevel(summary.grade_key);
    if (level) {
      grade.value = level.title;
      statement.value = level.statement;
    }
    withText.value = stores.corrections().getCorrection(props.correction_key)?.can_enter_revision_text ?? false
  }
}
watch(() => props.correction_key, init);
init();

</script>

<template>
  <div id="app-summary-revision-wrapper">
    <div class="app-summary-text-display xlas-content headlines-three" v-html="text" v-if="withText"></div>
    <div class="app-summary-points">
      <p>
        <strong>{{ $t('summaryRevisionRating') }}</strong> {{ preferencesStore.formatNumber(points) }} {{ $t('allPoints', points) }}
        <strong>{{ $t('allGrade') }}</strong> {{ grade }}
      </p>
      <p>
        {{ statement }}
      </p>
    </div>

  </div>
</template>

<style scoped>

#app-summary-revision-wrapper {
  font-size: 1rem;
}

.app-summary-points {
  height: 100px;
  margin-left: 10px;
  padding-top: 15px;
}

.app-summary-text-display {
  height: calc(100% - 100px);
  border: 1px solid #cccccc;
  padding: 10px;
  overflow-y: scroll;
}
</style>
