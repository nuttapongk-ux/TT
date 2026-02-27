// pages.js — Dashboard, Tickets, Form, Detail, Admin (global, no ES modules)
"use strict";

window.PAGES = {};

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
PAGES.dashboard = function (ct) {
    const s = DB.getStats();
    const tickets = DB.getTickets();
    const recent = tickets.slice(0, 7);
    const cats = DB.getCategories();
    const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
    const catCounts = {};
    tickets.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });

    ct.innerHTML = `
  <div class="kpi-grid">
    ${kpi('📋', 'Total', s.total, 'ทั้งหมด', '#6366f1')}
    ${kpi('🔴', 'Open', s.open, 'รอดำเนินการ', '#ef4444')}
    ${kpi('🟡', 'In Progress', s.in_progress, 'กำลังดำเนินการ', '#f59e0b')}
    ${kpi('🟢', 'Resolved', s.resolved, 'แก้ไขแล้ว', '#10b981')}
    ${kpi('⚫', 'Closed', s.closed, 'ปิดแล้ว', '#6b7280')}
    ${kpi('🚨', 'Critical', s.critical, 'ด่วนมาก', '#ef4444')}
  </div>
  <div class="stats-grid">
    <div class="card">
      <div class="card-header"><div class="card-title">🎫 Tickets ล่าสุด</div>
        <button class="btn btn-sm btn-outline" onclick="navigate('#tickets')">ดูทั้งหมด →</button>
      </div>
      <div class="card-body" style="padding-top:10px">
        <div class="table-wrap"><table>
          <thead><tr><th>Ticket ID</th><th>หัวข้อ</th><th>สถานะ</th><th>ความสำคัญ</th><th>เมื่อ</th></tr></thead>
          <tbody>${recent.length === 0 ? `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">ไม่มี Ticket</div></div></td></tr>` :
            recent.map(t => `<tr onclick="navigate('#tickets/${t.id}')" style="cursor:pointer">
              <td><span class="ticket-id-link">${t.id}</span></td>
              <td style="max-width:200px"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;color:var(--text-primary)">${C.esc(t.title)}</div>
                <div style="font-size:.72rem;color:var(--text-muted)">${C.esc(t.reporterName)}</div></td>
              <td><span class="badge badge-${t.status}">${C.STATUS_LABELS[t.status]}</span></td>
              <td><span class="badge badge-${t.priority}"><span class="badge-dot" style="background:${C.PRIORITY_COLORS[t.priority]}"></span>${C.PRIORITY_LABELS[t.priority]}</span></td>
              <td style="font-size:.78rem;color:var(--text-muted)">${C.timeAgo(t.createdAt)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <div class="card-header"><div class="card-title">📊 Priority</div></div>
        <div class="card-body">${donutChart(s)}</div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📈 สถานะ</div></div>
        <div class="card-body">${statusBars(s)}</div>
      </div>
    </div>
  </div>
  ${s.critical > 0 ? `<div class="card" style="border-color:rgba(239,68,68,.3);margin-bottom:20px">
    <div class="card-header"><div class="card-title" style="color:var(--red)">🚨 Critical Tickets</div></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
      ${tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').map(t => {
                const sla = C.getSLAStatus(t);
                return `<div onclick="navigate('#tickets/${t.id}')" style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:var(--radius);cursor:pointer">
          <span class="priority-indicator priority-critical"></span>
          <div style="flex:1;overflow:hidden"><div style="font-weight:600;font-size:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${C.esc(t.title)}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${t.id} · ${C.esc(t.reporterName)}</div></div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:.72rem;color:${sla.breached ? 'var(--red)' : 'var(--yellow)'};font-weight:600">${sla.breached ? '⚠️ SLA เกิน' : '⏱ ' + sla.remaining}</div>
            <span class="badge badge-${t.status}">${C.STATUS_LABELS[t.status]}</span>
          </div>
        </div>`;
            }).join('')}
    </div>
  </div>`: ''}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px">
    ${cats.filter(c => catCounts[c.id]).map(c => `
      <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer" onclick="navigate('#tickets')">
        <div style="font-size:1.5rem">${c.icon}</div>
        <div><div style="font-size:.8rem;color:var(--text-muted)">${c.name}</div>
          <div style="font-size:1.4rem;font-weight:800">${catCounts[c.id] || 0}</div></div>
      </div>`).join('')}
  </div>`;
};

