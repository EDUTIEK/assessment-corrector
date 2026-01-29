import i18n from "@/plugins/i18n";
import Summary from "@/data/Summary";
import Correction from "@/data/Correction";
import Task from "@/data/Task";
import {stores} from "@/store/index";
const { t } = i18n.global;

/**
 * Correction Item
 *
 * This provides basic data for list of items to be corrected
 * An item is uniquelly identified by the ids of the weriter and the written task
 * All data are related to the corrent corrector
 */
export default class Item {

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
    const matches = key.match(/I(\d+)_(\d+)/);
    return matches && matches[1] ? parseInt(matches[1]) : null;
  }

  /**
   * @param {string} key
   * @returns {number|null}
   */
  static extractWriterId(key) {
    const matches = key.match(/I(\d+)_(\d+)/);
    return matches && matches[2] ? parseInt(matches[2]) : null;
  }

  /**
   * Build the item title
   * @param item
   * @returns {string}
   */
  static buildTitle(item) {
    return item.pseudonym + ' ' + Item.buildPositionText(item.position) + ' ' + Item.buildStatusText(item);
  }

  /**
   * Buld the corrector posution text
   * @param {integer} position
   * @return {string}
   */
  static buildPositionText(position) {
    if (stores.settings().Assessment.multiple_correctors) {
      switch (position) {
        case Correction.POSITION_FIRST:
          return t('correctionsFirstCorrection')
        case Correction.POSITION_SECOND:
          return t('correctionsSecondCorrection')
        case Correction.POSITION_STITCH:
          return t('correctionsStitchCorrection')
        default:
          return '';
      }
    }
    return ''
  }

  /**
   * Build the correction status text
   * @param {Item} item
   * @return {string}
   */
  static buildStatusText(item) {

    switch (item.correction_status) {
      case Item.STATUS_OPEN:
        switch (item.grading_status) {
          case Summary.STATUS_NOT_STARTED:
          case Summary.STATUS_OPEN:
            return t('itemsSuffixOpen');
          case Summary.STATUS_PRE_GRADED:
            return t('itemsSuffixPregraded');
          case Summary.STATUS_AUTHORIZED:
            return t('itemsSuffixAuthorized');
          default:
            return t('itemsSuffixOpen');
        }
      case Item.STATUS_APPROXIMATION:
        return t('itemsSuffixApproximation');
      case Item.STATUS_CONSULTING:
        return t('itemsSuffixConsulting');
      case Item.STATUS_STITCH:
        return t('itemsSuffixStitch');
      case Item.STATUS_FINALIZED:
        return t('itemsSuffixFinalized');
      default:
        return ''
    }
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
   * Writer's pseudonym
   * @type {string}
   */
  pseudonym = '';

  /**
   * Title of the item (is build from other data)
   * @type {string}
   */
  title = null;

  /**
   * Whole correction status of the writer (over all tasks)
   * @type {string}
   */
  correction_status = '';

  /**
   * Own grading status of this item
   * @type {string}
   * @see Summary
   */
  grading_status = '';

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
    if (data.pseudonym !== undefined && data.pseudonym !== null) {
      this.pseudonym = data.pseudonym.toString();
    }
    if (data.correction_status !== undefined && data.correction_status !== null) {
      this.correction_status = data.correction_status.toString();
    }
    if (data.grading_status !== undefined && data.grading_status !== null) {
      this.grading_status = data.grading_status.toString();
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

    if (this.title === null) {
      this.title = Item.buildTitle(this);
    }
  }

  /**
   * @return {string}
   */
  getKey() {
    return this.key
  }

  /**
   * @return {string}
   */
  getTaskKey() {
    return Task.buildKey(this.task_id);
  }

  /**
   * Get a plain data object from the public properties
   * @returns {object}
   */
  getData() {
    return Object.assign({}, this);
  }
}
