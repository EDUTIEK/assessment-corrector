<script setup>
/**
 * Display of a PDF essay
 * Correction Marks can be set for test and free hand
 */
import {stores} from "@/store";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';
import {nextTick, onMounted, ref, watch} from 'vue';
import Comment from "@/data/Comment";
import Mark from "@/data/Mark";

const essayStore = stores.essay();
const correctionsStore = stores.corrections();
const commentsStore = stores.comments();
const layoutStore = stores.layout();
const summariesStore = stores.summaries();
const preferencesStore = stores.preferences();

const EssayNode = ref();

const selectedTool = ref('');
const selectedDrawMode= ref('marker');
const showLabels = ref(false);
const selectWords = ref(true);

// timestamp of the last mark creation
// needed to distinct a 'select' event by mark creation from the click on an empty place
let markCreated = 0;

let pdfjs;

onMounted(() => {
  selectedDrawMode.value = Mark.shapeToPdfAnnotationType(preferencesStore.default_shape);
  showLabels.value = preferencesStore.display_labels;
  selectWords.value = preferencesStore.select_words;

  pdfjs = createPDFJsApi(EssayNode.value, './annotate-pdf/pdfjs-dist/web/viewer.html', essayStore.url);
  pdfjs.setDefaultColor(stores.config().getDefaultCommentColor(true));
  pdfjs.setDrawMode(selectedDrawMode.value);
  pdfjs.enableWordSelection(!!selectWords.value);
  pdfjs.enableTokenButtons(true);
  pdfjs.enableTypeButtons(true);

  loadMarks();
  if (summariesStore.isOwnDisabled) {
    selectTool('');
  } else {
    selectTool('text');
  }
  pdfjs.on('create', createMark);
  pdfjs.on('update', updateMark);
  pdfjs.on('delete', deleteMark);
  pdfjs.on('select', selectMark);
  pdfjs.on('pageChanged', pageChanged);
  pdfjs.on('focus-end', focusEnd);
  handleFocusChange();
});

watch(() => layoutStore.focusChange, handleFocusChange);
watch(() => commentsStore.markerChange, loadMarks);
watch(() => commentsStore.filterChange, loadMarks);
watch(() => commentsStore.showOtherCorrections, loadMarks);
watch(() => commentsStore.selectionChange, refreshSelection);
watch(() => commentsStore.deletionChange, handleDeleted);

function selectTool(tool = null) {

  if (tool) {
    selectedTool.value = tool;
  }

  switch (selectedTool.value) {
    case 'text':
      pdfjs.enableFreeFormHighlight(false);
      pdfjs.enableTextHighlight(true);
      break;

    case 'free':
      pdfjs.enableFreeFormHighlight(true);
      pdfjs.enableTextHighlight(false);
      break;

    default:
      pdfjs.enableFreeFormHighlight(false);
      pdfjs.enableTextHighlight(false);
      break;
  }
}

function selectDrawMode(drawMode = null) {

  if (drawMode) {
    selectedDrawMode.value = drawMode;
  }

  let shape;
  switch (selectedDrawMode.value) {
    case 'underline':
      shape = Mark.SHAPE_TEXT_UNDERLINE;
      pdfjs.setDrawMode('underline');
      break;

    case 'wave':
      shape = Mark.SHAPE_TEXT_WAVE;
      pdfjs.setDrawMode('wave');
      break;

    case 'vline':
      shape = Mark.SHAPE_TEXT_VLINE;
      pdfjs.setDrawMode('vline');
      break;

    case 'marker':
    default:
      shape = Mark.SHAPE_TEXT_MARKER;
      pdfjs.setDrawMode('marker');
      break;
  }

  if (preferencesStore.default_shape !== shape) {
    preferencesStore.default_shape = shape;
    preferencesStore.update();
  }

  const comment = commentsStore.selectedComment;
  if (comment && comment.correction_key == correctionsStore.ownKey && !summariesStore.isOwnDisabled) {
    let changed = false;
    for (const mark of comment.marks) {
      if (mark.shape !== shape) {
        mark.shape = shape;
        changed = true;
        pdfjs.setType(mark.key, Mark.shapeToPdfAnnotationType(shape));
      }
    }
    if (changed) {
      commentsStore.updateComment(comment);
    }
  }
}

async function handleFocusChange() {
  if (layoutStore.isEssaySelected) {
    await nextTick();
    EssayNode.value.focus();
  }
}

