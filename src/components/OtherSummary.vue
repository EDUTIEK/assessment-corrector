<script setup>
import {stores} from "@/store";
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import SummaryPoints from "@/components/SummaryPoints.vue";
import SummaryText from "@/components/SummaryText.vue";

const props = defineProps(['correction_key', 'showCriteria', 'showText']);
const summariesStore = stores.summaries();

function expansionClass() {
  const sum = (props.showCriteria ? 1 : 0) + (props.showText ? 1 : 0);
  switch (sum) {
    case 0:
      return 'hidden';
    case 1:
      return 'full';
    case 2:
      return 'half';
  }
}
</script>

<template>
  <div id="app-other-summary-wrapper">

    <div v-if="props.showCriteria && summariesStore.getAuthorizationForCorrection(props.correction_key)"
         :class="expansionClass()">
      <div class="headline">{{ $t('allOverview') }}</div>
      <summary-criteria class="content" :correction_key="props.correction_key"></summary-criteria>
    </div>
    <div v-if="props.showText && summariesStore.getAuthorizationForCorrection(props.correction_key)"
         :class="expansionClass()">
      <div class="headline">{{ $t('allSummary') }}</div>
      <summary-text class="content" :correction_key="props.correction_key"></summary-text>
    </div>
    <div v-if="summariesStore.getAuthorizationForCorrection(props.correction_key)">
      <div class="headline">{{ $t('allTotalRating') }}</div>
      <summary-points class="content" :correction_key="props.correction_key"></summary-points>
    </div>

    <div v-if="!summariesStore.getAuthorizationForCorrection(props.correction_key)">
      {{ $t('otherSummaryNotAuthorized') }}
    </div>
  </div>
</template>

<style scoped>

#app-other-summary-wrapper {
  height: 100%;
}

#app-summary-points {
  min-height: 160px;
}

.headline {
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

</style>
