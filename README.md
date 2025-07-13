# CryptoPayLink - Professional Crypto Payment Platform

CryptoPayLink is a comprehensive, production-ready platform that enables creators, freelancers, and online educators to accept cryptocurrency payments with automatic verification, invoicing, and email confirmations.

## 🚀 Features

### Core Functionality
- **Multi-Chain Support**: Accept payments on Solana and Ethereum networks
- **Multiple Cryptocurrencies**: SOL, ETH, USDT, USDC support
- **Automatic Verification**: Real-time on-chain transaction verification
- **Professional Invoicing**: Auto-generated PDF invoices with branding
- **Email Notifications**: Automatic confirmation emails to buyers and sellers
- **Payment History**: Complete transaction tracking and reporting

### User Experience
- **No-Code Solution**: Create payment links without any technical knowledge
- **Mobile Optimized**: QR codes for seamless mobile payments
- **Responsive Design**: Works perfectly on all devices
- **Real-time Updates**: Live payment status updates
- **Secure Authentication**: Supabase Auth with email/Google OAuth

### Business Features
- **Creator Dashboard**: Manage products and view analytics
- **Payment Links**: Shareable links for each product
- **Revenue Tracking**: Real-time revenue and payment statistics
- **Invoice Management**: Professional PDF invoices for all transactions
- **Customer Management**: Track buyer information and payment history

## 🛠️ Tech Stack

### Frontend
- **Next.js 13+** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Lucide React** - Beautiful icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Database, authentication, and real-time subscriptions
- **PostgreSQL** - Robust relational database

### Blockchain Integration
- **Solana Web3.js** - Solana blockchain interaction
- **Ethers.js** - Ethereum blockchain interaction
- **Block Explorer APIs** - Transaction verification

### Additional Services
- **Resend** - Transactional email service
- **jsPDF** - PDF invoice generation
- **QRCode.js** - QR code generation for payments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Resend account (for emails)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd cryptopaylink
npm install
```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/create_initial_schema.sql`
   - Enable Google OAuth in Authentication settings (optional)

3. **Configure environment variables:**
```bash
cp .env.local.example .env.local
```

Fill in your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# Blockchain RPC URLs (optional - uses public endpoints by default)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

4. **Run the development server:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Usage Guide

### For Creators/Sellers

1. **Sign Up**: Create an account using email or Google OAuth
2. **Create Product**: Add product details, price, and wallet address
3. **Share Payment Link**: Copy and share your unique payment link
4. **Receive Payments**: Get notified when payments are confirmed
5. **Track Revenue**: Monitor earnings in your dashboard

### For Customers/Buyers

1. **Visit Payment Link**: Click on the creator's payment link
2. **Scan QR Code**: Use your crypto wallet to scan the QR code
3. **Send Payment**: Transfer the exact amount to the provided address
4. **Confirm Payment**: Click "I've Sent the Payment" after sending
5. **Receive Invoice**: Get email confirmation with PDF invoice

## 🔧 API Reference

### Payment Verification
The system automatically verifies payments using:
- **Solana**: `getConfirmedSignaturesForAddress2` API
- **Ethereum**: JSON-RPC and Etherscan API
- **Tokens**: ERC-20 Transfer event monitoring

### Email Notifications
Automatic emails are sent for:
- Payment confirmations (buyer & seller)
- Payment failures
- Invoice delivery

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **No Private Key Storage**: Only public wallet addresses stored
- **Transaction Verification**: All payments verified on-chain
- **Secure Authentication**: Supabase Auth with JWT tokens
- **Input Validation**: Comprehensive form and API validation

## 🎨 Customization

### Branding
- Update colors in `tailwind.config.ts`
- Modify invoice templates in `lib/invoice.ts`
- Customize email templates in `lib/email.ts`

### Adding New Cryptocurrencies
1. Update the `Currency` type in `lib/types.ts`
2. Add verification logic in `lib/blockchain.ts`
3. Update the UI components to include the new currency

## 📈 Production Deployment

### Environment Setup
1. Set up production Supabase project
2. Configure production email service
3. Set up blockchain API keys for better rate limits
4. Configure custom domain

### Recommended Services
- **Hosting**: Vercel, Netlify, or AWS
- **Database**: Supabase (managed PostgreSQL)
- **Email**: Resend or SendGrid
- **Blockchain APIs**: Alchemy, Infura, or QuickNode

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Join our community discussions

## 🔮 Roadmap

- [ ] Mobile app (React Native)
- [ ] More blockchain networks (Polygon, BSC, etc.)
- [ ] Subscription payments
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Custom branding options
- [ ] API for third-party integrations

---

**CryptoPayLink** - Making crypto payments accessible for everyone! 🚀