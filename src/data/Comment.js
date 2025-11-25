import Mark from '@/data/Mark';
import Item from "@/data/Item";
import Correction from "@/data/Correction";

/**
 * Correction Comment
 */
export default class Comment {

  static RATING_CARDINAL = 'cardinal';
  static RAITNG_EXCELLENT = 'excellent';

  static ALLOWED_RATING = [Comment.RATING_CARDINAL, Comment.RAITNG_EXCELLENT];

  /**
   * Compare two comments for sorting
   * @param {Comment} comment1
   * @param {Comment} comment2
   */
  static order(comment1, comment2) {
    if (comment1.parent_number < comment2.parent_number) {
      return -1;
    } else if (comment1.parent_number > comment2.parent_number) {
      return 1;
    } else if (comment1.start_position < comment2.start_position) {
      return -1;
    } else if (comment1.start_position > comment2.start_position) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * Unique identifier of the comment
   * Will be auto-generated for a new comment with random alpanumeric key (starting with 'temp')
   * Will be replaced with a numeric key when the comment is stored in the backend
   * @type {string}
   */
  key = '';

  /**
   * Key of the correction item to which the comment belongs
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the correction to which the comment belongs
   * @type {string}
   */
  correction_key = '';

  /**
   * Task to which this comment belongs
   * @type {integer}
   */
  task_id = null;

  /**
   * Writer to which this comment belongs
   * @type {integer}
   */
  writer_id = null;

  /**
   * Corrector to which this comment belongs
   * @type {integer}
   */
  corrector_id = null;

  /**
   * Text mark: Number of the first word from the marked text to which the comment belongs
   * Image mark: lowest y position of the marks on the page
   * @type {integer}
   */
  start_position = 0;

  /**
   * Text mark: Number of the last word fom the marked text to which the comment belongs
   * Image mark: ignored
   * @type {integer}
   */
  end_position = 0;

  /**
   * Text mark: Number of the parent paragraph of the first marked word
   * Image mark: Number of the page
   * @type {integer}
   */
  parent_number = 0;

  /**
   * Textual comment
   * @type {string}
   */
  comment = '';

  /**
   * Marked text is excellent
   * @type {bool}
   */
  rating_excellent = false;

  /**
   * Marked text has a cardinal failure
   * @type {bool}
   */
  rating_cardinal = false;

  /**
   * label that should be shown for the comment (not stored, dynamically assigned)
   * @type {string}
   */
  label = '';

  /**
   * 'own' for own comment, 'other' for comments of other corrections (not stored, dynamically assigned)
   * @type {string}
   */
  prefix = '';

  /**
   * Image mark: Graphical marks on PDF image assigned to the comment
   * @type {Mark[]}
   */
  marks = [];

  /**
   * Comment is deleted
   * @type {string}
   */
  deleted = false;


  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    } else {
      // get a temporary random key
      this.key = 'temp' + Math.random().toString();
    }
    if (data.item_key !== undefined && data.item_key !== null) {
      this.item_key = data.item_key.toString()
    }
    if (data.correction_key !== undefined && data.correction_key !== null) {
      this.correction_key = data.correction_key.toString()
    }
    if (data.start_position !== undefined && data.start_position !== null) {
      this.start_position = parseInt(data.start_position);
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
    if (data.end_position !== undefined && data.end_position !== null) {
      this.end_position = parseInt(data.end_position);
    }
    if (data.parent_number !== undefined && data.parent_number !== null) {
      this.parent_number = parseInt(data.parent_number);
    }
    if (data.comment !== undefined && data.comment !== null) {
      this.comment = data.comment.toString()
    }
    if (data.rating == Comment.RAITNG_EXCELLENT) {
      this.rating_excellent = true;
    } else if (data.rating == Comment.RATING_CARDINAL) {
      this.rating_cardinal = true;
    }
    if (data.marks !== undefined && Array.isArray(data.marks)) {
      for (const mark_data of data.marks) {
        this.addMarkData(mark_data);
      }
    }
    if (!this.item_key && this.task_id && this.writer_id) {
      this.item_key = Item.buildKey(this.task_id, this.writer_id)
    }
    if (!this.correction_key && this.task_id && this.corrector_id && this.writer_id) {
      this.correction_key = Correction.buildKey(this.task_id, this.corrector_id, this.writer_id)
    }
  }

