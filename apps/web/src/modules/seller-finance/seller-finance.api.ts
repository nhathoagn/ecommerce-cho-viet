import { apiClient } from '../../api/client'

export interface SellerSummary {
  productCount: number
  lowStockCount: number
  orderCount: number
  pendingOrderCount: number
  grossRevenue: number
  availableBalance: number
}
export interface WalletTransaction { id: string; type: string; amount: string; description: string; createdAt: string }
export interface Withdrawal { id: string; amount: string; bankName: string; status: string; createdAt: string }
export interface SellerWallet { availableBalance: number; transactions: WalletTransaction[]; withdrawals: Withdrawal[] }

const unwrap = <T>(response: { data: { data: T } }) => response.data.data
export const sellerFinanceApi = {
  summary: () => apiClient.get('/seller/dashboard').then(unwrap<SellerSummary>),
  wallet: () => apiClient.get('/seller/wallet').then(unwrap<SellerWallet>),
  withdraw: (input: { amount: number; bankName: string; accountNumber: string; accountName: string }) =>
    apiClient.post('/seller/withdrawals', input).then(unwrap<Withdrawal>),
}
