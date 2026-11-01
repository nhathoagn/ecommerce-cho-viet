<script setup lang="ts">
import { ref } from 'vue'
import { useDialogOpen } from '@/composables/useDialogOpen'

const open = defineModel<boolean>('open', { default: false })
const el = ref<HTMLDialogElement | null>(null)
const { onBackdrop } = useDialogOpen(open, el)
</script>

<template>
  <dialog ref="el" class="modal" @close="open = false" @cancel="open = false" @keydown.esc="open = false" @click="onBackdrop">
    <div class="slip max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto p-6">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
/* Native <dialog> centres by margin:auto; overriding it with a flex box keeps the
   centring explicit and works with the scrollable inner panel. */
.modal {
  position: fixed;
  inset: 0;
  margin: 0;
  padding: 1rem;
  width: 100vw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  border: 0;
  background: transparent;
  color: inherit;
  align-items: center;
  justify-content: center;
  overflow: auto;
}
.modal[open] {
  display: flex;
}
.modal::backdrop {
  background: rgb(6 13 10 / 0.62);
  backdrop-filter: blur(2px);
}
</style>
