/**
 * Essay Store
 * Handles the essay to be corrected
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";

const storage = getStorage('essay');

export const useEssayStore = defineStore('essay', {
  state: () => {
    return {
      // saved in storage
      text: null,             // processed essay text
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
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
        const data = await storage.getItem('essay');
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data) {
      try {
        await storage.setItem('essay', data);
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }
    },
  }
});
