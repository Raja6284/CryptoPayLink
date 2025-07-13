import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPaymentConfirmation } from '@/lib/email'
import { generateInvoicePDF } from '@/lib/invoice'

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Fetch payment details with product and user info
    const { data: payment, error: paymentError } = await supabaseAdmin!
      .from('payments')
      .select(`
        *,
        products (
          *,
          users (email, full_name)
        )
      `)
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Generate invoice
    const invoiceNumber = `INV-${Date.now()}`
    const invoiceData = {
      invoiceNumber,
      productName: payment.products.name,
      buyerEmail: payment.buyer_email,
      sellerEmail: payment.products.users.email,
      amountUSD: payment.amount_usd,
      amountCrypto: payment.amount_crypto,
      currency: payment.currency,
      transactionHash: payment.transaction_hash,
      walletAddress: payment.products.recipient_wallet,
      timestamp: new Date(payment.confirmed_at)
    }

    const invoicePDF = generateInvoicePDF(invoiceData)

    // Save invoice record
    const { error: invoiceError } = await supabaseAdmin!
      .from('invoices')
      .insert({
        payment_id: paymentId,
        invoice_number: invoiceNumber,
        sent_at: new Date().toISOString()
      })

    if (invoiceError) {
      console.error('Failed to save invoice record:', invoiceError)
    }

    // Send confirmation emails
    await sendPaymentConfirmation(
      payment.buyer_email,
      payment.products.users.email,
      payment.products.name,
      payment.amount_usd,
      payment.amount_crypto,
      payment.currency,
      payment.transaction_hash,
      invoicePDF
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Confirmation email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}