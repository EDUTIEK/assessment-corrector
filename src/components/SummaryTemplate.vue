<script setup>

import Editor from '@tinymce/tinymce-vue'
import TinyHelper from '@/lib/TinyHelper';

import {stores} from "@/store";
import { nextTick, ref, watch } from 'vue';

const templateStore = stores.templates();

// editorId used for retrieving the editor instance using the tinymce.get('ID') method.
const editorId = ref('summaryTemplate');
const helper = new TinyHelper( editorId.value);

// Foreign template selected for comparison. Selection itself follows later.
const otherTemplate = ref(null);

watch(otherTemplate, async () => {
  await nextTick();
  window.dispatchEvent(new Event('resize'));
});

function setShared(shared) {
  templateStore.editTemplate.shared = !!shared;
  templateStore.updateContent(true);
}

function browseOtherTemplates() {
  otherTemplate.value = templateStore.editTemplate.getClone();
}

function adoptOther() {
  const content = otherTemplate.value?.content;
  if (!content) {
    return;
  }
  templateStore.editTemplate.content = content;
  templateStore.updateContent(true);
}

function closeOther() {
  otherTemplate.value = null;
}

function handleInit() {
  helper.init();
}

async function handleFocusChange() {
  helper.applyFocus();
  await nextTick();
  helper.restoreScrolling();
}

function handleChange() {
  helper.applyZoom();
}

</script>

<template>
  <div class="app-template-text-wrapper" :class="{ 'app-template-text-wrapper--wide': otherTemplate }">
    <v-row
        no-gutters
        class="fill-height flex-nowrap"
        :class="{ 'ga-4': otherTemplate }"
    >
      <v-col class="app-template-pane d-flex flex-column">
        <v-toolbar density="compact" color="white" elevation="1" class="mb-2">
          <template #prepend>
            <v-toolbar-title class="app-template-title-aside ms-4">{{ $t('templateOwnTitle') }}</v-toolbar-title>
            <v-switch
                class="app-template-share"
                color="primary"
                density="compact"
                hide-details
                :label="$t('templateOwnShare')"
                :model-value="templateStore.editTemplate.shared"
                @update:model-value="setShared"
            />
          </template>
          <template #append>
            <v-btn @click="browseOtherTemplates">
              {{ $t('templateOtherBrowse') }}
            </v-btn>
          </template>
        </v-toolbar>
        <div class="app-template-body">
          <label :for="editorId" class="hidden">{{ $t('templateTextHiddenField') }}</label>
          <editor
              :id="editorId"
              v-model="templateStore.editTemplate.content"
              @init="handleInit"
              @change="handleChange"
              @scroll="helper.saveScrolling"
              licenseKey = 'gpl'
              :init="helper.getInit()"
          />
        </div>
      </v-col>

      <v-col v-if="otherTemplate" class="app-template-pane d-flex flex-column">
        <v-toolbar density="compact" color="white" elevation="1" class="mb-2">
          <template #prepend>
            <v-toolbar-title class="app-template-title-aside ms-4">{{ $t('templateOtherTitle') }}</v-toolbar-title>
          </template>
          <template #append>
            <v-btn @click="adoptOther">
              {{ $t('allApply') }}
            </v-btn>
            <v-btn
                icon="mdi-close"
                :aria-label="$t('allClose')"
                @click="closeOther"
            />
          </template>
        </v-toolbar>
        <v-sheet
            border
            rounded="0"
            color="white"
            class="app-template-body overflow-y-auto pa-4 xlas-content headlines-three"
            v-html="otherTemplate.content"
        />
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>

.app-template-text-wrapper {
  box-sizing: border-box;
  height: 100%;
  max-width: 80em;
  width: 100%;
  margin-inline: auto;
  padding-block: 1.5rem;
}

.app-template-text-wrapper--wide {
  max-width: none;
  padding-inline: 1.5rem;
}

.app-template-pane {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.app-template-body {
  flex: 1 1 0;
  min-height: 0;
}

.app-template-title-aside {
  flex: 0 1 auto;
}

.app-template-share {
  margin-left: 50px;
  flex: 0 0 auto;
}
</style>
