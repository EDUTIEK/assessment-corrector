<script setup>

/**
 * Main Application
 */

import AppBar from "@/components/AppBar.vue";
import NavBar from "@/components/NavBar.vue";
import MainContent from "@/components/MainContent.vue";
import StartupContent from "@/components/StartupContent.vue";
import {stores} from "@/store";

stores.api().init();

</script>

<template>
  <v-app fill-height>
    <startup-content v-if="!stores.layout().initialized"/>
    <app-bar v-if="stores.layout().initialized"/>
    <nav-bar v-if="stores.layout().initialized"/>
    <main-content v-if="stores.layout().initialized"/>
  </v-app>
</template>

<style>

/**
 * Global content styles will be applied by class
 */
@import '@/styles/content.css';

html {
  overflow-y: hidden !important;
}

.hidden {
  display: none !important;
}

/* Content for screen readers only */
.sr-only {
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: polygon(0px 0px, 0px 0px, 0px 0px);
  -webkit-clip-path: polygon(0px 0px, 0px 0px, 0px 0px);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  white-space: nowrap;
}

/**
  Focus for Tab navigation
 */

.v-btn:focus::after, .v-btn:focus-visible::after,
.v-list-item:focus::after, .v-list-item:focus-visible::after {
  pointer-events: none;
  border: 2px solid blue !important;
  border-radius: inherit;
  opacity: 100% !important;
  transition: none !important;
}

/**
 * Tiny UI styles (must be global)
 */

.tox-tinymce {
  border: 1px solid #cccccc !important;
  border-radius: 0 !important;
}

.tox-toolbar__group {
  padding: 0 2px !important;
}

.tox-editor-header {
  box-shadow: none !important;
  border-bottom: 1px solid #cccccc !important;
  margin-bottom: 0 !important
}

.tox-menu {
  counter-reset: h1 h2 h3 h4 h5 h6;
}

/* Make font sizes in the tiny formats menu independent from changing font sizes in the content area */
.tox-menu h1, .tox-menu h2, .tox-menu h3, .tox-menu h4, .tox-menu h5, .tox-menu h6,
.tox-menu p, .tox-menu pre, .tox-menu li, .tox-menu blockquote, .tox-menu div,
.tox-menu strong, .tox-menu em, .tox-menu u, .tox-menu s, .tox-menu sup, .tox-menu sub, .tox-menu code
{
  font-size: 1rem !important;
}

/* Hide property dialogs of tinymce */
div[aria-label="Tabelleneigenschaften"],
div[aria-label="Zeileneigenschaften"],
div[aria-label="Zelleigenschaften"]
{
  display: none !important;
}

/**
 * ImageMarker: labels of marks on images (must be globally styled)
 */

.appImageMarker svg rect.label {
  fill: #aaaaaaaa !important;
}

.appImageMarker svg g.active rect.label {
  fill: grey !important;
}

.appImageMarker svg text {
  fill: white;
  font-family: sans-serif;
  font-size: 30px;
  font-style: normal;
  font-weight: normal;
}

.appImageMarker svg .shape text.symbol {
  font-weight: bold;
  font-size: 40px;
}

/*
 * Firefox: always-visible track + thumb.
 * Arrow buttons cannot be forced via CSS in Firefox (OS/theme only);
 * ::-webkit-scrollbar-button is Chromium-only.
 */
.with-scrollbar {
  scrollbar-width: auto;
  scrollbar-color: #8c8c8c #f0f0f0;
  overflow-y: scroll;
}

.without-scrollbar {
  overflow-y: hidden;
}

</style>
