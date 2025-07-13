'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

export default function CreateProduct() {
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_usd: '',
    chain: '',
    currency: '',
    recipient_wallet: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUser(user)
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form
      if (!formData.name || !formData.price_usd || !formData.chain || !formData.currency || !formData.recipient_wallet) {
        throw new Error('Please fill in all required fields')
      }

      if (parseFloat(formData.price_usd) <= 0) {
        throw new Error('Price must be greater than 0')
      }

      // Create product
      const { error } = await supabase!
        .from('products')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          price_usd: parseFloat(formData.price_usd),
          chain: formData.chain,
          currency: formData.currency,
          recipient_wallet: formData.recipient_wallet,
          is_active: true
        })

      if (error) throw error

      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Premium Course, Consultation Session"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chain">Blockchain *</Label>
                  <Select
                    value={formData.chain}
                    onValueChange={(value) => setFormData({ ...formData, chain: value, currency: '' })}
                  >
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                />
                <p className="text-sm text-gray-600">
                  This is where you will receive payments. Make sure this address is correct!
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}