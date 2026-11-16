/**
 * Template for the summary text
 */
export default class Template {

  /**
   * @return {string}
   */
  static buildKey(task_id, corrector_id) {
    return 'T' + task_id + '_' + corrector_id;
  }

  /**
   * Task to which this template belongs
   * @type {integer}
   */
  task_id = null;

  /**
   * Corrector to which this template belongs
   * @type {integer}
   */
  corrector_id = null;

  /**
   * Content of the template
   * @type {string}
   */
  content = '';

  /**
   * Template is shared with others
   * @type {boolean}
   */
  shared = false;

  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }
    if (data.corrector_id !== undefined && data.corrector_id !== null) {
      this.corrector_id = parseInt(data.corrector_id);
    }
    if (data.content !== undefined && data.content !== null) {
      this.content = data.content.toString();
    }
    if (data.shared !== undefined && data.shared !== null) {
      this.shared = !!data.shared;
    }
  }

  /**
   * Get the key for storing the template
   */
  getKey() {
    return Template.buildKey(this.task_id, this.corrector_id)
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return Object.assign({}, this);
  }

  /**
   * Get a clone of the object
   * @returns {Summary}
   */
  getClone() {
    return new Template(this.getData());
  }

  hasContent() {
    return this.content != '';
  }

  /**
   * Check if this object is equal to another summary
   * @param other
   * @returns {boolean}
   */
  isEqual(other) {
    for (const key in this) {
      if (this[key] !== other[key]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if the template has already set the secessary ids
   * @returns {boolean}
   */
  hasValidKey() {
    return this.task_id !== null && this.corrector_id !== null;
  }
}
