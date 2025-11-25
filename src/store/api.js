/**
 * API Store
 * Handles the communication with the backend
 */
import {clearAllStores, stores} from "@/store";
import {defineStore} from 'pinia';
import axios from 'axios'
import Cookies from 'js-cookie';

import md5 from 'md5';
import Change from '@/data/Change';
import Item from '@/data/Item';

const sendInterval = 5000;      // time (ms) to wait for sending open savings to the backend

export const useApiStore = defineStore('api', {

  state: () => {
    return {
      // saved in storage
      backendUrl: '',                     // url to be used for REST calls
      returnUrl: '',                      // url to be called when the correction is closed
      userId: '',                         // identifying id of the current user
      assId: '',                          // identifying id of the assesment
      contextId: '',                      // identifying id of the context for permission checks
      itemKey: '',                        // identifying key of the correction item
      dataToken: '',                      // authentication token for transmission if data
      fileToken: '',                      // authentication token for loading files
      timeOffset: 0,                      // differnce between server time and client time (ms)

      // not saved
      intervals: {},                       // list of all registered timer intervals, indexed by their name
      lastSendingTry: 0,                  // timestamp of the last try to send changes (milliseconds)
      lastLoadingTry: 0,                  // timestamp of the last try to load data (milliseconds)
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {

    isLoading: state => state.lastLoadingTry > 0,

    storedItemKey: state => localStorage.getItem('xlasCorrectionItemKey'),

    getRequestConfig(state) {

      /**
       * Get the config object for REST requests
       *
       * @param {string} token
       * @returns {{baseURL: (string|*), responseType: string, responseEncoding: string, params: URLSearchParams, timeout: number}}
       */
      const fn = function (token) {
        let baseURL = state.backendUrl;
        let params = new URLSearchParams();

        // cut query string and set it as params
        // a REST path is added as url to the baseURL by axias calls
        let position = baseURL.search(/\?+/);
        if (position != -1) {
          params = new URLSearchParams(baseURL.substr(position))
          baseURL = baseURL.substr(0, position);
        }

        // add authentication info as url parameters
        // use signature instead of token because it is visible
        params.append('user_id', state.userId);
        params.append('ass_id', state.assId);
        params.append('context_id', state.contextId);
        params.append('signature', md5(state.userId + state.assId + state.contextId + token));

        return {
          baseURL: baseURL,
          params: params,
          timeout: 30000,             // milliseconds
          responseType: 'json',       // default
          responseEncoding: 'utf8',   // default
        }
      }
      return fn;
    },

    getResourceUrl: state => {

      /**
       * Get the Url for loading a file ressource
       * todo user resource as parameter (see writer)
       *
       * @param {string} resourceKey
       * @returns {string}
       */
      const fn = function (resourceKey) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/correction/file/task/resource/' + resourceKey + '?' + config.params.toString();
      }
      return fn;
    },

    /**
     * Get the Url for loading a page image
     */
    getImageUrl: state => {

      /**
       * Get the Url for loading a page image
       * @param {string} pageKey
       * @param {string} itemKey
       * @returns {string}
       */
      const fn = function (pageKey, itemKey) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/correction/file/essaytask/image/' + itemKey + '/' + pageKey + '?' + config.params.toString();
      }
      return fn;
    },

    getThumbUrl: state => {

      /**
       * Get the Url for loading a page thumbnail
       * @param {string} pageKey
       * @param {string} itemKey
       * @returns {string}
       */
      const fn = function (pageKey, itemKey) {
        const config = this.getRequestConfig(this.fileToken);
        return config.baseURL + '/correction/file/essaytask/thumb/' + itemKey + '/' + pageKey + '?' + config.params.toString();
      }
      return fn;
    },


    getServerTime: state => {

      /**
       * Get the server unix timestamp (s) corresponding to a client timestamp (ms)
       * @param {number} clientTime
       * @returns {number}
       */
      const fn = function (clientTime) {
        return clientTime == 0 ? 0 : Math.floor((clientTime - state.timeOffset) / 1000);
      }
      return fn;
    },

    /**
     * todo: refactor (see writer)
     */
    getChangeDataToSend: state => {

      /**
       * Get the data of a change to be sent to the backend
       * @param {Change} change
       * @param {object|null} payload
       */
      const fn = function (change, payload = null) {
        const data = change.getData();
        if (payload) {
          data.payload = payload;
        }
        data.server_time = state.getServerTime(change.last_change);
        return data;
      }
      return fn;
    }

  },

  actions: {

    /**
     * Init the state
     * Take the state from the cookies or local store
     * Trigger a reload of all data if cookie values differ from local store
     */
    async init() {

      let newContext = false;
      let newItem = false;

      // take values formerly stored
      this.backendUrl = localStorage.getItem('xlasCorrectionBackendUrl');
      this.returnUrl = localStorage.getItem('xlasCorrectionReturnUrl');
      this.userId = localStorage.getItem('xlasCorrectionUserId');
      this.assId = localStorage.getItem('xlasWriterAssId');
      this.contextId = localStorage.getItem('xlasCorrectionContextId');
      this.itemKey = localStorage.getItem('correctionItemKey');
      this.dataToken = localStorage.getItem('xlasCorrectionDataToken');
      this.fileToken = localStorage.getItem('xlasCorrectionFileToken');
      this.timeOffset = Math.floor(localStorage.getItem('xlasCorrectionTimeOffset') ?? 0);

      // check if context given by cookies differs and force a reload if neccessary
      if (Cookies.get('xlasUserId') != undefined && Cookies.get('xlasUserId') !== this.userId) {
        this.userId = Cookies.get('xlasUserId');
        newContext = true;
      }
      if (!!Cookies.get('xlasAssId') && Cookies.get('xlasAssId') !== this.assId) {
        this.assId = Cookies.get('xlasAssId');
        newContext = true;
      }
      if (Cookies.get('xlasContextId') != undefined && Cookies.get('xlasContextId') !== this.contextId) {
        this.contextId = Cookies.get('xlasContextId');
        newContext = true;
      }

      // these values just need a reload of the item
      let task_id = Item.extractTaskId(this.itemKey);
      let writer_id = Item.extractWriterId(this.itemKey);
      if (Cookies.get('xlasTaskId') != undefined && Cookies.get('xlasTaskId') !== task_id) {
        task_id = Cookies.get('xlasTaskId');
        newItem = true;
      }
      if (Cookies.get('xlasWriterId') != undefined && Cookies.get('xlasWriterId') !== writer_id) {
        writer_id = Cookies.get('xlasWriterId');
        newItem = true;
      }
      if (newItem) {
        this.itemKey = Item.buildKey(task_id, writer_id);
      }

      // these values can be changed without forcing a whole reload
      if (Cookies.get('LongEssayBackend') != undefined && Cookies.get('LongEssayBackend') !== this.backendUrl) {
        this.backendUrl = Cookies.get('LongEssayBackend');
      }
      if (Cookies.get('LongEssayReturn') != undefined && Cookies.get('LongEssayReturn') !== this.returnUrl) {
        this.returnUrl = Cookies.get('LongEssayReturn');
      }
      if (Cookies.get('LongEssayToken') != undefined && Cookies.get('LongEssayToken') !== this.dataToken) {
        this.dataToken = Cookies.get('LongEssayToken');
      }

      if (!this.backendUrl || !this.returnUrl || !this.userId || !this.assId || !this.contextId || !this.dataToken) {
        stores.layout().showInitFailure = true;
        return;
      }

      const changesStore = stores.changes();
      if (await changesStore.hasChangesInStorage()) {
        if (newContext) {
          console.log('init: open saving, new context');
          await this.loadDataFromStorage();
          stores.layout().showDataReplaceConfirmation = true;
        } else if (newItem) {
          console.log('init: open saving, same context, new item');
          await this.loadDataFromStorage();
          stores.layout().showItemReplaceConfirmation = true;
        } else {
          console.log('init: open saving, same context, same item');
          await this.loadDataFromStorage();
          this.initAfterKeepDataConfirmed();
        }
      } else {
        console.log('init: no open saving');
        this.initAfterReplaceDataConfirmed();
      }
    },

    /**
     * init after the replacement of all data is confirmed
     */
    async initAfterReplaceDataConfirmed() {
      console.log('initAfterReplaceDataConfirmed');
      stores.layout().showDataReplaceConfirmation = false;
      stores.layout().showItemReplaceConfirmation = false;

      if (await this.loadDataFromBackend()) {
        await this.loadItemFromBackend(this.itemKey);
        this.finishInitialisation();
      }
      this.updateConfig();
    },

    /**
     * init after the keeping the data of the item with open sendings
     */
    async initAfterKeepDataConfirmed() {
      console.log('initAfterKeepDataConfirmed');
      stores.layout().showDataReplaceConfirmation = false;
      stores.layout().showItemReplaceConfirmation = false;

      this.itemKey = localStorage.getItem('xlasCorrectionItemKey');
      await this.loadItemFromStorage(this.itemKey);
      const item = stores.items().getItem(this.itemKey);

      if (await this.loadDataFromBackend()) {
        await stores.items().saveItem(item);
        await this.loadItemFromStorage(this.itemKey);
        this.finishInitialisation();
      }
      this.updateConfig();
    },


    /**
     * Finish the initialisation
     * set config dependent layout states
     * start the sending timer
     */
    finishInitialisation() {

      if (stores.summaries().isOneAuthorized) {
        stores.comments().setShowOtherCorrections(true);
      }

      stores.layout().initialized = true;
    },

    /**
     * Update the app configuration
     * This is called when the initialisation can be done silently
     * Or when a confirmation dialog is confirmed
     */
    updateConfig() {
      // remove the cookies
      // needed to distinct the call from the backend from a later reload
      Cookies.remove('LongEssayBackend');
      Cookies.remove('LongEssayReturn');
      Cookies.remove('xlasUserId');
      Cookies.remove('xlasAssId');
      Cookies.remove('xlasContextId');
      Cookies.remove('xlasTaskId');
      Cookies.remove('xlasWriterId');
      Cookies.remove('LongEssayItem');
      Cookies.remove('LongEssayToken');

      localStorage.setItem('xlasCorrectionBackendUrl', this.backendUrl);
      localStorage.setItem('xlasCorrectionReturnUrl', this.returnUrl);
      localStorage.setItem('xlasCorrectionUserId', this.userId);
      localStorage.setItem('xlasCorrectionAssId', this.assId);
      localStorage.setItem('xlasCorrectionContextId', this.contextId);
      localStorage.setItem('xlasCorrectionItemKey', this.itemKey);
      localStorage.setItem('xlasCorrectionDataToken', this.dataToken);
      localStorage.setItem('xlasCorrectionFileToken', this.fileToken);
    },


    /**
     * Load all data from the storage
     */
    async loadDataFromStorage() {
      console.log("loadDataFromStorage...");
      this.setLoading(true);
      this.clearAllIntervals();

      await stores.criteria().loadFromStorage();
      await stores.items().loadFromStorage();
      await stores.layout().loadFromStorage();
      await stores.levels().loadFromStorage();
      await stores.preferences().loadFromStorage();
      await stores.resources().loadFromStorage();
      await stores.settings().loadFromStorage();
      await stores.snippets().loadFromStorage();
      await stores.tasks().loadFromStorage();


      this.setLoading(false);
      return true;
    },

    /**
     * Load the data of a new correction item from storage
     * This requires the itemKey to be set
     */
    async loadItemFromStorage(itemKey) {
      console.log("loadItemFromStorage...");
      this.setLoading(true);
      this.clearAllIntervals();

      const itemsStore = stores.items();
      if (itemKey == '' || itemsStore.getItem(itemKey) == undefined) {
        itemKey = itemsStore.firstKey
      }

      this.itemKey = itemKey;
      localStorage.setItem('itemKey', this.itemKey);

      await stores.changes().loadFromStorage();
      await stores.comments().loadFromStorage();
      await stores.corrections().loadFromStorage();
      await stores.essay().loadFromStorage();
      await stores.pages().loadFromStorage();
      await stores.points().loadFromStorage();
      await stores.summaries().loadFromStorage();

      stores.comments().setMarkerChange();
      stores.items().updateCurrentKeys();
      stores.tasks().updateCurrentKeys();
      this.setLoading(false);

      // todo activate changes interval
      //this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
      return true;
    },


    /**
     * Load common data from the backend
     */
    async loadDataFromBackend() {
      console.log("loadDataFromBackend...");

      this.setLoading(true);
      await clearAllStores();
      this.clearAllIntervals();

      let response = {};
      try {
        response = await axios.get('/data', this.getRequestConfig(this.dataToken));
        this.setTimeOffset(response);
        this.refreshToken(response);
      }
      catch (error) {
        console.error(error);
        stores.layout().showInitFailure = true;
        this.setLoading(false);
        return false;
      }
      
      await stores.layout().clearStorage();

      await stores.levels().loadFromBackend(response.data['Assessment']['GradeLevels']);
      await stores.resources().loadFromBackend(response.data['Assessment']['Resources']);
      await stores.settings().loadFromBackend('Assessment', response.data['Assessment']['Settings']);

      await stores.items().loadFromBackend(response.data['Task']['Items']);
      await stores.preferences().loadFromBackend(response.data['Task']['Preferences']);
      await stores.settings().loadFromBackend('Task', response.data['Task']['Settings']);
      await stores.snippets().loadFromBackend(response.data['Task']['Snippets']);
      await stores.tasks().loadFromBackend(response.data['Task']['Tasks']);

      await stores.settings().loadFromBackend('EssayTask', response.data['EssayTask']['Settings']);

      this.setLoading(false);
      return true;
    },


    /**
     * Load the data of a new correction item from the backend
     */
    async loadItemFromBackend(itemKey) {
      console.log("loadItemFromBackend...");
      this.setLoading(true);
      this.clearAllIntervals();

      const itemsStore = stores.items();
      if (itemKey == '' || stores.items().getItem(itemKey) == undefined) {
        itemKey = itemsStore.firstKey
      }

      let response = {};
      const task_id = Item.extractTaskId(itemKey);
      const writer_id = Item.extractWriterId(itemKey);
      try {
        response = await axios.get('/item/' + task_id + '/' + writer_id, this.getRequestConfig(this.dataToken));
        this.setTimeOffset(response);
        this.refreshToken(response);
      }
      catch (error) {
        console.error(error);
        stores.layout().showItemLoadFailure = true;
        this.setLoading(false);
        return false;
      }

      // set the itemKey here before loading and check it in the loadFromBackend() functions
      // otherwise a fast navigation between writers may cause wrong assignments (race condition)
      this.itemKey = itemKey;
      localStorage.setItem('itemKey', this.itemKey);
      await itemsStore.saveItem(new Item(response.data['Task']['Item']));
      

      // dismiss open changes from other items
      // this avoids a race condition on quick navigation between writers
      await stores.changes().clearStorage();

      await stores.corrections().loadFromBackend(response.data.data['Task']['Corrections']);
      await stores.criteria().loadFromBackend(response.data.data['Task']['Criteria']);
      await stores.comments().loadFromBackend(response.data['Task']['Comments']);
      await stores.points().loadFromBackend(response.data['Task']['Points']);
      await stores.summaries().loadFromBackend(response.data.summaries);

      await stores.essay().loadFromBackend(response.data.essay);
      await stores.pages().loadFromBackend(response.data.pages);

      stores.comments().setMarkerChange();
      stores.items().updateCurrentKeys();
      stores.tasks().updateCurrentKeys();
      this.setLoading(false);
      this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
      return true;
    },


    /**
     * Periodically send changes to the backend
     * Timer is set in initialisation
     *
     * @param bool wait    wait some seconds for a running sending to finish (if not called by timer)
     * @return bool
     */
    async saveChangesToBackend(wait = false) {

      // don't interfer with a running request
      if (!(await this.isSending(true))) {
        this.setSending(true);
        try {
          const data = {
            comments: await stores.comments().getChangedData(this.lastSendingTry),
            points: await stores.points().getChangedData(this.lastSendingTry),
            summaries: await stores.summaries().getChangedData(this.lastSendingTry),
            snippets: await stores.snippets().getChangedData(this.lastSendingTry),
            preferences: await stores.preferences().getChangedData(this.lastSendingTry),
          };

          const response = await axios.put('/correction/changes/', data, this.getRequestConfig(this.dataToken));
          this.setTimeOffset(response);
          this.refreshToken(response);

          const newSelectedKey = await stores.comments().updateKeys(response.data.comments);
          await stores.points().changeCommentKeys(response.data.comments);
          await stores.points().updateKeys(response.data.points);

          // trigger selection change for the comment
          if (newSelectedKey !== null) {
            await stores.comments().selectComment(newSelectedKey, true);
          }

          await stores.changes().setChangesSent(Change.TYPE_COMMENT,
            response.data.comments,
            this.lastSendingTry);
          await stores.changes().setChangesSent(Change.TYPE_POINTS,
            response.data.points,
            this.lastSendingTry);
          await stores.changes().setChangesSent(Change.TYPE_SUMMARY,
            response.data.summaries,
            this.lastSendingTry);
          await stores.changes().setChangesSent(Change.TYPE_SNIPPETS,
              response.data.snippets,
              this.lastSendingTry);
          await stores.changes().setChangesSent(Change.TYPE_PREFERENCES,
            response.data.preferences,
            this.lastSendingTry);
        }
        catch (error) {
          console.error(error);
          this.setSending(false);
          return false;
        }
        this.setSending(false);
      }

      return true;
    },

    /**
     * Set the offset between server time and client time
     * The offset is used to calculate the correct remaining time of the task
     * The offset should be set from the response of a REST call
     * when the response data transfer is short (no files)
     */
    setTimeOffset(response) {
      if (response.headers['longessaytime']) {
        const serverTimeMs = response.headers['longessaytime'] * 1000;
        const clientTimeMs = Date.now();

        this.timeOffset = clientTimeMs - serverTimeMs;
        localStorage.setItem('writerTimeOffset', this.timeOffset);
      }
    },

    /**
     * Refresh the auth token with the value from the REST response
     * Each REST call will generate a new auth token
     * A token has only a certain valid time (e.g. one our)
     * Within this time a new REST call must be made to get a new valid token
     */
    refreshToken(response) {
      if (response.headers['longessaydatatoken']) {
        this.dataToken = response.headers['longessaydatatoken'];
        localStorage.setItem('xlasCorrectionDataToken', this.dataToken);
      }

      if (response.headers['longessayfiletoken']) {
        this.fileToken = response.headers['longessayfiletoken'];
        localStorage.setItem('xlasCorrectionFileToken', this.fileToken);
      }
    },

    /**
     * Check if a sending of changes is still running
     *
     * @param {boolean} wait - wait up to 5 seconds for a sending to complete
     * @return boolean  sending is still going on
     */
    async isSending(wait = false) {
      if (wait) {
        let tries = 0;
        while (tries < 5 && this.lastSendingTry > 0) {
          tries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return this.lastSendingTry > 0;
    },

    /**
     * Set the sending status
     * @param {boolean} sending status
     */
    setSending(sending) {
      if (sending) {
        this.lastSendingTry = Date.now();
      } else {
        this.lastSendingTry = 0;
      }
    },


    /**
     * Set the sending status
     * @param {boolean} sending status
     */
    setLoading(loading) {
      if (loading) {
        this.lastLoadingTry = Date.now();
      } else {
        this.lastLoadingTry = 0;
      }
    },

    /**
     * Set a timer interval
     * @param {string} name unique name of the interval to set
     * @param {function} handler function that is called
     * @param {integer} interval milliseconds between each call
     */
    setInterval(name, handler, interval) {
      if (name in this.intervals) {
        clearInterval(this.intervals[name]);
      }
      this.intervals[name] = setInterval(handler, interval);
    },

    /**
     * Clear all timer intervals
     */
    clearAllIntervals() {
      for (const name in this.intervals) {
        clearInterval(this.intervals[name]);
        delete this.intervals[name];
      }
    }
  }
})