function kpi(icon, label, val, sub, color) {
    return `<div class="kpi-card" style="--kpi-color:${color}">
    <div class="kpi-icon">${icon}</div><div class="kpi-label">${label}</div>
    <div class="kpi-value">${val}</div><div class="kpi-sub">${sub}</div>
  </div>`;
}
function donutChart(s) {
    const total = s.total || 1, r = 48, cx = 60, cy = 60, st = 14, circ = 2 * Math.PI * r;
    const items = [{ l: 'Critical', v: s.critical, c: '#ef4444' }, { l: 'High', v: s.high, c: '#f97316' }, { l: 'Medium', v: s.medium, c: '#f59e0b' }, { l: 'Low', v: s.low, c: '#10b981' }].filter(i => i.v > 0);
    let off = 0;
    const segs = items.map(i => { const d = (i.v / total) * circ, seg = { ...i, d, off }; off += d; return seg; });
    return `<div class="donut-wrap">
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="${st}"/>
      ${segs.map(s => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.c}" stroke-width="${st}" stroke-dasharray="${s.d} ${circ}" stroke-dashoffset="${-s.off}" transform="rotate(-90 ${cx} ${cy})"/>`).join('')}
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="16" font-weight="800" font-family="Inter">${s.total}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="8" font-family="Inter">Total</text>
    </svg>
    <div class="donut-legend">${items.map(i => `<div class="legend-item"><div class="legend-dot" style="background:${i.c}"></div><span class="legend-label">${i.l}</span><span class="legend-count">${i.v}</span></div>`).join('')}</div>
  </div>`;
}
function statusBars(s) {
    return [['Open', s.open, '#ef4444'], ['In Progress', s.in_progress, '#f59e0b'], ['Resolved', s.resolved, '#10b981'], ['Closed', s.closed, '#6b7280']].map(([l, v, c]) => {
        const pct = s.total ? Math.round((v / s.total) * 100) : 0;
        return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px">
        <span style="color:var(--text-secondary)">${l}</span>
        <span style="color:var(--text-primary);font-weight:600">${v} <span style="color:var(--text-muted);font-weight:400">(${pct}%)</span></span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${c};border-radius:99px;transition:width .5s ease"></div>
      </div>
    </div>`;
    }).join('');
}

/* ═══════════════════════════════════════════════════════
   TICKET LIST
═══════════════════════════════════════════════════════ */
let TL = { page: 1, filters: { search: '', status: '', priority: '', category: '' }, sortF: 'createdAt', sortD: 'desc', sel: new Set() };

PAGES.tickets = function (ct) {
    TL.page = 1; TL.sel = new Set();
    const cats = DB.getCategories();
    ct.innerHTML = `
  <div class="section-header">
    <div class="section-title"><span class="dot"></span>Ticket ทั้งหมด</div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline btn-sm" onclick="PAGES._exportCSV()">⬇ Export CSV</button>
      <button class="btn btn-accent btn-sm"  onclick="navigate('#tickets/new')">➕ สร้าง Ticket</button>
    </div>
  </div>
  <div class="card" style="margin-bottom:14px"><div class="card-body" style="padding:12px 16px">
    <div class="filters-bar" style="padding:0;margin:0">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input class="form-control search-input" id="tl-search" placeholder="ค้นหา Ticket ID, หัวข้อ, ผู้แจ้ง...">
      </div>
      <select class="form-control filter-select" id="tl-status">
        <option value="">ทุกสถานะ</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
      </select>
      <select class="form-control filter-select" id="tl-priority">
        <option value="">ทุกความสำคัญ</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
      </select>
      <select class="form-control filter-select" id="tl-category">
        <option value="">ทุกหมวดหมู่</option>
        ${cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
      </select>
      <button class="btn btn-outline btn-sm" onclick="PAGES._clearFilters()">✕ ล้าง</button>
    </div>
  </div></div>
  <div id="tl-bulk" style="display:none;margin-bottom:12px;padding:10px 16px;background:var(--accent-glow);border:1px solid rgba(99,102,241,.3);border-radius:var(--radius);align-items:center;gap:12px">
    <span id="tl-bulk-count" style="font-size:.85rem;font-weight:600"></span>
    <button class="btn btn-sm btn-success" onclick="PAGES._bulkClose()">🔒 ปิดที่เลือก</button>
    <button class="btn btn-sm btn-danger"  onclick="PAGES._bulkDelete()">🗑 ลบที่เลือก</button>
  </div>
  <div class="card" id="tl-card">
    <div class="table-wrap"><table>
      <thead><tr>
        <th style="width:36px"><input type="checkbox" id="tl-all"></th>
        <th class="sortable" data-f="id">Ticket ID</th>
        <th class="sortable" data-f="title">หัวข้อ</th>
        <th class="sortable" data-f="status">สถานะ</th>
        <th class="sortable" data-f="priority">ความสำคัญ</th>
        <th>หมวดหมู่</th><th>ผู้แจ้ง</th>
        <th class="sortable" data-f="createdAt">วันที่</th>
        <th>Action</th>
      </tr></thead>
      <tbody id="tl-tbody"></tbody>
    </table></div>
    <div class="pagination" id="tl-page"></div>
  </div>`;

    // Events
    let timer;
    document.getElementById('tl-search').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => { TL.filters.search = e.target.value; TL.page = 1; PAGES._renderTable(); }, 250); });
    ['tl-status', 'tl-priority', 'tl-category'].forEach(id => document.getElementById(id).addEventListener('change', e => { TL.filters[id.replace('tl-', '')] = e.target.value; TL.page = 1; PAGES._renderTable(); }));
    document.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', () => { const f = th.dataset.f; if (TL.sortF === f) TL.sortD = TL.sortD === 'desc' ? 'asc' : 'desc'; else { TL.sortF = f; TL.sortD = 'desc'; } PAGES._renderTable(); }));
    document.getElementById('tl-all').addEventListener('change', e => { const rows = PAGES._getFiltered(); rows.forEach(t => e.target.checked ? TL.sel.add(t.id) : TL.sel.delete(t.id)); PAGES._renderTable(); });
    PAGES._renderTable();
};

