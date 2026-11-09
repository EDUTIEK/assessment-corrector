/**
 * Preferences Store
 * Stores local setings done by the correction
 * These settings are not yet sent to the backend
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Summary from '@/data/Summary';
import Correction from '@/data/Correction';
import Item from '@/data/Item';
import Change from '@/data/Change';
import Mark from '@/data/Mark';

const storage = getStorage('preferences');

const ITEM_LIST_FILTERS = {
  filter_assigned_position: Correction.ALLOWED_POSITIONS,
  filter_grading_status: Summary.ALLOWED_STATUS,
  filter_correction_status: Item.ALLOWED_CORRECTION_STATUS,
};

/**
 * null means every allowed value. An array is the selected subset.
 * An empty array selects nothing. A scalar or comma-separated string is accepted from storage.
 *
 * @param {Array|string|number|null} value
 * @param {Array} allowed
 * @return {Array|null}
 */
function normalizeFilterSelection(value, allowed) {
  if (value == null || value === '') {
    return null;
  }
  // ',' is the stored form of an explicit empty selection
  if (value === ',') {
    return [];
  }

  let raw;
  if (Array.isArray(value)) {
    raw = value;
  } else if (typeof value === 'string') {
    raw = value.split(',').map((part) => part.trim()).filter((part) => part !== '');
  } else {
    raw = [value];
  }

  if (raw.length === 0) {
    return [];
  }

  const selected = allowed.filter((entry) => raw.some((item) => item == entry));
  if (selected.length === 0 || selected.length === allowed.length) {
    return null;
  }
  return selected;
}

/**
 * Backend columns store a scalar. One numeric position stays a number, several values a comma-separated string.
 * An empty selection is encoded as ',' so it survives a reload.
 *
 * @param {Array|string|number|null} value
 * @param {boolean} numericSingle
 * @return {Array|string|number|null}
 */
function encodeFilterSelection(value, numericSingle) {
  if (value == null) {
    return null;
  }
  const list = Array.isArray(value) ? value : [value];
  if (list.length === 0) {
    return ',';
  }
  if (numericSingle && list.length === 1) {
    return Number(list[0]);
  }
  return list.join(',');
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => {
    return {
      // saved in storage
      essay_page_zoom: 0.25,                              // zoom of a pdf page display
      essay_text_zoom: 1,                                 // zoom of an essay text display
      summary_text_zoom: 1,                               // zoom in the editor of the correction summary
      default_shape: Mark.SHAPE_TEXT_MARKER,              // default shape for new pdf annotations
      display_labels: false,                              // show marking labels in the essay
      select_words: true,                                 // do pdf text selection by words
      filter_grading_status: null,                        // null: all own grading statuses; array: selected values
      filter_correction_status: null,                     // null: all correction statuses; array: selected values
      filter_assigned_position: null,                     // null: all assigned positions; array: selected values

      // not saved
      locale: 'de-DE'                                     // currently fixed
    }
  },

  getters: {

    decimalSeparator(state) {
      return ','
    },

    formatNumber(state) {

      const format = Intl.NumberFormat(state.locale);

      /**
       * Format a number with the correct decimal sign
       *
       * @param {number} number
       * @returns {string}
       */
      const fn = function (number) {
        return format.format(number);
      }
      return fn;
    }
  },

  actions: {

    async clearStorage() {
      try {
        this.$reset();
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromStorage() {
      try {
        const data = await storage.getItem('preferences');
        if (data) {
          this.$patch(data);
        }
        this.normalizeItemListFilters();
        stores.items().updateCurrentKeys();
      }
      catch (err) {
        console.log(err);
      }
    },

    async saveToStorage() {
      try {
        await storage.setItem('preferences', Object.assign({}, this.$state));
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data) {
      try {
        if (data.essay_text_zoom) {
          this.essay_text_zoom = data.essay_text_zoom;
        }
        if (data.essay_page_zoom) {
          this.essay_page_zoom = data.essay_page_zoom;
        }
        if (data.summary_text_zoom) {
          this.summary_text_zoom = data.summary_text_zoom;
        }
        if (Mark.ALLOWED_SHAPES.includes(data.default_shape)) {
          this.default_shape = data.default_shape;
        }
        this.display_labels = !!data.display_labels;
        this.select_words = !!data.select_words;
        this.normalizeItemListFilters(data);
        await this.saveToStorage();
        stores.items().updateCurrentKeys();
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Update the preferences in the storage and mark them as changed
     */
    async update() {
      const changesStore = stores.changes();
      const apiStore = stores.api();

      await this.saveToStorage();
      if (stores.corrections().ownKey) {
        await changesStore.setChange(new Change({
          type: Change.TYPE_PREFERENCES,
          action: Change.ACTION_SAVE,
          key: 'preferences',         // fixed key, old change will be updated
          item_key: apiStore.itemKey
        }))
      }
    },

    /**
     * Get the changed preferences as flat data object
     * This is called for sending the preferences to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const changesStore = stores.changes();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_PREFERENCES, sendingTime)) {
        // preferences exist only once, will be the same for all changes
        const payload = Object.assign({}, this.$state);
        payload.filter_assigned_position = encodeFilterSelection(payload.filter_assigned_position, true);
        payload.filter_grading_status = encodeFilterSelection(payload.filter_grading_status, false);
        payload.filter_correction_status = encodeFilterSelection(payload.filter_correction_status, false);
        changes.push(changesStore.getChangeDataToSend(change, payload));
        break;
      }
      return changes;
    },

    zoomEssayPageIn() {
      this.essay_page_zoom = this.essay_page_zoom * 1.1;
      this.update();
    },

    zoomEssayPageOut() {
      this.essay_page_zoom = this.essay_page_zoom * 0.9;
      this.update();
    },

    zoomEssayTextIn() {
      this.essay_text_zoom = this.essay_text_zoom * 1.1;
      this.update();
    },

    zoomEssayTextOut() {
      this.essay_text_zoom = this.essay_text_zoom * 0.9;
      this.update();
    },

    zoomSummaryTextIn() {
      this.summary_text_zoom = this.summary_text_zoom * 1.1;
      this.update();
    },

    zoomSummaryTextOut() {
      this.summary_text_zoom = this.summary_text_zoom * 0.9;
      this.update();
    },

    /**
     * Keep item-list filters inside the allowed values.
     * A provided data object overrides a field only when that field is present.
     *
     * @param {object|null} data
     */
    normalizeItemListFilters(data = null) {
      for (const [key, allowed] of Object.entries(ITEM_LIST_FILTERS)) {
        const value = data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : this[key];
        this[key] = normalizeFilterSelection(value, allowed);
      }
    },

    /**
     * Store the selected values of one item-list filter and persist them.
     * null or a complete selection clears the filter.
     *
     * @param {string} key
     * @param {Array|string|number|null} values
     */
    async setItemListFilter(key, values) {
      const allowed = ITEM_LIST_FILTERS[key];
      if (!allowed) {
        return;
      }
      this[key] = normalizeFilterSelection(values, allowed);
      stores.items().updateCurrentKeys();
      await this.update();
    }
  },
});