  /**
   * Set the correction key and change the ids accordingly
   * @param {string} correction_key
   */
  setCorrectionKey(correction_key) {
    this.correction_key = correction_key;
    this.task_id = Correction.extractTaskId(this.correction_key);
    this.writer_id = Correction.extractWriterId(this.correction_key);
    this.corrector_id = Correction.extractCorrectorId(this.correction_key);
    this.item_key = Item.buildKey(this.task_id, this.writer_id)
  }

  /**
   * Add a new mark by its data
   * @param {object} mark_data
   */
  addMarkData(mark_data) {
    this.marks.push(new Mark(mark_data));
    this.calculateStartPositon();
  }

  /**
   * Set the marks to a new mark
   * @param {object} mark_data
   */
  updateMarkData(mark_data) {
    for (const mark of this.marks) {
      if (mark.key == mark_data.key) {
        mark.setData(mark_data);
      }
    }
    this.calculateStartPositon();
  }

  /**
   * Get the icon of the mark
   * @return string|null
   */
  getMarkIcon() {
    for (const mark of this.marks) {
      return mark.getIcon();
    }
    return null;
  }

  /**
   * Get a mark by its key
   * @param {string }key
   * @return {Mark|null}
   */
  getMarkByKey(key) {
    for (const mark of this.marks) {
      if (mark.key == key) {
        return mark;
      }
    }
    return null;
  }

  /**
   * Get the color for a mark
   * @param {Mark} mark
   */
  getMarkColor(mark) {
    const filled = (mark.shape == Mark.SHAPE_CIRCLE || mark.shape == Mark.SHAPE_POLYGON || mark.shape == Mark.SHAPE_RECTANGLE);

    let color = '';
    if (this.prefix == 'own') {
      if (this.rating_excellent) {
        return filled ? '#E3EFDD80' : '#19e62e';
      } else if (this.rating_cardinal) {
        return filled ? '#FBDED180' : '#bc4710';
      } else {
        return filled ? '#D8E5F480' : '#3365ff';
      }
    } else {
      if (this.rating_excellent) {
        return filled ? '#F7F9F780' : '#19e62e';
      } else if (this.rating_cardinal) {
        return filled ? '#FCF6F480' : '#bc4710';
      } else {
        return filled ? '#F5F7FB80' : '#3365ff';
      }
    }
  }

  /**
   * Get the color for a mark
   * @param {Mark} mark
   */
  getMarkSelectedColor(mark) {
    const filled = (mark.shape == Mark.SHAPE_CIRCLE || mark.shape == Mark.SHAPE_POLYGON || mark.shape == Mark.SHAPE_RECTANGLE);

    if (this.rating_excellent) {
      return filled ? '#BBEBA5A0' : '#19e62e';
    } else if (this.rating_cardinal) {
      return filled ? '#FCB494A0' : '#bc4710';
    } else {
      return filled ? '#94C3FCA0' : '#3365ff';
    }
  }

  /**
   * Calculate the start position as lowest y position of all marks
   */
  calculateStartPositon() {
    let pos = null;
    for (const mark of this.marks) {
      if (pos === null || mark.pos.y > pos) {
        pos = mark.pos.y
      }
    }
    if (pos !== null) {
      this.start_position = pos;
    }
  }

  /**
   * Check if the comment has a mark with a given key
   * @param key
   * @return {boolean}
   */
  hasMarkKey(key) {
    for (const mark of this.marks) {
      if (mark.key == key) {
        return true;
      }
    }
    return false;
  }


  /**
   * Get a plain data object from the public properties
   */
  getData() {
    let marks = [];
    for (const mark of this.marks) {
      marks.push(mark.getData());
    }

    return {
      key: this.key,
      item_key: this.item_key,
      correction_key: this.correction_key,
      task_id: this.task_id,
      writer_id: this.writer_id,
      corrector_id: this.corrector_id,
      start_position: this.start_position,
      end_position: this.end_position,
      parent_number: this.parent_number,
      comment: this.comment,
      rating: this.rating_excellent ? Comment.RAITNG_EXCELLENT : (this.rating_cardinal ? Comment.RATING_CARDINAL : ''),
      marks: marks
    }
  }
}
