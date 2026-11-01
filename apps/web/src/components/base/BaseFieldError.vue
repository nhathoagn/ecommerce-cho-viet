<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineProps<{ message?: string; class?: string }>()
</script>

<template>
  <p v-if="message" :class="cn('text-bad mt-1.5 flex items-start gap-1.5 text-[12px] leading-snug font-semibold', $props.class)" role="alert">
    <CircleAlert class="mt-px size-3.5 shrink-0" aria-hidden="true" />
    <span>{{ message }}</span>
  </p>
</template>
