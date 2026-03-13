<script setup>
import {stores} from "@/store";
import SumOfPoints from "@/components/SumOfPoints.vue";
import Authorization from "@/components/Authorization.vue";
import Summary from "@/data/Summary";
import {ref, watch} from "vue";
import i18n from "@/plugins/i18n";

const { t } = i18n.global;
const summariesStore = stores.summaries();
const settingsStore = stores.settings();

const points = ref(null);
const message = ref('');
const messageClass = ref('');
const corridor = summariesStore.pointsCorridor;

watch(points, () => {
  summariesStore.updatePoints(points.value);
  message.value = summariesStore.currentGradeStatement;
});

points.value = summariesStore.editSummary.points;
message.value = summariesStore.currentGradeStatement;

function check(value) {
  if (value < corridor.min) {
    summariesStore.updatePoints(null);
    message.value = t('summariesPointsOutsideMinMax', [corridor.min, corridor.max]);
    messageClass.value = 'alert';
    return false;
  }
  if (value > corridor.max) {
    summariesStore.updatePoints(null);
    message.value = t('summariesPointsOutsideMinMax', [corridor.min, corridor.max]);
    messageClass.value = 'alert';
    return false;
  }

  messageClass.value = '';
  return true;
}

</script>

<template>
  <div id="app-own-summary-points-wrapper">
    <v-container class="ma-0 pa-1">
      <v-row v-if="settingsStore.Task.enable_partial_points" dense class="ma-0 pa-0 align-end">
        <v-col cols="12" class="ma-0 pa-0">
            <sum-of-points class='sumOfPoints' :correction_key="stores.corrections().ownKey"></sum-of-points>
        </v-col>
      </v-row>
      <v-row dense class="ma-0 pa-0">
        <v-col cols="10" class="ma-0 pa-0">
          <p>
            <label class="middle" for="appOwnSummaryPoints"><strong>{{ $t('ownSummaryPointsRating') }}</strong></label>
            &nbsp;
            <v-number-input
                id="appOwnSummaryPoints"
                class="appPoints middle"
                variant="outlined"
                density="compact"
                width="10em"
                hide-details
                :disabled="summariesStore.isOwnDisabled"
                :rules="[check]"
                v-model="points"
            ></v-number-input> {{ points }}
            &nbsp;
            <span class="middle"><strong>{{ $t('allGrade') }}</strong> {{ summariesStore.currentGradeTitle }}</span>
          </p>

          <p :class="messageClass">{{ message }}</p>
        </v-col>
        <v-col cols="2" class="ma-0 pa-0">
          <authorization v-show="!summariesStore.isOwnAuthorized"></authorization>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>

.middle {
  display:inline-block;
  vertical-align: middle;
  margin-top: 5px;
  margin-bottom: 5px;
}

.appPoints {
  zoom: 80%;
}

.alert {
  color:red;
}

</style>
