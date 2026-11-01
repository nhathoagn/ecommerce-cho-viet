<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseFieldError from '@/components/base/BaseFieldError.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseLabel from '@/components/base/BaseLabel.vue'
import BaseNote from '@/components/base/BaseNote.vue'
import BasePill from '@/components/base/BasePill.vue'
import { usersApi, type Address } from '@/api/users'
import { money, pastelWell } from '@/money'
import { productImageUrl, productInitials } from '@/media'
import { useCartStore } from '@/modules/cart/cart.store'
import { ordersApi, type Order } from '@/modules/orders/orders.api'
import { messageOf } from '@/stores/auth'

const FREE_SHIPPING_AT = 500_000
const SHIPPING_FEE = 30_000

const router = useRouter()
const cart = useCartStore()
const addresses = ref<Address[]>([])
const addressId = ref('')
const couponInput = ref('')
const appliedCoupon = ref('')
const couponNotice = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

function clear(field: string) {
  delete errors.value[field]
}

const subtotal = computed(() => cart.total)
const shipping = computed(() => (subtotal.value >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE))
const payable = computed(() => subtotal.value + shipping.value)
const oversold = computed(() => cart.items.filter((item) => item.quantity > item.product.stock))

onMounted(async () => {
  await cart.load()
  addresses.value = await usersApi.getAddresses()
  addressId.value = addresses.value.find((item) => item.isDefault)?.id ?? addresses.value[0]?.id ?? ''
})

function addressLabel(address: Address) {
  const parts = [address.street || address.line1, address.ward, address.district, address.province || address.city]
    .filter((part) => part && String(part).trim())
  return `${address.recipientName} · ${parts.join(', ')}`
}

function applyCoupon() {
  const code = couponInput.value.trim().toUpperCase()
  if (!code) {
    couponNotice.value = 'Nhập mã giảm giá trước khi áp dụng.'
    appliedCoupon.value = ''
    return
  }
  appliedCoupon.value = code
  couponNotice.value = `Đã gắn mã ${code}. Giảm giá được tính khi tạo đơn.`
}

function clearCoupon() {
  appliedCoupon.value = ''
  couponInput.value = ''
  couponNotice.value = ''
}

