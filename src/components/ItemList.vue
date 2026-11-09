<script setup>
/**
 * Sortable list of correction items.
 * Choosing a row calls itemsStore.changeItem with the item key.
 * Visible columns can be chosen; pseudonym stays visible.
 */
import { computed, nextTick, ref } from "vue";
import i18n from "@/plugins/i18n";
import { stores } from "@/store";

const { t } = i18n.global;

const apiStore = stores.api();
const itemsStore = stores.items();

const ALWAYS_VISIBLE = "pseudonym";

const COLUMN_DEFS = [
  { key: "pseudonym", titleKey: "itemListPseudonym", sortable: true },
  { key: "position_text", titleKey: "itemListPosition", sortable: true },
  { key: "grading_status_text", titleKey: "itemListGradingStatus", sortable: true },
  { key: "grading_points", titleKey: "itemListGradingPoints", sortable: true, align: "end", numeric: true },
  { key: "grading_grade", titleKey: "itemListGradingGrade", sortable: true },
  { key: "other_status_text", titleKey: "itemListOtherStatus", sortable: true },
  { key: "other_correction_text", titleKey: "itemListOtherCorrection", sortable: false, wrap: true },
  { key: "final_result_text", titleKey: "itemListFinalResult", sortable: false, wrap: true },
  { key: "final_points", titleKey: "itemListFinalPoints", sortable: true, align: "end", numeric: true },
  { key: "final_grade", titleKey: "itemListFinalGrade", sortable: true },
];

const DEFAULT_VISIBLE = [
  "pseudonym",
  "position_text",
  "grading_status_text",
  "grading_points",
  "grading_grade",
  "other_status_text",
  "final_result_text",
];

const visibleKeys = ref([...DEFAULT_VISIBLE]);
const columnsOpen = ref(false);
const focusedKey = ref(null);
const currentItems = ref([]);
const selecting = ref(false);
const sortBy = ref([]);

const columnOptions = computed(() =>
  COLUMN_DEFS.map((column) => ({
    ...column,
    title: t(column.titleKey),
    locked: column.key === ALWAYS_VISIBLE,
  })),
);

const headers = computed(() =>
  columnOptions.value
    .filter((column) => visibleKeys.value.includes(column.key))
    .map((column) => {
      const header = {
        title: column.title,
        key: column.key,
        sortable: column.sortable,
      };
      if (column.align) {
        header.align = column.align;
      }
      if (column.wrap) {
        header.minWidth = "12rem";
        header.cellProps = { class: "item-list__wrap" };
      }
      if (column.sortable) {
        header.sortRaw = (left, right) => compareValues(left?.[column.key], right?.[column.key], column.numeric);
      }
      return header;
    }),
);

function compareValues(left, right, numeric) {
  const leftEmpty = left == null || left === "";
  const rightEmpty = right == null || right === "";
  if (leftEmpty && rightEmpty) {
    return 0;
  }
  if (leftEmpty) {
    return -1;
  }
  if (rightEmpty) {
    return 1;
  }
  if (numeric) {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }
  }
  return String(left).localeCompare(String(right), "de", { numeric: true, sensitivity: "base" });
}

function isColumnVisible(key) {
  return key === ALWAYS_VISIBLE || visibleKeys.value.includes(key);
}

function setColumnVisible(key, visible) {
  if (key === ALWAYS_VISIBLE) {
    return;
  }
  const next = new Set(visibleKeys.value);
  if (visible) {
    next.add(key);
  } else {
    next.delete(key);
    sortBy.value = sortBy.value.filter((entry) => entry.key !== key);
  }
  next.add(ALWAYS_VISIBLE);
  visibleKeys.value = COLUMN_DEFS.map((column) => column.key).filter((columnKey) => next.has(columnKey));
}

