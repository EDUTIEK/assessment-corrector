<script setup>
import {stores} from "@/store";
import { nextTick, watch } from 'vue';
import SendingStatus from "@/components/SendingStatus.vue";
import Item from "@/data/Item";

const apiStore = stores.api();
const layoutStore = stores.layout();
const itemsStore = stores.items();
const resourcesStore = stores.resources();
const correctionsStore = stores.corrections();
const taskStore = stores.tasks();

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'navigation') {
    await nextTick();
    for (const element of document.getElementsByClassName('app-navigation-item')) {
      element.focus();
      break;
    }
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

function openNavigation() {
  document.getElementById('app-navigation-drawer').dispatchEvent(new Event('mouseenter'));
}

function closeNavigation() {
  document.getElementById('app-navigation-drawer').dispatchEvent(new Event('mouseleave'));
}

function handleKey(event) {
  if (event.keyCode == 27) {
    closeNavigation();
  } else {
    layoutStore.handleKeyDown(event);
  }
}

function selectResource(resource) {
  if (resource.type == 'url' && !resource.embedded) {
    window.open(resource.source, 'xlas-corrector-resource-' + resource.key)
  } else {
    resourcesStore.selectResource(resource);
    layoutStore.showResources();
  }
}

function getResourceIcon(resource) {
  switch (resource.type) {
    case "url":
      return (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible) ? "mdi-file-link" : "mdi-file-link-outline"
    default:
      return (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible) ? "mdi-file" : "mdi-file-outline"
  }
}

function getCorrectionTitle(correction) {
  return (correction.title + ' - ' + correction.initials + ' ' + Item.buildPositionText(correction.position));
}

</script>

<template>
  <v-navigation-drawer id="app-navigation-drawer" elevation="2" width="500" permanent rail expand-on-hover
                       @focusin="openNavigation"
                       @focusout="closeNavigation"
                       @keydown="handleKey"
  >
    <!--
      Put list items instead of the whole list in the tab sequence
      https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
    -->
    <v-list tabindex="-1">
      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="taskStore.hasInstructions"
                   @click="closeNavigation; layoutStore.showInstructions();"
                   :aria-label="$t('allInstructions') + layoutStore.isInstructionsVisible ? $t('navBarSelectedAria') : ''"
                   :title="$t('allInstructions') + (layoutStore.isInstructionsVisible ? $t('navBarSelected') : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isInstructionsVisible ? 'mdi-text-box': 'mdi-text-box-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="resourcesStore.hasInstruction"
                   @click="closeNavigation; layoutStore.showInstructionsPdf();"
                   :aria-label="$t('allInstructionsPdf') + (layoutStore.isInstructionsPdfVisible ? $t('navBarSelectedAria') : '')"
                   :title="$t('allInstructionsPdf') + (layoutStore.isInstructionsPdfVisible ? $t('navBarSelected') : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isInstructionsPdfVisible ? 'mdi-text-box': 'mdi-text-box-outline'"></v-icon>
        </template>
      </v-list-item>


      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="taskStore.hasSolution"
                   @click="closeNavigation; layoutStore.showSolution();"
                   :aria-label="$t('allSolution') + (layoutStore.isSolutionVisible ? $t('navBarSelectedAria') : '')"
                   :title="$t('allSolution') + (layoutStore.isSolutionVisible ? $t('navBarSelected') : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isSolutionVisible ? 'mdi-text-box-check': 'mdi-text-box-check-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-show="resourcesStore.hasSolution"
                   @click="closeNavigation; layoutStore.showSolutionPdf();"
                   :aria-label="$t('allSolutionPdf') + (layoutStore.isSolutionPdfVisible ? $t('navBarSelectedAria') : '')"
                   :title="$t('allSolutionPdf') + (layoutStore.isSolutionPdfVisible ? $t('navBarSelected') : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isSolutionPdfVisible ? 'mdi-text-box-check': 'mdi-text-box-check-outline'"></v-icon>
        </template>
      </v-list-item>


      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-for="resource in resourcesStore.fileOrUrlResources"
                   @click="closeNavigation; selectResource(resource);"
                   :aria-label="resource.title + (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible ? ', ist ausgewählt' : '')"
                   :title="resource.title + (resourcesStore.getResourceIsActive(resource) && layoutStore.isResourcesVisible ? $t('navBarSelected') : '')"
                   :key="resource.key"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="getResourceIcon(resource)"></v-icon>
        </template>
      </v-list-item>

      <v-divider v-show="taskStore.hasTexts || resourcesStore.hasResources" class="border-opacity-75"></v-divider>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   @click="closeNavigation; layoutStore.showEssay();"
                   :aria-label="$t('allEssayAndCorrection') + (layoutStore.isEssayVisible ? $t('navBarSelectedAria') : '')"
                   :title="$t('allEssayAndCorrection') + (layoutStore.isEssayVisible ? $t('navBarSelected') : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isEssayVisible && layoutStore.isMarkingVisible ? 'mdi-comment-edit': 'mdi-comment-edit-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-for="correction in correctionsStore.otherCorrections"
                   @click="closeNavigation; layoutStore.selectCorrection(correction.key);"
                   :aria-label="getCorrectionTitle(correction) + (layoutStore.getCorrectionIsVisible(correction.key) ? $t('navBarSelectedAria') : '')"
                   :title="getCorrectionTitle(correction) + (layoutStore.getCorrectionIsVisible(correction.key) ? $t('navBarSelected') : '')"
                   :key="correction.correction_key"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.getCorrectionIsVisible(correction.key) ? 'mdi-account-school' : 'mdi-account-school-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-list-item aria-role="button" class="app-navigation-item" tabindex="0"
                   v-if="correctionsStore.ownCorrection !== null"
                   @click="closeNavigation; layoutStore.showSummary();"
                   :aria-label="$t('allOwnSummaryAndRating') + (layoutStore.isSummaryVisible ? $t('navBarSelectedAria') : '')"
                   :title="$t('allOwnSummaryAndRating') + (layoutStore.isSummaryVisible ? $t('navBarSelected') : '')"
                   :ripple="false"
      >
        <template v-slot:prepend>
          <v-icon aria-role="hidden"
                  :icon="layoutStore.isSummaryVisible ? 'mdi-file-edit': 'mdi-file-edit-outline'"></v-icon>
        </template>
      </v-list-item>

      <v-divider class="border-opacity-75"></v-divider>
    </v-list>

    <template v-slot:append>
      <SendingStatus></SendingStatus>
    </template>


  </v-navigation-drawer>
</template>

<style scoped>

.v-list {
  overflow-x: hidden;
  background-color: #fafafa;
}

.v-list-item {
  background-color: #fafafa !important;
}
</style>
