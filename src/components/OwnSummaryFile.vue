<script setup>
import { ref } from 'vue';
import axios from 'axios';
import i18n from "@/plugins/i18n";
import {stores} from "@/store";
import SumOfPoints from "@/components/SumOfPoints.vue";

const { t } = i18n.global;

const apiStore = stores.api();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const layoutStore = stores.layout();

const selectedFile = ref(null);
const uploadPercentage = ref(0);
const message = ref('');
const isSuccess = ref(false);
const pdfUrl = ref(apiStore.getSummaryPdfUrl(summariesStore.editSummary));

function updateProgress(progressEvent) {
  // Calculate and update the progress percentage
  uploadPercentage.value = Math.round((100 * progressEvent.loaded) / progressEvent.total);
}

async function uploadFile() {
  if (!selectedFile.value) {
    message.value = 'Bitte wählen Sie eine Datei';
    isSuccess.value = false;
    return;
  }

  const id = await apiStore.sendSummaryPdf(summariesStore.editSummary, selectedFile.value, updateProgress);
  if (id) {
    summariesStore.editSummary.pdf = id;
    pdfUrl.value = apiStore.getSummaryPdfUrl(summariesStore.editSummary);
    closeUpload();
    return;
  }

  message.value = 'Fehler beim Hochladen!'
  isSuccess.value = false;
  uploadPercentage.value = 0;
}

async function deleteFile() {
  summariesStore.editSummary.pdf = null;
  layoutStore.showSummaryFileDelete = false;
}

function closeUpload() {
  message.value = '';
  isSuccess.value = false;
  selectedFile.value = null;
  uploadPercentage.value = 0;
  layoutStore.showSummaryFileUpload = false;
}
</script>


<template>
  <div id="app-own-summary-file-wrapper">
    <object v-if="pdfUrl" class="summary-pdf"
        type="application/pdf"
        :data="pdfUrl"
    >
    </object>

    <v-dialog max-width="60em" persistent v-model="layoutStore.showSummaryFileUpload">
      <v-card class="pa-4">
        <v-card-title>Datei hochladen</v-card-title>
        <v-card-text>

          <v-alert v-show="settingsStore.Task.summary_pdf_advice != ''"
                   color="#0000A0" type="info" variant="text" density="compact">
            {{ settingsStore.Task.summary_pdf_advice }}
          </v-alert>

          <p>&nbsp;</p>

          <v-file-input
              variant="outlined"
              label="Dateiauswahl"
              v-model="selectedFile"
              prepend-icon="mdi-file-check-outline"
              show-size
              accept="application/pdf"
          ></v-file-input>

          <div v-if="uploadPercentage > 0" class="mt-4">
            <v-progress-linear
                v-model="uploadPercentage"
                color="#0000A0"
                height="25"
            >
              <strong>{{ Math.ceil(uploadPercentage) }}%</strong>
            </v-progress-linear>
          </div>

          <v-alert
              v-if="message"
              :type="isSuccess ? 'success' : 'error'"
              class="mt-4"
          >
            {{ message }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn
              :disabled="!selectedFile"
              @click="uploadFile"
          >
            Hochladen
          </v-btn>
          <v-btn @click="closeUpload()">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>

    <v-dialog max-width="60em" persistent v-model="layoutStore.showSummaryFileDelete">
      <v-card class="pa-4">
        <v-card-title>Datei Löschen</v-card-title>
        <v-card-text>
            {{ $t('ownSummaryFileDeleteMessage') }}
        </v-card-text>
        <v-card-actions>
          <v-btn @click="deleteFile()">
            <v-icon left icon="mdi-delete"></v-icon>
            {{ $t('allDelete') }}
          </v-btn>
          <v-btn @click="layoutStore.showSummaryFileDelete = false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>


  </div>
</template>


<style scoped>
#app-own-summary-file-wrapper {
  height: 100%;
}

.summary-pdf {
  height: calc(100% - 40px);
  width: 100%;
}
</style>
