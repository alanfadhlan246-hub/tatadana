import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Filter, 
  Calendar,
  Sparkles,
  Bot
} from 'lucide-react';
import { apiFetch, getCurrentUser } from '../utils/api';

export default function DashboardOverview({ 
  onOpenNewTransaction, 
  onNavigateTab, 
  wallets = [],
  summary: propSummary = null,
  refreshTrigger,
  onDataUpdated
}) {
  const [period, setPeriod] = useState('monthly');
  const [localSummary, setLocalSummary] = useState(propSummary);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  const user = getCurrentUser() || {};

  // Keep local summary in sync with parent prop
  useEffect(() => {
    if (period === 'monthly' && propSummary) {
      setLocalSummary(propSummary);
    }
  }, [propSummary, period]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sumRes, txRes, tgRes] = await Promise.all([
        apiFetch(`/reports/summary?period=${period}`),
        apiFetch('/transactions?limit=10&sort=desc'),
        apiFetch('/telegram/status')
      ]);

      if (sumRes.ok && sumRes.data.success) {
        setLocalSummary(sumRes.data);
      }
      if (txRes.ok && txRes.data.success) {
        setRecentTransactions(txRes.data.data);
      }
      if (tgRes.ok && tgRes.data.success) {
        setTelegramConnected(tgRes.data.is_connected);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    const handleDataUpdated = () => {
      loadData(true);
    };

    window.addEventListener('tatadana:data_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('tatadana:data_updated', handleDataUpdated);
    };
  }, [period, refreshTrigger]);

  const summary = localSummary || propSummary;
  const totalBalance = (wallets || []).reduce((s, w) => s + Number(w.balance || 0), 0);
  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const netCashflow = summary?.netCashflow || 0;

  // Checklist status for onboarding
  const hasWallets = wallets.length > 0;
  const hasTransactions = recentTransactions.length > 0;
  const onboardingSteps = [
    { title: 'Hubungkan Bot Telegram', done: telegramConnected, action: () => onNavigateTab('settings') },
    { title: 'Atur Dompet & Saldo Awal', done: hasWallets, action: () => onNavigateTab('wallets') },
    { title: 'Tentukan Target Budgeting', done: hasTransactions, action: () => onNavigateTab('budgets') },
    { title: 'Catat Transaksi Pertama Anda', done: hasTransactions, action: onOpenNewTransaction }
  ];

  const completedSteps = onboardingSteps.filter(s => s.done).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-brand-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Selamat Datang, {user.full_name?.split(' ')[0] || 'Sobat'}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Berikut ringkasan kesehatan finansial Anda periode <b>{summary?.periodLabel || 'Bulan Ini'}</b>
          </p>
        </div>

        {/* Period Selector Filter */}
        <div className="flex items-center gap-1 bg-brand-50/80 p-1 rounded-xl border border-brand-200/80 self-stretch sm:self-auto overflow-x-auto text-xs font-bold text-slate-700">
          {[
            { id: 'daily', label: 'Harian' },
            { id: 'weekly', label: 'Mingguan' },
            { id: 'monthly', label: 'Bulanan' },
            { id: 'yearly', label: 'Tahunan' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                period === p.id 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'hover:text-brand-700 hover:bg-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding Checklist for New Users (if not all done) */}
      {completedSteps < 4 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white shadow-xl shadow-brand-900/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <h3 className="font-bold text-sm tracking-wide text-cyan-100">
                  Panduan Awal Menuju Kebebasan Finansial ({completedSteps}/4 Selesai)
                </h3>
              </div>
              <p className="text-xs text-brand-200 max-w-xl">
                Selesaikan checklist persiapan ini agar TataDana dan AI Telegram Bot dapat mengelola keuangan Anda 100% otomatis.
              </p>
            </div>
            <div className="w-full md:w-48 bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {onboardingSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={step.action}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-left text-xs font-semibold transition ${
                  step.done 
                    ? 'bg-brand-700/60 text-brand-200 border border-brand-600/50' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-brand-300 shrink-0" />
                )}
                <span className="truncate">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <div className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Total</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rp{totalBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-brand-600">{wallets.length} dompet</span> terhubung
          </p>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemasukan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            Rp{totalIncome.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Periode {summary?.periodLabel || 'berjalan'}
          </p>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengeluaran</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rp{totalExpense.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {summary?.transactionCount || 0} transaksi tercatat
          </p>
        </div>

        {/* Card 4: Net Cashflow */}
        <div className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Cashflow</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              netCashflow >= 0 ? 'bg-brand-50 text-brand-600' : 'bg-red-50 text-red-600'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold tracking-tight ${
            netCashflow >= 0 ? 'text-brand-600' : 'text-red-600'
          }`}>
            Rp{netCashflow.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {netCashflow >= 0 ? 'Kondisi surplus (Aman) ✅' : 'Kondisi defisit (Waspada) ⚠️'}
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 6-Month Bar Comparison & Daily Trend Line */}
        <div className="lg:col-span-2 space-y-6">
          {/* 6-Month Bar Comparison */}
          <div className="p-6 rounded-2xl bg-white border border-brand-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Perbandingan 6 Bulan Terakhir</h3>
                <p className="text-xs text-slate-500">Pemasukan vs Pengeluaran historis</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pemasukan
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span> Pengeluaran
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
              {(summary?.monthlyComparison || []).map((m, idx) => {
                const maxVal = Math.max(
                  ...summary.monthlyComparison.map(i => Math.max(i.income, i.expense)),
                  1000000
                );
                const incHeight = Math.max(8, (m.income / maxVal) * 140);
                const expHeight = Math.max(8, (m.expense / maxVal) * 140);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incHeight}px` }}
                        className="w-1/2 max-w-[20px] bg-emerald-400 rounded-t-md group-hover:bg-emerald-500 transition-all shadow-sm"
                        title={`Pemasukan: Rp${m.income.toLocaleString('id-ID')}`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expHeight}px` }}
                        className="w-1/2 max-w-[20px] bg-brand-500 rounded-t-md group-hover:bg-brand-600 transition-all shadow-sm"
                        title={`Pengeluaran: Rp${m.expense.toLocaleString('id-ID')}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">{m.monthLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Trend Line (Sparkline SVG) */}
          <div className="p-6 rounded-2xl bg-white border border-brand-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Tren Pengeluaran 14 Hari Terakhir</h3>
                <p className="text-xs text-slate-500">Pola fluktuasi harian Anda</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-28 flex items-end justify-between gap-1 pt-4">
                {(summary?.dailyTrends || []).map((d, idx) => {
                  const maxDay = Math.max(...summary.dailyTrends.map(t => t.amount), 50000);
                  const h = Math.max(4, (d.amount / maxDay) * 80);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        style={{ height: `${h}px` }}
                        className="w-full max-w-[14px] bg-brand-400/80 hover:bg-brand-600 rounded-t-sm transition"
                        title={`${d.displayDate}: Rp${d.amount.toLocaleString('id-ID')}`}
                      />
                      <span className="text-[9px] text-slate-400 truncate hidden sm:block">
                        {d.displayDate.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Top 5 Categories & Pie Chart Breakdown */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-brand-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900">Kategori Terbesar</h3>
                <span className="text-xs text-brand-600 font-semibold cursor-pointer" onClick={() => onNavigateTab('reports')}>
                  Lihat Semua →
                </span>
              </div>

              {/* Category Breakdown Progress List */}
              <div className="space-y-3.5">
                {(summary?.topCategories || []).length > 0 ? (
                  summary.topCategories.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span>{cat.emoji}</span> {cat.name}
                        </span>
                        <span className="font-bold text-slate-900">
                          Rp{cat.amount.toLocaleString('id-ID')} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Belum ada pengeluaran pada periode ini.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Telegram Bot CTA Card */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-brand-50 to-sky-100/60 border border-brand-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-bold text-brand-900">Tips Cepat Telegram</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Ketik <code>"kopi 20rb"</code> atau <code>"gaji 5jt"</code> langsung di chat bot untuk mencatat instan tanpa buka web!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 10 Recent Transactions List */}
      <div className="p-6 rounded-2xl bg-white border border-brand-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">10 Transaksi Terbaru</h3>
            <p className="text-xs text-slate-500">Sinkronisasi otomatis dari Web & Telegram</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 transition"
          >
            Lihat Tabel Lengkap →
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map(tx => {
              const isExpense = tx.type === 'expense';
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-lg shrink-0">
                      {tx.category_emoji || '🏷️'}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">
                        {tx.notes || tx.category_name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • 👛 {tx.wallet_name} • {tx.source}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs sm:text-sm font-extrabold ${
                      isExpense ? 'text-slate-900' : 'text-emerald-600'
                    }`}>
                      {isExpense ? '-' : '+'}Rp{Number(tx.amount).toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium capitalize">
                      {tx.category_name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-slate-700">Belum Ada Transaksi</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Mulai catat transaksi pertama Anda dengan tombol di bawah.</p>
            <button
              onClick={onOpenNewTransaction}
              className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-700 transition"
            >
              + Catat Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