async function submit() {
  if (submitting.value) return
  error.value = ''
  errors.value = {}
  if (!cart.items.length) {
    error.value = 'Giỏ hàng đang trống. Thêm sản phẩm rồi thử lại.'
    return
  }
  if (!addressId.value) errors.value.address = 'Chọn địa chỉ nhận hàng.'
  if (couponInput.value && !couponInput.value.trim()) errors.value.coupon = 'Nhập mã giảm giá hoặc bỏ trống.'
  if (Object.keys(errors.value).length) {
    const [first] = Object.keys(errors.value)
    if (first === 'address') document.querySelector<HTMLInputElement>('input[name="address"]')?.focus()
    else document.getElementById(first)?.focus()
    return
  }
  if (oversold.value.length) {
    error.value = `Không đủ tồn kho cho ${oversold.value.map((item) => item.product.name).join(', ')}.`
    return
  }
  submitting.value = true
  let order: Order | null = null
  try {
    order = await ordersApi.checkout(addressId.value, appliedCoupon.value)
    await ordersApi.createPayment(order.id)
    void router.push({ name: 'payment-result', query: { orderId: order.id } })
  } catch (reason) {
    // Đơn đã tạo và đã trừ tồn kho: nói rõ đường thoát thay vì chỉ báo lỗi MoMo.
    error.value = order
      ? `Đơn ${order.code} đã tạo nhưng chưa thanh toán được. ${messageOf(reason)} Vào Đơn hàng để thanh toán lại hoặc hủy đơn.`
      : messageOf(reason)
    submitting.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-5">
    <div class="mb-5">
      <p class="label-xs text-primary">Thanh toán</p>
      <h1 class="mt-2 text-[32px] sm:text-[40px]">Xác nhận đơn hàng</h1>
    </div>

    <ol class="mb-5 grid grid-cols-3 gap-2" aria-label="Các bước thanh toán">
      <li class="border-rule border px-2.5 py-2 sm:px-3">
        <RouterLink class="label-xs text-primary" to="/cart">1 · Giỏ hàng</RouterLink>
      </li>
      <li class="bg-accent text-accent-foreground border-accent label-xs border px-2.5 py-2 sm:px-3" aria-current="step">2 · Địa chỉ</li>
      <li class="border-rule text-muted-foreground label-xs border px-2.5 py-2 sm:px-3">3 · MoMo</li>
    </ol>

    <form class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start" novalidate @submit.prevent="submit">
      <div class="grid gap-5">
        <div class="slip p-4 sm:p-5">
          <h2 class="label-xs text-muted-foreground">Đơn hàng</h2>
          <ul class="mt-3">
            <li v-for="item in cart.items" :key="item.id" class="border-rule flex items-center gap-3 border-t py-3 first:border-t-0">
              <div
                class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[3px] text-xs font-extrabold"
                :style="{ background: pastelWell(item.product.name) }"
              >
                <img v-if="productImageUrl(item.product)" :src="productImageUrl(item.product)" :alt="item.product.name" class="size-full object-cover">
                <template v-else>{{ productInitials(item.product.name) }}</template>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">{{ item.product.name }}</p>
                <p class="num text-muted-foreground mt-0.5 text-xs">× {{ item.quantity }}</p>
              </div>
              <strong class="num shrink-0 text-sm">{{ money(Number(item.product.price) * item.quantity) }}</strong>
            </li>
          </ul>
        </div>

        <div class="slip p-4 sm:p-5">
          <fieldset class="grid gap-2.5">
            <legend class="label-xs text-muted-foreground mb-1">Địa chỉ nhận hàng</legend>
            <label
              v-for="address in addresses"
              :key="address.id"
              class="bg-paper flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border p-3 transition hover:border-rule-strong has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40"
              :class="[addressId === address.id && 'lit', errors.address && 'border-bad']"
            >
              <input v-model="addressId" type="radio" name="address" :value="address.id" class="sr-only" @change="clear('address')">
              <span
                class="mt-0.5 size-4 shrink-0 rounded-full border transition"
                :class="addressId === address.id ? 'border-primary bg-primary ring-2 ring-inset ring-paper' : 'border-rule-strong'"
                aria-hidden="true"
              />
              <span class="text-sm leading-snug">{{ addressLabel(address) }}</span>
            </label>
            <p v-if="!addresses.length" class="text-muted-foreground text-sm">
              Bạn chưa có địa chỉ. <RouterLink class="text-primary font-semibold" to="/profile#addresses">Thêm địa chỉ</RouterLink> để đặt hàng nhanh hơn.
            </p>
            <BaseFieldError :message="errors.address" />
          </fieldset>

          <div class="bg-rule my-5 h-px" role="separator" />

          <div class="grid gap-2">
            <BaseLabel for="coupon">Mã giảm giá</BaseLabel>
            <div class="flex gap-2">
              <BaseInput
                id="coupon"
                v-model="couponInput"
                placeholder="Nhập mã nếu có"
                :invalid="!!errors.coupon"
                :disabled="Boolean(appliedCoupon)"
                @input="clear('coupon')"
              />
              <BaseButton v-if="appliedCoupon" type="button" variant="outline" @click="clearCoupon">Gỡ</BaseButton>
              <BaseButton v-else type="button" variant="outline" @click="applyCoupon">Áp dụng</BaseButton>
            </div>
            <BaseFieldError :message="errors.coupon" />
            <BaseNote v-if="couponNotice" tone="info" class="mt-1">{{ couponNotice }}</BaseNote>
          </div>

          <div class="bg-rule my-5 h-px" role="separator" />

          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-semibold">Thanh toán</span>
            <BasePill tone="lamp">Ví MoMo</BasePill>
          </div>
        </div>
      </div>

      <aside class="slip p-4 lg:sticky lg:top-28">
        <p class="label-xs text-muted-foreground">Tóm tắt đơn hàng</p>
        <dl class="mt-3 grid gap-2 text-sm">
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-muted-foreground">Tạm tính</dt>
            <dd class="num font-semibold">{{ money(subtotal) }}</dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-muted-foreground">Phí vận chuyển</dt>
            <dd class="num font-semibold">{{ shipping ? money(shipping) : 'Miễn phí' }}</dd>
          </div>
          <div v-if="appliedCoupon" class="flex items-baseline justify-between gap-3">
            <dt class="text-muted-foreground">Mã giảm giá</dt>
            <dd class="num font-semibold">{{ appliedCoupon }}</dd>
          </div>
        </dl>
        <p v-if="subtotal < FREE_SHIPPING_AT" class="text-muted-foreground mt-2 text-xs leading-relaxed">
          Mua thêm {{ money(FREE_SHIPPING_AT - subtotal) }} để được miễn phí giao hàng.
        </p>
        <div class="bg-rule my-4 h-px" role="separator" />
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-sm font-semibold">Tổng thanh toán</span>
          <strong class="num text-primary text-2xl leading-none">{{ money(payable) }}</strong>
        </div>
        <p v-if="appliedCoupon" class="text-muted-foreground mt-3 text-xs leading-relaxed">Mã {{ appliedCoupon }} sẽ được trừ trên tổng đơn khi tạo đơn thành công.</p>

        <div class="mt-4 grid gap-3">
          <BaseNote v-if="oversold.length && !error" tone="bad">
            Không đủ tồn kho cho {{ oversold.map((item) => item.product.name).join(', ') }}. Giảm số lượng trong giỏ rồi thử lại.
          </BaseNote>
          <div class="min-h-11">
            <BaseNote v-if="error" tone="bad">{{ error }}</BaseNote>
          </div>
          <BaseButton
            type="submit"
            variant="buy"
            size="lg"
            block
            :disabled="submitting || !cart.items.length || oversold.length > 0"
          >
            {{ submitting ? 'Đang tạo đơn…' : 'Tạo đơn và thanh toán MoMo' }}
          </BaseButton>
        </div>
      </aside>
    </form>
  </section>
</template>
