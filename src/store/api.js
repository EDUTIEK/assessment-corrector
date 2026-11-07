/**
 * API Store
 * Handles the communication with the backend
 */
import {clearAllStores, clearAssessmentStores, stores} from "@/store";
import {defineStore} from 'pinia';
import axios from 'axios';
import Cookies from 'js-cookie';
import i18n from "@/plugins/i18n";
import md5 from 'md5';
import Change from '@/data/Change';
import Item from '@/data/Item';
import Snippet from '@/data/Snippet';
import ApiResult from '@/data/ApiResult';

const { t } = i18n.global;
const sendInterval = 1000;      // time (ms) to wait for sending open savings to the backend

export const useApiStore = defineStore('api', {

  state: () => {
    return {
      // saved in storage
      userId: '',                         // identifying id of the current user
      assId: '',                          // identifying id of the assessment
      contextId: '',                      // identifying id of the context for permission checks
      asAdmin: '',                        // app is opened for administrator (permission will be checked in the backend)
      itemKey: '',                        // identifying key of the correction item
      userToken: '',                      // authentication token
      timeOffset: 0,                      // difference between server time and client time (ms)

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
    isSending: state => state.lastSendingTry > 0,

    storedItemKey: state => localStorage.getItem('xlasCorrectorItemKey'),

    getRequestConfig(state) {

      /**
       * Get the config object for REST requests
       *
       * @param {string} token
       * @returns {{baseURL: (string|*), responseType: string, responseEncoding: string, params: URLSearchParams, timeout: number}}
       */
      const fn = () => {
        let baseURL = stores.config().backendUrl;
        let params = new URLSearchParams();

        // cut query string and set it as params
        // a REST path is added as url to the baseURL by axios calls
        let position = baseURL.search(/\?+/);
        if (position != -1) {
          params = new URLSearchParams(baseURL.substr(position))
          baseURL = baseURL.substr(0, position);
        }

        // add parameters
        // the userId is not sent directly, but determined from the token
        if (state.assId) {
          params.append('ass_id', state.assId);
        }
        if (state.contextId) {
          params.append('context_id', state.contextId);
        }
        if (state.asAdmin) {
          params.append('as_admin', state.asAdmin);
        }

        return {
          baseURL: baseURL,
          params: params,
          timeout: 30000,             // milliseconds
          responseType: 'json',       // default
          responseEncoding: 'utf8',   // default
          headers: {
            'Authorization': 'Bearer ' + state.userToken
          }
        }
      }
      return fn;
    },

    /**
     * Get the Url for loading an essay as pdf file
     */
    getEssayUrl(state) {

      /**
       * Get the Url for loading an essay as pdf file
       * @param {int} essay_id
       * @returns {string}
       */
      const fn = function (essay_id) {
        const config = this.getRequestConfig();
        return config.baseURL + '/corrector/file/essaytask/essay/' + essay_id + '/inline?' + config.params.toString();
      }
      return fn;
    },

    getSummaryPdfUrl(state) {

      /**
       * Get the Url for loading a summary pdf
       * @param {Summary} summary
       * @returns {string}
       */
      const fn = function (summary) {
        const config = this.getRequestConfig();
        return config.baseURL + '/corrector/file/task/summary/' + summary.id + '/inline?' + config.params.toString();
      }
      return fn;
    },

    getServerTime(state) {

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

    getDownloadTitle(state) {

      /**
       * Get a full title for downloading files
       * @param {string} title
       * @param {boolean} with_details
       * @returns {string}
       */
      const fn = function (title, with_details = true) {
        let elements = [];
        elements.push(stores.settings().Assessment.title ?? '');

        if (with_details) {
          if (stores.tasks().countTasks > 1) {
            elements.push(stores.tasks().currentTitle ?? '');
          }
          elements.push(stores.items().currentItem.pseudonym ?? '');
        }

        elements.push(title);

        return elements.filter(el => el !== '').join(' - ');
      }
      return fn;
    },
  },

  actions: {

    /**
     * Send a request to the backend
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    request(method, url, config = {}) {
      const defaultConf = this.getRequestConfig();
      return axios.request(Object.assign({
        method: method.toUpperCase(),
        url: url,
      }, defaultConf, config, {
        headers: Object.assign(defaultConf.headers, config),
      })).then(response => {

        // Refresh the auth token with the value from the REST response
        // Each REST call will generate a new auth token
        // A token has only a certain valid time (e.g. one our)
        // Within this time a new REST call must be made to get a new valid token
        const token = response.headers['x-access-token'];
        if (token) {
          console.log('new token', token);
          this.userToken = token;
          localStorage.setItem('xlasCorrectorUserToken', token);
        }

        // Set the offset between server time and client time
        // The offset is used to calculate the correct remaining time of the task
        // The offset should be set from the response of a REST call
        // when the response data transfer is short (JSON)
        const time = response.headers['x-server-time'];
        if (time) {
          console.log('new time', time);
          const serverTimeMs = time * 1000;
          const clientTimeMs = Date.now();
          this.timeOffset = clientTimeMs - serverTimeMs;
          localStorage.setItem('xlasCorrectorTimeOffset', this.timeOffset);
        }
        return response;
      });
    },

    /**
     * @returns {Promise<Blob | null>}
     */
    loadBlob(url, config = {}) {
      return this.request('get', url, Object.assign({
        responseType: 'blob',
        timeout: 60000,
      }, config)).then(r => r.status === 200 ? r.data : null);
    },

    /**
     * Clear the store
     */
    async clearStorage() {
      try {
        this.$reset();
        localStorage.removeItem('xlasCorrectorUserId');
        localStorage.removeItem('xlasCorrectorAssId');
        localStorage.removeItem('xlasCorrectorContextId');
        localStorage.removeItem('xlasCorrectorAsAdmin');
        localStorage.removeItem('xlasCorrectorItemKey');
        localStorage.removeItem('xlasCorrectorUserToken');
        localStorage.removeItem('xlasCorrectorTimeOffset');
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Init the state
     * Take the state from the cookies or from the local store
     * Trigger a reload of all data if cookie values differ from the local store
     */
    async init() {

      let newContext = false;
      let newItem = false;

      const configStore = stores.config();
      await configStore.loadFromConfig();
      await configStore.loadFromStorage();

      // take values formerly stored
      this.userId = localStorage.getItem('xlasCorrectorUserId') ?? '';
      this.assId = localStorage.getItem('xlasCorrectorAssId') ?? '';
      this.contextId = localStorage.getItem('xlasCorrectorContextId') ?? '';
      this.asAdmin = localStorage.getItem('xlasCorrectorAsAdmin') ?? '';
      this.itemKey = localStorage.getItem('xlasCorrectorItemKey') ?? '';
      this.userToken = localStorage.getItem('xlasCorrectorUserToken') ?? '';
      this.timeOffset = Math.floor(localStorage.getItem('xlasCorrectorTimeOffset') ?? 0);

      // check if context given by cookies differs and force a reload if neccessary
      if (Cookies.get('xlasUserId') != undefined && Cookies.get('xlasUserId') != this.userId) {
        this.userId = Cookies.get('xlasUserId');
        this.userToken = '';
        newContext = true;
      }
      if (!!Cookies.get('xlasAssId') && Cookies.get('xlasAssId') != this.assId) {
        this.assId = Cookies.get('xlasAssId');
        newContext = true;
      }
      if (Cookies.get('xlasContextId') != undefined && Cookies.get('xlasContextId') != this.contextId) {
        this.contextId = Cookies.get('xlasContextId');
        newContext = true;
      }
      if (Cookies.get('xlasAsAdmin') != undefined  && Cookies.get('xlasAsAdmin') != this.asAdmin) {
        this.asAdmin = Cookies.get('xlasAsAdmin')
        newContext = true;
      }

      // these values just need a reload of the item
      let task_id = Item.extractTaskId(this.itemKey);
      let writer_id = Item.extractWriterId(this.itemKey);
      if (Cookies.get('xlasTaskId') != undefined && Cookies.get('xlasWriterId') != undefined
          && (Cookies.get('xlasTaskId') != task_id || Cookies.get('xlasWriterId') != writer_id)) {
        newItem = true;
        task_id = Cookies.get('xlasTaskId');
        writer_id = Cookies.get('xlasWriterId');
        this.itemKey = Item.buildKey(task_id, writer_id);
      }
      if (!this.itemKey) {
        newItem = true;
      }

      // these values can be changed without forcing a whole reload
      if (Cookies.get('xlasBackendUrl') != undefined && Cookies.get('xlasBackendUrl') != configStore.backendUrl) {
        configStore.backendUrl = Cookies.get('xlasBackendUrl');
      }
      if (Cookies.get('xlasReturnUrl') != undefined && Cookies.get('xlasReturnUrl') != configStore.returnUrl) {
        configStore.returnUrl = Cookies.get('xlasReturnUrl');
      }
      if (Cookies.get('xlasUserToken') != undefined && Cookies.get('xlasUserToken') != this.userToken) {
        this.userToken = Cookies.get('xlasUserToken');
      }

      // remove the cookies
      // needed to distinct the call from the backend from a later reload
      Cookies.remove('xlasBackendUrl');
      Cookies.remove('xlasReturnUrl');
      Cookies.remove('xlasUserId');
      Cookies.remove('xlasAssId');
      Cookies.remove('xlasContextId');
      Cookies.remove('xlasAsAdmin');
      Cookies.remove('xlasTaskId');
      Cookies.remove('xlasWriterId');
      Cookies.remove('xlasUserToken');

      // save the state
      localStorage.setItem('xlasCorrectorUserId', this.userId);
      localStorage.setItem('xlasCorrectorAssId', this.assId);
      localStorage.setItem('xlasCorrectorContextId', this.contextId);
      localStorage.setItem('xlasCorrectorAsAdmin', this.asAdmin);
      localStorage.setItem('xlasCorrectorItemKey', this.itemKey);
      localStorage.setItem('xlasCorrectorUserToken', this.userToken);
      localStorage.setItem('xlasCorrectorTimeOffset', this.timeOffset);

      configStore.saveToStorage();
      if (!configStore.backendUrl) {
        await clearAllStores();
        stores.layout().initFailure = t('apiMissingBackendUrl');
        return;
      }

      if (!this.userToken || !this.userId || !this.assId || !this.contextId) {
        await clearAllStores();
        return;
      }

      const changesStore = stores.changes();
      await changesStore.loadFromStorage();

      if (changesStore.countChanges > 0) {
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
      await clearAssessmentStores();
      stores.layout().showDataReplaceConfirmation = false;
      stores.layout().showItemReplaceConfirmation = false;

      if (await this.loadDataFromBackend()) {
        await this.loadItemFromBackend(this.itemKey);
        this.finishInitialisation();
      }
    },

    /**
     * init after the keeping the data of the item with open sendings
     */
    async initAfterKeepDataConfirmed() {
      console.log('initAfterKeepDataConfirmed');
      stores.layout().showDataReplaceConfirmation = false;
      stores.layout().showItemReplaceConfirmation = false;

      this.itemKey = localStorage.getItem('xlasCorrectorItemKey');
      await this.loadItemFromStorage(this.itemKey);
      const item = stores.items().getItem(this.itemKey);

      if (await this.loadDataFromBackend()) {
        await stores.items().saveItem(item);
        await this.loadItemFromStorage(this.itemKey);
        this.finishInitialisation();
      }
    },

    /**
     * Finish the initialization
     * set config-dependent layout states
     */
    finishInitialisation() {

      if (stores.summaries().isOneAuthorized) {
        stores.comments().setShowOtherCorrections(true);
      }
      stores.layout().initialized = true;
    },

    /**
     * Load all data from the storage
     */
    async loadDataFromStorage() {
      console.log("loadDataFromStorage...");
      this.setLoading(true);
      this.clearAllIntervals();

      await stores.config().loadFromStorage();
      await stores.user().loadFromStorage();
      await stores.assessments().loadFromStorage();
      await stores.criteria().loadFromStorage();
      await stores.items().loadFromStorage();
      await stores.layout().loadFromStorage();
      await stores.levels().loadFromStorage();
      await stores.preferences().loadFromStorage();
      await stores.resources().loadFromStorage();
      await stores.settings().loadFromStorage();
      await stores.snippets().loadFromStorage();
      await stores.tasks().loadFromStorage();
      await stores.templates().loadFromStorage();

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
      if (itemKey == '' || stores.items().hasItems && itemsStore.getItem(itemKey) == undefined) {
        itemKey = itemsStore.firstKey
      }

      this.itemKey = itemKey;
      localStorage.setItem('xlasCorrectorItemKey', this.itemKey);

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
      stores.layout().initForItem();
      this.setLoading(false);

      this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
      return true;
    },

    /**
     * Load assessments from the backend
     */
    async loadAssessmentsFromBackend() {
      console.log("loadAssessmentsFromBackend...");

      this.setLoading(true);
      this.clearAllIntervals();

      let response = {};
      try {
        response = await this.request('get', '/corrector/start/assessments');
      }
      catch (error) {
        console.error(error);
        stores.layout().initFailure = t('apiLoadingDataFailed');
        this.setLoading(false);
        return false;
      }

      await stores.assessments().loadFromBackend(response.data);

      this.setLoading(false);
      return true;
    },

    /**
     * Load common data from the backend
     */
    async loadDataFromBackend() {
      console.log("loadDataFromBackend...");

      this.setLoading(true);
      this.clearAllIntervals();

      let response = {};
      try {
        response = await this.request('get', '/corrector/data');
      }
      catch (error) {
        console.error(error);
        stores.layout().initFailure = t('apiLoadingDataFailed');
        this.setLoading(false);
        return false;
      }
      
      await stores.layout().clearStorage();

      await stores.config().loadFromBackend(response.data['Assessment']['Config']);
      await stores.levels().loadFromBackend(response.data['Assessment']['GradeLevels']);
      await stores.settings().loadFromBackend('Assessment', response.data['Assessment']['Settings']);

      await stores.items().loadFromBackend(response.data['Task']['Items']);
      await stores.preferences().loadFromBackend(response.data['Task']['Preferences']);
      await stores.resources().loadFromBackend(response.data['Task']['Resources']);
      await stores.settings().loadFromBackend('Task', response.data['Task']['Settings']);
      await stores.snippets().loadFromBackend(response.data['Task']['Snippets']);
      await stores.tasks().loadFromBackend(response.data['Task']['Tasks']);
      await stores.templates().loadFromBackend(response.data['Task']['Templates']);

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
      if (itemKey == '' && stores.items().hasItems && !stores.items().getItem(itemKey)) {
        itemKey = itemsStore.firstKey ?? '';
      }

      let response = {};
      const task_id = Item.extractTaskId(itemKey);
      const writer_id = Item.extractWriterId(itemKey);
      try {
        response = await this.request('get', '/corrector/item/' + task_id + '/' + writer_id);
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
      localStorage.setItem('xlasCorrectorItemKey', this.itemKey);
      await itemsStore.saveItem(new Item(response.data['Task']['Item']));

      // dismiss open changes from other items
      // this avoids a race condition on quick navigation between writers
      await stores.changes().clearStorage();

      await stores.essay().loadFromBackend(response.data['EssayTask']['Essay']);
      await stores.pages().loadFromBackend(response.data['EssayTask']['Pages']);

      await stores.corrections().loadFromBackend(response.data['Task']['Corrections']);
      await stores.criteria().loadFromBackend(response.data['Task']['Criteria']);
      await stores.comments().loadFromBackend(response.data['Task']['Comments']);
      await stores.points().loadFromBackend(response.data['Task']['Points']);
      await stores.summaries().loadFromBackend(response.data['Task']['Summaries']);

      stores.comments().setMarkerChange();
      stores.items().updateCurrentKeys();
      stores.tasks().updateCurrentKeys();
      stores.layout().initForItem();
      this.setLoading(false);
      this.setInterval('apiStore.saveChangesToBackend', this.saveChangesToBackend, sendInterval);
      return true;
    },


    /**
     * Periodically send changes to the backend
     * Timer is set in initialisation
     *
     * @param bool wait some seconds for a running sending to finish (if not called by timer)
     * @return bool
     */
    async saveChangesToBackend(wait = false) {
      const changesStore = stores.changes();

      if (changesStore.countChanges > 0) {
        // don't interfer with a running request
        if (!(await this.checkSending(true))) {

          this.setSending(true);
          try {
            const data = {'Task': {}};
            data['Task'][Change.TYPE_SNIPPETS] = await stores.snippets().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_PREFERENCES] = await stores.preferences().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_COMMENT] = await stores.comments().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_POINTS] = await stores.points().getChangedData(this.lastSendingTry);
            data['Task'][Change.TYPE_SUMMARY] = await stores.summaries().getChangedData(this.lastSendingTry);

            const response = await this.request('put', '/corrector/changes', {data});

            for (const component in response.data ?? []) {
              const changes = response.data[component];
              for (const type in changes ?? []) {
                await changesStore.setChangesSent(type, changes[type],  this.lastSendingTry)
              }
            }
          }
          catch (error) {
            console.error(error);
            this.setSending(false);
            return false;
          }
          this.setSending(false);
        }
      }
      return changesStore.countChanges == 0;
    },

    /**
     * Post a login request
     * @return {ApiResult}
     */
    async sendLogin(login, password) {
      try {
        const formData = new FormData();
        formData.append('login', login);
        formData.append('password', password);

        this.setSending(true);
        const response = await this.request('post', '/corrector/start/login', {data: formData});
        this.setSending(false);

        this.userId = response.data.user_id;
        localStorage.setItem('xlasCorrectorUserId', this.userId);
        await stores.user().loadFromBackend(response.data);
        return new ApiResult(true);

      } catch (error) {
        console.log(error);
        this.setSending(false);
        if (error.response?.status === 401) {
          return new ApiResult(false, 401, error.response.data?.failed_message);
        } else {
          return new ApiResult(false, error.response?.status, error.response.data);
        }
      }
    },

    /**
     * Send acceptance of the user agreement
     */
    async sendLogout() {
      try {
        this.setSending(true);
        const response = await this.request('put', '/corrector/start/logout');
        this.setSending(false);

        clearAllStores();
        return new ApiResult(true);

      } catch (error) {
        stores.layout().initialized = false;
        return new ApiResult(false, error.response?.status, error.response.data);
      }
    },

    /**
     * Send acceptance of the user agreement
     */
    async sendAgreement() {
      try {
        this.setSending(true);
        const response = await this.request('put', '/corrector/start/agreement');
        this.setSending(false);
        await stores.user().setAccepted();
        return new ApiResult(true);

      } catch (error) {
        return new ApiResult(false, error.response?.status, error.response.data);
      }
    },


    /**
     * Send a summary pdf file
     * @return {string|false}
     */
    async sendSummaryPdf(summary, file, onProgress) {

      try {
        const formData = new FormData();
        // 'file' is the POST element
        formData.append('file', file);

        const response = await this.request(
          'post',
          '/corrector/upload/task/summary/' + summary.task_id + '/' + summary.writer_id,
          {
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress
          });
        return response.data.id;

      } catch (error) {
        console.log(error);
        return false;
      }
    },

    loadSummaryPdf(summary) {
        return this.loadBlob(this.getSummaryPdfUrl(summary));
    },

    loadSnippets(purpose) {
      return this.loadBlob('/corrector/file/task/snippets_' + purpose + '/0/attachment');
    },

    /**
     * Send a marked pdf file
     * @param {Blob} file
     * @param {string} scope 'own' or 'all'
     * @param {int} task_id
     * @param {int} writer_id
     * @return {string|false} id of the saved file
     */
    async sendMarkedPdf(file, scope, task_id, writer_id) {

      let entity;
      switch (scope) {
        case 'own':
          entity = 'ownpdf';
          break;
        case 'all':
          entity = 'sumpdf';
          break;
        default:
          return false;
      }

      try {
        const formData = new FormData();
        // 'file' is the POST element
        formData.append('file', file);

        const response = await this.request(
          'post',
          '/corrector/upload/essaytask/' + entity + '/' + task_id + '/' + writer_id,
          {
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
        return response.data.id;

      } catch (error) {
        console.log(error);
        return false;
      }
    },

    /**
     * Send a marked pdf file
     * @param {Blob} file
     * @param {string} purpose
     * @return {bool} import is successful
     */
    async sendSnippets(file, purpose, onProgress) {

      let entity;
      switch (purpose) {
        case Snippet.FOR_COMMENT:
          entity = 'snippets_for_comment';
          break;
        case Snippet.FOR_SUMMARY:
          entity = 'snippets_for_summary';
          break;
        default:
          return false;
      }

      try {
        const formData = new FormData();
        // 'file' is the POST element
        formData.append('file', file);

        const response = await this.request(
          'post',
          '/corrector/upload/task/' + entity,
          {
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress
          });
        return response.data;

      } catch (error) {
        console.log(error);
        return false;
      }
    },


    /**
     * Check if a sending of changes is still running
     * Wait up to 5 seconds for a sending to complete
     *
     * @return boolean sending is still going on
     */
    async checkSending() {
      let tries = 0;
      while (tries < 5 && this.lastSendingTry > 0) {
        tries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
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
     * Clear a timer interval
     */
    clearInterval(name) {
      clearInterval(this.intervals[name]);
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
