import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiFetch, setAuthToken, setCurrentUser } from '../utils/api';

export default function RegisterPage({ onRegisterSuccess, onNavigateLogin, onNavigateLanding }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !phone) {
      setError('Mohon lengkapi semua kolom pendaftaran.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phone.trim(),
          password
        })
      });

      if (res.ok && res.data.success) {
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        onRegisterSuccess(res.data.user);
      } else {
        setError(res.data.message || 'Pendaftaran gagal.');
      }
    } catch {
      setError('Terjadi kendala jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Left Branding Panel (40%) - Desktop Only */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-tr from-brand-950 via-brand-800 to-brand-700 p-12 text-white flex-col justify-between relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <button 
            onClick={onNavigateLanding}
            className="flex items-center gap-3 text-white font-extrabold text-2xl tracking-tight"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-cyan-300">
              T
            </div>
            <span>TataDana</span>
          </button>
        </div>

        <div className="space-y-6 my-auto">
          <span className="px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-cyan-200">
            🚀 Bergabung Bersama TataDana
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Mulai Kendalikan <br />
            <span className="text-cyan-300">Masa Depan Uangmu.</span>
          </h1>
          <p className="text-sm text-brand-100 max-w-md leading-relaxed">
            Daftar dalam 1 menit. Sistem otomatis menyiapkan dompet default, kategori AI cerdas, dan integrasi Bot Telegram siap pakai.
          </p>

          <div className="space-y-3 pt-4 text-xs font-medium text-brand-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Gratis akun Starter dengan 50 transaksi/bulan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Verifikasi pendaftaran aman oleh admin</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Koneksi instan ke Telegram Bot tanpa aplikasi tambahan</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-brand-300">
          © 2026 PT TataDana Keuangan Nusantara.
        </p>
      </div>

      {/* Right Form Panel (60%) */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Buat Akun TataDana Baru
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Isi data di bawah ini untuk memulai pencatatan keuangan modern
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Budi Pratama"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="budi@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor HP (WhatsApp / Telegram)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-sm font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Nomor ini dipakai sebagai kunci autentikasi link akun ke Bot Telegram.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Sudah punya akun?{' '}
              <button
                onClick={onNavigateLogin}
                className="font-bold text-brand-600 hover:text-brand-800 transition"
              >
                Masuk di Sini
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
