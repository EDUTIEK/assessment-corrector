/**
 * Essay Store
 * Handles the essay to be corrected
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import axios from "axios";

const storage = getStorage('essay');

export const useEssayStore = defineStore('essay', {
  state: () => {
    return {
      // saved in storage
      id: null,
      text: null,             // processed essay text
      pdf_version: null,
      url: null
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    hasPdf(state) {
      return state.pdf_version !== null;
    }
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
        this.handleFile(data);
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data) {
      try {
        this.handleFile(data);
        await storage.setItem('essay', data);
        this.$patch(data);
      }
      catch (err) {
        console.log(err);
      }
    },

    handleFile(data) {
      if (data['pdf_version'] && stores.settings().markingInPdf) {
        data['url'] = stores.api().getEssayUrl(data['id']);
        this.fetchFile(data['url']);
      }
    },

    async fetchFile(url) {
      try {
        console.log('preload essay pdf ...');
        await axios(url, {responseType: 'blob', timeout: 60000});
        // resource.objectUrl = URL.createObjectURL(response.data)
        console.log('finished. ');
      } catch (error) {
        console.error(error);
      }
    }
  }

});
