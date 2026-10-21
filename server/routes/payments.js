// ====================================================================
// TataDana Payment Engine (Midtrans & Manual Transfer)
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// 1. CREATE PAYMENT ORDER
router.post('/create-order', authenticateToken, (req, res) => {
  const { plan = 'pro', payment_method = 'midtrans' } = req.body;

  const amount = plan === 'pro' ? 99000 : 49000;
  const orderId = `TATADANA-${plan.toUpperCase()}-${Date.now()}`;

  const order = db.table('payment_orders').insert({
    id: crypto.randomUUID(),
    user_id: req.user.id,
    order_id: orderId,
    amount,
    plan,
    payment_method,
    status: 'pending',
    created_at: new Date().toISOString()
  });

  // Provide mock snap token if midtrans keys not yet set in production
  const snapToken = `SNAP-MOCK-${orderId}`;

  res.json({
    success: true,
    orderId,
    amount,
    plan,
    paymentMethod: payment_method,
    snapToken,
    manualBankInfo: {
      bankName: 'BCA (Bank Central Asia)',
      accountNumber: '8830 1928 4710',
      accountHolder: 'PT TATADANA KEUANGAN NUSANTARA'
    }
  });
});

// 2. SUBMIT MANUAL TRANSFER PROOF
router.post('/manual-proof', authenticateToken, (req, res) => {
  const { order_id, proof_file_url, notes } = req.body;
  if (!order_id) {
    return res.status(400).json({ success: false, message: 'Nomor Order ID wajib disertakan.' });
  }

  const order = db.table('payment_orders').findOne(p => p.order_id === order_id);
  if (!order || order.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
  }

  db.table('payment_orders').update(order.id, {
    proof_file_url: proof_file_url || 'https://via.placeholder.com/400x600?text=Bukti+Transfer+BCA',
    admin_notes: notes || 'Menunggu verifikasi admin',
    status: 'pending'
  });

  res.json({
    success: true,
    message: 'Bukti transfer berhasil dikirim. Super Admin akan memverifikasi dalam kurun waktu 1x24 jam.'
  });
});

// 3. MIDTRANS NOTIFICATION WEBHOOK
router.post('/midtrans-webhook', (req, res) => {
  const { order_id, transaction_status, fraud_status } = req.body;
  if (!order_id) {
    return res.status(400).send('Missing order_id');
  }

  const order = db.table('payment_orders').findOne(p => p.order_id === order_id);
  if (order) {
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        db.table('payment_orders').update(order.id, { status: 'settled' });
        db.table('profiles').update(order.user_id, { plan: order.plan });
      }
    }
  }

  res.status(200).send('OK');
});

module.exports = router;
