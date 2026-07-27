<script setup>

import {stores} from "@/store";
import AuthorizationInfos from '@/components/AuthorizationInfos.vue';
import { ref } from 'vue';
import i18n from "@/plugins/i18n";

const apiStore = stores.api();
const essayStore = stores.essay();
const itemsStore = stores.items();
const settingsStore = stores.settings();
const summariesStore = stores.summaries();
const { t } = i18n.global;

const showConfirmation = ref(false);

async function setAuthorizedAndContinue() {

  if (!summariesStore.isOwnAuthorized && await apiStore.saveChangesToBackend(true)) {
    if (essayStore.hasPdf && settingsStore.markingInPdf) {
      const item = stores.items().currentItem;
      const own = await essayStore.buildMarkedPdf('own');
      const all = await essayStore.buildMarkedPdf('all');

      if (await apiStore.sendMarkedPdf(own, 'own', item.task_id, item.writer_id)
          && await apiStore.sendMarkedPdf(all, 'all', item.task_id, item.writer_id)
      ) {
        await summariesStore.setOwnAuthorized();
      }
    } else {
      await summariesStore.setOwnAuthorized();
    }
  }

  if (await apiStore.saveChangesToBackend(true)) {
    showConfirmation.value = false;
    apiStore.loadItemFromBackend(itemsStore.currentKey);
  } else {
    showConfirmation.value = false;
    stores.layout().showSendFailure = true;
  }
}

</script>

<template>
  <div id="app-authorization-wrapper">

    <v-btn class="app-header-item"
           :disabled="apiStore.isLoading || !itemsStore.canAuthorize || !summariesStore.isOwnValidForAuthorization"
           @click="showConfirmation = true">
      <v-icon left icon="mdi-file-certificate-outline"></v-icon>
      <span>{{ $t('authorizationAuthorize') }}...</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="showConfirmation">
      <v-card>
        <v-card-title>{{ $t('authorizationTitle') }}</v-card-title>
        <v-card-text>
          <authorization-infos></authorization-infos>
          <div v-if="summariesStore.isOwnValidForAuthorization" class="appRow">
            {{ $t('authorizationWarnFinalize') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
                :disabled="!summariesStore.isOwnValidForAuthorization"
                 @click="setAuthorizedAndContinue()">
            <v-icon left icon="mdi-check"></v-icon>
            <span>{{ $t('authorizationAuthorize') }}</span>
          </v-btn>
          <v-btn @click="showConfirmation = false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>

</style>
