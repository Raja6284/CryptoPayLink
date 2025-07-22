'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Product, Payment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Copy, ExternalLink, DollarSign, Package, TrendingUp, Coins, Search, Download, Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react'
import { ProductEditModal } from '@/components/product-edit-modal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    activeProducts: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/auth')
          return
        }
        setUser(user)
        await fetchData()
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/auth')
      }
    }
    checkAuth()
  }, [router, supabase])

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      // Fetch payments for user's products
      const productIds = productsData?.map(p => p.id) || []
      let paymentsData: Payment[] = []
      
      if (productIds.length > 0) {
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .in('product_id', productIds)
          .order('created_at', { ascending: false })

        if (paymentsError) throw paymentsError
        paymentsData = payments || []
      }

      setProducts(productsData || [])
      setPayments(paymentsData)
      setFilteredPayments(paymentsData)

      // Calculate stats
      const totalRevenue = paymentsData
        .filter(p => p.status === 'confirmed')
        .reduce((sum, p) => sum + p.amount_usd, 0)
      
      const totalPayments = paymentsData.filter(p => p.status === 'confirmed').length
      const activeProducts = productsData?.filter(p => p.is_active).length || 0

      setStats({ totalRevenue, totalPayments, activeProducts })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter payments based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPayments(payments)
    } else {
      const filtered = payments.filter(payment => 
        payment.transaction_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.buyer_email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPayments(filtered)
    }
  }, [searchTerm, payments])

  const copyPaymentLink = (productId: string) => {
    const link = `${window.location.origin}/pay/${productId}`
    navigator.clipboard.writeText(link)
  }

  const getBlockExplorerUrl = (hash: string, chain: string) => {
    if (chain === 'solana') {
      return `https://solscan.io/tx/${hash}`
    } else {
      return `https://etherscan.io/tx/${hash}`
    }
  }

  const downloadInvoice = async (paymentId: string) => {
    try {
      const response = await fetch('/api/download-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.pdf) {
          // Create download link for PDF
          const link = document.createElement('a')
          link.href = data.pdf
          link.download = `invoice-${data.invoiceNumber}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        alert('Failed to generate invoice')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to generate invoice')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setEditModalOpen(true)
  }

  const handleSaveProduct = async (updatedProduct: Partial<Product>) => {
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }

      // Refresh data
      await fetchData()
    } catch (error: any) {
      throw error
    }
  }

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      // Refresh data
      await fetchData()
      setDeleteConfirmOpen(false)
      setProductToDelete(null)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleToggleActive = async (product: Product) => {
    const originalStatus = product.is_active
    
    // Optimistically update UI
    setProducts(products.map(p => 
      p.id === product.id ? { ...p, is_active: !p.is_active } : p
    ))

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price_usd: product.price_usd,
          chain: product.chain,
          currency: product.currency,
          recipient_wallet: product.recipient_wallet,
          is_active: !product.is_active
        })
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, is_active: originalStatus } : p
        ))
        
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }

      // Show success feedback
      const newStatus = !originalStatus
      alert(`Product ${newStatus ? 'activated' : 'deactivated'} successfully`)
      
      // Refresh stats
      const activeProducts = products.filter(p => p.is_active).length
      setStats(prev => ({ ...prev, activeProducts }))
    } catch (error: any) {
      // Revert optimistic update on error
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: originalStatus } : p
      ))
      alert(error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-green-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">CryptoPayLink</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From confirmed payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
              <p className="text-xs text-muted-foreground">Successful transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
              <p className="text-xs text-muted-foreground">Products accepting payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
            <Link href="/dashboard/create-product">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Button>
            </Link>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-4">Create your first product to start accepting crypto payments.</p>
                <Link href="/dashboard/create-product">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Product
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {products.map((product) => (
                <Card key={product.id} className={!product.is_active ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={() => handleToggleActive(product)}
                          size="sm"
                        />
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="font-medium">${product.price_usd}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Chain:</span>
                        <Badge variant="outline">{product.chain}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Currency:</span>
                        <Badge variant="outline">{product.currency}</Badge>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditProduct(product)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyPaymentLink(product.id)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        <div className="flex space-x-1">
                          <Link href={`/pay/${product.id}`} target="_blank">
                            <Button variant="outline" size="sm" title="Preview">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by transaction hash or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No payments found' : 'No payments yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Share your payment links to start receiving payments.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buyer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sender Wallet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.slice(0, 10).map((payment) => {
                        const product = products.find(p => p.id === payment.product_id)
                        return (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product?.name || 'Unknown Product'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{payment.buyer_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                ${payment.amount_usd}
                              </div>
                              <div className="text-sm text-gray-500">
                                {payment.amount_crypto} {payment.currency}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                variant={
                                  payment.status === 'confirmed' ? 'default' :
                                  payment.status === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.transaction_hash ? (
                                <a
                                  href={getBlockExplorerUrl(payment.transaction_hash, payment.chain)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                                >
                                  {payment.transaction_hash.slice(0, 8)}...{payment.transaction_hash.slice(-8)}
                                  <ExternalLink className="inline h-3 w-3 ml-1" />
                                </a>
                              ) : (
                                <span className="text-gray-400">Pending</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.buyer_wallet ? (
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {payment.buyer_wallet.slice(0, 6)}...{payment.buyer_wallet.slice(-4)}
                                </code>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {payment.status === 'confirmed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadInvoice(payment.id)}
                                  className="flex items-center"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Invoice
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filteredPayments.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Showing 10 of {filteredPayments.length} payments
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */} 
      <ProductEditModal
        product={editingProduct}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleSaveProduct}
      />
    
         
      
      

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteProduct}
      />
    </div>
  )
}