<script setup lang="ts">
import { ImagePlus } from '@lucide/vue'
import { ref } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  accept?: string
  fileName?: string
  hint?: string
  label?: string
  disabled?: boolean
  class?: string
}>(), { accept: 'image/png,image/jpeg,image/webp', label: 'Tải ảnh lên', hint: 'PNG, JPG hoặc WebP' })

const emit = defineEmits<{ change: [file: File] }>()
const input = ref<HTMLInputElement | null>(null)

function onPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('change', file)
}
</script>

<template>
  <div
    :class="cn(
      'border-rule bg-paper flex items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 transition',
      props.disabled ? 'opacity-60' : 'hover:border-primary/50 hover:bg-secondary',
    )"
  >
    <span class="border-rule-strong text-muted-foreground grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border" aria-hidden="true">
      <ImagePlus class="size-4" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-semibold" :class="!fileName && 'text-muted-foreground'">
        {{ fileName || hint }}
      </span>
      <span class="text-muted-foreground mt-0.5 block truncate text-[12px]">{{ fileName ? hint : 'Chưa chọn tệp nào' }}</span>
    </span>
    <button
      type="button"
      class="border-rule-strong hover:bg-secondary label-xs shrink-0 rounded-[var(--radius-sm)] border px-2.5 py-2"
      :disabled="disabled"
      @click="input?.click()"
    >{{ label }}</button>
    <input ref="input" type="file" :accept="accept" class="sr-only" @change="onPick" />
  </div>
</template>
