<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg'; name?: string }>(), { size: 'md' })
const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' }
const initial = computed(() => (props.name ?? '?').trim().charAt(0).toUpperCase() || '?')
</script>

<template>
  <span
    :class="cn('border-primary/40 bg-accent text-accent-foreground grid shrink-0 place-items-center rounded-full border font-extrabold', sizes[size])"
    aria-hidden="true"
  >{{ initial }}</span>
</template>
