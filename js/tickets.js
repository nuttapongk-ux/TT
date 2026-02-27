// ============================================================
// tickets.js — Ticket List Page
// ============================================================

import {
    getTickets, getCategories, getAgents, deleteTicket, updateTicket,
    STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
    formatDate, timeAgo,
} from './data.js';

let currentPage = 1;
const PAGE_SIZE = 10;
let filters = { search: '', status: '', priority: '', category: '' };
let sortField = 'createdAt';
let sortDir = 'desc';
let selectedIds = new Set();

export function renderTicketList(container) {
    const cats = getCategories();

    container.innerHTML = `
    <!-- Header -->
    <div class="section-header">
      <div class="section-title"><span class="dot"></span>Ticket ทั้งหมด</div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline btn-sm" id="btn-export">⬇ Export CSV</button>
        <button class="btn btn-accent btn-sm" onclick="navigate('#tickets/new')">➕ สร้าง Ticket ใหม่</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-body" style="padding:14px 18px">
        <div class="filters-bar" style="padding:0;margin:0">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" class="form-control search-input" id="search-input"
              placeholder="ค้นหา Ticket ID, หัวข้อ, ผู้แจ้ง..." value="${filters.search}">
          </div>
          <select class="form-control filter-select" id="filter-status">
            <option value="">ทุกสถานะ</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select class="form-control filter-select" id="filter-priority">
            <option value="">ทุกความสำคัญ</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select class="form-control filter-select" id="filter-category">
            <option value="">ทุกหมวดหมู่</option>
            ${cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
          </select>
          <button class="btn btn-outline btn-sm" id="btn-clear-filter">✕ ล้างตัวกรอง</button>
        </div>
      </div>
    </div>

    <!-- Bulk actions (hidden by default) -->
    <div id="bulk-bar" style="display:none;margin-bottom:12px;padding:10px 16px;background:var(--accent-glow);border:1px solid rgba(99,102,241,0.3);border-radius:var(--radius);display:flex;align-items:center;gap:12px">
      <span id="bulk-count" style="font-size:0.85rem;font-weight:600"></span>
      <button class="btn btn-sm btn-warning" id="bulk-close">🔒 ปิด Tickets ที่เลือก</button>
      <button class="btn btn-sm btn-danger" id="bulk-delete">🗑 ลบที่เลือก</button>
    </div>

    <!-- Table -->
    <div class="card" id="tickets-card">
      <div class="table-wrap">
        <table id="tickets-table">
          <thead><tr>
            <th style="width:36px"><input type="checkbox" id="select-all"></th>
            <th class="sortable" data-field="id">Ticket ID</th>
            <th class="sortable" data-field="title">หัวข้อ</th>
            <th class="sortable" data-field="status">สถานะ</th>
            <th class="sortable" data-field="priority">ความสำคัญ</th>
            <th>หมวดหมู่</th>
            <th>ผู้แจ้ง</th>
            <th class="sortable" data-field="createdAt">วันที่สร้าง</th>
            <th>Action</th>
          </tr></thead>
          <tbody id="tickets-tbody"></tbody>
        </table>
      </div>
      <div class="pagination" id="pagination"></div>
    </div>
  `;

    // Restore filter values
    document.getElementById('filter-status').value = filters.status;
    document.getElementById('filter-priority').value = filters.priority;
    document.getElementById('filter-category').value = filters.category;

    attachEvents(container, cats);
    renderTable(cats);
}

function getFiltered() {
    let tickets = getTickets();
    const { search, status, priority, category } = filters;
    if (search) {
        const q = search.toLowerCase();
        tickets = tickets.filter(t =>
            t.id.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q) ||
            t.reporterName.toLowerCase().includes(q) ||
            (t.reporterEmail || '').toLowerCase().includes(q) ||
            (t.merchantId || '').toLowerCase().includes(q)
        );
    }
    if (status) tickets = tickets.filter(t => t.status === status);
    if (priority) tickets = tickets.filter(t => t.priority === priority);
    if (category) tickets = tickets.filter(t => t.category === category);

    // Sort
    tickets.sort((a, b) => {
        let av = a[sortField] || '', bv = b[sortField] || '';
        if (sortDir === 'asc') [av, bv] = [bv, av];
        return av < bv ? 1 : av > bv ? -1 : 0;
    });
    return tickets;
}

