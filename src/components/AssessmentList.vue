<script setup>
/**
 * Sortable list of assessments.
 * Choosing a row stores assId and contextId and runs the API init action.
 */
import { computed, nextTick, ref } from "vue";
import Cookies from "js-cookie";
import i18n from "@/plugins/i18n";
import { stores } from "@/store";

const { t } = i18n.global;

const apiStore = stores.api();
const assessmentsStore = stores.assessments();

const focusedKey = ref(null);
const currentItems = ref([]);
const selecting = ref(false);

const headers = computed(() => [
  { title: t("assessmentListParentTitle"), key: "parent_title", sortable: true },
  { title: t("assessmentListTitle"), key: "title", sortable: true },
  { title: t("assessmentListCorrectionStart"), key: "correction_start", sortable: true, sortRaw: (a, b) => compareTimestamps(a.correction_start_ts, b.correction_start_ts) },
  { title: t("assessmentListCorrectionEnd"), key: "correction_end", sortable: true, sortRaw: (a, b) => compareTimestamps(a.correction_end_ts, b.correction_end_ts) },
  { title: t("assessmentListGradings"), key: "gradings", sortable: false, align: "end" },
]);

function compareTimestamps(left, right) {
  if (left == null && right == null) {
    return 0;
  }
  if (left == null) {
    return -1;
  }
  if (right == null) {
    return 1;
  }
  return left - right;
}

function isCurrent(item) {
  return item?.key != null && item.key === assessmentsStore.currentKey;
}

function tabTargetKey() {
  return focusedKey.value
    ?? assessmentsStore.currentKey
    ?? currentItems.value[0]?.key
    ?? assessmentsStore.sortedAssessments[0]?.key
    ?? null;
}

function sortEntry(sortBy, key) {
  return (sortBy ?? []).find((entry) => entry.key === key) ?? null;
}

function ariaSort(sortBy, column) {
  if (!column.sortable) {
    return undefined;
  }
  const entry = sortEntry(sortBy, column.key);
  if (!entry) {
    return "none";
  }
  return entry.order === "desc" ? "descending" : "ascending";
}

function sortStateText(sortBy, column) {
  const entry = sortEntry(sortBy, column.key);
  if (!entry) {
    return t("assessmentListSortNone");
  }
  return entry.order === "desc" ? t("assessmentListSortDesc") : t("assessmentListSortAsc");
}

function finishedCount(item) {
  const value = Number(item?.finished_gradings);
  return Number.isFinite(value) ? value : 0;
}

function assignedCount(item) {
  const value = Number(item?.assigned_gradings);
  return Number.isFinite(value) ? value : 0;
}

function gradingLabel(item) {
  return t("assessmentListGradingsValue", {
    finished: finishedCount(item),
    assigned: assignedCount(item),
  });
}

function gradingColor(item) {
  const assigned = assignedCount(item);
  const finished = finishedCount(item);
  if (assigned > 0 && finished >= assigned) {
    return "success";
  }
  if (finished > 0) {
    return "primary";
  }
  return undefined;
}

function rowProps({ item }) {
  const current = isCurrent(item);
  return {
    class: current ? "assessment-list__current" : undefined,
    "aria-current": current ? "true" : undefined,
    "data-assessment-key": item.key,
    tabindex: item.key === tabTargetKey() ? 0 : -1,
    onFocus: () => {
      focusedKey.value = item.key;
    },
    onKeydown: (event) => onRowKeydown(event, item),
  };
}

function onRowKeydown(event, item) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectAssessment(item);
    return;
  }
  const rows = [...event.currentTarget.parentElement.querySelectorAll("tr.v-data-table__tr")];
  const index = rows.indexOf(event.currentTarget);
  if (index < 0) {
    return;
  }
  let nextIndex = index;
  if (event.key === "ArrowDown") {
    nextIndex = Math.min(index + 1, rows.length - 1);
  } else if (event.key === "ArrowUp") {
    nextIndex = Math.max(index - 1, 0);
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = rows.length - 1;
  } else {
    return;
  }
  if (nextIndex === index) {
    return;
  }
  event.preventDefault();
  const nextKey = rows[nextIndex].dataset.assessmentKey;
  if (!nextKey) {
    return;
  }
  focusedKey.value = nextKey;
  nextTick(() => {
    document.querySelector(`tr[data-assessment-key="${CSS.escape(nextKey)}"]`)?.focus();
  });
}

