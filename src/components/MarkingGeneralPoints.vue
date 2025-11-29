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

let correction_key = ref('');
let criteriaPoints = ref({});

async function loadPoints() {
  correction_key.value = stores.corrections().ownKey;
  criteriaPoints.value = {};
  for (const criterion of criteriaStore.getCorrectionGeneralCriteria(correction_key.value)) {
    const pointsObject = pointsStore.getObjectByData( correction_key.value, '', criterion.key);
    criteriaPoints.value[criterion.key] = (pointsObject ? pointsObject.points : 0);
  }
}
loadPoints();


function savePoints(criterionKey) {
  pointsStore.setValueByCommentOrCriterion('', criterionKey, criteriaPoints.value[criterionKey]);
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'markingGeneralPoints') {
    await nextTick();
    document.getElementById('appMarkingGeneralPointsStart').focus();
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
    <v-table density="compact">
      <thead>
      <tr>
        <th class="col-left">
          <span id="appMarkingCommentPointsStart" tabindex="0" @keydown="handleKeyDown">{{ $t('markingGeneralPointsCriterion') }}</span>
        </th>
        <th class="col-mid text-right">
          {{ $t('allPoints', 0) }}
        </th>
        <th class="col-right text-right">
          {{ $t('markingGeneralPointsMax') }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in criteriaStore.getCorrectionGeneralCriteria(correction_key)" :key="criterion.key">
        <td class="col-left">
          <label tabindex="0" @keydown="handleKeyDown" :for="'app-points-input-' + criterion.key">{{ criterion.title }}</label>
        </td>
        <td class="col-mid text-right">
          <input class="appPoints" type="number" v-model="criteriaPoints[criterion.key]"
                 :id="'app-points-input-' + criterion.key"
                 :disabled="summariesStore.isOwnDisabled || correction_key != stores.corrections().ownKey"
                 :max="criterion.points"
                 @change="savePoints(criterion.key)"
                 @keydown="handleKeyDown"
          />
        </td>
        <td class="col-right text-right">
          {{ criterion.points }}
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

</style>
