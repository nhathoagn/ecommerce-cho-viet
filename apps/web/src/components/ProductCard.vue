<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Plus, Sparkles, Truck } from '@lucide/vue'
import { cn } from '@/lib/utils'
import type { Product } from '@/modules/catalog/catalog.api'
import { productImageUrl, productInitials } from '@/media'
import { money, pastelWell, salePercent } from '@/money'
import DsPill from '@/components/ds/DsPill.vue'
import DsButton from '@/components/ds/DsButton.vue'

const props = withDefaults(defineProps<{
  product: Product
  adding?: boolean
  showAdd?: boolean
  showStore?: boolean
  badge?: string
  feature?: boolean
  hang?: boolean
}>(), {
  showAdd: true,
  showStore: true,
  hang: false,
})

const emit = defineEmits<{ add: [] }>()

const off = computed(() => salePercent(props.product.price, props.product.compareAtPrice))
const lit = computed(() => props.product.stock > 0)
const stockTone = computed(() => (props.product.stock <= 0 ? 'bad' : props.product.stock <= 8 ? 'warn' : 'fresh'))
const stockLabel = computed(() => {
  if (props.product.stock <= 0) return 'Hết hàng'
  if (props.product.stock <= 8) return `Còn ${props.product.stock}`
  return 'Sẵn hàng'
})
const freeShip = computed(() => Number(props.product.price) >= 500_000)
/* Heat comes from data we actually have: a deep discount or a nearly empty shelf. */
const heat = computed<'hot' | 'new' | ''>(() => {
  if (off.value >= 25 || props.product.stock <= 5) return 'hot'
  const created = Date.parse(props.product.createdAt ?? '')
  if (created && Date.now() - created < 14 * 86_400_000) return 'new'
  return ''
})
const wellStyle = computed(() => ({
  '--well': pastelWell(props.product.name),
}))
</script>

<template>
  <article :class="cn('group/card relative flex h-full flex-col', hang && 'pt-7')">
    <span v-if="hang" class="bg-rule-strong absolute top-0 left-1/2 z-0 block h-7 w-px" aria-hidden="true" />
    <span v-if="hang" class="border-rule-strong bg-background absolute top-[26px] left-1/2 z-10 size-2 -translate-x-1/2 rounded-full border" aria-hidden="true" />

    <div
      class="border-rule bg-paper relative flex flex-1 flex-col rounded-[var(--radius-md)] border shadow-[var(--slip-shadow)] transition duration-200 group-hover/card:-translate-y-1 group-hover/card:shadow-[0_0_0_1px_var(--lamp-soft),0_0_38px_-10px_var(--lamp-soft),var(--slip-shadow)]"
    >
      <RouterLink :to="`/products/${product.slug}`" class="block overflow-hidden rounded-t-[var(--radius-md)]">
        <div
          class="well-surface relative grid place-items-center overflow-hidden text-2xl font-extrabold"
          :class="feature ? 'aspect-[16/10] text-4xl' : 'aspect-square'"
          :style="wellStyle"
        >
          <img v-if="productImageUrl(product)" :src="productImageUrl(product)" :alt="product.name" class="size-full object-cover" :class="!lit && 'saturate-50'" />
          <template v-else>{{ productInitials(product.name) }}</template>
          <span v-if="lit" class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,var(--lamp-soft),transparent_68%)]" />
          <span v-if="badge" class="bg-foreground text-background label-xs absolute top-2 left-2 rounded-[3px] px-1.5 py-1">{{ badge }}</span>
          <span
            v-else-if="heat === 'hot'"
            class="label-xs absolute top-2 left-2 inline-flex items-center gap-1 rounded-[3px] border border-[#e02060] bg-[linear-gradient(100deg,#ff2f6d,#ff9f1c)] px-1.5 py-1 text-[#2b0410] shadow-[0_0_18px_-4px_rgb(255_47_109/0.85)]"
          ><Flame class="size-3" aria-hidden="true" />Hot</span>
          <span
            v-else-if="heat === 'new'"
            class="label-xs bg-paper text-foreground border-rule-strong absolute top-2 left-2 inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-1 shadow-sm"
          ><Sparkles class="text-primary size-3" aria-hidden="true" />Mới</span>
        </div>
      </RouterLink>

      <!-- the price sits on a paper tag, tilted over the photo -->
      <div class="-mt-3.5 ml-2.5 w-fit -rotate-2 transition duration-200 group-hover/card:-rotate-3">
        <div class="bg-accent text-accent-foreground flex items-baseline gap-1.5 rounded-[3px] px-2 py-1 shadow-[0_6px_14px_-6px_rgb(0_0_0/0.45)]">
          <strong class="num text-[17px] leading-none font-extrabold">{{ money(product.price) }}</strong>
          <span v-if="off" class="num text-[10.5px] leading-none line-through opacity-60">{{ money(product.compareAtPrice!) }}</span>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-1.5 px-2.5 pt-2">
        <div class="flex items-start justify-between gap-2">
          <p v-if="showStore && product.store?.name" class="label-xs text-muted-foreground flex items-center gap-1.5">
            <span class="bg-primary inline-block size-1.5 rounded-full" aria-hidden="true" />{{ product.store.name }}
          </p>
          <span v-if="off" class="bg-primary text-primary-foreground rotate-3 rounded-[3px] px-1.5 py-0.5 text-[10.5px] font-extrabold">−{{ off }}%</span>
        </div>
        <RouterLink :to="`/products/${product.slug}`">
          <h3 :class="cn('line-clamp-2 font-extrabold hover:text-primary transition-colors', feature ? 'text-[24px] leading-[1.06]' : 'min-h-[38px] text-[16px] leading-[1.22]')">{{ product.name }}</h3>
        </RouterLink>
        <p v-if="product.description" class="text-muted-foreground line-clamp-2 text-xs leading-5">{{ product.description }}</p>
        <div class="mt-auto flex flex-wrap items-center gap-1.5 pt-1.5">
          <DsPill :tone="stockTone">{{ stockLabel }}</DsPill>
          <DsPill><Truck class="size-3" aria-hidden="true" />{{ freeShip ? 'Freeship' : 'Giao 2h' }}</DsPill>
          <span class="text-muted-foreground num ml-auto text-[10.5px]">{{ product.sku }}</span>
        </div>
      </div>

      <div v-if="showAdd" class="flex items-stretch gap-2 p-3 pt-2.5">
        <DsButton
          variant="outline"
          size="sm"
          class="h-10 w-10 px-0"
          :disabled="adding || product.stock < 1"
          :aria-label="adding ? 'Đang thêm vào giỏ' : 'Thêm vào giỏ'"
          @click="emit('add')"
        >
          <Plus class="size-4" aria-hidden="true" />
        </DsButton>
        <DsButton :to="`/products/${product.slug}`" :variant="heat === 'hot' ? 'buy' : 'buy'" size="sm" class="h-10 flex-1 text-[13.5px] font-bold" :class="heat === 'hot' && 'shadow-[0_0_24px_-6px_rgb(255_90_31/0.95)]'">
          <Flame v-if="heat === 'hot'" class="size-3.5" aria-hidden="true" />
          Mua ngay
        </DsButton>
      </div>
    </div>
  </article>
</template>
