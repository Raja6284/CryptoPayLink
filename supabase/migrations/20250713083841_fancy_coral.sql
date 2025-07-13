/*
  # CryptoPayLink Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `wallet_address` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `description` (text, optional)
      - `price_usd` (numeric)
      - `chain` (text: 'solana' or 'ethereum')
      - `currency` (text: 'SOL', 'ETH', 'USDT', 'USDC')
      - `recipient_wallet` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `payments`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `buyer_email` (text)
      - `amount_usd` (numeric)
      - `amount_crypto` (numeric)
      - `currency` (text)
      - `chain` (text)
      - `transaction_hash` (text, optional)
      - `status` (text: 'pending', 'confirmed', 'failed')
      - `buyer_wallet` (text, optional)
      - `created_at` (timestamp)
      - `confirmed_at` (timestamp, optional)
    
    - `invoices`
      - `id` (uuid, primary key)
      - `payment_id` (uuid, foreign key to payments)
      - `invoice_number` (text, unique)
      - `pdf_url` (text, optional)
      - `sent_at` (timestamp, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for public access to payment pages

  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_usd numeric(10,2) NOT NULL CHECK (price_usd > 0),
  chain text NOT NULL CHECK (chain IN ('solana', 'ethereum')),
  currency text NOT NULL CHECK (currency IN ('SOL', 'ETH', 'USDT', 'USDC')),
  recipient_wallet text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_email text NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  amount_crypto numeric(20,8) NOT NULL,
  currency text NOT NULL,
  chain text NOT NULL,
  transaction_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  buyer_wallet text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  pdf_url text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Users can read own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  TO anon
  USING (is_active = true);

-- Payments policies
CREATE POLICY "Users can read payments for their products"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = payments.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create payments"
  ON payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "System can update payments"
  ON payments FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Invoices policies
CREATE POLICY "Users can read invoices for their payments"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments 
      JOIN products ON products.id = payments.product_id
      WHERE payments.id = invoices.payment_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create invoices"
  ON invoices FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payments_product_id ON payments(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);

-- Create function to automatically create user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at'
  ) THEN
    CREATE TRIGGER set_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_products_updated_at'
  ) THEN
    CREATE TRIGGER set_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;