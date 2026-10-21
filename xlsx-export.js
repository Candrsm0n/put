(() => {
  'use strict';

  const encoder = new TextEncoder();
  const currencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0';
  const monthNames = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  const fullDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  function xmlEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }
  function columnName(index) {
    let name = '';
    for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    return name;
  }
  function text(value, style = 0) { return { value: String(value ?? ''), style, type: 'text' }; }
  function number(value, style = 0) { return { value: Number(value) || 0, style, type: 'number' }; }
  function dateNumber(value, style = 7) {
    if (!value) return text('—', style);
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return text('—', style);
    return { value: (Date.UTC(year, month - 1, day) - Date.UTC(1899, 11, 30)) / 86400000, style, type: 'number' };
  }
  function monthlyRows(transactions) {
    const keys = transactions.map(t => String(t.date).slice(0, 7)).filter(key => /^\d{4}-\d{2}$/.test(key)).sort();
    const current = new Date();
    const currentKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const firstKey = keys.length ? keys[0] : currentKey;
    const [firstYear, firstMonth] = firstKey.split('-').map(Number);
    const cursor = new Date(firstYear, firstMonth - 1, 1);
    const stop = new Date(current.getFullYear(), current.getMonth(), 1);
    const result = [];
    while (cursor <= stop) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const rows = transactions.filter(t => String(t.date).slice(0, 7) === key);
      const income = rows.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const expense = rows.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      result.push({ label: `${monthNames.format(cursor)} ${cursor.getFullYear()}`, income, expense, net: income - expense, count: rows.length, rate: income ? (income - expense) / income : 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }
  function makeSheets(data, categories, currentBalance) {
    const transactions = [...(data.transactions || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const budgets = data.budgets || [];
    const goals = data.goals || [];
    const bills = [...(data.bills || [])].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = transactions.filter(t => String(t.date).slice(0, 7) === currentMonth);
    const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expense = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const monthName = `${monthNames.format(now)} ${now.getFullYear()}`;
    const budgetMap = new Map(budgets.map(b => [b.category, Number(b.limit || 0)]));
    const categoryRows = Object.entries(categories).filter(([, meta]) => meta.type === 'expense').map(([id, meta]) => {
      const spent = thisMonth.filter(t => t.category === id && t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const limit = budgetMap.get(id) || 0;
      return { id, name: `${meta.icon} ${meta.name}`, limit, spent, remaining: Math.max(0, limit - spent), rate: limit ? spent / limit : null };
    }).sort((a, b) => b.spent - a.spent);
    const totalLimit = budgets.reduce((sum, b) => sum + Number(b.limit || 0), 0);
    const budgetSpent = budgets.reduce((sum, b) => sum + (categoryRows.find(c => c.id === b.category)?.spent || 0), 0);
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const unpaidBills = bills.filter(b => !b.paid).length;
    const catName = id => `${categories[id]?.icon || '•'} ${categories[id]?.name || 'Lainnya'}`;

    const summary = [
      { cells: [text('RUANGUANG  |  REKAP KEUANGAN', 1)], height: 34 },
      { cells: [text(`Dibuat ${fullDate.format(now)} · Periode ringkasan ${monthName}`, 2)], height: 22 },
      { cells: [] },
      { cells: [text('SALDO TERCATAT', 10), null, text('PEMASUKAN BULAN INI', 10), null, text('PENGELUARAN BULAN INI', 10), null], height: 24 },
      { cells: [number(currentBalance, 11), null, number(income, 12), null, number(expense, 13), null], height: 32 },
      { cells: [] },
      { cells: [text('RINGKASAN PERIODE', 4)], height: 24 },
      { cells: [text('Bulan', 3), text('Jumlah transaksi', 3), text('Selisih bersih', 3), text('Rasio menabung', 3), text('Anggaran terpakai', 3), text('Tagihan belum lunas', 3)], height: 30 },
      { cells: [text(monthName, 14), number(thisMonth.length, 14), number(income - expense, income - expense < 0 ? 13 : 12), number(income ? (income - expense) / income : 0, 6), text(totalLimit ? `${Math.round(budgetSpent / totalLimit * 100)}% · ${new Intl.NumberFormat('id-ID').format(budgetSpent)} / ${new Intl.NumberFormat('id-ID').format(totalLimit)}` : 'Belum diatur', 14), number(unpaidBills, 14)], height: 24 },
      { cells: [] },
      { cells: [text('PENGELUARAN PER KATEGORI', 4)], height: 24 },
      { cells: [text('Kategori', 3), text('Batas anggaran', 3), text('Terpakai', 3), text('Sisa', 3), text('Pemakaian', 3), text('Status', 3)], height: 30 }
    ];
    categoryRows.forEach((row, index) => {
      const alt = index % 2 === 1;
      const amountStyle = alt ? 15 : 5;
      const rowStyle = alt ? 14 : 0;
      const status = !row.limit ? 'Belum dianggarkan' : row.spent >= row.limit ? 'Batas terlampaui' : row.rate >= 0.8 ? 'Mendekati batas' : 'Dalam batas';
      const statusStyle = !row.limit ? 24 : row.spent >= row.limit ? 23 : row.rate >= 0.8 ? 23 : 22;
      summary.push({ cells: [text(row.name, rowStyle), row.limit ? number(row.limit, amountStyle) : text('—', rowStyle), number(row.spent, alt ? 17 : 8), row.limit ? number(row.remaining, amountStyle) : text('—', rowStyle), row.rate === null ? text('—', rowStyle) : number(row.rate, 6), text(status, statusStyle)], height: 23 });
    });
    summary.push({ cells: [text('TOTAL', 19), number(totalLimit, 20), number(budgetSpent, 20), number(Math.max(0, totalLimit - budgetSpent), 20), number(totalLimit ? budgetSpent / totalLimit : 0, 21), text('Ringkasan bulan ini', 19)], height: 25 });

    const txRows = [
      { cells: [text('DAFTAR TRANSAKSI', 1)], height: 34 },
      { cells: [text(`${transactions.length} catatan · Nominal pengeluaran ditulis negatif agar selisih dapat dijumlahkan`, 2)], height: 22 },
      { cells: [] },
      { cells: ['Tanggal', 'Deskripsi', 'Jenis', 'Kategori', 'Nominal', 'Catatan'].map(value => text(value, 3)), height: 30 }
    ];
    transactions.forEach((t, index) => {
      const alt = index % 2 === 1;
      const isIncome = t.type === 'income';
      const amount = (Number(t.amount) || 0) * (isIncome ? 1 : -1);
      txRows.push({ cells: [dateNumber(t.date, alt ? 16 : 7), text(t.title || '', alt ? 14 : 0), text(isIncome ? 'Pemasukan' : 'Pengeluaran', isIncome ? 22 : 23), text(catName(t.category), alt ? 14 : 0), number(amount, isIncome ? (alt ? 17 : 8) : (alt ? 18 : 9)), text(t.note || '', alt ? 14 : 0)], height: 22 });
    });
    txRows.push({ cells: [text('TOTAL BERSIH', 19), null, null, null, number(transactions.reduce((sum, t) => sum + (Number(t.amount) || 0) * (t.type === 'income' ? 1 : -1), 0), 20), text('Pemasukan dikurangi pengeluaran', 19)], height: 25 });

    const budgetRows = [
      { cells: [text('ANGGARAN BULANAN', 1)], height: 34 },
      { cells: [text(`Batas dan pemakaian kategori · ${monthName}`, 2)], height: 22 },
      { cells: [] },
      { cells: ['Kategori', 'Batas anggaran', 'Terpakai bulan ini', 'Sisa anggaran', 'Pemakaian', 'Status'].map(value => text(value, 3)), height: 30 }
    ];
    categoryRows.forEach((row, index) => {
      const alt = index % 2 === 1;
      const status = !row.limit ? 'Belum dianggarkan' : row.spent >= row.limit ? 'Batas terlampaui' : row.rate >= .8 ? 'Mendekati batas' : 'Dalam batas';
      budgetRows.push({ cells: [text(row.name, alt ? 14 : 0), row.limit ? number(row.limit, alt ? 15 : 5) : text('—', alt ? 14 : 0), number(row.spent, row.spent ? (alt ? 17 : 8) : (alt ? 15 : 5)), row.limit ? number(row.remaining, alt ? 15 : 5) : text('—', alt ? 14 : 0), row.rate === null ? text('—', alt ? 14 : 0) : number(row.rate, 6), text(status, !row.limit ? 24 : row.rate >= .8 ? 23 : 22)], height: 23 });
    });
    budgetRows.push({ cells: [text('TOTAL', 19), number(totalLimit, 20), number(budgetSpent, 20), number(Math.max(0, totalLimit - budgetSpent), 20), number(totalLimit ? budgetSpent / totalLimit : 0, 21), text(`${budgets.length} kategori dianggarkan`, 19)], height: 25 });

    const goalRows = [
      { cells: [text('TARGET TABUNGAN', 1)], height: 34 },
      { cells: [text(`${goals.length} target · Perbarui setoran dari menu Target tabungan`, 2)], height: 22 },
      { cells: [] },
      { cells: ['Target', 'Terkumpul', 'Nilai target', 'Kekurangan', 'Progress', 'Tanggal target'].map(value => text(value, 3)), height: 30 }
    ];
    goals.forEach((g, index) => {
      const alt = index % 2 === 1;
      const pct = Number(g.target) ? Number(g.saved) / Number(g.target) : 0;
      goalRows.push({ cells: [text(`${g.icon || '◎'} ${g.title}`, alt ? 14 : 0), number(g.saved, alt ? 15 : 5), number(g.target, alt ? 15 : 5), number(Math.max(0, Number(g.target) - Number(g.saved)), alt ? 15 : 5), number(pct, 6), g.deadline ? dateNumber(g.deadline, alt ? 16 : 7) : text('—', alt ? 14 : 0)], height: 23 });
    });
    goalRows.push({ cells: [text('TOTAL TARGET', 19), number(goals.reduce((sum, g) => sum + Number(g.saved || 0), 0), 20), number(goals.reduce((sum, g) => sum + Number(g.target || 0), 0), 20), number(goals.reduce((sum, g) => sum + Math.max(0, Number(g.target || 0) - Number(g.saved || 0)), 0), 20), text('—', 19), text('', 19)], height: 25 });

    const billRows = [
      { cells: [text('JADWAL TAGIHAN', 1)], height: 34 },
      { cells: [text(`${bills.length} pengingat · Status berdasarkan catatan aplikasi`, 2)], height: 22 },
      { cells: [] },
      { cells: ['Jatuh tempo', 'Nama tagihan', 'Kategori', 'Nominal', 'Status'].map(value => text(value, 3)), height: 30 }
    ];
    bills.forEach((b, index) => {
      const alt = index % 2 === 1;
      const overdue = !b.paid && b.dueDate < today;
      const status = b.paid ? 'Lunas' : overdue ? 'Terlambat' : 'Belum dibayar';
      billRows.push({ cells: [dateNumber(b.dueDate, alt ? 16 : 7), text(b.title || '', alt ? 14 : 0), text(catName(b.category), alt ? 14 : 0), number(b.amount, alt ? 15 : 5), text(status, b.paid ? 22 : overdue ? 23 : 24)], height: 23 });
    });
    billRows.push({ cells: [text('TOTAL TAGIHAN', 19), null, null, number(bills.reduce((sum, b) => sum + Number(b.amount || 0), 0), 20), text(`${unpaidBills} belum lunas`, 19)], height: 25 });

    const months = monthlyRows(transactions);
    const monthly = [
      { cells: [text('REKAP ARUS KAS BULANAN', 1)], height: 34 },
      { cells: [text('Riwayat seluruh bulan berdasarkan tanggal transaksi', 2)], height: 22 },
      { cells: [] },
      { cells: ['Bulan', 'Pemasukan', 'Pengeluaran', 'Selisih bersih', 'Rasio menabung', 'Jumlah transaksi'].map(value => text(value, 3)), height: 30 }
    ];
    months.forEach((m, index) => {
      const alt = index % 2 === 1;
      monthly.push({ cells: [text(m.label, alt ? 14 : 0), number(m.income, alt ? 15 : 5), number(m.expense, alt ? 15 : 5), number(m.net, m.net < 0 ? 13 : alt ? 17 : 8), number(m.rate, 6), number(m.count, alt ? 14 : 0)], height: 23 });
    });
    monthly.push({ cells: [text('TOTAL', 19), number(months.reduce((sum, m) => sum + m.income, 0), 20), number(months.reduce((sum, m) => sum + m.expense, 0), 20), number(months.reduce((sum, m) => sum + m.net, 0), 20), text('—', 19), number(months.reduce((sum, m) => sum + m.count, 0), 20)], height: 25 });

    return [
      { name: 'Ringkasan', rows: summary, widths: [30, 18, 22, 18, 22, 22], merges: ['A1:F1', 'A2:F2', 'A4:B4', 'C4:D4', 'E4:F4', 'A5:B5', 'C5:D5', 'E5:F5', 'A7:F7', 'A11:F11'], tabColor: 'FF7553F4' },
      { name: 'Transaksi', rows: txRows, widths: [16, 30, 17, 25, 20, 32], filterRow: 4, freezeRows: 4, tabColor: 'FF21B987' },
      { name: 'Anggaran', rows: budgetRows, widths: [26, 21, 22, 21, 16, 22], filterRow: 4, freezeRows: 4, tabColor: 'FF795AF2' },
      { name: 'Target', rows: goalRows, widths: [30, 20, 20, 20, 15, 20], filterRow: 4, freezeRows: 4, tabColor: 'FFF0A43A' },
      { name: 'Tagihan', rows: billRows, widths: [18, 30, 22, 20, 19], filterRow: 4, freezeRows: 4, tabColor: 'FFE3637B' },
      { name: 'Bulanan', rows: monthly, widths: [24, 20, 20, 20, 17, 20], filterRow: 4, freezeRows: 4, tabColor: 'FF4D8FEA' }
    ];
  }

  function cellXml(cell, rowIndex, colIndex) {
    if (!cell) return '';
    const ref = `${columnName(colIndex)}${rowIndex}`;
    const style = Number.isInteger(cell.style) ? ` s="${cell.style}"` : '';
    if (cell.type === 'number' && Number.isFinite(cell.value)) return `<c r="${ref}"${style}><v>${cell.value}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(cell.value)}</t></is></c>`;
  }
  function worksheetXml(sheet) {
    const maxCols = Math.max(1, ...sheet.rows.map(row => row.cells.length));
    const maxRows = Math.max(1, sheet.rows.length);
    const dimension = `A1:${columnName(maxCols - 1)}${maxRows}`;
    const cols = sheet.widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('');
    const rows = sheet.rows.map((row, index) => {
      const rowNumber = index + 1;
      const height = row.height ? ` ht="${row.height}" customHeight="1"` : '';
      return `<row r="${rowNumber}"${height}>${row.cells.map((cell, col) => cellXml(cell, rowNumber, col)).join('')}</row>`;
    }).join('');
    const pane = sheet.freezeRows ? `<pane ySplit="${sheet.freezeRows}" topLeftCell="A${sheet.freezeRows + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${sheet.freezeRows + 1}" sqref="A${sheet.freezeRows + 1}"/>` : '<selection activeCell="A1" sqref="A1"/>';
    const views = `<sheetViews><sheetView showGridLines="0" workbookViewId="0">${pane}</sheetView></sheetViews>`;
    const filter = sheet.filterRow && maxRows > sheet.filterRow ? `<autoFilter ref="A${sheet.filterRow}:${columnName(maxCols - 1)}${maxRows - 1}"/>` : '';
    const merges = sheet.merges?.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>` : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><tabColor rgb="${sheet.tabColor}"/></sheetPr><dimension ref="${dimension}"/>${views}<sheetFormatPr defaultRowHeight="21"/><cols>${cols}</cols><sheetData>${rows}</sheetData>${filter}${merges}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
  }
  function stylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="${xmlEscape(currencyFormat)}"/><numFmt numFmtId="165" formatCode="0.0%"/><numFmt numFmtId="166" formatCode="dd mmm yyyy"/></numFmts><fonts count="7"><font><sz val="11"/><color rgb="FF25324B"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font><font><b/><sz val="19"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font><font><i/><sz val="10"/><color rgb="FFCBD5E1"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FF11866A"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFD8485B"/><name val="Aptos"/></font><font><b/><sz val="13"/><color rgb="FF273451"/><name val="Aptos Display"/></font></fonts><fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17223B"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF7657ED"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEAFF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F6EE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE7E9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F4F8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFE3E8F0"/></left><right style="thin"><color rgb="FFE3E8F0"/></right><top style="thin"><color rgb="FFE3E8F0"/></top><bottom style="thin"><color rgb="FFE3E8F0"/></bottom><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFCCD4E0"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="25"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="right"/></xf><xf numFmtId="165" fontId="0" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment horizontal="center"/></xf><xf numFmtId="166" fontId="0" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="164" fontId="4" fillId="5" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="5" fillId="6" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="6" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="4" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="5" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="7" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/><xf numFmtId="166" fontId="0" fillId="7" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="4" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="5" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="165" fontId="1" fillId="2" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="5" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }

  function u16(view, offset, value) { view.setUint16(offset, value, true); }
  function u32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
    return table;
  })();
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function joinBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
  }
  function zipStore(files) {
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;
    for (const file of files) {
      const name = encoder.encode(file.name);
      const body = encoder.encode(file.content);
      const checksum = crc32(body);
      const local = new Uint8Array(30 + name.length);
      const localView = new DataView(local.buffer);
      u32(localView, 0, 0x04034b50); u16(localView, 4, 20); u16(localView, 6, 0); u16(localView, 8, 0);
      u16(localView, 10, 0); u16(localView, 12, 0); u32(localView, 14, checksum); u32(localView, 18, body.length); u32(localView, 22, body.length);
      u16(localView, 26, name.length); u16(localView, 28, 0); local.set(name, 30);
      localParts.push(local, body);

      const central = new Uint8Array(46 + name.length);
      const centralView = new DataView(central.buffer);
      u32(centralView, 0, 0x02014b50); u16(centralView, 4, 20); u16(centralView, 6, 20); u16(centralView, 8, 0); u16(centralView, 10, 0);
      u16(centralView, 12, 0); u16(centralView, 14, 0); u32(centralView, 16, checksum); u32(centralView, 20, body.length); u32(centralView, 24, body.length);
      u16(centralView, 28, name.length); u16(centralView, 30, 0); u16(centralView, 32, 0); u16(centralView, 34, 0); u16(centralView, 36, 0); u32(centralView, 38, 0); u32(centralView, 42, localOffset); central.set(name, 46);
      centralParts.push(central);
      localOffset += local.length + body.length;
    }
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    u32(endView, 0, 0x06054b50); u16(endView, 4, 0); u16(endView, 6, 0); u16(endView, 8, files.length); u16(endView, 10, files.length);
    u32(endView, 12, centralSize); u32(endView, 16, localOffset); u16(endView, 20, 0);
    return joinBytes([...localParts, ...centralParts, end]);
  }

  function exportWorkbook(data, categories, currentBalance) {
    const sheets = makeSheets(data, categories, currentBalance);
    const workbookSheets = sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
    const sheetRelations = sheets.map((sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('');
    const contentOverrides = sheets.map((sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const files = [
      { name: '[Content_Types].xml', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${contentOverrides}</Types>` },
      { name: '_rels/.rels', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name: 'xl/workbook.xml', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="18000" windowHeight="9000"/></bookViews><sheets>${workbookSheets}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRelations}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', content: stylesXml() },
      ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: worksheetXml(sheet) }))
    ];
    const bytes = zipStore(files);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date();
    link.href = url;
    link.download = `ruanguang-rekap-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.xlsx`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  window.RuangUangExcel = Object.freeze({ exportWorkbook });
})();
