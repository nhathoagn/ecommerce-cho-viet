<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const model = defineModel<string | number>()
const props = defineProps<{ class?: HTMLAttributes['class']; invalid?: boolean }>()
</script>

<template>
  <input
    v-model="model"
    :aria-invalid="props.invalid || undefined"
    :class="cn(
      'border-input bg-paper text-foreground placeholder:text-muted-foreground h-11 w-full rounded-[var(--radius)] border px-3 text-sm transition',
      'focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none',
      'aria-invalid:border-bad aria-invalid:ring-2 aria-invalid:ring-bad/20',
      props.class,
    )"
  />
</template>
