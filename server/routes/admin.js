// ====================================================================
// TataDana Super Admin Controller Routes
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

// 1. GET ALL USERS (With Approval Status & Stats)
router.get('/users', (req, res) => {
  const users = db.table('profiles').find();
  const wallets = db.table('wallets').find();
  const transactions = db.table('transactions').find();
  const telegramConfigs = db.table('telegram_bot_configs').find();

  const enriched = users.map(u => {
    const userWallets = wallets.filter(w => w.user_id === u.id);
    const userTxs = transactions.filter(t => t.user_id === u.id);
    const tg = telegramConfigs.find(t => t.user_id === u.id && t.is_active);

    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      phone_number: u.phone_number,
      role: u.role,
      approval_status: u.approval_status || 'approved',
      approval_notes: u.approval_notes,
      plan: u.plan || 'starter',
      walletsCount: userWallets.length,
      transactionsCount: userTxs.length,
      isTelegramConnected: Boolean(tg),
      telegramUsername: tg ? tg.bot_username : null,
      created_at: u.created_at
    };
  });

  res.json({
    success: true,
    totalUsers: users.length,
    pendingApprovalCount: enriched.filter(u => u.approval_status === 'pending_approval').length,
    users: enriched
  });
});

// 2. APPROVE USER APPLICANT
router.put('/users/:id/approve', async (req, res) => {
  const user = db.table('profiles').findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  const updated = db.table('profiles').update(user.id, {
    approval_status: 'approved',
    approved_by: req.user.id,
    approved_at: new Date().toISOString(),
    approval_notes: req.body.notes || 'Disetujui oleh Super Admin'
  });

  // Log admin action
  db.table('admin_audit_logs').insert({
    admin_id: req.user.id,
    action: 'approve_user',
    target_user_id: user.id,
    details: { email: user.email, name: user.full_name },
    created_at: new Date().toISOString()
  });

  // Ensure immediate sync to cloud database
  try {
    await db.saveToCloud();
  } catch (e) {
    console.warn('[Admin Approve] Cloud save error:', e.message);
  }

  res.json({
    success: true,
    message: `Pendaftar ${user.full_name} (${user.email}) telah disetujui!`,
    user: updated
  });
});

// 3. REJECT USER APPLICANT
router.put('/users/:id/reject', async (req, res) => {
  const user = db.table('profiles').findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  const updated = db.table('profiles').update(user.id, {
    approval_status: 'rejected',
    approved_by: req.user.id,
    approved_at: new Date().toISOString(),
    approval_notes: req.body.notes || 'Ditolak oleh admin'
  });

  db.table('admin_audit_logs').insert({
    admin_id: req.user.id,
    action: 'reject_user',
    target_user_id: user.id,
    details: { email: user.email, notes: req.body.notes },
    created_at: new Date().toISOString()
  });

  // Ensure immediate sync to cloud database
  try {
    await db.saveToCloud();
  } catch (e) {
    console.warn('[Admin Reject] Cloud save error:', e.message);
  }

  res.json({
    success: true,
    message: `Pendaftar ${user.full_name} telah ditolak.`,
    user: updated
  });
});

// 4. GET AI PROVIDERS CONFIGURATION
router.get('/ai-providers', (req, res) => {
  const providers = db.table('ai_provider_configs').find();
  const masked = providers.map(p => ({
    ...p,
    has_api_key: Boolean(p.api_key_encrypted || process.env[`${p.provider_name.toUpperCase()}_API_KEY`]),
    api_key_masked: (p.api_key_encrypted || process.env[`${p.provider_name.toUpperCase()}_API_KEY`])
      ? '••••••••' + (p.api_key_encrypted || '').slice(-4)
      : 'Belum diisi'
  }));

  res.json({ success: true, providers: masked });
});

