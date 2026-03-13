<script setup>

import {stores} from "@/store";
import SumOfPoints from "@/components/SumOfPoints.vue";
import { ref } from 'vue';
import Summary from "@/data/Summary";
import i18n from "@/plugins/i18n";

const apiStore = stores.api();
const itemsStore = stores.items();
const settingsStore = stores.settings();
const summariesStore = stores.summaries();
const levelsStore = stores.levels();
const layoutStore = stores.layout();
const pointsStore = stores.points();
const commentsStore = stores.comments();
const criteriaStore = stores.criteria();
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

  return t('authorizationPointsMismatch', [points]);
}

async function setAuthorizedAndContinue() {

  await summariesStore.setOwnAuthorized();
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
        <v-card-title>{{ $t('authorizationTitle', [itemsStore.currentItem.title]) }}</v-card-title>
        <v-card-text>

          <div v-if="summariesStore.editSummary.hasTextOrPdf()"
               class="appRow"><strong>{{ $t('authorizationSummaryLabel') }}</strong>
            <div class="appText xlas-content headlines-three"
                 v-if="summariesStore.editSummary.text" v-html="summariesStore.editSummary.text">
            </div>
            <object class="appPdf" v-if="summariesStore.editSummary.pdf"
                    type="application/pdf"
                    :data="apiStore.getSummaryPdfUrl(summariesStore.editSummary)"
            >
            </object>
          </div>

          <div v-if="settingsStore.Task.enable_partial_points" class="appRow">
            <sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points>
          </div>

          <div v-if="summariesStore.editSummary.hasPoints()" class="appRow">
            <strong>{{ $t('ownSummaryPointsRating') }}</strong>
            {{ summariesStore.editSummary.points }} {{ $t('authorizationPointsSuffix' ) }}
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
