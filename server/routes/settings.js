// ====================================================================
// TataDana User Settings & Preferences Routes
// ====================================================================
const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireApprovedUser);

// 1. GET SETTINGS
router.get('/', (req, res) => {
  const user = db.table('profiles').findById(req.user.id);
  const telegramConfig = db.table('telegram_bot_configs').findOne(tb => tb.user_id === user.id);

  res.json({
    success: true,
    profile: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      currency: user.currency || 'IDR',
      default_wallet_id: user.default_wallet_id,
      reminder_enabled: user.reminder_enabled !== false,
      reminder_frequency: user.reminder_frequency || 1,
      reminder_time_1: user.reminder_time_1 || '09:00:00',
      reminder_time_2: user.reminder_time_2 || '20:00:00'
    },
    telegram: {
      isConnected: Boolean(telegramConfig && telegramConfig.is_active),
      botUsername: telegramConfig ? telegramConfig.bot_username : null,
      lastTested: telegramConfig ? telegramConfig.last_tested_at : null
    }
  });
});

// 2. UPDATE PROFILE
router.put('/profile', (req, res) => {
  const { full_name, currency, avatar_url } = req.body;

  const updated = db.table('profiles').update(req.user.id, {
    ...(full_name && { full_name: full_name.trim() }),
    ...(currency && { currency }),
    ...(avatar_url && { avatar_url })
  });

  res.json({ success: true, message: 'Profil berhasil diperbarui.', profile: updated });
});

// 3. UPDATE REMINDERS (Frequency max 2x daily as per Part 3)
router.put('/reminders', (req, res) => {
  const { reminder_enabled, reminder_frequency, reminder_time_1, reminder_time_2 } = req.body;

  const freq = Math.min(2, Math.max(1, Number(reminder_frequency) || 1));

  const updated = db.table('profiles').update(req.user.id, {
    reminder_enabled: Boolean(reminder_enabled),
    reminder_frequency: freq,
    ...(reminder_time_1 && { reminder_time_1 }),
    ...(reminder_time_2 && { reminder_time_2 })
  });

  res.json({ success: true, message: 'Preferensi reminder berhasil disimpan.', settings: updated });
});

// 4. GET REMINDER PREVIEW (Format Part 4.8)
router.get('/reminder-preview', (req, res) => {
  const preview = `⏰ <b>Reminder Keuangan!</b>\nJangan lupa catat pengeluaran hari ini ya 📝\nPencatatan rutin = keuangan lebih terkontrol 💪\n\n👉 <i>Ketik transaksimu sekarang langsung di chat ini!</i>`;
  res.json({ success: true, preview });
});

module.exports = router;
