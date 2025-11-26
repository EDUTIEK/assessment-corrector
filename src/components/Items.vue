<script setup>
import {stores} from "@/store";
import { nextTick, ref } from 'vue';
import i18n from "@/plugins/i18n";
import Item from "@/data/Item";

const apiStore = stores.api();
const itemsStore = stores.items();
const summariesStore = stores.summaries();
const essayStore = stores.essay();
const correctionsStore = stores.corrections();
const changesStore = stores.changes();
const layoutStore = stores.layout();

const menuOpen = ref(false);
const selectionShown = ref(false);
const selectedKey = ref('');
const loading = ref(false);

const { t } = i18n.global;

async function showSelection() {
  await nextTick();
  if (menuOpen.value) {
    selectionShown.value = true;
    selectedKey.value = '';
  }
}

async function selectItem() {
  menuOpen.value = false;
  if (!apiStore.isLoading && selectedKey.value != '') {
    changeItem(selectedKey.value);
  }
}

async function changeItem(newKey) {
  if (!apiStore.isLoading) {
    if (!(await changesStore.hasChangesInStorage()) || await apiStore.saveChangesToBackend(true)) {
      await apiStore.loadItemFromBackend(newKey);
    } else {
      stores.layout().showSendFailure = true;
    }
  }
}

</script>

<template>

  <v-btn class="app-header-item" :disabled="apiStore.isLoading || apiStore.itemKey == itemsStore.firstKey"
         @click="changeItem(itemsStore.previousKey)">
    <v-icon left icon="mdi-arrow-left-bold"></v-icon>
    <span class="sr-only">{{ $t('itemsPreviousWriter') }}</span>
  </v-btn>

  <v-btn class="app-header-item" :disabled="apiStore.isLoading" id="app-items-menu-activator">
      <span v-show="apiStore.isLoading">
        {{ $t('itemsLoadData') }}
      </span>
    <span v-show="!apiStore.isLoading && itemsStore.currentItem !== undefined">
        {{ itemsStore.currentItem.title }}
      </span>
  </v-btn>

  <v-menu :disabled="apiStore.isLoading" v-model="menuOpen" activator="#app-items-menu-activator"
          :close-on-content-click="false" @update:modelValue="showSelection()">
    <v-autocomplete
        id="app-items-autocomplete"
        v-if="selectionShown"
        v-model="selectedKey"
        :items="itemsStore.sortedItems"
        :menu=true
        item-title="title"
        item-value="key"
        autofocus
        auto-select-first
        class="flex-full-width"
        density="comfortable"
        item-props
        menu-icon=""
        :placeholder="$t('itemsWriter')"
        prepend-inner-icon="mdi-magnify"
        theme="light"
        variant="solo"
        @update:modelValue="selectItem()"
    ></v-autocomplete>
  </v-menu>

  <v-btn class="app-header-item" :disabled="apiStore.isLoading || apiStore.itemKey == itemsStore.lastKey"
         @click="changeItem(itemsStore.nextKey)">
    <v-icon left icon="mdi-arrow-right-bold"></v-icon>
    <span class="sr-only">{{ $t('itemsNextWriter') }}</span>
  </v-btn>
</template>


<style scoped>

</style>
