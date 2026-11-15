<script setup>
/**
 * Confirms and sends the release of pre-graded corrections.
 * The parent passes the selected item keys and calls bulkAuthorizeCorrection.
 */
import { ref } from "vue";
import i18n from "@/plugins/i18n";
import { stores } from "@/store";
import Summary from "@/data/Summary";
import Change from '@/data/Change';

const props = defineProps({
  itemKeys: {
    type: Array,
    default: () => [],
  },
});

const { t } = i18n.global;

const apiStore = stores.api();
const itemsStore = stores.items();

const changeType = ref('');
const langPrefix = ref('');

const releaseOpen = ref(false);
const releaseItems = ref([]);
const releaseFailure = ref("");
const releasing = ref(false);

function bulkAction(change_type) {
  changeType.value = change_type;
  switch (change_type) {
    case Change.TYPE_BULK_AUTHORIZE:
      langPrefix.value = 'bulkAuthorizeOwn';
      releaseItems.value = props.itemKeys
          .map((key) => itemsStore.getItem(key))
          .filter((item) => item?.can_authorize && item.grading_status === Summary.STATUS_PRE_GRADED);
      break;

    case Change.TYPE_REMOVE_OWN_AUTHORIZATION:
      langPrefix.value = 'bulkAuthorizeRemoveOwn';
      releaseItems.value = props.itemKeys
          .map((key) => itemsStore.getItem(key))
          .filter((item) => item?.can_remove_own_authorization);
      break;

    case Change.TYPE_REMOVE_FIRST_AUTHORIZATION:
      langPrefix.value = 'bulkAuthorizeRemoveFirst';
      releaseItems.value = props.itemKeys
          .map((key) => itemsStore.getItem(key))
          .filter((item) => item?.can_remove_first_authorization);
      break;
  }

  if (stores.changes().countChanges) {
    releaseFailure.value = t("bulkAuthorizeFailedOpenChanges");
  } else {
    releaseFailure.value = "";
  }
  releaseOpen.value = true;
}

function itemInfo(item) {
  if (changeType.value == Change.TYPE_BULK_AUTHORIZE) {
    const warning = itemsStore.getAuthorizationWarningText(item);
    if (warning) {
      return item.pseudonym + " - " + warning;
    }
  }
  return item.pseudonym;
}

async function confirmedAction() {
  if (!releaseItems.value.length || releasing.value) {
    return;
  }
  if (stores.changes().countChanges) {
    releaseFailure.value = t("bulkAuthorizeFailedOpenChanges");
    return;
  }

  releasing.value = true;
  try {
    await apiStore.sendChangeAuthorization(releaseItems.value, changeType.value);
    await stores.api().loadDataFromBackend();
    stores.layout().setShowItemList();
    releaseOpen.value = false;
  } finally {
    releasing.value = false;
  }
}

defineExpose({
  bulkAction,
});
</script>

<template>
  <v-dialog
      v-model="releaseOpen"
      max-width="60em"
      persistent
  >
    <v-card>
      <v-card-title>{{ $t(langPrefix + 'Action') }}</v-card-title>
      <v-card-text>
        <v-alert v-if="releaseFailure" type="warning" variant="text" color="#0000A0">
          {{ releaseFailure }}
        </v-alert>
        <template v-else-if="releaseItems.length">
          <p>{{ $t(langPrefix + 'Info') }}</p>
          <ul class="bulk-authorization__release">
            <li v-for="item in releaseItems" :key="item.key">
              {{ itemInfo(item) }}
            </li>
          </ul>
          <p>{{ $t(langPrefix + 'Warn') }}</p>
        </template>
        <p v-else>{{ $t(langPrefix + 'Empty') }}</p>
      </v-card-text>
      <v-card-actions>
        <v-btn
            v-if="releaseItems.length && !releaseFailure"
            :disabled="releasing || apiStore.isSending"
            @click="confirmedAction"
        >
          <v-icon left icon="mdi-check"></v-icon>
          <span>{{ $t(langPrefix + 'Confirm') }}</span>
        </v-btn>
        <v-btn :disabled="releasing" @click="releaseOpen = false">
          <v-icon left icon="mdi-close"></v-icon>
          <span>{{ (releaseItems.length || releaseFailure) ? $t("allCancel") : $t("allClose") }}</span>
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
