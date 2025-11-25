import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Summary from "@/data/Summary";
import Change from "@/data/Change";
import i18n from "@/plugins/i18n";

const { t } = i18n.global;

const storage = getStorage('summaries');

// set check interval very short to update the grade level according the points
const checkInterval = 200;      // time (ms) to wait for a new update check (e.g. 0.2s to 1s)

const startState = {
  // saved in storage
  summaries: {},              // list of all summary objects for the current item, indexed by key

  // not saved in storage
  editSummary: new Summary(), // summary of the currector correction that is actively edited
  lastCheck: 0,               // timestamp (ms) of the last check if an update needs a storage
}

let lockUpdate = 0;             // prevent updates during a processing

/**
 * Summaries Store
 */
export const useSummariesStore = defineStore('summaries', {
  state: () => {
    return startState;
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    allSummaries(state) {
      return Object.values(state.summaries);
    },

    /**
     * Is an editing of the current correction and item disabled
     * @return {bool}
     */
    isOwnDisabled(state) {
      return state.editSummary.correction_key == '' || !state.editSummary.isChangeable()
    },

    /**
     * Is the current correction pregraded
     * @returns {bool}
     */
    isOwnPregraded(state) {
      return state.editSummary.isPregraded();
    },

    /**
     * Is the summary of the current correction and item authorized
     * @returns {bool}
     */
    isOwnAuthorized(state) {
      return state.editSummary.isAuthorized();
    },

    isOneAuthorized(state) {
      for (const summary of state.allSummaries) {
        if (summary.isAuthorized()) {
          return true;
        }
      }
      return false;
    },

    areOthersAuthorized(state) {
      for (const summary of state.allSummaries) {
        if (summary.getKey() != state.editSummary.getKey() && !summary.isAuthorized()) {
          return false;
        }
      }
      return true;
    },

    /**
     * Resulting grade title from the summary of the current correction and item
     * @returns {string}
     */
    currentGradeTitle(state) {
      if (state.editSummary.grade_key) {
        const levelsStore = stores.levels();
        let level = levelsStore.getLevel(state.editSummary.grade_key);
        if (level) {
          return level.title;
        }
      }
      return t('summariesNoGrade');
    },

    getAuthorizationForCorrection(state) {
      /**
       * Get a summary of a specific correction for the current item
       * @param {string} correction_key
       * @returns {bool}
       */
      const fn = function (correction_key) {
        for (const summary of state.allSummaries) {
          if (summary.correction_key == correction_key) {
            return summary.isAuthorized();
          }
        }
        return false;
      }
      return fn;
    },

    getForCorrection(state) {

      /**
       * Get a summary of a specific correction for the current item
       * @param {string} correction_key
       * @returns {Summary}
       */
      const fn = function (correction_key) {
        for (const summary of state.allSummaries) {
          if (summary.correction_key == correction_key) {
            return summary;
          }
        }
        return null;
      }
      return fn;
    },


    /**
     * Text why a stitch decision will be needed the current item
     * @returns {string}
     */
    stitchReasonText(state) {
      let min_points = null;
      let max_points = null;
      let sum_points = 0;
      let count_points = 0;

      // loop over all summaries for the current correction item
      for (const summary of state.allSummaries) {
        const points = summary.points;
        if (points !== null) {
          sum_points += points;
          count_points++;

          if (min_points === null || points < min_points) {
            min_points = points;
          }
          if (max_points === null || points > max_points) {
            max_points = points;
          }
        }
      }

      if (count_points == 0) {
        return '';
      }

      const settingsStore = stores.settings();
      if (settingsStore.Assessment.procedure_when_distance) {
        if (max_points - min_points > settingsStore.Assessment.max_auto_distance) {
          return t('summariesPointsDifferenceExceedsN', [settingsStore.Assessment.max_auto_distance]);
        }
      }

      return '';
    },

    /**
     * Minimum points all summaries for the current item
     * @returns {number|null}
     */
    minPoints(state) {
      let minPoints = null;
      for (const summary of state.allSummaries) {
        const points = summary.points;
        if (minPoints === null || points < minPoints) {
          minPoints = points;
        }
      }
      return minPoints;
    },

    /**
     * Maximum points all summaries for the current item
     * @returns {number|null}
     */
    maxPoints(state) {
      let maxPoints = null;
      for (const summary of state.allSummaries) {
        const points = summary.points;
        if (maxPoints === null || points > maxPoints) {
          maxPoints = points;
        }
      }
      return maxPoints;
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

    /**
     * Load the summaries data from the storage
     * Only the summaries of the current item are loaded to the state
     *
     * @public
     */
    async loadFromStorage() {
      const apiStore = stores.api();
      const correctionsStore = stores.corrections();
      try {
        this.$reset();

        const keys = await storage.getItem('keys');
        for (const key of keys) {
          const summary = new Summary(await storage.getItem(key));
          if (summary.item_key == apiStore.itemKey) {
            this.summaries[key] = summary;
          }
          if (summary.correction_key == correctionsStore.ownKey) {
            this.editSummary = summary.getClone();
          }
        }

      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      apiStore.setInterval('summariesStore.updateContent', this.updateContent, checkInterval);
    },

    /**
     * Load the summaries data from the backend
     *
     * All keys and summaries are put to the storage
     * Only the summaries of the current item are loaded to the state
     *
     * @param {array} data - array of plain objects
     * @public
     */
    async loadFromBackend(data) {
      const apiStore = stores.api();
      const correctionsStore = stores.corrections();
      try {
        await storage.clear();
        this.$reset();

        for (const item of data) {
          const summary = new Summary(item);
          await storage.setItem(summary.getKey(), summary.getData());
          if (summary.item_key == apiStore.itemKey) {
            this.summaries[summary.getKey()] = summary;
          }
          if (summary.correction_key == correctionsStore.ownKey) {
            this.editSummary = summary.getClone();
          }
        }
        await storage.setItem('keys', Object.keys(this.summaries));
      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      apiStore.setInterval('summariesStore.updateContent', this.updateContent, checkInterval);
    },

    /**
     * Update the stored content
     * Triggered from the editor component when the content is changed
     * Triggered every checkInterval
     */
    async updateContent(fromEditor = false, force = false) {

      const storedSummary = this.summaries[this.editSummary.getKey()] ?? new Summary();

      // don't update if not changeable
      if (!storedSummary.isChangeable()) {
        return;
      }

      // avoid too many checks
      const currentTime = Date.now();
      if ((currentTime - this.lastCheck < checkInterval) && !force) {
        return;
      }

      // avoid parallel updates
      // no need to wait because updateContent is called by interval
      // use post-increment for test-and set
      if (lockUpdate++ && !force) {
        return;
      }

      // limit the points
      const settingsStore = stores.settings();
      if (isNaN(this.editSummary.points)) {
        this.editSummary.points = null;
      } else if (this.editSummary.points < 0) {
        this.editSummary.points = 0;
      } else if (this.editSummary.points > settingsStore.Assessment.max_points) {
        this.editSummary.points = settingsStore.Assessment.max_points;
      } else if (!Number.isInteger(this.editSummary.points) && settingsStore.Assessment.no_manual_decimals) {
        this.editSummary.points = Math.floor(this.editSummary.points);
      }

      // set the grade key for the points
      const levelsStore = stores.levels();
      let level = levelsStore.getLevelForPoints(this.editSummary.points);
      if (level) {
        this.editSummary.grade_key = level.key
      } else {
        this.editSummary.grade_key = '';
      }

      try {
        // ensure it is not changed because it is bound to tiny
        const clonedSummary = this.editSummary.getClone();

        if (!clonedSummary.isEqual(storedSummary) && this.keys.includes(clonedSummary.getKey())) {
          const apiStore = stores.api();
          const changesStore = stores.changes();

          clonedSummary.last_change = apiStore.getServerTime(Date.now());

          this.editSummary.setData(clonedSummary.getData());
          this.summaries[clonedSummary.getKey()] = clonedSummary;

          await storage.setItem(storedSummary.getKey(), clonedSummary.getData());
          await changesStore.setChange(new Change({
            type: Change.TYPE_SUMMARY,
            action: Change.ACTION_SAVE,
            key: clonedSummary.getKey(),
            item_key: clonedSummary.item_key
          }))

          console.log(
            "Save Change ",
            "| Editor: ", fromEditor,
            "| Duration:", Date.now() - currentTime, 'ms');

        }
        // set this here
        this.lastCheck = currentTime;
      }
      catch (error) {
        console.error(error);
      }

      lockUpdate = 0;
    },

    /**
     * Get all changed summaries from the storage as flat data objects
     * These may include summaries of other items that are only in the storage
     * This is called for sending the summaries to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const apiStore = stores.api();
      const changesStore = stores.changes();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_SUMMARY, sendingTime)) {
        const data = await storage.getItem(change.key);
        changes.push(apiStore.getChangeDataToSend(change, data));
      }
      return changes;
    },

    /**
     * Set the own current summary as authorized
     */
    async setOwnAuthorized() {
      this.editSummary.status = Summary.STATUS_AUTHORIZED;
      await this.updateContent(false, true);
    },

  }
});
