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
const { t } = i18n.global

const showIncludes = ref(false);


function getPartialPointsMessage() {
  let points = 0;
  let note = '';

  if (settingsStore.Task.enable_partial_points) {
    points = pointsStore.getSumOfPointsForCorrection(stores.corrections().ownKey);
    note = t('authorizationPartialPoints', points);
  }
  else {
    return '';
  }

  if (points != summariesStore.editSummary.points) {
    return t('authorizationPointsMismatch', [note])
  }

  return '';
}

async function setAuthorizedAndContinue() {

  await summariesStore.setOwnAuthorized();
  if (await apiStore.saveChangesToBackend(true)) {
    stores.layout().showAuthorization = false;
    let newKey = itemsStore.nextKey;
    if (newKey != '') {
      apiStore.loadItemFromBackend(newKey);
    }
  } else {
    stores.layout().showAuthorization = false;
    stores.layout().showSendFailure = true;
  }
}

async function setAuthorizedAndClose() {

  await summariesStore.setOwnAuthorized();
  if (await apiStore.saveChangesToBackend(true)) {
    stores.layout().showAuthorization = false;
    window.location = apiStore.returnUrl;
  } else {
    stores.layout().showAuthorization = false;
    stores.layout().showSendFailure = true;
    return;
  }
}

function editSummary() {
  stores.layout().showAuthorization = false;
  layoutStore.showOwnSummaryText();
}

</script>

<template>
  <div id="app-authorization-wrapper">

    <v-btn class="app-header-item" v-show="!summariesStore.isOwnDisabled" :disabled="apiStore.isLoading || !itemsStore.canAuthorize"
           @click="stores.layout().showAuthorization = true;">
      <v-icon left icon="mdi-file-certificate-outline"></v-icon>
      <span>{{ $t('authorizationButton') }}</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="stores.layout().showAuthorization">
      <v-card>
        <v-card-title>{{ $t('authorizationTitle', [itemsStore.currentItem.title]) }}</v-card-title>
        <v-card-text>
          <div class="appRow"><strong>{{ $t('authorizationSummaryLabel') }}</strong>
            <v-btn  density="compact" variant="text" @click="editSummary()">
              <v-icon left icon="mdi-pencil"></v-icon>
              <span class="sr-only">{{ $t('authorizationSummaryEdit') }}</span>
            </v-btn>
            <div class="appText long-essay-content headlines-three" v-html="summariesStore.editSummary.text">
            </div>
          </div>

          <div class="appRow">
            <sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points>
          </div>

          <div class="appRow">
            <label for="appAuthorizationPoints"><strong>{{ $t('authorizationPointsLabel') }}</strong></label>
            <input id="appAuthorizationPoints" class="appPoints" type="number" min="0" :max="settingsStore.Assessment.max_points"
                   v-model="summariesStore.editSummary.points"/>{{ $t('authorizationPointsSuffix' ) }}
            &nbsp;
            <strong>{{ $t('authorizationGradeTitle') }}</strong> {{ summariesStore.currentGradeTitle }}

            <p>{{ summariesStore.currentGradeStatement }}</p>

          </div>

          <div class="appRow">
            <v-alert v-show="summariesStore.editSummary.text == ''"
                     color="#0000A0" type="info" variant="text" density="compact">
              {{ $t('authorizationPleaseEnterSummary') }}
            </v-alert>

            <v-alert v-show="(levelsStore.hasLevels && (summariesStore.editSummary.points === null))"
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

          </div>

          <div class="appRow">
            {{ $t('authorizationWarnFinalize') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="setAuthorizedAndContinue()">
            <v-icon left icon="mdi-check"></v-icon>
            <span>{{ $t('authorizationAuthorizeAndContinue') }}</span>
          </v-btn>
          <v-btn @click="setAuthorizedAndClose()">
            <v-icon left icon="mdi-check"></v-icon>
            <span>{{ $t('authorizationAuthorizeAndClose') }}</span>
          </v-btn>
          <v-btn @click="stores.layout().showAuthorization = false;">
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
}


</style>
