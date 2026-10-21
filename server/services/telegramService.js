// ====================================================================
// TataDana Telegram Bot Engine & Webhook Processor
// ====================================================================
const axios = require('axios');
const { db } = require('../config/db');
const AIService = require('./aiService');
const { getWIBDate } = require('../middleware/auth');

class TelegramService {
  // Generate visual progress bar (e.g., ████░░░░ 50%)
  static renderProgressBar(percentage, totalBlocks = 10) {
    const clamped = Math.max(0, Math.min(100, percentage));
    const filledBlocks = Math.round((clamped / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  }

  // Send message to Telegram chat
  static async sendMessage(botToken, chatId, text, parseMode = 'HTML') {
    if (!botToken || !chatId) {
      console.warn('[Telegram] Skip send message: botToken or chatId missing');
      return null;
    }
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await axios.post(url, {
        chat_id: chatId,
        text,
        parse_mode: parseMode
      }, { timeout: 8000 });
      return res.data;
    } catch (err) {
      console.error('[Telegram Send Error]:', err.response?.data || err.message);
      return null;
    }
  }

  // 1. Verify Bot Token (getMe)
  static async testBotToken(token) {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${token}/getMe`, { timeout: 8000 });
      if (res.data && res.data.ok) {
        return { success: true, bot: res.data.result };
      }
      return { success: false, error: 'Respon dari Telegram tidak valid' };
    } catch (err) {
      const desc = err.response?.data?.description || err.message;
      return { success: false, error: desc };
    }
  }

  // 2. Set Webhook
  static async setWebhook(token, webhookBaseUrl) {
    try {
      const webhookUrl = `${webhookBaseUrl}/api/telegram/webhook`;
      const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
        url: webhookUrl,
        drop_pending_updates: false
      }, { timeout: 8000 });

      if (res.data && res.data.ok) {
        return { success: true, webhookUrl };
      }
      return { success: false, error: res.data?.description || 'Gagal mengatur webhook' };
    } catch (err) {
      return { success: false, error: err.response?.data?.description || err.message };
    }
  }

  // 3. Resolve user by Telegram user ID or linked phone
  static findUserByTelegram(telegramFrom) {
    if (!telegramFrom || !telegramFrom.id) return null;
    // 1. Check direct telegram_user_id
    let user = db.table('profiles').findOne(p => p.telegram_user_id === telegramFrom.id);
    if (user) return user;

    // 2. Check if username matches
    if (telegramFrom.username) {
      user = db.table('profiles').findOne(p => p.telegram_username?.toLowerCase() === telegramFrom.username.toLowerCase());
      if (user) {
        db.table('profiles').update(user.id, { telegram_user_id: telegramFrom.id });
        return user;
      }
    }

    // Default to demo user if testing in localhost
    const demoUser = db.table('profiles').findOne(p => p.email === 'user@tatadana.id');
    return demoUser || null;
  }

  // 4. MAIN INCOMING UPDATE HANDLER (Idempotent Webhook)
  static async handleWebhookUpdate(update, botToken) {
    const updateId = update.update_id;
    if (!updateId) return { skipped: true, reason: 'NO_UPDATE_ID' };

    // IDEMPOTENCY CHECK
    const existing = db.table('telegram_updates').findOne(u => u.update_id === updateId);
    if (existing) {
      console.log(`[Telegram Webhook] Skipping duplicate update_id: ${updateId}`);
      return { skipped: true, reason: 'DUPLICATE_UPDATE_ID' };
    }

    // Record update immediately
    db.table('telegram_updates').insert({
      update_id: updateId,
      processed_at: new Date().toISOString(),
      payload: update
    });

    const message = update.message || update.edited_message;
    if (!message) return { status: 'NO_MESSAGE' };

    const chatId = message.chat?.id;
    const fromUser = message.from;
    const user = this.findUserByTelegram(fromUser);

    if (!user) {
      const helpMsg = `👋 <b>Halo dari TataDana!</b>\n\nAkun Telegram Anda belum terhubung ke TataDana.\nSilakan login ke web <b>TataDana</b>, buka menu <b>Settings > Telegram Bot</b>, dan hubungkan akun Anda untuk mulai mencatat keuangan semudah chat! 🚀`;
      await this.sendMessage(botToken, chatId, helpMsg);
      return { status: 'USER_NOT_LINKED' };
    }

    // CHECK APPROVAL STATUS
    if (user.approval_status === 'pending_approval') {
      const pendingMsg = `⏳ <b>Pendaftaran Anda Sedang Menunggu Persetujuan</b>\n\nAkun TataDana Anda atas nama <b>${user.full_name}</b> sedang dalam antrean verifikasi oleh Super Admin.\nBegitu disetujui, Anda langsung bisa mencatat keuangan di sini! 🙏`;
      await this.sendMessage(botToken, chatId, pendingMsg);
      return { status: 'USER_PENDING_APPROVAL' };
    }

    if (user.approval_status === 'rejected') {
      const rejectMsg = `❌ <b>Akun Tidak Disetujui</b>\n\nMohon maaf, pendaftaran akun Anda ditolak oleh admin TataDana. Silakan hubungi support@tatadana.id untuk info lebih lanjut.`;
      await this.sendMessage(botToken, chatId, rejectMsg);
      return { status: 'USER_REJECTED' };
    }

    // GET DEFAULT WALLET
    let wallet = db.table('wallets').findById(user.default_wallet_id);
    if (!wallet) {
      wallet = db.table('wallets').findOne(w => w.user_id === user.id) || {
        id: null,
        name: 'Dompet Utama',
        balance: 0
      };
    }

    // 4A. HANDLE BOT COMMANDS
    const text = message.text?.trim() || '';
    if (text.startsWith('/')) {
      return await this.handleCommands(text, user, wallet, botToken, chatId);
    }

    // 4B. CHECK STARTER PLAN TRANSACTION QUOTA
    if (user.plan === 'starter') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const count = db.table('transactions').count(t => t.user_id === user.id && t.date >= startOfMonth);

      if (count >= 50) {
        const limitMsg = `⚠️ <b>Batas Transaksi Bulanan Tercapai!</b>\n\nPaket Starter Anda sudah mencapai batas maksimal <b>50 transaksi/bulan</b>.\n\n✨ Upgrade ke <b>TataDana Pro (Rp99.000 Sekali Bayar)</b> untuk:\n• Transaksi UNLIMITED tanpa batas\n• Input via Foto Struk belanja & AI Vision\n• AI Financial Advisor otomatis\n• Laporan lengkap & Export PDF/Excel\n\n👉 Buka menu Langganan di web app Anda!`;
        await this.sendMessage(botToken, chatId, limitMsg);
        return { status: 'PLAN_LIMIT_EXCEEDED' };
      }
    }

    // 4C. HANDLE VOICE NOTE / AUDIO
    if (message.voice || message.audio) {
      const voiceObj = message.voice || message.audio;
      if (voiceObj.duration && voiceObj.duration > 60) {
        const durMsg = `⏱️ <b>Durasi Voice Note Terlalu Panjang</b>\n\nMohon kirimkan rekaman suara maksimal 60 detik agar Tata AI dapat memprosesnya dengan optimal.`;
        await this.sendMessage(botToken, chatId, durMsg);
        return { status: 'VOICE_TOO_LONG' };
      }

      const voiceResult = await AIService.transcribeAndParseVoice(null, user.id);
      return await this.processParsedTransaction(
        voiceResult.data,
        user,
        wallet,
        botToken,
        chatId,
        'telegram_voice',
        `🎙️ <i>Transkrip: "${voiceResult.transcript}"</i>`
      );
    }

    // 4D. HANDLE PHOTO / RECEIPT OCR
    if (message.photo && message.photo.length > 0) {
      if (user.plan !== 'pro') {
        const proOnlyMsg = `📸 <b>Fitur Foto Struk Khusus Pengguna Pro</b>\n\nCatat belanja dari foto struk belanja otomatis hanya tersedia di <b>TataDana Pro</b>.\n\n✨ Upgrade sekarang hanya <b>Rp99.000 (Sekali Bayar Selamanya)</b> untuk membuka fitur ini dan fitur eksklusif lainnya!\n👉 Kunjungi dashboard TataDana Anda.`;
        await this.sendMessage(botToken, chatId, proOnlyMsg);
        return { status: 'PHOTO_NOT_ALLOWED_ON_STARTER' };
      }

      // Pro User: Execute OCR Vision parsing
      const ocrResult = await AIService.extractReceiptItems(null, user.id);
      return await this.processReceiptTransaction(ocrResult.data, user, wallet, botToken, chatId);
    }

    // 4E. HANDLE NATURAL TEXT INPUT
    if (text) {
      const parseResult = await AIService.parseTransactionText(text, user.id);
      if (!parseResult.success || !parseResult.data || !parseResult.data.nominal) {
        const errorReply = `❓ <b>TataDana belum mengerti kalimat Anda</b>\n\nMohon sertakan nominal dan catatan pengeluaran/pemasukan.\n\n<b>Contoh yang benar:</b>\n• <i>beli bakso 15rb</i>\n• <i>bensin motor 25.000</i>\n• <i>gajian 5jt</i>\n• <i>kopi kenangan 18k</i>`;
        await this.sendMessage(botToken, chatId, errorReply);
        return { status: 'PARSING_ERROR' };
      }

      return await this.processParsedTransaction(
        parseResult.data,
        user,
        wallet,
        botToken,
        chatId,
        'telegram_text',
        null
      );
    }

    return { status: 'IGNORED_MESSAGE_TYPE' };
  }

  // 5. PROCESS & RECORD SINGLE PARSED TRANSACTION
  static async processParsedTransaction(parsed, user, wallet, botToken, chatId, source, extraHeader = null) {
    const isExpense = parsed.jenis === 'expense';
    const amount = parsed.nominal;
    const notes = parsed.catatan || (isExpense ? 'Pengeluaran' : 'Pemasukan');

    // Find category
    let category = db.table('categories').findOne(c => {
      return (c.user_id === user.id || c.is_system) &&
        c.name.toLowerCase().includes((parsed.kategori || '').toLowerCase());
    });

    if (!category) {
      category = db.table('categories').findOne(c => c.is_system && c.type === (isExpense ? 'expense' : 'income')) || {
        id: null,
        name: parsed.kategori || (isExpense ? 'Lain-lain' : 'Pemasukan'),
        emoji: isExpense ? '💸' : '💼'
      };
    }

    // Update wallet balance
    const currentBalance = Number(wallet.balance) || 0;
    const newBalance = isExpense ? (currentBalance - amount) : (currentBalance + amount);
    if (wallet.id) {
      db.table('wallets').update(wallet.id, { balance: newBalance });
    }

    // Insert transaction
    const newTx = db.table('transactions').insert({
      user_id: user.id,
      wallet_id: wallet.id,
      category_id: category.id,
      type: isExpense ? 'expense' : 'income',
      amount,
      date: new Date().toISOString(),
      notes,
      source: source || 'telegram_text'
    });

    const wibTimeString = getWIBDate(new Date());

    if (isExpense) {
      // Calculate Budget Progress for this category
      const budget = db.table('budgets').findOne(b => b.user_id === user.id && b.category_id === category.id && b.period_type === 'monthly');
      let budgetSection = '';

      if (budget && budget.amount > 0) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const totalSpent = db.table('transactions')
          .find(t => t.user_id === user.id && t.category_id === category.id && t.type === 'expense' && t.date >= startOfMonth)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const percentage = Math.round((totalSpent / Number(budget.amount)) * 100);
        const remaining = Math.max(0, Number(budget.amount) - totalSpent);
        const progressBar = this.renderProgressBar(percentage);

        let motivation = '';
        if (percentage >= 100) {
          motivation = '\n🚨 <i>Budget kategori ini sudah habis! Rem pengeluaranmu ya.</i>';
        } else if (percentage >= 80) {
          motivation = '\n⚠️ <i>Budget kategori ini sudah mencapai 80%! Waspada jangan overbudget.</i>';
        }

        budgetSection = `\n\n📊 <b>Budget ${category.name} bulan ini:</b>\n${progressBar} ${percentage}% — sisa Rp${remaining.toLocaleString('id-ID')}${motivation}`;
      }

      const reply = `${extraHeader ? extraHeader + '\n\n' : ''}📅 ${wibTimeString}
💸 <b>Pengeluaran tercatat!</b>
├ Nominal : Rp${amount.toLocaleString('id-ID')}
├ Kategori : ${category.emoji || '🏷️'} ${category.name}
├ Dompet : 👛 ${wallet.name}
├ Catatan : ${notes}
└ Saldo : Rp${newBalance.toLocaleString('id-ID')}${budgetSection}`;

      await this.sendMessage(botToken, chatId, reply);
    } else {
      // Income Reply
      const reply = `${extraHeader ? extraHeader + '\n\n' : ''}📅 ${wibTimeString}
💰 <b>Pemasukan tercatat!</b>
├ Nominal : Rp${amount.toLocaleString('id-ID')}
├ Kategori : 💼 ${category.name}
├ Dompet : 👛 ${wallet.name}
└ Saldo baru : Rp${newBalance.toLocaleString('id-ID')}

💪 <i>Semangat terus! Jangan lupa sisihkan untuk tabungan ya.</i>`;

      await this.sendMessage(botToken, chatId, reply);
    }

    return { success: true, transactionId: newTx.id };
  }

  // 6. PROCESS MULTI-ITEM RECEIPT TRANSACTION
  static async processReceiptTransaction(ocrData, user, wallet, botToken, chatId) {
    const totalAmount = ocrData.total_amount || 0;
    const items = ocrData.items || [];
    const merchant = ocrData.merchant || 'Struk Belanja';

    // Update wallet
    const currentBalance = Number(wallet.balance) || 0;
    const newBalance = currentBalance - totalAmount;
    if (wallet.id) {
      db.table('wallets').update(wallet.id, { balance: newBalance });
    }

    // Default shopping category
    const catBelanja = db.table('categories').findOne(c => c.name.includes('Belanja')) || { id: null, name: 'Belanja Kebutuhan', emoji: '👕' };

    // Insert 1 parent transaction
    const parentTx = db.table('transactions').insert({
      user_id: user.id,
      wallet_id: wallet.id,
      category_id: catBelanja.id,
      type: 'expense',
      amount: totalAmount,
      date: new Date().toISOString(),
      notes: `Struk di ${merchant} (${items.length} item)`,
      source: 'telegram_photo',
      receipt_items_count: items.length
    });

    // Insert itemized lines in transaction_items
    items.forEach(it => {
      db.table('transaction_items').insert({
        transaction_id: parentTx.id,
        user_id: user.id,
        item_name: it.item_name,
        price: it.price,
        quantity: it.quantity || 1,
        category_id: catBelanja.id
      });
    });

    const wibTimeString = getWIBDate(new Date());
    const itemsSummary = items.map(it => `  • ${it.item_name} (Rp${Number(it.price).toLocaleString('id-ID')})`).join('\n');

    const reply = `📅 ${wibTimeString}
🧾 <b>Struk Belanja Berhasil Diekstrak!</b>
├ Merchant : 🏪 ${merchant}
├ Total : Rp${totalAmount.toLocaleString('id-ID')}
├ Dompet : 👛 ${wallet.name}
├ Jumlah Item : ${items.length} rincian
└ Saldo : Rp${newBalance.toLocaleString('id-ID')}

📋 <b>Rincian Barang:</b>
${itemsSummary}

<i>✨ Rincian lengkap otomatis tersimpan rapi dan dapat di-expand di menu Laporan dashboard TataDana!</i>`;

    await this.sendMessage(botToken, chatId, reply);
    return { success: true, transactionId: parentTx.id };
  }

  // 7. HANDLE COMMANDS (/saldo, /hari ini, /bulan ini, /budget, /sheet, /bantuan)
  static async handleCommands(commandText, user, wallet, botToken, chatId) {
    const cmd = commandText.toLowerCase().trim();

    if (cmd === '/bantuan') {
      const msg = `🤖 <b>Daftar Perintah Bot TataDana:</b>

• <b>/saldo</b> — Cek saldo seluruh dompet Anda
• <b>/hari ini</b> — Rekap pengeluaran & pemasukan hari ini
• <b>/minggu ini</b> — Rekap transaksi 7 hari terakhir
• <b>/bulan ini</b> — Rekap bulan berjalan & breakdown kategori
• <b>/budget</b> — Status semua budget bulanan & sisa anggaran
• <b>/sheet</b> — Link langsung ke Dashboard Laporan pribadi
• <b>/bantuan</b> — Menampilkan panduan ini

💡 <i>Cukup ketik langsung seperti "kopi 20rb" atau kirim voice note / foto struk belanja untuk mencatat!</i>`;
      await this.sendMessage(botToken, chatId, msg);
      return { command: '/bantuan' };
    }

    if (cmd === '/saldo') {
      const wallets = db.table('wallets').find(w => w.user_id === user.id);
      const total = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
      const walletList = wallets.map(w => `• <b>${w.name}</b>: Rp${Number(w.balance).toLocaleString('id-ID')}${w.is_default ? ' <i>(Default)</i>' : ''}`).join('\n');

      const msg = `👛 <b>Daftar Saldo Dompet Anda:</b>\n\n${walletList}\n\n💰 <b>Total Keseluruhan: Rp${total.toLocaleString('id-ID')}</b>`;
      await this.sendMessage(botToken, chatId, msg);
      return { command: '/saldo' };
    }

    if (cmd === '/hari ini') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayTxs = db.table('transactions').find(t => t.user_id === user.id && t.date.startsWith(todayStr));

      const expense = todayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const income = todayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);

      const msg = `📅 <b>Rekap Transaksi Hari Ini:</b>\n\n💸 Pengeluaran : Rp${expense.toLocaleString('id-ID')}\n💰 Pemasukan : Rp${income.toLocaleString('id-ID')}\n📊 Transaksi : ${todayTxs.length} catatan\n\n<i>Buka web TataDana untuk melihat rincian lengkap grafik harian.</i>`;
      await this.sendMessage(botToken, chatId, msg);
      return { command: '/hari ini' };
    }

    if (cmd === '/bulan ini') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthTxs = db.table('transactions').find(t => t.user_id === user.id && t.date >= startOfMonth);

      const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const net = income - expense;

      const msg = `📊 <b>Rekap Keuangan Bulan Ini:</b>\n\n💰 Total Pemasukan : Rp${income.toLocaleString('id-ID')}\n💸 Total Pengeluaran : Rp${expense.toLocaleString('id-ID')}\n📈 Net Cashflow : <b>Rp${net.toLocaleString('id-ID')}</b> (${net >= 0 ? 'Surplus ✅' : 'Defisit ⚠️'})\n\nJumlah transaksi: ${monthTxs.length} transaksi`;
      await this.sendMessage(botToken, chatId, msg);
      return { command: '/bulan ini' };
    }

    if (cmd === '/budget') {
      const budgets = db.table('budgets').find(b => b.user_id === user.id);
      if (budgets.length === 0) {
        await this.sendMessage(botToken, chatId, '🎯 Anda belum membuat anggaran. Silakan atur budget bulanan di web app TataDana!');
        return { command: '/budget' };
      }

      const budgetLines = budgets.map(b => {
        const cat = db.table('categories').findById(b.category_id) || { name: 'Kategori', emoji: '🏷️' };
        return `• ${cat.emoji} <b>${cat.name}</b> (${b.period_type}): Rp${Number(b.amount).toLocaleString('id-ID')}`;
      }).join('\n');

      const msg = `🎯 <b>Status Target Budget Anda:</b>\n\n${budgetLines}\n\n<i>Progress visual harian & bulanan dapat dipantau di dashboard!</i>`;
      await this.sendMessage(botToken, chatId, msg);
      return { command: '/budget' };
    }

    if (cmd === '/sheet') {
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const msg = `📊 <b>Dashboard Laporan Keuangan Anda:</b>\n\nSeluruh transaksi dan data keuangan Anda tersinkronisasi secara real-time di:\n👉 <a href="${appUrl}/reports">Kunjungi Laporan TataDana</a>`;
      await this.sendMessage(botToken, chatId, msg);
      return { command: '/sheet' };
    }

    // Default unknown command
    await this.sendMessage(botToken, chatId, `Perintah tidak dikenali. Ketik <b>/bantuan</b> untuk melihat daftar perintah.`);
    return { command: 'unknown' };
  }
}

module.exports = TelegramService;
