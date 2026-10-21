(() => {
  'use strict';

  const STORAGE_KEY = 'ruanguang.v1';
  const THEME_KEY = 'ruanguang.theme';
  const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const monthFmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
  const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const fullDateFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const today = new Date();
  let currentPage = 'dashboard';
  let calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedCalendarDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let transactionSearch = '';
  let transactionFilter = 'all';
  let reportCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  let hideMoney = false;

  const categoryMeta = {
    salary: { name: 'Gaji', icon: '💼', color: '#6be4c2', type: 'income' },
    freelance: { name: 'Freelance', icon: '✨', color: '#86a8ff', type: 'income' },
    food: { name: 'Makan & minum', icon: '🍜', color: '#6be4c2', type: 'expense' },
    transport: { name: 'Transportasi', icon: '🚗', color: '#86a8ff', type: 'expense' },
    home: { name: 'Rumah & tagihan', icon: '🏠', color: '#c3a1ff', type: 'expense' },
    shopping: { name: 'Belanja', icon: '🛍️', color: '#ffbd76', type: 'expense' },
    health: { name: 'Kesehatan', icon: '💊', color: '#ff7f91', type: 'expense' },
    fun: { name: 'Hiburan', icon: '🎬', color: '#c3a1ff', type: 'expense' },
    education: { name: 'Pendidikan', icon: '📚', color: '#86a8ff', type: 'expense' },
    other: { name: 'Lainnya', icon: '💫', color: '#aebbd0', type: 'expense' }
  };
  const goalIcons = ['🏖️', '🛵', '🛡️', '🎓', '🏡', '✈️'];

  function dateAtMonth(monthDelta, day) {
    const base = new Date(today.getFullYear(), today.getMonth() + monthDelta, 1);
    const finalDay = Math.min(day, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate());
    return localISO(new Date(base.getFullYear(), base.getMonth(), finalDay));
  }
  function makeSeed() {
    const transactions = [];
    const add = (delta, day, title, category, amount, type, note = '') => transactions.push({
      id: uid(), date: dateAtMonth(delta, day), title, category, amount, type, note
    });
    for (let month = -5; month <= 0; month += 1) {
      add(month, 2, 'Gaji bulanan', 'salary', 12500000, 'income', 'Pemasukan rutin');
      if (month === 0) {
        add(month, 5, 'Proyek desain', 'freelance', 1750000, 'income', 'Pekerjaan sampingan');
        add(month, 3, 'Belanja bulanan', 'shopping', 780000, 'expense', 'Kebutuhan rumah');
        add(month, 4, 'Kopi & makan siang', 'food', 86000, 'expense', '');
        add(month, 6, 'Tagihan listrik', 'home', 425000, 'expense', 'PLN');
        add(month, 8, 'Transportasi', 'transport', 185000, 'expense', 'Bensin');
        add(month, 10, 'Kebutuhan dapur', 'food', 235000, 'expense', '');
        add(month, 12, 'Langganan streaming', 'fun', 79000, 'expense', '');
        add(month, 15, 'Apotek', 'health', 145000, 'expense', '');
        add(month, Math.max(1, Math.min(today.getDate(), 26)), 'Makan bersama', 'food', 210000, 'expense', '');
      } else {
        add(month, 6, 'Belanja kebutuhan', 'shopping', 620000 + (Math.abs(month) * 27000), 'expense', '');
        add(month, 10, 'Tagihan bulanan', 'home', 630000, 'expense', '');
        add(month, 14, 'Makan & transport', 'food', 480000, 'expense', '');
        add(month, 22, 'Hiburan akhir pekan', 'fun', 220000, 'expense', '');
        if (month % 2 === 0) add(month, 18, 'Kerja sampingan', 'freelance', 650000, 'income', '');
      }
    }
    return {
      version: 1,
      transactions,
      budgets: [
        { id: uid(), category: 'food', limit: 2200000 }, { id: uid(), category: 'transport', limit: 900000 },
        { id: uid(), category: 'home', limit: 1800000 }, { id: uid(), category: 'shopping', limit: 1200000 },
        { id: uid(), category: 'fun', limit: 650000 }, { id: uid(), category: 'health', limit: 500000 }
      ],
      goals: [
        { id: uid(), title: 'Liburan ke Lombok', icon: '🏖️', target: 12000000, saved: 7350000, deadline: dateAtMonth(5, 28) },
        { id: uid(), title: 'Dana darurat', icon: '🛡️', target: 30000000, saved: 11800000, deadline: dateAtMonth(15, 28) },
        { id: uid(), title: 'Upgrade laptop', icon: '💻', target: 18000000, saved: 6300000, deadline: dateAtMonth(8, 28) }
      ],
      bills: [
        { id: uid(), title: 'Internet rumah', category: 'home', amount: 350000, dueDate: dateAtMonth(0, Math.min(25, Math.max(1, today.getDate() + 3))), paid: false },
        { id: uid(), title: 'Listrik & air', category: 'home', amount: 475000, dueDate: dateAtMonth(0, Math.min(28, Math.max(1, today.getDate() + 7))), paid: false },
        { id: uid(), title: 'Asuransi kesehatan', category: 'health', amount: 285000, dueDate: dateAtMonth(1, 10), paid: false },
        { id: uid(), title: 'Langganan musik', category: 'fun', amount: 54000, dueDate: dateAtMonth(1, 15), paid: false }
      ]
    };
  }
  function uid() {
    try { return crypto.randomUUID(); } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
  }
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return makeSeed();
      const parsed = JSON.parse(saved);
      if (parsed && parsed.version === 1 && Array.isArray(parsed.transactions) && Array.isArray(parsed.budgets) && Array.isArray(parsed.goals) && Array.isArray(parsed.bills)) return parsed;
    } catch { /* Corrupt or unavailable local storage falls back to a fresh sample. */ }
    return makeSeed();
  }
  let data = loadData();
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      toast('Penyimpanan perangkat penuh atau tidak tersedia.', true);
    }
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function fmt(value) { return money.format(Number(value) || 0); }
  function dateOnly(value) { return new Date(`${value}T12:00:00`); }
  function fmtDate(value) { return dateFmt.format(dateOnly(value)); }
  function localISO(date) {
    const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function isThisMonth(date) {
    const d = dateOnly(date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }
  function monthTransactions(monthDate) {
    return data.transactions.filter(t => {
      const d = dateOnly(t.date);
      return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth();
    });
  }
  function totals(transactions) {
    return transactions.reduce((acc, t) => { acc[t.type] += Number(t.amount) || 0; return acc; }, { income: 0, expense: 0 });
  }
  function balance() {
    const all = totals(data.transactions);
    return 18000000 + all.income - all.expense;
  }
  function category(categoryId) { return categoryMeta[categoryId] || categoryMeta.other; }
  function formatAmount(t) {
    const sign = t.type === 'income' ? '+' : '−';
    return `<span class="${t.type === 'income' ? 'positive' : ''}">${sign}${fmt(t.amount)}</span>`;
  }
  function currentMonthName() { return monthFmt.format(today); }
  function render() {
    const page = $('#page-content');
    if (!page) return;
    const pageNames = { dashboard: 'Ringkasan', transactions: 'Transaksi', budgets: 'Anggaran', goals: 'Target tabungan', calculators: 'Kalkulator', calendar: 'Kalender', bills: 'Jadwal tagihan', insights: 'Insight', reports: 'Laporan bulanan', settings: 'Pengaturan' };
    $$('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.page === currentPage));
    $('#breadcrumb-current').textContent = pageNames[currentPage] || 'Ringkasan';
    const renderers = { dashboard: dashboardPage, transactions: transactionsPage, budgets: budgetsPage, goals: goalsPage, calculators: calculatorsPage, calendar: calendarPage, bills: billsPage, insights: insightsPage, reports: reportsPage, settings: settingsPage };
    page.innerHTML = (renderers[currentPage] || dashboardPage)();
    document.body.classList.toggle('hide-money', hideMoney);
  }
  function pageHeading(eyebrow, title, description, actions = '') {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;
  }
  function transactionRow(t, table = false) {
    const meta = category(t.category);
    const title = escapeHtml(t.title);
    if (table) return `<tr><td>${fmtDate(t.date)}</td><td class="cell-primary">${title}${t.note ? `<div class="cell-muted">${escapeHtml(t.note)}</div>` : ''}</td><td><span class="category-pill">${meta.icon} ${escapeHtml(meta.name)}</span></td><td>${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td><td class="${t.type === 'income' ? 'positive' : ''}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</td><td><button class="text-link" data-action="delete-transaction" data-id="${escapeHtml(t.id)}" aria-label="Hapus ${title}">Hapus</button></td></tr>`;
    return `<div class="transaction-row"><span class="transaction-emoji">${meta.icon}</span><div class="transaction-main"><strong>${title}</strong><small>${escapeHtml(meta.name)} · ${fmtDate(t.date)}</small></div><div class="transaction-amount ${t.type === 'income' ? 'positive' : ''}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}<small>${t.type === 'income' ? 'Masuk' : 'Keluar'}</small></div></div>`;
  }
  function dashboardPage() {
    const thisMonth = monthTransactions(today);
    const monthTotal = totals(thisMonth);
    const currentBudgets = budgetStats();
    const rate = monthTotal.income ? Math.max(0, Math.round((monthTotal.income - monthTotal.expense) / monthTotal.income * 100)) : 0;
    const latest = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const actions = `<span class="date-chip">◷ &nbsp;<strong id="dashboard-clock">--:--:--</strong> WITA</span><span class="date-chip">▦ &nbsp;${escapeHtml(currentMonthName())}</span><button class="button button-primary" data-action="open-transaction">＋ &nbsp;Tambah transaksi</button>`;
    return `${pageHeading('RUANG KENDALI KEUANGAN', 'Keuanganmu, dalam kendali 👋', 'Ringkas, terarah, dan selalu mengikuti catatan terbarumu.', actions)}
      <section class="hero-card"><div class="hero-top"><div class="hero-label"><span>◫</span> Total saldo saat ini</div><div class="hero-tools"><span class="hero-badge">● &nbsp;Tersusun rapi</span><button class="balance-toggle" data-action="toggle-money" aria-label="${hideMoney ? 'Tampilkan nominal' : 'Sembunyikan nominal'}" title="${hideMoney ? 'Tampilkan nominal' : 'Sembunyikan nominal'}">${hideMoney ? '◉' : '◌'}</button></div></div><div class="hero-value">${fmt(balance())}</div><div class="hero-caption">Pantau arus uang dan jaga langkahmu tetap <b>di jalur.</b></div><div class="hero-bottom"><div class="hero-mini">Pemasukan bulan ini<strong>${fmt(monthTotal.income)}</strong></div><div class="hero-mini">Pengeluaran bulan ini<strong>${fmt(monthTotal.expense)}</strong></div><div class="hero-mini">Rasio menabung<strong>${rate}%</strong></div></div></section>
      <section class="metric-grid"><article class="metric-card"><div class="metric-head">Pemasukan bulan ini <span class="metric-icon green">↙</span></div><div class="metric-value">${fmt(monthTotal.income)}</div><div class="metric-foot positive">● &nbsp;Dana yang masuk</div></article><article class="metric-card"><div class="metric-head">Pengeluaran bulan ini <span class="metric-icon purple">↗</span></div><div class="metric-value">${fmt(monthTotal.expense)}</div><div class="metric-foot">Dari ${fmt(currentBudgets.totalLimit)} anggaran</div></article><article class="metric-card"><div class="metric-head">Target aktif <span class="metric-icon orange">◎</span></div><div class="metric-value">${data.goals.length} <span style="font-size:10px;color:var(--muted);font-weight:500">target</span></div><div class="metric-foot">${data.goals.filter(g => g.target <= g.saved).length} target tercapai</div></article></section>
      <section class="quick-actions"><div class="quick-actions-title"><div><strong>Akses cepat</strong><span>Aksi yang sering kamu pakai</span></div></div><div class="quick-actions-grid"><button class="quick-action" data-action="open-transaction"><span class="quick-action-icon expense-icon">↗</span><span><strong>Catat pengeluaran</strong><small>Uang keluar</small></span><b>＋</b></button><button class="quick-action" data-action="open-income"><span class="quick-action-icon income-icon">↙</span><span><strong>Catat pemasukan</strong><small>Uang masuk</small></span><b>＋</b></button><button class="quick-action" data-page="budgets"><span class="quick-action-icon budget-icon">◉</span><span><strong>Atur anggaran</strong><small>Jaga batas bulanan</small></span><b>→</b></button><button class="quick-action" data-page="reports"><span class="quick-action-icon report-icon">▥</span><span><strong>Lihat laporan</strong><small>Baca progresmu</small></span><b>→</b></button></div></section>
      <section class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><div class="panel-title">Arus kas</div><div class="panel-subtitle">Pemasukan & pengeluaran · 6 bulan terakhir</div></div><div class="chart-legend"><span><i class="legend-dot" style="background:var(--mint)"></i>Masuk</span><span><i class="legend-dot" style="background:var(--blue)"></i>Keluar</span></div></div>${cashflowChart()}</article><article class="panel"><div class="panel-heading"><div><div class="panel-title">Anggaran terpakai</div><div class="panel-subtitle">Pengeluaran berdasarkan kategori</div></div><button class="text-link" data-page="budgets">Detail →</button></div>${budgetDonut()}</article></section>
      <section class="split-panels"><article class="panel"><div class="panel-heading"><div><div class="panel-title">Transaksi terbaru</div><div class="panel-subtitle">Aktivitas keuangan terakhirmu</div></div><button class="text-link" data-page="transactions">Lihat semua →</button></div><div class="transaction-list">${latest.length ? latest.map(t => transactionRow(t)).join('') : '<div class="empty-state">Belum ada transaksi</div>'}</div></article><article class="panel"><div class="panel-heading"><div><div class="panel-title">Target tabungan</div><div class="panel-subtitle">Sedikit demi sedikit, makin dekat</div></div><button class="text-link" data-page="goals">Semua →</button></div>${data.goals.slice(0, 3).map(goalMini).join('') || '<div class="empty-state">Buat target pertamamu</div>'}</article></section>`;
  }
  function cashflowChart() {
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ date, ...totals(monthTransactions(date)) });
    }
    const max = Math.max(1, ...months.flatMap(m => [m.income, m.expense])) * 1.12;
    const points = values => values.map((v, i) => `${30 + i * 91},${160 - (v / max) * 128}`).join(' ');
    const income = points(months.map(m => m.income));
    const expense = points(months.map(m => m.expense));
    const incomeCoords = income.split(' ').map(p => p.split(',').map(Number));
    const expenseCoords = expense.split(' ').map(p => p.split(',').map(Number));
    const areaPath = coords => `M ${coords[0][0]} 160 L ${coords.map(p => `${p[0]} ${p[1]}`).join(' L ')} L ${coords[coords.length - 1][0]} 160 Z`;
    const guides = [35, 75, 115, 155].map(y => `<line x1="30" y1="${y}" x2="490" y2="${y}" stroke="var(--line)" stroke-dasharray="3 5" opacity=".75"/>`).join('');
    const circles = (coords, color, values, label) => coords.split(' ').map((p, i) => { const [x, y] = p.split(','); const month = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(months[i].date); return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="var(--panel)" stroke-width="2"><title>${month} · ${label}: ${fmt(values[i])}</title></circle>`; }).join('');
    return `<div class="chart-wrap"><svg viewBox="0 0 520 175" role="img" aria-label="Grafik arus kas enam bulan terakhir"><defs><linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6be4c2" stop-opacity=".24"/><stop offset="1" stop-color="#6be4c2" stop-opacity="0"/></linearGradient><linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#86a8ff" stop-opacity=".17"/><stop offset="1" stop-color="#86a8ff" stop-opacity="0"/></linearGradient></defs>${guides}<path d="${areaPath(incomeCoords)}" fill="url(#incomeFill)"/><path d="${areaPath(expenseCoords)}" fill="url(#expenseFill)"/><polyline points="${income}" fill="none" stroke="#6be4c2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${expense}" fill="none" stroke="#86a8ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${circles(income, '#6be4c2', months.map(m => m.income), 'Pemasukan')}${circles(expense, '#86a8ff', months.map(m => m.expense), 'Pengeluaran')}</svg><div class="chart-labels">${months.map(m => `<span>${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(m.date)}</span>`).join('')}</div></div>`;
  }
  function budgetStats() {
    const spent = totals(monthTransactions(today)).expense;
    const categories = data.budgets.map(b => ({ ...b, spent: monthTransactions(today).filter(t => t.type === 'expense' && t.category === b.category).reduce((s, t) => s + Number(t.amount), 0) }));
    return { categories, totalLimit: categories.reduce((s, b) => s + Number(b.limit), 0), totalSpent: spent };
  }
  function budgetDonut() {
    const stats = budgetStats();
    const colors = ['#6be4c2', '#86a8ff', '#c3a1ff', '#ffbd76', '#ff7f91', '#89d5ef'];
    const totalSpent = stats.categories.reduce((s, c) => s + c.spent, 0);
    let cumulative = 0;
    const stops = stats.categories.filter(c => c.spent > 0).map((c, index, list) => {
      const part = totalSpent ? c.spent / totalSpent * 100 : 0; const start = cumulative; cumulative += part;
      return `${colors[index % colors.length]} ${start.toFixed(1)}% ${cumulative.toFixed(1)}%`;
    });
    const bg = stops.length ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(var(--panel-3) 0 100%)';
    const rows = stats.categories.filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 4).map(c => {
      const index = stats.categories.indexOf(c); const pct = totalSpent ? Math.round(c.spent / totalSpent * 100) : 0;
      return `<div class="category-row"><span class="category-name"><i style="background:${colors[index % colors.length]}"></i>${escapeHtml(category(c.category).name)}</span><strong>${pct}%</strong></div>`;
    }).join('') || '<div class="muted-copy">Catat transaksi agar kategori tampil.</div>';
    return `<div class="budget-summary"><div class="donut" style="background:${bg}"><div class="donut-center">${fmt(totalSpent)}<small>terpakai</small></div></div><div class="category-legend">${rows}</div></div>`;
  }
  function goalMini(goal) {
    const pct = Math.min(100, Math.round(goal.saved / Math.max(1, goal.target) * 100));
    return `<div class="reminder-row"><span class="goal-emoji">${escapeHtml(goal.icon || '◎')}</span><div class="reminder-copy"><strong>${escapeHtml(goal.title)}</strong><small>${fmt(goal.saved)} dari ${fmt(goal.target)}</small><div class="category-track"><span style="width:${pct}%"></span></div></div><b class="muted-copy">${pct}%</b></div>`;
  }
  function transactionsPage() {
    const actions = `<button class="button button-quiet" data-action="export-csv">⇩ &nbsp;Unduh CSV</button><button class="button button-primary" data-action="open-transaction">＋ &nbsp;Tambah transaksi</button>`;
    const query = transactionSearch.toLocaleLowerCase('id');
    const items = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).filter(t => (transactionFilter === 'all' || t.type === transactionFilter) && `${t.title} ${t.note || ''} ${category(t.category).name}`.toLocaleLowerCase('id').includes(query));
    return `${pageHeading('CATATAN UANG', 'Transaksi', 'Semua pemasukan dan pengeluaran, tertata dalam satu tempat.', actions)}<section class="panel"><div class="panel-heading"><div><div class="panel-title">Riwayat transaksi</div><div class="panel-subtitle">${items.length} catatan · Data tersimpan otomatis</div></div><div class="table-tools"><input class="search-input" id="transaction-search" type="search" placeholder="Cari transaksi..." value="${escapeHtml(transactionSearch)}" aria-label="Cari transaksi"><select class="select-input" id="transaction-filter" aria-label="Filter jenis transaksi"><option value="all" ${transactionFilter === 'all' ? 'selected' : ''}>Semua jenis</option><option value="income" ${transactionFilter === 'income' ? 'selected' : ''}>Pemasukan</option><option value="expense" ${transactionFilter === 'expense' ? 'selected' : ''}>Pengeluaran</option></select></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>TANGGAL</th><th>DESKRIPSI</th><th>KATEGORI</th><th>JENIS</th><th>NOMINAL</th><th></th></tr></thead><tbody>${items.map(t => transactionRow(t, true)).join('') || '<tr><td colspan="6"><div class="empty-state"><span>⌕</span>Tidak ada transaksi yang cocok.</div></td></tr>'}</tbody></table></div></section>`;
  }
  function budgetsPage() {
    const actions = `<button class="button button-primary" data-action="open-budget">＋ &nbsp;Tambah anggaran</button>`;
    const stats = budgetStats();
    return `${pageHeading('BATAS YANG MEMBANTU', 'Anggaran bulanan', 'Buat batas yang realistis untuk kategori pengeluaranmu.', actions)}<div class="metric-grid"><article class="metric-card"><div class="metric-head">Total anggaran <span class="metric-icon green">◎</span></div><div class="metric-value">${fmt(stats.totalLimit)}</div><div class="metric-foot">Batas pengeluaran bulan ini</div></article><article class="metric-card"><div class="metric-head">Sudah terpakai <span class="metric-icon purple">↗</span></div><div class="metric-value">${fmt(stats.totalSpent)}</div><div class="metric-foot">Dari semua transaksi pengeluaran</div></article><article class="metric-card"><div class="metric-head">Sisa anggaran <span class="metric-icon orange">◷</span></div><div class="metric-value">${fmt(Math.max(0, stats.totalLimit - stats.totalSpent))}</div><div class="metric-foot">${stats.totalSpent > stats.totalLimit ? 'Pengeluaran melewati batas anggaran.' : 'Bisa dipakai sampai akhir bulan'}</div></article></div><div class="budget-grid">${stats.categories.map(b => {
      const meta = category(b.category); const pct = Math.round(b.spent / Math.max(1, b.limit) * 100); const colorClass = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
      return `<article class="budget-card"><div class="budget-card-head"><span class="budget-emoji">${meta.icon}</span><button class="text-link" data-action="delete-budget" data-id="${escapeHtml(b.id)}">Hapus</button></div><h3>${escapeHtml(meta.name)}</h3><div class="muted-copy">Batas untuk ${escapeHtml(currentMonthName())}</div><div class="budget-numbers"><strong>${fmt(b.spent)}</strong><span>dari ${fmt(b.limit)}</span></div><div class="progress-track"><span class="${colorClass}" style="width:${Math.min(100, pct)}%"></span></div><div class="budget-foot"><span>${pct}% terpakai</span><span>${pct >= 100 ? 'Batas tercapai' : `Sisa ${fmt(Math.max(0, b.limit - b.spent))}`}</span></div></article>`;
    }).join('') || '<div class="empty-state">Belum ada anggaran. Tambahkan kategori untuk mulai merencanakan.</div>'}</div>`;
  }
  function goalsPage() {
    const actions = `<button class="button button-primary" data-action="open-goal">＋ &nbsp;Buat target</button>`;
    return `${pageHeading('RANCANG MASA DEPAN', 'Target tabungan', 'Namai tujuanmu, lalu isi sedikit demi sedikit.', actions)}<div class="goal-grid">${data.goals.map((goal, i) => {
      const pct = Math.min(100, Math.round(goal.saved / Math.max(1, goal.target) * 100)); const done = pct >= 100;
      return `<article class="goal-card"><div class="goal-card-head"><span class="goal-emoji">${escapeHtml(goal.icon || goalIcons[i % goalIcons.length])}</span><button class="text-link" data-action="delete-goal" data-id="${escapeHtml(goal.id)}">Hapus</button></div><h3>${escapeHtml(goal.title)}</h3><div class="goal-amount">${fmt(goal.saved)}</div><div class="goal-deadline">dari target ${fmt(goal.target)}${goal.deadline ? ` · ${fmtDate(goal.deadline)}` : ''}</div><div class="progress-track" style="margin-top:13px"><span style="width:${pct}%"></span></div><div class="budget-foot"><span>${pct}% tercapai</span><span>${done ? '🎉 Target tercapai' : `Kurang ${fmt(goal.target - goal.saved)}`}</span></div><button class="button button-quiet button-small" data-action="contribute-goal" data-id="${escapeHtml(goal.id)}">＋ Tambah tabungan</button></article>`;
    }).join('') || '<div class="empty-state">Belum ada target tabungan.</div>'}</div>`;
  }
  function calculatorsPage() {
    return `${pageHeading('HITUNG DENGAN PERCAYA DIRI', 'Kalkulator keuangan', 'Coba berbagai skenario sebelum mengambil keputusan.', '')}<div class="calculator-grid"><section class="panel calculator-card"><h2>✦ &nbsp;Kalkulator bunga majemuk</h2><p>Perkirakan nilai tabungan atau investasi dari waktu ke waktu.</p><div class="form-grid"><div class="field"><label for="compound-start">Modal awal</label><input class="field-input calc-input" id="compound-start" type="number" min="0" value="5000000"></div><div class="field"><label for="compound-monthly">Setoran per bulan</label><input class="field-input calc-input" id="compound-monthly" type="number" min="0" value="500000"></div><div class="field"><label for="compound-rate">Imbal hasil per tahun (%)</label><input class="field-input calc-input" id="compound-rate" type="number" min="0" max="100" step="0.1" value="6"></div><div class="field"><label for="compound-years">Lama menabung (tahun)</label><input class="field-input calc-input" id="compound-years" type="number" min="1" max="80" value="5"></div></div><div class="result-box"><small>Perkiraan nilai akhir</small><strong id="compound-result">—</strong><p id="compound-note">Belum termasuk pajak, biaya, atau perubahan hasil investasi.</p></div></section>
      <section class="panel calculator-card"><h2>⌗ &nbsp;Kalkulator cicilan</h2><p>Estimasi cicilan tetap per bulan berdasarkan bunga dan tenor.</p><div class="form-grid"><div class="field"><label for="loan-amount">Jumlah pinjaman</label><input class="field-input calc-input" id="loan-amount" type="number" min="0" value="50000000"></div><div class="field"><label for="loan-rate">Bunga per tahun (%)</label><input class="field-input calc-input" id="loan-rate" type="number" min="0" max="100" step="0.1" value="9"></div><div class="field"><label for="loan-years">Tenor (tahun)</label><input class="field-input calc-input" id="loan-years" type="number" min="1" max="50" value="3"></div><div class="field"><label for="loan-fee">Biaya awal (opsional)</label><input class="field-input calc-input" id="loan-fee" type="number" min="0" value="0"></div></div><div class="result-box"><small>Perkiraan cicilan per bulan</small><strong id="loan-result">—</strong><p id="loan-note">Simulasi sederhana; penawaran lembaga keuangan dapat berbeda.</p></div></section>
      <section class="panel calculator-card"><h2>◉ &nbsp;Pembagi anggaran 50/30/20</h2><p>Contoh pembagian penghasilan bersih untuk kebutuhan, keinginan, dan masa depan.</p><div class="field"><label for="split-income">Penghasilan bersih per bulan</label><input class="field-input calc-input" id="split-income" type="number" min="0" value="12000000"></div><div class="category-legend" id="split-results" style="margin-top:16px"></div><div class="result-box"><small>Catatan</small><p>Persentase ini hanya panduan umum. Sesuaikan dengan kebutuhan, kewajiban, dan tujuanmu.</p></div></section>
      <section class="panel calculator-card"><h2>◷ &nbsp;Hitung target tabungan</h2><p>Berapa lama waktu yang dibutuhkan untuk mencapai targetmu?</p><div class="form-grid"><div class="field"><label for="target-amount">Target yang ingin dicapai</label><input class="field-input calc-input" id="target-amount" type="number" min="1" value="10000000"></div><div class="field"><label for="target-saved">Tabungan saat ini</label><input class="field-input calc-input" id="target-saved" type="number" min="0" value="2500000"></div><div class="field field-full"><label for="target-monthly">Rencana menabung per bulan</label><input class="field-input calc-input" id="target-monthly" type="number" min="1" value="750000"></div></div><div class="result-box"><small>Perkiraan waktu</small><strong id="target-result">—</strong><p id="target-note">Perhitungan ini tidak memasukkan bunga atau inflasi.</p></div></section></div>`;
  }
  function billsPage() {
    const actions = `<button class="button button-primary" data-action="open-bill">＋ &nbsp;Tambah tagihan</button>`;
    const sorted = [...data.bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const unpaid = data.bills.filter(b => !b.paid).reduce((sum, b) => sum + Number(b.amount), 0);
    return `${pageHeading('TETAP INGAT JADWAL', 'Jadwal tagihan', 'Catat tagihan berulang agar tidak terlewat.', actions)}<div class="metric-grid"><article class="metric-card"><div class="metric-head">Belum dibayar <span class="metric-icon orange">◷</span></div><div class="metric-value">${fmt(unpaid)}</div><div class="metric-foot">${data.bills.filter(b => !b.paid).length} tagihan tersisa</div></article><article class="metric-card"><div class="metric-head">Sudah beres <span class="metric-icon green">✓</span></div><div class="metric-value">${data.bills.filter(b => b.paid).length}</div><div class="metric-foot">Tandai lunas setelah membayar</div></article><article class="metric-card"><div class="metric-head">Total jadwal <span class="metric-icon purple">▤</span></div><div class="metric-value">${data.bills.length}</div><div class="metric-foot">Pengingat pribadi di perangkatmu</div></article></div><section class="panel"><div class="panel-heading"><div><div class="panel-title">Daftar tagihan</div><div class="panel-subtitle">Atur tanggal dan tandai status pembayaran</div></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>JATUH TEMPO</th><th>TAGIHAN</th><th>KATEGORI</th><th>NOMINAL</th><th>STATUS</th><th></th></tr></thead><tbody>${sorted.map(b => {
      const due = dateOnly(b.dueDate); const past = due < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && !b.paid; const meta = category(b.category);
      const status = b.paid ? '<span class="status-pill paid">✓ Lunas</span>' : past ? '<span class="status-pill overdue">Terlambat</span>' : '<span class="status-pill due">● Menunggu</span>';
      return `<tr><td>${fmtDate(b.dueDate)}</td><td class="cell-primary">${escapeHtml(b.title)}</td><td><span class="category-pill">${meta.icon} ${escapeHtml(meta.name)}</span></td><td>${fmt(b.amount)}</td><td>${status}</td><td><button class="text-link" data-action="toggle-bill" data-id="${escapeHtml(b.id)}">${b.paid ? 'Batalkan' : 'Tandai lunas'}</button></td></tr>`;
    }).join('') || '<tr><td colspan="6"><div class="empty-state">Belum ada tagihan yang dicatat.</div></td></tr>'}</tbody></table></div></section>`;
  }
  function calendarPage() {
    const year = calendarCursor.getFullYear(); const month = calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const mondayFirst = (firstDay + 6) % 7;
    const monthLength = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(year, month, 1 - mondayFirst + i); const iso = localISO(date); const dayEvents = data.transactions.filter(t => t.date === iso).length + data.bills.filter(b => b.dueDate === iso).length;
      const classes = ['calendar-day']; if (date.getMonth() !== month) classes.push('other'); if (iso === localISO(today)) classes.push('today'); if (iso === localISO(selectedCalendarDay)) classes.push('selected');
      cells.push(`<button class="${classes.join(' ')}" data-action="select-day" data-date="${iso}">${date.getDate()}${dayEvents ? `<span class="calendar-dots">${Array.from({ length: Math.min(dayEvents, 3) }, (_, n) => `<i style="background:${n === 1 ? 'var(--blue)' : 'var(--mint)'}"></i>`).join('')}</span>` : ''}</button>`);
    }
    const selectedISO = localISO(selectedCalendarDay);
    const events = [
      ...data.transactions.filter(t => t.date === selectedISO).map(t => ({ date: t.date, title: t.title, detail: `${category(t.category).name} · ${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}`, type: t.type })),
      ...data.bills.filter(b => b.dueDate === selectedISO).map(b => ({ date: b.dueDate, title: b.title, detail: `Tagihan · ${fmt(b.amount)}`, type: 'bill' }))
    ];
    return `${pageHeading('WAKTU & RENCANA', 'Kalender keuangan', 'Pantau transaksi dan tanggal tagihan dalam kalender.', `<button class="button button-quiet" data-action="today-calendar">Kembali ke hari ini</button>`)}<div class="calendar-layout"><section class="panel calendar-panel"><div class="calendar-toolbar"><div class="calendar-month">${escapeHtml(monthFmt.format(calendarCursor))}</div><div class="calendar-controls"><button data-action="calendar-prev" aria-label="Bulan sebelumnya">‹</button><button data-action="calendar-next" aria-label="Bulan berikutnya">›</button></div></div><div class="calendar-grid">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => `<div class="calendar-weekday">${d}</div>`).join('')}${cells.join('')}</div></section><aside class="calendar-side"><section class="clock-card"><div class="eyebrow">WAKTU SAAT INI · WITA</div><div class="big-clock" id="calendar-clock">--:--:--</div><p id="calendar-date-label">${escapeHtml(fullDateFmt.format(today))}</p></section><section class="panel"><div class="selected-day-title">${escapeHtml(fullDateFmt.format(selectedCalendarDay))}</div>${events.length ? events.map(ev => `<div class="reminder-row"><span class="reminder-date">${ev.type === 'bill' ? '▤' : ev.type === 'income' ? '↙' : '↗'}</span><div class="reminder-copy"><strong>${escapeHtml(ev.title)}</strong><small>${escapeHtml(ev.detail)}</small></div></div>`).join('') : '<div class="empty-state" style="padding:18px 5px">Tidak ada catatan di hari ini.</div>'}<button class="button button-quiet button-small" data-action="open-transaction" style="margin-top:10px">＋ Tambah transaksi</button></section></aside></div>`;
  }
  function insightsPage() {
    const month = totals(monthTransactions(today)); const saved = Math.max(0, month.income - month.expense); const rate = month.income ? Math.round(saved / month.income * 100) : 0;
    const previous = totals(monthTransactions(new Date(today.getFullYear(), today.getMonth() - 1, 1)));
    const change = previous.expense ? Math.round((month.expense - previous.expense) / previous.expense * 100) : 0;
    const top = budgetStats().categories.sort((a, b) => b.spent - a.spent)[0];
    return `${pageHeading('RINGKASAN POLA KEUANGAN', 'Insight bulan ini', 'Angka sederhana untuk membantu melihat kebiasaan uangmu.', `<span class="date-chip">▦ &nbsp;${escapeHtml(currentMonthName())}</span>`)}<div class="insight-grid"><article class="insight-card"><span class="insight-icon">✦</span><h3>Rasio menabung</h3><p>Kamu menyisihkan sekitar <strong>${rate}%</strong> dari pemasukan bulan ini (${fmt(saved)}). Kebiasaan kecil yang konsisten sangat berarti.</p></article><article class="insight-card"><span class="insight-icon">↗</span><h3>Perubahan pengeluaran</h3><p>${change > 0 ? `Pengeluaran naik ${change}%` : change < 0 ? `Pengeluaran turun ${Math.abs(change)}%` : 'Pengeluaran hampir sama'} dari bulan lalu. Bulan ini tercatat ${fmt(month.expense)}.</p></article><article class="insight-card"><span class="insight-icon">◉</span><h3>Kategori terbesar</h3><p>${top && top.spent ? `<strong>${escapeHtml(category(top.category).name)}</strong> menjadi kategori dengan pengeluaran tertinggi, sebesar ${fmt(top.spent)}.` : 'Belum cukup transaksi untuk mengenali kategori terbesar.'}</p></article><article class="insight-card"><span class="insight-icon">◎</span><h3>Progress tujuan</h3><p>Kamu punya <strong>${data.goals.length} target tabungan</strong>. ${data.goals.filter(g => g.saved >= g.target).length} target sudah tercapai. Setiap setoran membawamu lebih dekat.</p></article><article class="insight-card"><span class="insight-icon">⌑</span><h3>Anggaran bulanan</h3><p>Anggaran kategori total ${fmt(budgetStats().totalLimit)}. Pengeluaran saat ini ${fmt(budgetStats().totalSpent)}.</p></article><article class="insight-card"><span class="insight-icon">◷</span><h3>Saran ringan</h3><p>${rate < 10 ? 'Coba tinjau satu pengeluaran rutin yang bisa dikurangi.' : 'Kamu sedang membangun ruang untuk rencana masa depan. Pertahankan ritme yang nyaman.'} Sesuaikan langkah dengan kondisi pribadimu.</p></article></div><p class="muted-copy" style="margin:16px 2px">Insight ini dihitung dari catatan yang kamu simpan dan bukan saran investasi atau keuangan profesional.</p>`;
  }
  function reportsPage() {
    const selected = monthTransactions(reportCursor);
    const month = totals(selected);
    const previous = totals(monthTransactions(new Date(reportCursor.getFullYear(), reportCursor.getMonth() - 1, 1)));
    const net = month.income - month.expense;
    const saveRate = month.income ? Math.round(net / month.income * 100) : 0;
    const comparison = (value, base) => base ? `${value > base ? '+' : ''}${Math.round((value - base) / base * 100)}% dari bulan lalu` : 'Belum ada data bulan lalu';
    const grouped = Object.entries(categoryMeta).filter(([, meta]) => meta.type === 'expense').map(([id, meta]) => ({ id, meta, amount: selected.filter(t => t.type === 'expense' && t.category === id).reduce((sum, t) => sum + Number(t.amount), 0) })).filter(row => row.amount > 0).sort((a, b) => b.amount - a.amount);
    const maxCategory = Math.max(1, ...grouped.map(row => row.amount));
    const actions = `<div class="report-month-control"><button class="icon-button" data-action="report-prev" aria-label="Bulan sebelumnya">‹</button><span class="date-chip">${escapeHtml(monthFmt.format(reportCursor))}</span><button class="icon-button" data-action="report-next" aria-label="Bulan berikutnya">›</button><button class="button button-quiet button-small" data-action="report-current">Bulan ini</button></div><button class="button button-primary button-small" data-action="export-xlsx">▦ &nbsp;Unduh Rekap Excel</button>`;
    return `${pageHeading('REKAP KEUANGAN', 'Laporan bulanan', 'Lihat arus uang dan kategori pengeluaran per bulan.', actions)}<section class="metric-grid"><article class="metric-card"><div class="metric-head">Total pemasukan <span class="metric-icon green">↙</span></div><div class="metric-value">${fmt(month.income)}</div><div class="metric-foot">${comparison(month.income, previous.income)}</div></article><article class="metric-card"><div class="metric-head">Total pengeluaran <span class="metric-icon purple">↗</span></div><div class="metric-value">${fmt(month.expense)}</div><div class="metric-foot">${comparison(month.expense, previous.expense)}</div></article><article class="metric-card"><div class="metric-head">Selisih bersih <span class="metric-icon orange">◉</span></div><div class="metric-value ${net < 0 ? 'negative' : ''}">${fmt(net)}</div><div class="metric-foot">Rasio menabung ${saveRate}%</div></article></section><section class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><div class="panel-title">Arus kas enam bulan</div><div class="panel-subtitle">Grafik mengikuti catatan transaksimu</div></div><div class="chart-legend"><span><i class="legend-dot" style="background:var(--mint)"></i>Masuk</span><span><i class="legend-dot" style="background:var(--blue)"></i>Keluar</span></div></div>${cashflowChart()}</article><article class="panel"><div class="panel-heading"><div><div class="panel-title">Pengeluaran per kategori</div><div class="panel-subtitle">${escapeHtml(monthFmt.format(reportCursor))}</div></div></div><div class="report-categories">${grouped.map(row => `<div class="report-category"><div class="report-category-head"><span>${row.meta.icon} &nbsp;${escapeHtml(row.meta.name)}</span><strong>${fmt(row.amount)}</strong></div><div class="category-track"><span style="width:${Math.round(row.amount / maxCategory * 100)}%;background:${row.meta.color}"></span></div></div>`).join('') || '<div class="empty-state">Belum ada pengeluaran pada bulan ini.</div>'}</div></article></section><section class="panel report-transactions"><div class="panel-heading"><div><div class="panel-title">Transaksi bulan ini</div><div class="panel-subtitle">${selected.length} catatan · ${escapeHtml(monthFmt.format(reportCursor))}</div></div><button class="text-link" data-page="transactions">Kelola transaksi →</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>TANGGAL</th><th>DESKRIPSI</th><th>KATEGORI</th><th>JENIS</th><th>NOMINAL</th></tr></thead><tbody>${[...selected].sort((a, b) => b.date.localeCompare(a.date)).map(t => `<tr><td>${fmtDate(t.date)}</td><td class="cell-primary">${escapeHtml(t.title)}</td><td><span class="category-pill">${category(t.category).icon} ${escapeHtml(category(t.category).name)}</span></td><td>${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td><td class="${t.type === 'income' ? 'positive' : ''}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty-state">Belum ada transaksi untuk periode ini.</div></td></tr>'}</tbody></table></div></section>`;
  }
  function settingsPage() {
    return `${pageHeading('PREFERENSI & DATA', 'Pengaturan', 'Kelola tampilan dan salinan data pribadimu.', '')}<section class="panel settings-panel"><div class="panel-heading"><div><div class="panel-title">Data & privasi</div><div class="panel-subtitle">Semua data contoh dan catatan tersimpan secara lokal di browser ini.</div></div></div><div class="settings-row"><div><strong>Ekspor salinan data</strong><small>Unduh transaksi, anggaran, target, dan tagihan dalam berkas JSON.</small></div><button class="button button-quiet button-small" data-action="export-json">⇩ &nbsp;Ekspor data</button></div><div class="settings-row"><div><strong>Impor salinan data</strong><small>Pulihkan data dari berkas JSON yang sebelumnya kamu ekspor.</small></div><button class="button button-quiet button-small" data-action="import-json">⇧ &nbsp;Pilih berkas</button><input id="import-file" type="file" accept="application/json,.json" hidden></div><div class="settings-row"><div><strong>Ganti tema tampilan</strong><small>Sesuaikan warna aplikasi dengan preferensimu.</small></div><button class="button button-quiet button-small" data-action="toggle-theme">☼ &nbsp;Ganti tema</button></div><div class="settings-row"><div><strong>Kembalikan contoh awal</strong><small>Hapus perubahan lokal dan mulai kembali dari data contoh.</small></div><button class="button button-danger button-small" data-action="reset-data">Atur ulang</button></div></section>`;
  }
  function toast(message, error = false) {
    const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = message; $('#toast-region').append(el); setTimeout(() => el.remove(), 3200);
  }
  function modal(title, body) {
    $('#modal-root').innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${title}</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="Tutup">×</button></div>${body}</section></div>`;
    const first = $('input,select,button', $('#modal-root')); if (first) first.focus();
  }
  function categoryOptions(type, selected = '') {
    return Object.entries(categoryMeta).filter(([, m]) => type === 'all' || m.type === type).map(([id, m]) => `<option value="${id}" ${selected === id ? 'selected' : ''}>${m.icon} ${escapeHtml(m.name)}</option>`).join('');
  }
  function openTransactionModal(initialType = 'expense') {
    const incomeSelected = initialType === 'income';
    modal(incomeSelected ? 'Catat pemasukan' : 'Catat pengeluaran', `<form class="modal-form" id="transaction-form"><div class="field"><label for="tx-title">Nama transaksi</label><input class="field-input" id="tx-title" name="title" maxlength="72" required placeholder="${incomeSelected ? 'Contoh: Gaji bulanan' : 'Contoh: Belanja mingguan'}"></div><div class="form-grid"><div class="field"><label for="tx-type">Jenis</label><select class="field-input" id="tx-type" name="type"><option value="expense" ${incomeSelected ? '' : 'selected'}>Pengeluaran</option><option value="income" ${incomeSelected ? 'selected' : ''}>Pemasukan</option></select></div><div class="field"><label for="tx-amount">Nominal (Rp)</label><input class="field-input" id="tx-amount" name="amount" type="number" min="1" max="1000000000000" required placeholder="150000"></div><div class="field"><label for="tx-category">Kategori</label><select class="field-input" id="tx-category" name="category">${categoryOptions(incomeSelected ? 'income' : 'expense')}</select></div><div class="field"><label for="tx-date">Tanggal</label><input class="field-input" id="tx-date" name="date" type="date" value="${localISO(today)}" required></div><div class="field field-full"><label for="tx-note">Catatan (opsional)</label><input class="field-input" id="tx-note" name="note" maxlength="100" placeholder="Tambahkan konteks singkat"></div></div><div class="modal-actions"><button class="button button-quiet" type="button" data-action="close-modal">Batal</button><button class="button button-primary" type="submit">Simpan transaksi</button></div></form>`);
  }
  function openBudgetModal() {
    const used = new Set(data.budgets.map(b => b.category));
    const options = Object.entries(categoryMeta).filter(([, m]) => m.type === 'expense' && !used.has(Object.keys(categoryMeta).find(k => categoryMeta[k] === m))).map(([id, m]) => `<option value="${id}">${m.icon} ${escapeHtml(m.name)}</option>`).join('');
    modal('Tambah anggaran', `<form class="modal-form" id="budget-form"><div class="field"><label for="budget-category">Kategori pengeluaran</label><select class="field-input" id="budget-category" name="category" required>${options || '<option value="">Semua kategori sudah punya batas</option>'}</select></div><div class="field"><label for="budget-limit">Batas per bulan (Rp)</label><input class="field-input" id="budget-limit" name="limit" type="number" min="1" max="1000000000000" required placeholder="1000000"></div><div class="modal-actions"><button class="button button-quiet" type="button" data-action="close-modal">Batal</button><button class="button button-primary" type="submit" ${options ? '' : 'disabled'}>Simpan anggaran</button></div></form>`);
  }
  function openGoalModal() {
    modal('Buat target tabungan', `<form class="modal-form" id="goal-form"><div class="field"><label for="goal-title">Nama target</label><input class="field-input" id="goal-title" name="title" maxlength="60" required placeholder="Contoh: Dana darurat"></div><div class="form-grid"><div class="field"><label for="goal-target">Nominal target (Rp)</label><input class="field-input" id="goal-target" name="target" type="number" min="1" max="1000000000000" required placeholder="10000000"></div><div class="field"><label for="goal-current">Sudah terkumpul (Rp)</label><input class="field-input" id="goal-current" name="saved" type="number" min="0" value="0"></div><div class="field"><label for="goal-icon">Ikon</label><select class="field-input" id="goal-icon" name="icon">${goalIcons.map(icon => `<option>${icon}</option>`).join('')}</select></div><div class="field"><label for="goal-date">Tanggal target (opsional)</label><input class="field-input" id="goal-date" name="deadline" type="date"></div></div><div class="modal-actions"><button class="button button-quiet" type="button" data-action="close-modal">Batal</button><button class="button button-primary" type="submit">Simpan target</button></div></form>`);
  }
  function openContributionModal(id) {
    const goal = data.goals.find(g => g.id === id); if (!goal) return;
    modal('Tambah tabungan', `<form class="modal-form" id="contribution-form" data-id="${escapeHtml(goal.id)}"><p class="muted-copy" style="margin:0">Tujuan: <strong>${escapeHtml(goal.title)}</strong> · Sisa ${fmt(Math.max(0, goal.target - goal.saved))}</p><div class="field"><label for="contribution-amount">Nominal setoran (Rp)</label><input class="field-input" id="contribution-amount" name="amount" type="number" min="1" max="1000000000000" required placeholder="500000"></div><div class="modal-actions"><button class="button button-quiet" type="button" data-action="close-modal">Batal</button><button class="button button-primary" type="submit">Tambah setoran</button></div></form>`);
  }
  function openBillModal() {
    modal('Tambah jadwal tagihan', `<form class="modal-form" id="bill-form"><div class="field"><label for="bill-title">Nama tagihan</label><input class="field-input" id="bill-title" name="title" maxlength="72" required placeholder="Contoh: Internet rumah"></div><div class="form-grid"><div class="field"><label for="bill-amount">Nominal (Rp)</label><input class="field-input" id="bill-amount" name="amount" type="number" min="1" max="1000000000000" required placeholder="350000"></div><div class="field"><label for="bill-category">Kategori</label><select class="field-input" id="bill-category" name="category">${categoryOptions('expense')}</select></div><div class="field field-full"><label for="bill-date">Tanggal jatuh tempo</label><input class="field-input" id="bill-date" name="dueDate" type="date" required value="${localISO(today)}"></div></div><div class="modal-actions"><button class="button button-quiet" type="button" data-action="close-modal">Batal</button><button class="button button-primary" type="submit">Simpan tagihan</button></div></form>`);
  }
  function updateClock() {
    const now = new Date();
    const time = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Makassar', weekday: 'short', day: 'numeric', month: 'short' }).format(now);
    const clock = $('#clock-time'); const dateEl = $('#clock-date'); const calendarClock = $('#calendar-clock'); const calendarDate = $('#calendar-date-label');
    const dashboardClock = $('#dashboard-clock');
    if (clock) clock.textContent = time; if (dateEl) dateEl.textContent = date; if (calendarClock) calendarClock.textContent = time;
    if (dashboardClock) dashboardClock.textContent = time;
    if (calendarDate && currentPage === 'calendar' && localISO(selectedCalendarDay) === localISO(today)) calendarDate.textContent = fullDateFmt.format(now);
    $('#footer-year').textContent = String(now.getFullYear());
  }
  function switchPage(page) {
    currentPage = page;
    $('#sidebar').classList.remove('open'); $('#sidebar-scrim').classList.remove('show');
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function updateCalculators() {
    const val = id => Math.max(0, Number($(id)?.value) || 0);
    const start = val('#compound-start'); const monthly = val('#compound-monthly'); const annualRate = Math.min(100, val('#compound-rate')) / 100; const years = Math.min(80, val('#compound-years'));
    const months = Math.round(years * 12); const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const futureStart = start * Math.pow(1 + monthlyRate, months);
    const futurePayments = monthlyRate ? monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : monthly * months;
    const compoundResult = $('#compound-result'); if (compoundResult) compoundResult.textContent = fmt(futureStart + futurePayments);
    const amount = val('#loan-amount'); const loanRate = Math.min(100, val('#loan-rate')) / 100 / 12; const loanMonths = Math.min(600, Math.round(val('#loan-years') * 12)); const fee = val('#loan-fee');
    const payment = loanRate ? amount * loanRate * Math.pow(1 + loanRate, loanMonths) / (Math.pow(1 + loanRate, loanMonths) - 1) : amount / Math.max(1, loanMonths);
    const loanResult = $('#loan-result'); if (loanResult) loanResult.textContent = fmt(payment);
    const loanNote = $('#loan-note'); if (loanNote) loanNote.textContent = `${loanMonths ? `${loanMonths} bulan · Total pembayaran sekitar ${fmt(payment * loanMonths + fee)}` : 'Masukkan tenor yang valid.'}${fee ? ` termasuk biaya awal ${fmt(fee)}` : ''}.`;
    const income = val('#split-income'); const split = $('#split-results');
    if (split) split.innerHTML = [['Kebutuhan · 50%', .5, '#6be4c2'], ['Keinginan · 30%', .3, '#86a8ff'], ['Tabungan & utang · 20%', .2, '#c3a1ff']].map(([label, pct, color]) => `<div><div class="category-row"><span>${label}</span><strong>${fmt(income * pct)}</strong></div><div class="category-track"><span style="width:${pct * 100}%;background:${color}"></span></div></div>`).join('');
    const target = val('#target-amount'); const saved = val('#target-saved'); const perMonth = val('#target-monthly'); const targetResult = $('#target-result');
    if (targetResult) { const remaining = Math.max(0, target - saved); const count = perMonth ? Math.ceil(remaining / perMonth) : Infinity; targetResult.textContent = Number.isFinite(count) ? count === 0 ? 'Target tercapai 🎉' : `${count} bulan` : 'Masukkan setoran'; const note = $('#target-note'); if (note) note.textContent = Number.isFinite(count) && count > 0 ? `Setara sekitar ${Math.floor(count / 12)} tahun ${count % 12} bulan untuk mencapai ${fmt(target)}.` : 'Perhitungan ini tidak memasukkan bunga atau inflasi.'; }
  }
  function exportCSV() {
    const rows = [['Tanggal', 'Nama', 'Jenis', 'Kategori', 'Nominal', 'Catatan'], ...[...data.transactions].sort((a, b) => a.date.localeCompare(b.date)).map(t => [t.date, t.title, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', category(t.category).name, t.amount, t.note || ''])];
    const csv = '\ufeff' + rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadFile(csv, `ruanguang-transaksi-${localISO(today)}.csv`, 'text/csv;charset=utf-8'); toast('Berkas CSV siap diunduh.');
  }
  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportJSON() {
    downloadFile(JSON.stringify(data, null, 2), `ruanguang-cadangan-${localISO(today)}.json`, 'application/json'); toast('Salinan data berhasil diunduh.');
  }
  function setTheme(light) {
    document.body.classList.toggle('light', light);
    try { localStorage.setItem(THEME_KEY, light ? 'light' : 'dark'); } catch { /* Theme remains usable for this page view. */ }
    const button = $('#theme-toggle'); if (button) button.textContent = light ? '☾' : '☼';
  }
  function changeTransactionType(type) {
    const select = $('#tx-category'); if (select) select.innerHTML = categoryOptions(type);
  }
  function saveTransaction(form) {
    const fd = new FormData(form); const amount = Number(fd.get('amount')); const title = String(fd.get('title') || '').trim();
    if (!title || !Number.isFinite(amount) || amount <= 0) return toast('Nama dan nominal transaksi perlu diisi dengan benar.', true);
    data.transactions.push({ id: uid(), title: title.slice(0, 72), type: fd.get('type') === 'income' ? 'income' : 'expense', amount, category: String(fd.get('category')), date: String(fd.get('date')), note: String(fd.get('note') || '').trim().slice(0, 100) }); persist(); $('#modal-root').innerHTML = ''; toast('Transaksi berhasil disimpan.'); render();
  }
  function saveBudget(form) {
    const fd = new FormData(form); const limit = Number(fd.get('limit')); const cat = String(fd.get('category'));
    if (!cat || !Number.isFinite(limit) || limit <= 0 || data.budgets.some(b => b.category === cat)) return toast('Kategori atau nominal anggaran tidak valid.', true);
    data.budgets.push({ id: uid(), category: cat, limit }); persist(); $('#modal-root').innerHTML = ''; toast('Anggaran berhasil ditambahkan.'); render();
  }
  function saveGoal(form) {
    const fd = new FormData(form); const title = String(fd.get('title') || '').trim(); const target = Number(fd.get('target')); const saved = Number(fd.get('saved')) || 0;
    if (!title || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0) return toast('Periksa nama dan nominal target.', true);
    data.goals.push({ id: uid(), title: title.slice(0, 60), target, saved, icon: String(fd.get('icon')), deadline: String(fd.get('deadline') || '') }); persist(); $('#modal-root').innerHTML = ''; toast('Target tabungan berhasil dibuat.'); render();
  }
  function saveBill(form) {
    const fd = new FormData(form); const title = String(fd.get('title') || '').trim(); const amount = Number(fd.get('amount'));
    if (!title || !Number.isFinite(amount) || amount <= 0) return toast('Periksa nama dan nominal tagihan.', true);
    data.bills.push({ id: uid(), title: title.slice(0, 72), amount, category: String(fd.get('category')), dueDate: String(fd.get('dueDate')), paid: false }); persist(); $('#modal-root').innerHTML = ''; toast('Jadwal tagihan berhasil ditambahkan.'); render();
  }
  function importJSON(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Berkas terlalu besar. Maksimum 2 MB.', true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.budgets) || !Array.isArray(parsed.goals) || !Array.isArray(parsed.bills)) throw new Error('format');
        const validTransactions = parsed.transactions.every(t => t && typeof t.id === 'string' && typeof t.title === 'string' && ['income', 'expense'].includes(t.type) && Number.isFinite(Number(t.amount)) && typeof t.date === 'string' && categoryMeta[t.category]);
        const validBudgets = parsed.budgets.every(b => b && typeof b.id === 'string' && categoryMeta[b.category] && Number.isFinite(Number(b.limit)) && Number(b.limit) > 0);
        const validGoals = parsed.goals.every(g => g && typeof g.id === 'string' && typeof g.title === 'string' && Number.isFinite(Number(g.target)) && Number(g.target) > 0 && Number.isFinite(Number(g.saved)) && Number(g.saved) >= 0);
        const validBills = parsed.bills.every(b => b && typeof b.id === 'string' && typeof b.title === 'string' && Number.isFinite(Number(b.amount)) && Number(b.amount) > 0 && typeof b.dueDate === 'string');
        if (!validTransactions || !validBudgets || !validGoals || !validBills) throw new Error('format');
        data = { version: 1, transactions: parsed.transactions, budgets: parsed.budgets, goals: parsed.goals, bills: parsed.bills }; persist(); render(); toast('Data berhasil dipulihkan.');
      } catch { toast('Berkas tidak cocok atau isinya tidak valid.', true); }
    };
    reader.onerror = () => toast('Berkas tidak dapat dibaca.', true); reader.readAsText(file);
  }

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-page]'); if (nav) { switchPage(nav.dataset.page); return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action; const id = button.dataset.id;
    if (action === 'open-transaction') openTransactionModal('expense');
    else if (action === 'open-income') openTransactionModal('income');
    else if (action === 'open-budget') openBudgetModal();
    else if (action === 'open-goal') openGoalModal();
    else if (action === 'open-bill') openBillModal();
    else if (action === 'contribute-goal') openContributionModal(id);
    else if (action === 'close-modal') { if (event.target === button || button.classList.contains('modal-close')) $('#modal-root').innerHTML = ''; }
    else if (action === 'delete-transaction') { data.transactions = data.transactions.filter(t => t.id !== id); persist(); render(); toast('Transaksi dihapus.'); }
    else if (action === 'delete-budget') { data.budgets = data.budgets.filter(b => b.id !== id); persist(); render(); toast('Anggaran dihapus.'); }
    else if (action === 'delete-goal') { data.goals = data.goals.filter(g => g.id !== id); persist(); render(); toast('Target dihapus.'); }
    else if (action === 'toggle-bill') { const bill = data.bills.find(b => b.id === id); if (bill) bill.paid = !bill.paid; persist(); render(); toast(bill?.paid ? 'Tagihan ditandai lunas.' : 'Status tagihan diperbarui.'); }
    else if (action === 'export-csv') exportCSV();
    else if (action === 'export-xlsx') {
      try {
        window.RuangUangExcel.exportWorkbook(data, categoryMeta, balance());
        toast('Rekap Excel berhasil dibuat.');
      } catch {
        toast('Rekap Excel belum berhasil dibuat. Coba lagi.', true);
      }
    }
    else if (action === 'export-json') exportJSON();
    else if (action === 'toggle-money') { hideMoney = !hideMoney; render(); }
    else if (action === 'import-json') $('#import-file').click();
    else if (action === 'toggle-theme') setTheme(!document.body.classList.contains('light'));
    else if (action === 'reset-data') { if (window.confirm('Hapus perubahan lokal dan kembalikan contoh awal?')) { data = makeSeed(); persist(); render(); toast('Contoh awal berhasil dipulihkan.'); } }
    else if (action === 'calendar-prev') { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1); render(); }
    else if (action === 'calendar-next') { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1); render(); }
    else if (action === 'report-prev') { reportCursor = new Date(reportCursor.getFullYear(), reportCursor.getMonth() - 1, 1); render(); }
    else if (action === 'report-next') { reportCursor = new Date(reportCursor.getFullYear(), reportCursor.getMonth() + 1, 1); render(); }
    else if (action === 'report-current') { reportCursor = new Date(today.getFullYear(), today.getMonth(), 1); render(); }
    else if (action === 'today-calendar') { calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1); selectedCalendarDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()); render(); }
    else if (action === 'select-day') { selectedCalendarDay = dateOnly(button.dataset.date); if (selectedCalendarDay.getMonth() !== calendarCursor.getMonth()) calendarCursor = new Date(selectedCalendarDay.getFullYear(), selectedCalendarDay.getMonth(), 1); render(); }
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    if (form.id === 'transaction-form') { event.preventDefault(); saveTransaction(form); }
    else if (form.id === 'budget-form') { event.preventDefault(); saveBudget(form); }
    else if (form.id === 'goal-form') { event.preventDefault(); saveGoal(form); }
    else if (form.id === 'bill-form') { event.preventDefault(); saveBill(form); }
    else if (form.id === 'contribution-form') {
      event.preventDefault(); const goal = data.goals.find(g => g.id === form.dataset.id); const amount = Number(new FormData(form).get('amount'));
      if (!goal || !Number.isFinite(amount) || amount <= 0) return toast('Masukkan nominal setoran yang benar.', true);
      goal.saved += amount; persist(); $('#modal-root').innerHTML = ''; render(); toast('Setoran berhasil ditambahkan.');
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'transaction-search') { transactionSearch = event.target.value; const pos = event.target.selectionStart; render(); const input = $('#transaction-search'); input?.focus(); input?.setSelectionRange(pos, pos); }
    if (event.target.classList.contains('calc-input')) updateCalculators();
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'transaction-filter') { transactionFilter = event.target.value; render(); }
    if (event.target.id === 'tx-type') changeTransactionType(event.target.value);
    if (event.target.id === 'import-file') importJSON(event.target.files?.[0]);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') $('#modal-root').innerHTML = ''; });
  $('#theme-toggle').addEventListener('click', () => setTheme(!document.body.classList.contains('light')));
  $('#mobile-menu').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#sidebar-scrim').classList.add('show'); });
  $('#sidebar-scrim').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#sidebar-scrim').classList.remove('show'); });
  $('#profile-button').addEventListener('click', () => switchPage('settings'));
  let savedTheme = '';
  try { savedTheme = localStorage.getItem(THEME_KEY) || ''; } catch { /* Storage may be disabled by browser policy. */ }
  setTheme(savedTheme === 'light');
  render(); updateClock(); setInterval(updateClock, 1000);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  document.addEventListener('focusin', event => { if (event.target.classList.contains('calc-input')) updateCalculators(); });
  document.addEventListener('click', event => { if (event.target.closest('[data-page="calculators"]')) setTimeout(updateCalculators, 0); });
  if (currentPage === 'calculators') updateCalculators();
})();
