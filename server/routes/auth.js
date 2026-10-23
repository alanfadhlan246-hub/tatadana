// ====================================================================
// TataDana Authentication Routes
// ====================================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../config/db');
const { JWT_SECRET, authenticateToken, requireAdmin } = require('../middleware/auth');

// Helper to normalize Indonesian phone number
function normalizePhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) clean = '0' + clean.slice(2);
  return clean;
}

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone_number } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi Email, Kata Sandi, dan Nama Lengkap.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = normalizePhone(phone_number);

    // Check duplicate email
    const existingEmail = db.table('profiles').findOne(p => p.email === cleanEmail);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan login atau gunakan email lain.'
      });
    }

    // Check duplicate phone
    if (cleanPhone) {
      const existingPhone = db.table('profiles').findOne(p => p.phone_number === cleanPhone);
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Nomor HP sudah terdaftar pada akun lain.'
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userId = crypto.randomUUID();
    const defaultWalletId = crypto.randomUUID();

    // Create user profile with pending_approval as requested
    const newProfile = db.table('profiles').insert({
      id: userId,
      email: cleanEmail,
      phone_number: cleanPhone || null,
      password_hash,
      full_name: full_name.trim(),
      role: 'user',
      approval_status: 'pending_approval', // User needs admin approval
      plan: 'starter',
      currency: 'IDR',
      default_wallet_id: defaultWalletId,
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_time_1: '09:00:00',
      reminder_time_2: '20:00:00',
      created_at: new Date().toISOString()
    });

    // Create default wallet (BCA)
    db.table('wallets').insert({
      id: defaultWalletId,
      user_id: userId,
      name: 'BCA Utama',
      type: 'bank',
      balance: 0,
      is_default: true,
      color: '#0284c7',
      icon: 'bank',
      created_at: new Date().toISOString()
    });

    // Seed initial personal categories
    const initialCategories = [
      { name: 'Makanan & Minuman', emoji: '🍜', type: 'expense', color: '#0284c7' },
      { name: 'Transportasi', emoji: '🚗', type: 'expense', color: '#0369a1' },
      { name: 'Hiburan', emoji: '🎮', type: 'expense', color: '#38bdf8' },
      { name: 'Tagihan', emoji: '🏠', type: 'expense', color: '#0ea5e9' },
      { name: 'Kesehatan', emoji: '💊', type: 'expense', color: '#0284c7' },
      { name: 'Belanja', emoji: '👕', type: 'expense', color: '#2563eb' },
      { name: 'Pendidikan', emoji: '📚', type: 'expense', color: '#1d4ed8' },
      { name: 'Gaji', emoji: '💰', type: 'income', color: '#059669' }
    ];

    initialCategories.forEach(cat => {
      db.table('categories').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        name: cat.name,
        emoji: cat.emoji,
        type: cat.type,
        color: cat.color,
        is_system: false,
        created_at: new Date().toISOString()
      });
    });

    const token = jwt.sign({ userId, email: cleanEmail, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    // Ensure immediate sync to cloud database
    try {
      await db.saveToCloud();
    } catch (e) {
      console.warn('[Register] Cloud save error:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil. Akun Anda sedang menunggu persetujuan admin.',
      token,
      user: {
        id: userId,
        email: cleanEmail,
        full_name: newProfile.full_name,
        phone_number: cleanPhone,
        role: 'user',
        approval_status: 'pending_approval',
        plan: 'starter'
      }
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mendaftar.' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Masukkan Email / Nomor HP dan Kata Sandi.'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPhone = normalizePhone(identifier);

    const user = db.table('profiles').findOne(p => {
      return p.email.toLowerCase() === cleanIdentifier || (cleanPhone && p.phone_number === cleanPhone);
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi email/nomor HP atau kata sandi tidak cocok.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kombinasi email/nomor HP atau kata sandi tidak cocok.'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        approval_status: user.approval_status,
        plan: user.plan,
        currency: user.currency || 'IDR',
        default_wallet_id: user.default_wallet_id
      }
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
  }
});

// 3. GET CURRENT USER PROFILE
router.get('/me', authenticateToken, (req, res) => {
  const user = req.user;
  const wallets = db.table('wallets').find(w => w.user_id === user.id);
  const telegramConfig = db.table('telegram_bot_configs').findOne(tb => tb.user_id === user.id);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      role: user.role,
      approval_status: user.approval_status,
      plan: user.plan,
      currency: user.currency || 'IDR',
      default_wallet_id: user.default_wallet_id,
      reminder_enabled: user.reminder_enabled,
      reminder_frequency: user.reminder_frequency,
      reminder_time_1: user.reminder_time_1,
      reminder_time_2: user.reminder_time_2,
      created_at: user.created_at,
      walletsCount: wallets.length,
      isTelegramConnected: Boolean(telegramConfig && telegramConfig.is_active)
    }
  });
});

// 4. VERIFY PHONE NUMBER WITH OTP (Simulated / Live OTP)
router.post('/verify-phone-otp', authenticateToken, (req, res) => {
  const { phone_number, otp_code } = req.body;
  if (!phone_number) {
    return res.status(400).json({ success: false, message: 'Nomor HP wajib diisi.' });
  }

  const cleanPhone = normalizePhone(phone_number);
  // Default accepted OTP for verification test is '123456'
  if (otp_code && otp_code !== '123456') {
    return res.status(400).json({ success: false, message: 'Kode OTP tidak sesuai (gunakan 123456 untuk simulasi).' });
  }

  db.table('profiles').update(req.user.id, {
    phone_number: cleanPhone,
    phone_verified_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Nomor HP berhasil diverifikasi dan terhubung ke profil TataDana Anda.',
    phone_number: cleanPhone
  });
});

// 5. ADMIN IMPERSONATE USER
router.post('/impersonate', authenticateToken, requireAdmin, (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, message: 'Target user ID wajib disertakan.' });
  }

  const targetUser = db.table('profiles').findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User yang ingin di-impersonate tidak ditemukan.' });
  }

  // Audit log for impersonation
  db.table('admin_audit_logs').insert({
    admin_id: req.user.id,
    action: 'impersonate_user',
    target_user_id: targetUserId,
    details: { targetEmail: targetUser.email, targetName: targetUser.full_name },
    created_at: new Date().toISOString()
  });

  const impersonationToken = jwt.sign(
    { userId: targetUser.id, email: targetUser.email, role: targetUser.role, isImpersonated: true, adminId: req.user.id },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    success: true,
    message: `Mode impersonasi aktif sebagai ${targetUser.full_name}`,
    token: impersonationToken,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      full_name: targetUser.full_name,
      role: targetUser.role,
      approval_status: targetUser.approval_status,
      plan: targetUser.plan,
      isImpersonated: true
    }
  });
});

module.exports = router;
