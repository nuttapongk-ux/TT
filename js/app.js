// app.js — Router, Nav, Toast, Confirm (global scripts, no ES modules)
"use strict";

// ── Toast ─────────────────────────────────────────────────────
window.showToast = function (type, title, msg, dur = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-body"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, dur);
};

// ── Confirm Modal ─────────────────────────────────────────────
window.showConfirm = function (title, msg, onOk) {
  const ov = document.createElement('div'); ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal"><div class="modal-title">${title}</div>
    <p style="font-size:.875rem;color:var(--text-secondary);line-height:1.5">${msg}</p>
    <div class="modal-actions">
      <button class="btn btn-outline" id="mc-cancel">ยกเลิก</button>
      <button class="btn btn-danger"  id="mc-ok">ยืนยัน</button>
    </div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#mc-cancel').onclick = () => ov.remove();
  ov.querySelector('#mc-ok').onclick = () => { ov.remove(); onOk(); };
  ov.onclick = e => { if (e.target === ov) ov.remove(); };
};

// ── Navigate ──────────────────────────────────────────────────
window.navigate = function (hash) { window.location.hash = hash; };

// ── Sidebar ───────────────────────────────────────────────────
function buildSidebar() {
  const open = DB.getTickets().filter(t => t.status === 'open').length;
  return `<aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">💳</div>
      <div class="logo-text"><strong>PSN Support</strong><span>Payment Gateway</span></div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">เมนูหลัก</div>
      <div class="nav-item" id="nav-dashboard" onclick="navigate('#dashboard')"><span class="nav-icon">📊</span>Dashboard</div>
      <div class="nav-item" id="nav-tickets"   onclick="navigate('#tickets')">  <span class="nav-icon">🎫</span>Tickets
        <span class="nav-badge" id="open-badge" ${open === 0 ? 'style="display:none"' : ''}>${open}</span>
      </div>
      <div class="nav-section-label">การจัดการ</div>
      <div class="nav-item" onclick="navigate('#tickets/new')"><span class="nav-icon">➕</span>สร้าง Ticket ใหม่</div>
      <div class="nav-item" id="nav-admin" onclick="navigate('#admin')"><span class="nav-icon">⚙️</span>ตั้งค่าระบบ</div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-avatar-sm">AD</div>
      <div class="user-info"><strong>Admin</strong><span>administrator</span></div>
    </div>
  </aside>`;
}

// ── Router ────────────────────────────────────────────────────
function parseRoute(hash) {
  const h = (hash || '').replace(/^#\/?/, '');
  if (!h || h === '') return { key: 'dashboard', params: {} };
  if (h.startsWith('tickets/edit/')) return { key: 'tickets/edit', params: { id: h.split('/')[2] } };
  if (h.startsWith('tickets/') && h !== 'tickets/new') return { key: 'tickets/detail', params: { id: h.split('/')[1] } };
  const known = ['dashboard', 'tickets', 'tickets/new', 'admin'];
  return { key: known.includes(h) ? h : 'dashboard', params: {} };
}

function setActiveNav(key) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const map = {
    dashboard: 'nav-dashboard', tickets: 'nav-tickets', 'tickets/new': 'nav-tickets',
    'tickets/detail': 'nav-tickets', 'tickets/edit': 'nav-tickets', admin: 'nav-admin'
  };
  const el = document.getElementById(map[key]);
  if (el) el.classList.add('active');
}

function updateBadge() {
  const n = DB.getTickets().filter(t => t.status === 'open').length;
  const b = document.getElementById('open-badge');
  if (!b) return;
  b.textContent = n; b.style.display = n > 0 ? '' : 'none';
}

function setTopbar(key, params) {
  const titles = { dashboard: 'Dashboard', tickets: 'Ticket ทั้งหมด', 'tickets/new': 'สร้าง Ticket ใหม่', admin: 'ตั้งค่าระบบ' };
  const crumbsM = { dashboard: ['หน้าหลัก'], tickets: ['หน้าหลัก', 'Tickets'], 'tickets/new': ['หน้าหลัก', 'Tickets', 'สร้างใหม่'], admin: ['หน้าหลัก', 'Admin'] };
  let title = titles[key] || 'Dashboard';
  let crumbs = crumbsM[key] || ['หน้าหลัก'];
  if (key === 'tickets/detail') { title = 'รายละเอียด Ticket'; crumbs = ['หน้าหลัก', 'Tickets', 'รายละเอียด']; }
  if (key === 'tickets/edit') { title = 'แก้ไข Ticket'; crumbs = ['หน้าหลัก', 'Tickets', 'แก้ไข']; }
  const t = document.getElementById('page-title'); if (t) t.textContent = title;
  const b = document.getElementById('breadcrumb');
  if (b) b.innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<span>${c}</span>` : `<span style="cursor:pointer;color:var(--accent-light)" onclick="navigate('#dashboard')">${c}</span><span class="breadcrumb-sep">/</span>`).join('');
}

async function router() {
  const { key, params } = parseRoute(window.location.hash);
  setActiveNav(key); setTopbar(key, params); updateBadge();
  const ct = document.getElementById('page-content');
  ct.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;gap:10px;color:var(--text-muted)"><span style="display:inline-block;animation:spin 1s linear infinite;font-size:1.3rem">⟳</span>กำลังโหลด...</div>';
  if (key === 'dashboard') PAGES.dashboard(ct);
  else if (key === 'tickets') PAGES.tickets(ct);
  else if (key === 'tickets/new') PAGES.form(ct, null);
  else if (key === 'tickets/edit') PAGES.form(ct, params.id);
  else if (key === 'tickets/detail') PAGES.detail(ct, params.id);
  else if (key === 'admin') PAGES.admin(ct);
  else PAGES.dashboard(ct);
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  document.getElementById('app').innerHTML = `
    ${buildSidebar()}
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
          <div><div id="page-title" class="page-title">Dashboard</div><div id="breadcrumb" class="breadcrumb"></div></div>
        </div>
        <div class="topbar-right">
          <button class="topbar-btn" onclick="navigate('#tickets')">🎫 ดู Tickets</button>
          <button class="topbar-btn btn-primary" onclick="navigate('#tickets/new')">➕ สร้าง Ticket</button>
        </div>
      </header>
      <main class="page-content" id="page-content"></main>
    </div>
    <div id="toast-container"></div>
  `;
  window.addEventListener('hashchange', router);
  router();
});
