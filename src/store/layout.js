/**
 * Layout Store
 * Handles visibility of user interface components
 */
import {getStorage} from "@/lib/Storage";
import {defineStore} from 'pinia';
import {stores} from "@/store/index";
import {nextTick} from "vue";

const storage = getStorage('layout');

export const useLayoutStore = defineStore('layout', {
  state: () => {
    return {
      // saved in storage
      expandedColumn: 'none',             // left|right|none
      leftContent: 'essay',               // instructions|instructionsPdf|solution|solutionPdf|resources|essay|correction
      rightContent: 'marking',            // summary|marking|correction

      showMarkingComments: true,          // display of the comments on marking column
      showMarkingGeneralCriteria: true,   // display of the general criteria on marking column
      showMarkingCommentCriteria: true,   // display of the comment criteria on marking column
      showMarkingText: false,             // display of the summary text on marking column

      showLeftSummaryCriteria: true,      // display of the criteria table on the left summary column
      showRightSummaryCriteria: true,     // display of the criteria table on the right summary column

      showLeftSummaryText: true,          // display of the summary text on the left summary column
      showRightSummaryText: true,         // display of the summary text on the right summary column

      // not stored
      leftCorrectionKey: '',               // key of the correction shown on the left side
      rightCorrectionKey: '',              // key of the correction shown on the right side
      showIncludesPopup: false,           // show the popup to set the included elements

      initialized: false,                 // used to switch from startup screen to the editing view
      showInitFailure: false,             // show a message that the initialisation failed
      showItemLoadFailure: false,         // show a message that the loading if an item failed
      showAuthorization: false,           // show the dialog for authorization
      showSendFailure: false,             // show a message about a sending failure
      showDataReplaceConfirmation: false, // show a confirmation that the stored data should be replaced by another task or user
      showItemReplaceConfirmation: false, // show a confirmation that the stored item should be replaced by another item

      focusTarget: '',                    // target for setting the focus (header|navigation|left|right|ownSummary)
      focusChange: 0                      // indicator to set the focus to the target
    }
  },

  /**
   * Getter functions (with params) start with 'get', simple state queries not
   */
  getters: {
    isLeftExpanded: state => state.expandedColumn == 'left',
    isRightExpanded: state => state.expandedColumn == 'right',

    isInstructionsSelected: state => state.leftContent == 'instructions',
    isInstructionsPdfSelected: state => state.leftContent == 'instructionsPdf',
    isSolutionSelected: state => state.leftContent == 'solution',
    isSolutionPdfSelected: state => state.leftContent == 'solutionPdf',
    isResourcesSelected: state => state.leftContent == 'resources',
    isEssaySelected: state => state.leftContent == 'essay',
    isSummarySelected: state => state.rightContent == 'summary',
    isMarkingSelected: state => state.rightContent == 'marking',
    isLeftCorrectionSelected: state => state.leftContent == 'correction',
    isRightCorrectionSelected: state => state.rightContent == 'correction',

    isInstructionsVisible: state => (state.isInstructionsSelected && state.isLeftVisible),
    isInstructionsPdfVisible: state => (state.isInstructionsPdfSelected && state.isLeftVisible),
    isSolutionVisible: state => (state.isSolutionSelected && state.isLeftVisible),
    isSolutionPdfVisible: state => (state.isSolutionPdfSelected && state.isLeftVisible),
    isResourcesVisible: state => (state.isResourcesSelected && state.isLeftVisible),
    isEssayVisible: state => (state.isEssaySelected && state.isLeftVisible),
    isSummaryVisible: state => (state.isSummarySelected && state.isRightVisible),
    isMarkingVisible: state => (state.isMarkingSelected && state.isRightVisible),
    isLeftCorrectionVisible: state => (state.isLeftCorrectionSelected && state.isLeftVisible),
    isRightCorrectionVisible: state => (state.isRightCorrectionSelected && state.isRightVisible),

    isLeftVisible: state => {
      const apiStore = stores.api();
      return !apiStore.isLoading && state.expandedColumn != 'right'
    },

    isRightVisible: state => {
      const apiStore = stores.api();
      return !apiStore.isLoading && state.expandedColumn != 'left'
    },

    leftCorrectionTitle: state => {
      const correctionsStore = stores.corrections();
      const correction = correctionsStore.getCorrection(state.leftCorrectionKey);
      return correction ? 'Korrektur von ' + correction.title + ' ' + correctionsStore.getPositionText(
        correction.correction_key) : ''
    },

    rightCorrectionTitle: state => {
      const correctionsStore = stores.corrections();
      const correction = correctionsStore.getCorrection(state.rightCorrectionKey);
      return correction ? 'Korrektur von ' + correction.title + ' ' + correctionsStore.getPositionText(
        correction.correction_key) : ''
    },

    getCorrectionIsVisible: state => {

      /**
       * Get if a correction's summary is visible
       *
       * @param {string} correction_key
       * @returns {boolean}
       */
      const fn = function (correction_key) {
        return state.leftCorrectionKey == correction_key && state.isLeftCorrectionVisible
          || state.rightCorrectionKey == correction_key && state.isRightCorrectionVisible
      }
      return fn;
    },
  },

  actions: {

    async clearStorage() {
      try {
        await storage.clear();
      }
      catch (err) {
        console.log(err);
      }
      this.$reset();
    },

    async loadFromStorage() {
      try {
        this.$reset();

        const data = await storage.getItem('layout');
        if (data) {
          this.expandedColumn = data.expandedColumn;
          this.rightContent = data.rightContent;
          this.showMarkingComments = !!data.showMarkingComments,
          this.showMarkingGeneralCriteria = !!data.showMarkingGeneralCriteria,
          this.showMarkingCommentCriteria = !!data.showMarkingCommentCriteria,
          this.showMarkingText = !!data.showMarkingText,
          this.showLeftSummaryCriteria = !!data.showLeftSummaryCriteria;
          this.showRightSummaryCriteria = !!data.showRightSummaryCriteria;
          this.showLeftSummaryText = !!data.showLeftSummaryText;
          this.showRightSummaryText = !!data.showRightSummaryText;
        }

        if (!this.showMarkingComments && !this.showMarkingGeneralCriteria && !this.showMarkingCommentCriteria) {
          this.showMarkingComments = true;
        }
        if (!this.showLeftSummaryCriteria && !this.showLeftSummaryText) {
          this.showLeftSummaryCriteria = true;
        }
        if (!this.showRightSummaryCriteria && !this.showRightSummaryText) {
          this.showRightSummaryCriteria = true;
        }
      }
      catch (err) {
        console.log(err);
      }
    },

    async saveToStorage() {
      try {
        await storage.setItem('layout', {
          expandedColumn: this.expandedColumn,
          leftContent: this.leftContent,
          rightContent: this.rightContent,
          showMarkingComments: this.showMarkingComments,
          showMarkingGeneralCriteria: this.showMarkingGeneralCriteria,
          showMarkingCommentCriteria: this.showMarkingCommentCriteria,
          showMarkingText: this.showMarkingText,
          showLeftSummaryCriteria: this.showLeftSummaryCriteria,
          showRightSummaryCriteria: this.showRightSummaryCriteria,
          showLeftSummaryText: this.showLeftSummaryText,
          showRightSummaryText: this.showRightSummaryText
        })
      }
      catch (err) {
        console.log(err);
      }
    },

    showInstructions() {
      this.leftContent = 'instructions';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showInstructionsPdf() {
      this.leftContent = 'instructionsPdf';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showSolution() {
      this.leftContent = 'solution';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showSolutionPdf() {
      this.leftContent = 'solutionPdf';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showResources() {
      this.leftContent = 'resources';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showLeftCorrection() {
      this.leftContent = 'correction';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showRightCorrection() {
      this.rightContent = 'correction';
      this.setRightVisible();
      this.saveToStorage();
    },

    showEssay() {
      this.leftContent = 'essay';
      this.setLeftVisible();
      this.saveToStorage();
    },

    showMarking() {
      this.rightContent = 'marking';
      this.setRightVisible();
      this.saveToStorage();
    },

    showSummary() {
      this.rightContent = 'summary';
      this.setRightVisible();
      this.saveToStorage();
    },

    showOwnSummaryText() {
      this.rightContent = 'summary';
      this.showRightSummaryText = true
      this.setRightVisible('ownSummary');
      this.saveToStorage();
    },

    setLeftVisible(target = null) {
      if (!this.isLeftVisible) {
        this.expandedColumn = 'left';
        this.saveToStorage();
      }
      if (target === null) {
        switch(this.leftContent) {
          case 'instructions':
          case 'solution':
          case 'essay':
            target = this.leftContent;
            break;
        }
      }
      this.setFocusChange(target ?? 'appHeadLeft');
    },

    setRightVisible(target = null) {
      if (!this.isRightVisible) {
        this.expandedColumn = 'right';
        this.saveToStorage();
      }
      this.setFocusChange(target ?? 'appHeadRight');
    },

    setLeftExpanded(expanded) {
      this.expandedColumn = expanded ? 'left' : 'none';
      this.saveToStorage();
    },

    setRightExpanded(expanded) {
      this.expandedColumn = expanded ? 'right' : 'none';
      this.saveToStorage();
    },

    focusMarkingCommentCriteriaSum() {
      if (!this.showMarkingComments) {
        this.showMarkingComments = true;
        this.saveToStorage();
      }
      this.setFocusChange('markingCommentCriteriaSum');
    },

    focusMarkingGeneralCriteria() {
      if (!this.showMarkingGeneralCriteria) {
        this.showMarkingGeneralCriteria = true;
        this.saveToStorage();
      }
      this.setFocusChange('markingGeneralCriteria');
    },

    focusMarkingCommentCriteria() {
      if (!this.showMarkingCommentCriteria) {
        this.showMarkingCommentCriteria = true;
        this.saveToStorage();
      }
      this.setFocusChange('markingCommentCriteria');
    },

    toggleMarkingComments() {
      this.showMarkingComments = !this.showMarkingComments
      this.saveToStorage();
    },

    toggleMarkingGeneralCriteria() {
      this.showMarkingGeneralCriteria = !this.showMarkingGeneralCriteria
      this.saveToStorage();
    },

    toggleMarkingCommentCriteria() {
      this.showMarkingCommentCriteria = !this.showMarkingCommentCriteria
      this.saveToStorage();
    },

    toggleMarkingText() {
      this.showMarkingText = !this.showMarkingText
      this.saveToStorage();
    },

    toggleLeftSummaryCriteria() {
      this.showLeftSummaryCriteria = !this.showLeftSummaryCriteria
      this.saveToStorage()
    },

    toggleRightSummaryCriteria() {
      this.showRightSummaryCriteria = !this.showRightSummaryCriteria
      this.saveToStorage()
    },

    toggleLeftSummaryText() {
      this.showLeftSummaryText = !this.showLeftSummaryText
      this.saveToStorage()
    },

    toggleRightSummaryText() {
      this.showRightSummaryText = !this.showRightSummaryText
      this.saveToStorage()
    },

    selectCorrection(correction_key) {
      const apiStore = stores.api();
      const correctionsStore = stores.corrections();

      if (this.leftCorrectionKey == correction_key) {
        this.showLeftCorrection();
      } else if (this.rightCorrectionKey == correction_key) {
        this.showRightCorrection();
      } else if (stores.corrections().ownKey) {
        this.leftCorrectionKey = correction_key;
        this.showLeftCorrection();
      } else if (correctionsStore.countCorrections == 1) {
        this.rightCorrectionKey = correction_key;
        this.showRightCorrection();
      } else if (this.leftCorrectionKey == '') {
        this.leftCorrectionKey = correction_key;
        this.showLeftCorrection();
      } else if (this.rightCorrectionKey == '') {
        this.rightCorrectionKey = correction_key;
        this.showRightCorrection();
      } else {
        this.leftCorrectionKey = correction_key;
        this.showLeftCorrection();
      }
    },

    setFocusChange(target) {
      this.focusTarget = target;
      this.focusChange = Date.now();
    },

    handleKeyDown(event) {
      if (event.altKey) {
        switch (event.key) {
          case '0':
            this.setFocusChange('header');
            break;
          case '1':
            this.setLeftVisible();
            break;
          case '2':
            this.setRightVisible();
            break;
          case '#':
            this.setFocusChange('navigation');
            break;
        }
      }
    }
  }

});

