/**
 * Levels Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import GradeLevel from "@/data/GradeLevel";

const storage = getStorage('levels');
export const useLevelsStore = defineStore('levels', {
  state: () => {
    return {
      // saved in storage
      levels: {},             // list of level objects
    };
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    hasLevels: state => Object.keys(state.levels).length > 0,
    sortedLevels: state => Object.values(state.levels).toSorted(GradeLevel.order),

    getLevel(state) {

      /**
       * Get a level by its key
       *
       * @param {string} key
       * @returns {object|null}
       */
      const fn = function (key) {
        return state.levels[key];
      }
      return fn;
    },

    getLevelForPoints(state) {

      /**
       * Get the level for reached points
       *
       * @param {number} points
       * @returns {null}
       */
      const fn = function (points) {
        if (points === null) {
          return null;
        }

        let found = null;
        for (const level of state.sortedLevels) {
          if (level.min_points > points) {
            break;
          }
          found = level;
        }
        return found;
      }
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
          this.levels[key] = new GradeLevel(await storage.getItem(key));
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
          const level = new GradeLevel(item);
          this.levels[level.getKey()] = level;
          await storage.setItem(level.getKey(), level.getData());
        }
        await storage.setItem('keys', Object.keys(this.levels));
      }
      catch (err) {
        console.log(err);
      }
    },
  }
});
