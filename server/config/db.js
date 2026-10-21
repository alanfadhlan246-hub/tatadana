// ====================================================================
// TataDana Dual-Ready Database Layer (Supabase Cloud + Localhost Store)
// ====================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BUNDLED_DB_FILE = path.join(__dirname, '..', 'data', 'local_db.json');
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// On Vercel serverless environment, copy seed/bundled DB to writable /tmp
if (process.env.VERCEL && !fs.existsSync(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)) {
  try {
    fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
  } catch (e) {
    console.warn('[DB] Could not copy initial db to /tmp:', e.message);
  }
}

// Initial seed template for Localhost fallback
function getInitialSeed() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('Fadhlan2146', salt);

  const adminId = 'a1111111-1111-1111-1111-111111111111';

  const defaultCategories = [
    { id: 'c0000000-0000-0000-0000-000000000001', user_id: null, name: 'Makanan & Minuman', type: 'expense', emoji: '🍜', color: '#0284c7', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000002', user_id: null, name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#0369a1', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000003', user_id: null, name: 'Hiburan & Liburan', type: 'expense', emoji: '🎮', color: '#38bdf8', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000004', user_id: null, name: 'Tagihan & Utilitas', type: 'expense', emoji: '🏠', color: '#0ea5e9', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000005', user_id: null, name: 'Kesehatan & Medis', type: 'expense', emoji: '💊', color: '#0284c7', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000006', user_id: null, name: 'Belanja Kebutuhan', type: 'expense', emoji: '👕', color: '#2563eb', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000007', user_id: null, name: 'Pendidikan & Kursus', type: 'expense', emoji: '📚', color: '#1d4ed8', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000008', user_id: null, name: 'Gaji Pokok', type: 'income', emoji: '💰', color: '#059669', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000009', user_id: null, name: 'Pendapatan Freelance', type: 'income', emoji: '💼', color: '#10b981', is_system: true },
    { id: 'c0000000-0000-0000-0000-000000000010', user_id: null, name: 'Investasi & Dividen', type: 'income', emoji: '📈', color: '#34d399', is_system: true }
  ];

  return {
    profiles: [
      {
        id: adminId,
        email: 'fadhlan2146@gmail.com',
        password_hash: adminPasswordHash,
        phone_number: '081299990000',
        full_name: 'Fadhlan (Super Admin)',
        role: 'admin',
        approval_status: 'approved',
        plan: 'pro',
        currency: 'IDR',
        reminder_enabled: true,
        reminder_frequency: 1,
        reminder_time_1: '09:00:00',
        reminder_time_2: '20:00:00',
        created_at: new Date().toISOString()
      }
    ],
    wallets: [],
    categories: defaultCategories,
    budgets: [],
    transactions: [],
    transaction_items: [],
    telegram_bot_configs: [],
    telegram_updates: [],
    ai_provider_configs: [
      { id: 'a1', provider_name: 'gemini', api_key_encrypted: '', is_active: true, priority_order: 1, mode: 'failover', model_name: 'gemini-1.5-flash' },
      { id: 'a2', provider_name: 'openai', api_key_encrypted: '', is_active: false, priority_order: 2, mode: 'failover', model_name: 'gpt-4o-mini' },
      { id: 'a3', provider_name: 'deepseek', api_key_encrypted: '', is_active: false, priority_order: 3, mode: 'failover', model_name: 'deepseek-chat' }
    ],
    ai_audit_logs: [],
    export_histories: [],
    payment_orders: [],
    admin_audit_logs: []
  };
}

class LocalDatabase {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialSeed();
        this.save();
      }
    } catch (e) {
      console.warn('[DB] Failed to load local_db.json, recreating initial seed:', e.message);
      this.data = getInitialSeed();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[DB] Failed to save local_db.json:', e.message);
    }
  }

  table(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    const collection = this.data[name];
    const self = this;

    return {
      find(filterFn) {
        if (!filterFn) return [...collection];
        return collection.filter(filterFn);
      },
      findOne(filterFn) {
        return collection.find(filterFn) || null;
      },
      findById(id) {
        return collection.find(item => item.id === id) || null;
      },
      insert(record) {
        if (!record.id) {
          record.id = crypto.randomUUID();
        }
        if (!record.created_at) {
          record.created_at = new Date().toISOString();
        }
        collection.push(record);
        self.save();
        return record;
      },
      update(id, updates) {
        const idx = collection.findIndex(item => item.id === id);
        if (idx === -1) return null;
        collection[idx] = { ...collection[idx], ...updates, updated_at: new Date().toISOString() };
        self.save();
        return collection[idx];
      },
      delete(id) {
        const idx = collection.findIndex(item => item.id === id);
        if (idx === -1) return false;
        collection.splice(idx, 1);
        self.save();
        return true;
      },
      deleteWhere(filterFn) {
        const initialLen = collection.length;
        self.data[name] = collection.filter(item => !filterFn(item));
        self.save();
        return initialLen - self.data[name].length;
      },
      count(filterFn) {
        if (!filterFn) return collection.length;
        return collection.filter(filterFn).length;
      }
    };
  }
}

const db = new LocalDatabase();

module.exports = {
  db,
  isSupabaseConfigured: () => {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
};
