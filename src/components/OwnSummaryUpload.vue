<script setup>
import {ref} from 'vue';
import i18n from "@/plugins/i18n";
import {stores} from "@/store";
import Item from "@/data/Item"

const props = defineProps(['summary', 'upload', 'download']);

const { t } = i18n.global;

const apiStore = stores.api();
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
  if (!selectedFile.value) {
    message.value = t('ownSummaryUploadSelect');
    isSuccess.value = false;
    return;
  }

  const id = await apiStore.sendSummaryPdf(props.summary, selectedFile.value, updateProgress);
  if (id) {
    props.summary.pdf = id;
    props.summary.text = '';
    closeUpload();
    return;
  }

  message.value = t('ownSummaryUploadError');
  isSuccess.value = false;
  uploadPercentage.value = 0;
}


function openUpload() {
  if (props.summary.text) {
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
  props.summary.pdf = null;
  showDelete.value = false;
}

async function downloadFile()
{
  const response = await fetch(stores.api().getSummaryPdfUrl(props.summary));
  const blob = await response.blob();
  const title = stores.api().getDownloadTitle(
      t('ownSummaryExportFile')
      + ' ' + Item.buildPositionText(stores.corrections().getCorrection(props.summary.correction_key)?.position)
      + (stores.items().isFinal ? '' : ' - ' + t('ownSummaryExportDraft'))
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title

  document.body.appendChild(a); // required in Firefox
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url); // free memory
}

</script>

<template>
  <span id="app-own-summary-upload-wrapper">
    <v-btn class="headline-button" size="small" v-if="props.upload && !props.summary.pdf" flat @click="openUpload">
      <v-icon left icon="mdi-upload"></v-icon>
      <span>{{ $t('allUpload') + '...' }}</span>
    </v-btn>
    <v-btn class="headline-button" size="small" v-if="props.download && props.summary.pdf" flat @click="downloadFile">
      <v-icon left icon="mdi-download"></v-icon>
      <span>{{ $t('allDownload') }}</span>
    </v-btn>
    <v-btn class="headline-button" size="small" v-if="props.upload && props.summary.pdf" flat @click="showDelete = true">
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
              :label="$t('ownSummaryUploadSelect')"
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
