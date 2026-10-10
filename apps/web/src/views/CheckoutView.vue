<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi, type Address } from '../api/users'
import { ordersApi } from '../modules/orders/orders.api'
const router = useRouter(); const addresses = ref<Address[]>([]); const addressId = ref(''); const coupon = ref(''); const error = ref('')
onMounted(async()=>{ addresses.value=await usersApi.getAddresses(); addressId.value=addresses.value.find(item=>item.isDefault)?.id ?? addresses.value[0]?.id ?? '' })
async function submit(){ try { const order=await ordersApi.checkout(addressId.value,coupon.value); await router.push(`/orders?created=${order.id}`) } catch(e){ error.value='Không thể tạo đơn. Vui lòng kiểm tra giỏ hàng và mã giảm giá.' } }
</script>
<template><section class="market-section"><span class="eyebrow">Thanh toán</span><h1>Xác nhận đơn hàng</h1><form class="panel form-grid checkout-form" @submit.prevent="submit"><label>Địa chỉ nhận hàng<select v-model="addressId" required><option v-for="address in addresses" :key="address.id" :value="address.id">{{ address.recipientName }} · {{ address.line1 }}, {{ address.city }}</option></select></label><label>Mã giảm giá<input v-model="coupon" placeholder="Nhập mã nếu có" /></label><p v-if="error" class="form-error">{{ error }}</p><button class="primary-button">Tạo đơn và thanh toán</button></form></section></template>
