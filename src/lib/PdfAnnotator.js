import {stores} from "@/store/index";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';
import Mark from '@/data/Mark';

export default class PdfAnnotator {

  element = null;

  async load(url) {
    await this.unload();
    this.element = document.createElement('div');
    document.body.appendChild(this.element);
    this.pdf = createPDFJsApi(this.element, './annotate-pdf/pdfjs-dist/web/viewer.html', url);
  }

  async unload() {
    if (this.pdf) {
      await this.pdf.destroy();
    }

    if (this.element) {
      document.body.removeChild(this.element);
      this.element = null;
    }
  }

  /**
   * @param {string } scope 'own'|'all'
   * @returns {Promise<Blob>}
   */
  async build(scope) {

    if (this.pdf === null) {
      return null;
    }
    switch(scope) {
      case 'own':
        return await this.#buildFor(this.filterAndRenumber(stores.comments().ownComments));
      case 'all':
        return await this.#buildFor(this.filterAndRenumber(stores.comments().allComments));
    }
    return null;
  }

  /**
   * Filter and renumber the comments for the written pdf
   * Comments without details should not get a label
   *
   * @param {Comment[]}
   * @returns {Comment[]}
   */
  filterAndRenumber(original_comments) {
    const correctionStore = stores.corrections();

    let current_parent = 0;
    let number = 1;
    const comments = [];

    for (const original of original_comments) {
      const comment = original.clone();
      const correction = correctionStore.getCorrection(comment.correction_key);
      const initials = correction ? correction.initials : '';

      const parent_no = comment.parent_number;
      if (parent_no !== current_parent) {
        current_parent = parent_no;
        number = 1;
      }

      if (this.hasDetailsToShow(comment)) {
        comment.label = initials + ' ' + parent_no.toString() + '.' + number.toString();
        number++;
      } else {
        comment.label = '';
      }

      comments.push(comment);
    }
    return comments;
  }

  /**
   * Check if the comment should get a numbered label
   * This must correspond to CorrectorCommentInfo::hasDetailsToShow in the php backend
   * @return {bool}
   */
  hasDetailsToShow(comment) {
    if (comment.comment || comment.rating_cardinal || comment.rating_excellent) {
      return true;
    }

    for (const mark of comment.marks) {
      if (mark.symbol) {
        return true;
      }

      if (stores.points().getCommentHasPoints(comment.key)) {
        return true;
      }
    }

    return false;
  }

  /**
   * @returns {Promise<Blob>}
   */
  async #buildFor(comments) {
    const annotations = [];
    for (const comment of comments) {
      for (const annotation of comment.getPdfAnnotations(true)) {
        annotation.text = comment.getLabelAndComment();
        annotations.push(annotation);
      }
    }
    await this.pdf.setAll(annotations);

    const result = await this.pdf.buildBlob();
    return result.data;
  }

}
