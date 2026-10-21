import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  ArrowUpDown, 
  FileText, 
  Receipt,
  Download
} from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function TransactionsPage({ onOpenNewTransaction, wallets, categories }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedReceipts, setExpandedReceipts] = useState({});

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 15,
        sort: sortOrder,
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterCategory !== 'all' && { category_id: filterCategory }),
        ...(filterWallet !== 'all' && { wallet_id: filterWallet }),
        ...(search && { search })
      });

      const res = await apiFetch(`/transactions?${query.toString()}`);
      if (res.ok && res.data.success) {
        setTransactions(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();

    const handleDataUpdated = () => {
      loadTransactions();
    };

    window.addEventListener('tatadana:data_updated', handleDataUpdated);
    return () => {
      window.removeEventListener('tatadana:data_updated', handleDataUpdated);
    };
  }, [page, sortOrder, filterType, filterCategory, filterWallet]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const toggleExpandReceipt = (id) => {
    setExpandedReceipts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini? Saldo dompet akan disesuaikan otomatis.')) return;
    try {
      const res = await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-brand-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            💳 Manajemen Transaksi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap seluruh pemasukan, pengeluaran, dan transfer antar dompet Anda
          </p>
        </div>
        <button
          onClick={onOpenNewTransaction}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Transaksi Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-brand-100 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari catatan transaksi (misal: bakso, bensin, gaji)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="w-full md:w-36 px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="w-full md:w-44 px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>

          {/* Wallet Filter */}
          <select
            value={filterWallet}
            onChange={e => { setFilterWallet(e.target.value); setPage(1); }}
            className="w-full md:w-40 px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>
                👛 {w.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-50/70 border-b border-brand-100 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tipe & Kategori</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4">Dompet</th>
                <th className="py-3 px-4 text-right cursor-pointer" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                  <span className="inline-flex items-center gap-1 hover:text-brand-600">
                    Nominal <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat riwayat transaksi...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map(tx => {
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';
                  const hasReceiptItems = tx.receipt_items_count > 0 && tx.items?.length > 0;
                  const isExpanded = expandedReceipts[tx.id];

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50/70 transition">
                        {/* Date */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Category & Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{tx.category_emoji || '🏷️'}</span>
                            <div>
                              <p className="font-bold text-slate-800">{tx.category_name}</p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                isExpense ? 'bg-red-50 text-red-600' : (isTransfer ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-600')
                              }`}>
                                {isExpense ? 'Pengeluaran' : (isTransfer ? 'Transfer' : 'Pemasukan')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Notes & Receipt Expand Button */}
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-800 line-clamp-1">{tx.notes}</p>
                          {hasReceiptItems && (
                            <button
                              onClick={() => toggleExpandReceipt(tx.id)}
                              className="mt-1 flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 transition"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>{hasReceiptItems ? `${tx.items.length} Rincian Item Struk` : ''}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </td>

                        {/* Wallet */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">👛 {tx.wallet_name}</span>
                          {tx.to_wallet_name && (
                            <span className="text-slate-400 block text-[10px]">
                              ➔ {tx.to_wallet_name}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className={`font-extrabold text-sm ${
                            isExpense ? 'text-slate-900' : (isTransfer ? 'text-brand-700' : 'text-emerald-600')
                          }`}>
                            {isExpense ? '-' : (isTransfer ? '⇄ ' : '+')}Rp{Number(tx.amount).toLocaleString('id-ID')}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            title="Hapus Transaksi"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Multi-Item Receipt Breakdown */}
                      {hasReceiptItems && isExpanded && (
                        <tr className="bg-brand-50/40">
                          <td colSpan="6" className="p-4">
                            <div className="bg-white rounded-xl border border-brand-200 p-3 space-y-2 max-w-2xl mx-auto">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-xs text-brand-900 flex items-center gap-1.5">
                                  <Receipt className="w-4 h-4 text-brand-600" />
                                  Rincian Item Struk Pembelanjaan
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Total {tx.items.length} barang
                                </span>
                              </div>
                              <div className="divide-y divide-slate-100">
                                {tx.items.map((it, idx) => (
                                  <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                    <span className="text-slate-700 font-medium">
                                      {it.item_name} {it.quantity > 1 ? `(${it.quantity}x)` : ''}
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      Rp{Number(it.price).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-brand-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-white border border-brand-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 bg-white border border-brand-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
