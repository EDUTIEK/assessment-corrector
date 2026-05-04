<script setup>
/**
 * Display of a PDF essay
 * Correction Marks can be set for test and free hand
 */
import {stores} from "@/store";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';
import {nextTick, onMounted, ref, watch} from 'vue';
import Comment from "@/data/Comment";

const essayStore = stores.essay();
const commentsStore = stores.comments();
const layoutStore = stores.layout();
const summariesStore = stores.summaries();

const EssayNode = ref();

const selectedTool = ref('text');
const selectedDrawMode= ref('marker');

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
      break;

    case 'free':
      pdfjs.enableFreeFormHighlight(true);
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
    for (const mark of comment.marks) {
      if (mark.internal) {
        all.push({
          id: mark.key,
          page: comment.parent_number - 1,
          intern: JSON.parse(mark.internal)
        });
      }
    }
  }

  pdfjs.setAll(all);
}
watch(() => commentsStore.filterKeys, loadMarks);
watch(() => commentsStore.showOtherCorrections, loadMarks);

function getEventData(event) {
  console.log(event);
  return {
    key: event.detail.id,
    internal: JSON.stringify(event.detail.intern),
    parent_number: event.detail.page + 1,
    pos: {x: event.detail.pos.x * 1000, y: event.detail.pos.y * 1000}
  };
}

async function createMark(event) {
  const data = getEventData(event);

  if (!commentsStore.getCommentByMarkKey(data.key)) {
    // new mark will create a new comment
    const newComment = new Comment({parent_number: data.parent_number});
    newComment.addMarkData(data);
    await commentsStore.addComment(newComment);
  }
}

function updateMark(event) {
  const data = getEventData(event);
  const comment = commentsStore.getCommentByMarkKey(data.key);
  if (comment) {
    const oldData = comment.getData();
    comment.updateMarkData(data);
    const newData = comment.getData();
    if (JSON.stringify(oldData) != JSON.stringify(newData)) {
      commentsStore.updateComment(comment, true);
    }
  }
}

function deleteMark(event) {
  const data = getEventData(event);
  const comment = commentsStore.getCommentByMarkKey(data.key);
  if (comment) {
    commentsStore.deleteComment(comment.key);
  }
}

function selectMark(event) {
  if (event.detail) {
    const data = getEventData(event);
    const comment = commentsStore.getCommentByMarkKey(data.key);
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
  const blob = await pdfjs.buildBlob();
  console.log(blob);
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
      </v-btn-toggle>

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