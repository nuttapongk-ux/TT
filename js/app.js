// app.js — Router, Nav, Toast, Confirm, Auth Guard (async Firebase version)
"use strict";

// ── Toast ─────────────────────────────────────────────────────
window.showToast = function (type, title, msg, dur = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const tc = document.getElementById('toast-container');
  if (!tc) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-body"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
  tc.appendChild(el);
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

// ── Global loading overlay ────────────────────────────────────
function showLoader(msg = 'กำลังโหลด...') {
  let el = document.getElementById('global-loader');
  if (!el) { el = document.createElement('div'); el.id = 'global-loader'; document.body.appendChild(el); }
  el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:14px">
    <div style="font-size:2.5rem;animation:ld 1s ease-in-out infinite">⟳</div>
    <div style="font-size:.9rem;font-weight:600;color:#94a3b8">${msg}</div>
  </div>`;
  el.style.cssText = 'position:fixed;inset:0;background:var(--bg-base);display:flex;align-items:center;justify-content:center;z-index:9999;';
}
function hideLoader() { document.getElementById('global-loader')?.remove(); }

// ── Login Page ────────────────────────────────────────────────
function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div class="login-bg" id="login-screen">
      <div class="login-bg-orbs">
        <div class="login-orb"></div><div class="login-orb"></div><div class="login-orb"></div>
      </div>
      <div class="login-card">
        <div class="login-logo">
          <div class="login-logo-icon">💳</div>
          <div class="login-logo-text">
            <strong>PSN Support</strong>
            <span>Payment Gateway Ticket System</span>
          </div>
        </div>
        <div class="login-title">เข้าสู่ระบบ</div>
        <div class="login-sub">เลือกทีมของคุณและกรอกข้อมูลเพื่อเข้าใช้งาน</div>
        <!-- Team Selector -->
        <div class="login-team-grid" id="team-grid">
          ${Object.entries(TEAMS).map(([key, t]) => `
            <button class="team-btn" data-team="${key}"
              style="--team-color:${t.color};--team-bg:${t.bg}"
              onclick="selectTeam('${key}')">
              <span class="team-btn-icon">${t.icon}</span>
              <span>${t.short}</span>
            </button>`).join('')}
        </div>
        <div class="login-error" id="login-error">ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</div>
        <form id="login-form">
          <div class="form-group" style="margin-bottom:12px">
            <label class="form-label">ชื่อผู้ใช้</label>
            <input class="form-control" id="lf-user" placeholder="username" autocomplete="username">
          </div>
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">รหัสผ่าน</label>
            <div style="position:relative">
              <input class="form-control" id="lf-pass" type="password" placeholder="password" autocomplete="current-password">
              <button type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem" onclick="togglePw()">👁</button>
            </div>
          </div>
          <button type="submit" class="login-btn" id="login-btn">เข้าสู่ระบบ</button>
        </form>

      </div>
    </div>
    <div id="toast-container"></div>
  `;

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const user = document.getElementById('lf-user').value.trim();
    const pass = document.getElementById('lf-pass').value;
    const err = document.getElementById('login-error'), btn = document.getElementById('login-btn');
    err.classList.remove('show'); btn.disabled = true; btn.textContent = 'กำลังเข้าระบบ...';
    await new Promise(r => setTimeout(r, 350));
    const sess = DB.login(user, pass);
    if (sess) { await bootApp(); }
    else { err.classList.add('show'); btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ'; }
  });
}

