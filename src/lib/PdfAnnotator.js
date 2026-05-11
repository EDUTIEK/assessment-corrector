import {stores} from "@/store/index";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';

export default class PdfAnnotator {

  element = null;
  pdf = null;


  async getOwnPdf() {
    return await this.#buildFor(stores.comments().ownComments);

  }

  async getSumPdf() {
    return await this.#buildFor(stores.comments().allComments);
  }


  async #buildFor(comments) {
    this.element = document.createElement('div');
    document.body.appendChild(this.element);
    this.pdf = createPDFJsApi(this.element, './annotate-pdf/pdfjs-dist/web/viewer.html', stores.essay().url);

    const annotations = [];
    for (const comment of stores.comments().allComments) {
      for (const annotation of comment.getPdfAnnotations()) {
        annotation.text = comment.comment;
        annotation.label = comment.label;
        annotations.push(annotation);
      }
    }
    await this.pdf.setAll(annotations);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const blob = await this.pdf.buildBlob();

    await this.pdf.destroy();
    document.body.removeChild(this.element);
    return blob;
  }

}
