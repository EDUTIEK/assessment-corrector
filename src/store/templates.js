/**
 * Templates Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import i18n from "@/plugins/i18n";
import Template from "@/data/Template";

const storage = getStorage('templates');
const { t } = i18n.global;

export const useTemplateStore = defineStore('templates', {
  state: () => {
    return {
      // saved in storage
      templates: {},         // list of templates
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    currentTemplate(state) {
      return state.templates[stores.tasks().currentKey];
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
          this.templates[key] = new Template(await storage.getItem(key));
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
          const template = new Template(item);
          this.templates[template.getKey()] = template;
          await storage.setItem(template.getKey(), template.getData());
        }
        await storage.setItem('keys', Object.keys(this.templates));
      }
      catch (err) {
        console.log(err);
      }
    },

  }
});