window.selectTeam = function (key) {
  document.querySelectorAll('.team-btn').forEach(b => b.classList.toggle('selected', b.dataset.team === key));
  const u = DB.getUsers().find(u => u.team === key);
  if (u) { document.getElementById('lf-user').value = u.username; document.getElementById('lf-pass').value = u.password; }
  document.getElementById('login-error')?.classList.remove('show');
};
window.togglePw = function () {
  const inp = document.getElementById('lf-pass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

// ── Sidebar ───────────────────────────────────────────────────
async function buildSidebar() {
  const open = (await DB.getTickets()).filter(t => t.status === 'open').length;
  const sess = DB.getSession();
  const team = sess ? TEAMS[sess.team] : null;
  const perms = team?.perms || {};
  const avatarColor = team ? team.color : 'var(--accent)';

  return `<aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">💳</div>
      <div class="logo-text"><strong>PSN Support</strong><span>Payment Gateway</span></div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">เมนูหลัก</div>
      <div class="nav-item" id="nav-dashboard" onclick="navigate('#dashboard')"><span class="nav-icon">📊</span>Dashboard</div>
      <div class="nav-item" id="nav-tickets"   onclick="navigate('#tickets')"><span class="nav-icon">🎫</span>Tickets
        <span class="nav-badge" id="open-badge" ${open === 0 ? 'style="display:none"' : ''}>${open}</span>
      </div>
      ${perms.create ? `<div class="nav-section-label">สร้าง</div>
      <div class="nav-item" onclick="navigate('#tickets/new')"><span class="nav-icon">➕</span>สร้าง Ticket ใหม่</div>` : ''}
      ${perms.admin ? `<div class="nav-section-label">ระบบ</div>
      <div class="nav-item" id="nav-admin" onclick="navigate('#admin')"><span class="nav-icon">⚙️</span>ตั้งค่าระบบ</div>` : ''}
    </nav>
    <div class="sidebar-footer" style="flex-direction:column;align-items:stretch;gap:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="user-avatar-sm" style="background:linear-gradient(135deg,${avatarColor},#7c3aed)">${sess?.avatar || '??'}</div>
        <div class="user-info" style="flex:1"><strong>${sess?.name || 'Guest'}</strong><span>${sess?.role || ''}</span></div>
      </div>
      ${team ? `<div style="display:flex;align-items:center;justify-content:space-between">
        <span class="team-badge" style="background:${team.bg};color:${team.color}">${team.icon} ${team.label}</span>
        <button class="btn btn-sm btn-danger" onclick="doLogout()" style="padding:4px 10px;font-size:.72rem">ออกจากระบบ</button>
      </div>`: ''}
    </div>
  </aside>`;
}

window.doLogout = function () {
  showConfirm('ออกจากระบบ', 'ต้องการออกจากระบบใช่ไหม?', () => {
    DB.logout();
    showToast('info', 'ออกจากระบบแล้ว', '');
    setTimeout(() => { window.location.hash = ''; renderLoginPage(); }, 500);
  });
};

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
  document.getElementById(map[key])?.classList.add('active');
}

async function updateBadge() {
  const n = (await DB.getTickets()).filter(t => t.status === 'open').length;
  const b = document.getElementById('open-badge'); if (!b) return;
  b.textContent = n; b.style.display = n > 0 ? '' : 'none';
}

function setTopbar(key) {
  const titles = { dashboard: 'Dashboard', tickets: 'Ticket ทั้งหมด', 'tickets/new': 'สร้าง Ticket ใหม่', admin: 'ตั้งค่าระบบ', 'tickets/detail': 'รายละเอียด Ticket', 'tickets/edit': 'แก้ไข Ticket' };
  const crumbsM = { dashboard: ['หน้าหลัก'], tickets: ['หน้าหลัก', 'Tickets'], 'tickets/new': ['หน้าหลัก', 'Tickets', 'สร้างใหม่'], admin: ['หน้าหลัก', 'Admin'], 'tickets/detail': ['หน้าหลัก', 'Tickets', 'รายละเอียด'], 'tickets/edit': ['หน้าหลัก', 'Tickets', 'แก้ไข'] };
  const t = document.getElementById('page-title'); if (t) t.textContent = titles[key] || 'Dashboard';
  const b = document.getElementById('breadcrumb'); if (!b) return;
  const crumbs = crumbsM[key] || ['หน้าหลัก'];
  b.innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<span>${c}</span>` : `<span style="cursor:pointer;color:var(--accent-light)" onclick="navigate('#dashboard')">${c}</span><span class="breadcrumb-sep">/</span>`).join('');
}

function permDenied(ct) {
  ct.innerHTML = `<div class="perm-denied"><div class="perm-denied-icon">🔒</div>
    <div class="perm-denied-title">ไม่มีสิทธิ์เข้าถึง</div>
    <div class="perm-denied-sub">ทีมของคุณไม่มีสิทธิ์ใช้งานส่วนนี้</div>
    <button class="btn btn-accent" onclick="navigate('#dashboard')">← กลับหน้าหลัก</button>
  </div>`;
}

async function router() {
  if (!DB.isLoggedIn()) { renderLoginPage(); return; }
  const { key, params } = parseRoute(window.location.hash);
  setActiveNav(key); setTopbar(key);
  updateBadge(); // non-blocking
  const ct = document.getElementById('page-content');
  ct.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;gap:10px;color:var(--text-muted)"><span style="display:inline-block;animation:spin 1s linear infinite;font-size:1.3rem">⟳</span>กำลังโหลด...</div>';
  // Permission gates
  if ((key === 'tickets/new' || key === 'tickets/edit') && !DB.can('create')) { permDenied(ct); return; }
  if (key === 'admin' && !DB.can('admin')) { permDenied(ct); return; }
  try {
    if (key === 'dashboard') await PAGES.dashboard(ct);
    else if (key === 'tickets') await PAGES.tickets(ct);
    else if (key === 'tickets/new') await PAGES.form(ct, null);
    else if (key === 'tickets/edit') await PAGES.form(ct, params.id);
    else if (key === 'tickets/detail') await PAGES.detail(ct, params.id);
    else if (key === 'admin') await PAGES.admin(ct);
    else await PAGES.dashboard(ct);
  } catch (err) {
    console.error('Router error:', err);
    ct.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">เกิดข้อผิดพลาด</div><div class="empty-state-desc">${err.message || 'Unknown error'}</div><button class="btn btn-accent" style="margin-top:16px" onclick="navigate('#dashboard')">กลับหน้าหลัก</button></div>`;
  }
}

