// ============================================================
// ticket-detail.js — Ticket Detail + Timeline + Comments
// ============================================================

import {
    getTicketById, updateTicket, getCategories, getAgents, getComments, addComment, deleteTicket,
    STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, STATUS_COLORS,
    formatDate, timeAgo, getSLAStatus,
} from './data.js';

export function renderTicketDetail(container, id) {
    const ticket = getTicketById(id);
    if (!ticket) {
        container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">ไม่พบ Ticket</div>
      <div class="empty-state-desc">Ticket ID: ${id} ไม่มีในระบบ</div>
      <button class="btn btn-accent" style="margin-top:16px" onclick="navigate('#tickets')">← กลับไป Tickets</button>
    </div>`;
        return;
    }

    const cats = getCategories();
    const agents = getAgents();
    const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
    const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
    const cat = catMap[ticket.category];
    const assignee = ticket.assignee ? agentMap[ticket.assignee] : null;
    const sla = getSLAStatus(ticket);
    const comments = getComments(id);

    // SLA bar color
    const slaColor = sla.breached ? '#ef4444' : sla.pct > 75 ? '#f59e0b' : '#10b981';

    container.innerHTML = `
    <!-- Header -->
    <div class="section-header" style="margin-bottom:20px">
      <div>
        <button class="btn btn-outline btn-sm" style="margin-bottom:8px" onclick="navigate('#tickets')">← กลับ</button>
        <div class="section-title" style="font-size:1.1rem">
          <span class="priority-indicator priority-${ticket.priority}"></span>
          ${ticket.title}
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">
          <span class="ticket-id-link" style="cursor:default">${ticket.id}</span> ·
          สร้างเมื่อ ${formatDate(ticket.createdAt)} ·
          อัปเดตล่าสุด ${timeAgo(ticket.updatedAt)}
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn btn-outline btn-sm" onclick="navigate('#tickets/edit/${id}')">✏️ แก้ไข</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('${id}')">🗑 ลบ</button>
      </div>
    </div>

    <div class="detail-layout">
      <!-- Main -->
      <div class="detail-main">

        <!-- Description Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📝 รายละเอียดปัญหา</div>
          </div>
          <div class="card-body">
            <p style="font-size:0.9rem;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap">${esc(ticket.description)}</p>
          </div>
        </div>

        <!-- Timeline / Comments -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">💬 กิจกรรมและความคิดเห็น</div>
          </div>
          <div class="card-body">
            <div class="timeline" id="timeline">
              ${comments.map(renderTimelineItem).join('')}
            </div>
            <!-- Add Comment -->
            <div class="comment-input-wrap" id="comment-area">
              <div class="user-avatar-sm">AD</div>
              <textarea class="form-control comment-textarea" id="comment-input"
                placeholder="เพิ่มความคิดเห็น หรือ อัปเดตสถานะ..."></textarea>
              <button class="btn btn-accent btn-sm" id="btn-comment">ส่ง</button>
            </div>
          </div>
        </div>

      </div>

      <!-- Sidebar -->
      <div class="detail-sidebar">

        <!-- Status Card -->
        <div class="card">
          <div class="card-header"><div class="card-title">🔄 สถานะ Ticket</div></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
            <div>
              <div class="info-item-label" style="margin-bottom:6px">สถานะปัจจุบัน</div>
              <span class="badge badge-${ticket.status}" style="font-size:0.85rem;padding:5px 14px">
                ${STATUS_LABELS[ticket.status]}
              </span>
            </div>
            <div>
              <div class="info-item-label" style="margin-bottom:6px">เปลี่ยนสถานะ</div>
              <select class="form-control" id="status-select">
                <option value="open"        ${ticket.status === 'open' ? 'selected' : ''}>🔴 Open</option>
                <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>🟡 In Progress</option>
                <option value="resolved"    ${ticket.status === 'resolved' ? 'selected' : ''}>🟢 Resolved</option>
                <option value="closed"      ${ticket.status === 'closed' ? 'selected' : ''}>⚫ Closed</option>
              </select>
            </div>
            <div>
              <div class="info-item-label" style="margin-bottom:6px">Assignee</div>
              <select class="form-control" id="assignee-select">
                <option value="">-- ยังไม่ระบุ --</option>
                ${agents.map(a => `<option value="${a.id}" ${ticket.assignee === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-accent" id="btn-update-status" style="width:100%">💾 บันทึก</button>
          </div>
        </div>

        <!-- SLA Card -->
        <div class="card">
          <div class="card-header"><div class="card-title">⏱ SLA</div></div>
          <div class="card-body">
            ${sla.resolved
            ? `<div style="color:var(--green);font-size:0.85rem;font-weight:600">✅ Ticket ปิดแล้ว</div>`
            : `
              <div class="sla-bar-wrap">
                <div class="sla-bar-labels">
                  <span>ใช้ไปแล้ว ${sla.pct}%</span>
                  <span style="color:${sla.breached ? 'var(--red)' : 'inherit'}">
                    ${sla.breached ? '⚠️ SLA เกินกำหนด' : `เหลืออีก ${sla.remaining}`}
                  </span>
                </div>
                <div class="sla-bar-track">
                  <div class="sla-bar-fill" style="width:${sla.pct}%;background:${slaColor}"></div>
                </div>
              </div>
              `
        }
          </div>
        </div>

        <!-- Info Card -->
        <div class="card">
          <div class="card-header"><div class="card-title">ℹ️ ข้อมูล Ticket</div></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px">
              ${infoRow('ความสำคัญ', `<span class="badge badge-${ticket.priority}"><span class="badge-dot" style="background:${PRIORITY_COLORS[ticket.priority]}"></span>${PRIORITY_LABELS[ticket.priority]}</span>`)}
              ${infoRow('หมวดหมู่', cat ? `${cat.icon} ${cat.name}` : '-')}
              ${infoRow('Merchant ID', ticket.merchantId || '-')}
              ${infoRow('Transaction Ref', ticket.transactionRef ? `<code style="font-size:0.78rem;color:var(--accent-light)">${ticket.transactionRef}</code>` : '-')}
            </div>
          </div>
        </div>

        <!-- Reporter Card -->
        <div class="card">
          <div class="card-header"><div class="card-title">👤 ผู้แจ้ง</div></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:10px">
              ${infoRow('ชื่อ', ticket.reporterName)}
              ${infoRow('อีเมล', `<a href="mailto:${ticket.reporterEmail}" style="color:var(--accent-light)">${ticket.reporterEmail || '-'}</a>`)}
              ${infoRow('โทร', ticket.reporterPhone || '-')}
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

    // Events
    document.getElementById('btn-update-status').addEventListener('click', () => {
        const newStatus = document.getElementById('status-select').value;
        const newAssignee = document.getElementById('assignee-select').value;
        const oldStatus = ticket.status;
        updateTicket(id, { status: newStatus, assignee: newAssignee || null });

        if (newStatus !== oldStatus) {
            const agentName = newAssignee ? (agents.find(a => a.id === newAssignee)?.name || 'Admin') : 'Admin';
            addComment(id, {
                text: `เปลี่ยนสถานะจาก <strong>${STATUS_LABELS[oldStatus]}</strong> → <strong>${STATUS_LABELS[newStatus]}</strong>`,
                author: agentName,
                avatar: agentName.slice(0, 2).toUpperCase(),
                type: 'status',
            });
        }
        showToast('success', 'บันทึกสำเร็จ', `สถานะอัปเดตเป็น ${STATUS_LABELS[newStatus]}`);
        renderTicketDetail(container, id);
    });

    document.getElementById('btn-comment').addEventListener('click', () => {
        const text = document.getElementById('comment-input').value.trim();
        if (!text) { showToast('warning', 'กรุณากรอกความคิดเห็น', ''); return; }
        addComment(id, { text, author: 'Admin', avatar: 'AD', type: 'comment' });
        showToast('success', 'เพิ่มความคิดเห็นแล้ว', '');
        renderTicketDetail(container, id);
        setTimeout(() => {
            document.getElementById('timeline')?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });

    document.getElementById('comment-input').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.ctrlKey) document.getElementById('btn-comment').click();
    });
}

window.confirmDelete = function (id) {
    showConfirm('ลบ Ticket', 'ต้องการลบ Ticket นี้อย่างถาวรใช่ไหม? การกระทำนี้ไม่สามารถย้อนคืนได้', () => {
        import('./data.js').then(({ deleteTicket }) => {
            deleteTicket(id);
            showToast('success', 'ลบ Ticket แล้ว', '');
            navigate('#tickets');
        });
    });
};

function renderTimelineItem(c) {
    const icons = { system: '⚙️', comment: '💬', status: '🔄' };
    return `
  <div class="timeline-item">
    <div class="timeline-avatar ${c.type}">${c.type === 'system' ? icons.system : c.avatar || '👤'}</div>
    <div class="timeline-body">
      <div class="timeline-header">
        <span class="timeline-author">${c.author}</span>
        <span class="timeline-time">${timeAgo(c.createdAt)}</span>
      </div>
      <div class="timeline-text">${c.text}</div>
    </div>
  </div>`;
}

function infoRow(label, value) {
    return `
  <div>
    <div class="info-item-label">${label}</div>
    <div class="info-item-value">${value}</div>
  </div>`;
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
