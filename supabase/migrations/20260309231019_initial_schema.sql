-- ============================================
-- Cleo Database Schema — Supabase (Postgres)
-- Migration: initial_schema
-- Date: 2026-03-09
-- Author: Dara (Data Engineer Agent)
-- ============================================

-- ============================================
-- 0. Utility Functions
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. Categories (seed data, public read)
-- ============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6B7280',
  sort_order INT NOT NULL DEFAULT 0
);

-- ============================================
-- 2. Profiles (extends auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 3. User Settings
-- ============================================

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  retirement_goal_age INT DEFAULT 65,
  monthly_contribution_target DECIMAL(12,2) DEFAULT 0,
  expected_return_rate DECIMAL(5,4) DEFAULT 0.10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. Bank Connections
-- ============================================

CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pluggy_item_id TEXT NOT NULL UNIQUE,
  connector_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'outdated', 'updating')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_connections_user ON bank_connections(user_id);

-- ============================================
-- 5. Accounts
-- ============================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bank_connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  pluggy_account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit')),
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_user ON accounts(user_id);

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. Transactions
-- ============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  pluggy_transaction_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  category_id UUID REFERENCES categories(id),
  raw_category TEXT,
  merchant TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  installment_number INT,
  installment_total INT,
  category_confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_pluggy ON transactions(pluggy_transaction_id);

-- ============================================
-- 7. Recurring Transactions
-- ============================================

CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_pattern TEXT NOT NULL,
  merchant TEXT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly')),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'installment')),
  installments_remaining INT,
  next_expected_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_user ON recurring_transactions(user_id);

-- ============================================
-- 8. Subscriptions (billing)
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 9. Chat Messages
-- ============================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_user_date ON chat_messages(user_id, created_at DESC);

-- ============================================
-- 10. Chat Usage (rate limiting)
-- ============================================

CREATE TABLE chat_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_count INT NOT NULL DEFAULT 0,
  period TEXT NOT NULL, -- format: '2026-03'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period)
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on ALL tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;

-- Categories: public read-only
CREATE POLICY "Categories are public" ON categories
  FOR SELECT USING (true);

-- Profiles: users read/update own
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- User tables: full CRUD on own data
CREATE POLICY "Users manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bank_connections" ON bank_connections
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own recurring" ON recurring_transactions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own subscription" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own chat" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own chat_usage" ON chat_usage
  FOR ALL USING (auth.uid() = user_id);

-- Note: Service role key (used by webhooks) bypasses RLS automatically

-- ============================================
-- Seed Data: Categories
-- ============================================

INSERT INTO categories (name, icon, color, sort_order) VALUES
  ('Alimentação', '🍔', '#EF4444', 1),
  ('Transporte', '🚗', '#F59E0B', 2),
  ('Moradia', '🏠', '#8B5CF6', 3),
  ('Saúde', '💊', '#10B981', 4),
  ('Educação', '📚', '#3B82F6', 5),
  ('Lazer', '🎮', '#EC4899', 6),
  ('Compras', '🛍️', '#F97316', 7),
  ('Assinaturas', '📺', '#6366F1', 8),
  ('Receita', '💰', '#22C55E', 9),
  ('Transferência', '🔄', '#64748B', 10),
  ('Investimentos', '📈', '#14B8A6', 11),
  ('Outros', '📦', '#6B7280', 99);
