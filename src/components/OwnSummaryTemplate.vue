<script setup>
import {ref} from 'vue';
import i18n from "@/plugins/i18n";
import {stores} from "@/store";

const { t } = i18n.global;

const apiStore = stores.api();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const layoutStore = stores.layout();

const showPreview = ref(false);

async function adoptTemplate() {
  const template = stores.templates().currentTemplate;
  if (template?.hasContent) {
    stores.summaries().editSummary.text = template.content;
    closePreview();
  }
}

function openPreview() {
  showPreview.value = true;
}

function closePreview() {
  showPreview.value = false;
}

</script>

<template>
  <span id="app-own-summary-template-wrapper">
    <v-btn class="headline-button" v-if="stores.templates().currentTemplate?.hasContent" flat @click="openPreview">
      <v-icon left icon="mdi-file-star-outline"></v-icon>
      <span>{{ $t('ownSummaryTemplate') + '...' }}</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="showPreview">
      <v-card class="pa-4">
        <v-card-title>{{ $t('ownSummaryTemplateAdoptLong') }}</v-card-title>
        <v-card-text>
          <v-alert color="#0000A0" type="info" variant="text" density="compact">
            {{ $t('ownSummaryTemplateMessage') }}
          </v-alert>

          <div class="appText long-essay-content headlines-three"
               v-html="stores.templates().currentTemplate?.content">
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn @click="adoptTemplate">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('ownSummaryTemplateAdoptShort') }}</span>
          </v-btn>
          <v-btn @click="closePreview">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allClose') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </span>
</template>


<style scoped>

.headline-button {
  background-color: #f0f0f0;
}

.appText {
  height: 12em;
  overflow-y: scroll;
  border: 1px solid lightgray;
}

</style>
