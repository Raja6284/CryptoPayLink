import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCryptoPrice, calculateCryptoAmount } from '@/lib/blockchain'

export async function createPayment(productId: string, buyerEmail: string, buyerWallet: string) {
  // Get product details
  const { data: product, error: productError } = await supabaseAdmin!
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (productError || !product) {
    throw new Error('Product not found or inactive')
  }

  // Get current crypto price
  const priceMap: { [key: string]: string } = {
    SOL: 'solana',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin'
  }

  const coinId = priceMap[product.currency]
  const cryptoPrice = await getCryptoPrice(coinId)
  const cryptoAmount = calculateCryptoAmount(product.price_usd, cryptoPrice)

  // Create payment record
  const { data: payment, error: paymentError } = await supabaseAdmin!
    .from('payments')
    .insert({
      product_id: productId,
      buyer_email: buyerEmail,
      buyer_wallet: buyerWallet,
      amount_usd: product.price_usd,
      amount_crypto: cryptoAmount,
      currency: product.currency,
      chain: product.chain,
      status: 'pending'
    })
    .select()
    .single()

  if (paymentError) {
    throw new Error(paymentError.message)
  }

  return {
    payment,
    cryptoAmount,
    cryptoPrice
  }
}

export async function getProductById(productId: string) {
  const { data: product, error } = await supabaseAdmin!
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !product) {
    throw new Error('Product not found')
  }

  return product
}