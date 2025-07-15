import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Get single product (public access for payment pages)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: product, error } = await supabaseAdmin!
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update product (authenticated users only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price_usd, chain, currency, recipient_wallet, is_active } = body

    // Validate required fields
    if (!name || !price_usd || !chain || !currency || !recipient_wallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (parseFloat(price_usd) <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    // Update product using admin client but with user verification
    const { data: product, error } = await supabaseAdmin!
      .from('products')
      .update({
        name,
        description,
        price_usd: parseFloat(price_usd),
        chain,
        currency,
        recipient_wallet,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns the product
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete product (authenticated users only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if there are any confirmed payments for this product
    const { data: payments, error: paymentsError } = await supabaseAdmin!
      .from('payments')
      .select('id')
      .eq('product_id', params.id)
      .eq('status', 'confirmed')
      .limit(1)

    if (paymentsError) {
      return NextResponse.json({ error: 'Error checking payments' }, { status: 500 })
    }

    if (payments && payments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product with confirmed payments. Consider deactivating instead.' 
      }, { status: 400 })
    }

    // Delete product using admin client but with user verification
    const { error } = await supabaseAdmin!
      .from('products')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns the product

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}