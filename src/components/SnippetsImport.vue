<script setup>
import {ref} from 'vue';
import i18n from "@/plugins/i18n";
import {stores} from "@/store";

const { t } = i18n.global;

const apiStore = stores.api();
const snippetsStore = stores.snippets();

const selectedFile = ref(null);
const uploadPercentage = ref(0);
const message = ref('');
const isSuccess = ref(false);
const isValid = ref(false);

const showUpload = ref(false);
const showDelete = ref(false);

const rules = [
    value => validate(value)
]

function validate(file) {
  isValid.value = false;

  if (file) {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      isValid.value = false;
      return t('snippetsImportNoExcel');
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
    message.value = t('allFileSelectEmpty');
    isSuccess.value = false;
    return;
  }

  const purpose = snippetsStore.list_purpose;
  const data = await apiStore.sendSnippets(selectedFile.value, purpose, updateProgress);
  if (data) {
    await snippetsStore.loadFromBackend(data['Snippets']);
    snippetsStore.list_purpose = purpose;
    closeUpload();
    return;
  }

  message.value = t('snippetsImportError');
  isSuccess.value = false;
  uploadPercentage.value = 0;
}


function openUpload() {
  showUpload.value = true;
}


function closeUpload() {
  message.value = '';
  isSuccess.value = false;
  selectedFile.value = null;
  uploadPercentage.value = 0;
  showUpload.value = false;
}

</script>

<template>
  <span id="app-snippets-upload-wrapper">
    <v-btn  size="small" @click="openUpload">
      <v-icon left icon="mdi-upload"></v-icon>
      <span>{{ $t('snippetsImport') + '...' }}</span>
    </v-btn>

    <v-dialog max-width="60em" persistent v-model="showUpload">
      <v-card class="pa-4">
        <v-card-title>{{ $t('snippetsImportTitle') }}</v-card-title>
        <v-card-text>

          <v-alert color="#0000A0" type="info" variant="text" density="compact">
            {{ $t('snippetsImportDescription') }}
          </v-alert>

          <p>&nbsp;</p>

          <v-file-input
              variant="outlined"
              :label="$t('allFileSelect')"
              v-model="selectedFile"
              prepend-icon="mdi-file-check-outline"
              show-size
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

  </span>
</template>


<style scoped>
</style>
