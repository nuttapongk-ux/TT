// ============================================================
// dashboard.js — Dashboard Page
// ============================================================

import {
    getStats, getTickets, getCategories, getAgents,
    STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
    formatDate, timeAgo, getSLAStatus,
} from './data.js';

export function renderDashboard(container) {
    const stats = getStats();
    const tickets = getTickets();
    const recent = tickets.slice(0, 7);
    const cats = getCategories();
    const agents = getAgents();

    // Category breakdown
    const catCounts = {};
    tickets.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });

    container.innerHTML = `
    <!-- KPI Row -->
    <div class="kpi-grid">
      ${kpiCard('📋', 'Total Tickets', stats.total, 'ทั้งหมด', '#6366f1')}
      ${kpiCard('🔴', 'Open', stats.open, 'รอดำเนินการ', '#ef4444')}
      ${kpiCard('🟡', 'In Progress', stats.in_progress, 'กำลังดำเนินการ', '#f59e0b')}
      ${kpiCard('🟢', 'Resolved', stats.resolved, 'แก้ไขแล้ว', '#10b981')}
      ${kpiCard('⚫', 'Closed', stats.closed, 'ปิดแล้ว', '#6b7280')}
      ${kpiCard('🚨', 'Critical', stats.critical, 'ด่วนมาก', '#ef4444')}
    </div>

    <!-- Stats Row -->
    <div class="stats-grid">
      <!-- Recent Tickets -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>🎫</span> Tickets ล่าสุด</div>
          <button class="btn btn-sm btn-outline" onclick="navigate('#tickets')">ดูทั้งหมด →</button>
        </div>
        <div class="card-body" style="padding-top:12px">
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>Ticket ID</th>
                <th>หัวข้อ</th>
                <th>สถานะ</th>
                <th>ความสำคัญ</th>
                <th>วันที่</th>
              </tr></thead>
              <tbody>
                ${recent.length === 0
            ? `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">ไม่มี Ticket</div></div></td></tr>`
            : recent.map(t => `
                  <tr onclick="navigate('#tickets/${t.id}')" style="cursor:pointer">
                    <td><span class="ticket-id-link">${t.id}</span></td>
                    <td style="max-width:220px">
                      <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary);font-weight:500">${t.title}</div>
                      <div style="font-size:0.72rem;color:var(--text-muted)">${t.reporterName}</div>
                    </td>
                    <td><span class="badge badge-${t.status}">${STATUS_LABELS[t.status]}</span></td>
                    <td>
                      <span class="badge badge-${t.priority}">
                        <span class="badge-dot" style="background:${PRIORITY_COLORS[t.priority]}"></span>
                        ${PRIORITY_LABELS[t.priority]}
                      </span>
                    </td>
                    <td style="font-size:0.78rem;color:var(--text-muted)">${timeAgo(t.createdAt)}</td>
                  </tr>`).join('')
        }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Donut + Summary -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <!-- Priority Chart -->
        <div class="card">
          <div class="card-header" style="padding-bottom:12px">
            <div class="card-title"><span>📊</span> แยกตามความสำคัญ</div>
          </div>
          <div class="card-body" style="padding-top:0">
            ${renderDonut(stats)}
          </div>
        </div>

        <!-- Status Summary -->
        <div class="card">
          <div class="card-header" style="padding-bottom:12px">
            <div class="card-title"><span>📈</span> สรุปสถานะ</div>
          </div>
          <div class="card-body" style="padding-top:0">
            ${renderStatusBars(stats)}
          </div>
        </div>
      </div>
    </div>

    <!-- Critical Tickets -->
    ${stats.critical > 0 ? `
    <div class="card" style="border-color:rgba(239,68,68,0.3);margin-bottom:24px">
      <div class="card-header">
        <div class="card-title" style="color:var(--red)"><span>🚨</span> Ticket ด่วนมาก (Critical)</div>
      </div>
      <div class="card-body" style="padding-top:12px">
        <div style="display:flex;flex-direction:column;gap:10px">
          ${tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').map(t => criticalCard(t)).join('')}
        </div>
      </div>
    </div>` : ''}

    <!-- Quick Stats Row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
      ${cats.filter(c => catCounts[c.id]).map(c => `
        <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer"
             onclick="navigate('#tickets')">
          <div style="font-size:1.5rem">${c.icon}</div>
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted)">${c.name}</div>
            <div style="font-size:1.4rem;font-weight:800">${catCounts[c.id] || 0}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function kpiCard(icon, label, value, sub, color) {
    return `
  <div class="kpi-card" style="--kpi-color:${color}">
    <div class="kpi-icon">${icon}</div>
    <div class="kpi-label">${label}</div>
    <div class="kpi-value">${value}</div>
    <div class="kpi-sub">${sub}</div>
  </div>`;
}

function renderDonut(stats) {
    const total = stats.total || 1;
    const items = [
        { label: 'Critical', val: stats.critical, color: '#ef4444' },
        { label: 'High', val: stats.high, color: '#f97316' },
        { label: 'Medium', val: stats.medium, color: '#f59e0b' },
        { label: 'Low', val: stats.low, color: '#10b981' },
    ].filter(i => i.val > 0);

    // SVG donut
    const r = 48, cx = 60, cy = 60, stroke = 14;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const segments = items.map(item => {
        const dash = (item.val / total) * circ;
        const seg = { ...item, dash, offset };
        offset += dash;
        return seg;
    });

    const svg = `<svg width="120" height="120" viewBox="0 0 120 120">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${stroke}"/>
    ${segments.map(s => `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${s.color}" stroke-width="${stroke}"
        stroke-dasharray="${s.dash} ${circ}"
        stroke-dashoffset="${-s.offset}"
        transform="rotate(-90 ${cx} ${cy})"
        style="transition:stroke-dasharray 0.5s ease"/>
    `).join('')}
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
      fill="white" font-size="16" font-weight="800" font-family="Inter">${total}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle"
      fill="rgba(255,255,255,0.5)" font-size="8" font-family="Inter">Total</text>
  </svg>`;

    const legend = items.map(i => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${i.color}"></div>
      <span class="legend-label">${i.label}</span>
      <span class="legend-count">${i.val}</span>
    </div>`).join('');

    return `<div class="donut-wrap">${svg}<div class="donut-legend">${legend}</div></div>`;
}

