// ====================================================================
// TataDana Telegram Bot Webhook & Integration Routes
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser } = require('../middleware/auth');
const TelegramService = require('../services/telegramService');

// 1. PUBLIC WEBHOOK RECEIVER (POST /api/telegram/webhook)
// Telegram sends updates here. Must be fast and idempotent!
router.post('/webhook', async (req, res) => {
  // Always respond 200 OK immediately so Telegram doesn't retry aggressively
  res.status(200).send('OK');

  try {
    const update = req.body;
    if (!update || !update.update_id) return;

    // Use default bot token or global token from env
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Process update asynchronously
    await TelegramService.handleWebhookUpdate(update, botToken);
  } catch (err) {
    console.error('[Telegram Webhook Error]:', err.message);
  }
});

// 2. TEST BOT CONNECTION & SET WEBHOOK (User Settings)
router.post('/test-connection', authenticateToken, requireApprovedUser, async (req, res) => {
  const { token } = req.body;

  if (!token || token.trim().length < 20) {
    return res.status(400).json({
      success: false,
      status: 'disconnected',
      message: 'Token Bot Telegram tidak valid atau format salah.'
    });
  }

  const cleanToken = token.trim();

  // Check token uniqueness across other users
  const existingOther = db.table('telegram_bot_configs').findOne(tb => {
    return tb.bot_token_encrypted === cleanToken && tb.user_id !== req.user.id;
  });

  if (existingOther) {
    return res.status(409).json({
      success: false,
      status: 'disconnected',
      message: 'Token bot ini telah digunakan oleh akun lain. Buat bot baru di @BotFather.'
    });
  }

  // 1. Call GET getMe on Telegram API
  const testRes = await TelegramService.testBotToken(cleanToken);
  if (!testRes.success) {
    return res.status(400).json({
      success: false,
      status: 'disconnected',
      message: `Gagal terhubung ke Telegram: ${testRes.error}`
    });
  }

  const botInfo = testRes.bot;
  const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  // 2. Call POST setWebhook on Telegram API
  let webhookRes = { success: true };
  if (!webhookBaseUrl.includes('localhost')) {
    webhookRes = await TelegramService.setWebhook(cleanToken, webhookBaseUrl);
  }

  // 3. Save config to DB
  const existingConfig = db.table('telegram_bot_configs').findOne(tb => tb.user_id === req.user.id);
  if (existingConfig) {
    db.table('telegram_bot_configs').update(existingConfig.id, {
      bot_token_encrypted: cleanToken,
      bot_username: botInfo.username,
      is_active: true,
      webhook_set: webhookRes.success,
      webhook_url: `${webhookBaseUrl}/api/telegram/webhook`,
      last_tested_at: new Date().toISOString()
    });
  } else {
    db.table('telegram_bot_configs').insert({
      id: crypto.randomUUID(),
      user_id: req.user.id,
      bot_token_encrypted: cleanToken,
      bot_username: botInfo.username,
      is_active: true,
      webhook_set: webhookRes.success,
      webhook_url: `${webhookBaseUrl}/api/telegram/webhook`,
      last_tested_at: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    status: 'connected',
    message: `🟢 Berhasil terhubung ke @${botInfo.username}! Webhook aktif.`,
    bot: {
      id: botInfo.id,
      first_name: botInfo.first_name,
      username: botInfo.username
    }
  });
});

// 3. GET CURRENT USER BOT STATUS
router.get('/status', authenticateToken, (req, res) => {
  const config = db.table('telegram_bot_configs').findOne(tb => tb.user_id === req.user.id);
  if (!config || !config.is_active) {
    return res.json({
      success: true,
      status: 'disconnected',
      is_connected: false,
      bot_username: null
    });
  }

  res.json({
    success: true,
    status: 'connected',
    is_connected: true,
    bot_username: config.bot_username,
    webhook_set: config.webhook_set,
    last_tested_at: config.last_tested_at
  });
});

// 4. DISCONNECT BOT
router.post('/disconnect', authenticateToken, (req, res) => {
  const config = db.table('telegram_bot_configs').findOne(tb => tb.user_id === req.user.id);
  if (config) {
    db.table('telegram_bot_configs').update(config.id, { is_active: false });
  }
  res.json({ success: true, message: 'Bot Telegram berhasil diputuskan.' });
});

module.exports = router;
