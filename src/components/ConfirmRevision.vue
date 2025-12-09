<script setup>

import {stores} from "@/store";
import { ref } from 'vue';
import i18n from "@/plugins/i18n";
import Summary from "@/data/Summary";
import Procedure from '@/data/Procedure';
import Correction from '@/data/Correction';

const apiStore = stores.api();
const itemsStore = stores.items();
const settingsStore = stores.settings();
const summariesStore = stores.summaries();
const levelsStore = stores.levels();
const correctionsStore = stores.corrections();
const layoutStore = stores.layout();

const { t } = i18n.global

const showConfirmation = ref(false);

function dialogTitle() {
  switch (settingsStore.Assessment.procedure) {
    case Procedure.APPROXIMATION:
      return t('revisionFixApproximationTitle');
    case Procedure.CONSULTING:
      return t('revisionFixConsultingTitle');
    default:
      return '';
  }
}

function canConfirm() {
  return summariesStore.editSummary.revision_text != ''
    && summariesStore.pointsOutsideCorridorText == ''
    && !Number.isNaN(summariesStore.editSummary.revision_points);
}

function requireOtherRevisionPossible() {
  return settingsStore.Assessment.procedure === Procedure.APPROXIMATION
    && correctionsStore.ownCorrection?.position === Correction.POSITION_FIRST;
}

async function setRevisedAndContinue() {

  await summariesStore.setOwnRevised();
  if (await apiStore.saveChangesToBackend(true)) {
    showConfirmation.value = false;
    apiStore.loadItemFromBackend(itemsStore.currentKey);
  } else {
    showConfirmation.value = false;
    layoutStore.showSendFailure = true;
  }
}

</script>

<template>
  <div id="app-authorization-wrapper">

    <v-btn class="app-header-item" v-if="itemsStore.canRevise" :disabled="apiStore.isLoading"
           @click="showConfirmation = true">
      <v-icon left icon="mdi-file-certificate-outline"></v-icon>
      <span>{{ $t('revisionButton') }}</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="showConfirmation">
      <v-card>
        <v-card-title>{{ dialogTitle() }}</v-card-title>
        <v-card-text>
          <div class="appRow" v-if="summariesStore.editSummary.hasRevisionText()">
            <strong>{{ $t('revisionTextLabel') }}</strong>
            <div class="appText long-essay-content headlines-three" v-html="summariesStore.editSummary.revision_text">
            </div>
          </div>

          <div class="appRow">
            <span v-if="summariesStore.editSummary.hasRevisionPoints()">
              <strong>{{ $t('revisionPointsLabel') }}</strong>
              {{ summariesStore.editSummary.revision_points }}
              {{ $t('allPoints', summariesStore.editSummary.revision_points) }}
              <strong>{{ $t('allGrade') }}</strong> {{ levelsStore.getLevelForPoints(summariesStore.editSummary.revision_points)?.title}}
            </span>
            <p>{{ levelsStore.getLevelForPoints(summariesStore.editSummary.revision_points)?.statement }}</p>
          </div>

          <div class="appRow">
            <v-alert v-show="!summariesStore.editSummary.hasRevisionPoints()"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ $t('revisionPleaseEnterPoints') }}
            </v-alert>
            <v-alert v-show="!summariesStore.editSummary.hasRevisionText()"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ $t('revisionPleaseEnterText') }}
            </v-alert>

            <v-alert v-show="summariesStore.pointsOutsideCorridorText !== ''"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ summariesStore.pointsOutsideCorridorText }}
            </v-alert>

            <v-alert v-show="summariesStore.stitchNeededAfterRevisionText !== ''"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ summariesStore.stitchNeededAfterRevisionText }}
            </v-alert>

            <div class="appRow" v-if="summariesStore.editSummary.hasRevisionText() && summariesStore.editSummary.hasRevisionPoints()">
              <v-checkbox
                  v-if="requireOtherRevisionPossible()"
                  v-model="summariesStore.editSummary.require_other_revision"
                  :label="t('revisionRequireOtherRevision')"
              ></v-checkbox>
            </div>

            <div class="appRow" v-if="canConfirm()">
              {{ $t('revisionWarnFinalize') }}
            </div>

          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
              :disabled = "!canConfirm()"
              @click="setRevisedAndContinue()">
            <v-icon left icon="mdi-check"></v-icon>
            <span>{{ $t('revisionFix') }}</span>
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
  min-height: 3em;
  max-height: 10em;
  padding: 5px;
  overflow-y: scroll;
  border: 1px solid lightgray;
}


</style>
