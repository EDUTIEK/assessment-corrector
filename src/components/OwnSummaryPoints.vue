<script setup>
import {stores} from "@/store";
import OwnSummaryIncludes from '@/components/OwnSummaryIncludes.vue';
import SumOfPoints from "@/components/SumOfPoints.vue";

const apiStore = stores.api();
const itemsStore = stores.items();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const layoutStore = stores.layout();

</script>

<template>
  <div id="app-own-summary-points-wrapper">
    <v-container>
      <v-row dense>
        <v-col cols="10">
          <sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="10">
          <label for="appOwnSummaryPoints"><strong>{{ $t('OwnSummaryPointsRating') }}</strong></label>
          &nbsp;
          <input :disabled="summariesStore.isOwnDisabled" id="appOwnSummaryPoints" class="appPoints" type="number" min="0"
                 :max="settingsStore.Assessment.max_points" v-model="summariesStore.editSummary.points"/> {{ $t('allPoints', summariesStore.editSummary.points) }}
          &nbsp;
          <strong>{{ $t('OwnSummaryPointsGrade') }}</strong> {{ summariesStore.currentGradeTitle }}

          <p><strong>{{ $t('summaryPointsInclude') }}</strong> {{ settingsStore.inclusionText }}</p>
        </v-col>
        <v-col cols="2">
          <v-btn density="compact" variant="text" v-show="!summariesStore.isOwnDisabled" :disabled="!itemsStore.canAuthorize"
                 @click="stores.layout().showAuthorization = true;">
            <v-icon left icon="mdi-file-certificate-outline"></v-icon>
            <span>{{ $t('allAuthorize') }}</span>
          </v-btn>
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
