<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div :class="cn('border-rule flex flex-col items-center gap-3 border border-dashed px-6 py-12 text-center', props.class)">
    <slot />
  </div>
</template>
