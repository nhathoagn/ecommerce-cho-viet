<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

type Tone = 'info' | 'ok' | 'warn' | 'bad'

const props = withDefaults(defineProps<{
  tone?: Tone
  class?: HTMLAttributes['class']
}>(), { tone: 'info' })

const tones: Record<Tone, string> = {
  info: 'border-rule-strong bg-paper text-foreground',
  ok: 'border-ok/35 bg-ok-soft text-ok',
  warn: 'border-warn/35 bg-warn-soft text-warn',
  bad: 'border-bad/40 bg-bad-soft text-bad',
}
</script>

<template>
  <p :class="cn('rounded-[var(--radius)] border px-3 py-2.5 text-sm leading-snug', tones[props.tone], props.class)" role="status">
    <slot />
  </p>
</template>
