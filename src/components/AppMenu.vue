<script setup>
import { clearAllStores, stores } from "@/store";
import { nextTick, ref } from 'vue';
import i18n from "@/plugins/i18n";
import Item from "@/data/Item";

const apiStore = stores.api();
const configStore = stores.config();
const userStore = stores.user();

async function returnToBackend() {
  if (stores.changes().countChanges == 0 || await stores.api().saveChangesToBackend(true)) {
    await clearAllStores();
    window.location = configStore.returnUrl;
  } else {
    stores.layout().showSendFailure = true;
  }
}

async function logout() {
  await stores.api().sendLogout();
  stores.layout().setShowWelcome();
}

</script>

<template>

  <v-btn v-if="configStore.returnUrl" :disabled="apiStore.isLoading || apiStore.isSending" @click="returnToBackend()">
    <v-icon left icon="mdi-logout-variant"></v-icon>
    <span>{{ $t('appMenuReturn') }}</span>
  </v-btn>

  <v-btn v-if="!configStore.returnUrl" id="app-menu-activator">
    <v-icon left icon="mdi-dots-vertical"></v-icon>
    {{ userStore.login }}
  </v-btn>

  <v-menu activator="#app-menu-activator">
    <v-list>
      <v-list-item :disabled="!apiStore.assId" prepend-icon="mdi-text-account" :title="$t('appMenuItems')" @click="stores.layout().setShowItemList();"></v-list-item>
      <v-list-item :disabled="!apiStore.assId" prepend-icon="mdi-file-edit-outline" :title="$t('appMenuTemplate')" @click="stores.layout().setShowTemplate();"></v-list-item>
<!--      <v-list-item :disabled="!apiStore.assId" prepend-icon="mdi-chart-bar" :title="$t('appMenuStatistics')" @click="stores.layout().setShowTemplate();"></v-list-item>-->
      <v-divider></v-divider>
      <v-list-item :disabled="!apiStore.userId" prepend-icon="mdi-swap-horizontal" :title="$t('appMenuChangeAssessment')" @click="stores.layout().setShowAssessmentList();"></v-list-item>
      <v-list-item :disabled="apiStore.isLoading || apiStore.isSending" prepend-icon="mdi-logout-variant" :title="$t('appMenuLogout')" @click="logout"></v-list-item>
    </v-list>
  </v-menu>

</template>
