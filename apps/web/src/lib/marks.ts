import {
  Apple,
  ShoppingBasket,
  CupSoda,
  Gift,
  Headphones,
  House,
  Fish,
  Package,
  Shirt,
  Sparkles,
  type LucideIcon,
} from '@lucide/vue'

/** Vivid tile colours for category marks. They tint a 40–48px tile, never a section. */
export const markColors = ['#c8ff3d', '#7bd7ff', '#c3a6ff', '#ff9ec7', '#ffc021', '#5fe3a1', '#ffb27a', '#ffe14d'] as const

const bySlug: { keys: string[]; icon: LucideIcon }[] = [
  { keys: ['thuc-pham', 'nong-san', 'do-kho', 'kho'], icon: Apple },
  { keys: ['thoi-trang', 'ao', 'vai'], icon: Shirt },
  { keys: ['nha-cua', 'gia-dung', 'bat-trang', 'gom'], icon: House },
  { keys: ['lam-dep', 'my-pham', 'skincare'], icon: Sparkles },
  { keys: ['dac-san', 'mam', 'nuoc-cham'], icon: Fish },
  { keys: ['thu-cong', 'may-tre', 'lang-nghe'], icon: ShoppingBasket },
  { keys: ['dien-tu', 'cong-nghe'], icon: Headphones },
  { keys: ['do-uong', 'tra', 'ca-phe'], icon: CupSoda },
  { keys: ['qua-tang', 'combo'], icon: Gift },
]

const hash = (value: string) => {
  let total = 0
  for (const char of value) total += char.charCodeAt(0)
  return total
}

export function markFor(slug = '', name = '') {
  const match = bySlug.find((entry) => entry.keys.some((key) => slug.includes(key) || name.toLowerCase().includes(key)))
  return {
    icon: match?.icon ?? Package,
    color: markColors[hash(name || slug) % markColors.length],
  }
}

/** Inline style for a mark tile: one flat vivid fill, ink glyph. */
export function markStyle(name = '') {
  return { background: markFor('', name).color }
}
