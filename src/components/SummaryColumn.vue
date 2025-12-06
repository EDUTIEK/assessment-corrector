<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import SummaryText from "@/components/SummaryText.vue";
import SummaryPoints from "@/components/SummaryPoints.vue";
import SummaryRevision from "@/components/SummaryRevision.vue";
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue"
import OwnSummaryFile from "@/components/OwnSummaryFile.vue";
import OwnSummaryRevision from "@/components/OwnSummaryRevision.vue";
import {stores} from "@/store";
import {watch} from "vue";

const props = defineProps(['correction_key', 'showCriteria', 'showText', 'showRevision']);

let is_own;
let can_correct;
let can_revise;
let summary;
let is_authorized;
let is_revised;

function init() {
  is_own = props.correction_key == stores.corrections().ownKey;
  can_correct = is_own && stores.items().canCorrect;
  can_revise = is_own && stores.items().canRevise;
  summary = is_own ? stores.summaries().editSummary : stores.summaries().getForCorrection(props.correction_key);
  is_authorized = summary.isAuthorized();
  is_revised = summary.isRevised();
}
watch(() => props.correction_key, init);
init();

function expansionClass() {
  const sum = (props.showCriteria ? 1 : 0)
      + (props.showText && (is_own || is_authorized) ? 1 : 0)
      + (props.showRevision && (is_own  && can_revise || is_revised) ? 1 : 0);
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

    <div v-if="props.showCriteria && (can_correct || is_authorized)" :class="expansionClass()">
      <h2 class="headline">{{ $t('allOverview') }}</h2>
      <summary-criteria class="content" :correction_key="props.correction_key"></summary-criteria>
    </div>

    <div v-if="props.showText && can_correct" :class="expansionClass()">
      <h2 class="headline">{{ $t('allSummary') }}</h2>
      <own-summary-text v-if="!summary.pdf" class="content" :editorId="'summary'"></own-summary-text>
      <own-summary-file v-if="summary.pdf" ></own-summary-file>
    </div>
    <div v-if="props.showText && !can_correct && is_authorized" :class="expansionClass()">
      <h2 class="headline">{{ $t('allSummary') }}</h2>
      <summary-text class="content" :correction_key="props.correction_key"></summary-text>
    </div>

    <div id="app-own-summary-points" v-if="can_correct">
      <h2 class="headline">{{ $t('allTotalRating') }}</h2>
      <own-summary-points class="content" ></own-summary-points>
    </div>
    <div id="app-summary-points" v-if="!can_correct && is_authorized" >
      <h2 class="headline">{{ $t('allTotalRating') }}</h2>
      <summary-points class="content" :correction_key="props.correction_key"></summary-points>
    </div>

    <div v-if="props.showRevision && can_revise" :class="expansionClass()">
      <h2 class="headline">{{ stores.settings().procedureText }}</h2>
      <own-summary-revision class="content" :editorId="'revision'"></own-summary-revision>
    </div>
    <div v-if="props.showRevision && !can_revise && is_revised" :class="expansionClass()">
      <h2 class="headline">{{ stores.settings().procedureText }}</h2>
      <summary-revision class="content" :correction_key="props.correction_key"></summary-revision>
    </div>

    <div v-if="!can_correct && !is_authorized">
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
  padding-top: 10px;
}

#app-summary-points {
  height: 120px;
}

.headline {
  font-size: 1rem;
  font-weight: normal;
  height: 40px;
  padding-top: 10px;
  padding-left: 10px;
  background-color: #f0f0f0;
}

.content {
  height: calc(100% - 40px);
  overflow-y: scroll;
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
