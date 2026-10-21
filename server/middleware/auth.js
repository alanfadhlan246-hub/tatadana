// ====================================================================
// TataDana Auth & Permission Middlewares
// ====================================================================
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'tatadana_super_secret_jwt_key_2026_finance_shield';

// Helper to generate WIB timestamp string
function getWIBDate(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

// 1. Authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Akses ditolak: Token autentikasi tidak ditemukan.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Sesi login telah kedaluwarsa atau tidak valid.'
      });
    }

    const user = db.table('profiles').findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Pengguna tidak ditemukan dalam sistem.'
      });
    }

    req.user = user;
    next();
  });
}

// 2. Check Admin Approval Status
// Restricts dashboard actions until admin approves the applicant
function requireApprovedUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
  }

  // Admins bypass approval check
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.approval_status === 'pending_approval') {
    return res.status(403).json({
      success: false,
      error: 'AKUN_PENDING_APPROVAL',
      message: 'Pendaftaran Anda sedang menunggu persetujuan dari Super Admin. Anda akan menerima notifikasi setelah akun diverifikasi.',
      approval_status: 'pending_approval'
    });
  }

  if (req.user.approval_status === 'rejected') {
    return res.status(403).json({
      success: false,
      error: 'AKUN_REJECTED',
      message: 'Pendaftaran Anda ditolak oleh admin. Silakan hubungi support@tatadana.id untuk klarifikasi.',
      approval_status: 'rejected'
    });
  }

  next();
}

// 3. Superadmin Only Middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Fitur ini khusus untuk Superadmin TataDana.'
    });
  }
  next();
}

// 4. Pro Plan Gating Middleware
function requireProPlan(req, res, next) {
  if (req.user.role === 'admin' || req.user.plan === 'pro') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'PLAN_UPGRADE_REQUIRED',
    message: 'Fitur ini eksklusif untuk pengguna paket TataDana Pro.',
    required_plan: 'pro',
    current_plan: req.user.plan || 'starter'
  });
}

// 5. Monthly Transaction Quota Check for Starter Plan (max 50 trx/month)
function checkTransactionQuota(req, res, next) {
  if (req.user.role === 'admin' || req.user.plan === 'pro') {
    return next();
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const count = db.table('transactions').count(t => {
    return t.user_id === req.user.id && t.date >= startOfMonth;
  });

  const MAX_STARTER_LIMIT = 50;
  if (count >= MAX_STARTER_LIMIT) {
    return res.status(403).json({
      success: false,
      error: 'STARTER_LIMIT_REACHED',
      message: `Batas transaksi bulanan paket Starter (${MAX_STARTER_LIMIT} transaksi) telah tercapai. Upgrade ke Pro untuk transaksi unlimited!`,
      limit: MAX_STARTER_LIMIT,
      current_usage: count
    });
  }

  req.current_usage = count;
  next();
}

module.exports = {
  JWT_SECRET,
  getWIBDate,
  authenticateToken,
  requireApprovedUser,
  requireAdmin,
  requireProPlan,
  checkTransactionQuota
};
