/**
 * Snippets Store
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import Snippet from "@/data/Snippet";
import Change from "@/data/Change";

const storage = getStorage('snippets');
const whitespaceChars = " \n\r";
const triggerChars = ",;. :-_#‘*+~^°!“$%&/()=?`´{[]}€µ \n\r";

export const useSnippetsStore = defineStore('snippets', {
  state: () => {
    return {
      // saved in storage
      snippets: {},             // list of snippet objects

      // not saved in storage
      selection_open: false,          // selection dialog is open
      open_for_purpose: null,         // purpose for which the selection is opened
      open_for_key: null,             // comment key for which the selection is opened
      open_text: '',
      insert_text: '',                // text that should be inserted

      select: null,                   // data model for selection in Snippets component
      edit: new Snippet(),            // data model for editing in Snippets component

      list_purpose: Snippet.FOR_COMMENT, // purpose for which the list is opened
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    autoFrom(state) {
      return state.auto_from
    },

    autoTo(state) {
      return state.auto_to
    },

    sortedSnippets(state) {
      return Object.values(state.snippets).sort(Snippet.order);
    },

    forList(state) {
      switch (state.list_purpose) {
        case Snippet.FOR_COMMENT:
          return state.forComment;
        case Snippet.FOR_SUMMARY:
          return state.forSummary;
        default:
          return Object.values(state.snippets);
      }
    },

    forComment(state) {
      return Object.values(state.snippets).filter(element => element.purpose == Snippet.FOR_COMMENT);
    },

    forSummary(state) {
      return Object.values(state.snippets).filter(element => element.purpose == Snippet.FOR_SUMMARY);
    },

    has(state) {

      /**
       * Get a snippet by its key
       *
       * @param {string} key
       * @returns {object|null}
       */
      const fn = function (key) {
        return Object.keys(state.snippets).includes(key);
      }
      return fn;
    },

    get(state) {

      /**
       * Get a snippet by its key
       *
       * @param {string} key
       * @returns {object|null}
       */
      const fn = function (key) {
        return state.snippets[key];
      }
      return fn;
    },
  },

  actions: {

    openSelection(for_purpose, for_key, open_text = '') {
      this.open_for_purpose = for_purpose;
      this.open_for_key = for_key;
      this.open_text = open_text;
      this.insert_text = '';
      this.selection_open = true;
    },

    async clearStorage() {
      try {
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
      this.$reset();
    },

    async loadFromStorage() {
      try {
        this.$reset();

        const keys = await storage.getItem('keys');
        for (const key of keys ?? []) {
          this.snippets[key] = new Snippet(await storage.getItem(key));
        }

      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data) {
      try {
        await storage.clear();
        this.$reset();

        for (const snippet_data of data) {
          const snippet = new Snippet(snippet_data);
          await storage.setItem(snippet.key, snippet.getData());
          this.snippets[snippet.key] = snippet;
        }
        await storage.setItem('keys', Object.keys(this.snippets));
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Sort the list of snippets
     */
    sortSnippets() {
      const sorted = {};
      for (const snippet of this.sortedSnippets) {
        sorted[snippet.key] = snippet;
      }
      this.snippets = sorted;
    },

    /**
     * Create an snippet in the store
     * @param {Snippet} snippet
     * @public
     */
    async createSnippet(snippet) {
      // first do state changes (trigger watchers)
      this.snippets[snippet.key] = snippet;

      // then save the snippet
      await storage.setItem(snippet.key, snippet.getData());
      await storage.setItem('keys', Object.keys(this.snippets));

      const changesStore = stores.changes();
      await changesStore.setChange(new Change({
        type: Change.TYPE_SNIPPETS,
        action: Change.ACTION_SAVE,
        key: snippet.key
      }))
    },

    /**
     * Update an snippet in the store
     * @param {Snippet} snippet
     * @public
     */
    async updateSnippet(snippet) {

      if (this.has(snippet.key)) {
        await storage.setItem(snippet.key, snippet.getData());
        const changesStore = stores.changes();
        await changesStore.setChange(new Change({
          type: Change.TYPE_SNIPPETS,
          action: Change.ACTION_SAVE,
          key: snippet.key
        }))
      }
    },

    /**
     * Delete an snippet
     * @param {string} removeKey
     * @private
     */
    async deleteSnippet(removeKey) {
      if (this.has(removeKey)) {
        delete this.snippets[removeKey];
        await storage.removeItem(removeKey);
        await storage.setItem('keys', Object.keys(this.snippets));

        const changesStore = stores.changes();
        await changesStore.setChange(new Change({
          type: Change.TYPE_SNIPPETS,
          action: Change.ACTION_DELETE,
          key: removeKey
        }));
      }
    },

    /**
     * Get all changed snippets from the storage as flat data objects
     * This is called for sending the summaries to the backend
     * @param {integer} sendingTime - timestamp of the sending or 0 to get all
     * @return {array} Change objects
     */
    async getChangedData(sendingTime = 0) {
      const changesStore = stores.changes();
      const changes = [];
      for (const change of changesStore.getChangesFor(Change.TYPE_SNIPPETS, sendingTime)) {
        const data = await storage.getItem(change.key);
        if (data) {
          changes.push(changesStore.getChangeDataToSend(change, data));
        } else {
          changes.push(changesStore.getChangeDataToSend(change));
        }
      }
      return changes;
    },

    /**
     * Check if text can be replaced when a char is entered
     * - the char must be a special one to trigger the replacement
     * - search text is extracted between the last whitespace char and the entered char
     * - an entered whitespace is not included in the search
     * - other triggering chars are included
     *
     * @param {string} purpose   purpose of the snippets to search
     * @param {string} text   last entered character
     * @param {string} key   last entered character
     * @return {string|null}
     */
    autoReplace(purpose, text, position) {

      // set position at last entered character
      position--;
      const char = text.charAt(position);

      if (triggerChars.includes(char)) {
        if (whitespaceChars.includes(char)) {
          // exclude the whitespace char from replacement
          position--;
        }

        let start = position;
        let search = null;

        while (start >= 0) {
          if (start == 0) {
            search = text.slice(0, position + 1);
            break;
          }
          else if (whitespaceChars.includes(text.charAt(start))) {
            start++;
            search = text.slice(start, position + 1);
            break;
          }
          start--;
        }
        console.log('search', '[' + search + ']');

        if (search) {
          for (const snippet of this.forComment) {
            if (snippet.shortcut == search) {
              text = text.slice(0, start) + snippet.text + text.slice(position + 1);
              return text;
            }
          }
        }
      }



      return null;
    },
  }
});
