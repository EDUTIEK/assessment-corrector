import Task from "@/data/Task";

/**
 * Template for the summary text
 */
export default class Template {


  /**
   * Task to which this template belongs
   * @type {integer}
   */
  task_id = null;

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
      this.task_id = parseInt(data.sk_id);
    }
    if (data.content !== undefined && data.content !== null) {
      this.content = data.content.toString();
    }
    if (data.shared !== undefined && data.shared !== null) {
      this.shared = !!data.shared;
    }
  }

  /**
   * @return {string}
   */
  getKey() {
    return Task.buildKey(this.task_id)
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
   */
  isEqual(other) {
    for (const key in this) {
      if (this[key] !== other[key]) {
        return false;
      }
    }
    return true;
  }
}
