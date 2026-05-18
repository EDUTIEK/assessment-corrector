<script setup>

import { stores } from '@/store';
import i18n from '@/plugins/i18n';
import { ref, nextTick, watch, onMounted } from 'vue';
import Snippet from '@/data/Snippet';
import OwnSummaryTemplate from '@/components/OwnSummaryTemplate.vue';
import OwnSummaryUpload from '@/components/OwnSummaryUpload.vue';
import SnippetsImport from '@/components/SnippetsImport.vue';

const { t } = i18n.global;

const apiStore = stores.api();
const snippetsStore = stores.snippets();
const layoutStore = stores.layout();

const selectedKey = ref('');

onMounted(() => {
 handleFocusChange();
});

function isSelected(snippet) {
  return selectedKey.value == snippet.key;
}

async function select(snippet) {
  selectedKey.value = snippet.key;
  await nextTick();
  fixLabels(snippet);
  document.getElementById('appSnippetText' + snippet.key).focus();
}

function unselect() {
  selectedKey.value = '';
}
watch(() => snippetsStore.list_purpose, unselect);

async function create() {
  const snippet = new Snippet({purpose: snippetsStore.list_purpose});
  await snippetsStore.createSnippet(snippet);
  select(snippet);
}

async function sort() {
  snippetsStore.sortSnippets();
  await nextTick();
  if (selectedKey.value) {
    document.getElementById('appSnippetText' + selectedKey.value).focus();
  }
}

function fixLabels(snippet) {
  const container = document.getElementById('appSnippetRow' + snippet.key);
  for (const label of container.getElementsByTagName('label')) {
    const target = label.getAttribute('for');
    if (target.includes('appSnippetShortcut') || target.includes('appSnippetText')) {
      label.classList.add('sr-only');
      if (label.getAttribute('aria-hidden') == 'true') {
        if (!label.getAttribute('for').includes('-sizer')) {
          label.setAttribute('for', label.getAttribute('for') + '-sizer');
        }
      } else {
        label.setAttribute('id', target + '-messages');
      }
    }
  }
  for (const textarea of container.getElementsByTagName('textarea')) {
    textarea.style.marginTop = '-15px';
    textarea.style.fontSize = '0.9rem';
  }
  for (const div of container.getElementsByClassName('v-input__details')) {
    div.style.display ='none';
  }
}

async function handleFocusChange() {
  console.log("snippet focus");
  if (layoutStore.focusTarget == 'appSnippetList') {
    await nextTick();
    document.getElementById('appSnippetListCreate').focus();
  }
}
watch(() => layoutStore.focusChange, handleFocusChange);

</script>

<template>
  <div ref="wrapper" id="app-snippet-list-wrapper">

    <v-container class="ma-0 pa-0">
      <v-row class="section-header ma-0">
        <v-col cols="6" class="ma-0 pa-0">
          <h2 ref="headline" class="headline">{{ t('snippetsSnippets') }}</h2>
        </v-col>
        <v-col cols="6" class="ma-0 pa-0 text-right">
          <div class="header-buttons">
            <v-btn-toggle density="compact" variant="outlined" divided v-model="snippetsStore.list_purpose">
              <v-btn size="small" variant="text" :value="Snippet.FOR_COMMENT">{{ t('snippetsForComment') }}</v-btn>
              <v-btn size="small" variant="text" :value="Snippet.FOR_SUMMARY">{{ t('snippetsForSummary') }}</v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <div ref="buttons" class="buttons">
      <v-btn id="appSnippetListCreate" size="small" prepend-icon="mdi-playlist-plus" @click="create()">{{ t('snippetsCreate') }}</v-btn>
      &nbsp;
      <v-btn id="appSnippetListSort" size="small" prepend-icon="mdi-sort" @click="sort()">{{ t('snippetsSort') }}</v-btn>
      &nbsp;
      <v-btn
          :href="apiStore.getSnippetsUrl(snippetsStore.list_purpose)"
          size="small"
          prepend-icon="mdi-download"
      >
        {{ t('snippetsExport') }}
      </v-btn>
      &nbsp;
      <snippets-import></snippets-import>

    </div>

    <v-table ref="table" class="list" density="compact" fixed-header>
      <thead>
        <tr>
          <th class="col-left">{{ t('snippetsSnippet') }}</th>
          <th class="col-center">{{ t('snippetsShortcut') }}</th>
          <th class="col-right">{{ t('snippetsActions') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="snippet in snippetsStore.forList" :key="snippet.key">
          <tr v-if="!isSelected(snippet)"  @click="select(snippet)">
            <td class="col-left"><div class="snippetDisplay">{{ snippet.text }}</div></td>
            <td class="col-center"><div class="snippetDisplay">{{ snippet.shortcut }}</div></td>
            <td class="col-right">
              <v-btn class="trashButton" density="compact" size="small" variant="text" prepend-icon="mdi-delete-outline"
                     tabindex="-1"
                     @click="snippetsStore.deleteSnippet(snippet.key);"
              >
                <span class="sr-only">{{ $t('snippetsDelete') }}</span>
              </v-btn>
            </td>
          </tr>
          <tr :id="'appSnippetRow' + snippet.key" v-if="isSelected(snippet)">
            <td class="col-left">
              <v-textarea class="snippetInput" rounded="0" density="compact" variant="solo" rows="1" auto-grow
                          v-model="snippet.text"
                          :id="'appSnippetText' + snippet.key"
                          :label="$t('snippetsSnippet')"
                          @change = "snippetsStore.updateSnippet(snippet)"
                          @keyup = "snippetsStore.updateSnippet(snippet)"
              >
              </v-textarea>
            </td>
            <td class="col-center">
              <v-textarea class="snippetInput" rounded="0" density="compact" variant="solo" rows="1" auto-grow
                  v-model="snippet.shortcut"
                  :id="'appSnippetShortcut' + snippet.key"
                  :label="$t('snippetsShortcut')"
                  @change = "snippetsStore.updateSnippet(snippet)"
                  @keyup = "snippetsStore.updateSnippet(snippet)"
              >
              </v-textarea>
            </td>
            <td class="col-right">
              <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-playlist-plus"
                     tabindex="0"
                     @click="create()"
              >
                <span class="sr-only">{{ t('snippetsCreate') }}</span>
              </v-btn>

              <v-btn density="compact" size="small" variant="text" prepend-icon="mdi-delete-outline"
                     tabindex="0"
                     @click="snippetsStore.deleteSnippet(snippet.key);"
              >
                <span class="sr-only">{{ $t('snippetsDelete') }}</span>
              </v-btn>
            </td>
          </tr>

        </template>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped>

#app-snippet-list-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  background-color: #f0f0f0;
}

.headline {
  font-size: 1rem;
  font-weight: normal;
  height: 40px;
  padding-top: 10px;
  padding-left: 10px;
  background-color: #f0f0f0;
}

.header-buttons {
}

.buttons {
  padding: 10px;
}

.list {
  flex-grow: 1;
  overflow-y: scroll;
}

.col-left {
  width: 70%;
}

.col-center {
  width: 15%;
}

.col-right {
  width: 15%;
  text-align: right;
}

.snippetDisplay {
  font-family: serif;
  margin-top: 5px;
  padding-left: 15px;
  padding-right: 15px;
}

.snippetInput {
  font-family: serif;
  margin-top: 5px;
}

</style>