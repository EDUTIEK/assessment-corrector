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
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }
    if (data.content !== undefined && data.content !== null) {
      this.content = data.content.toString();
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

  hasContent() {
    return this.content != '';
  }
}
