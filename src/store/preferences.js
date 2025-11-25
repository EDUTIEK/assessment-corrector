/**
 * Preferences Store
 * Stores local setings done by the corrector
 * These settings are not yet sent to the backend
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Summary from '@/data/Summary';
import Change from '@/data/Change';

const storage = getStorage('preferences');
const startState = {
  // saved in storage
  essay_page_zoom: 0.25,                              // zoom of a pdf page display
  essay_text_zoom: 1,                                 // zoom of an essay text display
  summary_text_zoom: 1,                               // zoom in the editor of the correction summary
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => {
    return startState;
  },

  getters: {
  },

  actions: {

    async clearStorage() {
      try {
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
      this.$reset();
    },

    async loadFromStorage() {
      try {
        const data = await storage.getItem('preferences');
        if (data) {
          this.$patch(data);
        }
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
        this.$patch(data);
        this.sent = true;
        await this.saveToStorage();

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
      if (apiStore.correctorKey) {
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
      const apiStore = stores.api();
      const changesStore = stores.changes();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_PREFERENCES, sendingTime)) {
        // preferences exist only once, will be the same for all changes
        changes.push(apiStore.getChangeDataToSend(change, Object.assign({}, this.$state)));
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
    }
  },
});
