/**
 * Rating Criterion
 */
export default class Criterion {

  static order(criterion1, criterion2) {
    return criterion1.title < criterion2.title ? -1
        : criterion1.title > criterion2.title ? 1
            : 0
  }

  static buildKey(id) {
    return 'C' + id;
  }

  /**
   * @param {string} key
   * @returns {number|null}
   */
  static extractCriterionId(key) {
    return parseInt(key.substring(1));
  }

  /**
   * Unique identifier of the criterion
   * @type {string}
   */
  key = '';

  /**
   * Database ID of the criterion
   * @type {integer}
   */
  id = null;

  /**
   * Task to which this criterion belongs
   * @type {integer}
   */
  task_id = null;

  /**
   * Corrector to which this criterion belongs
   * @type {integer}
   */
  corrector_id = null;


  /**
   * Short title of the criterion which is displayed in one line
   * @type {string}
   */
  title = '';

  /**
   * Long description of ther critierion
   * Can be displayed in a popup
   * @type {string}
   */
  description = '';

  /**
   * Number of points that can be given for this criterion
   * @type {integer}
   */
  points = 0;

  /**
   * Scope of the crierion is general, not the single comment
   * @type {boolean}
   */
  is_general = false;

  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.id !== undefined && data.id !== null) {
      this.id = parseInt(data.id);
    }

    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }

    if (data.corrector_id !== undefined && data.corrector_id !== null) {
      this.corrector_id = parseInt(data.corrector_id);
    }

    if (data.title !== undefined && data.title !== null) {
      this.title = data.title.toString()
    }
    if (data.description !== undefined && data.description !== null) {
      this.description = data.description.toString()
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseInt(data.points);
    }
    if (data.is_general !== undefined && data.is_general !== null) {
      this.is_general = !!data.is_general;
    }

    this.key = Criterion.buildKey(this.id);
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
    return Object.assign({}, this)
  }
}

