/**
 * Config Store
 * handles the editor config of the assessment
 */
import {getStorage} from "@/lib/Storage";
import i18n from "@/plugins/i18n";
import {defineStore} from 'pinia';
import Comment from "@/data/Comment";
import {stores} from "@/store/index";

const storage = getStorage('config');

const { t } = i18n.global

const startState = {
  // saved in storage
  primary_color: null,            // color for the background of primary actions
  primary_text_color: null,       // color for the text of primary actions
  corrector1_color: null,         // marking color of corrector 1
  corrector2_color: null,         // marking color of corrector 2
  corrector3_color: null          // marking color of corrector 3
}

function hexToRgba(hex, alpha) {
  hex = hex.replace(/^#/, '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const useConfigStore = defineStore('config', {
  state: () => {
    return startState;
  },

  getters: {

    primaryColorCss (state) {
      if (state.primary_color) {
        return '#' + state.primary_color
      }
      return '';
    },

    primaryTextColorCss(state) {
      if (state.primary_text_color) {
        return '#' + state.primary_text_color
      }
      return '';
    },

    primaryTextColorFullCss(state) {
      if (state.primary_text_color) {
        return 'color: #' + state.primary_text_color + ';'
      }
      return '';
    },

    getDefaultCommentColor(state) {

      const correctionStore = stores.corrections();
      const own_position = correctionStore.ownCorrection?.position;

      /**
       * Get the default color used for marking an own comment
       */
      const fn = function (selected = false) {
        return state.getCommentColor(own_position, selected);
      }
      return fn;
    },

    getCommentColor(state) {

      /**
       * Get the color used for marking a comment
       *
       * @param {number} position
       * @returns {string}
       */
      const fn = function (position, selected = false) {
        switch (position) {
          case 0:
            return hexToRgba(state.corrector1_color, selected ? 1: 0.4);
          case 1:
            return hexToRgba(state.corrector2_color, selected ? 1: 0.4);
          case 2:
            return hexToRgba(state.corrector3_color, selected ? 1: 0.4);
          default:
            return hexToRgba('CCCCCC', selected ? 1: 0.4);
        }
      }
      return fn;
    },

    getCommentStyle(state) {

      /**
       * Get the style attribute for a comment by correction position and selection
       *
       * @param {number} position
       * @returns {string}
       */
      const fn = function (position, selected) {
        return 'background-color: ' +  state.getCommentColor(position, selected);
      }
      return fn;
    }
  },

  actions: {

    async clearStorage() {
      try {
        this.$reset();
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromStorage() {
      try {
        this.$patch(await storage.getItem('config'));
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromBackend(data = {}) {
      try {
        this.$patch({
          primary_color: data.primary_color ?? null,
          primary_text_color: data.primary_text_color ?? null,
          corrector1_color: data.corrector1_color ?? null,
          corrector2_color: data.corrector2_color ?? null,
          corrector3_color: data.corrector3_color ?? null,
        });
        await storage.setItem('config',  Object.assign({}, this.$state));
      }
      catch (err) {
        console.log(err);
      }
    }
  }
});
