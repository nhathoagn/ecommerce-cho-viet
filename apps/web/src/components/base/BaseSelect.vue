<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'

export interface SelectOption { value: string; label: string; hint?: string }

const props = withDefaults(defineProps<{
  options: SelectOption[]
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  class?: string
}>(), { placeholder: 'Chọn một mục' })

const model = defineModel<string>()
const open = ref(false)
const active = ref(0)
const root = ref<HTMLElement | null>(null)

// aria-controls / aria-activedescendant need ids the surrounding markup owns.
const listId = useId()
const optionId = (index: number) => `${listId}-option-${index}`

const selected = computed(() => props.options.find((option) => option.value === model.value))
const label = computed(() => selected.value?.label ?? props.placeholder)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) active.value = Math.max(0, props.options.findIndex((option) => option.value === model.value))
}

function pick(index: number) {
  const option = props.options[index]
  if (!option) return
  model.value = option.value
  open.value = false
}

function move(step: number) {
  if (!open.value) {
    open.value = true
    return
  }
  const next = active.value + step
  active.value = Math.min(props.options.length - 1, Math.max(0, next))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { open.value = false; return }
  if (event.key === 'ArrowDown') { event.preventDefault(); move(1); return }
  if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); return }
  if (event.key === 'Home') { event.preventDefault(); active.value = 0; return }
  if (event.key === 'End') { event.preventDefault(); active.value = props.options.length - 1; return }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (open.value) pick(active.value)
    else open.value = true
  }
}

function onDocumentPointer(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onDocumentPointer)
  else document.removeEventListener('pointerdown', onDocumentPointer)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointer))
</script>

<template>
  <div ref="root" :class="cn('relative', props.class)">
    <button
      type="button"
      role="combobox"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="open ? listId : undefined"
      :aria-activedescendant="open && options[active] ? optionId(active) : undefined"
      :aria-invalid="props.invalid || undefined"
      :disabled="disabled"
      :class="cn(
        'border-input bg-paper flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border px-3 text-left text-sm transition',
        'focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none',
        'aria-invalid:border-bad aria-invalid:ring-2 aria-invalid:ring-bad/20',
        disabled && 'pointer-events-none opacity-60',
      )"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="truncate" :class="!selected && 'text-muted-foreground'">{{ label }}</span>
      <ChevronDown class="text-muted-foreground size-4 shrink-0 transition" :class="open && 'rotate-180'" aria-hidden="true" />
    </button>

    <ul
      v-if="open"
      :id="listId"
      role="listbox"
      class="slip absolute z-50 mt-1 max-h-72 w-full overflow-auto p-1"
    >
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option.value"
        role="option"
        :aria-selected="option.value === model"
        :class="cn(
          'flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition',
          index === active ? 'bg-secondary' : 'hover:bg-secondary/70',
          option.value === model && 'font-semibold text-primary',
        )"
        @pointerenter="active = index"
        @click="pick(index)"
      >
        <span class="truncate">{{ option.label }}<span v-if="option.hint" class="text-muted-foreground ml-1.5 text-xs">{{ option.hint }}</span></span>
        <Check v-if="option.value === model" class="size-4 shrink-0" aria-hidden="true" />
      </li>
      <li v-if="!options.length" role="presentation" class="text-muted-foreground px-2.5 py-2 text-sm">Không có lựa chọn</li>
    </ul>
  </div>
</template>
