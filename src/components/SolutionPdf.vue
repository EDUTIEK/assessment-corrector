<script setup>
import {stores} from "@/store";

const resourcesStore = stores.resources();
const resource = resourcesStore.solution;

</script>

<template>
  <div>
    <object
        v-if="resource.mimetype =='application/pdf'"
        type="application/pdf"
        :data="resource.url"
        width="100%"
        height="100%">
    </object>
  </div>
</template>


<style scoped>

div {
  height: 100%;
}

</style>
