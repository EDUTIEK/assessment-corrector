import Item from "@/data/Item";
import Correction from "@/data/Correction";
import Criterion from "@/data/Criterion";

/**
 * Partial Points given for croteria or comments
 */
export default class Points {

  static newKey(corrector_id) {
    return 'P' + corrector_id + '_' + Math.random().toString();
  }

  /**
   * Unique identifier of the points
   * Will be auto-generated for new points
   * @type {string}
   */
  key = '';

  /**
   * Key of the correction item to which the points belong
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the correction to which the points belong
   * @type {string}
   */
  correction_key = '';

  /**
   * Key of the correction comment for which the points are given
   * @type {string}
   */
  comment_key = '';

  /**
   * Key of the criterion for which the points are given
   * @type {string}
   */
  criterion_key = '';

  /**
   * Task in which the points are set
   * @type {integer}
   */
  task_id = null;

  /**
   * Writer for which the points are set
   * @type {integer}
   */
  writer_id = null;

  /**
   * Corrector that sets the points
   * @type {integer}
   */
  corrector_id = null;

  /**
   * Criterion for which the pounts are set
   * @type {integer}
   */
  criterion_id = null;

  /**
   * Points given
   * @type {float}
   */
  points = 0;

  /**
   * Constructor - gets properties from a data object
   * @param {object }data
   */
  constructor(data = {}) {

    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    }
    if (data.comment_key !== undefined && data.comment_key !== null) {
      this.comment_key = data.comment_key.toString();
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
    if (data.criterion_id !== undefined && data.criterion_id !== null) {
      this.criterion_id = parseInt(data.criterion_id);
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseFloat(data.points);
    }
    if (!this.key && this.corrector_id) {
      this.key = Points.newKey(this.corrector_id);
    }
    if (!this.item_key && this.task_id && this.writer_id) {
      this.item_key = Item.buildKey(this.task_id, this.writer_id)
    }
    if (!this.correction_key && this.task_id && this.writer_id && this.corrector_id) {
      this.correction_key = Correction.buildKey(this.task_id,  this.writer_id, this.corrector_id)
    }
    if (!this.criterion_key && this.criterion_id) {
      this.criterion_key = Criterion.buildKey(this.criterion_id)
    }
  }

  /**
   * Set the keys and change the ids accordingly
   * @param {string} correction_key
   */
  setKeys(correction_key, comment_key, criterion_key) {
    this.correction_key = correction_key;
    this.comment_key = comment_key;
    this.criterion_key = criterion_key;
    this.task_id = Correction.extractTaskId(this.correction_key);
    this.writer_id = Correction.extractWriterId(this.correction_key);
    this.corrector_id = Correction.extractCorrectorId(this.correction_key);
    if (criterion_key) {
      this.criterion_id = Criterion.extractCriterionId(this.criterion_key);
    }
    this.item_key = Item.buildKey(this.task_id, this.writer_id);
    this.key = Points.newKey(this.corrector_id);
  }

  /**
   * Set the points value
   * @param value
   */
  setPoints(value) {
    this.points = parseFloat(value);
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return Object.assign({}, this);
  }
}