function renderStatusBars(stats) {
    const items = [
        { label: 'Open', val: stats.open, color: '#ef4444', of: stats.total },
        { label: 'In Progress', val: stats.in_progress, color: '#f59e0b', of: stats.total },
        { label: 'Resolved', val: stats.resolved, color: '#10b981', of: stats.total },
        { label: 'Closed', val: stats.closed, color: '#6b7280', of: stats.total },
    ];
    return items.map(i => {
        const pct = stats.total ? Math.round((i.val / stats.total) * 100) : 0;
        return `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px">
        <span style="color:var(--text-secondary)">${i.label}</span>
        <span style="color:var(--text-primary);font-weight:600">${i.val} <span style="color:var(--text-muted);font-weight:400">(${pct}%)</span></span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${i.color};border-radius:99px;transition:width 0.5s ease"></div>
      </div>
    </div>`;
    }).join('');
}

function criticalCard(t) {
    const sla = getSLAStatus(t);
    return `
  <div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius);cursor:pointer"
       onclick="navigate('#tickets/${t.id}')">
    <span class="priority-indicator priority-critical"></span>
    <div style="flex:1;overflow:hidden">
      <div style="font-weight:600;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
      <div style="font-size:0.75rem;color:var(--text-muted)">${t.id} · ${t.reporterName}</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:0.72rem;color:${sla.breached ? 'var(--red)' : 'var(--yellow)'};font-weight:600">
        ${sla.breached ? '⚠️ SLA เกิน' : `⏱ ${sla.remaining}`}
      </div>
      <span class="badge badge-${t.status}" style="margin-top:2px">${STATUS_LABELS[t.status]}</span>
    </div>
  </div>`;
}
