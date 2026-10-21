import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowRightLeft, Star, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import { apiFetch, getCurrentUser } from '../utils/api';

export default function WalletsPage({ wallets, onRefreshWallets, onOpenTransfer }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = getCurrentUser() || {};
  const isStarter = user.plan === 'starter';
  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama dompet wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/wallets', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          type,
          balance: Number(balance) || 0,
          color,
          is_default: isDefault
        })
      });

      if (res.ok && res.data.success) {
        setShowAddModal(false);
        setName('');
        setBalance('');
        onRefreshWallets();
      } else {
        setError(res.data.message || 'Gagal menambahkan dompet baru.');
      }
    } catch {
      setError('Terjadi kendala koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (walletId) => {
    try {
      const res = await apiFetch(`/wallets/${walletId}/default`, { method: 'PUT' });
      if (res.ok) {
        onRefreshWallets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (!window.confirm('Yakin ingin menghapus dompet ini?')) return;
    try {
      const res = await apiFetch(`/wallets/${walletId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshWallets();
      } else {
        alert(res.data.message || 'Gagal menghapus dompet.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-brand-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            👛 Manajemen Multi-Dompet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola rekening bank, e-wallet, dan uang tunai Anda dalam satu aplikasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            <ArrowRightLeft className="w-4 h-4 text-brand-600" />
            <span>Transfer Antar Dompet</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Dompet Baru</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white shadow-xl shadow-brand-800/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
            Total Kekayaan Likuid
          </span>
          <p className="text-3xl font-extrabold tracking-tight mt-1 text-white">
            Rp{totalBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-brand-100 mt-1">
            Terdistribusi di {wallets.length} dompet aktif
          </p>
        </div>
        <div className="p-3 bg-white/10 backdrop-blur rounded-xl border border-white/20 text-xs">
          <p className="font-bold text-cyan-100 mb-0.5">⭐ Dompet Default Telegram:</p>
          <p className="text-brand-100">
            {wallets.find(w => w.is_default)?.name || 'Belum diatur'}
          </p>
        </div>
      </div>

      {/* Starter Plan Notice */}
      {isStarter && wallets.length >= 3 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
          <span>Anda telah menggunakan kuota maksimal 3 dompet paket Starter. Upgrade ke Pro untuk dompet tak terbatas!</span>
          <button className="font-bold underline text-brand-700 ml-2">Upgrade Pro</button>
        </div>
      )}

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map(w => (
          <div
            key={w.id}
            className="p-5 rounded-2xl bg-white border border-brand-100 shadow-sm hover:shadow-md transition space-y-4 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: w.color || '#0284c7' }}
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-base shadow-sm"
                >
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{w.name}</h4>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {w.type === 'bank' ? 'Rekening Bank' : (w.type === 'ewallet' ? 'E-Wallet' : 'Tunai / Cash')}
                  </span>
                </div>
              </div>

              {w.is_default ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-full border border-brand-200">
                  <Star className="w-3 h-3 fill-brand-600 text-brand-600" /> Default Telegram
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(w.id)}
                  title="Jadikan default transaksi Telegram"
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-slate-500 hover:text-brand-600 transition"
                >
                  Set Default
                </button>
              )}
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Saldo Tersedia</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                Rp{Number(w.balance).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                ID: {w.id.slice(0, 8)}...
              </span>
              <button
                onClick={() => handleDeleteWallet(w.id)}
                className="text-slate-300 hover:text-red-500 transition p-1"
                title="Hapus Dompet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add New Wallet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-brand-100 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Buat Dompet Baru</h3>

            {error && (
              <p className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
                {error}
              </p>
            )}

            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Dompet</label>
                <input
                  type="text"
                  placeholder="Contoh: BCA Payroll, GoPay, Dompet Saku"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
                  >
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Uang Tunai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warna Kartu</label>
                  <select
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl font-medium"
                  >
                    <option value="#0284c7">Biru Ocean</option>
                    <option value="#0369a1">Biru Navy</option>
                    <option value="#38bdf8">Biru Sky</option>
                    <option value="#059669">Emerald</option>
                    <option value="#64748b">Slate Gray</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-brand-200 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  Jadikan dompet default untuk pencatatan via Telegram
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Dompet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