// 5. UPDATE AI PROVIDER CONFIGURATION
router.post('/ai-providers', (req, res) => {
  const { provider_name, api_key, is_active, mode, model_name, priority_order } = req.body;
  if (!provider_name) {
    return res.status(400).json({ success: false, message: 'Nama provider AI wajib disertakan.' });
  }

  let existing = db.table('ai_provider_configs').findOne(p => p.provider_name === provider_name);
  if (existing) {
    const updates = {
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
      ...(mode && { mode }),
      ...(model_name && { model_name }),
      ...(priority_order !== undefined && { priority_order: Number(priority_order) }),
      ...(api_key && { api_key_encrypted: api_key.trim() })
    };
    db.table('ai_provider_configs').update(existing.id, updates);
  } else {
    db.table('ai_provider_configs').insert({
      id: crypto.randomUUID(),
      provider_name,
      api_key_encrypted: (api_key || '').trim(),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      mode: mode || 'failover',
      model_name: model_name || 'gemini-1.5-flash',
      priority_order: Number(priority_order) || 1,
      created_at: new Date().toISOString()
    });
  }

  db.table('admin_audit_logs').insert({
    admin_id: req.user.id,
    action: 'update_ai_provider',
    details: { provider_name, is_active, mode, model_name },
    created_at: new Date().toISOString()
  });

  res.json({ success: true, message: `Konfigurasi AI ${provider_name} berhasil disimpan!` });
});

// 6. GET AI AUDIT LOGS
router.get('/ai-logs', (req, res) => {
  const logs = db.table('ai_audit_logs').find();
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ success: true, logs: logs.slice(0, 50) });
});

// 7. INSPECT USER TRANSACTIONS (With Mandatory Privacy Audit Log)
router.get('/users/:id/transactions', (req, res) => {
  const targetUser = db.table('profiles').findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
  }

  // Mandatory Privacy Audit Log
  db.table('admin_audit_logs').insert({
    admin_id: req.user.id,
    action: 'inspect_user_transactions',
    target_user_id: targetUser.id,
    details: { email: targetUser.email, reason: req.query.reason || 'Customer Support Troubleshooting' },
    created_at: new Date().toISOString()
  });

  const txs = db.table('transactions').find(t => t.user_id === targetUser.id);
  const items = db.table('transaction_items').find(ti => ti.user_id === targetUser.id);

  res.json({
    success: true,
    user: { id: targetUser.id, full_name: targetUser.full_name, email: targetUser.email },
    transactions: txs,
    items
  });
});

// 8. GET PAYMENT ORDERS & APPROVE/REJECT
router.get('/payments', (req, res) => {
  const payments = db.table('payment_orders').find();
  const users = db.table('profiles').find();

  const enriched = payments.map(p => {
    const u = users.find(user => user.id === p.user_id);
    return {
      ...p,
      user_name: u ? u.full_name : 'User',
      user_email: u ? u.email : '-'
    };
  });

  res.json({ success: true, payments: enriched });
});

// 9. APPROVE PAYMENT (Upgrades User to Pro Plan)
router.put('/payments/:id/approve', (req, res) => {
  const payment = db.table('payment_orders').findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Data pembayaran tidak ditemukan.' });
  }

  db.table('payment_orders').update(payment.id, {
    status: 'settled',
    approved_by: req.user.id,
    updated_at: new Date().toISOString()
  });

  // Upgrade user plan to Pro
  db.table('profiles').update(payment.user_id, {
    plan: 'pro',
    plan_expires_at: null // Lifetime Pro as per Part 6
  });

  res.json({
    success: true,
    message: `Pembayaran ${payment.order_id} disetujui. Akun user telah di-upgrade ke TataDana Pro! 🎉`
  });
});

// 10. REJECT PAYMENT
router.put('/payments/:id/reject', (req, res) => {
  const payment = db.table('payment_orders').findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Data pembayaran tidak ditemukan.' });
  }

  db.table('payment_orders').update(payment.id, {
    status: 'rejected',
    approved_by: req.user.id,
    admin_notes: req.body.notes || 'Bukti transfer tidak valid',
    updated_at: new Date().toISOString()
  });

  res.json({ success: true, message: `Pembayaran ${payment.order_id} ditolak.` });
});

// 11. EXPORT ALL USERS CONSOLIDATED DATA
router.get('/export-all', (req, res) => {
  const data = {
    exported_at: new Date().toISOString(),
    profiles: db.table('profiles').find().map(p => ({ ...p, password_hash: undefined })),
    wallets: db.table('wallets').find(),
    categories: db.table('categories').find(),
    transactionsCount: db.table('transactions').count(),
    aiProviders: db.table('ai_provider_configs').find().map(a => ({ ...a, api_key_encrypted: undefined }))
  };

  res.json({ success: true, data });
});

module.exports = router;
