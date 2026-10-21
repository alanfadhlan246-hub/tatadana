@echo off
title TataDana Public Cloudflare Tunnel
echo ====================================================
echo  Membuka Link Publik HTTPS TataDana (Akses Sedunia)
echo ====================================================
echo.
echo Pastikan server lokal TataDana sudah aktif di port 3000.
echo Menghubungkan ke Cloudflare Global Edge...
echo.
"C:\Users\HYPE AMD\.gemini\antigravity\tools\cloudflared.exe" tunnel --url http://localhost:3000
pause
