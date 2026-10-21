@echo off
title Push TataDana ke GitHub (alanfadhlan246-hub)
echo ====================================================
echo   Mengunggah TataDana ke GitHub alanfadhlan246-hub
echo ====================================================
echo.
set "PATH=C:\Users\HYPE AMD\.gemini\antigravity\tools\git\cmd;%PATH%"

cd /d "C:\Users\HYPE AMD\.gemini\antigravity\scratch\tatadana"

echo Target Repositori: https://github.com/alanfadhlan246-hub/tatadana.git
echo.
echo Pastikan Anda sudah membuat repositori "tatadana" di https://github.com/new
echo.
pause
echo.
echo Menghubungkan dan mengunggah ke GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/alanfadhlan246-hub/tatadana.git
git branch -M main
git push -u origin main

echo.
echo ====================================================
echo  SELESAI! Seluruh kode telah berhasil masuk GitHub!
echo ====================================================
pause
