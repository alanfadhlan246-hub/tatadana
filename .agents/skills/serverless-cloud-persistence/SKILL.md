---
name: serverless-cloud-persistence
description: >-
  Use this skill when deploying Express/Node.js applications to serverless environments
  (like Vercel, Netlify, or AWS Lambda) that require multi-device real-time state synchronization,
  preventing container isolation bugs and ephemeral data loss.
---

# Serverless Cloud Persistence & Multi-Device State Sync

Panduan dan runbook standar untuk menangani persistensi data dan sinkronisasi multi-perangkat pada arsitektur Serverless (seperti Vercel).

## 1. Identifikasi Gejala Masalah (Symptoms)
- Data yang dibuat dari satu perangkat (misal: pendaftaran akun oleh pengguna baru) tidak muncul di perangkat lain (misal: antrean persetujuan pada dashboard admin).
- Setelah serverless function mengalami *cold start* (idle beberapa menit), perubahan data kembali ke data *seed* awal atau data baru hilang.
- Terjadi error `EROFS: read-only file system` saat aplikasi mencoba menulis ke folder lokal di luar `/tmp`.

## 2. Pola Penanganan Standar

### Langkah 1: Otomasi Database Cloud Terpusat
Alih-alih bergantung pada penyimpanan file lokal `/tmp/local_db.json` yang bersifat *ephemeral*, hubungkan database cloud managed menggunakan Vercel Marketplace CLI:
```bash
# Terima ketentuan integrasi Neon PostgreSQL
vercel integration accept-terms neon --yes

# Buat database cloud serverless PostgreSQL secara instan
vercel integration add neon

# Hubungkan database ke proyek
vercel integration resource connect <resource-id> <project-name> --yes
```

### Langkah 2: Middleware Sinkronisasi Request (State Hydration)
Pasang middleware pada Express sebelum rute API untuk menyelaraskan cache memory dengan cloud pada setiap permintaan masuk:
```javascript
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await db.syncFromCloud();
    } catch (e) {
      console.warn('[Cloud Sync Warn]:', e.message);
    }
  }
  next();
});
```

### Langkah 3: Atomic Mutation Guarantee
Pastikan endpoint perubahan data mutasi krusial (`POST /register`, `PUT /approve`, `PUT /reject`, pencatatan transaksi) menunggu commit cloud selesai sebelum mengembalikan response:
```javascript
// Simpan ke memory lokal dan langsung commit ke cloud
db.table('profiles').update(id, { approval_status: 'approved' });
await db.saveToCloud();
res.json({ success: true, message: 'Disetujui!' });
```

### Langkah 4: Heartbeat Frontend Real-Time Polling
Tambahkan interval 3-4 detik pada tampilan Admin dan Status Approval agar kedua perangkat saling merespons secara otomatis tanpa perlu refresh manual:
```javascript
useEffect(() => {
  loadData();
  const timer = setInterval(() => {
    loadData();
  }, 3000);
  return () => clearInterval(timer);
}, []);
```
