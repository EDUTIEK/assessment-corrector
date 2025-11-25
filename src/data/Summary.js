import Item from "@/data/Item";
import Correction from "@/data/Correction";

/**
 * Correction Summary
 */
export default class Summary {

  static STATUS_NOT_STARTED = "not_started";
  static STATUS_OPEN = "open";
  static STATUS_PRE_GRADED = "pre_graded";
  static STATUS_AUTHORIZED = "authorized";
  static STATUS_REVISED = "revised";

  static ALLOWED_TYPES = [Summary.STATUS_NOT_STARTED, Summary.STATUS_OPEN, Summary.STATUS_PRE_GRADED, Summary.STATUS_AUTHORIZED, Summary.STATUS_REVISED];

  /**
   * @return {string}
   */
  static buildKey(task_id, writer_id, corrector_id) {
    return 'S' + task_id + '_' + writer_id + '_' + corrector_id;
  }

  /**
   * Key of the correction item to which the summary belongs
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the correction to which the summary belongs
   * @type {string}
   */
  correction_key = '';

  /**
   * Task to which this summary belongs
   * @type {integer}
   */
  task_id = null;

  /**
   * Writer to which this summary belongs
   * @type {integer}
   */
  writer_id = null;

  /**
   * Corrector to which this summary belongs
   * @type {integer}
   */
  corrector_id = null;

  /**
   * Summary text
   * @type {string}
   */
  text = '';

  /**
   * Points manually given to this summary
   * @type {float}
   */
  points = null;

  /**
   * Key of the reached Grade
   * @type {string}
   */
  grade_key = '';

  /**
   * File id of a summary pdf
   * @type {string}
   */
  pdf = '';

  /**
   * Grading status
   * @type {string}
   */
  status = '';

  /**
   * Text from a revision
   * @type {string}
   */
  revision_text = '';

  /**
   * Text from a revision
   * @type {string}
   */
  revision_points = null;

  /**
   * Corrector requries a revision by the other corrector
   * @type {boolean}
   */
  require_other_revision = false;

  /**
   * Timestamp of the last change (server time)
   * @type {integer}
   */
  last_change = null;


  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {
    this.setData(data);
  }

  /**
   * Set the data from a plain object
   * @param {object} data
   */
  setData(data) {
    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }
    if (data.task_id !== undefined && data.task_id !== null) {
      this.task_id = parseInt(data.task_id);
    }
    if (data.writer_id !== undefined && data.writer_id !== null) {
      this.writer_id = parseInt(data.writer_id);
    }
    if (data.corrector_id !== undefined && data.corrector_id !== null) {
      this.corrector_id = parseInt(data.corrector_id);
    }
    if (data.text !== undefined && data.text !== null) {
      this.text = data.text.toString()
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseFloat(data.points);
    }
    if (data.pdf !== undefined && data.pdf !== null) {
      this.pdf = data.pdf.toString()
    }
    if (data.status !== undefined && Summary.ALLOWED_TYPES.includes(data.status)) {
      this.status = data.status.toString()
    }
    if (data.grade_key !== undefined && data.grade_key !== null) {
      this.grade_key = data.grade_key.toString()
    }
    if (data.revision_text !== undefined && data.revision_text !== null) {
      this.revision_text = data.revision_text.toString()
    }
    if (data.revision_points !== undefined && data.revision_points !== null) {
      this.revision_points = parseFloat(data.revision_points)
    }
    if (data.require_other_revision !== undefined && data.require_other_revision !== null) {
      this.require_other_revision = !!data.require_other_revision
    }
    if (data.last_change !== undefined && data.last_change !== null) {
      this.last_change = parseInt(data.last_change);
    }

    this.item_key = Item.buildKey(this.task_id, this.writer_id);
    this.correction_key = Correction.buildKey(this.task_id, this.writer_id, this.corrector_id);
  }

  /**
   * Get a plain data object from the public properties
   * @returns {object}
   */
  getData() {
    return Object.assign({}, this);
  }

  /**
   * @return {string}
   */
  getKey() {
    return Summary.buildKey(this.task_id, this.writer_id, this.corrector_id);
  }

  /**
   * Get a clone of the object
   * @returns {Summary}
   */
  getClone() {
    return new Summary(this.getData());
  }

  isChangeable() {
    return this.status == Summary.STATUS_NOT_STARTED || this.status == Summary.STATUS_OPEN;
  }

  isPregraded() {
    return this.status == Summary.STATUS_PRE_GRADED;
  }

  isAuthorized() {
    return this.status == Summary.STATUS_AUTHORIZED || this.status == Summary.STATUS_REVISED;
  }

  isRevised() {
    return this.status == this.status == Summary.STATUS_REVISED;
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

