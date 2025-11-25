<script setup>
import { nextTick, reactive, ref, watch } from 'vue';
import {stores} from "@/store";

const apiStore = stores.api();
const criteriaStore = stores.criteria();
const commentsStore = stores.comments();
const pointsStore = stores.points();
const layoutStore = stores.layout();
const settingsStore = stores.settings();

const props = defineProps(['correction_key']);
watch(() => props, loadCriteria);
watch(() => apiStore.itemKey, loadCriteria);

const generalCriteriaPoints = reactive({});
const commentCriteriaPoints = reactive({});


async function loadCriteria() {
  await nextTick();

  criteriaStore.getCorrectionCommentCriteria(props.correction_key).forEach(criterion => {
    commentCriteriaPoints[criterion.key] = {
      key: criterion.key,
      title: criterion.title,
      max_points: criterion.points,
      sum_points: 0
    }
  });

  criteriaStore.getCorrectionGeneralCriteria(props.correction_key).forEach(criterion => {
    generalCriteriaPoints[criterion.key] = {
      key: criterion.key,
      title: criterion.title,
      max_points: criterion.points,
      sum_points: 0
    }
  });

  pointsStore.getObjectsForCorrection(props['correction_key']).forEach(points => {
    if (commentCriteriaPoints[points.criterion_key] !== undefined) {
      commentCriteriaPoints[points.criterion_key].sum_points += points.points;
    }
    if (generalCriteriaPoints[points.criterion_key] !== undefined) {
      generalCriteriaPoints[points.criterion_key].sum_points += points.points;
    }
  });
}

if (criteriaStore.getCorrectionHasCriteria(props.correction_key)) {
  loadCriteria();
}

async function filterByRating(rating_excellent, rating_cardinal) {
  commentsStore.setFilterByRating(props.correction_key, rating_excellent, rating_cardinal);
  if (!props.correction_key == stores.corrections().ownKey) {
    commentsStore.setShowOtherCorrections(true);
  }
  await nextTick();
  layoutStore.showEssay();
  layoutStore.showMarking();
}

async function filterByPoints() {
  commentsStore.setFilterByPoints(props.correction_key);
  if (!props.correction_key == stores.corrections().ownKey) {
    commentsStore.setShowOtherCorrections(true);
  }
  await nextTick();
  layoutStore.showEssay();
  layoutStore.showMarking();
}

async function filterByCriterion(criterion_key) {
  commentsStore.setFilterByCriterion(props.correction_key, criterion_key);
  if (!props.correction_key == stores.corrections().ownKey) {
    commentsStore.setShowOtherCorrections(true);
  }
  await nextTick();
  layoutStore.showEssay();
  layoutStore.showMarking();
}


</script>

<template>
  <div>
    <v-table class="table" density="compact">
      <thead>
      <tr>
        <th>{{ $t('summaryCriteriaMarkings') }}</th>
        <th class="text-right">{{ $t('summaryCriteriaNumber') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="commentsStore.getCountOfExcellent(props.correction_key) == 0"
                 @click="filterByRating(true, false)">
            <span class="sr-only">{{ settingsStore.Task.positive_rating }}</span>
          </v-btn>
          <span aria-hidden="true">{{ settingsStore.Task.positive_rating }}</span>

        </td>
        <td class="text-right">
          {{ commentsStore.getCountOfExcellent(props.correction_key) }}
        </td>
      </tr>
      <tr>
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="commentsStore.getCountOfCardinal(props.correction_key) == 0"
                 @click="filterByRating(false, true)">
            <span class="sr-only">{{ settingsStore.Task.negative_rating }}</span>
          </v-btn>
          <span aria-hidden="true">{{ settingsStore.Task.negative_rating }}</span>
        </td>
        <td class="text-right">
          {{ commentsStore.getCountOfCardinal(props.correction_key) }}
        </td>
      </tr>
      </tbody>
    </v-table>

    <!-- Points for comments directly -->
    <v-table v-if="!criteriaStore.getCorrectionHasCommentCriteria(props.correction_key)" class="table" density="compact">
      <thead>
      <tr>
        <th><strong>{{ $t('summaryCriteriaRating') }}</strong></th>
        <th class="text-right">{{ $t('allPoints') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="pointsStore.getSumOfPointsForCorrection(props.correction_key, true, false) == 0"
                 @click="filterByPoints()">
            <span class="sr-only">{{ $t('summaryCriteriaPointsInComments') }}</span>
          </v-btn>
          <span aria-hidden="true">{{ $t('summaryCriteriaPointsInComments') }}</span>
        </td>
        <td class="text-right">
          {{ pointsStore.getSumOfPointsForCorrection(props.correction_key, true, false) }}
        </td>
      </tr>
      </tbody>
    </v-table>

    <!-- Points for criteria in comments -->
    <v-table v-if="criteriaStore.getCorrectionHasCommentCriteria(props.correction_key)" class="table" density="compact">
      <thead>
      <tr>
        <th>{{ $t('summaryCriteriaInComments') }}</th>
        <th class="text-right">{{ $t('summaryCriteriaPointsOfMax') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in commentCriteriaPoints" :key="criterion.key">
        <td>
          <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-filter-outline"
                 :disabled="criterion.sum_points == 0"
                 @click="filterByCriterion(criterion.key)">
            <span class="sr-only">{{ criterion.title }}</span>
          </v-btn>
          <span aria-hidden="true">{{ criterion.title }}</span>
        </td>
        <td class="text-right">{{ criterion.sum_points }} / {{ criterion.max_points }}</td>
      </tr>
      </tbody>
    </v-table>

    <!-- Points for general criteria -->
    <v-table v-if="criteriaStore.getCorrectionHasGeneralCriteria(props.correction_key)" class="table" density="compact">
      <thead>
      <tr>
        <th>{{ $t('summaryCriteriaGeneralCriteria') }}</th>
        <th class="text-right">{{ $t('summaryCriteriaPointsOfMax') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="criterion in generalCriteriaPoints" :key="criterion.key">
        <td>
          <span class="generalCriterion">{{ criterion.title }}</span>
        </td>
        <td class="text-right">{{ criterion.sum_points }} / {{ criterion.max_points }}</td>
      </tr>
      </tbody>
    </v-table>

  </div>
</template>

<style scoped>

.table {
  margin-bottom: 10px;
}

.label {
  display: inline-block;
}

td {
  font-size: 14px;
}

.generalCriterion {
  margin-left: 50px;
}
</style>
