// ====================================================================
// TataDana Multi-Wallet Management & Transfer Routes
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireApprovedUser);

// 1. GET ALL WALLETS
router.get('/', (req, res) => {
  const wallets = db.table('wallets').find(w => w.user_id === req.user.id);
  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  res.json({
    success: true,
    wallets,
    totalBalance,
    defaultWalletId: req.user.default_wallet_id
  });
});

// 2. CREATE WALLET
router.post('/', (req, res) => {
  const { name, type, balance, color, icon, is_default } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Nama dompet wajib diisi.' });
  }

  // Quota check for Starter plan: max 3 wallets
  if (req.user.plan === 'starter') {
    const count = db.table('wallets').count(w => w.user_id === req.user.id);
    if (count >= 3) {
      return res.status(403).json({
        success: false,
        message: 'Paket Starter dibatasi maksimal 3 dompet. Upgrade ke Pro untuk dompet tak terbatas!'
      });
    }
  }

  const walletId = crypto.randomUUID();
  const shouldBeDefault = Boolean(is_default);

  if (shouldBeDefault) {
    // Unset other defaults
    const userWallets = db.table('wallets').find(w => w.user_id === req.user.id);
    userWallets.forEach(w => db.table('wallets').update(w.id, { is_default: false }));
    db.table('profiles').update(req.user.id, { default_wallet_id: walletId });
  }

  const newWallet = db.table('wallets').insert({
    id: walletId,
    user_id: req.user.id,
    name: name.trim(),
    type: type || 'bank',
    balance: Number(balance) || 0,
    is_default: shouldBeDefault,
    color: color || '#0284c7',
    icon: icon || 'wallet',
    created_at: new Date().toISOString()
  });

  res.status(201).json({ success: true, wallet: newWallet });
});

// 3. SET WALLET AS DEFAULT (For Telegram Bot)
router.put('/:id/default', (req, res) => {
  const wallet = db.table('wallets').findById(req.params.id);
  if (!wallet || wallet.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Dompet tidak ditemukan.' });
  }

  // Reset all
  const userWallets = db.table('wallets').find(w => w.user_id === req.user.id);
  userWallets.forEach(w => db.table('wallets').update(w.id, { is_default: false }));

  db.table('wallets').update(wallet.id, { is_default: true });
  db.table('profiles').update(req.user.id, { default_wallet_id: wallet.id });

  res.json({ success: true, message: `${wallet.name} dijadikan dompet default untuk Telegram.` });
});

// 4. TRANSFER FUNDS BETWEEN WALLETS
router.post('/transfer', (req, res) => {
  const { from_wallet_id, to_wallet_id, amount, notes } = req.body;
  const numAmount = Number(amount);

  if (!from_wallet_id || !to_wallet_id || !numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Pilih dompet asal, tujuan, dan nominal transfer yang valid.' });
  }

  if (from_wallet_id === to_wallet_id) {
    return res.status(400).json({ success: false, message: 'Dompet asal dan tujuan tidak boleh sama.' });
  }

  const fromWallet = db.table('wallets').findById(from_wallet_id);
  const toWallet = db.table('wallets').findById(to_wallet_id);

  if (!fromWallet || fromWallet.user_id !== req.user.id || !toWallet || toWallet.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Salah satu dompet tidak valid.' });
  }

  if (Number(fromWallet.balance) < numAmount) {
    return res.status(400).json({
      success: false,
      message: `Saldo ${fromWallet.name} tidak mencukupi (Tersedia: Rp${Number(fromWallet.balance).toLocaleString('id-ID')}).`
    });
  }

  // Deduct from source and add to destination
  db.table('wallets').update(fromWallet.id, { balance: Number(fromWallet.balance) - numAmount });
  db.table('wallets').update(toWallet.id, { balance: Number(toWallet.balance) + numAmount });

  // Record transfer transaction
  const transferTx = db.table('transactions').insert({
    user_id: req.user.id,
    wallet_id: fromWallet.id,
    to_wallet_id: toWallet.id,
    type: 'transfer',
    amount: numAmount,
    date: new Date().toISOString(),
    notes: notes || `Transfer dari ${fromWallet.name} ke ${toWallet.name}`,
    source: 'web_app'
  });

  const userWallets = db.table('wallets').find(w => w.user_id === req.user.id);
  const totalBalance = userWallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  res.json({
    success: true,
    message: `Transfer Rp${numAmount.toLocaleString('id-ID')} dari ${fromWallet.name} ke ${toWallet.name} berhasil!`,
    transaction: transferTx,
    wallets: userWallets,
    totalBalance
  });
});

// 5. UPDATE WALLET
router.put('/:id', (req, res) => {
  const wallet = db.table('wallets').findById(req.params.id);
  if (!wallet || wallet.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Dompet tidak ditemukan.' });
  }

  const { name, color, icon, balance } = req.body;
  const updated = db.table('wallets').update(wallet.id, {
    ...(name && { name: name.trim() }),
    ...(color && { color }),
    ...(icon && { icon }),
    ...(balance !== undefined && { balance: Number(balance) })
  });

  res.json({ success: true, wallet: updated });
});

// 6. DELETE WALLET
router.delete('/:id', (req, res) => {
  const wallet = db.table('wallets').findById(req.params.id);
  if (!wallet || wallet.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Dompet tidak ditemukan.' });
  }

  const remaining = db.table('wallets').count(w => w.user_id === req.user.id);
  if (remaining <= 1) {
    return res.status(400).json({ success: false, message: 'Anda harus memiliki minimal 1 dompet aktif.' });
  }

  db.table('wallets').delete(wallet.id);
  res.json({ success: true, message: 'Dompet berhasil dihapus.' });
});

module.exports = router;
