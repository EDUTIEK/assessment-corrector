/**
 * Correction Summary
 */
class Summary {

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
   * Summary text
   * @type {string}
   */
  text = '';

  /**
   * Points directly given to this comment
   * @type {float}
   */
  points = null;

  /**
   * Key of the reached Grade
   * @type {string}
   */
  grade_key = '';

  /**
   * Timestamp of the last change (server time)
   * @type {integer}
   */
  last_change = null;


  /**
   * Marked text is excellent
   * @type {bool}
   */
  is_authorized = false;

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
    if (data.item_key !== undefined && data.item_key !== null) {
      this.item_key = data.item_key.toString()
    }
    if (data.correction_key !== undefined && data.correction_key !== null) {
      this.correction_key = data.correction_key.toString()
    }
    if (data.text !== undefined && data.text !== null) {
      this.text = data.text.toString()
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseInt(data.points);
    }
    if (data.grade_key !== undefined && data.grade_key !== null) {
      this.grade_key = data.grade_key.toString()
    }
    if (data.last_change !== undefined && data.last_change !== null) {
      this.last_change = parseInt(data.last_change);
    }
    if (data.is_authorized !== undefined && data.is_authorized !== null) {
      this.is_authorized = !!data.is_authorized;
    }
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
    return 'ITM-' + this.item_key + '-COR-' + this.correction_key
  }

  /**
   * Get a clone of the object
   * @returns {Summary}
   */
  getClone() {
    return new Summary(this.getData());
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

export default Summary;
