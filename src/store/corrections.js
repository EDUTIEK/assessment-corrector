/**
 * Corrections Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Correction from '@/data/Correction';
import i18n from "@/plugins/i18n";

const storage = getStorage('corrections');
const { t } = i18n.global;

export const useCorrectionsStore = defineStore('corrections', {
  state: () => {
    return {
      // saved in storage
      corrections: {},         // list of correction objects for the current item

      // key of the correction of the current user for the current item
      // set when data is loaded
      ownKey: ''
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    allCorrections(state) {
      return Object.values(state.corrections)
    },

    sortedCorrections(state) {
      return state.allCorrections.sort(Correction.order);
    },

    countCorrections(state) {
      return state.allCorrections.length
    },

    correctionKeys(state) {
      return Object.keys(state.corrections)
    },

    firstCorrection(state) {
      return state.allCorrections.find(element => element.position == Correction.POSITION_FIRST) ?? null;
    },

    secondCorrection(state) {
      return state.allCorrections.find(element => element.position == Correction.POSITION_SECOND) ?? null;
    },

    stitchCorrection(state) {
      return state.allCorrections.find(element => element.position == Correction.POSITION_STITCH) ?? null;
    },

    /**
     * Get the correction of the current user for the current item
     * @returns {Correction|null}
     */
    ownCorrection(state) {
      return state.allCorrections.find(element => element.key == state.ownKey) ?? null
    },

    /**
     * Get the first correction of another corrector
     * @param state
     * @returns {Correction|null}
     */
    firstOtherCorrection(state) {
      return state.allCorrections.sort(Correction.order).find(element => element.key != state.ownKey) ?? null;
    },

    /**
     * Get a list of correction objects for other Corrections
     * @param state
     * @returns {Correction[]}
     */
    otherCorrections(state) {
      return state.allCorrections
        .filter(element => element.key != state.ownKey)
        .sort(Correction.order);
    },

    getCorrection(state) {

      /**
       * Get a correction object by its correction_key
       * @param {string}  correction_key  - key of the correction
       * @return {Correction|null}
       */
      const fn = function (correction_key) {
        return state.corrections[correction_key]
      }
      return fn;
    },
  },

  actions: {

    async clearStorage() {
      try {
        await storage.clear();
        this.$reset();
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
          this.corrections[key] = new Correction(await storage.getItem(key));
        }
        this.updateOwnKey();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data = []) {
      try {
        await storage.clear();
        this.$reset();

        for (const item of data) {
          const correction = new Correction(item);
          this.corrections[correction.getKey()] = correction;
          await storage.setItem(correction.getKey(), correction.getData());
        }
        await storage.setItem('keys', Object.keys(this.corrections));
        this.updateOwnKey();
      }
      catch (err) {
        console.log(err);
      }
    },


    updateOwnKey() {
        const apiStore = stores.api();
        for (const correction of Object.values(this.corrections)) {
          if (correction.item_key == apiStore.itemKey
            && correction.user_id == parseInt(apiStore.userId)) {
            this.ownKey = correction.key;
            break;
          }
        }
    }
  }
});
