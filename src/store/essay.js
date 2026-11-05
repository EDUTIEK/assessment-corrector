/**
 * Essay Store
 * Handles the essay to be corrected
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import axios from "axios";
import PdfAnnotator from '@/lib/PdfAnnotator';

const storage = getStorage('essay');
const annotator = new PdfAnnotator();

const promiseWithResolvers = () => {
  const obj = {};
  obj.promise = new Promise((ok, err) => {
    obj.resolve = ok;
    obj.reject = err;
  });
  return obj;
};

const urlSync = promiseWithResolvers();

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
    waitForUrl() {
      if (this.url) {
        return Promise.resolve(this.url);
      }
      return urlSync.promise;
    },
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

    async handleFile(data) {
      if (data['pdf_version'] && stores.settings().markingInPdf) {
        data['url'] = stores.api().getEssayUrl(data['id']);
        if (urlSync.resolve) {
          urlSync.resolve(data['url']);
          delete urlSync.resolve;
        }
        if (await stores.api().request('get', data['url'])) {
          annotator.load(data['url'], {headers: stores.api().getRequestConfig().headers});
        }
      } else {
        annotator.unload();
      }
    },

    /*async fetchFile(url) {
      try {
        console.log('preload essay pdf ...');
        const ret = stores.api().loadEssayUrl();
        await axios(url, {responseType: 'blob', timeout: 60000});
        // resource.objectUrl = URL.createObjectURL(response.data)
        console.log('finished. ');
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },*/

    /**
     * Apply the marks and comments to the essay pdf
     * @param {string } scope 'own'|'all'
     * @returns {Promise<Blob>}
     */
    async buildMarkedPdf(scope) {
      return await annotator.build(scope);
    }

  },
});
