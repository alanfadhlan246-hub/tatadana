-- ====================================================================
-- TataDana Database Schema Migration (Supabase / PostgreSQL)
-- Migration: 001_initial_schema.sql
-- Description: Core schema, Enums, Tables, RLS, Indexes, & WIB Timezone
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('starter', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE wallet_type AS ENUM ('cash', 'bank', 'ewallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_period AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_provider_mode AS ENUM ('single', 'failover');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_order_status AS ENUM ('pending', 'approved', 'rejected', 'settled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with Supabase auth.users or standalone ID)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    approval_status approval_status NOT NULL DEFAULT 'pending_approval',
    approval_notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    plan subscription_plan NOT NULL DEFAULT 'starter',
    plan_expires_at TIMESTAMPTZ,
    telegram_user_id BIGINT UNIQUE,
    telegram_username TEXT,
    default_wallet_id UUID,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    reminder_enabled BOOLEAN NOT NULL DEFAULT true,
    reminder_frequency INT NOT NULL DEFAULT 1, -- 1x or 2x daily
    reminder_time_1 TIME NOT NULL DEFAULT '09:00:00',
    reminder_time_2 TIME NOT NULL DEFAULT '20:00:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 4. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type wallet_type NOT NULL DEFAULT 'bank',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT false,
    color VARCHAR(20) NOT NULL DEFAULT '#0284c7',
    icon VARCHAR(50) NOT NULL DEFAULT 'wallet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- Foreign key for default_wallet_id in profiles
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS fk_profiles_default_wallet;
ALTER TABLE public.profiles 
    ADD CONSTRAINT fk_profiles_default_wallet 
    FOREIGN KEY (default_wallet_id) REFERENCES public.wallets(id) ON DELETE SET NULL;

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system templates
    name VARCHAR(100) NOT NULL,
    type transaction_type NOT NULL DEFAULT 'expense',
    emoji VARCHAR(20) NOT NULL DEFAULT '🏷️',
    color VARCHAR(20) NOT NULL DEFAULT '#0284c7',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 6. BUDGETS TABLE (Harian, Mingguan, Bulanan)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    period_type budget_period NOT NULL DEFAULT 'monthly',
    amount NUMERIC(15, 2) NOT NULL,
    alert_80_sent BOOLEAN NOT NULL DEFAULT false,
    alert_100_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    UNIQUE(user_id, category_id, period_type)
);

-- 7. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT, -- For transfers
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL DEFAULT 'expense',
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    notes TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'web_app', -- 'telegram_text', 'telegram_photo', 'telegram_voice', 'web_app'
    receipt_image_url TEXT,
    receipt_items_count INT NOT NULL DEFAULT 0,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 8. TRANSACTION ITEMS (Receipt Multi-Item Breakdown)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 9. TELEGRAM BOT CONFIGS
CREATE TABLE IF NOT EXISTS public.telegram_bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    bot_token_encrypted TEXT NOT NULL,
    bot_username VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT false,
    webhook_set BOOLEAN NOT NULL DEFAULT false,
    webhook_url TEXT,
    last_tested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 10. TELEGRAM UPDATES (Idempotency Engine)
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    update_id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    payload JSONB
);

-- 11. AI PROVIDER CONFIGS
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL UNIQUE, -- 'gemini', 'openai', 'deepseek'
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority_order INT NOT NULL DEFAULT 1,
    mode ai_provider_mode NOT NULL DEFAULT 'failover',
    model_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 12. AI AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider_used VARCHAR(50) NOT NULL,
    endpoint_type VARCHAR(50) NOT NULL, -- 'nlp_text', 'ocr_receipt', 'voice_stt', 'advisor'
    prompt_preview TEXT,
    response_preview TEXT,
    latency_ms INT,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    cost_estimate NUMERIC(10, 4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 13. EXPORT HISTORIES
CREATE TABLE IF NOT EXISTS public.export_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_format VARCHAR(10) NOT NULL, -- 'pdf', 'xlsx'
    period_label VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 14. PAYMENT ORDERS (Midtrans & Manual Transfer)
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL,
    plan subscription_plan NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'midtrans', -- 'midtrans', 'manual_transfer'
    status payment_order_status NOT NULL DEFAULT 'pending',
    proof_file_url TEXT,
    admin_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 15. ADMIN TRANSACTION AUDIT LOGS (Privacy protection when admin inspects user data)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'inspect_transactions', 'impersonate_user', 'approve_user', 'update_ai'
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- 16. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON public.profiles(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_trx ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_telegram_updates_id ON public.telegram_updates(update_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_user ON public.ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_histories_user ON public.export_histories(user_id);

-- 17. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Profiles: user views/edits own profile, admins view all
CREATE POLICY "Users can access own profile" ON public.profiles
    FOR ALL USING (auth.uid() = auth_user_id OR auth.uid() IN (SELECT auth_user_id FROM public.profiles WHERE role = 'admin'));

-- Wallets: user views own wallets
CREATE POLICY "Users can access own wallets" ON public.wallets
    FOR ALL USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Categories: user views own or system templates
CREATE POLICY "Users can access own or system categories" ON public.categories
    FOR ALL USING (is_system = true OR user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Budgets: user views own budgets
CREATE POLICY "Users can access own budgets" ON public.budgets
    FOR ALL USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Transactions: user views own transactions
CREATE POLICY "Users can access own transactions" ON public.transactions
    FOR ALL USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Transaction Items: user views own items
CREATE POLICY "Users can access own transaction items" ON public.transaction_items
    FOR ALL USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));
