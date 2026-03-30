<script setup>
import { nextTick, reactive, ref, watch } from 'vue';
import {stores} from "@/store";
import i18n from "@/plugins/i18n";

const { t } = i18n.global;
const apiStore = stores.api();
const criteriaStore = stores.criteria();
const commentsStore = stores.comments();
const pointsStore = stores.points();
const layoutStore = stores.layout();
const settingsStore = stores.settings();
const preferencesStore = stores.preferences();

const props = defineProps(['correction_key']);
watch(() => props, loadCriteria);
watch(() => apiStore.itemKey, loadCriteria);

const generalCriteriaPoints = reactive({});
const commentCriteriaPoints = reactive({});


async function loadCriteria() {
  await nextTick();

  // general points for comments
  commentCriteriaPoints[''] = {
    key: '',
    title: t('markingCommentPointsWithoutCriterion'),
    max_points: settingsStore.Assessment.max_points,
    sum_points: 0
  }

  // criteria points for comment
  criteriaStore.getCorrectionCommentCriteria(props.correction_key).forEach(criterion => {
    commentCriteriaPoints[criterion.key] = {
      key: criterion.key,
      title: criterion.title,
      max_points: criterion.points,
      sum_points: 0
    }
  });

  // general criteria points
  criteriaStore.getCorrectionGeneralCriteria(props.correction_key).forEach(criterion => {
    generalCriteriaPoints[criterion.key] = {
      key: criterion.key,
      title: criterion.title,
      max_points: criterion.points,
      sum_points: 0
    }
  });

  pointsStore.getObjectsForCorrection(props['correction_key']).forEach(points => {
    const key = points.criterion_key;

    if (commentCriteriaPoints[key] !== undefined) {
      commentCriteriaPoints[key].sum_points += points.points;
    }
    if (generalCriteriaPoints[key] !== undefined) {
      generalCriteriaPoints[key].sum_points += points.points;
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
    <v-table v-if="settingsStore.Task.enable_comment_ratings" class="table" density="compact">
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


    <!-- Points for criteria in comments -->
    <v-table v-if="settingsStore.Task.enable_partial_points" class="table" density="compact">
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
        <td class="text-right">{{ preferencesStore.formatNumber(criterion.sum_points) }} / {{ preferencesStore.formatNumber(criterion.max_points) }}</td>
      </tr>
      </tbody>
    </v-table>

    <!-- Points for general criteria -->
    <v-table v-if="settingsStore.Task.enable_partial_points && criteriaStore.getCorrectionHasGeneralCriteria(props.correction_key)" class="table" density="compact">
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
        <td class="text-right">{{ preferencesStore.formatNumber(criterion.sum_points) }} / {{ preferencesStore.formatNumber(criterion.max_points) }}</td>
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
