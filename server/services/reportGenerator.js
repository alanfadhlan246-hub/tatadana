// ====================================================================
// TataDana Native Report & Export Engine (PDF & Excel .xlsx)
// ====================================================================
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { getWIBDate } = require('../middleware/auth');

const EXPORT_DIR = path.join(__dirname, '..', 'data', 'exports');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

class ReportGenerator {
  // 1. GENERATE EXCEL (.XLSX)
  static async generateExcel(transactions, userProfile, periodLabel) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TataDana SaaS Platform';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Laporan Keuangan', {
      views: [{ showGridLines: true }]
    });

    // Title Row
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `TATADANA — LAPORAN KEUANGAN PRIBADI`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Ocean Blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Subtitle & Metadata
    sheet.getCell('A2').value = `Nama Pengguna: ${userProfile.full_name}`;
    sheet.getCell('A3').value = `Periode: ${periodLabel}`;
    sheet.getCell('A4').value = `Tanggal Cetak: ${getWIBDate(new Date())}`;

    sheet.getRow(2).font = { bold: true };
    sheet.getRow(3).font = { italic: true };

    // Financial Summary
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const net = totalIncome - totalExpense;

    sheet.getCell('E2').value = `Total Pemasukan:`;
    sheet.getCell('F2').value = totalIncome;
    sheet.getCell('F2').numFmt = '"Rp"#,##0';

    sheet.getCell('E3').value = `Total Pengeluaran:`;
    sheet.getCell('F3').value = totalExpense;
    sheet.getCell('F3').numFmt = '"Rp"#,##0';

    sheet.getCell('E4').value = `Net Cashflow:`;
    sheet.getCell('F4').value = net;
    sheet.getCell('F4').numFmt = '"Rp"#,##0';

    // Table Header
    const headerRowIdx = 6;
    const headers = ['No', 'Tanggal (WIB)', 'Tipe', 'Kategori', 'Dompet', 'Nominal (IDR)', 'Catatan', 'Sumber'];
    const headerRow = sheet.getRow(headerRowIdx);
    headerRow.values = headers;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.height = 24;

    headers.forEach((_, colIdx) => {
      const cell = headerRow.getCell(colIdx + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Populate Transaction Rows
    transactions.forEach((tx, idx) => {
      const rowIdx = headerRowIdx + 1 + idx;
      const row = sheet.getRow(rowIdx);
      const isExpense = tx.type === 'expense';

      row.values = [
        idx + 1,
        tx.date ? new Date(tx.date).toLocaleDateString('id-ID') : '-',
        isExpense ? 'Pengeluaran' : (tx.type === 'income' ? 'Pemasukan' : 'Transfer'),
        tx.category_name || '-',
        tx.wallet_name || '-',
        Number(tx.amount),
        tx.notes || '-',
        tx.source || 'web_app'
      ];

      // Format currency
      row.getCell(6).numFmt = '"Rp"#,##0';
      if (isExpense) {
        row.getCell(3).font = { color: { argb: 'FFDC2626' } }; // Red
      } else {
        row.getCell(3).font = { color: { argb: 'FF16A34A' } }; // Green
      }
    });

    // Auto-fit column widths
    sheet.columns.forEach(col => {
      let maxLen = 14;
      col.eachCell({ includeEmpty: false }, cell => {
        const len = (cell.value ? cell.value.toString().length : 0);
        if (len > maxLen) maxLen = Math.min(len + 3, 40);
      });
      col.width = maxLen;
    });

    const filename = `tatadana_laporan_${Date.now()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, filename);
    await workbook.xlsx.writeFile(filePath);

    return { filename, filePath, size: fs.statSync(filePath).size };
  }

  // 2. GENERATE PDF
  static async generatePDF(transactions, userProfile, periodLabel) {
    return new Promise((resolve, reject) => {
      try {
        const filename = `tatadana_laporan_${Date.now()}.pdf`;
        const filePath = path.join(EXPORT_DIR, filename);

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header Background
        doc.rect(0, 0, 595.28, 90).fill('#0284c7');

        // App Title
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
           .text('TATADANA', 40, 25);
        doc.fontSize(10).font('Helvetica')
           .text('Sistem Manajemen Keuangan Pribadi & Terintegrasi Telegram Bot', 40, 52);

        doc.fillColor('#333333');

        // User Metadata & Period
        doc.fontSize(10).font('Helvetica-Bold').text(`Pengguna: `, 40, 105, { continued: true })
           .font('Helvetica').text(userProfile.full_name);
        doc.font('Helvetica-Bold').text(`Periode: `, 40, 120, { continued: true })
           .font('Helvetica').text(periodLabel);
        doc.font('Helvetica-Bold').text(`Waktu Cetak: `, 40, 135, { continued: true })
           .font('Helvetica').text(getWIBDate(new Date()));

        // Summary Boxes
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const net = totalIncome - totalExpense;

        // Box 1: Pemasukan
        doc.roundedRect(300, 105, 80, 45, 6).fillAndStroke('#ecfdf5', '#10b981');
        doc.fillColor('#065f46').fontSize(8).font('Helvetica-Bold').text('PEMASUKAN', 305, 112);
        doc.fontSize(9).text(`Rp${totalIncome.toLocaleString('id-ID')}`, 305, 128);

        // Box 2: Pengeluaran
        doc.roundedRect(390, 105, 85, 45, 6).fillAndStroke('#fef2f2', '#ef4444');
        doc.fillColor('#991b1b').fontSize(8).font('Helvetica-Bold').text('PENGELUARAN', 395, 112);
        doc.fontSize(9).text(`Rp${totalExpense.toLocaleString('id-ID')}`, 395, 128);

        // Box 3: Net Cashflow
        doc.roundedRect(485, 105, 75, 45, 6).fillAndStroke('#eff6ff', '#0284c7');
        doc.fillColor('#1e40af').fontSize(8).font('Helvetica-Bold').text('NET CASHFLOW', 490, 112);
        doc.fontSize(9).text(`Rp${net.toLocaleString('id-ID')}`, 490, 128);

        // Table Header
        let y = 175;
        doc.rect(40, y, 515, 22).fill('#0369a1');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('No', 45, y + 6);
        doc.text('Tanggal', 65, y + 6);
        doc.text('Kategori', 130, y + 6);
        doc.text('Catatan', 220, y + 6);
        doc.text('Dompet', 380, y + 6);
        doc.text('Nominal (IDR)', 455, y + 6);

        y += 24;
        doc.fillColor('#333333').font('Helvetica').fontSize(8);

        // Table Rows
        transactions.slice(0, 35).forEach((tx, idx) => {
          if (y > 750) {
            doc.addPage();
            y = 40;
          }

          if (idx % 2 === 1) {
            doc.rect(40, y - 2, 515, 18).fill('#f8fafc');
          }

          const isExpense = tx.type === 'expense';
          const prefix = isExpense ? '- ' : '+ ';
          doc.fillColor('#333333');
          doc.text((idx + 1).toString(), 45, y);
          doc.text(tx.date ? new Date(tx.date).toLocaleDateString('id-ID') : '-', 65, y);
          doc.text((tx.category_name || '-').substring(0, 15), 130, y);
          doc.text((tx.notes || '-').substring(0, 32), 220, y);
          doc.text((tx.wallet_name || '-').substring(0, 12), 380, y);

          doc.fillColor(isExpense ? '#dc2626' : '#16a34a');
          doc.text(`${prefix}Rp${Number(tx.amount).toLocaleString('id-ID')}`, 455, y);

          y += 18;
        });

        // Footer
        doc.fillColor('#64748b').fontSize(8)
           .text('Dicetak otomatis oleh platform TataDana — Kelola keuangan semudah chat langsung dari Telegram.', 40, 800, { align: 'center', width: 515 });

        doc.end();

        stream.on('finish', () => {
          resolve({ filename, filePath, size: fs.statSync(filePath).size });
        });

        stream.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ReportGenerator;
