import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifySOLPayment, verifyETHPayment, verifyTokenPayment } from '@/lib/blockchain'

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Use admin client to bypass RLS for payment verification
    const { data: payment, error: paymentError } = await supabaseAdmin!
      .from('payments')
      .select(`
        *,
        products (
          id,
          name,
          chain,
          currency,
          recipient_wallet
        )
      `)
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'confirmed') {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already confirmed',
        transactionHash: payment.transaction_hash 
      })
    }

    if (!payment.buyer_wallet) {
      return NextResponse.json({ error: 'Buyer wallet address not found' }, { status: 400 })
    }

    const product = payment.products
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify payment based on chain and currency
    let result = { verified: false, transactionHash: undefined }

    if (product.chain === 'solana' && product.currency === 'SOL') {
      result = await verifySOLPayment(
        payment.buyer_wallet,
        product.recipient_wallet,
        payment.amount_crypto
      )
    } else if (product.chain === 'ethereum') {
      if (product.currency === 'ETH') {
        result = await verifyETHPayment(
          payment.buyer_wallet,
          product.recipient_wallet,
          payment.amount_crypto
        )
      } else if (product.currency === 'USDT' || product.currency === 'USDC') {
        result = await verifyTokenPayment(
          product.currency as 'USDT' | 'USDC',
          payment.buyer_wallet,
          product.recipient_wallet,
          payment.amount_crypto
        )
      }
    }

    if (result.verified && result.transactionHash) {
      // Check if this transaction hash already exists
      const { data: existingTransaction } = await supabaseAdmin!
        .from('payments')
        .select('id')
        .eq('transaction_hash', result.transactionHash)
        .neq('id', paymentId)
        .single()

      if (existingTransaction) {
        return NextResponse.json({ 
          error: 'This transaction has already been verified for another payment' 
        }, { status: 400 })
      }

      // Update payment status using admin client to bypass RLS
      const { error: updateError } = await supabaseAdmin!
        .from('payments')
        .update({
          status: 'confirmed',
          transaction_hash: result.transactionHash,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (updateError) {
        console.error('Error updating payment:', updateError)
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
      }

      // Send confirmation emails
      try {
        await fetch(`${request.nextUrl.origin}/api/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        })
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't fail the verification if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        transactionHash: result.transactionHash
      })
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Payment not found or not yet confirmed on blockchain' 
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}