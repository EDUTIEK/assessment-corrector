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
import PdfAnnotator from '@/lib/PdfAnnotator';

const essayStore = stores.essay();
const commentsStore = stores.comments();
const layoutStore = stores.layout();
const summariesStore = stores.summaries();

const EssayNode = ref();

const selectedTool = ref('text');
const selectedDrawMode= ref('marker');
const showLabels = ref(true);

const annotator = new PdfAnnotator();

let pdfjs;

onMounted(() => {
  pdfjs = createPDFJsApi(EssayNode.value, './annotate-pdf/pdfjs-dist/web/viewer.html', essayStore.url);
  pdfjs.setDefaultColor(stores.config().defaultCommentColorHex);
  pdfjs.enableFreeFormHighlight(false);
  pdfjs.setDrawMode('marker'); // or 'underline'
  loadMarks();
  pdfjs.on('create', createMark);
  pdfjs.on('update', updateMark);
  pdfjs.on('delete', deleteMark);
  pdfjs.on('select', selectMark);
  pdfjs.on('pageChanged', pageChanged);
  handleFocusChange();
});

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
  }
}

function selectDrawMode(drawMode = null) {

  if (drawMode) {
    selectedDrawMode.value = drawMode;
  }

  switch (selectedDrawMode.value) {
    case 'marker':
      pdfjs.setDrawMode('marker');
      break;

    case 'underline':
      pdfjs.setDrawMode('underline');
      break;

    case 'wave':
      pdfjs.setDrawMode('wave');
      break;
  }
}

async function handleFocusChange() {
  if (layoutStore.isEssaySelected) {
    await nextTick();
    EssayNode.value.focus();
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

function loadMarks() {
  const all = [];
  for (const comment of commentsStore.activeComments) {
    for (const annotation of comment.getPdfAnnotations()) {
      if (!showLabels.value) {
        annotation.label = '';
      }
      all.push(annotation);
    }
  }
  pdfjs.setAll(all);
}
watch(() => commentsStore.markerChange, loadMarks);
watch(() => commentsStore.filterChange, loadMarks);
watch(() => commentsStore.showOtherCorrections, loadMarks);


function toggleLabels() {
  if (showLabels.value == 1) {
    showLabels.value = 0;
  } else {
    showLabels.value = 1;
  }
  loadMarks();
}

async function createMark(event) {

  const annotation = event.detail;
  const data = {
    key: annotation.id,
    shape: '',
    internal: JSON.stringify(annotation.intern),
    parent_number: annotation.page + 1,
    pos: {x: annotation.pos.x * 1000, y: annotation.pos.y * 1000}
  }

  if (selectedTool.value == 'free') {
    data.shape = Mark.SHAPE_FREE_MARKER;
  } else {
    switch(annotation.type) {
      case 'marker':
        data.shape = Mark.SHAPE_TEXT_MARKER;
        break;
      case 'underline':
        data.shape = Mark.SHAPE_TEXT_UNDERLINE;
        break;
      case 'wave':
        data.shape = Mark.SHAPE_TEXT_WAVE;
        break;
    }
  }

  if (!commentsStore.getCommentByMarkKey(data.key)) {
    // new mark will create a new comment
    const newComment = new Comment({parent_number: event.detail.page + 1});
    newComment.addMarkData(data);
    await commentsStore.addComment(newComment);
    commentsStore.selectComment(newComment.key);
  }
}

function updateMark(event) {
  // no need to update a mark by pdfjs event
  // all changes to existing marks are done outside

  // const comment = commentsStore.getCommentByMarkKey(event.detail.id);
  // if (comment) {
  //   const oldData = comment.getData();
  //   comment.updateMarkData(data);
  //   const newData = comment.getData();
  //   if (JSON.stringify(oldData) != JSON.stringify(newData)) {
  //     commentsStore.updateComment(comment, true);
  //   }
  // }
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
    }
    else {
      commentsStore.selectComment('');
    }
  }
}

function pageChanged(event) {
  let comments = commentsStore.getActiveCommentsByParentNumber(event.detail);
  if (comments.length) {
    let comment = comments.shift();
    commentsStore.setFirstVisibleComment(comment.key);
  }
}

function refreshSelection() {
  const comment = commentsStore.selectedComment;
  if (comment) {
    for (const mark of comment.marks) {
      pdfjs.select(mark.key);
    }
  }
}
watch(() => commentsStore.selectionChange, refreshSelection);

function handleDeleted()
{
  const comment = commentsStore.lastDeleted;
  if (comment) {
    for (const mark of comment.marks) {
      pdfjs.delete(mark.key);
    }
  }
}
watch(() => commentsStore.deletionChange, handleDeleted);

async function download()
{
  const blob = await annotator.getSumPdf();
  const url = URL.createObjectURL(blob.data);

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


      <v-btn-toggle v-if="stores.settings().Task.enable_comments" density="comfortable" variant="outlined" divided v-model="selectedTool">
        <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-cursor-text" value="text" @click="selectTool('text')"></v-btn>
        <v-btn :disabled="summariesStore.isOwnDisabled" size="small" icon="mdi-draw" value="free" @click="selectTool('free')"></v-btn>
      </v-btn-toggle>

      &nbsp;

      <v-btn-toggle v-if="stores.settings().Task.enable_comments" density="comfortable" variant="outlined" divided v-model="selectedDrawMode">
        <v-btn :disabled="summariesStore.isOwnDisabled || selectedTool == 'free'" size="small" icon="mdi-marker" value="marker" @click="selectDrawMode('marker')"></v-btn>
        <v-btn :disabled="summariesStore.isOwnDisabled || selectedTool == 'free'" size="small" icon="mdi-format-underline" value="underline" @click="selectDrawMode('underline')"></v-btn>
        <v-btn :disabled="summariesStore.isOwnDisabled || selectedTool == 'free'" size="small" icon="mdi-format-underline-wavy" value="wave" @click="selectDrawMode('wave')"></v-btn>
      </v-btn-toggle>

      &nbsp;

      <v-btn-group v-if="stores.settings().Task.enable_comments" density="comfortable" variant="outlined" divided>
        <v-btn size="small" :active="!!showLabels" icon="mdi-label-outline" @click="toggleLabels"></v-btn>
      </v-btn-group>

      &nbsp;

      <v-btn variant="text" prepend-icon="mdi-download" @click="download">Download</v-btn>

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