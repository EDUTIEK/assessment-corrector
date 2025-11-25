/**
 * Criteria Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Criterion from '@/data/Criterion'

const storage = getStorage('criteria');

export const useCriteriaStore = defineStore('criteria', {
  state: () => {
    return {
      // saved in storage
      keys: [],                 // list of string keys
      criteria: [],             // list of criterion objects
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    hasCommentCriteria: state => {
      const correctionsStore = stores.corrections();
      const correctionKeys = correctionsStore.correctionKeys;
      return !!state.criteria.find(criterion => !criterion.is_general && (criterion.correction_key == '' || correctionKeys.includes(
          criterion.correction_key)));
    },

    hasOwnCriteria: state => {
      const apiStore = stores.api();
      return !!state.criteria.find(criterion => criterion.correction_key == '' || criterion.correction_key == stores.corrections().ownKey);
    },

    hasOwnGeneralCriteria: state => {
      const apiStore = stores.api();
      return !!state.criteria.find(criterion => criterion.is_general && (criterion.correction_key == '' || criterion.correction_key == stores.corrections().ownKey));
    },

    hasOwnCommentCriteria: state => {
      const apiStore = stores.api();
      return !!state.criteria.find(criterion => !criterion.is_general && (criterion.correction_key == '' || criterion.correction_key == stores.corrections().ownKey));
    },

    ownCriteria: state => {
      const apiStore = stores.api();
      return state.criteria.filter((criterion => criterion.correction_key == '' || criterion.correction_key == stores.corrections().ownKey));
    },

    getCriterion: state => {

      /**
       * Get a criterion by its key
       *
       * @param {string }key
       * @returns {Criterion|null}
       */
      const fn = function (key) {
        return state.criteria.find(element => element.key == key)
      }
      return fn;
    },

    getCorrectionHasCriteria: state => {

      /**
       * Get if a correction has criteria at all
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return !!state.criteria.find(criterion =>
            (criterion.correction_key == '' || criterion.correction_key == correction_key));
      };
      return fn;
    },


    getCorrectionHasGeneralCriteria: state => {

      /**
       * Get if a correction has general criteria defined
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return !!state.criteria.find(criterion => criterion.is_general &&
            (criterion.correction_key == '' || criterion.correction_key == correction_key));
      };
      return fn;
    },

    getCorrectionHasCommentCriteria: state => {

      /**
       * Get if a correction has comments related criteria defined
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return !!state.criteria.find(criterion => !criterion.is_general &&
            (criterion.correction_key == '' || criterion.correction_key == correction_key));
      };
      return fn;
    },


    getCorrectionGeneralCriteria: state => {

      /**
       * Get the general criteria of a correction
       *
       * @param correction_key
       * @returns {Criterion[]}
       */
      const fn = function (correction_key) {
        return state.criteria.filter(criterion => criterion.is_general &&
            (criterion.correction_key == '' || criterion.correction_key == correction_key));
      };
      return fn;
    },


    getCorrectionCommentCriteria: state => {

      /**
       * Get the comments related criteria of a correction
       *
       * @param correction_key
       * @returns {Criterion[]}
       */
      const fn = function (correction_key) {
        return state.criteria.filter(criterion => !criterion.is_general &&
            (criterion.correction_key == '' || criterion.correction_key == correction_key));
      };
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

    async loadFromStorage() {
      try {
        this.$reset();

        const keys = await storage.getItem('criterionKeys');
        if (keys) {
          this.keys = JSON.parse(keys);
        }

        for (const key of this.keys) {
          const criterion = await storage.getItem(key);
          this.criteria.push(criterion);
        }

      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data) {
      try {
        await storage.clear();
        this.$reset();

        for (const criterion_data of data) {
          const criterion = new Criterion(criterion_data);
          this.criteria.push(criterion);
          this.keys.push(criterion.key);
          await storage.setItem(criterion.key, criterion.getData());
        }

        await storage.setItem('criterionKeys', JSON.stringify(this.keys));
      }
      catch (err) {
        console.log(err);
      }
    }
  }
});
