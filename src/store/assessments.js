/**
 * Assessments Store
 * handles the list of the assessments
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Assessment from '@/data/Assessment';

const storage = getStorage('assessments');

export const useAssessmentsStore = defineStore('assessments', {
  state: () => {
    return {
      // saved in storage
      assessments: {},              // all assessment objects, indexed by string key
    };
  },

  getters: {
    countAssessments(state) {
      return Object.keys(state.assessments).length;
    },
    hasAssessments(state) {
      return state.countAssessments > 0;
    },
    currentKey(state) {
      return stores.api().assId !== '' && stores.api().contextId !== ''
        ? Assessment.buildKey(stores.api().assId, stores.api.contextId)
        : null;
    },
    currentAssessment(state) {
      return state.currentKey !== null ? state.assessments[state.currentKey] : null;
    },
    currentTitle(state) {
      return state.currentAssessment?.title;
    },
    sortedAssessments(state) {
      return Object.values(state.assessments).toSorted(Assessment.order);
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
          this.assessments[key] = new Assessment(await storage.getItem(key));
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
          const assessment = new Assessment(item);
          this.assessments[assessment.getKey()] = assessment;
          await storage.setItem(assessment.getKey(), assessment.getData());
        }
        await storage.setItem('keys', Object.keys(this.assessments));
      }
      catch (err) {
        console.log(err);
      }
    },
  }
});
