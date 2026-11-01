<script setup lang="ts">
import { cn } from '@/lib/utils'

const model = defineModel<boolean>({ default: false })
defineProps<{ id?: string; label?: string }>()
</script>

<template>
  <label class="flex cursor-pointer items-center gap-2.5 text-sm" :for="id">
    <input :id="id" v-model="model" type="checkbox" class="peer sr-only" />
    <span
      :class="cn(
        'grid size-[18px] shrink-0 place-items-center rounded-[3px] border border-rule-strong bg-paper transition',
        'peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30',
      )"
      aria-hidden="true"
    >
      <svg v-if="model" viewBox="0 0 12 10" class="size-3"><path d="M1 5.2 4.3 8.5 11 1.5" fill="none" stroke="currentColor" stroke-width="2" /></svg>
    </span>
    <span v-if="label">{{ label }}</span>
  </label>
</template>
