<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsFieldError from '@/components/ds/DsFieldError.vue'
import DsPaper from '@/components/ds/DsPaper.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsPill from '@/components/ds/DsPill.vue'
import DsNote from '@/components/ds/DsNote.vue'
import { amountAtLeast, required, validate } from '@/lib/form'
import { money } from '@/money'
import { messageOf } from '@/stores/auth'
import { sellerFinanceApi } from '@/modules/seller-finance/seller-finance.api'
import { useSellerStore } from '@/modules/seller/seller.store'

const seller = useSellerStore()
const error = ref('')
const notice = ref('')
const saving = ref(false)
const form = reactive({ amount: 0, bankName: '', accountNumber: '', accountName: '' })
const fieldErrors = ref<Record<string, string>>({})

function clearError(field: string) {
  delete fieldErrors.value[field]
}

const balance = computed(() => seller.wallet?.availableBalance ?? 0)
const transactions = computed(() => seller.wallet?.transactions ?? [])
const withdrawals = computed(() => seller.wallet?.withdrawals ?? [])

async function withdraw() {
  const errors = validate({
    withdrawAmount: [
      String(form.amount),
      [required('số tiền'), amountAtLeast(10000), (value) => (Number(value) <= balance.value ? '' : 'Số tiền vượt quá số dư khả dụng.')],
    ],
    withdrawBank: [form.bankName, [required('tên ngân hàng')]],
    withdrawAccount: [form.accountNumber, [required('số tài khoản'), (value) => (/^\d+$/.test(value.trim()) ? '' : 'Số tài khoản chỉ gồm chữ số.')]],
    withdrawName: [form.accountName, [required('tên chủ tài khoản')]],
  })
  fieldErrors.value = errors
  const firstInvalid = Object.keys(errors)[0]
  if (firstInvalid) {
    document.getElementById(firstInvalid)?.focus()
    return
  }
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    await sellerFinanceApi.withdraw({ ...form, amount: Number(form.amount) })
    await Promise.all([seller.refreshWallet(), seller.refreshSummary()])
    Object.assign(form, { amount: 0, bankName: '', accountNumber: '', accountName: '' })
    notice.value = 'Đã gửi yêu cầu rút tiền'
  } catch (reason) {
    error.value = messageOf(reason)
  } finally {
    saving.value = false
  }
}

onMounted(() => seller.ensure())
</script>

<template>
  <div class="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[1fr_428px]">
    <div class="grid content-start gap-4">
      <DsPaper class="overflow-hidden">
        <header class="border-rule border-b px-4 py-3">
          <h2 class="text-lg">Biến động số dư</h2>
        </header>
        <div class="px-4 py-2">
          <p v-if="!transactions.length" class="text-muted-foreground py-2 text-sm">Chưa có giao dịch.</p>
          <ul v-else>
            <li v-for="item in transactions" :key="item.id" class="border-rule flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
              <span class="min-w-0">
                <span class="block truncate text-sm">{{ item.description }}</span>
                <span class="num text-muted-foreground block text-[11px]">{{ new Date(item.createdAt).toLocaleString('vi-VN') }}</span>
              </span>
              <span class="num shrink-0 text-sm font-bold" :class="Number(item.amount) >= 0 ? 'text-ok' : 'text-bad'">{{ money(item.amount) }}</span>
            </li>
          </ul>
        </div>
      </DsPaper>

      <DsPaper class="overflow-hidden">
        <header class="border-rule border-b px-4 py-3">
          <h2 class="text-lg">Yêu cầu rút tiền</h2>
        </header>
        <div class="px-4 py-2">
          <p v-if="!withdrawals.length" class="text-muted-foreground py-2 text-sm">Chưa có yêu cầu nào.</p>
          <ul v-else>
            <li v-for="item in withdrawals" :key="item.id" class="border-rule flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
              <span class="min-w-0">
                <span class="block truncate text-sm">{{ item.bankName }}</span>
                <span class="num text-muted-foreground block text-[11px]">{{ new Date(item.createdAt).toLocaleString('vi-VN') }}</span>
              </span>
              <span class="flex shrink-0 items-center gap-2">
                <span class="num text-sm">{{ money(item.amount) }}</span>
                <DsPill>{{ item.status }}</DsPill>
              </span>
            </li>
          </ul>
        </div>
      </DsPaper>
    </div>

    <DsPaper class="h-fit overflow-hidden">
      <header class="border-rule border-b px-4 py-3">
        <h2 class="text-lg">Rút tiền về ngân hàng</h2>
      </header>
      <div class="p-4">
        <p class="num text-muted-foreground mb-3 text-xs">Số dư khả dụng: {{ money(balance) }}</p>
        <DsNote v-if="error" tone="bad" class="mb-3">{{ error }}</DsNote>
        <DsNote v-if="notice" tone="ok" class="mb-3">{{ notice }}</DsNote>
        <form class="grid gap-3" novalidate @submit.prevent="withdraw">
          <div class="grid gap-1.5">
            <DsLabel for="withdrawAmount" required>Số tiền (₫)</DsLabel>
            <DsInput
              id="withdrawAmount"
              v-model.number="form.amount"
              type="number"
              min="10000"
              :max="balance"
              step="any"
              :invalid="!!fieldErrors.withdrawAmount"
              required
              class="num"
              @input="clearError('withdrawAmount')"
            />
            <DsFieldError :message="fieldErrors.withdrawAmount" />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="withdrawBank" required>Ngân hàng</DsLabel>
            <DsInput
              id="withdrawBank"
              v-model="form.bankName"
              :invalid="!!fieldErrors.withdrawBank"
              required
              placeholder="Vietcombank"
              @input="clearError('withdrawBank')"
            />
            <DsFieldError :message="fieldErrors.withdrawBank" />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="withdrawAccount" required>Số tài khoản</DsLabel>
            <DsInput
              id="withdrawAccount"
              v-model="form.accountNumber"
              :invalid="!!fieldErrors.withdrawAccount"
              required
              inputmode="numeric"
              placeholder="0123456789"
              class="num"
              @input="clearError('withdrawAccount')"
            />
            <DsFieldError :message="fieldErrors.withdrawAccount" />
          </div>
          <div class="grid gap-1.5">
            <DsLabel for="withdrawName" required>Tên chủ tài khoản</DsLabel>
            <DsInput
              id="withdrawName"
              v-model="form.accountName"
              :invalid="!!fieldErrors.withdrawName"
              required
              placeholder="NGUYEN VAN A"
              @input="clearError('withdrawName')"
            />
            <DsFieldError :message="fieldErrors.withdrawName" />
          </div>
          <DsButton type="submit" :variant="balance < 10000 ? 'outline' : 'primary'" :disabled="saving || balance < 10000">
            {{ saving ? 'Đang gửi…' : balance < 10000 ? 'Số dư chưa đủ 10.000₫' : 'Gửi yêu cầu' }}
          </DsButton>
        </form>
      </div>
    </DsPaper>
  </div>
</template>
