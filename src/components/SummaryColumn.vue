<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import SummaryText from "@/components/SummaryText.vue";
import SummaryFile from "@/components/SummaryFile.vue";
import SummaryPoints from "@/components/SummaryPoints.vue";
import SummaryRevision from "@/components/SummaryRevision.vue";
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue"
import OwnSummaryTemplate from "@/components/OwnSummaryTemplate.vue";
import OwnSummaryUpload from "@/components/OwnSummaryUpload.vue";
import OwnSummaryRevision from "@/components/OwnSummaryRevision.vue";
import {stores} from "@/store";
import {watch} from "vue";
import Item from '@/data/Item';
import OwnSummaryPregrade from "@/components/OwnSummaryPregrade.vue";

const props = defineProps(['correction_key', 'showCriteria', 'showText', 'showRevision']);

let correction;
let position_text;
let is_own;
let can_correct;
let can_revise;
let summary;
let is_authorized;
let is_revised;
let show_criteria;
let show_text;
let show_revision;

function init() {
  correction = stores.corrections().getCorrection(props.correction_key);
  position_text = Item.buildPositionText(correction?.position);

  is_own = props.correction_key == stores.corrections().ownKey;
  can_correct = is_own && stores.items().canCorrect;
  can_revise = is_own && stores.items().canRevise;
  summary = is_own ? stores.summaries().editSummary : stores.summaries().getForCorrection(props.correction_key);
  is_authorized = summary.isAuthorized();
  is_revised = summary.isRevised();

  show_criteria = props.showCriteria && (stores.settings().Task.enable_comment_ratings || stores.settings().Task.enable_partial_points);
  show_text = props.showText && (is_own || is_authorized);
  show_revision = props.showRevision && (is_own  && can_revise || is_revised);
}
watch(() => props.correction_key, init);
watch(() => props.showCriteria, init);
watch(() => props.showText, init);
watch(() => props.showRevision, init);
init();

function expansionClass() {
  const sum = (show_criteria ? 1 : 0)
      + (show_text ? 1 : 0)
      + (show_revision ? 1 : 0);
  switch (sum) {
    case 0:
      return 'hidden';
    case 1:
      return 'full';
    case 2:
      return 'half';
    case 3:
      return 'third';
  }
}

</script>

<template>
  <div id="app-summary-wrapper">

    <div v-if="show_criteria" :class="expansionClass()">
      <h2 class="headline">{{ $t('summaryOverview') }} {{ position_text }}</h2>
      <summary-criteria class="content" :correction_key="props.correction_key"></summary-criteria>
    </div>

    <div v-if="show_text && is_own && !stores.summaries().isOwnDisabled" :class="expansionClass()">
      <v-container class="ma-0 pa-0">
        <v-row class="section-header ma-0">
          <v-col cols="6" class="ma-0 pa-0">
            <h2 class="headline">{{ $t('allSummary') }} {{ position_text }}</h2>
          </v-col>
          <v-col cols="6" class="ma-0 pa-0 text-right">
            <div class="header-buttons">
              <own-summary-template v-if="!summary.pdf"></own-summary-template>
              <own-summary-upload></own-summary-upload>
            </div>
          </v-col>
        </v-row>
      </v-container>
      <own-summary-text v-show="!summary.pdf" class="content-noscroll" :editorId="'summary'"></own-summary-text>
      <summary-file v-if="summary.pdf" class="content-noscroll" :correction_key="props.correction_key"></summary-file>
    </div>
    <div v-if="show_text && (!is_own || stores.summaries().isOwnDisabled)" :class="expansionClass()">
      <h2 class="headline">{{ $t('allSummary') }} {{ position_text }}</h2>
      <summary-text v-if="!summary.pdf" class="content" :correction_key="props.correction_key"></summary-text>
      <summary-file v-if="summary.pdf" class="content-noscroll" :correction_key="props.correction_key"></summary-file>
    </div>

    <div id="app-own-summary-points" v-if="can_correct">
      <v-container class="ma-0 pa-0">
        <v-row class="section-header ma-0">
          <v-col cols="6" class="ma-0 pa-0">
            <h2 class="headline">{{ $t('allTotalRating') }} {{ position_text }}</h2>
          </v-col>
          <v-col cols="6" class="ma-0 pa-0 text-right">
            <div class="header-buttons">
              <own-summary-pregrade></own-summary-pregrade>
            </div>
          </v-col>
        </v-row>
      </v-container>
      <own-summary-points class="content" ></own-summary-points>
    </div>

    <div id="app-summary-points" v-if="!can_correct && is_authorized" >
      <h2 class="headline">{{ $t('allTotalRating') }} {{ position_text }}</h2>
      <summary-points class="content" :correction_key="props.correction_key"></summary-points>
    </div>

    <div v-if="show_revision && can_revise" :class="expansionClass()">
      <h2 class="headline">{{ stores.settings().procedureText }} {{ position_text }}</h2>
      <own-summary-revision class="content-noscroll" :editorId="'revision'"></own-summary-revision>
    </div>
    <div v-if="show_revision && !can_revise && is_revised" :class="expansionClass()">
      <h2 class="headline">{{ stores.settings().procedureText }} {{ position_text }}</h2>
      <summary-revision class="content-noscroll" :correction_key="props.correction_key"></summary-revision>
    </div>

    <div v-if="!can_correct && !is_authorized" >
      {{ $t('otherSummaryNotAuthorized') }}
    </div>

  </div>
</template>

<style scoped>

#app-summary-wrapper {
  height: 100%;
}

#app-own-summary-points {
  height: 160px;
}

#app-summary-points {
  height: 160px;
}

.section-header {
  background-color: #f0f0f0;
}

.headline {
  font-size: 1rem;
  font-weight: normal;
  height: 40px;
  padding-top: 10px;
  padding-left: 10px;
  background-color: #f0f0f0;
}

.header-buttons {
  padding-top: 5px;
}

.content {
  height: calc(100% - 40px);
  overflow-y: scroll;
}

.content-noscroll {
  height: calc(100% - 40px);
  overflow-y: hidden;
}

.hidden {
  display: none;
}

.full {
  height: calc(100% - 160px);
}

.half {
  height: calc((100% - 160px) / 2);
}

.third {
  height: calc((100% - 160px) / 3);
}

</style>
