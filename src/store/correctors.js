/**
 * Correctors Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Corrector from '@/data/Corrector';
import i18n from "@/plugins/i18n";

const storage = getStorage('correctors');

const { t } = i18n.global;

export const useCorrectorsStore = defineStore('correctors', {
  state: () => {
    return {
      // saved in storage
      keys: [],               // list of all string keys of correctors in the storage
      correctors: [],         // list of corrector objects for the current item
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    countCorrectors: state => state.correctors.length,

    correctorKeys: state => {
      let keys = [];
      for (const corrector of state.correctors) {
        keys.push(corrector.corrector_key);
      }
      return keys;
    },

    /**
     * Get a list of corrector objects for other Correctors
     * @param state
     * @returns {Corrector[]}
     */
    otherCorrectors: state => {
      const apiStore = stores.api();
      return state.correctors
        .filter(element => element.corrector_key != apiStore.correctorKey)
        .sort((a, b) => a.position - b.position);
    },

    getPositionText: state => {

      /**
       * Get the corrector poition text
       * @param {string} corrector_key
       * @returns {string}
       */
      const fn = function (corrector_key) {
        if (state.correctors.length <= 1) {
          return '';
        }

        const corrector = state.correctors.find(element => element.corrector_key == corrector_key);
        if (corrector) {
          if (corrector.position == 0) {
            return t('correctorsFirstCorrector')
          } else if (corrector.position == 1) {
            return t('correctorsSecondCorrector')
          } else if (corrector.position == state.correctors.length - 1) {
            return t('correctorsLastCorrector')
          } else {
            return t('correctorsNthCorrector' [corrector.position + 1]);
          }
        }
        return ''
      }
      return fn;
    },

    getCorrector: state => {

      /**
       * Get a corrector object by its corrector_key
       * @param {string}  corrector_key  - key of the corrector
       * @return {Corrector|null}
       */
      const fn = function (corrector_key) {
        return state.correctors.find(element => element.corrector_key == corrector_key)
      }
      return fn;
    },
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

    /**
     * Load the correctors data from the storage
     * Only the pages of the current item are loaded to the state
     *
     * @public
     */
    async loadFromStorage() {
      const apiStore = stores.api();
      try {
        this.$reset();

        const keys = await storage.getItem('correctorKeys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }

        for (const key of this.keys) {
          const corrector = new Corrector(JSON.parse(await storage.getItem(key)));
          if (corrector.item_key == apiStore.itemKey) {
            this.correctors.push(corrector);
          }
        }

      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data) {

      const apiStore = stores.api();
      try {
        await storage.clear();
        this.$reset();

        for (const corrector_data of data) {
          const corrector = new Corrector(corrector_data);
          this.keys.push(corrector.getKey());
          await storage.setItem(corrector.getKey(), JSON.stringify(corrector.getData()));
          if (corrector.item_key == apiStore.itemKey) {
            this.correctors.push(corrector);
          }
        }

        await storage.setItem('correctorKeys', JSON.stringify(this.keys));
      }
      catch (err) {
        console.log(err);
      }
    },
  }
});