function onRowClick(_event, row) {
  selectAssessment(row.item);
}

async function selectAssessment(assessment) {
  if (selecting.value || apiStore.isLoading) {
    return;
  }
  if (assessment?.ass_id == null || assessment?.context_id == null) {
    return;
  }

  selecting.value = true;
  apiStore.assId = String(assessment.ass_id);
  apiStore.contextId = String(assessment.context_id);
  // init() restores both ids from localStorage and treats different
  // xlasAssId / xlasContextId cookies as a new assessment context.
  // Drop the previous item so the new assessment opens its first submission.
  Cookies.set("xlasAssId", apiStore.assId);
  Cookies.set("xlasContextId", apiStore.contextId);
  apiStore.itemKey = "";
  localStorage.removeItem("xlasCorrectorItemKey");

  try {
    await apiStore.init();
  } finally {
    selecting.value = false;
  }
}
</script>

<template>
  <section
      class="assessment-list"
      aria-labelledby="assessment-list-heading"
      :aria-busy="apiStore.isLoading ? 'true' : undefined"
  >
    <h1 id="assessment-list-heading" class="text-h6">{{ $t("assessmentListHeading") }}</h1>
    <p class="assessment-list__hint">{{ $t("assessmentListHint") }}</p>

    <v-data-table
        class="assessment-list__table"
        :headers="headers"
        :items="assessmentsStore.sortedAssessments"
        item-value="key"
        :items-per-page="-1"
        hide-default-footer
        fixed-header
        hover
        density="compact"
        height="100%"
        :mobile-breakpoint="0"
        :loading="apiStore.isLoading || selecting"
        :loading-text="$t('allLoadData')"
        :no-data-text="$t('assessmentListEmpty')"
        :row-props="rowProps"
        @click:row="onRowClick"
        @update:current-items="currentItems = $event"
    >
      <template #colgroup>
        <caption class="sr-only">{{ $t("assessmentListCaption") }}</caption>
      </template>

      <template #headers="{ columns, toggleSort, isSorted, getSortIcon, sortBy }">
        <tr>
          <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="v-data-table__th"
              :class="{ 'text-end': column.align === 'end' }"
              :aria-sort="ariaSort(sortBy, column)"
          >
            <v-btn
                v-if="column.sortable"
                variant="text"
                size="small"
                class="assessment-list__sort"
                @click="toggleSort(column)"
            >
              {{ column.title }}
              <span class="sr-only">, {{ sortStateText(sortBy, column) }}</span>
              <v-icon
                  :icon="isSorted(column) ? getSortIcon(column) : 'mdi-unfold-more-horizontal'"
                  size="small"
                  aria-hidden="true"
              />
            </v-btn>
            <span v-else>{{ column.title }}</span>
          </th>
        </tr>
      </template>

      <template #item.title="{ item }">
        {{ item.title }}
        <span v-if="isCurrent(item)" class="sr-only">, {{ $t("assessmentListCurrent") }}</span>
      </template>

      <template #item.correction_start="{ item }">
        {{ item.correction_start }}
      </template>

      <template #item.correction_end="{ item }">
        {{ item.correction_end }}
      </template>

      <template #item.gradings="{ item }">
        <v-chip
            size="small"
            variant="tonal"
            :color="gradingColor(item)"
            :aria-label="gradingLabel(item)"
        >
          <span aria-hidden="true">{{ finishedCount(item) }} / {{ assignedCount(item) }}</span>
        </v-chip>
      </template>
    </v-data-table>
  </section>
</template>

<style scoped>
.assessment-list {
  position: fixed;
  z-index: 1;
  top: var(--v-layout-top, 48px);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 8px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.assessment-list h1,
.assessment-list__hint {
  margin: 0;
}

.assessment-list__table {
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.assessment-list__sort) {
  min-width: 0;
  height: auto;
  padding-inline: 4px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
}

:deep(thead th) {
  white-space: nowrap;
  vertical-align: middle;
}

:deep(tbody > tr.assessment-list__current > td) {
  background-color: #d7e7f8;
}

:deep(tbody > tr.assessment-list__current > td:first-child) {
  box-shadow: inset 4px 0 0 #1867C0;
}

:deep(tbody > tr.v-data-table__tr:focus-visible > td) {
  box-shadow: inset 0 0 0 2px #0000A0;
}
</style>
