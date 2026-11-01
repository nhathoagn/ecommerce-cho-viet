<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

type Variant = 'buy' | 'primary' | 'soft' | 'new' | 'ink' | 'lamp' | 'outline' | 'on-band' | 'ghost' | 'quiet' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  to?: string
  href?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  block?: boolean
  loading?: boolean
}>(), { variant: 'outline', size: 'md', type: 'button' })

/* Flat printed labels: solid block, a hairline border in the same hue, and a
   1px inner highlight that reads as the paper's cut edge. No texture, no drop
   shadow — the colour and the type weight do the work. */
const variants: Record<Variant, string> = {
  buy: cn(
    'bg-[var(--buy)] text-[var(--buy-foreground)] border border-[color-mix(in_oklab,var(--buy)_80%,black)]',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.42),0_6px_18px_-10px_rgb(255_90_31/0.9)]',
    'hover:bg-[color-mix(in_oklab,var(--buy)_90%,white)] active:brightness-95',
  ),
  primary: cn(
    'bg-primary text-primary-foreground border border-[color-mix(in_oklab,var(--primary)_78%,black)]',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.5)]',
    'hover:bg-[color-mix(in_oklab,var(--primary)_92%,white)] active:brightness-95',
  ),
  new: cn(
    'bg-[var(--fresh)] text-[var(--fresh-ink)] border border-[color-mix(in_oklab,var(--fresh)_80%,black)]',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_0_18px_-6px_rgb(200_255_61/0.9)]',
    'hover:brightness-[1.04] active:brightness-95',
  ),
  soft: cn(
    'bg-[color-mix(in_oklab,var(--primary)_16%,var(--paper))]',
    'text-[color-mix(in_oklab,var(--primary)_42%,black)]',
    'border border-[color-mix(in_oklab,var(--primary)_45%,var(--paper))]',
    'hover:bg-[color-mix(in_oklab,var(--primary)_24%,var(--paper))] active:brightness-95',
  ),
  ink: cn(
    'bg-foreground text-background border border-foreground',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]',
    'hover:opacity-90 active:opacity-95',
  ),
  lamp: cn(
    'bg-accent text-accent-foreground border border-[color-mix(in_oklab,var(--accent)_82%,black)]',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]',
    'hover:bg-[color-mix(in_oklab,var(--accent)_92%,white)] active:brightness-95',
  ),
  outline: cn(
    'bg-paper text-foreground border border-rule-strong',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]',
    'hover:border-foreground hover:bg-secondary active:bg-secondary',
  ),
  'on-band': cn(
    'bg-transparent text-inherit border border-[var(--band-rule)]',
    'hover:border-white/45 hover:bg-white/10 active:bg-white/15',
  ),
  ghost: 'text-foreground border border-transparent hover:bg-secondary active:bg-secondary',
  quiet: 'text-muted-foreground border border-transparent hover:text-foreground hover:bg-secondary',
  danger: cn(
    'bg-paper text-bad border border-bad/45',
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]',
    'hover:bg-bad-soft hover:border-bad active:bg-bad-soft',
  ),
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
}

const tag = computed(() => (props.to ? 'RouterLink' : props.href ? 'a' : 'button'))
const classes = computed(() => cn(
  'relative isolate inline-flex shrink-0 items-center justify-center rounded-[7px] font-semibold whitespace-nowrap transition duration-150 outline-offset-2 disabled:pointer-events-none disabled:opacity-45',
  variants[props.variant],
  sizes[props.size],
  props.block && 'w-full',
))
</script>

<template>
  <component
    :is="tag"
    :class="classes"
    :data-variant="variant"
    :to="to"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled || loading : undefined"
    :aria-busy="loading || undefined"
  >
    <slot v-if="!loading" />
    <span v-else class="num opacity-80">Đang xử lý…</span>
  </component>
</template>

<style scoped>
[data-variant='new']::after {
  content: '';
  position: absolute;
  inset: -3px;
  z-index: -1;
  border-radius: inherit;
  background: radial-gradient(60% 120% at 50% 50%, rgb(200 255 61 / 0.5), transparent 76%);
  filter: blur(8px);
  pointer-events: none;
}

</style>
