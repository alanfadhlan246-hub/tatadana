import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Receipt, 
  FileSpreadsheet, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  X,
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Play, 
  Star,
  Wallet,
  Clock,
  Zap,
  HelpCircle
} from 'lucide-react';

export default function LandingPage({ onNavigateLogin, onNavigateRegister }) {
  const [pricingCycle, setPricingCycle] = useState('lifetime'); // 'monthly' | 'lifetime'
  const [openFaq, setOpenFaq] = useState(null);

  // Interactive Telegram Chat Demo State
  const [demoChatInput, setDemoChatInput] = useState('beli kopi kenangan 25rb');
  const [demoChatMessages, setDemoChatMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'makan siang nasi padang 35rb'
    },
    {
      id: 2,
      sender: 'bot',
      text: `📅 Rabu, 21 Oktober 2026 — 13:30 WIB
💸 <b>Pengeluaran tercatat!</b>
├ Nominal : Rp35.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 BCA Utama
├ Catatan : makan siang nasi padang
└ Saldo : Rp7.465.000

📊 <b>Budget Makanan bulan ini:</b>
██████░░░░ 60% — sisa Rp800.000
💪 <i>Hemat dan nikmati makan siangmu!</i>`
    }
  ]);

  const handleSendDemoMessage = (e) => {
    e.preventDefault();
    if (!demoChatInput.trim()) return;

    const userText = demoChatInput;
    const newMsg = { id: Date.now(), sender: 'user', text: userText };

    let replyText = `📅 Rabu, 21 Oktober 2026 — 13:35 WIB\n💸 <b>Pengeluaran tercatat!</b>\n├ Nominal : Rp25.000\n├ Kategori : 🍜 Makanan & Minuman\n├ Dompet : 👛 BCA Utama\n├ Catatan : ${userText}\n└ Saldo : Rp7.440.000\n\n📊 <b>Budget Makanan bulan ini:</b>\n███████░░░ 65% — sisa Rp775.000`;

    if (userText.toLowerCase().includes('gaji') || userText.toLowerCase().includes('5jt')) {
      replyText = `📅 Rabu, 21 Oktober 2026 — 13:35 WIB\n💰 <b>Pemasukan tercatat!</b>\n├ Nominal : Rp5.000.000\n├ Kategori : 💼 Gaji Pokok\n├ Dompet : 👛 BCA Utama\n└ Saldo baru : Rp12.440.000\n\n💪 <i>Semangat terus! Jangan lupa sisihkan untuk tabungan ya.</i>`;
    }

    setDemoChatMessages(prev => [
      ...prev,
      newMsg,
      { id: Date.now() + 1, sender: 'bot', text: replyText }
    ]);
    setDemoChatInput('');
  };

  const faqList = [
    {
      q: 'Bagaimana cara kerja pencatatan via Telegram Bot TataDana?',
      a: 'Sangat mudah! Anda cukup menghubungkan bot Telegram TataDana dengan token atau nomor HP Anda. Setelah itu, setiap kali Anda mengetik pesan seperti "beli bakso 15rb", bot otomatis memprosesnya menggunakan AI dan memasukkannya ke pembukuan dashboard Anda.'
    },
    {
      q: 'Apakah saya bisa mengirimkan foto struk belanja di paket Starter?',
      a: 'Fitur ekstraksi foto struk otomatis (AI Vision OCR multi-item) eksklusif untuk paket TataDana Pro. Namun, pengguna paket Starter tetap dapat mencatat pengeluaran secara tak terbatas melalui teks natural di Telegram.'
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di TataDana?',
      a: 'Data Anda 100% tersimpan aman di database PostgreSQL Supabase dengan enkripsi tingkat bank dan Row Level Security (RLS). Tidak ada pihak ketiga yang dapat mengakses catatan keuangan pribadi Anda.'
    },
    {
      q: 'Apakah TataDana mendukung timezone waktu Indonesia (WIB)?',
      a: 'Ya, 100%! Seluruh pencatatan transaksi, jadwal reminder harian, dan reply pesan Telegram disesuaikan dengan zona waktu WIB (Asia/Jakarta).'
    },
    {
      q: 'Apa bedanya paket Starter dan paket Pro?',
      a: 'Paket Starter (Rp49.000/bln) dibatasi 50 transaksi/bulan dan 3 dompet. Paket Pro (Rp99.000 Sekali Bayar Selamanya) memberikan akses UNLIMITED transaksi, multi-dompet tanpa batas, foto struk OCR belanja, export PDF/Excel, dan AI Financial Advisor aktif!'
    },
    {
      q: 'Bagaimana jika saya ingin mencoba di localhost terlebih dahulu?',
      a: 'TataDana dilengkapi arsitektur Dual-Ready Engine yang otomatis menyertakan local fallback store sehingga dapat langsung Anda jalankan secara utuh di komputer lokal Anda tanpa konfigurasi cloud rumit.'
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami mendukung pembayaran otomatis instan via Midtrans (QRIS, GoPay, Virtual Account BCA/Mandiri/BRI) dan transfer manual langsung dengan persetujuan cepat dari admin.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* 1. STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-brand-500/20">
              T
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-800 to-brand-600 bg-clip-text text-transparent">
                TataDana
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
                Fintech SaaS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-brand-600 transition">Fitur</a>
            <a href="#demo" className="hover:text-brand-600 transition">Demo Bot</a>
            <a href="#harga" className="hover:text-brand-600 transition">Harga</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-brand-600 transition"
            >
              Masuk
            </button>
            <button
              onClick={onNavigateRegister}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-500/20 transition transform hover:-translate-y-0.5"
            >
              Coba Gratis ➔
            </button>
          </div>
        </div>
      </nav>

      {/* 2 & 3 & 4 & 5. HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-sky-50/60 via-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          {/* Pre-headline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-extrabold shadow-sm animate-bounce [animation-duration:3s]">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>✨ Catat keuangan langsung dari Telegram</span>
          </div>

          {/* Headline H1 with Gradient */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Gaji habis sebelum akhir bulan? <br className="hidden sm:inline" />
            Sudah saatnya kamu tahu{' '}
            <span className="bg-gradient-to-r from-brand-600 via-sky-500 to-brand-700 bg-clip-text text-transparent">
              ke mana uangmu pergi.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus secara otomatis dan real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateRegister}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-brand-500/25 transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <span>Mulai Gratis Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-brand-700 font-bold text-sm sm:text-base rounded-2xl border border-brand-200 shadow-sm transition"
            >
              Lihat cara kerjanya →
            </a>
          </div>

          {/* Hero Video Placeholder */}
          {/* TODO: ganti dengan video asli presentasi produk setelah produksi */}
          <div className="mt-12 rounded-3xl bg-gradient-to-tr from-brand-900 via-brand-800 to-brand-700 p-3 sm:p-5 shadow-2xl shadow-brand-900/20 max-w-4xl mx-auto border border-brand-700/50">
            <div className="relative aspect-video rounded-2xl bg-slate-900 flex flex-col items-center justify-center overflow-hidden group cursor-pointer border border-white/10">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white group-hover:scale-110 transition shadow-lg">
                <Play className="w-8 h-8 fill-white ml-1" />
              </div>
              <p className="text-xs font-bold text-cyan-200 mt-4 tracking-wide uppercase">
                Video Demo: Catat Pengeluaran via Telegram dalam 3 Detik
              </p>
              <span className="text-[10px] text-white/50 mt-1">
                // TODO: ganti dengan video asli tutorial TataDana
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7 & 8. PROBLEM AWARE BULLET POINTS & SOLUTION */}
      <section className="py-20 bg-white border-y border-brand-100">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Masalah Nyata Sehari-Hari
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Kenapa Mencatat Keuangan Terasa Begitu Berat?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-2xl">🥱</div>
              <h3 className="font-bold text-sm text-slate-900">
                "Buka aplikasi keuangan? Nanti dulu deh..."
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi yang rumit, harus login ulang, pilih puluhan menu dan form panjang bikin Anda malas mencatat sesaat setelah membeli.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-2xl">💸</div>
              <h3 className="font-bold text-sm text-slate-900">
                "Kok uangnya habis ya? Padahal kayak tidak beli apa-apa"
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengeluaran kecil seperti kopi, parkir, dan jajan mini-market bocor halus tanpa disadari dan tak pernah tercatat di buku kas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="text-2xl">🎯</div>
              <h3 className="font-bold text-sm text-slate-900">
                "Udah niat bikin budget, tapi seminggu lupa"
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Target anggaran bulanan yang tidak dipantau secara real-time sama saja tidak ada budget. Anda baru sadar saat saldo rekening sudah menipis.
              </p>
            </div>
          </div>

          {/* Solution Transition */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white text-center space-y-3 shadow-xl shadow-brand-900/10">
            <p className="text-cyan-200 font-semibold text-sm">
              Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Introducing <span className="text-cyan-300">TataDana</span>
            </h3>
            <p className="text-xs sm:text-sm text-brand-100 max-w-xl mx-auto leading-relaxed">
              Cukup kirim teks di Telegram atau jepret struk belanjaan, sistem AI otomatis membaca nominal, mengkategorikan pos pengeluaran, dan menampilkan status budget Anda seketika.
            </p>
          </div>
        </div>
      </section>

      {/* 9. INTERACTIVE DEMO CHAT TELEGRAM BOT */}
      <section id="demo" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Interactive Preview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Coba Langsung Simulasi Bot Telegram TataDana
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Ketik contoh pengeluaran atau pemasukan di bawah untuk melihat balasan format asli bot!
            </p>
          </div>

          {/* Telegram Mock Chat Container */}
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-brand-200 shadow-2xl overflow-hidden">
            {/* Telegram Header */}
            <div className="p-4 bg-brand-600 text-white flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                🤖
              </div>
              <div>
                <h4 className="font-bold text-sm">TataDana Official Bot</h4>
                <p className="text-[11px] text-cyan-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  online • single shared bot
                </p>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="p-4 h-96 overflow-y-auto space-y-3 bg-[#eef2f6]">
              {demoChatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm font-sans ${
                      msg.sender === 'user'
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p
                      className="whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendDemoMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={demoChatInput}
                onChange={e => setDemoChatInput(e.target.value)}
                placeholder="Ketik 'kopi 20rb' atau 'gajian 5jt'..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-brand-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              <button
                type="submit"
                className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 10. FITUR SECTION (3 Alternating Layouts) */}
      <section id="fitur" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 space-y-20">
          {/* Fitur 1: Catat via Telegram (Teks & Foto OCR) */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                Fitur Utama
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Catat Transaksi Semudah Chat — Bahasa Natural & Struk
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tidak perlu repot membuka spreadsheet atau aplikasi rumit. Ketik bahasa sehari-hari seperti <code>"beli bakso 15rb"</code>, kirim voice note, atau jepret struk belanja. AI multi-provider kami mengekstrak detail nominal dan kategori seketika.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Mendukung nominal khas Indonesia (15rb, 1.5jt, 500k)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  AI OCR Struk memecah item belanja secara mendetail
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Idempotent webhook mencegah transaksi dobel
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-50 to-sky-100 border border-brand-200 shadow-lg">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 space-y-3 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Input Pengguna:</span>
                <p className="font-mono bg-slate-50 p-2.5 rounded-lg border text-brand-700 font-bold">
                  "beli bensin pertamax di spbu 50rb"
                </p>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hasil Structured Output AI:</span>
                <pre className="font-mono text-[11px] bg-slate-900 text-cyan-300 p-3 rounded-lg overflow-x-auto">
{`{
  "jenis": "expense",
  "nominal": 50000,
  "kategori": "Transportasi",
  "catatan": "Beli bensin pertamax di spbu"
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Fitur 2: Laporan & Export Otomatis */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:flex-row-reverse">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-50 to-sky-100 border border-brand-200 shadow-lg order-2 md:order-1">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-100 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-800">Laporan Arus Kas Bulanan</span>
                  <span className="text-emerald-600 font-bold">Surplus Rp4.250.000</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Pemasukan:</span>
                    <span className="font-bold text-slate-900">Rp8.500.000</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pengeluaran:</span>
                    <span className="font-bold text-slate-900">Rp4.250.000</span>
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button className="flex-1 py-1.5 bg-brand-600 text-white rounded-lg font-bold text-[11px]">
                    Download PDF
                  </button>
                  <button className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px]">
                    Download Excel
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 order-1 md:order-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                Laporan In-App Native
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Laporan Komprehensif & Export PDF/Excel On-Demand
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Semua data Anda tersimpan rapi langsung di platform TataDana. Filter berdasarkan rentang tanggal, kategori, atau dompet, dan unduh laporan resmi siap cetak kapan pun Anda butuhkan.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Grafik perbandingan 6 bulan dan tren harian interaktif
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Export langsung ke format Excel (.xlsx) dengan formula rapi
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Riwayat unduhan tersimpan aman di Supabase Storage
                </li>
              </ul>
            </div>
          </div>

          {/* Fitur 3: AI Financial Advisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                Fitur Pro
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI Financial Advisor — Peringatan Proaktif Cerdas
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Asisten finansial yang memantau pengeluaran Anda 24 jam. Advisor otomatis memberi notifikasi jika ada kategori belanja melonjak &gt;50% atau pengeluaran melebihi 80% dari pemasukan.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Saran spesifik dan actionable sesuai kebiasaan Anda
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Tata AI in-app chatbot untuk konsultasi langsung di web
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-600" />
                  Multi-provider AI (Gemini, OpenAI, DeepSeek) tanpa downtime
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-900 to-brand-800 text-white shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-300" />
                  <span className="font-bold text-sm text-cyan-200">Financial Advisor Insight</span>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/15 text-xs space-y-2">
                  <p className="font-bold text-white">Hei Budi! Pengeluaran Makanan Anda naik 55% minggu ini.</p>
                  <p className="text-brand-100 leading-relaxed">
                    💡 <b>Saran Tindakan:</b> Kurangi pemesanan pesan antar makan malam dan manfaatkan masak sendiri selama 4 hari ke depan untuk menghemat Rp350.000.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. TESTIMONI (Masonry Grid Placeholder) */}
      {/* TODO: ganti dengan testimoni asli setelah beta user meluncur */}
      <section className="py-20 bg-slate-50 border-t border-brand-100">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Cerita Pengguna
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Disukai Karyawan, Freelancer, & Mahasiswa
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              // TODO: ganti dengan testimoni pengguna beta TataDana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm space-y-3">
              <div className="flex text-amber-400 text-sm">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Dulu selalu malas buka app keuangan karena ribet login. Sekarang begitu selesai makan siang di warteg, tinggal kirim teks di Telegram dan langsung tercatat!"
              </p>
              <div>
                <p className="font-bold text-xs text-slate-900">Dimas Anggoro</p>
                <p className="text-[11px] text-slate-400">Software Engineer, Jakarta</p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm space-y-3">
              <div className="flex text-amber-400 text-sm">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Sebagai freelancer yang pemasukan tidak tetap, fitur multi-dompet dan export Excel-nya sangat membantu saat rekonsiliasi pajak akhir tahun."
              </p>
              <div>
                <p className="font-bold text-xs text-slate-900">Clarissa Putri</p>
                <p className="text-[11px] text-slate-400">Freelance Graphic Designer, Bandung</p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-brand-100 shadow-sm space-y-3">
              <div className="flex text-amber-400 text-sm">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                "Budget mingguan dan reminder Telegram-nya beneran nyelamatin dompet anak kos. Sangat worth it upgrade ke Pro cuma Rp99rb sekali bayar seumur hidup!"
              </p>
              <div>
                <p className="font-bold text-xs text-slate-900">Rizky Febrian</p>
                <p className="text-[11px] text-slate-400">Mahasiswa, Yogyakarta</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. PRICING PLANS */}
      <section id="harga" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Pilihan Paket
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Investasi Kecil untuk Keuangan Terkendali
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Pilih paket yang paling sesuai dengan kebutuhan pencatatan finansial Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                  <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                    Bulanan
                  </span>
                </div>
                <p className="text-xs text-slate-500">Cocok untuk mulai membiasakan pencatatan rutin</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-slate-900">Rp49.000</span>
                  <span className="text-xs text-slate-500"> / bulan</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Catat transaksi via teks Telegram
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Maksimal 50 transaksi / bulan
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Maksimal 3 dompet & 5 target budget
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Dashboard web ringkasan bulanan
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-slate-300" />
                    Tanpa input foto struk OCR
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-slate-300" />
                    Tanpa export PDF & Excel
                  </li>
                </ul>
              </div>

              <button
                onClick={onNavigateRegister}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition"
              >
                Pilih Starter
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-brand-900 to-brand-800 text-white border-2 border-brand-500 space-y-6 flex flex-col justify-between shadow-2xl shadow-brand-900/20 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-cyan-400 text-brand-950 text-[10px] font-extrabold uppercase rounded-full">
                Paling Populer
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-cyan-200">TataDana Pro</h3>
                </div>
                <p className="text-xs text-brand-200">Solusi lengkap tanpa batasan seumur hidup</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">Rp99.000</span>
                  <span className="text-xs text-cyan-200 font-bold"> Sekali Bayar Selamanya</span>
                </div>

                <ul className="space-y-3 text-xs text-brand-100 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-300" />
                    Semua fitur Starter
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-300" />
                    <b>Unlimited Transaksi, Dompet & Budget</b>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-300" />
                    <b>Input via Foto Struk Belanja dengan AI OCR</b>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-300" />
                    <b>Export Laporan Unlimited ke PDF & Excel (.xlsx)</b>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-300" />
                    AI Financial Advisor & Voice Note Transkrip
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-300" />
                    Prioritas Dukungan Teknis 24/7
                  </li>
                </ul>
              </div>

              <button
                onClick={onNavigateRegister}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 text-brand-950 font-extrabold text-xs rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
              >
                Ambil Akses Pro Sekarang ➔
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FAQ SECTION (Minimal 7 Pertanyaan) */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-brand-100">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Pertanyaan Populer
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Kerap Ditanyakan (FAQ)
            </h2>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-brand-100 shadow-sm overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 hover:text-brand-600 transition"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-brand-600" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 14. FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-tr from-brand-950 via-brand-800 to-brand-700 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Mulai Kendalikan Keuanganmu Hari Ini.
          </h2>
          <p className="text-sm sm:text-base text-brand-100 max-w-xl mx-auto leading-relaxed">
            Bergabunglah bersama ribuan orang Indonesia yang telah menghentikan kebocoran uang dengan pencatatan otomatis via Telegram.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateRegister}
              className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 text-brand-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl transition transform hover:-translate-y-1"
            >
              Daftar Sekarang — Gratis ➔
            </button>
          </div>
        </div>
      </section>

      {/* 15. FOOTER (4 Kolom Sesuai Spesifikasi) */}
      <footer className="bg-slate-900 text-slate-400 py-16 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Logo & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-sm">
                T
              </div>
              <span>TataDana</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu. Terintegrasi Supabase & AI multi-provider.
            </p>
            <p className="text-[11px] text-slate-500">
              © 2026 PT TataDana Keuangan Nusantara.
            </p>
          </div>

          {/* Col 2: Produk */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Produk</h4>
            <ul className="space-y-2">
              <li><a href="#fitur" className="hover:text-white transition">Telegram Bot Transaksi</a></li>
              <li><a href="#fitur" className="hover:text-white transition">Laporan & Analitik In-App</a></li>
              <li><a href="#fitur" className="hover:text-white transition">AI OCR Foto Struk</a></li>
              <li><a href="#fitur" className="hover:text-white transition">Budgeting 3 Dimensi</a></li>
            </ul>
          </div>

          {/* Col 3: Perusahaan */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Perusahaan</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-white transition">Karir</a></li>
              <li><a href="#" className="hover:text-white transition">Blog Finansial</a></li>
              <li><a href="#" className="hover:text-white transition">Panduan BotFather</a></li>
            </ul>
          </div>

          {/* Col 4: Legal & Kontak */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Legal & Bantuan</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Kebijakan Privasi (/privacy)</a></li>
              <li><a href="#" className="hover:text-white transition">Syarat & Ketentuan (/terms)</a></li>
              <li><a href="mailto:support@tatadana.id" className="hover:text-white transition">Kontak Support</a></li>
              <li><a href="https://t.me/TataDanaSupport" className="hover:text-white transition">Telegram Support</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