async function loadMarks() {
  const all = [];
  for (const comment of commentsStore.activeComments) {
    for (const annotation of comment.getPdfAnnotations()) {
      if (comment.correction_key != stores.corrections().ownKey || summariesStore.isOwnDisabled) {
        annotation.noDelete = true;
      }
      if (!showLabels.value) {
        annotation.label = '';
      }
      all.push(annotation);
    }
  }
  await pdfjs.setAll(all);
  // setAll may leave focus in the iframe without firing focus-end (noFocus add path)
  reclaimCommentFocus();
}

/**
 * True when keyboard focus is in the PDF pane (iframe or wrapper).
 * Used to reclaim focus for the comment textarea after annotate-pdf steals it.
 */
function isFocusInPdf() {
  const active = document.activeElement;
  return !!EssayNode.value && (active === EssayNode.value || EssayNode.value.contains(active));
}

/**
 * Reclaim focus for the sidebar textarea when the PDF pane still holds it.
 * Delayed steals (editor.moveInDOM / toolbar) are handled via the focus-end event.
 */
function reclaimCommentFocus() {
  if (commentsStore.selectedKey && isFocusInPdf()) {
    commentsStore.setFocusRequest();
  }
}

function toggleLabels() {
  showLabels.value = !showLabels.value;
  if (preferencesStore.display_labels !== showLabels.value) {
    preferencesStore.display_labels = showLabels.value;
    preferencesStore.update();
  }
  loadMarks();
}

function toggleWords() {
  selectWords.value = !selectWords.value;
  if (preferencesStore.select_words !== selectWords.value) {
    preferencesStore.select_words = selectWords.value;
    preferencesStore.update();
  }
  pdfjs.enableWordSelection(selectWords.value);
}

async function createMark(event) {
  markCreated = Date.now();

  const annotation = event.detail;
  const data = {
    key: annotation.id,
    shape: Mark.shapeFromPdfAnnotationType(annotation.type),
    symbol: Mark.symbolFromPdfAnnotationToken(annotation.token),
    internal: JSON.stringify(annotation.intern),
    parent_number: annotation.page + 1,
    pos: {x: annotation.pos.x * 1000, y: annotation.pos.y * 1000}
  }

  if (selectedTool.value == 'free') {
    data.shape = Mark.SHAPE_FREE_MARKER;
  }

  if (!commentsStore.getCommentByMarkKey(data.key)) {
    // new mark will create a new comment
    const newComment = new Comment({parent_number: event.detail.page + 1});
    newComment.addMarkData(data);
    await commentsStore.addComment(newComment);
  }
}

function updateMark(event) {
  const annotation = event.detail;
  const data = {
    key: annotation.id,
    shape: Mark.shapeFromPdfAnnotationType(annotation.type),
    symbol: Mark.symbolFromPdfAnnotationToken(annotation.token),
    internal: JSON.stringify(annotation.intern),
    parent_number: annotation.page + 1,
    pos: {x: annotation.pos.x * 1000, y: annotation.pos.y * 1000}
  }

  const comment = commentsStore.getCommentByMarkKey(data.key);
  if (comment) {
    const oldData = comment.getData();
    comment.updateMarkData(data);
    pdfjs.setLabel(annotation.id, comment.label);
    pdfjs.setAltText(annotation.id, comment.getAltText());

    const newData = comment.getData();
    if (JSON.stringify(oldData) != JSON.stringify(newData)) {
      commentsStore.updateComment(comment, false);
    }
  }
}

function shapeFromType(type) {
  switch(type) {
  case 'marker':
    return Mark.SHAPE_TEXT_MARKER;
    break;
  case 'underline':
    return Mark.SHAPE_TEXT_UNDERLINE;
    break;
  case 'wave':
    return Mark.SHAPE_TEXT_WAVE;
    break;
  case 'vline':
    return Mark.SHAPE_TEXT_VLINE;
    break;
  }
}


function deleteMark(event) {
  const comment = commentsStore.getCommentByMarkKey(event.detail.id);
  if (comment) {
    commentsStore.deleteComment(comment.key);
  }
}

function selectMark(event) {
  if (event.detail) {
    const comment = commentsStore.getCommentByMarkKey(event.detail.id);
    if (comment) {
      commentsStore.selectComment(comment.key);
      return;
    }
  }

  if (Date.now() - markCreated > 200) {
    commentsStore.selectComment('');
  }
}

