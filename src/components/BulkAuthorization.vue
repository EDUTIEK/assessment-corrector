<script setup>
/**
 * Confirms and sends the release of pre-graded corrections.
 * The parent passes the selected item keys and calls bulkAuthorizeCorrection.
 */
import { ref } from "vue";
import i18n from "@/plugins/i18n";
import { stores } from "@/store";
import Summary from "@/data/Summary";

const props = defineProps({
  itemKeys: {
    type: Array,
    default: () => [],
  },
});

const { t } = i18n.global;

const apiStore = stores.api();
const itemsStore = stores.items();

const releaseOpen = ref(false);
const releaseItems = ref([]);
const releaseFailure = ref("");
const releasing = ref(false);

function bulkAuthorizeCorrection() {
  releaseItems.value = props.itemKeys
    .map((key) => itemsStore.getItem(key))
    .filter((item) => item?.can_authorize && item.grading_status === Summary.STATUS_PRE_GRADED);
  if (stores.changes().countChanges) {
    releaseFailure.value = t("ItemListActionFailedOpenChanges");
  } else {
    releaseFailure.value = "";
  }
  releaseOpen.value = true;
}

function bulkAuthorizeInfo(item) {
  const warning = itemsStore.getAuthorizationWarningText(item);
  if (warning) {
    return item.pseudonym + " - " + warning;
  }
  return item.pseudonym;
}

async function confirmBulkAuthorize() {
  if (!releaseItems.value.length || releasing.value) {
    return;
  }

  if (stores.changes().countChanges) {
    releaseFailure.value = t("ItemListActionFailedOpenChanges");
    return;
  }

  releasing.value = true;
  try {
    await apiStore.sendBulkAuthorize(releaseItems.value);
    await stores.api().loadDataFromBackend();
    stores.layout().setShowItemList();
    releaseOpen.value = false;
  } finally {
    releasing.value = false;
  }
}

defineExpose({
  bulkAuthorizeCorrection,
});
</script>

<template>
  <v-dialog
      v-model="releaseOpen"
      max-width="60em"
      persistent
  >
    <v-card>
      <v-card-title>{{ $t("itemListActionBulkAuthorize") }}</v-card-title>
      <v-card-text>
        <v-alert v-if="releaseFailure" type="warning" variant="text" color="#0000A0">
          {{ releaseFailure }}
        </v-alert>
        <template v-else-if="releaseItems.length">
          <p>{{ $t("itemListBulkAuthorizeInfo") }}</p>
          <ul class="bulk-authorization__release">
            <li v-for="item in releaseItems" :key="item.key">
              {{ bulkAuthorizeInfo(item) }}
            </li>
          </ul>
          <p>{{ $t("itemListBulkAuthorizeWarn") }}</p>
        </template>
        <p v-else>{{ $t("itemListBulkAuthorizeEmpty") }}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn
            v-if="releaseItems.length && !releaseFailure"
            :disabled="releasing || apiStore.isSending"
            @click="confirmBulkAuthorize"
        >
          <v-icon left icon="mdi-check"></v-icon>
          <span>{{ $t("itemListBulkAuthorizeConfirm") }}</span>
        </v-btn>
        <v-btn :disabled="releasing" @click="releaseOpen = false">
          <v-icon left icon="mdi-close"></v-icon>
          <span>{{ releaseItems.length || releaseFailure ? $t("allCancel") : $t("allClose") }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.bulk-authorization__release {
  margin: 8px 0 12px;
  padding-inline-start: 1.25rem;
}
</style>