function renderTable(cats) {
    const all = getFiltered();
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = 1;
    const slice = all.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const catMap = Object.fromEntries(cats.map(c => [c.id, c]));

    const tbody = document.getElementById('tickets-tbody');
    const pagination = document.getElementById('pagination');

    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">ไม่พบ Ticket</div>
      <div class="empty-state-desc">ลองเปลี่ยนตัวกรองการค้นหา</div>
    </div></td></tr>`;
        pagination.innerHTML = '';
        return;
    }

    tbody.innerHTML = slice.map(t => {
        const cat = catMap[t.category];
        const checked = selectedIds.has(t.id) ? 'checked' : '';
        return `
    <tr>
      <td><input type="checkbox" class="row-check" data-id="${t.id}" ${checked}></td>
      <td><span class="ticket-id-link" onclick="navigate('#tickets/${t.id}')">${t.id}</span></td>
      <td style="max-width:200px">
        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary);font-weight:500;cursor:pointer" onclick="navigate('#tickets/${t.id}')">${t.title}</div>
        ${t.merchantId ? `<div style="font-size:0.72rem;color:var(--text-muted)">${t.merchantId}</div>` : ''}
      </td>
      <td><span class="badge badge-${t.status}">${STATUS_LABELS[t.status]}</span></td>
      <td>
        <span class="badge badge-${t.priority}">
          <span class="badge-dot" style="background:${PRIORITY_COLORS[t.priority]}"></span>
          ${PRIORITY_LABELS[t.priority]}
        </span>
      </td>
      <td>${cat ? `<span style="font-size:0.8rem">${cat.icon} ${cat.name}</span>` : '-'}</td>
      <td>
        <div style="font-size:0.82rem;font-weight:500">${t.reporterName}</div>
        <div style="font-size:0.72rem;color:var(--text-muted)">${t.reporterEmail || ''}</div>
      </td>
      <td style="font-size:0.78rem;white-space:nowrap">${timeAgo(t.createdAt)}</td>
      <td>
        <div style="display:flex;gap:5px">
          <button class="btn btn-icon btn-outline btn-sm" title="ดูรายละเอียด" onclick="navigate('#tickets/${t.id}')">👁</button>
          <button class="btn btn-icon btn-outline btn-sm" title="แก้ไข" onclick="navigate('#tickets/edit/${t.id}')">✏️</button>
        </div>
      </td>
    </tr>`;
    }).join('');

    // Pagination
    const from = (currentPage - 1) * PAGE_SIZE + 1;
    const to = Math.min(currentPage * PAGE_SIZE, total);
    pagination.innerHTML = `
    <span class="page-info">แสดง ${from}–${to} จาก ${total} รายการ</span>
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="ticketsChangePage(${currentPage - 1})">←</button>
    ${Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1;
        return `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="ticketsChangePage(${p})">${p}</button>`;
    }).join('')}
    <button class="page-btn" ${currentPage === pages ? 'disabled' : ''} onclick="ticketsChangePage(${currentPage + 1})">→</button>
  `;

    // Update bulk bar
    updateBulkBar();

    // Attach checkbox events
    document.querySelectorAll('.row-check').forEach(cb => {
        cb.addEventListener('change', () => {
            cb.checked ? selectedIds.add(cb.dataset.id) : selectedIds.delete(cb.dataset.id);
            updateBulkBar();
        });
    });
    document.getElementById('select-all')?.addEventListener('change', e => {
        slice.forEach(t => e.target.checked ? selectedIds.add(t.id) : selectedIds.delete(t.id));
        document.querySelectorAll('.row-check').forEach(cb => cb.checked = e.target.checked);
        updateBulkBar();
    });
}

function updateBulkBar() {
    const bar = document.getElementById('bulk-bar');
    const countEl = document.getElementById('bulk-count');
    if (!bar) return;
    if (selectedIds.size > 0) {
        bar.style.display = 'flex';
        countEl.textContent = `เลือกแล้ว ${selectedIds.size} รายการ`;
    } else {
        bar.style.display = 'none';
    }
}

window.ticketsChangePage = function (p) { currentPage = p; renderTable(getCategories()); };

function attachEvents(container, cats) {
    // Search
    let searchTimer;
    document.getElementById('search-input').addEventListener('input', e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            filters.search = e.target.value;
            currentPage = 1;
            renderTable(cats);
        }, 250);
    });

    // Filters
    ['filter-status', 'filter-priority', 'filter-category'].forEach(id => {
        document.getElementById(id).addEventListener('change', e => {
            filters[id.replace('filter-', '')] = e.target.value;
            currentPage = 1;
            renderTable(cats);
        });
    });

    // Clear filter
    document.getElementById('btn-clear-filter').addEventListener('click', () => {
        filters = { search: '', status: '', priority: '', category: '' };
        document.getElementById('search-input').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-priority').value = '';
        document.getElementById('filter-category').value = '';
        currentPage = 1;
        renderTable(cats);
    });

    // Sort
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const f = th.dataset.field;
            if (sortField === f) sortDir = sortDir === 'desc' ? 'asc' : 'desc';
            else { sortField = f; sortDir = 'desc'; }
            renderTable(cats);
        });
    });

    // Export CSV
    document.getElementById('btn-export').addEventListener('click', exportCSV);

    // Bulk close
    document.getElementById('bulk-close')?.addEventListener('click', () => {
        showConfirm('ปิด Tickets ที่เลือก', `ต้องการปิด ${selectedIds.size} ticket ใช่ไหม?`, () => {
            selectedIds.forEach(id => updateTicket(id, { status: 'closed' }));
            selectedIds.clear();
            showToast('success', 'ปิด Tickets แล้ว', `ปิดสำเร็จ`);
            renderTable(cats);
        });
    });

    // Bulk delete
    document.getElementById('bulk-delete')?.addEventListener('click', () => {
        showConfirm('ลบ Tickets ที่เลือก', `ต้องการลบ ${selectedIds.size} ticket อย่างถาวรใช่ไหม?`, () => {
            selectedIds.forEach(id => deleteTicket(id));
            selectedIds.clear();
            showToast('success', 'ลบ Tickets แล้ว', '');
            renderTable(cats);
        });
    });
}

function exportCSV() {
    const tickets = getFiltered();
    const cats = getCategories();
    const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
    const headers = ['Ticket ID', 'Title', 'Status', 'Priority', 'Category', 'Reporter', 'Email', 'Phone', 'Merchant ID', 'Created At'];
    const rows = tickets.map(t => [
        t.id, `"${t.title.replace(/"/g, '""')}"`, STATUS_LABELS[t.status], PRIORITY_LABELS[t.priority],
        catMap[t.category] || '', t.reporterName, t.reporterEmail || '', t.reporterPhone || '',
        t.merchantId || '', new Date(t.createdAt).toLocaleString('th-TH'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `tickets_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Export สำเร็จ', 'ไฟล์ CSV ถูกดาวน์โหลดแล้ว');
}