function pageChanged(event) {
  let comments = commentsStore.getActiveCommentsByParentNumber(event.detail);
  if (comments.length) {
    let comment = comments.shift();
    commentsStore.setFirstVisibleComment(comment.key);
  }
}

/**
 * annotate-pdf fires focus-end after PDF.js finishes restoring focus in moveEditorInDOM
 * That is the reliable point to take focus back for the comment textarea
 */
function focusEnd(event) {
  if (!event?.detail?.id || !commentsStore.selectedKey) {
    return;
  }
  const comment = commentsStore.getCommentByMarkKey(event.detail.id);
  if (comment && comment.key === commentsStore.selectedKey) {
    reclaimCommentFocus();
  }
}

async function refreshSelection() {
  const configStore = stores.config();
  const selectedKey = commentsStore.selectedKey;
  const selectIds = [];
  for (const comment of commentsStore.activeComments) {
    for (const mark of comment.marks) {
      pdfjs.setColor(mark.key, configStore.getCommentColor(
          comment.correction_position, comment.key == selectedKey, mark.isFilled()),
      );
      if (comment.key == selectedKey) {
        selectIds.push(mark.key);
        if (showLabels.value == 0) {
          pdfjs.setLabel(mark.key, comment.label);
        }
      }
      else if (showLabels.value == 0) {
        pdfjs.setLabel(mark.key, '');
      }
    }
  }
  if (selectIds.length && selectedKey) {
    for (const id of selectIds) {
      await pdfjs.select(id);
    }
    // Immediate reclaim if select left focus in the PDF; delayed steals use focus-end
    reclaimCommentFocus();
  }
}

function handleDeleted()
{
  const comment = commentsStore.lastDeleted;
  if (comment) {
    for (const mark of comment.marks) {
      pdfjs.delete(mark.key);
    }
  }
}

async function download()
{
  const blob = await essayStore.buildMarkedPdf('all');
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'correction.pdf';

  document.body.appendChild(a); // required in Firefox
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url); // free memory
}

</script>

<template>
  <div class ="appEssayWrapper">
    <div class="appTextButtons">

<!--
      <v-btn-toggle v-if="stores.settings().Task.enable_comments" density="comfortable" variant="outlined" divided v-model="selectedTool">
        <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-cursor-text" value="text" @click="selectTool('text')"></v-btn>
        <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-draw" value="free" @click="selectTool('free')"></v-btn>
      </v-btn-toggle>

      &nbsp;
-->

      <v-btn-toggle v-if="stores.settings().Task.enable_comments" density="comfortable" variant="outlined" divided v-model="selectedDrawMode">
        <v-btn :disabled="summariesStore.isOwnDisabled || selectedTool == 'free'" size="small" icon="mdi-marker" value="marker" @click="selectDrawMode('marker')"></v-btn>
        <v-btn :disabled="summariesStore.isOwnDisabled || selectedTool == 'free'" size="small" icon="mdi-format-underline" value="underline" @click="selectDrawMode('underline')"></v-btn>
        <v-btn :disabled="summariesStore.isOwnDisabled || selectedTool == 'free'" size="small" icon="mdi-format-underline-wavy" value="wave" @click="selectDrawMode('wave')"></v-btn>
        <v-btn :disabled="summariesStore.isOwnDisabled || selectedTool == 'free'" size="small" icon="mdi-tally-mark-1" value="vline" @click="selectDrawMode('vline')"></v-btn>
      </v-btn-toggle>

      &nbsp;

      <v-btn-group v-if="stores.settings().Task.enable_comments" density="comfortable" variant="outlined" divided>
        <v-btn size="small" :active="!!showLabels" icon="mdi-label-outline" @click="toggleLabels"></v-btn>
        <v-btn size="small" :active="!!selectWords" @click="toggleWords">{{ $t('essayPdfSelectWords') }}</v-btn>
      </v-btn-group>

      &nbsp;

      <!-- <v-btn variant="text" prepend-icon="mdi-download" @click="download">Download</v-btn> -->

    </div>
    <div class="appEssayNode" tabindex="0" ref="EssayNode"></div>
  </div>
</template>

<style scoped>

.appEssayWrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.appTextButtons {
  text-align: center;
  padding-bottom: 5px;
  height: 50px;
}

.appEssayNode {
  flex-grow: 1;
  width: 100%;
  height: calc(100% - 50px);
}

</style>