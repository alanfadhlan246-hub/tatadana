@echo off
title Push TataDana ke GitHub
echo ====================================================
echo      Unggah TataDana ke Repositori GitHub Anda
echo ====================================================
echo.
echo Langkah mudah:
echo 1. Buka https://github.com/new di browser Anda
echo 2. Beri nama repositori (contoh: tatadana)
echo 3. Pilih "Public" atau "Private", lalu klik "Create repository"
echo 4. Salin URL HTTPS repositori Anda (contoh: https://github.com/username/tatadana.git)
echo.
set /p REPO_URL="Tempelkan (Paste) URL GitHub Anda di sini: "

if "%REPO_URL%"=="" (
    echo URL tidak boleh kosong! Silakan jalankan ulang script ini.
    pause
    exit /b
)

set "PATH=C:\Users\HYPE AMD\.gemini\antigravity\tools\git\cmd;%PATH%"

echo.
echo Menghubungkan ke %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo Mengunggah seluruh kode proyek ke GitHub...
git push -u origin main

echo.
echo ====================================================
echo  SELESAI! Seluruh kode telah berhasil masuk GitHub!
echo  Sekarang buka https://render.com untuk deploy 1-klik!
echo ====================================================
pause
