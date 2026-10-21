// ====================================================================
// TataDana In-App AI Bot & Financial Advisor Routes
// ====================================================================
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const { authenticateToken, requireApprovedUser } = require('../middleware/auth');
const AIService = require('../services/aiService');

router.use(authenticateToken);
router.use(requireApprovedUser);

// 1. IN-APP TATA AI CHAT & DIRECT TRANSACTION SYNC
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
    }

    const cleanMsg = message.trim();
    const lower = cleanMsg.toLowerCase();
    const userId = req.user.id;

    // 1. Fetch user wallets
    let wallets = db.table('wallets').find(w => w.user_id === userId);
    if (!wallets || wallets.length === 0) {
      const defaultWalletId = crypto.randomUUID();
      const newWallet = db.table('wallets').insert({
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
      wallets = [newWallet];
      db.table('profiles').update(userId, { default_wallet_id: defaultWalletId });
    }

    let defaultWallet = wallets.find(w => w.id === req.user.default_wallet_id) || wallets.find(w => w.is_default) || wallets[0];
    let totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

    // 2. CHECK IF INTENT IS PURE SALDO INQUIRY (Cek Saldo)
    const isSaldoInquiry = /^(cek\s*saldo|saldo|sisa\s*uang|berapa\s*saldo|info\s*saldo|uang\s*saya|total\s*saldo)/i.test(lower) ||
      (lower.includes('saldo') && !lower.includes('jt') && !lower.includes('rb') && !lower.includes('k') && !/[0-9]/.test(lower));

    if (isSaldoInquiry) {
      const walletListText = wallets.map(w => `• 💳 **${w.name}**: Rp ${Number(w.balance || 0).toLocaleString('id-ID')}`).join('\n');
      const reply = `💰 **Informasi Saldo TataDana Anda**\n\n${walletListText}\n\n━━━━━━━━━━━━━━━━━━━━\n📊 **Total Saldo Seluruh Dompet:** **Rp ${totalBalance.toLocaleString('id-ID')}**\n\n💡 *Tip: Ketik misalnya "gajian 5jt" atau "beli bakso 15rb" untuk mencatat transaksi dan menyinkronkan saldo secara otomatis!* 🚀`;

      return res.json({
        success: true,
        isTransaction: false,
        reply,
        totalBalance,
        wallets,
        sender: 'Tata AI',
        timestamp: new Date().toISOString()
      });
    }

    // 3. TRY TO PARSE AS A FINANCIAL TRANSACTION (e.g. "gajian 5jt", "beli bakso 15rb")
    const parseResult = await AIService.parseTransactionText(cleanMsg, userId);

    if (parseResult.success && parseResult.data && parseResult.data.nominal > 0) {
      const parsed = parseResult.data;
      const isExpense = parsed.jenis === 'expense';
      const amount = Number(parsed.nominal);
      const notes = parsed.catatan || (isExpense ? 'Pengeluaran' : 'Pemasukan');

      // Check Starter Plan monthly quota (50 tx/month)
      if (req.user.plan === 'starter') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const count = db.table('transactions').count(t => t.user_id === userId && t.date >= startOfMonth);

        if (count >= 50) {
          return res.json({
            success: true,
            isTransaction: false,
            reply: `⚠️ **Batas Transaksi Bulanan Tercapai!**\n\nAkun Starter Anda telah mencapai batas maksimal **50 transaksi/bulan**.\n\n✨ Upgrade ke **TataDana Pro (Rp99.000 Sekali Bayar)** untuk pencatatan UNLIMITED tanpa batas dan fitur OCR Struk!`,
            sender: 'Tata AI',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Find or match Category
      let category = db.table('categories').findOne(c => {
        return (c.user_id === userId || c.is_system) &&
          c.name.toLowerCase().includes((parsed.kategori || '').toLowerCase());
      });

      if (!category) {
        category = db.table('categories').findOne(c => c.is_system && c.type === (isExpense ? 'expense' : 'income')) || {
          id: null,
          name: parsed.kategori || (isExpense ? 'Lain-lain' : 'Pemasukan'),
          emoji: isExpense ? '💸' : '💼'
        };
      }

      // Update default wallet balance
      const currentWalletBalance = Number(defaultWallet.balance || 0);
      const newWalletBalance = isExpense ? (currentWalletBalance - amount) : (currentWalletBalance + amount);
      db.table('wallets').update(defaultWallet.id, { balance: newWalletBalance });

      // Insert transaction into database
      const newTx = db.table('transactions').insert({
        user_id: userId,
        wallet_id: defaultWallet.id,
        category_id: category.id,
        type: isExpense ? 'expense' : 'income',
        amount,
        date: new Date().toISOString(),
        notes,
        source: 'tata_ai_bot'
      });

      // Recalculate total balance
      const updatedWallets = db.table('wallets').find(w => w.user_id === userId);
      const newTotalBalance = updatedWallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

      // Check category budget thresholds if expense
      let budgetAlert = '';
      if (isExpense && category.id) {
        const budget = db.table('budgets').findOne(b => b.user_id === userId && b.category_id === category.id && b.period_type === 'monthly');
        if (budget) {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const spentThisMonth = db.table('transactions').find(t => {
            return t.user_id === userId && t.category_id === category.id && t.type === 'expense' && t.date >= startOfMonth;
          }).reduce((sum, t) => sum + Number(t.amount), 0);

          const pct = Math.round((spentThisMonth / Number(budget.amount)) * 100);
          if (pct >= 100) {
            budgetAlert = `\n🚨 **PERINGATAN BUDGET!**\nPengeluaran kategori **${category.name}** telah mencapai **${pct}%** (Rp ${spentThisMonth.toLocaleString('id-ID')} dari budget Rp ${Number(budget.amount).toLocaleString('id-ID')})!`;
          } else if (pct >= 80) {
            budgetAlert = `\n⚠️ **PERHATIAN BUDGET!**\nPengeluaran kategori **${category.name}** sudah mencapai **${pct}%** dari target bulanan.`;
          }
        }
      }

      const reply = `✅ **Transaksi Berhasil Dicatat & Disinkronkan!**\n\n• **Jenis:** ${isExpense ? '💸 Pengeluaran' : '💼 Pemasukan'}\n• **Nominal:** **Rp ${amount.toLocaleString('id-ID')}**\n• **Kategori:** ${category.emoji || '📌'} ${category.name}\n• **Dompet:** 💳 ${defaultWallet.name}\n• **Catatan:** ${notes}\n• **Saldo Dompet Sekarang:** **Rp ${newWalletBalance.toLocaleString('id-ID')}**\n• **Saldo Total Anda:** **Rp ${newTotalBalance.toLocaleString('id-ID')}**${budgetAlert}\n\n✨ *Saldo total dan ringkasan dashboard Anda telah otomatis terupdate secara langsung!*`;

      return res.json({
        success: true,
        isTransaction: true,
        transaction: newTx,
        newBalance: newWalletBalance,
        totalBalance: newTotalBalance,
        wallets: updatedWallets,
        reply,
        sender: 'Tata AI',
        timestamp: new Date().toISOString()
      });
    }

    // 4. GENERAL FINANCIAL ADVISOR CHAT (Tips, budgeting, advice)
    const reply = await AIService.chatWithTataAI(cleanMsg, {
      totalBalance,
      userName: req.user.full_name,
      plan: req.user.plan
    });

    res.json({
      success: true,
      isTransaction: false,
      reply,
      totalBalance,
      sender: 'Tata AI',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AI Chat Error]:', err);
    res.status(500).json({ success: false, message: 'Maaf, terjadi kendala pada server Tata AI.' });
  }
});

// 2. GET PROACTIVE AI FINANCIAL ADVISOR INSIGHT (PRO FEATURE)
router.get('/advisor-insight', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const recentTransactions = db.table('transactions').find(t => {
      return t.user_id === req.user.id && t.date >= startOfMonth;
    });

    const budgets = db.table('budgets').find(b => b.user_id === req.user.id);
    const totalMonthlyBudget = budgets
      .filter(b => b.period_type === 'monthly')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const insight = await AIService.generateAdvisorInsight(req.user, recentTransactions, totalMonthlyBudget);

    res.json({
      success: true,
      insight
    });
  } catch (err) {
    console.error('[Advisor Error]:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat analisa AI Advisor.' });
  }
});

module.exports = router;
