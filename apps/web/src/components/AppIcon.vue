<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ name: string }>()

const paths: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>',
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 12h10.4l2-8H7"/>',
  store: '<path d="M4 9l1-5h14l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
  check: '<polyline points="5 12 10 17 19 7"/>',
  shirt: '<path d="M9 4L3 7l2 4 2-1v11h10V10l2 1 2-4-6-3a3 3 0 0 1-6 0z"/>',
  bowl: '<path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M9 12V7a3 3 0 0 1 6 0"/>',
  house: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
  gift: '<rect x="4" y="10" width="16" height="4"/><path d="M6 14v7h12v-7"/><path d="M12 10v11"/><path d="M12 10S8 10 6 8s1-4 3-3 3 5 3 5zm0 0s4 0 6-2-1-4-3-3-3 5-3 5z"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5"/><line x1="12" y1="13" x2="12" y2="21"/>',
}

const inner = computed(() => paths[props.name] ?? paths['box'])
</script>

<template>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="inner" />
</template>
