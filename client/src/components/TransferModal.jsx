import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function TransferModal({ isOpen, onClose, onSuccess, wallets }) {
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');

    const num = Number(amount);
    if (!fromWalletId || !toWalletId || !num || num <= 0) {
      setError('Pilih dompet asal, tujuan, dan nominal transfer.');
      return;
    }

    if (fromWalletId === toWalletId) {
      setError('Dompet asal dan tujuan tidak boleh sama.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/wallets/transfer', {
        method: 'POST',
        body: JSON.stringify({
          from_wallet_id: fromWalletId,
          to_wallet_id: toWalletId,
          amount: num,
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
    } catch {
      setError('Kendala koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-brand-100 p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-base text-slate-900">Transfer Antar Dompet</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dari Dompet</label>
              <select
                value={fromWalletId}
                onChange={e => setFromWalletId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl font-semibold"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Rp{Number(w.balance).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ke Dompet</label>
              <select
                value={toWalletId}
                onChange={e => setToWalletId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl font-semibold"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-brand-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Top up e-wallet dari BCA"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Kirim Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
