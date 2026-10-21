// ====================================================================
// TataDana Transactions API Routes
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser, checkTransactionQuota } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireApprovedUser);

// 1. GET TRANSACTIONS (With Filtering, Pagination & Search)
router.get('/', (req, res) => {
  const { category_id, wallet_id, type, start_date, end_date, search, page = 1, limit = 20, sort = 'desc' } = req.query;

  const categories = db.table('categories').find();
  const wallets = db.table('wallets').find();

  let list = db.table('transactions').find(t => t.user_id === req.user.id);

  // Filter type
  if (type && type !== 'all') {
    list = list.filter(t => t.type === type);
  }

  // Filter category
  if (category_id && category_id !== 'all') {
    list = list.filter(t => t.category_id === category_id);
  }

  // Filter wallet
  if (wallet_id && wallet_id !== 'all') {
    list = list.filter(t => t.wallet_id === wallet_id || t.to_wallet_id === wallet_id);
  }

  // Filter date range
  if (start_date) {
    list = list.filter(t => t.date >= start_date);
  }
  if (end_date) {
    list = list.filter(t => t.date <= end_date + 'T23:59:59.999Z');
  }

  // Search by notes
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t => t.notes && t.notes.toLowerCase().includes(q));
  }

  // Sort
  list.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sort === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const total = list.length;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Attach category and wallet metadata + receipt items
  const enriched = paginated.map(tx => {
    const cat = categories.find(c => c.id === tx.category_id);
    const wal = wallets.find(w => w.id === tx.wallet_id);
    const toWal = tx.to_wallet_id ? wallets.find(w => w.id === tx.to_wallet_id) : null;
    const items = tx.receipt_items_count > 0 ? db.table('transaction_items').find(ti => ti.transaction_id === tx.id) : [];

    return {
      ...tx,
      category_name: cat ? cat.name : 'Lain-lain',
      category_emoji: cat ? cat.emoji : '🏷️',
      category_color: cat ? cat.color : '#0284c7',
      wallet_name: wal ? wal.name : 'Dompet Utama',
      to_wallet_name: toWal ? toWal.name : null,
      items
    };
  });

  res.json({
    success: true,
    data: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// 2. CREATE TRANSACTION (Manual Web App Input)
router.post('/', checkTransactionQuota, (req, res) => {
  const { wallet_id, category_id, type, amount, date, notes, items } = req.body;
  const numAmount = Number(amount);

  if (!wallet_id || !numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Pilih dompet dan nominal yang valid.' });
  }

  const wallet = db.table('wallets').findById(wallet_id);
  if (!wallet || wallet.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Dompet tidak ditemukan.' });
  }

  const txType = ['expense', 'income'].includes(type) ? type : 'expense';
  const txId = crypto.randomUUID();

  // Adjust wallet balance
  const currentBalance = Number(wallet.balance) || 0;
  const newBalance = txType === 'expense' ? (currentBalance - numAmount) : (currentBalance + numAmount);
  db.table('wallets').update(wallet.id, { balance: newBalance });

  const hasItems = Array.isArray(items) && items.length > 0;

  const newTx = db.table('transactions').insert({
    id: txId,
    user_id: req.user.id,
    wallet_id: wallet.id,
    category_id: category_id || null,
    type: txType,
    amount: numAmount,
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    notes: notes || (txType === 'expense' ? 'Pengeluaran Manual' : 'Pemasukan Manual'),
    source: 'web_app',
    receipt_items_count: hasItems ? items.length : 0
  });

  // Save receipt items if provided
  if (hasItems) {
    items.forEach(it => {
      db.table('transaction_items').insert({
        id: crypto.randomUUID(),
        transaction_id: txId,
        user_id: req.user.id,
        item_name: it.item_name || 'Item Belanja',
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        category_id: it.category_id || category_id || null
      });
    });
  }

  const userWallets = db.table('wallets').find(w => w.user_id === req.user.id);
  const totalBalance = userWallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  res.status(201).json({ 
    success: true, 
    transaction: newTx, 
    newBalance, 
    totalBalance, 
    wallets: userWallets 
  });
});

// 3. GET SINGLE TRANSACTION WITH ITEMS
router.get('/:id', (req, res) => {
  const tx = db.table('transactions').findById(req.params.id);
  if (!tx || tx.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
  }

  const cat = db.table('categories').findById(tx.category_id);
  const wal = db.table('wallets').findById(tx.wallet_id);
  const items = db.table('transaction_items').find(ti => ti.transaction_id === tx.id);

  res.json({
    success: true,
    transaction: {
      ...tx,
      category_name: cat ? cat.name : 'Lain-lain',
      category_emoji: cat ? cat.emoji : '🏷️',
      wallet_name: wal ? wal.name : 'Dompet',
      items
    }
  });
});

// 4. DELETE TRANSACTION
router.delete('/:id', (req, res) => {
  const tx = db.table('transactions').findById(req.params.id);
  if (!tx || tx.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
  }

  // Revert wallet balance
  const wallet = db.table('wallets').findById(tx.wallet_id);
  if (wallet) {
    const curBal = Number(wallet.balance) || 0;
    const reverted = tx.type === 'expense' ? curBal + Number(tx.amount) : curBal - Number(tx.amount);
    db.table('wallets').update(wallet.id, { balance: reverted });
  }

  // Remove transaction & items
  db.table('transaction_items').deleteWhere(ti => ti.transaction_id === tx.id);
  db.table('transactions').delete(tx.id);

  res.json({ success: true, message: 'Transaksi berhasil dihapus dan saldo dompet telah disesuaikan.' });
});

module.exports = router;
