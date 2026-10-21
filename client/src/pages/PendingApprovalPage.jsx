import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, RefreshCw, LogOut, CheckCircle, Mail, MessageSquare } from 'lucide-react';
import { apiFetch, getCurrentUser, setCurrentUser } from '../utils/api';

export default function PendingApprovalPage({ onApproved, onLogout }) {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const user = getCurrentUser() || {};

  // Auto-polling check status every 3 seconds so the user automatically enters dashboard upon admin approval
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/auth/me');
        if (isMounted && res.ok && res.data.success) {
          const updated = res.data.user;
          setCurrentUser(updated);
          if (updated.approval_status === 'approved') {
            clearInterval(interval);
            onApproved();
          } else if (updated.approval_status === 'rejected') {
            setStatusMessage('❌ Maaf, pendaftaran akun Anda ditolak oleh admin.');
          }
        }
      } catch (err) {
        // silent polling catch
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onApproved]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage('');
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok && res.data.success) {
        const updated = res.data.user;
        setCurrentUser(updated);
        if (updated.approval_status === 'approved') {
          onApproved();
        } else if (updated.approval_status === 'rejected') {
          setStatusMessage('❌ Maaf, pendaftaran akun Anda ditolak oleh admin.');
        } else {
          setStatusMessage('⏳ Akun Anda masih dalam antrean review oleh Super Admin.');
        }
      }
    } catch {
      setStatusMessage('Gagal memeriksa status. Coba lagi beberapa saat.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      <div className="bg-white border border-brand-100 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Badge Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30 animate-pulse">
          <Clock className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Menunggu Persetujuan Admin
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            Pendaftaran Berhasil!
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Halo <b>{user.full_name}</b>, demi menjaga integritas dan keamanan ekosistem finansial TataDana, akun pendaftar baru diverifikasi terlebih dahulu oleh Super Admin.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 bg-brand-50 border border-brand-200 text-brand-900 text-xs font-semibold rounded-xl">
            {statusMessage}
          </div>
        )}

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Email Terdaftar:</span>
            <span className="font-bold text-slate-800">{user.email}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Nomor HP:</span>
            <span className="font-bold text-slate-800">{user.phone_number || '-'}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Status Akun:</span>
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Pending Review
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Memeriksa status...' : 'Cek Status Persetujuan'}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Butuh persetujuan cepat untuk uji coba? Hubungi admin via Telegram atau email ke <b>support@tatadana.id</b>
        </p>
      </div>
    </div>
  );
}
