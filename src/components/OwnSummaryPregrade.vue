<script setup>
import {stores} from "@/store";
import {ref} from "vue";
import PdfAnnotator from '@/lib/PdfAnnotator';
import AuthorizationInfos from '@/components/AuthorizationInfos.vue';

const apiStore = stores.api();
const itemsStore = stores.items();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const essayStore = stores.essay();

const annotator = new PdfAnnotator();

const pregraded = ref(false);

const showSet = ref(false);
const showUnset = ref(false);

pregraded.value = summariesStore.isOwnPregraded;


async function set() {
  if (!summariesStore.isOwnAuthorized  && await apiStore.saveChangesToBackend(true)) {
    if (essayStore.hasPdf && settingsStore.markingInPdf) {
      const item = stores.items().currentItem;
      const own = await essayStore.buildMarkedPdf('own');
      const all = await essayStore.buildMarkedPdf('all');

      if (await apiStore.sendMarkedPdf(own, 'own', item.task_id, item.writer_id)
          && await apiStore.sendMarkedPdf(all, 'all', item.task_id, item.writer_id)
      ) {
        await summariesStore.setOwnPregraded();
      }
    } else {
      await summariesStore.setOwnPregraded();
    }

    if (await apiStore.saveChangesToBackend(true)) {
      await apiStore.loadItemFromStorage(itemsStore.currentKey);
      await itemsStore.setCurrentGradingStatus(summariesStore.editSummary.status);
    }
  }

  pregraded.value = summariesStore.isOwnPregraded;
  showSet.value = false;
}

async function unset() {
  if (!summariesStore.isOwnAuthorized) {
    await summariesStore.setOwnOpen();
  }

  if (await apiStore.saveChangesToBackend(true)) {
    await apiStore.loadItemFromStorage(itemsStore.currentKey);
    await itemsStore.setCurrentGradingStatus(summariesStore.editSummary.status);
  }

  pregraded.value = summariesStore.isOwnPregraded;
  showUnset.value = false;
}

</script>

<template>
  <span id="app-own-summary-pregrade-wrapper">
    <span v-if="!pregraded">
      <v-icon icon="mdi-star-outline"></v-icon>
      {{ $t('ownSummaryNotPregraded')}}
      <v-btn
          flat
          class="headline-button"
          size="small"
          :disabled="summariesStore.isOwnAuthorized || !summariesStore.isOwnValidForAuthorization"
          @click="showSet = true">
        {{ $t('allSet') }}...
      </v-btn>
    </span>

    <span v-if="pregraded">
      <v-icon icon="mdi-star"></v-icon>
      {{ $t('ownSummaryPregraded')}}
      <v-btn
          flat
          class="headline-button"
          size="small"
          :disabled="summariesStore.isOwnAuthorized"
          @click="showUnset = true">
        {{ $t('allUnset') }}...
      </v-btn>
    </span>

    <v-dialog max-width="60em" persistent v-model="showSet">
      <v-card class="pa-4">
        <v-card-title>{{ $t('ownSummaryPregradedSet') }}</v-card-title>
        <v-card-text>
          <authorization-infos></authorization-infos>
          <div v-if="summariesStore.isOwnValidForAuthorization" class="appRow">
            {{ $t('ownSummaryPregradedSetInfo') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
              :disabled="!summariesStore.isOwnValidForAuthorization"
              @click="set()">
            <v-icon left icon="mdi-star"></v-icon>
            {{ $t('ownSummaryPregradedSet') }}
          </v-btn>
          <v-btn @click="showSet = false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog max-width="60em" persistent v-model="showUnset">
      <v-card class="pa-4">
        <v-card-title>{{ $t('ownSummaryPregradedUnset') }}</v-card-title>
        <v-card-text>
          {{ $t('ownSummaryPregradedUnsetInfo') }}
        </v-card-text>
        <v-card-actions>
          <v-btn @click="unset()">
            <v-icon left icon="mdi-star-off"></v-icon>
            {{ $t('ownSummaryPregradedUnset') }}
          </v-btn>
          <v-btn @click="showUnset = false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </span>
</template>

<style scoped>

.headline-button {
  margin-left: 5px;
  margin-right: 5px;
}

</style>
