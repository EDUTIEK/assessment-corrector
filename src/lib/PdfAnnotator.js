import {stores} from "@/store/index";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';

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
        return await this.#buildFor(stores.comments().ownComments);
      case 'all':
        return await this.#buildFor(stores.comments().allComments);
    }
    return null;
  }


  /**
   * @returns {Promise<Blob>}
   */
  async #buildFor(comments) {
    const annotations = [];
    for (const comment of comments) {
      for (const annotation of comment.getPdfAnnotations()) {
        annotation.text = '[' + comment.label + '] ' + comment.comment;
        annotations.push(annotation);
      }
    }
    await this.pdf.setAll(annotations);

    // await new Promise((resolve) => setTimeout(resolve, 500));

    const result = await this.pdf.buildBlob();
    return result.data;
  }

}
