<script setup>
import {stores} from "@/store";
import {nextTick, ref, watch} from 'vue';

const criteriaStore = stores.criteria();
const commentsStore = stores.comments();
const pointsStore = stores.points();
const apiStore = stores.api();
const settingStore = stores.settings();
const summariesStore = stores.summaries();
const layoutStore = stores.layout();
const preferencesStore = stores.preferences();

let comment_key = ref('');
let correction_key = ref('');
let criteriaPoints = ref({});

async function loadPoints() {
  const comment = commentsStore.getComment(commentsStore.selectedKey);
  comment_key.value = comment ? comment.key : '';
  correction_key.value = comment ? comment.correction_key : stores.corrections().ownKey;

  criteriaPoints.value = {};
  for (const criterion of criteriaStore.getCorrectionCommentCriteria(correction_key.value)) {
    const pointsObject = pointsStore.getObjectByData(correction_key.value, comment_key.value, criterion.key);
    criteriaPoints.value[criterion.key] = pointsObject?.points ?? 0;
  }
  // criterion_key '' means points given without criterion
  const pointsObject = pointsStore.getObjectByData(correction_key.value, comment_key.value, '');
  criteriaPoints.value[''] = pointsObject?.points ?? 0;
}

loadPoints();
watch(() => commentsStore.selectionChange, loadPoints);

function savePoints(criterionKey) {
  pointsStore.setValueByCommentOrCriterion(commentsStore.selectedKey, criterionKey, criteriaPoints.value[criterionKey]);
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'MarkingCommentPoints') {
    await nextTick();
    document.getElementById('appMarkingCommentPointsStart').focus();
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);


async function handleKeyDown(event) {
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      layoutStore.focusMarkingCommentPointsSum();
      break;
  }
}

</script>


<template>
  <div>
    <p class="info" v-if="comment_key == ''">
      {{ $t('markingCommentPointsPleaseSelect') }}
    </p>
    <v-table v-if="comment_key != ''" density="compact">
      <thead>
      <tr>
        <th class="col-left">
          <span id="appMarkingCommentPointsStart" tabindex="0" @keydown="handleKeyDown">{{ $t('markingCommentPointsCriterion') }}</span>
        </th>
        <th class="col-mid text-right">
          {{ $t('allPoints', 0) }}
        </th>
        <th class="col-right text-right">
          {{ $t('markingCommentPointsSumOfMax') }}
        </th>
      </tr>
      </thead>
      <tbody>
      <!-- points without criterion -->
      <tr>
        <td class="col-left">
          <label tabindex="0" @keydown="handleKeyDown" for="app-points-input-without">{{ $t('markingCommentPointsWithoutCriterion') }}</label>
        </td>
        <td class="col-mid text-right">
          <input class="appPoints" type="number" v-model="criteriaPoints['']"
                 id="pp-points-input-without"
                 :disabled="summariesStore.isOwnDisabled || comment_key == '' || correction_key != stores.corrections().ownKey"
                 :max="settingStore.Assessment.max_points"
                 @change="savePoints('')"
                 @keydown="handleKeyDown"
          />
        </td>
        <td :class="'col-right text-right ' + (pointsStore.getPointsOfCriterionExceeded(null, correction_key) ? 'red' : '')">
          {{ preferencesStore.formatNumber(pointsStore.getSumOfPointsForCorrection(correction_key, true, false)) }} /
          {{ preferencesStore.formatNumber(settingStore.Assessment.max_points) }}
        </td>
      </tr>
      <!-- criteria points -->
      <tr v-for="criterion in criteriaStore.getCorrectionCommentCriteria(correction_key)" :key="criterion.key">
        <td class="col-left">
          <label tabindex="0" @keydown="handleKeyDown" :for="'app-points-input-' + criterion.key">{{ criterion.title }}</label>
        </td>
        <td class="col-mid text-right">
          <input class="appPoints" type="number" v-model="criteriaPoints[criterion.key]"
                 :id="'app-points-input-' + criterion.key"
                 :disabled="summariesStore.isOwnDisabled || comment_key == '' || correction_key != stores.corrections().ownKey"
                 :max="criterion.points"
                 @change="savePoints(criterion.key)"
                 @keydown="handleKeyDown"
          />
        </td>
        <td :class="'col-right text-right ' + (pointsStore.getPointsOfCriterionExceeded(criterion, correction_key) ? 'red' : '')">
          {{ preferencesStore.formatNumber(pointsStore.getSumOfPointsForCriterion(criterion, correction_key)) }} /
          {{ preferencesStore.formatNumber(criterion.points) }}
        </td>
      </tr>
       </tbody>
    </v-table>
  </div>
</template>

<style scoped>

th, td {
  font-size: 14px;
}

.commentLabel {
  background-color: #606060;
  color: white;
  padding: 3px;
  font-size: 14px;
}

.appPoints {
  width: 4em;
  border: 1px solid #aaaaaa;
  border-radius: 5px;
  padding: 3px;
}

.col-left {
  width: 70%;
}

.col-mid {
  width: 15%;
}

.col-right {
  width: 15%;
}

.info {
  padding: 10px;
  color: #555555;
}

.red {
  color: red;
}


</style>
