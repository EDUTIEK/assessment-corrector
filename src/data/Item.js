/**
 * Correction Item
 *
 * This provides basic data for list of items to be corrected
 * An item is uniquelly identified by the ids of the weriter and the written task
 */
class Item {

  static STATUS_OPEN = 'open';
  static STATUS_APPROXIMATION = 'approximation';
  static STATUS_CONSULTING = 'consulting';
  static STATUS_STITCH = 'stitch';
  static STATUS_FINALIZED = 'finalized';

  static order(item1, item2) {
    return item1.position < item2.position ? -1
        : item1.position > item2.position ? 1
            : item1.title < item2.title ? -1
                : item1.title > item2.title ? 1
                    : 0
  }

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
  key = null;

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
   * Position of the current correction in the correction process for this item
   * @type {integer}
   * @see Correction
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
  can_correct = false;

  /**
   * Is an authorization allowed for the item
   * @type {boolean}
   */
  can_authorize = false;

  /**
   * Is an review allowed for the item
   * @type {boolean}
   */
  can_revise = false;

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
    if (data.can_correct !== undefined && data.can_correct !== null) {
      this.can_correct = !!data.can_correct;
    }
    if (data.can_authorize !== undefined && data.can_authorize !== null) {
      this.can_authorize = !!data.can_authorize;
    }
    if (data.can_revise !== undefined && data.can_revise !== null) {
      this.can_revise = !!data.can_revise;
    }
    if (this.key === null) {
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
