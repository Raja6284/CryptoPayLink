'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Coins, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Smartphone,
  Globe,
  Mail
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase || !isSupabaseConfigured()) {
        return // Skip auth check if Supabase is not configured
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Trustless",
      description: "All payments are verified directly on-chain. No intermediaries or custody risks."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Verification",
      description: "Automatic transaction verification within minutes using blockchain APIs."
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Mobile Optimized",
      description: "QR codes for seamless mobile payments. Your customers can pay in seconds."
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Auto Invoicing",
      description: "Professional PDF invoices sent automatically to both buyer and seller."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Multi-Chain Support",
      description: "Accept payments on Solana and Ethereum networks with multiple currencies."
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "No-Code Solution",
      description: "Create payment links without any technical knowledge or coding skills."
    }
  ]

  const supportedTokens = [
    { name: 'Solana', symbol: 'SOL', chain: 'Solana' },
    { name: 'Ethereum', symbol: 'ETH', chain: 'Ethereum' },
    { name: 'USD Tether', symbol: 'USDT', chain: 'Ethereum' },
    { name: 'USD Coin', symbol: 'USDC', chain: 'Ethereum' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">CryptoPayLink</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-green-600 hover:bg-green-700">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Accept <span className="text-green-600">Crypto Payments</span> Like a Pro
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The easiest way for creators, freelancers, and educators to accept cryptocurrency payments. 
              No coding required, automatic verification, instant invoicing.
            </p>
            
            {!isSupabaseConfigured() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Setup Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Please click the <b>Connect to Supabase</b> button in the top right to configure your database connection.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
                  disabled={!isSupabaseConfigured()}
                >
                  Start Accepting Payments
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Tokens */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Supported Cryptocurrencies
            </h2>
            <p className="text-lg text-gray-600">
              Accept payments in the most popular cryptocurrencies
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {supportedTokens.map((token) => (
              <Card key={token.symbol} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coins className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{token.symbol}</h3>
                  <p className="text-sm text-gray-600 mb-2">{token.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {token.chain}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Accept Crypto
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-grade crypto payment infrastructure designed for modern creators and businesses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-green-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes with our simple 3-step process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Create Your Product
              </h3>
              <p className="text-gray-600">
                Set up your product with a name, price, and your crypto wallet address. Choose your preferred blockchain and currency.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Share Payment Link
              </h3>
              <p className="text-gray-600">
                Get a unique payment link for your product. Share it anywhere - social media, email, or your website.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Get Paid Instantly
              </h3>
              <p className="text-gray-600">
                Customers pay with crypto, we verify the transaction automatically, and send invoices to both parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Accepting Crypto?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of creators already using CryptoPayLink to accept cryptocurrency payments from customers worldwide.
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3">
              Create Your First Payment Link
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Coins className="h-8 w-8 text-green-500 mr-2" />
              <span className="text-2xl font-bold">CryptoPayLink</span>
            </div>
            <p className="text-gray-400 mb-6">
              The professional crypto payment platform for modern creators
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}