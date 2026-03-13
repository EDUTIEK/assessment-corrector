<script setup>
import {ref} from 'vue';
import i18n from "@/plugins/i18n";
import {stores} from "@/store";

const { t } = i18n.global;

const apiStore = stores.api();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const layoutStore = stores.layout();

const selectedFile = ref(null);
const uploadPercentage = ref(0);
const message = ref('');
const isSuccess = ref(false);
const isValid = ref(false);

const showTextWarning = ref(false);
const showUpload = ref(false);
const showDelete = ref(false);

const rules = [
    value => validate(value)
]

function validate(file) {
  isValid.value = false;

  if (file) {
    if (file.type !== 'application/pdf') {
      isValid.value = false;
      return t('ownSummaryUploadMessageNoPdf');
    }
    isValid.value = true;
    return true;
  }

  return true;
}

function updateProgress(progressEvent) {
  // Calculate and update the progress percentage
  uploadPercentage.value = Math.round((100 * progressEvent.loaded) / progressEvent.total);
}

async function uploadFile() {
  console.log(selectedFile.value);
  if (!selectedFile.value) {
    message.value = 'Bitte wählen Sie eine Datei';
    isSuccess.value = false;
    return;
  }

  const id = await apiStore.sendSummaryPdf(summariesStore.editSummary, selectedFile.value, updateProgress);
  if (id) {
    summariesStore.editSummary.pdf = id;
    summariesStore.editSummary.text = '';
    closeUpload();
    return;
  }

  message.value = 'Fehler beim Hochladen!'
  isSuccess.value = false;
  uploadPercentage.value = 0;
}


function openUpload() {
  if (summariesStore.editSummary.text) {
    showTextWarning.value = true;
  } else {
    showUpload.value = true;
  }
}


function closeUpload() {
  message.value = '';
  isSuccess.value = false;
  selectedFile.value = null;
  uploadPercentage.value = 0;
  showUpload.value = false;
}

function deleteFile() {
  summariesStore.editSummary.pdf = null;
  showDelete.value = false;
}

</script>

<template>
  <span id="app-own-summary-upload-wrapper">
    <v-btn class="headline-button" size="small" v-if="!summariesStore.editSummary.pdf" flat @click="openUpload">
      <v-icon left icon="mdi-upload"></v-icon>
      <span>{{ $t('allUpload') + '...' }}</span>
    </v-btn>
    <v-btn class="headline-button" size="small" v-if="summariesStore.editSummary.pdf" flat @click="showDelete = true">
      <v-icon left icon="mdi-delete-outline"></v-icon>
      <span>{{ $t('allDelete') + '...' }}</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="showTextWarning">
      <v-card class="pa-4">
        <v-card-title>{{ $t('ownSummaryUploadTitle') }}</v-card-title>
        <v-card-text>
          {{ $t('ownSummaryUploadTextWarning') }}
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showTextWarning = false">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allClose') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog max-width="60em" persistent v-model="showUpload">
      <v-card class="pa-4">
        <v-card-title>{{ $t('ownSummaryUploadTitle') }}</v-card-title>
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
              :rules = "rules"
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
              :disabled="!selectedFile || !isValid"
              @click="uploadFile"
          >
            <v-icon left icon="mdi-upload"></v-icon>
            {{ $t('allUpload') }}
          </v-btn>
          <v-btn @click="closeUpload()">
            <v-icon left icon="mdi-close"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>

    <v-dialog max-width="60em" persistent v-model="showDelete">
      <v-card class="pa-4">
        <v-card-title>{{ $t('ownSummaryUploadDeleteTitle') }}</v-card-title>
        <v-card-text>
            {{ $t('ownSummaryUploadDeleteInfo') }}
        </v-card-text>
        <v-card-actions>
          <v-btn @click="deleteFile()">
            <v-icon left icon="mdi-delete-outline"></v-icon>
            {{ $t('allDelete') }}
          </v-btn>
          <v-btn @click="showDelete = false">
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
