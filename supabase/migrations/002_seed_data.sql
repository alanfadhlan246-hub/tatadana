-- ====================================================================
-- TataDana Database Seed Migration (Supabase / PostgreSQL)
-- Migration: 002_seed_data.sql
-- Description: System Categories, Default Providers, Admin Account
-- ====================================================================

-- 1. SYSTEM CATEGORIES
INSERT INTO public.categories (id, user_id, name, type, emoji, color, is_system) VALUES
('c0000000-0000-0000-0000-000000000001', NULL, 'Makanan & Minuman', 'expense', '🍜', '#0284c7', true),
('c0000000-0000-0000-0000-000000000002', NULL, 'Transportasi', 'expense', '🚗', '#0369a1', true),
('c0000000-0000-0000-0000-000000000003', NULL, 'Hiburan & Liburan', 'expense', '🎮', '#38bdf8', true),
('c0000000-0000-0000-0000-000000000004', NULL, 'Tagihan & Utilitas', 'expense', '🏠', '#0ea5e9', true),
('c0000000-0000-0000-0000-000000000005', NULL, 'Kesehatan & Medis', 'expense', '💊', '#0284c7', true),
('c0000000-0000-0000-0000-000000000006', NULL, 'Belanja Kebutuhan', 'expense', '👕', '#2563eb', true),
('c0000000-0000-0000-0000-000000000007', NULL, 'Pendidikan & Kursus', 'expense', '📚', '#1d4ed8', true),
('c0000000-0000-0000-0000-000000000008', NULL, 'Gaji Pokok', 'income', '💰', '#059669', true),
('c0000000-0000-0000-0000-000000000009', NULL, 'Pendapatan Freelance', 'income', '💼', '#10b981', true),
('c0000000-0000-0000-0000-000000000010', NULL, 'Investasi & Dividen', 'income', '📈', '#34d399', true)
ON CONFLICT (id) DO NOTHING;

-- 2. DEFAULT AI PROVIDER CONFIGURATIONS
INSERT INTO public.ai_provider_configs (id, provider_name, api_key_encrypted, is_active, priority_order, mode, model_name) VALUES
('a0000000-0000-0000-0000-000000000001', 'gemini', '', true, 1, 'failover', 'gemini-1.5-flash'),
('a0000000-0000-0000-0000-000000000002', 'openai', '', false, 2, 'failover', 'gpt-4o-mini'),
('a0000000-0000-0000-0000-000000000003', 'deepseek', '', false, 3, 'failover', 'deepseek-chat')
ON CONFLICT (provider_name) DO NOTHING;

-- 3. SEED SUPERADMIN USER
INSERT INTO public.profiles (
    id, email, phone_number, full_name, role, approval_status, plan
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'fadhlan2146@gmail.com',
    '081299990000',
    'Fadhlan (Super Admin)',
    'admin',
    'approved',
    'pro'
) ON CONFLICT (email) DO NOTHING;
