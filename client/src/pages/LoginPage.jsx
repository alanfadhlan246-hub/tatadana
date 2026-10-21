import React, { useState } from 'react';
import { LogIn, Phone, Mail, Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiFetch, setAuthToken, setCurrentUser } from '../utils/api';

export default function LoginPage({ onLoginSuccess, onNavigateRegister, onNavigateLanding }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });

      if (res.ok && res.data.success) {
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        onLoginSuccess(res.data.user);
      } else {
        setError(res.data.message || 'Login gagal. Periksa kembali akun Anda.');
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
        {/* Glow orb */}
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
            ✨ Fintech Platform Indonesia
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Keuanganmu. <br />
            <span className="text-cyan-300">Terkontrol Penuh.</span>
          </h1>
          <p className="text-sm text-brand-100 max-w-md leading-relaxed">
            Catat setiap pemasukan dan pengeluaran Anda semudah berkirim pesan di Telegram. Terintegrasi AI presisi, budgeting multi-dimensi, dan laporan on-demand.
          </p>

          <div className="space-y-3 pt-4 text-xs font-medium text-brand-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Multi-Wallet (BCA, Mandiri, Cash, GoPay, OVO)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Input via Teks Natural, Foto Struk, & Voice Note</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Tata AI Financial Advisor Aktif 24/7</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-brand-300">
          © 2026 PT TataDana Keuangan Nusantara. All rights reserved.
        </p>
      </div>

      {/* Right Form Panel (60%) */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan Email atau Nomor HP yang terdaftar di TataDana
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
                Email atau Nomor HP
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="user@tatadana.id atau 081234567890"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Belum punya akun?{' '}
              <button
                onClick={onNavigateRegister}
                className="font-bold text-brand-600 hover:text-brand-800 transition"
              >
                Daftar Gratis di Sini
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
