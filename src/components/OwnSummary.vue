<script setup>
import SummaryCriteria from '@/components/SummaryCriteria.vue';
import OwnSummaryPoints from "@/components/OwnSummaryPoints.vue";
import OwnSummaryText from "@/components/OwnSummaryText.vue";
import OwnSummaryRevision from "@/components/OwnSummaryRevision.vue";
import SummaryPoints from "@/components/SummaryPoints.vue";
import {stores} from "@/store";


const apiStore = stores.api();

const props = defineProps(['showCriteria', 'showText', 'showRevision']);

function expansionClass() {
  const sum = (props.showCriteria ? 1 : 0)
      + (props.showText ? 1 : 0)
      + (stores.items().canRevise && props.showRevision ? 1 : 0);
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
  <div id="app-own-summary-wrapper">
    <div v-if="props.showCriteria" :class="expansionClass()">
      <h2 class="headline">{{ $t('allOverview') }}</h2>
      <summary-criteria class="content" :correction_key="stores.corrections().ownKey"></summary-criteria>
    </div>
    <div v-if="props.showText" :class="expansionClass()">
      <h2 class="headline">{{ $t('allSummary') }}</h2>
      <own-summary-text class="content" :editorId="'summary'"></own-summary-text>
    </div>
    <div id="app-own-summary-points" v-if="stores.items().canCorrect">
      <h2 class="headline">{{ $t('allTotalRating') }}</h2>
      <own-summary-points class="content" ></own-summary-points>
    </div>
    <div id="app-summary-points" v-if="!stores.items().canCorrect" >
      <h2 class="headline">{{ $t('allTotalRating') }}</h2>
      <summary-points class="content" :correction_key="stores.corrections().ownKey"></summary-points>
    </div>
    <div v-if="stores.items().canRevise && props.showRevision" :class="expansionClass()">
      <h2 class="headline">{{ $t('allRevision') }}</h2>
      <own-summary-revision class="content" :editorId="'revision'"></own-summary-revision>
    </div>
  </div>
</template>

<style scoped>

#app-own-summary-wrapper {
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
