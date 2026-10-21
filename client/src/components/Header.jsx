import React from 'react';
import { Menu, Plus, Send, ExternalLink, ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '../utils/api';

export default function Header({ 
  currentTab, 
  onOpenNewTransaction, 
  telegramStatus, 
  onToggleMobileMenu,
  onExitImpersonation 
}) {
  const user = getCurrentUser() || {};
  const isImpersonating = user.isImpersonated;

  const isAdmin = user.role === 'admin';

  const titles = {
    overview: 'Beranda Overview Keuangan',
    transactions: 'Riwayat Transaksi',
    reports: 'Laporan & Analitik',
    budgets: 'Target & Budgeting',
    wallets: 'Manajemen Dompet',
    settings: 'Pengaturan Akun',
    admin: 'Super Admin Control Center'
  };

  const descriptions = {
    overview: 'Ringkasan finansial personal, cashflow, dan budget bulanan',
    transactions: 'Daftar riwayat pemasukan, pengeluaran, dan transfer antar-dompet',
    reports: 'Analitik mendalam pengeluaran, perbandingan bulanan, dan ekspor data',
    budgets: 'Target anggaran multi-dimensi (harian, mingguan, bulanan)',
    wallets: 'Kelola saldo rekening bank dan e-wallet yang terhubung',
    settings: 'Konfigurasi profil, integrasi bot Telegram, dan kategori',
    admin: 'Verifikasi pendaftar baru, manajemen pengguna, konfigurasi Multi-AI & audit'
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-brand-100 px-6 py-4 flex items-center justify-between">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="absolute top-0 left-0 right-0 bg-brand-700 text-white text-xs py-1.5 px-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
            <span>Mode Impersonasi: Anda sedang melihat akun sebagai <b>{user.full_name}</b> ({user.email})</span>
          </div>
          <button
            onClick={onExitImpersonation}
            className="text-[11px] underline font-bold hover:text-cyan-200 transition"
          >
            Kembali ke Superadmin
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-brand-600 rounded-lg hover:bg-brand-50"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {titles[currentTab] || 'Dashboard'}
            </h2>
            {isAdmin && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-900 text-cyan-300 border border-brand-700">
                Super Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {descriptions[currentTab] || 'Kelola dan pantau keuangan pribadi Anda secara presisi'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Telegram Connection Live Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold bg-brand-50/60 border-brand-200">
          <span className={`w-2 h-2 rounded-full ${
            telegramStatus?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
          }`} />
          <span className="text-slate-700">
            {telegramStatus?.isConnected 
              ? `@${telegramStatus.botUsername || 'TataDanaBot'}` 
              : 'Bot Belum Terhubung'}
          </span>
        </div>

        {/* Quick Add Transaction Button */}
        <button
          onClick={onOpenNewTransaction}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi</span>
        </button>
      </div>
    </header>
  );
}
