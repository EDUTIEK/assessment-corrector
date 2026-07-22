import MarkPoint from '@/data/MarkPoint';
import i18n from "@/plugins/i18n";
const { t } = i18n.global;

/**
 * Correction Mark
 */
class Mark {

  // Image shapes
  static SHAPE_CIRCLE = 'circle';
  static SHAPE_RECTANGLE = 'rectangle';
  static SHAPE_POLYGON = 'polygon';
  static SHAPE_LINE = 'line';
  static SHAPE_WAVE = 'wave';

  // Pdf shapes
  static SHAPE_FREE_MARKER = 'free_marker';
  static SHAPE_TEXT_MARKER = 'text_marker';
  static SHAPE_TEXT_UNDERLINE = 'text_underline';
  static SHAPE_TEXT_WAVE = 'text_wave';
  static SHAPE_TEXT_VLINE = 'text_vline';

  // These shapes can be set in setData
  static ALLOWED_SHAPES = [
      Mark.SHAPE_CIRCLE, Mark.SHAPE_RECTANGLE, Mark.SHAPE_POLYGON, Mark.SHAPE_LINE, Mark.SHAPE_WAVE,
      Mark.SHAPE_FREE_MARKER, Mark.SHAPE_TEXT_MARKER, Mark.SHAPE_TEXT_UNDERLINE, Mark.SHAPE_TEXT_WAVE, Mark.SHAPE_TEXT_VLINE
  ];

  // These shapes get a lighter color when not being selected
  static FILLED_SHAPED = [
    Mark.SHAPE_CIRCLE, Mark.SHAPE_RECTANGLE, Mark.SHAPE_POLYGON,
    Mark.SHAPE_FREE_MARKER, Mark.SHAPE_TEXT_MARKER
  ];

  static SYMBOL_CHECK = '✓';
  static SYMBOL_CROSS = '✗';
  static SYMBOL_QUESTION = '?';
  static SYMBOL_EXCLAMATION = "!";
  static SYMBOL_MISSING = "⩝";

  static shapeFromPdfAnnotationType(type) {
    switch(type) {
      case 'marker':
        return Mark.SHAPE_TEXT_MARKER;
      case 'underline':
        return Mark.SHAPE_TEXT_UNDERLINE;
      case 'wave':
        return Mark.SHAPE_TEXT_WAVE;
      case 'vline':
        return Mark.SHAPE_TEXT_VLINE;
    }
    return '';
  }

  static shapeToPdfAnnotationType(shape) {
    switch(shape) {
      case Mark.SHAPE_TEXT_MARKER:
        return 'marker';
      case Mark.SHAPE_TEXT_UNDERLINE:
        return 'underline';
      case Mark.SHAPE_TEXT_WAVE:
        return 'wave';
      case Mark.SHAPE_TEXT_VLINE:
        return 'vline';
    }
    return 'marker';
  }

  static symbolFromPdfAnnotationToken(token) {
    switch(token) {
      case 'check':
        return Mark.SYMBOL_CHECK;
      case 'cross':
        return Mark.SYMBOL_CROSS;
      case 'question-mark':
        return Mark.SYMBOL_QUESTION;
      case 'exclamation-point':
        return Mark.SYMBOL_EXCLAMATION;
      case 'missing':
        return Mark.SYMBOL_MISSING;
    }
    return '';
  }

  static symbolToPdfAnnotationToken(symbol) {
    switch(symbol) {
      case Mark.SYMBOL_CHECK:
        return 'check';
      case Mark.SYMBOL_CROSS:
        return 'cross';
      case Mark.SYMBOL_QUESTION:
        return 'question-mark';
      case Mark.SYMBOL_EXCLAMATION:
        return 'exclamation-point';
      case  Mark.SYMBOL_MISSING:
        return 'missing';
    }
    return '';
  }

  static symbolToText(symbol) {
    switch (symbol) {
      case Mark.SYMBOL_CHECK:
        return t('symbolCheck');
      case Mark.SYMBOL_CROSS:
        return t('symbolCross');
      case Mark.SYMBOL_QUESTION:
        return t('symbolQuestion');
      case Mark.SYMBOL_EXCLAMATION:
        return t('symbolExclamation');
      case  Mark.SYMBOL_MISSING:
        return t('symbolMissing');
    }
    return '';
  }

