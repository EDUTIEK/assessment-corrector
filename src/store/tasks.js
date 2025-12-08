/**
 * Tasks Store
 * handles the list of the writing task
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Task from "@/data/Task";
import Item from "@/data/Item";

const storage = getStorage('tasks');

export const useTasksStore = defineStore('tasks', {
  state: () => {
    return {
      // saved in storage
      tasks: {},              // all task objects, indexed by string key

      // not saved
      firstKey: null,
      lastKey: null,
      previousKey: null,
      nextKey: null,
    };
  },

  getters: {
    countTasks(state) {
      return Object.keys(state.tasks).length;
    },
    currentKey(state) {
      return Task.buildKey(Item.extractTaskId(stores.api().itemKey));
    },
    currentTask(state) {
      return state.tasks[state.currentKey];
    },
    currentTitle(state) {
      return state.currentTask?.title;
    },
    hasInstructions(state) {
      return !!state.currentTask?.instructions;
    },
    hasSolution(state) {
      return !!state.currentTask?.solution;
    },
    hasTexts(state) {
      return state.hasInstructions || state.hasSolution;
    },
    sortedTasks(state) {
      return Object.values(state.tasks).toSorted(Task.order);
    },
    taskIds(state) {
      let ids = [];
      for (const task of state.sortedTasks) {
        ids.push(task.task_id);
      }
      return ids;
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
          this.tasks[key] = new Task(await storage.getItem(key));
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
          const task = new Task(item);
          this.tasks[task.getKey()] = task;
          await storage.setItem(task.getKey(), task.getData());
        }
        await storage.setItem('keys', Object.keys(this.tasks));
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Update the first, last, previous and next key
     */
    updateCurrentKeys() {
      if (this.countTasks) {
        const sorted = this.sortedTasks;
        const first = 0;
        const last = sorted.length -1;

        this.firstKey = sorted[first].getKey();
        this.lastKey = sorted[last].getKey();
        this.previousKey = null;
        this.nextKey = null;

        for (let i = first; i <= last; i++) {
          let task = sorted[i];
          if (task.getKey() == this.currentKey) {
            this.previousKey = i > first ? sorted[i - 1].getKey() : null;
            this.nextKey = i < last ? sorted[i + 1].getKey() : null;
            break;
          }
        }
      }
    }
  }
});
