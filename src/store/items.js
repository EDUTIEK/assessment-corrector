/**
 * Items Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Item from '@/data/Item';

const storage = getStorage('items');

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
      if (stores.api().itemKey) {
        const task_id = Item.extractTaskId(stores.api().itemKey)
        return Object.values(state.items)
            .filter(item => item.task_id == task_id)
            .toSorted(Item.order);
      } else {
        return Object.values(state.items).toSorted(Item.order);
      }
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
        if (!(await stores.changes().hasChangesInStorage()) || await stores.api().saveChangesToBackend(true)) {
          await stores.api().loadItemFromBackend(newKey);
        } else {
          stores.layout().showSendFailure = true;
        }
      }
    },

    /**
     * Update the first, last, previous and next key
     */
    updateCurrentKeys() {
      if (this.countItems) {
        const sorted = this.sortedItems;
        const first = 0;
        const last = sorted.length -1;

        this.firstKey = sorted[first].getKey();
        this.lastKey = sorted[last].getKey();
        this.previousKey = null;
        this.nextKey = null;

        for (let i = first; i <= last; i++) {
          let item = sorted[i];
          if (item.getKey() == this.currentKey) {
            this.previousKey = i > first ? sorted[i - 1].getKey() : null;
            this.nextKey = i < last ? sorted[i + 1].getKey() : null;
            break;
          }
        }
      }
    }
  }
});
