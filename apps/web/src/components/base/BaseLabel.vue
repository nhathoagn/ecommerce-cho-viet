<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; required?: boolean }>()
</script>

<template>
  <label :class="cn('label-xs text-muted-foreground block', props.class)">
    <slot /><span v-if="props.required" class="text-primary ml-0.5" aria-hidden="true">*</span>
  </label>
</template>
