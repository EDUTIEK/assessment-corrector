/**
 * Criteria Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Criterion from '@/data/Criterion'
import Correction from "@/data/Correction";

const storage = getStorage('criteria');

export const useCriteriaStore = defineStore('criteria', {
  state: () => {
    return {
      criteria: {},             // list of criterion objects
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    allCriteria(state) {
      return Object.values(state.criteria)
    },

    ownCriteria(state) {
      const correction = stores.corrections().ownCorrection;
      if (correction) {
        return state.allCriteria.filter(criterion => criterion.task_id === correction.task_id
            && (criterion.corrector_id === null || criterion.corrector_id === correction.corrector_id))
      }
      return [];
    },

    hasCommentCriteria(state) {
      return !!state.allCriteria.find(criterion => !criterion.is_general);
    },

    hasOwnCriteria(state) {
      return !!state.ownCriteria;
    },

    hasOwnGeneralCriteria(state) {
      return !!state.ownCriteria.find(criterion => criterion.is_general);
    },

    hasOwnCommentCriteria(state) {
      return !!state.ownCriteria.find(criterion => !criterion.is_general);
    },

    getCorrectionCriteria(state) {

      /**
       * Get all criteria of a correction
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        const task_id = Correction.extractTaskId(correction_key);
        const corrector_id = Correction.extractCorrectorId(correction_key);

        return state.allCriteria.filter(criterion => criterion.task_id === task_id
            && (criterion.corrector_id === null || criterion.corrector_id === corrector_id))
      };
      return fn;
    },

    getCorrectionGeneralCriteria(state) {

      /**
       * Get the general criteria of a correction
       *
       * @param correction_key
       * @returns {Criterion[]}
       */
      const fn = function (correction_key) {
        return state.getCorrectionCriteria(correction_key).filter(criterion => criterion.is_general)
      };
      return fn;
    },

    getCorrectionCommentCriteria(state) {

      /**
       * Get the comments related criteria of a correction
       *
       * @param correction_key
       * @returns {Criterion[]}
       */
      const fn = function (correction_key) {
        return state.getCorrectionCriteria(correction_key).filter(criterion => !criterion.is_general)
      };
      return fn;
    },


    getCorrectionHasCriteria(state) {

      /**
       * Get if a correction has criteria at all
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return !!state.getCorrectionCriteria(correction_key)
      };
      return fn;
    },

    getCorrectionHasGeneralCriteria(state) {

      /**
       * Get if a correction has general criteria defined
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return !!state.getCorrectionGeneralCriteria(correction_key)
      };
      return fn;
    },

    getCorrectionHasCommentCriteria(state) {

      /**
       * Get if a correction has comments related criteria defined
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return !!state.getCorrectionCommentCriteria(correction_key)
      };
      return fn;
    },

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
          this.criteria[key] = new Criterion(await storage.getItem(key));
        }
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
          const criterion = new Criterion(item);
          this.criteria[criterion.getKey()] = criterion;
          await storage.setItem(criterion.getKey(), criterion.getData());
        }
        await storage.setItem('keys', Object.keys(this.criteria));
      }
      catch (err) {
        console.log(err);
      }
    },
  }
});
