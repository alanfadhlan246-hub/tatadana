// ====================================================================
// TataDana Reports & Analytics Engine with PDF/Excel Export
// ====================================================================
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser, requireProPlan } = require('../middleware/auth');
const ReportGenerator = require('../services/reportGenerator');

router.use(authenticateToken);
router.use(requireApprovedUser);

// 1. GET ANALYTICS SUMMARY
router.get('/summary', (req, res) => {
  const { period = 'monthly', start_date, end_date } = req.query;

  const now = new Date();
  let filterStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  let filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  let periodLabel = 'Bulan Ini';

  if (period === 'daily') {
    filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    periodLabel = 'Hari Ini';
  } else if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    filterStart = startOfWeek.toISOString();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    filterEnd = endOfWeek.toISOString();
    periodLabel = '7 Hari Terakhir';
  } else if (period === 'yearly') {
    filterStart = new Date(now.getFullYear(), 0, 1).toISOString();
    filterEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
    periodLabel = `Tahun ${now.getFullYear()}`;
  } else if (period === 'custom' && start_date && end_date) {
    filterStart = start_date;
    filterEnd = end_date + 'T23:59:59.999Z';
    periodLabel = `${start_date} s/d ${end_date}`;
  }

  const transactions = db.table('transactions').find(t => {
    return t.user_id === req.user.id && t.date >= filterStart && t.date <= filterEnd;
  });

  const categories = db.table('categories').find();

  // Metrics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const netCashflow = totalIncome - totalExpense;

  // Category breakdown for Pie Chart & Top 5
  const catMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = categories.find(c => c.id === t.category_id) || { name: 'Lain-lain', emoji: '🏷️', color: '#0284c7' };
    if (!catMap[cat.name]) {
      catMap[cat.name] = { name: cat.name, emoji: cat.emoji, color: cat.color, amount: 0 };
    }
    catMap[cat.name].amount += Number(t.amount);
  });

  const categoryBreakdown = Object.values(catMap).sort((a, b) => b.amount - a.amount);
  const topCategories = categoryBreakdown.slice(0, 5).map(c => ({
    ...c,
    percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0
  }));

  // Daily Trend Line Data (Last 14 days)
  const dailyTrends = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayExpense = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(dayStr))
      .reduce((s, t) => s + Number(t.amount), 0);

    dailyTrends.push({
      date: dayStr,
      displayDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      amount: dayExpense
    });
  }

  // 6-Month Comparison Data
  const monthlyComparison = [];
  for (let m = 5; m >= 0; m--) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - m);
    const y = targetDate.getFullYear();
    const mon = targetDate.getMonth();
    const mStart = new Date(y, mon, 1).toISOString();
    const mEnd = new Date(y, mon + 1, 0, 23, 59, 59).toISOString();

    const mTransactions = db.table('transactions').find(t => {
      return t.user_id === req.user.id && t.date >= mStart && t.date <= mEnd;
    });

    const mIncome = mTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const mExpense = mTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    monthlyComparison.push({
      monthLabel: targetDate.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      income: mIncome,
      expense: mExpense
    });
  }

  res.json({
    success: true,
    periodLabel,
    totalIncome,
    totalExpense,
    netCashflow,
    transactionCount: transactions.length,
    topCategories,
    categoryBreakdown,
    dailyTrends,
    monthlyComparison
  });
});

// 2. EXPORT REPORT TO PDF / EXCEL (.XLSX)
router.post('/export', requireProPlan, async (req, res) => {
  try {
    const { format = 'pdf', periodLabel = 'Semua Periode' } = req.body;

    const transactions = db.table('transactions').find(t => t.user_id === req.user.id);
    const categories = db.table('categories').find();
    const wallets = db.table('wallets').find();

    const enriched = transactions.map(t => {
      const c = categories.find(cat => cat.id === t.category_id);
      const w = wallets.find(wal => wal.id === t.wallet_id);
      return {
        ...t,
        category_name: c ? c.name : 'Lain-lain',
        wallet_name: w ? w.name : 'Dompet'
      };
    });

    let exportResult;
    if (format === 'xlsx' || format === 'excel') {
      exportResult = await ReportGenerator.generateExcel(enriched, req.user, periodLabel);
    } else {
      exportResult = await ReportGenerator.generatePDF(enriched, req.user, periodLabel);
    }

    const exportRecord = db.table('export_histories').insert({
      id: crypto.randomUUID(),
      user_id: req.user.id,
      file_format: format === 'xlsx' ? 'xlsx' : 'pdf',
      period_label: periodLabel,
      file_path: exportResult.filePath,
      file_url: `/api/reports/download/${exportResult.filename}`,
      file_size_bytes: exportResult.size,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Laporan ${format.toUpperCase()} berhasil di-generate!`,
      downloadUrl: exportRecord.file_url,
      exportRecord
    });
  } catch (err) {
    console.error('[Export Error]:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat file export laporan: ' + err.message });
  }
});

// 3. DOWNLOAD EXPORTED FILE
router.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'exports', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File laporan tidak ditemukan atau telah kedaluwarsa.' });
  }

  res.download(filePath);
});

// 4. GET USER EXPORT HISTORIES
router.get('/exports', (req, res) => {
  const exports = db.table('export_histories').find(e => e.user_id === req.user.id);
  res.json({ success: true, exports });
});

module.exports = router;
