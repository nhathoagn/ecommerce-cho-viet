import { watch, type Ref } from 'vue'

/**
 * Drive a native <dialog> from a v-model flag and close it on a backdrop click.
 * Shared by BaseDialog and BaseSheet; the caller owns the template ref.
 */
export function useDialogOpen(open: Ref<boolean>, el: Ref<HTMLDialogElement | null>) {
  // flush:'post' + watching the element keeps this correct when the dialog mounts
  // in the same tick the parent flips the flag.
  watch([open, el], ([value, dialog]) => {
    if (!dialog) return
    if (value && !dialog.open) dialog.showModal()
    if (!value && dialog.open) dialog.close()
  }, { immediate: true, flush: 'post' })

  function onBackdrop(event: MouseEvent) {
    if (event.target === el.value) open.value = false
  }

  return { onBackdrop }
}
