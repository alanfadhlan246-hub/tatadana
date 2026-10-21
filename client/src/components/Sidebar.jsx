import React from 'react';
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  Target, 
  Wallet, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  ChevronRight,
  Bot
} from 'lucide-react';
import { getCurrentUser, setAuthToken, setCurrentUser } from '../utils/api';

export default function Sidebar({ currentTab, setTab, onLogout }) {
  const user = getCurrentUser() || { full_name: 'Pengguna', role: 'user', plan: 'starter' };
  const isAdmin = user.role === 'admin';
  const isPro = user.plan === 'pro';

  const navItems = [];
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Super Admin Control', icon: ShieldCheck, badge: 'Control' });
  }
  navItems.push(
    { id: 'overview', label: 'Beranda', icon: Home },
    { id: 'transactions', label: 'Transaksi', icon: CreditCard },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'budgets', label: 'Budget', icon: Target },
    { id: 'wallets', label: 'Dompet', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  );

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-brand-100 flex flex-col h-screen sticky top-0 z-40 shadow-sm">
      {/* Brand Header */}
      <div className="p-6 border-b border-brand-100/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
            <span className="font-extrabold text-xl tracking-tight">T</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-800 to-brand-600 bg-clip-text text-transparent">
              TataDana
            </h1>
            <p className="text-[10px] text-brand-600 font-semibold tracking-wider uppercase">
              Fintech Platform
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Plan Badge or Super Admin Access Banner */}
      <div className="px-6 py-4">
        {isAdmin ? (
          <div className="p-3 rounded-xl border bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 border-brand-700 text-white shadow-md shadow-brand-950/20">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] mt-0.5 text-brand-200 truncate font-mono">
              {user.email}
            </p>
          </div>
        ) : (
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isPro 
              ? 'bg-gradient-to-r from-brand-600 to-brand-500 border-brand-400 text-white shadow-md shadow-brand-600/15'
              : 'bg-brand-50/70 border-brand-200 text-brand-900'
          }`}>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${isPro ? 'text-cyan-200' : 'text-brand-600'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Paket {isPro ? 'Pro' : 'Starter'}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isPro ? 'text-brand-100' : 'text-slate-600'}`}>
                {isPro ? 'Fitur Unlimited Aktif' : 'Maks 50 trx/bulan'}
              </p>
            </div>
            {!isPro && (
              <button 
                onClick={() => setTab('settings')}
                className="text-[11px] font-bold px-2 py-1 bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 transition"
              >
                Upgrade
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold shadow-md shadow-brand-500/20 translate-x-1'
                  : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-brand-100/80 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center border border-brand-200 shrink-0">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user.full_name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Keluar"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
