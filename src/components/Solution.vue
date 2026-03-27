<script setup>
import {stores} from "@/store";
import { nextTick, watch } from 'vue';

const taskStore = stores.tasks();
const layoutStore = stores.layout();

function handleBeforeinput(event) {
  event.preventDefault();
  return false;
}

async function handleFocusChange() {
  if (layoutStore.focusTarget == 'solution') {
    await nextTick();
    document.getElementById('app-solution').focus();
  }
}
handleFocusChange();
watch(() => layoutStore.focusChange, handleFocusChange);

</script>

<template>
  <div id="app-solution" class="xlas-content"
       contenteditable="true"
       @beforeinput="handleBeforeinput"
       v-html="taskStore.currentTask?.solution"></div>
</template>

<style>
/* Must be global because of v-html used for the instructions */
@import '@/styles/content.css';

</style>
<style scoped>

#app-solution {
  height: 100%;
  padding: 20px;
  border: 1px solid #cccccc;
  overflow-y: scroll;
}


</style>
