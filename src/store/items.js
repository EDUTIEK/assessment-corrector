/**
 * Items Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Item from '@/data/Item';
import Procedure from '@/data/Procedure';
import Summary from '@/data/Summary';
import Correction from '@/data/Correction';
import i18n from '@/plugins/i18n';

const storage = getStorage('items');

const { t } = i18n.global;

/**
 * Own grading status used by the item filters.
 * Without a procedure, a revision left over from an earlier setting counts as authorized.
 *
 * @param {string|number|null} status
 * @param {string} procedure
 * @return {string|number|null}
 */
export function gradingStatusForFilter(status, procedure) {
  if (procedure === Procedure.NONE && status === Summary.STATUS_REVISED) {
    return Summary.STATUS_AUTHORIZED;
  }
  return status;
}

/**
 * Overall correction status used by the item filters.
 * Without a procedure, approximation and consulting count as open.
 *
 * @param {string|number|null} status
 * @param {string} procedure
 * @return {string|number|null}
 */
export function correctionStatusForFilter(status, procedure) {
  if (procedure === Procedure.NONE
      && (status === Item.STATUS_APPROXIMATION || status === Item.STATUS_CONSULTING)) {
    return Item.STATUS_OPEN;
  }
  return status;
}

/**
 * null or '' keeps every item. An array matches any selected value.
 * A scalar or comma-separated string is treated as a selection list.
 * normalize maps item values and stored selections to the same filter value.
 *
 * @param {number|string|null} value
 * @param {Array|string|number|null} filter
 * @param {string|null} procedure
 * @param {function} normalize
 * @return {boolean}
 */
function matchesItemFilter(value, filter, procedure = null, normalize = (status) => status) {
  if (filter == null || filter === '') {
    return true;
  }

  const selected = Array.isArray(filter) ? filter : String(filter).split(',');
  if (selected.length === 0) {
    return false;
  }

  const current = String(normalize(value, procedure) ?? '');
  return selected.some((entry) => String(normalize(String(entry).trim(), procedure)) == current);
}

