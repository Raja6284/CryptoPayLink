import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCryptoPrice, calculateCryptoAmount } from '@/lib/blockchain'

export async function POST(request: NextRequest) {
  try {
    const { productId, buyerEmail, buyerWallet } = await request.json()

    if (!productId || !buyerEmail || !buyerWallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get product details using admin client
    const { data: product, error: productError } = await supabaseAdmin!
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 })
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

    // Create payment record using admin client to bypass RLS
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
      return NextResponse.json({ error: paymentError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      cryptoAmount,
      cryptoPrice
    })

  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}