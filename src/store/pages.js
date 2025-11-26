/**
 * Pages Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import axios from 'axios';
import Page from '@/data/Page';

const storage = getStorage('pages');

export const usePagesStore = defineStore('pages', {
  state: () => {
    return {
      // saved in storage
      pages: {},                      // collection of page objects for the current correction item, indexed by key

      // not saved in storage
      selectedKey: '',                // key of the currently selected page
      minPage: 0,                     // minimum page number
      maxPage: 0,                     // maximum page number
      loadedThumbs: 0,                // counter of loaded thumbnails
      loadedImages: 0,                // counter of loaded images
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    hasPages(state) {
      return Object.keys(state.pages).length > 0;
    },

    selectedPage(state) {
      return state.pages[state.selectedKey] ?? null;
    },

    selectedPageNo(state) {
      return state.selectedPage?.page_no ?? null;
    },

    currentPages(state) {
      return Object.values(state.pages);
    },

    getPage(state) {

      /**
       * Get a page by its key
       *
       * @param {string] }key
       * @returns {Page|null}
       */
      const fn = function (key) {
        return state.pages[key] ?? null;
      }
      return fn;

    },

    getPageByPageNo(state) {

      /**
       * Get a page by its page number
       *
       * @param {string} number
       * @returns {Page|null}
       */
      const fn = function (number) {
        return state.currentPages.find(page => page.page_no == number) ?? null;
      }
      return fn;
    }

  },

  actions: {

    /**
     * Set the current page key
     * This should be called when a page is manually selected in the page navigation
     * A watcher can trigger the change and show the new page
     * @param {string} key
     * @public
     */
    selectPage(key) {
      if (this.selectedKey != key) {
        this.selectedKey = key;
      }
    },

    /**
     * Select a page by its number
     * @param number
     */
    selectByPageNo(number) {
      for (const page of this.currentPages) {
        if (page.page_no == number) {
          this.selectedKey = page.key;
          return true;
        }
      }
      return false;
    },

    calculateMinMaxPage() {

      let min = null;
      let max = null;
      for (const page of this.currentPages) {
        if (min === null || page.page_no < min) {
          min = page.page_no;
        }
        if (max === null || page.page_no > max) {
          max = page.page_no;
        }
      }

      if (min !== null) {
        this.minPage = min;
      }
      if (max !== null) {
        this.maxPage = max;
      }
    },

    /**
     * Clear the whole storage
     * @public
     */
    async clearStorage() {
      try {
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
      this.purgeFiles();
      this.$reset();
    },

    /**
     * Load the pages data from the storage
     * Only the pages of the current item are loaded to the state
     *
     * @public
     */
    async loadFromStorage() {
      const apiStore = stores.api();
      try {
        this.purgeFiles();
        this.$reset();

        const keys = await storage.getItem('keys');
        for (const key of this.keys) {
          const page = new Page(await storage.getItem(key));
          if (page.item_key == apiStore.itemKey) {
            this.pages[key] = page;
          }
        }
        this.calculateMinMaxPage();
        this.selectByPageNo(this.minPage);
        this.loadFiles();

      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Load the pages data from the backend
     *
     * @param {array} data - array of plain objects
     * @public
     */
    async loadFromBackend(data) {
      const apiStore = stores.api();
      try {
        await storage.clear();
        this.purgeFiles();
        this.$reset();

        for (const page_data of data) {
          const page = new Page(page_data);
          page.url = apiStore.getImageUrl(page);
          page.thumb_url = apiStore.getThumbUrl(page);
          if (page.item_key == apiStore.itemKey) {
            await storage.setItem(page.getKey(), page.getData());
            this.pages[page.key] = page;
          }
        }
        await storage.setItem('keys', Object.keys(this.pages));

        this.calculateMinMaxPage();
        this.selectByPageNo(this.minPage);
        this.loadFiles();
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Preload file resources (workaround until service worker is implemented)
     * The Resources Component will only show PDF resources when they are immediately available
     * This preload forces the resources being in the browser cache
     *
     * https://stackoverflow.com/a/50387899
     */
    async loadFiles() {
      try {
        for (const key in this.pages) {
          const page = this.pages[key];
          let response;

          if (page) {
            response = await axios(page.url, { responseType: 'blob', timeout: 60000 });
            // page.objectUrl = URL.createObjectURL(response.data);
            this.loadedImages++;

            response = await axios(page.thumb_url, { responseType: 'blob', timeout: 60000 });
            // page.thumbObjectUrl = URL.createObjectURL(response.data);
            this.loadedThumbs++;
          }
        }
      }
      catch (error) {
        console.error(error);
        // return false;
      }
    },

    /**
     * Purge the object urls of the page files
     */
    purgeFiles() {
      for (const key in this.pages) {
        const page = this.pages[key];
        if (page) {
          if (page.thumbObjectUrl !== null) {
            // URL.revokeObjectURL(page.thumbObjectUrl);
            page.thumbObjectUrl = null;
          }
          if (page.objectUrl !== null) {
            // URL.revokeObjectURL(page.objectUrl);
            page.objectUrl = null;
          }
        }
      }
      this.loadedThumbs = 0;
      this.loadedImages = 0;
    }
  }
});
