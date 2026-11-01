<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const model = defineModel<string>()
const props = defineProps<{ class?: HTMLAttributes['class']; rows?: number; invalid?: boolean }>()
</script>

<template>
  <textarea
    v-model="model"
    :rows="rows ?? 3"
    :aria-invalid="props.invalid || undefined"
    :class="cn(
      'border-input bg-paper text-foreground placeholder:text-muted-foreground w-full rounded-[var(--radius)] border px-3 py-2.5 text-sm leading-relaxed transition',
      'focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none',
      'aria-invalid:border-bad aria-invalid:ring-2 aria-invalid:ring-bad/20',
      props.class,
    )"
  />
</template>
