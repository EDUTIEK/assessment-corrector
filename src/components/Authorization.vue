<script setup>

import {stores} from "@/store";
import SumOfPoints from "@/components/SumOfPoints.vue";
import { ref } from 'vue';
import Summary from "@/data/Summary";
import i18n from "@/plugins/i18n";

const apiStore = stores.api();
const essayStore = stores.essay();
const itemsStore = stores.items();
const settingsStore = stores.settings();
const summariesStore = stores.summaries();
const levelsStore = stores.levels();
const layoutStore = stores.layout();
const pointsStore = stores.points();
const commentsStore = stores.comments();
const criteriaStore = stores.criteria();
const preferencesStore = stores.preferences();
const { t } = i18n.global;

const showConfirmation = ref(false);

function getPartialPointsMessage() {
  let points = 0;

  if (!settingsStore.Task.enable_partial_points) {
    return '';
  }

  points = pointsStore.getSumOfPointsForCorrection(stores.corrections().ownKey);
  if (points == 0 || points == summariesStore.editSummary.points) {
    return '';
  }

  return t('authorizationPointsMismatch', [preferencesStore.formatNumber(points)]);
}

async function setAuthorizedAndContinue() {

  if (!summariesStore.isOwnAuthorized && await apiStore.saveChangesToBackend(true)) {
    if (essayStore.hasPdf && settingsStore.markingInPdf) {
      const item = stores.items().currentItem;
      const own = await essayStore.buildMarkedPdf('own');
      const all = await essayStore.buildMarkedPdf('all');

      if (await apiStore.sendMarkedPdf(own, 'own', item.task_id, item.writer_id)
          && await apiStore.sendMarkedPdf(all, 'all', item.task_id, item.writer_id)
      ) {
        await summariesStore.setOwnAuthorized();
      }
    } else {
      await summariesStore.setOwnAuthorized();
    }
  }

  if (await apiStore.saveChangesToBackend(true)) {
    showConfirmation.value = false;
    apiStore.loadItemFromBackend(itemsStore.currentKey);
  } else {
    showConfirmation.value = false;
    stores.layout().showSendFailure = true;
  }
}

</script>

<template>
  <div id="app-authorization-wrapper">

    <v-btn class="app-header-item"
           :disabled="apiStore.isLoading || !itemsStore.canAuthorize || !summariesStore.isOwnValidForAuthorization"
           @click="showConfirmation = true">
      <v-icon left icon="mdi-file-certificate-outline"></v-icon>
      <span>{{ $t('authorizationAuthorize') }}...</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="showConfirmation">
      <v-card>
        <v-card-title>{{ $t('authorizationTitle') }}</v-card-title>
        <v-card-text>
          <div class="appRow"
              v-if="settingsStore.Task.enable_partial_points"
              v-show = "pointsStore.getSumOfPointsForCorrection(stores.corrections().ownKey)">
            <sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points>
          </div>

          <div v-if="summariesStore.editSummary.hasPoints()" class="appRow">
            <strong>{{ $t('ownSummaryPointsRating') }}</strong>
            {{ preferencesStore.formatNumber(summariesStore.editSummary.points) }} {{ $t('authorizationPointsSuffix' ) }}
            &nbsp;
            <strong>{{ $t('authorizationGradeTitle') }}</strong> {{ summariesStore.currentGradeTitle }}

            <p>{{ summariesStore.currentGradeStatement }}</p>

          </div>

          <div class="appRow">
            <v-alert v-show="!summariesStore.editSummary.text && !summariesStore.editSummary.pdf"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ $t('authorizationPleaseEnterSummary') }}
            </v-alert>

            <v-alert v-show="(levelsStore.hasLevels && (!summariesStore.editSummary.hasPoints()))"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ $t('authorizationPleaseEnterPoints') }}
            </v-alert>

            <v-alert v-show="getPartialPointsMessage() != ''" color="#0000A0" type="info" variant="text" density="compact">
              {{getPartialPointsMessage()}}
            </v-alert>

            <v-alert v-show="summariesStore.areOthersAuthorized && summariesStore.procedureNeededText != '' "
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ summariesStore.procedureNeededText }}
            </v-alert>

            <v-alert v-show="itemsStore.isInStitch && summariesStore.pointsOutsideCorridorText !== ''"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ summariesStore.pointsOutsideCorridorText }}
            </v-alert>

          </div>

          <div v-if="summariesStore.isOwnValidForAuthorization" class="appRow">
            {{ $t('authorizationWarnFinalize') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
                :disabled="!summariesStore.isOwnValidForAuthorization"
                 @click="setAuthorizedAndContinue()">
            <v-icon left icon="mdi-check"></v-icon>
            <span>{{ $t('authorizationAuthorize') }}</span>
          </v-btn>
          <v-btn @click="showConfirmation = false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>

.appRow {
  margin-bottom: 10px;
}

.appPoints {
  width: 4em;
  border: 1px solid #aaaaaa;
  border-radius: 5px;
  padding: 3px;
  margin-left: 5px;
  margin-right: 5px;
}

.appText {
  height: 12em;
  overflow-y: scroll;
  border: 1px solid lightgray;
  padding: 10px;
}

.appPdf {
  height: 12em;
  width: 100%;
}

</style>
