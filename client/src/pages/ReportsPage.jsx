import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Sparkles, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiFetch, getCurrentUser } from '../utils/api';

export default function ReportsPage({ onNavigateTab }) {
  const [period, setPeriod] = useState('monthly');
  const [summary, setSummary] = useState(null);
  const [exportHistories, setExportHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const user = getCurrentUser() || {};
  const isPro = user.plan === 'pro';

  const loadReportData = async () => {
    setLoading(true);
    try {
      const sumRes = await apiFetch(`/reports/summary?period=${period}`);
      if (sumRes.ok && sumRes.data.success) {
        setSummary(sumRes.data);
      }

      const expRes = await apiFetch('/reports/exports');
      if (expRes.ok && expRes.data.success) {
        setExportHistories(expRes.data.exports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [period]);

  const handleExport = async (format) => {
    if (!isPro) {
      alert('Fitur Export PDF & Excel (.xlsx) eksklusif untuk pengguna TataDana Pro. Silakan upgrade paket Anda.');
      return;
    }

    setExporting(true);
    setExportMessage(`Sedang meng-generate laporan ${format.toUpperCase()}...`);

    try {
      const res = await apiFetch('/reports/export', {
        method: 'POST',
        body: JSON.stringify({
          format,
          periodLabel: summary?.periodLabel || 'Bulan Ini'
        })
      });

      if (res.ok && res.data.success) {
        setExportMessage(`Berhasil membuat file! Mengunduh otomatis...`);
        // Trigger download
        window.open(res.data.downloadUrl, '_blank');
        loadReportData();
      } else {
        setExportMessage(res.data.message || 'Gagal export file.');
      }
    } catch {
      setExportMessage('Terjadi kendala jaringan.');
    } finally {
      setExporting(false);
      setTimeout(() => setExportMessage(''), 4000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-brand-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            📊 Laporan & Analitik Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis arus kas mendalam serta export ke format PDF dan Excel (.xlsx)
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-600" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Pro Plan Upsell Notice if Starter */}
      {!isPro && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-brand-900/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-300 shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-cyan-100">Buka Akses Export Laporan Lengkap Tanpa Batas</h3>
              <p className="text-xs text-brand-200">
                Paket Starter dibatasi hanya ringkasan. Upgrade ke Pro (Rp99.000 Sekali Bayar) untuk export PDF & Excel tanpa batas!
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-4 py-2 bg-white text-brand-900 hover:bg-cyan-50 font-bold text-xs rounded-xl shadow-sm transition shrink-0"
          >
            Upgrade ke Pro
          </button>
        </div>
      )}

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-brand-100 shadow-sm overflow-x-auto text-xs font-bold text-slate-700">
        {[
          { id: 'daily', label: 'Hari Ini' },
          { id: 'weekly', label: 'Minggu Ini' },
          { id: 'monthly', label: 'Bulan Ini' },
          { id: 'yearly', label: 'Tahun Ini' }
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
              period === p.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 3 Executive Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            Rp{(summary?.totalIncome || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Akumulasi periode {summary?.periodLabel}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            Rp{(summary?.totalExpense || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">{summary?.transactionCount || 0} transaksi pengeluaran</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Cashflow</span>
          <p className={`text-2xl font-extrabold mt-2 ${
            (summary?.netCashflow || 0) >= 0 ? 'text-brand-600' : 'text-red-600'
          }`}>
            Rp{(summary?.netCashflow || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {(summary?.netCashflow || 0) >= 0 ? 'Surplus Keuangan Aman' : 'Defisit Anggaran'}
          </p>
        </div>
      </div>

      {/* Top 5 Categories & Category Breakdown Table */}
      <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Rincian Pengeluaran per Kategori</h3>
        <div className="divide-y divide-slate-100">
          {(summary?.categoryBreakdown || []).length > 0 ? (
            summary.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-base">
                    {cat.emoji}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{cat.name}</p>
                    <div className="w-32 bg-slate-100 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-brand-500 h-full rounded-full"
                        style={{ width: `${summary.totalExpense > 0 ? (cat.amount / summary.totalExpense) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-900">
                    Rp{cat.amount.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {summary.totalExpense > 0 ? Math.round((cat.amount / summary.totalExpense) * 100) : 0}% dari total
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada transaksi pengeluaran pada rentang waktu ini.
            </p>
          )}
        </div>
      </div>

      {/* Riwayat Export File Sebelumnya */}
      <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Riwayat Berkas Export</h3>
            <p className="text-xs text-slate-500">Unduh ulang berkas PDF atau Excel yang pernah Anda buat</p>
          </div>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>

        {exportHistories.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {exportHistories.map(exp => (
              <div key={exp.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  {exp.file_format === 'xlsx' ? (
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600 p-1 bg-emerald-50 rounded-lg" />
                  ) : (
                    <FileText className="w-8 h-8 text-brand-600 p-1 bg-brand-50 rounded-lg" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Laporan Keuangan ({exp.file_format.toUpperCase()})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Periode: {exp.period_label} • {new Date(exp.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>

                <a
                  href={exp.file_url}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">
            Belum ada riwayat export berkas.
          </p>
        )}
      </div>
    </div>
  );
}
