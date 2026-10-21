import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowRightLeft, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function TransactionModal({ isOpen, onClose, onSuccess, wallets, categories }) {
  const [type, setType] = useState('expense'); // 'expense' | 'income' | 'transfer'
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [showItemBreakdown, setShowItemBreakdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      const defaultWal = wallets.find(w => w.is_default) || wallets[0];
      setWalletId(defaultWal.id);
      if (wallets.length > 1) {
        const otherWal = wallets.find(w => w.id !== defaultWal.id) || wallets[1];
        setToWalletId(otherWal.id);
      }
    }
    if (categories.length > 0 && !categoryId) {
      const firstCat = categories.find(c => c.type === 'expense') || categories[0];
      setCategoryId(firstCat.id);
    }
  }, [wallets, categories, isOpen]);

  if (!isOpen) return null;

  const addItemRow = () => {
    setItems(prev => [...prev, { item_name: '', price: '', quantity: 1 }]);
  };

  const removeItemRow = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx, field, val) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx][field] = val;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }

    setLoading(true);

    try {
      if (type === 'transfer') {
        const res = await apiFetch('/wallets/transfer', {
          method: 'POST',
          body: JSON.stringify({
            from_wallet_id: walletId,
            to_wallet_id: toWalletId,
            amount: numAmount,
            notes
          })
        });
        if (res.ok && res.data.success) {
          window.dispatchEvent(new CustomEvent('tatadana:data_updated', { detail: res.data }));
          onSuccess();
          onClose();
        } else {
          setError(res.data.message || 'Transfer gagal.');
        }
      } else {
        const payload = {
          wallet_id: walletId,
          category_id: categoryId,
          type,
          amount: numAmount,
          date,
          notes,
          items: showItemBreakdown ? items.filter(it => it.item_name && Number(it.price) > 0) : []
        };

        const res = await apiFetch('/transactions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.ok && res.data.success) {
          window.dispatchEvent(new CustomEvent('tatadana:data_updated', { detail: res.data }));
          onSuccess();
          onClose();
        } else {
          setError(res.data.message || 'Gagal menyimpan transaksi.');
        }
      }
    } catch {
      setError('Terjadi kendala jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-brand-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-200" />
            <h3 className="font-bold text-base tracking-wide">Catat Transaksi Baru</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'expense'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💸 Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💰 Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'transfer'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔄 Transfer
            </button>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-600">
                Rp
              </span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full pl-11 pr-4 py-2.5 text-base font-bold text-slate-800 bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Normal Transaction Fields */}
          {type !== 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dompet
                </label>
                <select
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                >
                  {wallets.map(wal => (
                    <option key={wal.id} value={wal.id}>
                      👛 {wal.name} (Rp{Number(wal.balance).toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Transfer Fields */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dari Dompet
                </label>
                <select
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                >
                  {wallets.map(wal => (
                    <option key={wal.id} value={wal.id}>
                      {wal.name} (Rp{Number(wal.balance).toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ke Dompet
                </label>
                <select
                  value={toWalletId}
                  onChange={e => setToWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                >
                  {wallets.map(wal => (
                    <option key={wal.id} value={wal.id}>
                      {wal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Makan siang bakso urat"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Multi-Item Breakdown Toggle (For Struk Belanja / Receipt) */}
          {type === 'expense' && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Rincian Barang / Struk (Opsional)</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemBreakdown(!showItemBreakdown);
                    if (!showItemBreakdown && items.length === 0) {
                      addItemRow();
                    }
                  }}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  {showItemBreakdown ? 'Tutup Rincian' : '+ Tambah Rincian Item'}
                </button>
              </div>

              {showItemBreakdown && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-brand-100">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama barang"
                        value={it.item_name}
                        onChange={e => updateItemRow(idx, 'item_name', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-brand-200 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Harga"
                        value={it.price}
                        onChange={e => updateItemRow(idx, 'price', e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-xs bg-white border border-brand-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah baris barang
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/25 transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
