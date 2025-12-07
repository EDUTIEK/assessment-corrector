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

const pregraded = ref(false);
pregraded.value = summariesStore.isOwnPregraded;

async function togglePregraded(event) {
  event.preventDefault();

  if (summariesStore.isOwnPregraded) {
    await summariesStore.setOwnOpen();
  }
  else if (!summariesStore.isOwnAuthorized) {
    await summariesStore.setOwnPregraded();
  }

  await itemsStore.setCurrentGradingStatus(summariesStore.editSummary.status);
  pregraded.value = summariesStore.isOwnPregraded;
}

</script>

<template>
  <div id="app-own-summary-points-wrapper">
    <v-container>
      <v-row dense>
        <v-col cols="10">
          <p><sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points></p>

          <label for="appOwnSummaryPoints"><strong>{{ $t('ownSummaryPointsRating') }}</strong></label>
          &nbsp;
          <input id="appOwnSummaryPoints"  type="number" :disabled="summariesStore.isOwnDisabled"class="appPoints"
                 :min="summariesStore.pointsCorridor.min"
                 :max="summariesStore.pointsCorridor.max"
                 v-model="summariesStore.editSummary.points"/> {{ $t('allPoints', summariesStore.editSummary.points) }}
          &nbsp;
          <strong>{{ $t('allGrade') }}</strong> {{ summariesStore.currentGradeTitle }}

          <p>{{ summariesStore.currentGradeStatement }}</p>
        </v-col>
        <v-col cols="2">

          <input id="appOwnSummaryPregraded" type="checkbox" class="appCheckbox"
              v-if="!summariesStore.isOwnAuthorized"
              v-model="pregraded"
              :disabled="summariesStore.isOwnAuthorized"
              @change="togglePregraded"
          ></input>
          <label for="appOwnSummaryPregraded">{{ $t('allPregraded') }}</label>
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

.appCheckbox {
  margin: 0 5px 15px 0;
  padding: 0;
}

</style>
