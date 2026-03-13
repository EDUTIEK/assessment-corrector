<script setup>
import {stores} from "@/store";
import SumOfPoints from "@/components/SumOfPoints.vue";
import Authorization from "@/components/Authorization.vue";
import Summary from "@/data/Summary";
import {ref} from "vue";

const apiStore = stores.api();
const itemsStore = stores.items();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const layoutStore = stores.layout();

</script>

<template>
  <div id="app-own-summary-points-wrapper">
    <v-container class="ma-0 pa-1">
      <v-row dense class="ma-0 pa-0 align-end">
        <v-col cols="10" class="ma-0 pa-0">
          <p v-if="settingsStore.Task.enable_partial_points">
            <sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points>
          </p>

          <label for="appOwnSummaryPoints"><strong>{{ $t('ownSummaryPointsRating') }}</strong></label>
          &nbsp;
          <input id="appOwnSummaryPoints"  type="number" :disabled="summariesStore.isOwnDisabled" class="appPoints"
                 :min="summariesStore.pointsCorridor.min"
                 :max="summariesStore.pointsCorridor.max"
                 v-model="summariesStore.editSummary.points"/> {{ $t('allPoints', summariesStore.editSummary.points) }}
          &nbsp;
          <strong>{{ $t('allGrade') }}</strong> {{ summariesStore.currentGradeTitle }}

          <p>{{ summariesStore.currentGradeStatement }}</p>
        </v-col>
        <v-col cols="2" class="ma-0 pa-0">
          <authorization v-show="!summariesStore.isOwnAuthorized"></authorization>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>

.appPoints {
  width: 4em;
  border: 1px solid #aaaaaa;
  border-radius: 5px;
  padding: 3px;
}

</style>
