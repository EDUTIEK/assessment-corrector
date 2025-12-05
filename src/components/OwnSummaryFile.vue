<script setup>
import { ref } from 'vue';
import axios from 'axios';
import {stores} from "@/store";
import SumOfPoints from "@/components/SumOfPoints.vue";

const apiStore = stores.api();
const itemsStore = stores.items();
const summariesStore = stores.summaries();
const settingsStore = stores.settings();
const layoutStore = stores.layout();

const selectedFile = ref(null);
const uploadPercentage = ref(0);
const message = ref('');
const isSuccess = ref(false);


const uploadFile = async () => {
  if (!selectedFile.value) {
    message.value = 'Please select a file first!';
    isSuccess.value = false;
    return;
  }

  const formData = new FormData();
  // The 'file' key depends on what your backend API expects
  formData.append('file', selectedFile.value);

  try {
    message.value = '';
    uploadPercentage.value = 0;

    await axios.post(apiStore.getUploadUrl(summariesStore.editSummary.task_id, summariesStore.editSummary.writer_id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        // Calculate and update the progress percentage
        uploadPercentage.value = Math.round((100 * progressEvent.loaded) / progressEvent.total);
      },
    });
    closeUpload();

  } catch (error) {
    message.value = 'Fehler beim Hochladen: ' + (error.response?.data?.message || error.message);
    isSuccess.value = false;
    uploadPercentage.value = 0;
  }
};

function closeUpload() {
  message.value = '';
  isSuccess.value = false;
  selectedFile.value = null;
  uploadPercentage.value = 0;
  layoutStore.showSummaryFileUpload = false;
}
</script>


<template>
  <v-container>
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

  </v-container>
</template>


<style scoped>
/* Optional styling if needed */
</style>
