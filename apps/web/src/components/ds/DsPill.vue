<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'lamp' | 'ink' | 'fresh'

const props = withDefaults(defineProps<{
  tone?: Tone
  class?: HTMLAttributes['class']
}>(), { tone: 'neutral' })

const tones: Record<Tone, string> = {
  neutral: 'border-rule text-muted-foreground bg-transparent',
  ok: 'border-ok/35 bg-ok-soft text-ok',
  warn: 'border-warn/35 bg-warn-soft text-warn',
  bad: 'border-bad/35 bg-bad-soft text-bad',
  lamp: 'border-accent bg-accent text-accent-foreground',
  fresh: 'border-fresh bg-fresh text-fresh-ink',
  ink: 'border-foreground/20 bg-foreground text-background',
}
</script>

<template>
  <span :class="cn('label-xs inline-flex items-center gap-1 rounded-[3px] border px-2 py-1 leading-none', tones[props.tone], props.class)">
    <slot />
  </span>
</template>
