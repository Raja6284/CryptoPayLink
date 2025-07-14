export interface User {
  id: string
  email: string
  full_name?: string
  wallet_address?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  description?: string
  price_usd: number
  chain: 'solana' | 'ethereum'
  currency: 'SOL' | 'USDT' | 'USDC' | 'ETH'
  recipient_wallet: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  product_id: string
  buyer_email: string
  buyer_wallet?: string
  amount_usd: number
  amount_crypto: number
  currency: string
  chain: string
  transaction_hash?: string
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  confirmed_at?: string
}

export interface Invoice {
  id: string
  payment_id: string
  invoice_number: string
  pdf_url?: string
  sent_at?: string
  created_at: string
}

export type PaymentStatus = 'pending' | 'confirmed' | 'failed'
export type Chain = 'solana' | 'ethereum'
export type Currency = 'SOL' | 'USDT' | 'USDC' | 'ETH'