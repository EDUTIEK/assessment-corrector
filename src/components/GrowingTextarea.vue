<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * Native textarea that grows with its content.
 * Put the id on this component and point a normal <label for="..."> at it.
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, default: undefined },
  readonly: { type: Boolean, default: false },
  rows: { type: [Number, String], default: 1 },
  bgColor: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const el = ref(null)
let observer
let lastWidth = -1

function resize() {
  const textarea = el.value
  if (!textarea || textarea.clientWidth === 0) {
    return
  }
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

function onInput(event) {
  emit('update:modelValue', event.target.value)
  resize()
}

watch(() => props.modelValue, () => nextTick(resize))

onMounted(() => {
  resize()
  observer = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width
    if (Math.abs(width - lastWidth) < 1) {
      return
    }
    lastWidth = width
    resize()
  })
  observer.observe(el.value)
  document.fonts?.ready?.then(() => resize())
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

defineExpose({
  focus() {
    el.value?.focus()
  },
  setSelectionRange(start, end, direction) {
    el.value?.setSelectionRange(start, end, direction)
  },
  get selectionStart() {
    return el.value ? el.value.selectionStart : null
  },
  get selectionEnd() {
    return el.value ? el.value.selectionEnd : null
  },
  get value() {
    return el.value ? el.value.value : ''
  },
})
</script>

<template>
  <textarea
    ref="el"
    :id="id"
    :rows="rows"
    :readonly="readonly"
    :value="modelValue"
    :style="bgColor ? { backgroundColor: bgColor } : null"
    @input="onInput"
  ></textarea>
</template>

<style scoped>
textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  resize: none;
}
</style>
