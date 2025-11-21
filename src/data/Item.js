/**
 * Correction Item
 *
 * This provides basic data for list of items to be corrected
 * An item is uniquelly identified by the ids of the weriter and the written task
 */
class Item {

  /**
   * Build an item key from its components
   * @param {number|null} task_id
   * @param {number|null} writer_id
   * @return {string}
   */
  static buildKey(task_id, writer_id) {
    if (task_id && writer_id) {
      return 'I' + task_id.toString() + '_' + writer_id.toString();
    }
    return '';
  }

  /**
   * @param {string} key
   * @returns {number|null}
   */
  static extractTaskId(key) {
    const start = 1;
    const end = key.indexOf('_');
    if (end > 1) {
      return parseInt(key.substring(start, end));
    }
    return null;
  }

  /**
   * @param {string} key
   * @returns {number|null}
   */
  static extractWriterId(key) {
    const start = key.indexOf('_');
    if (start > 1) {
      return parseInt(key.substring(start));
    }
    return null;
  }

  /**
   * Key of correction item
   * @type {string}
   */
  key = '';

  /**
   * Id of the task that is corrected
   * @type {integer}
   */
  task_id = null;

  /**
   * Id of the writer that is corrected
   * @type {string}
   */
  writer_id = null;

  /**
   * Position of the current corrector in the correction process
   * @type {integer}
   */
  position = null;

  /**
   * Title of the item (e.g. the writer's pseudonym)
   * @type {string}
   */
  title = '';

  /**
   * Whole correction status of the writer (over all tasks)
   * @type {string}
   */
  correction_status = '';

  /**
   * Is a correction allowed for the item
   * @type {boolean}
   */
  correction_allowed = false;

  /**
   * Is an authorization allowed for the item
   * @type {boolean}
   */
  authorization_allowed = false;

  /**
   * Is an review allowed for the item
   * @type {boolean}
   */
  revision_allowed = false;

  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {
    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString();
    }
    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }
    if (data.writer_id !== undefined && data.writer_id !== null) {
      this.writer_id = parseInt(data.writer_id);
    }
    if (data.position !== undefined && data.position !== null) {
      this.position = parseInt(data.position);
    }
    if (data.title !== undefined && data.title !== null) {
      this.title = data.title.toString();
    }
    if (data.correction_status !== undefined && data.correction_status !== null) {
      this.correction_status = data.correction_status.toString();
    }
    if (data.correction_allowed !== undefined && data.correction_allowed !== null) {
      this.correction_allowed = !!data.correction_allowed;
    }
    if (data.authorization_allowed !== undefined && data.authorization_allowed !== null) {
      this.authorization_allowed = !!data.authorization_allowed;
    }
    if (data.revision_allowed !== undefined && data.revision_allowed !== null) {
      this.revision_allowed = !!data.revision_allowed;
    }
    if (this.key === '') {
      this.key = Item.buildKey(this.task_id, this.writer_id);
    }
  }

  /**
   * @return {string}
   */
  getKey() {
    return this.key
  }

  /**
   * Get a plain data object from the public properties
   * @returns {object}
   */
  getData() {
    return Object.assign({}, this);
  }
}

export default Item;
