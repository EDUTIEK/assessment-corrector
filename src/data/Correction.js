import Item from '@/data/Item';

/**
 * Assignment of a Corrector to a Correction Item
 *
 * This provides basic data for list and comment prefixes
 * If a correction is assigned to multiple items then this object exists multiple times with different item_keys
 */
export default class Correction {

  static POSITION_FIRST = 0;
  static POSITION_SECOND = 1;
  static POSITION_STITCH = 2;

  static order(correction1, correction2) {
    return correction1.position < correction2.position ? -1
      : correction1.position > correction2.position ? 1
        : 0
  }

  static buildKey(task_id, corrector_id, writer_id) {
    return 'C' + task_id + '_' + corrector_id + '_' + writer_id;
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
  static extractCorrectorId(key) {
    const start = key.indexOf('_');
    if (start > 1) {
      const end = key.indexOf('_', start) + 1;
      return parseInt(key.substring(start, end));
    }
    return null;
  }

  /**
   * Key of this correction
   * @type {string}
   */
  key = '';

  /**
   * Key of correction item to which the correction is assigned
   * @type {string}
   */
  item_key = '';

  /**
   * Task to which this correction belongs
   * @type {integer}
   */
  task_id = null;

  /**
   * Writer to which this correction belongs
   * @type {integer}
   */
  writer_id = null;

  /**
   * Corrector to which this correction belongs
   * @type {integer}
   */
  corrector_id = null;

  /**
   * User id of the corrector
   * @type {null}
   */
  user_id =null;

  /**
   * Title of the correction (usually derived from the name)
   * @type {string}
   */
  title = '';

  /**
   * Initials of the correction (usually derived from the name)
   * @type {string}
   */
  initials = '';

  /**
   * Position of the correction for the item (fist correction has 0)
   * @type {number}
   */
  position = 0;

  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }

    if (data.writer_id !== undefined && data.writer_id !== null) {
      this.writer_id = parseInt(data.writer_id);
    }

    if (data.corrector_id !== undefined && data.corrector_id !== null) {
      this.corrector_id = parseInt(data.corrector_id);
    }

    if (data.user_id !== undefined && data.user_id !== null) {
      this.user_id = parseInt(data.user_id);
    }

    if (data.title !== undefined && data.title !== null) {
      this.title = data.title.toString();
    }
    if (data.initials !== undefined && data.initials !== null) {
      this.initials = data.initials.toString().toUpperCase();
    }
    if (data.position !== undefined && data.position !== null) {
      this.position = parseInt(data.position);
    }

    this.key = Correction.buildKey(this.task_id, this.corrector_id, this.writer_id);
    this.item_key = Item.buildKey(this.task_id, this.writer_id);
  }

  /**
   * @return {string}
   */
  getKey() {
    return this.key;
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return Object.assign({}, this);
  }
}
