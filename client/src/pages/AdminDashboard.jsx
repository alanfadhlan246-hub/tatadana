import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Cpu, 
  FileText, 
  CreditCard, 
  Eye, 
  Check, 
  X, 
  LogIn, 
  Download, 
  Search,
  Sparkles,
  Lock,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { apiFetch, setAuthToken, setCurrentUser } from '../utils/api';

export default function AdminDashboard({ onImpersonateUser }) {
  const [activeTab, setActiveTab] = useState('applicants'); // 'applicants' | 'users' | 'ai-providers' | 'ai-logs' | 'payments'
  const [users, setUsers] = useState([]);
  const [aiProviders, setAiProviders] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserTxs, setSelectedUserTxs] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // AI Provider Form
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiMode, setAiMode] = useState('failover');
  const [aiModelName, setAiModelName] = useState('gemini-1.5-flash');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, aiRes, logRes, payRes] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/ai-providers'),
        apiFetch('/admin/ai-logs'),
        apiFetch('/admin/payments')
      ]);

      if (uRes.ok && uRes.data.success) setUsers(uRes.data.users);
      if (aiRes.ok && aiRes.data.success) setAiProviders(aiRes.data.providers);
      if (logRes.ok && logRes.data.success) setAiLogs(logRes.data.logs);
      if (payRes.ok && payRes.data.success) setPayments(payRes.data.payments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // 1. APPROVE USER APPLICANT
  const handleApproveUser = async (userId) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/approve`, { method: 'PUT' });
      if (res.ok) {
        showToast(res.data.message || 'Pendaftar berhasil disetujui!');
        loadAdminData();
      } else {
        showToast(res.data.message || 'Gagal menyetujui pendaftar', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // 2. REJECT USER APPLICANT
  const handleRejectUser = async (userId) => {
    const reason = prompt('Masukkan alasan penolakan (opsional):', 'Data belum lengkap');
    if (reason === null) return;

    try {
      const res = await apiFetch(`/admin/users/${userId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ notes: reason })
      });
      if (res.ok) {
        showToast(res.data.message || 'Pendaftar telah ditolak');
        loadAdminData();
      } else {
        showToast(res.data.message || 'Gagal menolak pendaftar', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // 3. IMPERSONATE USER
  const handleImpersonate = async (userId) => {
    if (!window.confirm('Masuk ke mode impersonasi user ini? Anda akan melihat dashboard sebagaimana yang dilihat user tersebut.')) return;
    try {
      const res = await apiFetch('/auth/impersonate', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: userId })
      });

      if (res.ok && res.data.success) {
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        onImpersonateUser();
      } else {
        alert(res.data.message || 'Gagal impersonasi user.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. INSPECT USER TRANSACTIONS
  const handleInspectTransactions = async (userId) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/transactions?reason=Pemeriksaan+Dukungan+Teknis`);
      if (res.ok && res.data.success) {
        setSelectedUserTxs(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. SAVE AI PROVIDER CONFIG
  const handleSaveAiProvider = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/admin/ai-providers', {
        method: 'POST',
        body: JSON.stringify({
          provider_name: selectedProvider,
          api_key: apiKeyInput,
          mode: aiMode,
          model_name: aiModelName,
          is_active: true
        })
      });

      if (res.ok && res.data.success) {
        alert(res.data.message);
        setApiKeyInput('');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. APPROVE PAYMENT
  const handleApprovePayment = async (paymentId) => {
    if (!window.confirm('Setujui pembayaran ini? User akan otomatis di-upgrade ke Paket Pro.')) return;
    try {
      const res = await apiFetch(`/admin/payments/${paymentId}/approve`, { method: 'PUT' });
      if (res.ok) {
        alert(res.data.message);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingApplicants = users.filter(u => u.approval_status === 'pending_approval');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white p-6 rounded-2xl shadow-xl shadow-brand-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-cyan-300" />
            <h1 className="text-xl font-extrabold tracking-tight">Superadmin Control Center</h1>
          </div>
          <p className="text-xs text-brand-200">
            Kelola persetujuan pendaftar baru, multi-provider AI, data transaksi, dan monitoring pembayaran
          </p>
        </div>

        {/* Pending Badge */}
        {pendingApplicants.length > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>{pendingApplicants.length} Pendaftar Butuh Approval</span>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-md transition-all ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {toast.type === 'error' ? <X className="w-4 h-4 text-red-500 shrink-0" /> : <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-brand-100 shadow-sm overflow-x-auto text-xs font-bold text-slate-700">
        {[
          { id: 'applicants', label: `Antrean Approval (${pendingApplicants.length})`, icon: Users },
          { id: 'users', label: 'Semua Pengguna', icon: Users },
          { id: 'ai-providers', label: 'Konfigurasi Multi-AI', icon: Cpu },
          { id: 'ai-logs', label: 'Log Pemanggilan AI', icon: FileText },
          { id: 'payments', label: 'Persetujuan Pembayaran', icon: CreditCard }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold shadow-md shadow-brand-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ANTREAN APPROVAL PENDAFTAR (USER ADDITION) */}
      {activeTab === 'applicants' && (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Antrean Verifikasi Pendaftar Baru</h3>
              <p className="text-xs text-slate-500">
                Pendaftar dengan status 'pending_approval' harus disetujui admin sebelum dapat mengakses aplikasi
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
              {pendingApplicants.length} Menunggu Persetujuan
            </span>
          </div>

          {pendingApplicants.length > 0 ? (
            <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
              {pendingApplicants.map(applicant => (
                <div key={applicant.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{applicant.full_name}</h4>
                    <p className="text-xs text-slate-500">{applicant.email} • 📱 {applicant.phone_number || 'Belum diisi'}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Mendaftar pada: {new Date(applicant.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRejectUser(applicant.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition"
                    >
                      <X className="w-4 h-4" /> Tolak
                    </button>
                    <button
                      onClick={() => handleApproveUser(applicant.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      <Check className="w-4 h-4" /> Setujui (Approve)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              🎉 Semua pendaftar telah diverifikasi. Tidak ada antrean pending.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEMUA PENGGUNA & IMPERSONATION */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Daftar Pengguna Platform</h3>
            <span className="text-xs text-slate-500 font-semibold">{users.length} Total Pengguna</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Status Approval</th>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">Telegram</th>
                  <th className="py-3 px-4">Transaksi</th>
                  <th className="py-3 px-4 text-center">Aksi Superadmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.approval_status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : (u.approval_status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200')
                      }`}>
                        {u.approval_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold capitalize text-slate-700">
                      {u.plan}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-semibold ${
                        u.isTelegramConnected ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {u.isTelegramConnected ? `Terhubung (@${u.telegramUsername || 'bot'})` : 'Belum'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {u.transactionsCount} trx
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleInspectTransactions(u.id)}
                          title="Lihat isi transaksi (Customer Support)"
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleImpersonate(u.id)}
                          title="Mode Impersonasi (Masuk sebagai user ini tanpa login ulang)"
                          className="flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold rounded-lg text-[11px] transition"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Impersonate</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECT TRANSACTIONS MODAL */}
      {selectedUserTxs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-brand-100 p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Inspeksi Transaksi: {selectedUserTxs.user.full_name}
                </h3>
                <p className="text-[11px] text-amber-700 font-semibold">
                  ⚠️ Akses ini dicatat dalam Privacy Audit Log admin untuk menjaga keamanan privasi user.
                </p>
              </div>
              <button onClick={() => setSelectedUserTxs(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {selectedUserTxs.transactions.length > 0 ? (
                selectedUserTxs.transactions.map(t => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{t.notes || 'Transaksi'}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.date).toLocaleDateString('id-ID')} • Sumber: {t.source}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      Rp{Number(t.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-400">User belum memiliki transaksi.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KONFIGURASI MULTI-AI PROVIDER */}
      {activeTab === 'ai-providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provider List */}
          <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Daftar AI Provider Terdaftar</h3>
            <div className="space-y-3">
              {aiProviders.map(p => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-brand-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 capitalize flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-brand-600" />
                      {p.provider_name}
                    </h4>
                    <p className="text-xs text-slate-500">Model: {p.model_name} • Mode: {p.mode}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Key: {p.api_key_masked}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {p.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit AI Provider */}
          <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Perbarui API Key & Model AI</h3>
            <form onSubmit={handleSaveAiProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Provider</label>
                <select
                  value={selectedProvider}
                  onChange={e => {
                    setSelectedProvider(e.target.value);
                    if (e.target.value === 'gemini') setAiModelName('gemini-1.5-flash');
                    if (e.target.value === 'openai') setAiModelName('gpt-4o-mini');
                    if (e.target.value === 'deepseek') setAiModelName('deepseek-chat');
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl font-bold capitalize"
                >
                  <option value="gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="deepseek">DeepSeek AI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  value={aiModelName}
                  onChange={e => setAiModelName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">API Key Terenkripsi</label>
                <input
                  type="password"
                  placeholder="Paste API Key baru disini..."
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mode Eksekusi</label>
                <select
                  value={aiMode}
                  onChange={e => setAiMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
                >
                  <option value="failover">Paralel Failover (Otomatis beralih jika provider utama gagal)</option>
                  <option value="single">Single Provider (Hanya gunakan provider ini)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Simpan Konfigurasi AI
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: AI LOGS */}
      {activeTab === 'ai-logs' && (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900">Riwayat Log Pemanggilan AI</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {aiLogs.map(l => (
              <div key={l.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 capitalize">[{l.provider_used}]</span>
                    <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-bold">
                      {l.endpoint_type}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {l.latency_ms}ms
                    </span>
                  </div>
                  <p className="text-slate-600">Prompt: <i>"{l.prompt_preview}"</i></p>
                  <p className="text-slate-400 font-mono text-[10px] line-clamp-1">{l.response_preview}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(l.created_at).toLocaleTimeString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PERSETUJUAN PEMBAYARAN MIDTRANS & MANUAL */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-brand-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900">Daftar Tagihan & Pembayaran Paket</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {payments.map(p => (
              <div key={p.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{p.order_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'settled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    User: <b>{p.user_name}</b> ({p.user_email}) • Nominal: <b>Rp{Number(p.amount).toLocaleString('id-ID')}</b>
                  </p>
                </div>

                {p.status !== 'settled' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprovePayment(p.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Setujui (Upgrade ke Pro)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
