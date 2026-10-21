import React, { useState, useEffect } from 'react';
import { Target, Plus, AlertTriangle, AlertCircle, CheckCircle, Trash2, Calendar, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function BudgetsPage({ categories }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('monthly'); // 'daily' | 'weekly' | 'monthly'
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/budgets');
      if (res.ok && res.data.success) {
        setBudgets(res.data.budgets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!selectedCategory || !numAmount || numAmount <= 0) {
      setError('Pilih kategori dan masukkan target budget yang valid.');
      return;
    }

    try {
      const res = await apiFetch('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          category_id: selectedCategory,
          period_type: activePeriod,
          amount: numAmount
        })
      });

      if (res.ok && res.data.success) {
        setShowModal(false);
        setAmount('');
        loadBudgets();
      } else {
        setError(res.data.message || 'Gagal menyimpan budget.');
      }
    } catch {
      setError('Terjadi kendala jaringan.');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Hapus target budget ini?')) return;
    try {
      await apiFetch(`/budgets/${id}`, { method: 'DELETE' });
      loadBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBudgets = budgets.filter(b => b.period_type === activePeriod);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-brand-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            🎯 Target & Anggaran Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kendalikan pengeluaran harian, mingguan, dan bulanan agar tidak overbudget
          </p>
        </div>
        <button
          onClick={() => {
            if (categories.length > 0) setSelectedCategory(categories[0].id);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Target Budget</span>
        </button>
      </div>

      {/* Period Tabs: Harian, Mingguan, Bulanan */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-brand-100 shadow-sm">
        {[
          { id: 'daily', label: '📅 Budget Harian', desc: 'Kontrol uang jajan harian' },
          { id: 'weekly', label: '🗓️ Budget Mingguan', desc: 'Pantau per minggu belanja' },
          { id: 'monthly', label: '📊 Budget Bulanan', desc: 'Target primer bulanan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePeriod(tab.id)}
            className={`flex-1 py-3 px-4 rounded-xl text-center transition ${
              activePeriod === tab.id
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold shadow-md shadow-brand-500/20'
                : 'text-slate-600 hover:bg-slate-100 font-semibold'
            }`}
          >
            <p className="text-xs sm:text-sm">{tab.label}</p>
            <p className={`text-[10px] hidden sm:block ${activePeriod === tab.id ? 'text-cyan-100' : 'text-slate-400'}`}>
              {tab.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Telegram Alert Notification Info */}
      <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 flex items-center gap-3 text-xs text-brand-900">
        <Sparkles className="w-5 h-5 text-brand-600 shrink-0" />
        <p>
          <b>Notifikasi Otomatis Telegram Aktif:</b> Bot TataDana akan langsung mengirimkan peringatan khusus ke chat Telegram Anda saat budget mencapai <b>80%</b> dan <b>100%</b>!
        </p>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBudgets.length > 0 ? (
          filteredBudgets.map(b => {
            const isWarning = b.percentage >= 80 && b.percentage < 100;
            const isOver = b.percentage >= 100;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl bg-white border transition shadow-sm hover:shadow-md ${
                  isOver 
                    ? 'border-red-300 ring-1 ring-red-200' 
                    : (isWarning ? 'border-amber-300 ring-1 ring-amber-100' : 'border-brand-100')
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{b.category_emoji || '🏷️'}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{b.category_name}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Periode {b.period_type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-1.5 my-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Terpakai</span>
                    <span className={isOver ? 'text-red-600' : (isWarning ? 'text-amber-600' : 'text-brand-600')}>
                      {b.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-red-500' : (isWarning ? 'bg-amber-400' : 'bg-brand-500')
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Amount Info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Telah Dibelanjakan</span>
                    <span className="font-extrabold text-slate-900">
                      Rp{Number(b.spent).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Target Batas</span>
                    <span className="font-extrabold text-brand-700">
                      Rp{Number(b.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mt-3">
                  {isOver ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Overbudget! Kurangi pengeluaran kategori ini.</span>
                    </div>
                  ) : isWarning ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Mencapai 80%! Waspada jangan boros.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Aman — Sisa Rp{Number(b.remaining).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-brand-100">
            <Target className="w-12 h-12 text-brand-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">Belum Ada Target Budget {activePeriod}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Tentukan batas maksimal belanja untuk kategori pilihan Anda agar keuangan tetap terkendali.
            </p>
            <button
              onClick={() => {
                if (categories.length > 0) setSelectedCategory(categories[0].id);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-700 transition"
            >
              + Pasang Budget Baru
            </button>
          </div>
        )}
      </div>

      {/* Modal Add Budget */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-brand-100 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Pasang Target Budget ({activePeriod})</h3>

            {error && (
              <p className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
                {error}
              </p>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kategori</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Batas Anggaran (Rp)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Contoh: 1500000"
                  required
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-brand-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
