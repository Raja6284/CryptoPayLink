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

    // Check if invoice already exists for this payment
    const { data: existingInvoice } = await supabaseAdmin!
      .from('invoices')
      .select('invoice_number')
      .eq('payment_id', paymentId)
      .single()

    // If invoice already exists and email was already sent, don't send again
    if (existingInvoice) {
      console.log(`Invoice already exists for payment ${paymentId}, skipping email`)
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice already sent' 
      })
    }

    let invoiceNumber: string
    
    // Generate new invoice number
    invoiceNumber = `INV-${Date.now()}-${paymentId.slice(-8)}`
    
    // Save invoice record with sent_at timestamp to prevent duplicates
    const { error: invoiceError } = await supabaseAdmin!
      .from('invoices')
      .insert({
        payment_id: paymentId,
        invoice_number: invoiceNumber,
        sent_at: new Date().toISOString()
      })

    if (invoiceError) {
      console.error('Failed to save invoice record:', invoiceError)
      // Check if it's a duplicate key error (invoice already exists)
      if (invoiceError.code === '23505') {
        return NextResponse.json({ 
          success: true, 
          message: 'Invoice already processed' 
        })
      }
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Generate invoice
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