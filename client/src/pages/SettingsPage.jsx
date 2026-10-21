import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bot, 
  Bell, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  Trash2,
  Plus
} from 'lucide-react';
import { apiFetch, getCurrentUser, setCurrentUser } from '../utils/api';

export default function SettingsPage({ categories, onRefreshCategories, onRefreshTelegramStatus }) {
  const [activeTab, setActiveTab] = useState('telegram'); // 'profile' | 'telegram' | 'reminders' | 'categories'
  const [profile, setProfile] = useState({ full_name: '', email: '', currency: 'IDR' });
  const [telegramConfig, setTelegramConfig] = useState({ isConnected: false, botUsername: null });
  const [botTokenInput, setBotTokenInput] = useState('');
  const [testingToken, setTestingToken] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Reminders state
  const [reminders, setReminders] = useState({
    enabled: true,
    frequency: 1,
    time1: '09:00',
    time2: '20:00'
  });
  const [reminderSavedMsg, setReminderSavedMsg] = useState('');

  // Category custom
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🛍️');
  const [newCatType, setNewCatType] = useState('expense');

  const loadSettings = async () => {
    try {
      const res = await apiFetch('/settings');
      if (res.ok && res.data.success) {
        setProfile(res.data.profile);
        setTelegramConfig(res.data.telegram);
        setReminders({
          enabled: res.data.profile.reminder_enabled,
          frequency: res.data.profile.reminder_frequency || 1,
          time1: (res.data.profile.reminder_time_1 || '09:00:00').slice(0, 5),
          time2: (res.data.profile.reminder_time_2 || '20:00:00').slice(0, 5)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 1. TEST TELEGRAM BOT CONNECTION & SET WEBHOOK
  const handleTestConnection = async (e) => {
    e.preventDefault();
    if (!botTokenInput.trim()) return;

    setTestingToken(true);
    setTestResult(null);

    try {
      const res = await apiFetch('/telegram/test-connection', {
        method: 'POST',
        body: JSON.stringify({ token: botTokenInput.trim() })
      });

      if (res.ok && res.data.success) {
        setTestResult({
          type: 'success',
          message: res.data.message,
          botUsername: res.data.bot.username
        });
        setTelegramConfig({ isConnected: true, botUsername: res.data.bot.username });
        setBotTokenInput('');
        onRefreshTelegramStatus();
      } else {
        setTestResult({
          type: 'error',
          message: res.data.message || 'Token tidak valid atau tidak dapat dihubungi.'
        });
      }
    } catch {
      setTestResult({
        type: 'error',
        message: 'Terjadi kendala jaringan saat menghubungi server.'
      });
    } finally {
      setTestingToken(false);
    }
  };

  const handleDisconnectBot = async () => {
    if (!window.confirm('Putuskan koneksi bot Telegram?')) return;
    try {
      await apiFetch('/telegram/disconnect', { method: 'POST' });
      setTelegramConfig({ isConnected: false, botUsername: null });
      setTestResult(null);
      onRefreshTelegramStatus();
    } catch (err) {
      console.error(err);
    }
  };

  // 2. UPDATE PROFILE
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profile.full_name,
          currency: profile.currency
        })
      });
      if (res.ok) {
        alert('Profil berhasil diperbarui!');
        const cur = getCurrentUser();
        if (cur) {
          cur.full_name = profile.full_name;
          setCurrentUser(cur);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. UPDATE REMINDERS
  const handleSaveReminders = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/settings/reminders', {
        method: 'PUT',
        body: JSON.stringify({
          reminder_enabled: reminders.enabled,
          reminder_frequency: reminders.frequency,
          reminder_time_1: reminders.time1 + ':00',
          reminder_time_2: reminders.time2 + ':00'
        })
      });
      if (res.ok) {
        setReminderSavedMsg('Preferensi reminder berhasil disimpan!');
        setTimeout(() => setReminderSavedMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. ADD CUSTOM CATEGORY
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCatName.trim(),
          emoji: newCatEmoji,
          type: newCatType
        })
      });
      if (res.ok) {
        setNewCatName('');
        onRefreshCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      const res = await apiFetch(`/categories/${catId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshCategories();
      } else {
        alert(res.data.message || 'Gagal menghapus kategori.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-brand-100 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          ⚙️ Pengaturan & Integrasi
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Atur koneksi Bot Telegram, jadwal reminder, profil akun, dan kategori transaksi Anda
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-brand-100 shadow-sm overflow-x-auto text-xs font-bold text-slate-700">
        {[
          { id: 'telegram', label: '🤖 Telegram Bot', icon: Bot },
          { id: 'profile', label: '👤 Profil & Akun', icon: User },
          { id: 'reminders', label: '⏰ Jadwal Reminder', icon: Bell },
          { id: 'categories', label: '🏷️ Kelola Kategori', icon: Tag }
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

      {/* TAB 1: TELEGRAM BOT SETUP (PART 5 SPECIFICATION) */}
      {activeTab === 'telegram' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Setup Token & Test Connection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Hubungkan Bot Telegram Anda</h3>
                  <p className="text-xs text-slate-500">Mencatat keuangan semudah mengirim pesan chat</p>
                </div>

                {/* Real-time Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  telegramConfig.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${telegramConfig.isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span>{telegramConfig.isConnected ? `🟢 Terhubung @${telegramConfig.botUsername}` : '🔴 Tidak Terhubung'}</span>
                </div>
              </div>

              {/* Status alerts */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  testResult.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {testResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Form Input Token */}
              <form onSubmit={handleTestConnection} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Telegram Bot Token dari @BotFather
                  </label>
                  <input
                    type="password"
                    placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    value={botTokenInput}
                    onChange={e => setBotTokenInput(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Token Anda disimpan terenkripsi secara aman dan hanya digunakan untuk menerima webhook update transaksi.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={testingToken || !botTokenInput.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/25 transition disabled:opacity-50"
                  >
                    {testingToken ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>⏳ Testing & Mendaftarkan Webhook...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>Test Koneksi & Aktifkan Bot</span>
                      </>
                    )}
                  </button>

                  {telegramConfig.isConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnectBot}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition"
                    >
                      Putuskan Bot
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Col: Step-by-Step Guide from @BotFather */}
          <div className="p-6 bg-brand-50/70 border border-brand-200 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm text-brand-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              Panduan Menghubungkan Bot
            </h4>
            <ol className="space-y-3 text-xs text-slate-700 font-medium">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Buka Telegram dan cari akun resmi <b>@BotFather</b>.</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>Kirim perintah <code>/newbot</code> dan ikuti instruksi penamaan bot Anda.</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>Copy <b>API Token</b> yang diberikan @BotFather.</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                <span>Paste ke input di samping lalu klik tombol <b>"Test Koneksi"</b>.</span>
              </li>
            </ol>
            <div className="pt-2 border-t border-brand-200">
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 border border-brand-200 text-brand-700 font-bold text-xs rounded-xl shadow-sm transition"
              >
                <span>Buka @BotFather di Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE & AKUN */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900">Informasi Profil Pengguna</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Terdaftar</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Uang Default</label>
              <select
                value={profile.currency}
                onChange={e => setProfile({ ...profile, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
              >
                <option value="IDR">Rupiah Indonesia (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="SGD">Singapore Dollar (SGD)</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Simpan Profil
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REMINDERS (PART 4.8 SPECIFICATION) */}
      {activeTab === 'reminders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Jadwal Reminder Harian via Telegram</h3>
            <p className="text-xs text-slate-500">
              Notifikasi ramah untuk mengingatkan Anda mencatat pengeluaran harian (maksimal 2x sehari).
            </p>

            {reminderSavedMsg && (
              <p className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                {reminderSavedMsg}
              </p>
            )}

            <form onSubmit={handleSaveReminders} className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminders.enabled}
                  onChange={e => setReminders({ ...reminders, enabled: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-bold text-slate-700">Aktifkan Reminder Otomatis</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Frekuensi Reminder</label>
                <select
                  value={reminders.frequency}
                  onChange={e => setReminders({ ...reminders, frequency: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
                >
                  <option value={1}>1x Sehari</option>
                  <option value={2}>2x Sehari (Pagi & Malam)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Reminder 1</label>
                  <input
                    type="time"
                    value={reminders.time1}
                    onChange={e => setReminders({ ...reminders, time1: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
                  />
                </div>
                {reminders.frequency === 2 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Reminder 2</label>
                    <input
                      type="time"
                      value={reminders.time2}
                      onChange={e => setReminders({ ...reminders, time2: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Simpan Jadwal Reminder
              </button>
            </form>
          </div>

          {/* Reminder Preview Box */}
          <div className="bg-brand-50/60 p-6 rounded-2xl border border-brand-200 space-y-3">
            <h4 className="font-bold text-sm text-brand-950">📱 Preview Pesan Telegram:</h4>
            <div className="bg-white p-4 rounded-xl border border-brand-100 shadow-sm text-xs font-sans leading-relaxed text-slate-800 space-y-2">
              <p className="font-bold text-slate-900">⏰ Reminder Keuangan!</p>
              <p>Jangan lupa catat pengeluaran hari ini ya 📝</p>
              <p>Pencatatan rutin = keuangan lebih terkontrol 💪</p>
              <p className="text-brand-600 font-semibold pt-1">👉 Ketik transaksimu sekarang!</p>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Pesan di atas akan dikirimkan otomatis ke chat Telegram Anda sesuai jam yang ditentukan.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA KATEGORI */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-3">+ Tambah Kategori Kustom Baru</h3>
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Emoji (misal: 🍔, ⚡, 🎮)"
                value={newCatEmoji}
                onChange={e => setNewCatEmoji(e.target.value)}
                className="w-full sm:w-20 px-3 py-2 text-center text-sm bg-slate-50 border border-brand-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Nama kategori baru..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
              />
              <select
                value={newCatType}
                onChange={e => setNewCatType(e.target.value)}
                className="w-full sm:w-36 px-3 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Simpan Kategori
              </button>
            </form>
          </div>

          {/* Category List */}
          <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-4">Daftar Kategori Tersedia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(c => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 rounded-xl border border-brand-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{c.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {c.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'} {c.is_system && '• Bawaan'}
                      </span>
                    </div>
                  </div>
                  {!c.is_system && (
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
