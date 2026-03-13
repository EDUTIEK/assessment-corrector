<script setup>
import {stores} from "@/store";
import i18n from "@/plugins/i18n";

const settingsStore = stores.settings();
const pointsStore = stores.points();
const criteriaStore = stores.criteria();

const props = defineProps(['correction_key']);
const { t } = i18n.global;

const has_general_criteria = criteriaStore.getCorrectionHasGeneralCriteria(props.correction_key);
const has_comment_criteria = criteriaStore.getCorrectionHasCommentCriteria(props.correction_key);

function pointsNote() {
  const with_comment = pointsStore.getSumOfPointsForCorrection(props.correction_key, true);
  const without_comment = pointsStore.getSumOfPointsForCorrection(props.correction_key, false);

  if (without_comment + with_comment == 0) {
    return '';
  }
  else if (!has_general_criteria) {
    return t('sumOfPointsToComments');
  }
  else  {
    return t('sumOfPointsToCommentsAndCriteria', [with_comment, without_comment]);
  }
}

</script>

<template>
  <span>
    <strong>{{ $t('sumOfPointsLabel')}}</strong>
    <span :class="pointsStore.getSumOfPointsForCorrection(props.correction_key) > settingsStore.Assessment.max_points ? 'red' : ''">
      {{ pointsStore.getSumOfPointsForCorrection(props.correction_key) }} von max. {{ settingsStore.Assessment.max_points }}</span> {{ pointsNote() }}
  </span>
</template>

<style scoped>

.red {
  color: red;
}

</style>