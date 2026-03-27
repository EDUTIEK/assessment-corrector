<script setup>
/**
 * Display of a PDF resource with PDFjs
 * Marks can be set for test and free hand
 *
 */
import {stores} from "@/store";
import createPDFJsApi from 'annotate-pdf/pdfjs-api';
import {nextTick, onMounted, ref, watch} from 'vue';

const layoutStore = stores.layout();
const tasksStore = stores.tasks();
const resourcesStore = stores.resources();

const props = defineProps(['resource']);
const resource = props.resource;
const ResourceNode = ref();

let pdfjs;

onMounted(() => {
  pdfjs = createPDFJsApi(ResourceNode.value, './annotate-pdf/pdfjs-dist/web/viewer.html', resource.url, {viewOnly: true});
  handleFocusChange();
});

async function handleFocusChange() {
  if (layoutStore.isResourceShown(resource)) {
    await nextTick();
    ResourceNode.value.focus();
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

</script>

<template>
  <div class ="appResourceWrapper">
    <div class="appTextButtons">
    </div>
    <div class="appResourceNode" tabindex="0" ref="ResourceNode"></div>
  </div>
</template>


<style scoped>

.appResourceWrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.appTextButtons {
  text-align: center;
  padding-bottom: 5px;
  height: 50px;
}

.appResourceNode {
  flex-grow: 1;
  width: 100%;
  height: calc(100% - 50px);
}

</style>
