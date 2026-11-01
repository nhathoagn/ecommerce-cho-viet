<script setup lang="ts">
import { ref } from 'vue'
import { useDialogOpen } from '@/composables/useDialogOpen'

const open = defineModel<boolean>('open', { default: false })
const el = ref<HTMLDialogElement | null>(null)
defineProps<{ side?: 'right' | 'left' }>()
const { onBackdrop } = useDialogOpen(open, el)
</script>

<template>
  <dialog ref="el" class="sheet" @close="open = false" @cancel="open = false" @keydown.esc="open = false" @click="onBackdrop">
    <div class="slip flex h-full w-[min(22rem,100vw)] flex-col p-5" :class="side === 'left' ? 'mr-auto' : 'ml-auto'">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.sheet {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  max-width: none;
  max-height: none;
  width: 100vw;
  height: 100dvh;
  margin: 0;
}
.sheet[open] {
  display: flex;
}
.sheet::backdrop {
  background: rgb(6 13 10 / 0.62);
}
.sheet[open] > div {
  animation: sheet-in 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes sheet-in {
  from { transform: translateX(12px); opacity: 0; }
  to { transform: none; opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .sheet[open] > div { animation: none; }
}
</style>
