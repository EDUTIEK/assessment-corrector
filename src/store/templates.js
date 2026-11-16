/**
 * Templates Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import i18n from "@/plugins/i18n";
import Template from "@/data/Template";
import Summary from '@/data/Summary';
import Change from '@/data/Change';
import Task from '@/data/Task';

const storage = getStorage('templates');
const { t } = i18n.global;

// set check interval very short to update the grade level according the points
const checkInterval = 1000;      // time (ms) to wait for a new update check (e.g. 0.2s to 1s)
const forceInterval = 60000;    // max time to wait for a new update check if update check is locked

let lockUpdate = 0;             // prevent updates during a processing

export const useTemplateStore = defineStore('templates', {
  state: () => {
    return {
      // saved in storage
      templates: {},         // list of templates

      // not saved in storage
      editTemplate: new Template(), // template that is actively edited
      lastCheck: 0,                 // timestamp (ms) of the last check if an update needs a storage
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
        this.$reset();
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromStorage() {
      const apiStore = stores.api();

      try {
        this.$reset();

        const keys = await storage.getItem('keys') ?? [];
        for (const key of keys) {
          this.templates[key] = new Template(await storage.getItem(key));
        }
        this.setEditTemplate();
      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      console.log('set storage interval');
      apiStore.setInterval('assessment', 'templatesStore.updateContent', this.updateContent, checkInterval);
    },

    async loadFromBackend(data = []) {
      const apiStore = stores.api();

      try {
        await storage.clear();
        this.$reset();

        for (const item of data) {
          const template = new Template(item);
          this.templates[template.getKey()] = template;
          await storage.setItem(template.getKey(), template.getData());
        }
        await storage.setItem('keys', Object.keys(this.templates));
        this.setEditTemplate();
      }
      catch (err) {
        console.log(err);
      }

      lockUpdate = 0;
      console.log('set bachend interval');
      apiStore.setInterval('assessment', 'templatesStore.updateContent', this.updateContent, checkInterval);
    },

    setEditTemplate(task_key = null) {
      if (task_key === null) {
        task_key = stores.tasks().sortedTasks[0]?.getKey();
      }
      if (this.editTemplate.getKey() !== task_key && this.templates[task_key]) {
        this.editTemplate = this.templates[task_key].getClone();
      }
    },

    /**
     * Update the stored content
     * Triggered from the editor component when the content is changed
     * Triggered every checkInterval
     */
    async updateContent(fromEditor = false, forced = false) {
      const apiStore = stores.api();
      const changesStore = stores.changes();

      // avoid too many checks
      const currentTime = Date.now();
      if (!forced && currentTime - this.lastCheck < checkInterval) {
        return;
      }

      // force a check if update is locked for too long
      if (!forced && currentTime - this.lastCheck > forceInterval) {
        forced = true;
      }

      // avoid parallel updates
      // no need to wait because updateContent is called by interval
      // use post-increment for test-and set
      if (forced) {
        lockUpdate++;
      } else if (lockUpdate++) {
        return;
      }

      // use a clone to avoid conflict with ongoing inputs
      const storedTemplate = this.templates[this.editTemplate.getKey()]
        ?? new Template({task_id: Task.extractTaskId(this.editTemplate.getKey())});
      const clonedTemplate = this.editTemplate.getClone();
      if (clonedTemplate.isEqual(storedTemplate)) {
        this.lastCheck = currentTime;
        lockUpdate = 0;
        return;
      }

      try {
        this.templates[clonedTemplate.getKey()] = clonedTemplate;

        await storage.setItem(clonedTemplate.getKey(), clonedTemplate.getData());
        await changesStore.setChange(new Change({
          type: Change.TYPE_TEMPLATE,
          action: Change.ACTION_SAVE,
          key: clonedTemplate.getKey(),
        }))

        console.log(
          "Save Change ",
          "| Editor: ", fromEditor,
          "| Duration:", Date.now() - currentTime, 'ms');
      }
      catch (error) {
        console.error(error);
      }

      this.lastCheck = currentTime;
      lockUpdate = 0;
    },

    /**
     * Get all changed templates from the storage as flat data objects
     * This is called for sending the templates to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const changesStore = stores.changes();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_TEMPLATE, sendingTime)) {
        const data = await storage.getItem(change.key);
        changes.push(changesStore.getChangeDataToSend(change, data));
      }
      return changes;
    },
  }
});
