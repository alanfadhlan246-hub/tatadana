// ====================================================================
// TataDana Budgeting Management (Daily, Weekly, Monthly)
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireApprovedUser);

// Helper to get start of period
function getStartOfPeriod(periodType) {
  const now = new Date();
  if (periodType === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (periodType === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(now.setDate(diff)).toISOString();
  }
  // monthly default
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// 1. GET ALL BUDGETS WITH REAL-TIME SPENDING & PERCENTAGE
router.get('/', (req, res) => {
  const budgets = db.table('budgets').find(b => b.user_id === req.user.id);
  const categories = db.table('categories').find(c => c.user_id === req.user.id || c.is_system);

  const enriched = budgets.map(b => {
    const cat = categories.find(c => c.id === b.category_id) || { name: 'Kategori', emoji: '🏷️', color: '#0284c7' };
    const periodStart = getStartOfPeriod(b.period_type);

    const spent = db.table('transactions')
      .find(t => t.user_id === req.user.id && t.category_id === b.category_id && t.type === 'expense' && t.date >= periodStart)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const percentage = b.amount > 0 ? Math.round((spent / Number(b.amount)) * 100) : 0;
    const remaining = Math.max(0, Number(b.amount) - spent);

    return {
      ...b,
      category_name: cat.name,
      category_emoji: cat.emoji,
      category_color: cat.color,
      spent,
      remaining,
      percentage,
      is_warning: percentage >= 80 && percentage < 100,
      is_overbudget: percentage >= 100
    };
  });

  res.json({ success: true, budgets: enriched });
});

// 2. CREATE / UPDATE BUDGET
router.post('/', (req, res) => {
  const { category_id, period_type, amount } = req.body;
  const numAmount = Number(amount);

  if (!category_id || !numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Kategori dan nominal budget harus valid.' });
  }

  const validPeriod = ['daily', 'weekly', 'monthly'].includes(period_type) ? period_type : 'monthly';

  // Starter limit: max 5 budget categories
  if (req.user.plan === 'starter') {
    const count = db.table('budgets').count(b => b.user_id === req.user.id);
    if (count >= 5) {
      return res.status(403).json({
        success: false,
        message: 'Paket Starter dibatasi maksimal 5 budget kategori. Upgrade ke Pro untuk budget tanpa batas!'
      });
    }
  }

  // Check if budget already exists for this category & period
  const existing = db.table('budgets').findOne(b => {
    return b.user_id === req.user.id && b.category_id === category_id && b.period_type === validPeriod;
  });

  if (existing) {
    const updated = db.table('budgets').update(existing.id, {
      amount: numAmount,
      alert_80_sent: false,
      alert_100_sent: false
    });
    return res.json({ success: true, message: 'Budget berhasil diperbarui.', budget: updated });
  }

  const newBudget = db.table('budgets').insert({
    id: crypto.randomUUID(),
    user_id: req.user.id,
    category_id,
    period_type: validPeriod,
    amount: numAmount,
    alert_80_sent: false,
    alert_100_sent: false,
    created_at: new Date().toISOString()
  });

  res.status(201).json({ success: true, message: 'Budget berhasil dibuat.', budget: newBudget });
});

// 3. DELETE BUDGET
router.delete('/:id', (req, res) => {
  const budget = db.table('budgets').findById(req.params.id);
  if (!budget || budget.user_id !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Budget tidak ditemukan.' });
  }

  db.table('budgets').delete(budget.id);
  res.json({ success: true, message: 'Budget berhasil dihapus.' });
});

module.exports = router;