// ── Boot App (after login) ────────────────────────────────────
async function bootApp() {
  const sidebar = await buildSidebar();
  document.getElementById('app').innerHTML = `
    ${sidebar}
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
          <div><div id="page-title" class="page-title">Dashboard</div><div id="breadcrumb" class="breadcrumb"></div></div>
        </div>
        <div class="topbar-right">
          ${DB.can('create') ? `<button class="topbar-btn btn-primary" onclick="navigate('#tickets/new')">➕ สร้าง Ticket</button>` : ''}
        </div>
      </header>
      <main class="page-content" id="page-content"></main>
    </div>
    <div id="toast-container"></div>
  `;
  await router();
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Add toast container early
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div'); tc.id = 'toast-container'; document.body.appendChild(tc);
  }
  showLoader('กำลังเชื่อมต่อ Firebase...');
  try {
    await DB.init();
    hideLoader();
    if (DB.isLoggedIn()) { await bootApp(); }
    else { renderLoginPage(); }
  } catch (err) {
    hideLoader();
    console.error('Firebase init error:', err);
    document.getElementById('app').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;font-family:Inter,sans-serif;color:#94a3b8">
        <div style="font-size:3rem">⚠️</div>
        <div style="font-size:1.1rem;font-weight:700;color:#f87171">ไม่สามารถเชื่อมต่อ Firebase ได้</div>
        <div style="font-size:.85rem;max-width:400px;text-align:center;line-height:1.6">${err.message}</div>
        <button onclick="location.reload()" style="padding:10px 20px;background:#6366f1;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:600">ลองใหม่</button>
      </div>`;
  }
  window.addEventListener('hashchange', () => { if (DB.isLoggedIn()) router(); });
});
