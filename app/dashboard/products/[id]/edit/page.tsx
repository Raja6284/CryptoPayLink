'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Package, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function EditProduct() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const productId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_usd: '',
    chain: '',
    currency: '',
    recipient_wallet: '',
    is_active: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkAuthAndFetchProduct = async () => {
      const supabase = createClient()

      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/auth')
          return
        }
        setUser(user)

        // Fetch product
        await fetchProduct()
      } catch (error) {
        console.error('Auth/fetch error:', error)
        router.push('/dashboard')
      }
    }

    checkAuthAndFetchProduct()
  }, [productId, router])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found')
        } else if (response.status === 401) {
          throw new Error('You do not have permission to edit this product')
        }
        throw new Error('Failed to fetch product')
      }

      const productData = await response.json()
      setProduct(productData)
      
      // Populate form
      setFormData({
        name: productData.name,
        description: productData.description || '',
        price_usd: productData.price_usd.toString(),
        chain: productData.chain,
        currency: productData.currency,
        recipient_wallet: productData.recipient_wallet,
        is_active: productData.is_active
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Validate form
      if (!formData.name || !formData.price_usd || !formData.chain || !formData.currency || !formData.recipient_wallet) {
        throw new Error('Please fill in all required fields')
      }

      if (parseFloat(formData.price_usd) <= 0) {
        throw new Error('Price must be greater than 0')
      }

      // Update product
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price_usd: parseFloat(formData.price_usd),
          chain: formData.chain,
          currency: formData.currency,
          recipient_wallet: formData.recipient_wallet,
          is_active: formData.is_active
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getCurrencyOptions = () => {
    if (formData.chain === 'solana') {
      return [{ value: 'SOL', label: 'SOL' }]
    } else if (formData.chain === 'ethereum') {
      return [
        { value: 'ETH', label: 'ETH' },
        { value: 'USDT', label: 'USDT' },
        { value: 'USDC', label: 'USDC' }
      ]
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 sm:py-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-2 sm:mr-4">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Product</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Package className="h-5 w-5 mr-2" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Premium Course, Consultation Session"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your product or service"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price_usd}
                  onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chain">Blockchain *</Label>
                  <Select
                    value={formData.chain}
                    onValueChange={(value) => setFormData({ ...formData, chain: value, currency: '' })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select blockchain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solana">Solana</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    disabled={!formData.chain}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCurrencyOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wallet">Recipient Wallet Address *</Label>
                <Input
                  id="wallet"
                  type="text"
                  placeholder={
                    formData.chain === 'solana' 
                      ? 'Solana wallet address (e.g., 7xKXt...)'
                      : 'Ethereum wallet address (e.g., 0x742d...)'
                  }
                  value={formData.recipient_wallet}
                  onChange={(e) => setFormData({ ...formData, recipient_wallet: e.target.value })}
                  required
                  className="w-full font-mono text-sm"
                />
                <p className="text-xs sm:text-sm text-gray-600">
                  This is where you will receive payments. Make sure this address is correct!
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active" className="text-sm sm:text-base">
                  Product is active and accepting payments
                </Label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" type="button" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}