export const useItemsStore = defineStore('items', {
  state: () => {
    return {
      // saved in storage
      items: {},              // list of all items objects

      // not saved
      firstKey: null,
      lastKey: null,
      previousKey: null,
      nextKey: null,
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    currentKey(state) {
      return stores.api().itemKey;
    },

    currentItem(state) {
      return state.items[stores.api().itemKey];
    },

    countItems(state) {
      return Object.keys(state.items).length;
    },

    hasItems(state) {
      return state.countItems > 0;
    },

    sortedItems(state) {
      let items = Object.values(state.items);

      if (stores.api().itemKey && !!state.items[stores.api().itemKey]) {
        const task_id = Item.extractTaskId(stores.api().itemKey)
        items = items.filter(item => item.task_id == task_id)
      }

      const preferences = stores.preferences();
      const procedure = stores.settings().Assessment.procedure;
      items = items.filter((item) =>
        matchesItemFilter(item.position, preferences.filter_assigned_position)
        && matchesItemFilter(item.grading_status, preferences.filter_grading_status, procedure, gradingStatusForFilter)
        && matchesItemFilter(item.correction_status, preferences.filter_correction_status, procedure, correctionStatusForFilter)
      );

      if (stores.settings().Assessment.fixed_items_order) {
        return items;
      }
      return items.toSorted(Item.order);
    },

    canAct(state) {
      return state.canCorrect || state.canAuthorize || state.canRevise;
    },

    canCorrect(state) {
      return state.currentItem?.can_correct;
    },

    canAuthorize(state) {
      return state.currentItem?.can_authorize;
    },

    canRevise(state) {
      return state.currentItem?.can_revise;
    },

    isOpen(state) {
      return state.currentItem?.correction_status === Item.STATUS_OPEN;
    },

    isInRevision(state) {
      return state.currentItem?.correction_status === Item.STATUS_APPROXIMATION
          || state.currentItem?.correction_status === Item.STATUS_CONSULTING;
    },

    isInStitch(state) {
      return state.currentItem?.correction_status === Item.STATUS_STITCH;
    },

    isFinal(state) {
      return state.currentItem?.correction_status === Item.STATUS_FINALIZED;
    },


    getItem(state) {

      /**
       * Get the item of a key
       *
       * @param {string} key
       * @param {object} key
       * @return Item
       */
      const fn = function (key, dummy = null) {
        return state.items[key] ?? dummy;
      }
      return fn;
    },

    getByTask(state) {
      /**
       * Get the first item of a task
       *
       * @param {string} taskKey
       * @param {object} key
       * @return Item
       */
      const fn = function (taskKey) {

        const item = Object.values(state.items)
            .find(item => item.getTaskKey() == taskKey && item.writer_id == state.currentItem?.writer_id);
        if (item) {
          return item;
        }

        return Object.values(state.items)
            .toSorted(Item.order)
            .find(item => item.getTaskKey() == taskKey);
      }
      return fn;
    },


    /**
     * Text if a procedure or stitch decision is needed for the current item
     * @returns {string}
     */
    getAuthorizationWarningText(state) {
      const settings = stores.settings().Assessment;

      /**
       * Get the first item of a task
       *
       * @param {Item} item
       * @return {string}
       */
      const fn = function (item) {
        if (item.position !== Correction.POSITION_SECOND) {
          return '';
        }
          // get a procedure message if needed
          if (settings.procedure_when_distance
            && Math.abs(item.grading_points - item.other_points) > settings.max_no_procedure_distance
          ) {
            switch (settings.procedure) {
              case Procedure.APPROXIMATION:
                return t('summariesProcedureApproximationNeeded') + t('summariesPointsDifferText', settings.max_no_procedure_distance);
              case Procedure.CONSULTING:
                return t('summariesProcedureConsultingNeeded') + t('summariesPointsDifferText', settings.max_no_procedure_distance);
            }
          }

          // get a stitch message if needed
          if ( settings.stitch_when_distance
            && Math.abs(item.grading_points - item.other_points) > settings.max_no_stitch_distance
          ) {
            return t('summariesProcedureStitchNeeded') + t('summariesPointsDifferText', settings.max_no_stitch_distance);
          }

          return '';
        };

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
        this.$reset();

        const keys = await storage.getItem('keys') ?? [];
        for (const key of keys) {
          this.items[key] = new Item(await storage.getItem(key));
        }
        this.updateCurrentKeys();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data = []) {
      try {
        await storage.clear();
        this.$reset();

        for (const item_data of data) {
          const item = new Item(item_data);
          this.items[item.getKey()] = item;
          await storage.setItem(item.getKey(), item.getData());
        }
        await storage.setItem('keys', Object.keys(this.items));
        this.updateCurrentKeys();
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Update a single item when it is loaded from the backend
     * Its status and permissions may have changed
     */
    async saveItem(item) {
      try {
        this.items[item.getKey()] = item;
        await storage.setItem(item.getKey(), JSON.stringify(item.getData()));
        await storage.setItem('keys', Object.keys(this.items));
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Change to a new item
     * @param string {newKey}
     */
    async changeItem(newKey) {
      if (newKey && !stores.api().isLoading) {
        if (stores.changes().countChanges == 0 || await stores.api().saveChangesToBackend(true)) {
          await stores.api().loadItemFromBackend(newKey);
        } else {
          stores.layout().showSendFailure = true;
        }
      }
    },

    /**
     * Set the correction status of the current item
     * @param status
     */
    async setCurrentGradingPoints(points) {
      this.currentItem.grading_points = points;
      await storage.setItem(this.currentItem.getKey(), JSON.stringify(this.currentItem.getData()));
    },

    /**
     * Update the first, last, previous and next key
     */
    updateCurrentKeys() {
      if (this.countItems) {
        const sorted = this.sortedItems;
        const first = 0;
        const last = sorted.length -1;

        this.firstKey = sorted[first]?.getKey();
        this.lastKey = sorted[last]?.getKey();
        this.previousKey = null;
        this.nextKey = null;

        for (let i = first; i <= last; i++) {
          let item = sorted[i];
          if (item?.getKey() == this.currentKey) {
            this.previousKey = i > first ? sorted[i - 1].getKey() : null;
            this.nextKey = i < last ? sorted[i + 1].getKey() : null;
            break;
          }
        }
      }
    }
  }
});
