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

    let parent = 0;
    let numbers = {};
    const comments = [];

    for (const original of original_comments) {

      const comment = original.clone();

      const correction = correctionStore.getCorrection(comment.correction_key);
      const initials = correction ? correction.initials : '??';

      if (this.hasDetailsToShow(comment)) {
        if (comment.parent_number > parent) {
          parent = comment.parent_number;
          for (const key of correctionStore.correctionKeys) {
            numbers[key] = 0;                       // reset all numbers for the new parent
          }
          numbers[comment.correction_key] = 1;     // set the number of the first comment

        } else {
          numbers[comment.correction_key]++;
        }
        comment.label = initials + ' ' + parent.toString() + '.' + numbers[comment.correction_key].toString();
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
      for (const annotation of comment.getPdfAnnotations()) {
        annotation.text = comment.getLabelAndComment();
        annotations.push(annotation);
      }
    }
    await this.pdf.setAll(annotations);

    const result = await this.pdf.buildBlob();
    return result.data;
  }

}
