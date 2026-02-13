/**
 * Settings Store
 * Handles the editor settings of the writing task
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import i18n from "@/plugins/i18n";
import Summary from '@/data/Summary';
import Procedure from '@/data/Procedure';

const { t } = i18n.global;

const storage = getStorage('settings');

export const useSettingsStore = defineStore('settings', {
  state: () => {
    return {
      Assessment: {
        multiple_correctors: false,     // has a submission multiple corrections
        mutual_visibility: false,       // correction sees other corrections
        procedure_when_distance: false, // should a revision procedure follow when points differ
        procedure: Procedure.NONE,      // type of procedure that follows
        max_auto_distance: 0,           // maximum distance between points to allow an automated points calculation
        revision_between: false,        // points given in a revision must be between the original points of both corrections
        stitch_after_procedure: false,  // the procedure is followed by a stich decision when needed
        max_points: 0,                  // maximum points that can be given
        no_manual_decimals: false,      // manually given points must not have decimals
      },
      Task: {
        positive_rating: t('settingsRatingPositive'),     // label of a positive rating
        negative_rating: t('settingsRatingNegative'),     // label of a negative rating
        enable_comments: false,                           // enable comments on the text
        enable_comment_ratings: false,                    // enable ratings given for the comments
        enable_partial_points: false,                     // enable giving partial points
        enable_summary_pdf: false,                        // enable the upload of a PDF instead of a textual summary
        summary_pdf_advice: null,                         // advice given for the summary
      },
      EssayTask: {
        headline_scheme: null,                            // headline scheme of the essay
      }
    }
  },

  getters: {

    contentClass(state) {
      return state.EssayTask.headline_scheme === 'three' ? 'headlines-three' : ''
    },

    inclusionText(state) {

      let text = '';
      if (state.Task.enable_comments) {
        text = (text ? text + ', ' : '') + t('summariesIncludeComments');
      }
      if (state.Task.enable_comment_ratings) {
        text = (text ? text + ', ' : '') + t('summariesIncludeCommentRatings');
      }
      if (state.Task.enable_partial_points) {
        text = (text ? text + ', ' : '') + t('summariesIncludePartialPoints');
      }
      if (text == '') {
        text = t('summariesIncludeNoDetails')
      }

      return text;
    },

    procedureText(state) {
      switch (state.Assessment.procedure) {
        case Procedure.APPROXIMATION:
          return t('settingsProcedureApproximation');
        case Procedure.CONSULTING:
          return t('settingsProcedureConsulting');
        default:
          return t('settingsProcedureNone');
      }
    },

    hasSummaryOverview(state) {
      return state.Task.enable_comment_ratings || state.Task.enable_partial_points;
    }
  },

  actions: {
    async clearStorage() {
      this.$reset();
      try {
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
    },

    async loadFromStorage() {
      this.$reset();
      try {
        for (const component in this.$state) {
          const data = await storage.getItem(component);
          this.$patch(data);
        }
      }
      catch (err) {
        console.log(err);
      }
    },

    /**
     * Load component settings (don't reset before)
     */
    async loadFromBackend(component, data) {
      this.$state[component] = Object.assign(this.$state[component], data);
      try {
        await storage.setItem(component, Object.assign({}, this.$state[component]));
      }
      catch (err) {
        console.log(err);
      }
    }
  }
});