function formatPoints(value) {
  if (value == null || value === "") {
    return "";
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return String(value);
  }
  return number.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

function isCurrent(item) {
  return item?.key != null && item.key === itemsStore.currentKey;
}

function tabTargetKey() {
  return focusedKey.value
    ?? itemsStore.currentKey
    ?? currentItems.value[0]?.key
    ?? itemsStore.sortedItems[0]?.key
    ?? null;
}

function sortEntry(sortState, key) {
  return (sortState ?? []).find((entry) => entry.key === key) ?? null;
}

function ariaSort(sortState, column) {
  if (!column.sortable) {
    return undefined;
  }
  const entry = sortEntry(sortState, column.key);
  if (!entry) {
    return "none";
  }
  return entry.order === "desc" ? "descending" : "ascending";
}

function sortStateText(sortState, column) {
  const entry = sortEntry(sortState, column.key);
  if (!entry) {
    return t("itemListSortNone");
  }
  return entry.order === "desc" ? t("itemListSortDesc") : t("itemListSortAsc");
}

function rowProps({ item }) {
  const current = isCurrent(item);
  return {
    class: current ? "item-list__current" : undefined,
    "aria-current": current ? "true" : undefined,
    "data-item-key": item.key,
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
    selectItem(item);
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
  const nextKey = rows[nextIndex].dataset.itemKey;
  if (!nextKey) {
    return;
  }
  focusedKey.value = nextKey;
  nextTick(() => {
    document.querySelector(`tr[data-item-key="${CSS.escape(nextKey)}"]`)?.focus();
  });
}

function onRowClick(_event, row) {
  selectItem(row.item);
}

async function selectItem(item) {
  if (selecting.value || apiStore.isLoading || !item?.key) {
    return;
  }
  selecting.value = true;
  try {
    await apiStore.selectItem(item.key);
  } finally {
    selecting.value = false;
    stores.layout().setInitialized();
  }
}
</script>

<template>
  <section
      class="item-list"
      :aria-busy="apiStore.isLoading ? 'true' : undefined"
  >
    <v-menu
        v-model="columnsOpen"
        :close-on-content-click="false"
        location="bottom start"
    >
      <template #activator="{ props }">
        <v-btn
            v-bind="props"
            class="item-list__columns-btn"
            variant="outlined"
            size="small"
            append-icon="mdi-menu-down"
            aria-controls="item-list-columns"
        >
          {{ $t("itemListColumns") }}
        </v-btn>
      </template>
      <v-card id="item-list-columns">
        <fieldset class="item-list__columns">
          <legend class="sr-only">{{ $t("itemListColumns") }}</legend>
          <v-checkbox
              v-for="column in columnOptions"
              :key="column.key"
              class="item-list__column"
              :model-value="isColumnVisible(column.key)"
              :disabled="column.locked"
              hide-details
              density="compact"
              @update:model-value="setColumnVisible(column.key, $event)"
          >
            <template #label>
              {{ column.title }}
              <span v-if="column.locked" class="sr-only">, {{ $t("itemListPseudonymLocked") }}</span>
            </template>
          </v-checkbox>
        </fieldset>
      </v-card>
    </v-menu>

    <v-data-table
        v-model:sort-by="sortBy"
        class="item-list__table"
        :headers="headers"
        :items="itemsStore.sortedItems"
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
        :no-data-text="$t('itemListEmpty')"
        :row-props="rowProps"
        @click:row="onRowClick"
        @update:current-items="currentItems = $event"
    >
      <template #colgroup>
        <caption class="sr-only">{{ $t("itemListCaption") }}</caption>
      </template>

      <template #headers="{ columns, toggleSort, isSorted, getSortIcon, sortBy: headerSortBy }">
        <tr>
          <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="v-data-table__th"
              :class="{ 'text-end': column.align === 'end' }"
              :aria-sort="ariaSort(headerSortBy, column)"
          >
            <v-btn
                v-if="column.sortable"
                variant="text"
                size="small"
                class="item-list__sort"
                @click="toggleSort(column)"
            >
              {{ column.title }}
              <span class="sr-only">, {{ sortStateText(headerSortBy, column) }}</span>
              <v-icon
                  :icon="isSorted(column) ? getSortIcon(column) : 'mdi-unfold-more-horizontal'"
                  size="small"
                  aria-hidden="true"
              />
            </v-btn>
            <span class="item-list__nosort" v-else>{{ column.title }}</span>
          </th>
        </tr>
      </template>

      <template #item.pseudonym="{ item }">
        {{ item.pseudonym }}
        <span v-if="isCurrent(item)" class="sr-only">, {{ $t("itemListCurrent") }}</span>
      </template>

      <template #item.grading_points="{ item }">
        {{ formatPoints(item.grading_points) }}
      </template>

      <template #item.final_points="{ item }">
        {{ formatPoints(item.final_points) }}
      </template>
    </v-data-table>
  </section>
</template>

<style scoped>
.item-list {
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

.item-list__columns-btn {
  align-self: flex-start;
}

.item-list__columns {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 4px 12px;
  border: 0;
  min-width: 16rem;
}

.item-list__table {
  flex: 1 1 auto;
  min-height: 0;
}

:deep(.item-list__column) {
  flex: 0 0 auto;
}

:deep(.item-list__column .v-selection-control) {
  min-height: 32px;
}

:deep(.item-list__sort) {
  min-width: 0;
  height: auto;
  padding-inline: 4px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
}

:deep(.item-list__nosort) {
  font-weight: 600;
  font-size: small;
}

:deep(thead th) {
  white-space: nowrap;
  vertical-align: middle;
}

:deep(.item-list__wrap) {
  white-space: normal;
  vertical-align: top;
}

:deep(tbody > tr.item-list__current > td) {
  background-color: #d7e7f8;
}

:deep(tbody > tr.item-list__current > td:first-child) {
  box-shadow: inset 4px 0 0 #1867C0;
}

:deep(tbody > tr.v-data-table__tr:focus-visible > td) {
  box-shadow: inset 0 0 0 2px #0000A0;
}
</style>
