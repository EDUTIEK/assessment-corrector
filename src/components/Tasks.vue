<script setup>
import {stores} from "@/store";
import { nextTick, ref } from 'vue';
import i18n from "@/plugins/i18n";
import Item from "@/data/Item";

const apiStore = stores.api();
const itemsStore = stores.items();
const tasksStore = stores.tasks();

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

async function selectTask() {
  menuOpen.value = false;
  itemsStore.changeItem(itemsStore.getByTask(selectedKey.value)?.key);
}

</script>

<template>

  <v-btn :disabled="apiStore.isLoading || !tasksStore.previousKey"
         @click="itemsStore.changeItem(itemsStore.getByTask(tasksStore.previousKey)?.key)">
    <v-icon left icon="mdi-arrow-left-bold"></v-icon>
    <span class="sr-only">{{ $t('tasksPreviousTask') }}</span>
  </v-btn>

  <v-btn :disabled="apiStore.isLoading" id="app-tasks-menu-activator">
      <span v-show="apiStore.isLoading">
        {{ $t('allLoadData') }}
      </span>
    <span v-show="!apiStore.isLoading && itemsStore.currentItem !== undefined">
        {{ tasksStore.currentTask?.title }}
      </span>
  </v-btn>

  <v-btn :disabled="apiStore.isLoading || !tasksStore.nextKey"
         @click="itemsStore.changeItem(itemsStore.getByTask(tasksStore.nextKey)?.key)">
    <v-icon left icon="mdi-arrow-right-bold"></v-icon>
    <span class="sr-only">{{ $t('tasksNextTask') }}</span>
  </v-btn>

  <v-menu :disabled="apiStore.isLoading" v-model="menuOpen" activator="#app-tasks-menu-activator"
          :close-on-content-click="false" @update:modelValue="showSelection()">
    <v-autocomplete
        id="app-taks-autocomplete"
        v-if="selectionShown"
        v-model="selectedKey"
        :items="tasksStore.sortedTasks"
        :menu=true
        item-title="title"
        item-value="key"
        autofocus
        auto-select-first
        class="flex-full-width"
        density="comfortable"
        item-props
        menu-icon=""
        :placeholder="$t('tasksTasks')"
        prepend-inner-icon="mdi-magnify"
        theme="light"
        variant="solo"
        @update:modelValue="selectTask()"
    ></v-autocomplete>
  </v-menu>
</template>


<style scoped>

</style>