PAGES._getFiltered = function () {
    let ts = DB.getTickets();
    const { search, status, priority, category } = TL.filters;
    if (search) { const q = search.toLowerCase(); ts = ts.filter(t => t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || (t.reporterName || '').toLowerCase().includes(q) || (t.merchantId || '').toLowerCase().includes(q)); }
    if (status) ts = ts.filter(t => t.status === status);
    if (priority) ts = ts.filter(t => t.priority === priority);
    if (category) ts = ts.filter(t => t.category === category);
    ts.sort((a, b) => { let av = a[TL.sortF] || '', bv = b[TL.sortF] || ''; if (TL.sortD === 'asc') [av, bv] = [bv, av]; return av < bv ? 1 : av > bv ? -1 : 0; });
    return ts;
};

PAGES._renderTable = function () {
    const SZ = 10;
    const all = PAGES._getFiltered(), total = all.length;
    const pages = Math.max(1, Math.ceil(total / SZ));
    if (TL.page > pages) TL.page = 1;
    const slice = all.slice((TL.page - 1) * SZ, TL.page * SZ);
    const catMap = Object.fromEntries(DB.getCategories().map(c => [c.id, c]));
    const tbody = document.getElementById('tl-tbody');
    const pgEl = document.getElementById('tl-page');
    if (!tbody) return;

    if (total === 0) { tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">ไม่พบ Ticket</div></div></td></tr>`; pgEl.innerHTML = ''; }
    else {
        tbody.innerHTML = slice.map(t => {
            const cat = catMap[t.category];
            return `<tr>
        <td><input type="checkbox" class="tl-cb" data-id="${t.id}" ${TL.sel.has(t.id) ? 'checked' : ''}></td>
        <td><span class="ticket-id-link" onclick="navigate('#tickets/${t.id}')">${t.id}</span></td>
        <td style="max-width:180px"><div onclick="navigate('#tickets/${t.id}')" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;cursor:pointer;color:var(--text-primary)">${C.esc(t.title)}</div>
          ${t.merchantId ? `<div style="font-size:.72rem;color:var(--text-muted)">${t.merchantId}</div>` : ''}
        </td>
        <td><span class="badge badge-${t.status}">${C.STATUS_LABELS[t.status]}</span></td>
        <td><span class="badge badge-${t.priority}"><span class="badge-dot" style="background:${C.PRIORITY_COLORS[t.priority]}"></span>${C.PRIORITY_LABELS[t.priority]}</span></td>
        <td>${cat ? `<span style="font-size:.8rem">${cat.icon} ${cat.name}</span>` : '-'}</td>
        <td><div style="font-size:.82rem;font-weight:500">${C.esc(t.reporterName)}</div><div style="font-size:.72rem;color:var(--text-muted)">${t.reporterEmail || ''}</div></td>
        <td style="font-size:.78rem;white-space:nowrap">${C.timeAgo(t.createdAt)}</td>
        <td><div style="display:flex;gap:5px">
          <button class="btn btn-icon btn-outline btn-sm" onclick="navigate('#tickets/${t.id}')">👁</button>
          <button class="btn btn-icon btn-outline btn-sm" onclick="navigate('#tickets/edit/${t.id}')">✏️</button>
        </div></td>
      </tr>`;
        }).join('');
        const from = (TL.page - 1) * SZ + 1, to = Math.min(TL.page * SZ, total);
        pgEl.innerHTML = `<span class="page-info">แสดง ${from}–${to} จาก ${total}</span>
      <button class="page-btn" ${TL.page === 1 ? 'disabled' : ''} onclick="TL.page--;PAGES._renderTable()">←</button>
      ${Array.from({ length: Math.min(pages, 7) }, (_, i) => `<button class="page-btn ${i + 1 === TL.page ? 'active' : ''}" onclick="TL.page=${i + 1};PAGES._renderTable()">${i + 1}</button>`).join('')}
      <button class="page-btn" ${TL.page === pages ? 'disabled' : ''} onclick="TL.page++;PAGES._renderTable()">→</button>`;
    }
    // Checkbox events
    document.querySelectorAll('.tl-cb').forEach(cb => cb.addEventListener('change', () => { cb.checked ? TL.sel.add(cb.dataset.id) : TL.sel.delete(cb.dataset.id); PAGES._updateBulk(); }));
    PAGES._updateBulk();
};
PAGES._updateBulk = function () {
    const b = document.getElementById('tl-bulk'); if (!b) return;
    b.style.display = TL.sel.size > 0 ? 'flex' : 'none';
    const cnt = document.getElementById('tl-bulk-count'); if (cnt) cnt.textContent = `เลือกแล้ว ${TL.sel.size} รายการ`;
};
PAGES._clearFilters = function () {
    TL.filters = { search: '', status: '', priority: '', category: '' };
    ['tl-search', 'tl-status', 'tl-priority', 'tl-category'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    TL.page = 1; PAGES._renderTable();
};
PAGES._bulkClose = function () {
    showConfirm('ปิด Tickets', 'ต้องการปิด ' + TL.sel.size + ' ticket?', () => { TL.sel.forEach(id => DB.updateTicket(id, { status: 'closed' })); TL.sel.clear(); showToast('success', 'ปิดสำเร็จ', ''); PAGES._renderTable(); });
};
PAGES._bulkDelete = function () {
    showConfirm('ลบ Tickets', 'ต้องการลบ ' + TL.sel.size + ' ticket?', () => { TL.sel.forEach(id => DB.deleteTicket(id)); TL.sel.clear(); showToast('success', 'ลบแล้ว', ''); PAGES._renderTable(); });
};
PAGES._exportCSV = function () {
    const cats = DB.getCategories(), catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
    const rows = PAGES._getFiltered().map(t => [t.id, `"${(t.title || '').replace(/"/g, '""')}"`, C.STATUS_LABELS[t.status], C.PRIORITY_LABELS[t.priority], catMap[t.category] || '', t.reporterName, t.reporterEmail || '', t.merchantId || '', new Date(t.createdAt).toLocaleString('th-TH')]);
    const csv = [['Ticket ID', 'Title', 'Status', 'Priority', 'Category', 'Reporter', 'Email', 'Merchant', 'Created'], ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv); a.download = 'tickets_' + Date.now() + '.csv'; a.click();
    showToast('success', 'Export สำเร็จ', '');
};

/* ═══════════════════════════════════════════════════════
   TICKET FORM (Create / Edit)
═══════════════════════════════════════════════════════ */
PAGES.form = function (ct, editId) {
    const ticket = editId ? DB.getTicketById(editId) : null;
    const isEdit = !!ticket;
    const cats = DB.getCategories();
    ct.innerHTML = `
  <div class="section-header">
    <div class="section-title"><span class="dot"></span>${isEdit ? 'แก้ไข Ticket' : 'สร้าง Ticket ใหม่'}</div>
    <button class="btn btn-outline" onclick="history.back()">← ย้อนกลับ</button>
  </div>
  <div class="card"><div class="card-header"><div class="card-title">🎫 ${isEdit ? ticket.id : 'กรอกข้อมูล Ticket'}</div></div>
  <div class="card-body"><form id="tf-form"><div style="display:flex;flex-direction:column;gap:20px">

    <div>
      <div style="font-size:.8rem;font-weight:700;color:var(--accent-light);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border)">📝 ข้อมูลปัญหา</div>
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">หัวข้อปัญหา <span class="required">*</span></label>
          <input class="form-control" id="tf-title" placeholder="อธิบายปัญหาสั้นๆ" value="${C.esc(ticket?.title)}">
          <span class="form-error" id="err-title"></span>
        </div>
        <div class="form-group form-full">
          <label class="form-label">รายละเอียดปัญหา <span class="required">*</span></label>
          <textarea class="form-control" id="tf-desc" rows="4" placeholder="อธิบายโดยละเอียด: เกิดขึ้นเมื่อไหร่ / ขั้นตอน / error code">${C.esc(ticket?.description)}</textarea>
          <span class="form-error" id="err-desc"></span>
        </div>
        <div class="form-group">
          <label class="form-label">หมวดหมู่ <span class="required">*</span></label>
          <select class="form-control" id="tf-cat">
            <option value="">-- เลือกหมวดหมู่ --</option>
            ${cats.map(c => `<option value="${c.id}" ${ticket?.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
          </select><span class="form-error" id="err-cat"></span>
        </div>
        <div class="form-group">
          <label class="form-label">ความสำคัญ <span class="required">*</span></label>
          <select class="form-control" id="tf-pri">
            <option value="">-- เลือกระดับ --</option>
            <option value="low"      ${ticket?.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
            <option value="medium"   ${ticket?.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
            <option value="high"     ${ticket?.priority === 'high' ? 'selected' : ''}>🟠 High</option>
            <option value="critical" ${ticket?.priority === 'critical' ? 'selected' : ''}>🔴 Critical</option>
          </select><span class="form-error" id="err-pri"></span>
        </div>
      </div>
    </div>

    <div>
      <div style="font-size:.8rem;font-weight:700;color:var(--accent-2);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border)">💳 ข้อมูลธุรกรรม (ถ้ามี)</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Merchant ID</label>
          <input class="form-control" id="tf-mid" placeholder="MER-XXXX" value="${C.esc(ticket?.merchantId)}"></div>
        <div class="form-group"><label class="form-label">Transaction Ref</label>
          <input class="form-control" id="tf-txr" placeholder="TXN-YYYYMMDD-XXX" value="${C.esc(ticket?.transactionRef)}"></div>
      </div>
    </div>

    <div>
      <div style="font-size:.8rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border)">👤 ข้อมูลผู้แจ้ง</div>
      <div class="form-grid cols-3">
        <div class="form-group"><label class="form-label">ชื่อ-นามสกุล <span class="required">*</span></label>
          <input class="form-control" id="tf-name" placeholder="ชื่อ นามสกุล" value="${C.esc(ticket?.reporterName)}">
          <span class="form-error" id="err-name"></span></div>
        <div class="form-group"><label class="form-label">อีเมล <span class="required">*</span></label>
          <input class="form-control" type="email" id="tf-email" placeholder="email@example.com" value="${C.esc(ticket?.reporterEmail)}">
          <span class="form-error" id="err-email"></span></div>
        <div class="form-group"><label class="form-label">เบอร์โทร</label>
          <input class="form-control" id="tf-phone" placeholder="0XX-XXX-XXXX" value="${C.esc(ticket?.reporterPhone)}"></div>
      </div>
    </div>

  </div>
  <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
    <button type="button" class="btn btn-outline" onclick="history.back()">ยกเลิก</button>
    <button type="submit" class="btn btn-accent" id="tf-submit">${isEdit ? '💾 บันทึก' : '➕ สร้าง Ticket'}</button>
  </div>
  </form></div></div>`;

    document.getElementById('tf-form').addEventListener('submit', e => { e.preventDefault(); PAGES._submitForm(isEdit, editId); });
};

PAGES._submitForm = function (isEdit, editId) {
    const g = id => (document.getElementById(id) || { value: '' }).value.trim();
    const se = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg; };
    const si = (id, bad) => document.getElementById(id)?.classList[bad ? 'add' : 'remove']('is-invalid');
    ['title', 'desc', 'cat', 'pri', 'name', 'email'].forEach(f => { se('err-' + f, ''); si('tf-' + f, false); });

    let valid = true;
    const v = (fid, eid, msg, ok) => { if (!ok) { se(eid, msg); si('tf-' + fid, true); valid = false; } };
    v('title', 'err-title', 'กรุณากรอกหัวข้อปัญหา (อย่างน้อย 5 ตัวอักษร)', g('tf-title').length >= 5);
    v('desc', 'err-desc', 'กรุณากรอกรายละเอียด', g('tf-desc').length >= 10);
    v('cat', 'err-cat', 'กรุณาเลือกหมวดหมู่', !!g('tf-cat'));
    v('pri', 'err-pri', 'กรุณาเลือกความสำคัญ', !!g('tf-pri'));
    v('name', 'err-name', 'กรุณากรอกชื่อ', g('tf-name').length >= 2);
    v('email', 'err-email', 'กรุณากรอก email ที่ถูกต้อง', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g('tf-email')));
    if (!valid) return;

    const data = { title: g('tf-title'), description: g('tf-desc'), category: g('tf-cat'), priority: g('tf-pri'), reporterName: g('tf-name'), reporterEmail: g('tf-email'), reporterPhone: g('tf-phone'), merchantId: g('tf-mid') || null, transactionRef: g('tf-txr') || null };
    const btn = document.getElementById('tf-submit'); btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
    setTimeout(() => {
        if (isEdit) { DB.updateTicket(editId, data); showToast('success', 'บันทึกสำเร็จ', 'อัปเดตแล้ว'); navigate('#tickets/' + editId); }
        else { const t = DB.createTicket(data); showToast('success', 'สร้าง Ticket สำเร็จ', t.id); navigate('#tickets/' + t.id); }
    }, 300);
};

/* ═══════════════════════════════════════════════════════
   TICKET DETAIL
═══════════════════════════════════════════════════════ */
PAGES.detail = function (ct, id) {
    const t = DB.getTicketById(id);
    if (!t) { ct.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">ไม่พบ Ticket ${id}</div><button class="btn btn-accent" style="margin-top:16px" onclick="navigate('#tickets')">← กลับ</button></div>`; return; }
    const cats = DB.getCategories(), agents = DB.getAgents();
    const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
    const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
    const cat = catMap[t.category], sla = C.getSLAStatus(t);
    const slaColor = sla.breached ? '#ef4444' : sla.pct > 75 ? '#f59e0b' : '#10b981';
    const cmts = DB.getComments(id);

    ct.innerHTML = `
  <div class="section-header" style="margin-bottom:18px">
    <div>
      <button class="btn btn-outline btn-sm" onclick="navigate('#tickets')" style="margin-bottom:8px">← กลับ</button>
      <div class="section-title"><span class="priority-indicator priority-${t.priority}"></span>${C.esc(t.title)}</div>
      <div style="font-size:.78rem;color:var(--text-muted);margin-top:4px">${t.id} · สร้าง ${C.formatDate(t.createdAt)} · อัปเดต ${C.timeAgo(t.updatedAt)}</div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline btn-sm" onclick="navigate('#tickets/edit/${id}')">✏️ แก้ไข</button>
      <button class="btn btn-danger btn-sm"  onclick="PAGES._deleteTicket('${id}')">🗑 ลบ</button>
    </div>
  </div>
  <div class="detail-layout">
    <div class="detail-main">
      <div class="card"><div class="card-header"><div class="card-title">📝 รายละเอียดปัญหา</div></div>
        <div class="card-body"><p style="font-size:.9rem;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap">${C.esc(t.description)}</p></div>
      </div>
      <div class="card"><div class="card-header"><div class="card-title">💬 กิจกรรมและความคิดเห็น</div></div>
        <div class="card-body">
          <div class="timeline" id="td-timeline">${cmts.map(tdCmt).join('')}</div>
          <div class="comment-input-wrap" style="padding-top:14px;border-top:1px solid var(--border)">
            <div class="user-avatar-sm">AD</div>
            <textarea class="form-control comment-textarea" id="td-cin" placeholder="เพิ่มความคิดเห็น... (Ctrl+Enter เพื่อส่ง)"></textarea>
            <button class="btn btn-accent btn-sm" id="td-csend">ส่ง</button>
          </div>
        </div>
      </div>
    </div>
    <div class="detail-sidebar">
      <div class="card"><div class="card-header"><div class="card-title">🔄 สถานะ Ticket</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
          <div><div class="info-item-label" style="margin-bottom:6px">สถานะปัจจุบัน</div>
            <span class="badge badge-${t.status}" style="font-size:.85rem;padding:5px 14px">${C.STATUS_LABELS[t.status]}</span></div>
          <div><div class="info-item-label" style="margin-bottom:6px">เปลี่ยนสถานะ</div>
            <select class="form-control" id="td-status">
              <option value="open"        ${t.status === 'open' ? 'selected' : ''}>🔴 Open</option>
              <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>🟡 In Progress</option>
              <option value="resolved"    ${t.status === 'resolved' ? 'selected' : ''}>🟢 Resolved</option>
              <option value="closed"      ${t.status === 'closed' ? 'selected' : ''}>⚫ Closed</option>
            </select></div>
          <div><div class="info-item-label" style="margin-bottom:6px">Assignee</div>
            <select class="form-control" id="td-agent">
              <option value="">-- ยังไม่ระบุ --</option>
              ${agents.map(a => `<option value="${a.id}" ${t.assignee === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
            </select></div>
          <button class="btn btn-accent" id="td-save" style="width:100%">💾 บันทึก</button>
        </div>
      </div>
      <div class="card"><div class="card-header"><div class="card-title">⏱ SLA</div></div>
        <div class="card-body">
          ${sla.resolved ? `<div style="color:var(--green);font-size:.85rem;font-weight:600">✅ ปิดแล้ว</div>` : `
          <div class="sla-bar-labels" style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text-muted);margin-bottom:5px">
            <span>ใช้ไป ${sla.pct}%</span>
            <span style="color:${sla.breached ? 'var(--red)' : 'inherit'}">${sla.breached ? '⚠️ SLA เกิน' : 'เหลือ ' + sla.remaining}</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${sla.pct}%;background:${slaColor};border-radius:99px;transition:width .5s ease"></div>
          </div>`}
        </div>
      </div>
      <div class="card"><div class="card-header"><div class="card-title">ℹ️ ข้อมูล</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
          ${irow('ความสำคัญ', `<span class="badge badge-${t.priority}"><span class="badge-dot" style="background:${C.PRIORITY_COLORS[t.priority]}"></span>${C.PRIORITY_LABELS[t.priority]}</span>`)}
          ${irow('หมวดหมู่', cat ? `${cat.icon} ${cat.name}` : '-')}
          ${irow('Merchant ID', t.merchantId || '-')}
          ${irow('Tx Ref', t.transactionRef ? `<code style="font-size:.78rem;color:var(--accent-light)">${t.transactionRef}</code>` : '-')}
        </div>
      </div>
      <div class="card"><div class="card-header"><div class="card-title">👤 ผู้แจ้ง</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
          ${irow('ชื่อ', C.esc(t.reporterName))}
          ${irow('อีเมล', t.reporterEmail ? `<a href="mailto:${t.reporterEmail}" style="color:var(--accent-light)">${t.reporterEmail}</a>` : '-')}
          ${irow('โทร', t.reporterPhone || '-')}
        </div>
      </div>
    </div>
  </div>`;

    document.getElementById('td-save').addEventListener('click', () => {
        const ns = document.getElementById('td-status').value;
        const na = document.getElementById('td-agent').value || null;
        const old = t.status;
        DB.updateTicket(id, { status: ns, assignee: na });
        if (ns !== old) {
            const agName = na ? (agents.find(a => a.id === na)?.name || 'Admin') : 'Admin';
            DB.addComment(id, { text: `เปลี่ยนสถานะจาก <strong>${C.STATUS_LABELS[old]}</strong> → <strong>${C.STATUS_LABELS[ns]}</strong>`, author: agName, avatar: agName.slice(0, 2).toUpperCase(), type: 'status' });
        }
        showToast('success', 'บันทึกสำเร็จ', `สถานะ: ${C.STATUS_LABELS[ns]}`);
        PAGES.detail(ct, id);
    });

    const cinput = document.getElementById('td-cin');
    document.getElementById('td-csend').addEventListener('click', () => {
        const txt = cinput.value.trim(); if (!txt) { showToast('warning', 'กรุณากรอกความคิดเห็น', ''); return; }
        DB.addComment(id, { text: txt, author: 'Admin', avatar: 'AD', type: 'comment' });
        showToast('success', 'เพิ่มความคิดเห็น', '');
        PAGES.detail(ct, id);
    });
    cinput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) document.getElementById('td-csend').click(); });
};

PAGES._deleteTicket = function (id) {
    showConfirm('ลบ Ticket', 'ต้องการลบ Ticket นี้อย่างถาวรใช่ไหม?', () => { DB.deleteTicket(id); showToast('success', 'ลบแล้ว', ''); navigate('#tickets'); });
};

function tdCmt(c) {
    return `<div class="timeline-item">
    <div class="timeline-avatar ${c.type}">${c.type === 'system' ? '⚙️' : c.type === 'status' ? '🔄' : c.avatar || '👤'}</div>
    <div class="timeline-body">
      <div class="timeline-header"><span class="timeline-author">${c.author}</span><span class="timeline-time">${C.timeAgo(c.createdAt)}</span></div>
      <div class="timeline-text">${c.text}</div>
    </div>
  </div>`;
}
function irow(label, val) { return `<div><div class="info-item-label">${label}</div><div class="info-item-value">${val}</div></div>`; }

/* ═══════════════════════════════════════════════════════
   ADMIN
═══════════════════════════════════════════════════════ */
PAGES.admin = function (ct) {
    const agents = DB.getAgents(), cats = DB.getCategories(), s = DB.getSettings();
    ct.innerHTML = `
  <div class="section-header"><div class="section-title"><span class="dot"></span>ตั้งค่าระบบ</div></div>
  <div class="admin-grid">
    <div class="card">
      <div class="card-header"><div class="card-title">👥 Support Agents</div>
        <button class="btn btn-accent btn-sm" onclick="PAGES._addAgentModal()">➕ เพิ่ม</button>
      </div>
      <div class="card-body"><div id="admin-agents" style="display:flex;flex-direction:column;gap:10px">
        ${agents.map(agCard).join('')}
      </div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">⏱ SLA (ชั่วโมง)</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
        ${['critical', 'high', 'medium', 'low'].map(p => `
        <div style="display:flex;align-items:center;gap:12px">
          <span class="badge badge-${p}" style="min-width:78px;justify-content:center">${p.charAt(0).toUpperCase() + p.slice(1)}</span>
          <input type="number" class="form-control" id="sla-${p}" value="${s.sla?.[p] ?? 24}" min="1" style="max-width:90px">
          <span style="font-size:.8rem;color:var(--text-muted)">ชั่วโมง</span>
        </div>`).join('')}
        <button class="btn btn-accent" id="admin-save-sla" style="width:100%;margin-top:6px">💾 บันทึก SLA</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">🏷️ หมวดหมู่</div></div>
      <div class="card-body">
        <div id="admin-cats" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
          ${cats.map(catChipHtml).join('')}
        </div>
        <div style="display:grid;grid-template-columns:60px 1fr auto;gap:8px;align-items:center">
          <input class="form-control" id="nc-icon" placeholder="🎯" style="text-align:center">
          <input class="form-control" id="nc-name" placeholder="ชื่อหมวดหมู่">
          <button class="btn btn-accent btn-sm" id="admin-add-cat">เพิ่ม</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">⚙️ ข้อมูลระบบ</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:12px;font-size:.875rem">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Version</span><span style="color:var(--accent-light)">1.0.0</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Storage</span><span>${(Object.keys(localStorage).filter(k => k.startsWith('psn_')).reduce((s, k) => s + (localStorage.getItem(k) || '').length, 0) / 1024).toFixed(1)} KB</span></div>
        <div class="divider"></div>
        <button class="btn btn-danger btn-sm" id="admin-reset">🗑 รีเซ็ตข้อมูล</button>
        <div style="font-size:.72rem;color:var(--text-muted)">จะลบข้อมูลทั้งหมดและโหลดข้อมูลตัวอย่างใหม่</div>
      </div>
    </div>
  </div>`;

    document.getElementById('admin-save-sla').addEventListener('click', () => {
        const sla = {};
        ['critical', 'high', 'medium', 'low'].forEach(p => sla[p] = parseInt(document.getElementById('sla-' + p).value) || 24);
        DB.saveSettings({ ...s, sla }); showToast('success', 'บันทึก SLA แล้ว', '');
    });
    document.getElementById('admin-add-cat').addEventListener('click', () => {
        const icon = document.getElementById('nc-icon').value.trim() || '📋';
        const name = document.getElementById('nc-name').value.trim();
        if (!name) { showToast('warning', 'กรุณากรอกชื่อ', ''); return; }
        const nc = { id: 'c-' + Date.now(), name, icon, color: '#6b7280' };
        const cats2 = DB.getCategories(); cats2.push(nc); DB.saveCategories(cats2);
        document.getElementById('admin-cats').insertAdjacentHTML('beforeend', catChipHtml(nc));
        document.getElementById('nc-icon').value = ''; document.getElementById('nc-name').value = '';
        showToast('success', 'เพิ่มหมวดหมู่', '' + name);
    });
    document.getElementById('admin-reset').addEventListener('click', () => {
        showConfirm('รีเซ็ตข้อมูล', 'จะลบข้อมูลทั้งหมดและโหลดใหม่ ยืนยัน?', () => { Object.keys(localStorage).filter(k => k.startsWith('psn_')).forEach(k => localStorage.removeItem(k)); showToast('info', 'รีเซ็ตแล้ว', ''); setTimeout(() => location.reload(), 800); });
    });
};

PAGES._addAgentModal = function () {
    const ov = document.createElement('div'); ov.className = 'modal-overlay';
    ov.innerHTML = `<div class="modal" style="min-width:380px">
    <div class="modal-title">➕ เพิ่ม Support Agent</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="form-group"><label class="form-label">ชื่อ-นามสกุล *</label><input class="form-control" id="ma-name"></div>
      <div class="form-group"><label class="form-label">อีเมล *</label><input class="form-control" id="ma-email"></div>
      <div class="form-group"><label class="form-label">ตำแหน่ง</label><input class="form-control" id="ma-role" value="Support Engineer"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="ma-cancel">ยกเลิก</button>
      <button class="btn btn-accent" id="ma-ok">เพิ่ม Agent</button>
    </div>
  </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#ma-cancel').onclick = () => ov.remove();
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
    ov.querySelector('#ma-ok').onclick = () => {
        const name = ov.querySelector('#ma-name').value.trim();
        const email = ov.querySelector('#ma-email').value.trim();
        const role = ov.querySelector('#ma-role').value.trim() || 'Support Engineer';
        if (!name || !email) { showToast('warning', 'กรุณากรอกข้อมูลให้ครบ', ''); return; }
        const av = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const ag = { id: 'a-' + Date.now(), name, email, role, avatar: av };
        const ags = DB.getAgents(); ags.push(ag); DB.saveAgents(ags);
        document.getElementById('admin-agents').insertAdjacentHTML('beforeend', agCard(ag));
        ov.remove(); showToast('success', 'เพิ่ม Agent', '' + name);
    };
};

window.adminRemoveAgent = function (id) { showConfirm('ลบ Agent', 'ยืนยัน?', () => { DB.saveAgents(DB.getAgents().filter(a => a.id !== id)); document.getElementById('ag-' + id)?.remove(); showToast('success', 'ลบแล้ว', ''); }); };
window.adminRemoveCat = function (id) { DB.saveCategories(DB.getCategories().filter(c => c.id !== id)); document.getElementById('cc-' + id)?.remove(); showToast('success', 'ลบหมวดหมู่', ''); };

function agCard(a) {
    return `<div class="agent-card" id="ag-${a.id}">
    <div class="agent-avatar">${a.avatar}</div>
    <div class="agent-info"><div class="agent-name">${C.esc(a.name)}</div><div class="agent-role">${C.esc(a.role)}</div><div class="agent-email">${C.esc(a.email)}</div></div>
    <button class="btn btn-icon btn-danger btn-sm" onclick="adminRemoveAgent('${a.id}')">🗑</button>
  </div>`;
}
function catChipHtml(c) {
    return `<div class="cat-chip" id="cc-${c.id}">${c.icon} ${C.esc(c.name)}<button class="cat-chip-remove" onclick="adminRemoveCat('${c.id}')">✕</button></div>`;
}
