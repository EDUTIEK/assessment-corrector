import Item from "@/data/Item";

/**
 * Essay Page
 */
export default class Page {

  /**
   * @return {string}
   */
  static buildKey(id) {
    return 'P' + id;
  }

  static order(page1, page2) {
    return page1.position < page2.position ? -1
        : page1.position > page2.position ? 1
            : 0
  }

  /**
   * Unique identifier of the page
   * @type {string}
   */
  key = '';

  /**
   * Key of the correction item to which the page belongs
   * @type {string}
   */
  item_key = '';

  /**
   * Database id of the page
   * @type {integer}
   */
  id = null;

  /**
   * Task to which this page belongs
   * @type {integer}
   */
  task_id = null;

  /**
   * Writer to which this page belongs
   * @type {integer}
   */
  writer_id = null;

  /**
   * Number of the page in the sequence
   * @type {integer}
   */
  page_no = 0;

  /**
   * Width of the page image
   * @type {integer}
   */
  width = 0;

  /**
   * Height of the page image
   * @type {integer}
   */
  height = 0;

  /**
   * Url to fetch the page image
   * @type {string}
   */
  url = null;

  /**
   * Width of the page thumbnail
   * @type {integer|null}
   */
  thumb_width = null;

  /**
   * Height of the page thumbnail
   * @type {integer|null}
   */
  thumb_height = null;

  /**
   * Url to fetch the page thunbmail
   * @type {string}
   */
  thumb_url = null;

  /**
   * Object url to use a fetched page image
   * Will be set separately and is not provided by getData()
   * Must be revoked if the page is removed
   * @type {string|null}
   */
  objectUrl = null;

  /**
   * Object url to use a fetched page thumbnail
   * Will be set separately and is not provided by getData()
   * Must be revoked if the page is removed
   * @type {string|null}
   */
  thumbObjectUrl = null;

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
    if (data.writer_id !== undefined && data.writer_id !== null) {
      this.writer_id = parseInt(data.writer_id);
    }
    if (data.page_no !== undefined && data.page_no !== null) {
      this.page_no = parseInt(data.page_no);
    }
    if (data.width !== undefined && data.width !== null) {
      this.width = parseInt(data.width);
    }
    if (data.height !== undefined && data.height !== null) {
      this.height = parseInt(data.height);
    }
    if (data.url !== undefined && data.url !== null) {
      this.url = data.url.toString();
    }
    if (data.thumb_width !== undefined && data.thumb_width !== null) {
      this.thumb_width = parseInt(data.thumb_width);
    }
    if (data.thumb_height !== undefined && data.thumb_height !== null) {
      this.thumb_height = parseInt(data.thumb_height);
    }
    if (data.thumb_url !== undefined && data.thumb_url !== null) {
      this.thumb_url = data.thumb_url.toString();
    }

    this.key = Page.buildKey(this.id);
    this.item_key = Item.buildKey(this.task_id, this.writer_id);
  }

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