  static symbolToLabel(symbol) {
    return symbol;
  }

  static symbolToComment(symbol) {
    switch(symbol) {
      case  Mark.SYMBOL_MISSING:
        return '∀';
    }
    return symbol;
  }


  /**
   * Key of a graphical mark (is kept in database)
   * @type {string}
   */
  key = '';

  /**
   * Shape of a graphical mark (see constant)
   * @type {string}
   */
  shape = '';

  /**
   * Start position of a graphical mark
   * @type {MarkPoint}
   */
  pos = new MarkPoint({x:0, y:0});

  /**
   * End position of a graphical mark (line or wave)
   * @type {MarkPoint}
   */
  end = new MarkPoint({x:0, y:0});

  /**
   * Width of a graphical mark (rectangle)
   * @type {integer}
   */
  width = 0;

  /**
   * Height of a graphical mark (rectangle)
   * @type {integer}
   */
  height = 0;

  /**
   * Polygon of a graphical mark (polygon)
   * @type {MarkPoint[]}
   */
  polygon = [];


  /**
   * Symbol to be displayed in a circle
   * @type {string}
   */
  symbol = '';

  /**
   * Internal data of a pdf.js mark
   * @type {null}
   */
  internal = null;

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
    if (data.key !== undefined && data.key !== null) {
      this.key = data.key;
    }
    if (data.shape !== undefined && Mark.ALLOWED_SHAPES.includes(data.shape)) {
      this.shape = data.shape.toString();
    }
    if (data.pos !== undefined && data.pos !== null) {
      this.pos = new MarkPoint(data.pos);
    }
    if (data.end !== undefined && data.end !== null) {
      this.end = new MarkPoint(data.end);
    }
    if (data.width !== undefined && data.width !== null) {
      this.width = parseInt(data.width);
    }
    if (data.height !== undefined && data.height !== null) {
      this.height = parseInt(data.height);
    }
    if (data.polygon !== undefined && Array.isArray(data.polygon)) {
      for (const point_data of data.polygon) {
        this.polygon.push(new MarkPoint(point_data))
      }
    }
    if (data.symbol !== undefined && data.symbol !== null) {
      this.symbol = data.symbol.toString();
    }

    if (data.internal !== undefined && data.internal !== null) {
      this.internal = data.internal.toString();
    }
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    let polygon = [];
    for (const point of this.polygon) {
      polygon.push(point.getData());
    }

    return {
      key: this.key,
      shape: this.shape,
      pos: this.pos.getData(),
      end: this.end.getData(),
      width: this.width,
      height: this.height,
      polygon: polygon,
      symbol: this.symbol,
      internal: this.internal,
    }
  }

  /**
   * Get the icon of the mark
   * @return string
   */
  getIcon() {
    switch (this.shape) {
      case Mark.SHAPE_LINE:
        return 'mdi-minus';
      case Mark.SHAPE_WAVE:
        return 'mdi-wave';
      case Mark.SHAPE_RECTANGLE:
        return 'mdi-rectangle-outline';
      case Mark.SHAPE_POLYGON:
        return 'mdi-vector-triangle';
      case Mark.SHAPE_CIRCLE:
        return 'mdi-circle-outline';
      case Mark.SHAPE_FREE_MARKER:
        return 'mdi-draw';
      case Mark.SHAPE_TEXT_MARKER:
        return 'mdi-marker';
      case Mark.SHAPE_TEXT_UNDERLINE:
        return 'mdi-format-underline';
      case Mark.SHAPE_TEXT_WAVE:
        return 'mdi-format-underline-wavy';
      case Mark.SHAPE_TEXT_VLINE:
        return 'mdi-tally-mark-1';
    }
    return '';
  }

  /**
   * Get if the shape is filled
   * These shapes get a lighter color when not being selected
   * @returns {boolean}
   */
  isFilled() {
    return Mark.FILLED_SHAPED.includes(this.shape);
  }
}

export default Mark;
