import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CryptoPayLink - Accept Crypto Payments',
  description: 'Professional crypto payment platform for creators, freelancers, and educators. Accept USDT, USDC, SOL, ETH with automatic verification.',
  keywords: 'crypto payments, cryptocurrency, USDT, USDC, Solana, Ethereum, payment gateway',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}