// ====================================================================
// TataDana Master Server & API Gateway
// ====================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getWIBDate } = require('./middleware/auth');
const { isSupabaseConfigured } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Cloud DB sync middleware for Serverless persistence
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      const { db } = require('./config/db');
      await db.syncFromCloud();
    } catch (e) {
      console.warn('[DB Sync Middleware]:', e.message);
    }
  }
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallets', require('./routes/wallets'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/telegram', require('./routes/telegram'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ai-bot', require('./routes/aiBot'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'TataDana SaaS Platform',
    version: '1.0.0',
    wib_time: getWIBDate(new Date()),
    supabase_connected: isSupabaseConfigured(),
    telegram_webhook_ready: true,
    timezone: 'Asia/Jakarta (WIB)'
  });
});

// Serve frontend static build if exists with no-cache on index.html
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(clientDistPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexHtml)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(indexHtml);
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan sistem internal pada server TataDana.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server (only when run directly or not in Vercel serverless)
if (!process.env.VERCEL && (require.main === module || !module.parent)) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 TataDana Server berjalan aktif:`);
    console.log(`💻 Local (Laptop):    http://localhost:${PORT}`);
    console.log(`📱 Dual Perangkat (HP / Laptop Lain): http://192.168.1.3:${PORT}`);
    console.log(`🕒 Waktu Server: ${getWIBDate(new Date())}`);
    console.log(`🔌 Mode Database: ${isSupabaseConfigured() ? 'Supabase Cloud' : 'Dual-Ready Local Persistent Store'}`);
    console.log(`🤖 Telegram Webhook Endpoint: http://localhost:${PORT}/api/telegram/webhook`);
    console.log(`====================================================`);
  });
}

module.exports = app;
