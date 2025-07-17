import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
        ),
        invoices (invoice_number)
      `)
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'confirmed') {
      return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })
    }

    // Get or create invoice number
    let invoiceNumber = payment.invoices?.[0]?.invoice_number
    
    if (!invoiceNumber) {
      invoiceNumber = `INV-${Date.now()}-${paymentId.slice(-8)}`
      
      // Save invoice record
      await supabaseAdmin!
        .from('invoices')
        .insert({
          payment_id: paymentId,
          invoice_number: invoiceNumber,
          sent_at: new Date().toISOString()
        })
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
      transactionHash: payment.transaction_hash || '',
      walletAddress: payment.products.recipient_wallet,
      timestamp: new Date(payment.confirmed_at || payment.created_at)
    }

    const invoicePDF = generateInvoicePDF(invoiceData)

    // Return PDF as base64
    return NextResponse.json({ 
      success: true, 
      pdf: invoicePDF,
      invoiceNumber 
    })
  } catch (error: any) {
    console.error('Invoice download error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}