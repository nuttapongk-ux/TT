// ============================================================
// admin.js — Admin / Settings Page
// ============================================================

import {
    getAgents, saveAgents, getCategories, saveCategories, getSettings, saveSettings,
} from './data.js';

export function renderAdmin(container) {
    renderPage(container);
}

function renderPage(container) {
    const agents = getAgents();
    const cats = getCategories();
    const settings = getSettings();

    container.innerHTML = `
    <div class="section-header">
      <div class="section-title"><span class="dot"></span>ตั้งค่าระบบ</div>
    </div>

    <div class="admin-grid">

      <!-- Agents -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">👥 จัดการ Support Agent</div>
          <button class="btn btn-accent btn-sm" id="btn-add-agent">➕ เพิ่ม Agent</button>
        </div>
        <div class="card-body">
          <div id="agent-list" style="display:flex;flex-direction:column;gap:10px">
            ${agents.map(a => agentCard(a)).join('')}
          </div>
        </div>
      </div>

      <!-- SLA Settings -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">⏱ ตั้งค่า SLA (ชั่วโมง)</div>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:14px">
            ${['critical', 'high', 'medium', 'low'].map(p => `
            <div class="form-group" style="flex-direction:row;align-items:center;gap:12px">
              <span class="badge badge-${p}" style="min-width:80px;justify-content:center">${p.charAt(0).toUpperCase() + p.slice(1)}</span>
              <input type="number" class="form-control" id="sla-${p}" value="${settings.sla?.[p] ?? 24}" min="1" style="max-width:100px">
              <span style="font-size:0.8rem;color:var(--text-muted)">ชั่วโมง</span>
            </div>`).join('')}
          </div>
          <button class="btn btn-accent" style="width:100%;margin-top:16px" id="btn-save-sla">💾 บันทึก SLA</button>
        </div>
      </div>

      <!-- Categories -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🏷️ หมวดหมู่ปัญหา</div>
        </div>
        <div class="card-body">
          <div id="cat-chips" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
            ${cats.map(c => catChip(c)).join('')}
          </div>
          <div class="form-grid" style="grid-template-columns:auto 1fr auto;gap:8px;align-items:center">
            <input type="text" class="form-control" id="new-cat-icon" placeholder="🎯" style="max-width:60px;text-align:center">
            <input type="text" class="form-control" id="new-cat-name" placeholder="ชื่อหมวดหมู่">
            <button class="btn btn-accent btn-sm" id="btn-add-cat">เพิ่ม</button>
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">⚙️ ข้อมูลระบบ</div>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px;font-size:0.875rem">
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">ระบบ</span>
              <span>PSN Ticket Management</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">Version</span>
              <span style="color:var(--accent-light)">1.0.0</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">Storage</span>
              <span id="storage-size">-</span>
            </div>
            <div class="divider"></div>
            <button class="btn btn-danger btn-sm" id="btn-reset">🗑 รีเซ็ตข้อมูลทดสอบ</button>
            <div style="font-size:0.72rem;color:var(--text-muted)">คำเตือน: จะลบข้อมูลทั้งหมดและโหลดข้อมูลทดสอบใหม่</div>
          </div>
        </div>
      </div>

    </div>
  `;

    // Storage size
    const totalBytes = Object.keys(localStorage).filter(k => k.startsWith('psn_')).reduce((s, k) => s + (localStorage.getItem(k) || '').length, 0);
    document.getElementById('storage-size').textContent = `${(totalBytes / 1024).toFixed(1)} KB`;

    // Events
    attachAdminEvents(container, agents, cats, settings);
}

function agentCard(a) {
    return `
  <div class="agent-card" id="agent-${a.id}">
    <div class="agent-avatar">${a.avatar}</div>
    <div class="agent-info">
      <div class="agent-name">${a.name}</div>
      <div class="agent-role">${a.role}</div>
      <div class="agent-email">${a.email}</div>
    </div>
    <button class="btn btn-icon btn-danger btn-sm" onclick="removeAgent('${a.id}')" title="ลบ Agent">🗑</button>
  </div>`;
}

function catChip(c) {
    return `
  <div class="cat-chip" id="cat-${c.id}">
    ${c.icon} ${c.name}
    <button class="cat-chip-remove" onclick="removeCat('${c.id}')" title="ลบ">✕</button>
  </div>`;
}

function attachAdminEvents(container, agents, cats, settings) {
    // Save SLA
    document.getElementById('btn-save-sla').addEventListener('click', () => {
        const sla = {};
        ['critical', 'high', 'medium', 'low'].forEach(p => {
            sla[p] = parseInt(document.getElementById(`sla-${p}`).value) || 24;
        });
        saveSettings({ ...settings, sla });
        showToast('success', 'บันทึก SLA สำเร็จ', '');
    });

    // Add category
    document.getElementById('btn-add-cat').addEventListener('click', () => {
        const icon = document.getElementById('new-cat-icon').value.trim() || '📋';
        const name = document.getElementById('new-cat-name').value.trim();
        if (!name) { showToast('warning', 'กรุณากรอกชื่อหมวดหมู่', ''); return; }
        const cats = getCategories();
        const newCat = { id: `c-${Date.now()}`, name, icon, color: '#6b7280' };
        cats.push(newCat);
        saveCategories(cats);
        document.getElementById('cat-chips').insertAdjacentHTML('beforeend', catChip(newCat));
        document.getElementById('new-cat-icon').value = '';
        document.getElementById('new-cat-name').value = '';
        showToast('success', 'เพิ่มหมวดหมู่แล้ว', name);
    });

    // Add agent modal
    document.getElementById('btn-add-agent').addEventListener('click', () => showAddAgentModal(container));

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        showConfirm('รีเซ็ตข้อมูล', 'จะลบข้อมูลทั้งหมดและโหลดข้อมูลทดสอบใหม่ ยืนยันใช่ไหม?', () => {
            Object.keys(localStorage).filter(k => k.startsWith('psn_')).forEach(k => localStorage.removeItem(k));
            showToast('info', 'รีเซ็ตสำเร็จ', 'กำลังโหลดหน้าใหม่...');
            setTimeout(() => location.reload(), 1000);
        });
    });
}

window.removeAgent = function (id) {
    showConfirm('ลบ Agent', 'ต้องการลบ Agent นี้ใช่ไหม?', () => {
        const agents = getAgents().filter(a => a.id !== id);
        saveAgents(agents);
        document.getElementById(`agent-${id}`)?.remove();
        showToast('success', 'ลบ Agent แล้ว', '');
    });
};

window.removeCat = function (id) {
    const cats = getCategories().filter(c => c.id !== id);
    saveCategories(cats);
    document.getElementById(`cat-${id}`)?.remove();
    showToast('success', 'ลบหมวดหมู่แล้ว', '');
};

function showAddAgentModal(container) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
    <div class="modal" style="min-width:400px">
      <div class="modal-title">➕ เพิ่ม Support Agent</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group">
          <label class="form-label">ชื่อ-นามสกุล <span class="required">*</span></label>
          <input class="form-control" id="ma-name" placeholder="ชื่อ นามสกุล">
        </div>
        <div class="form-group">
          <label class="form-label">อีเมล <span class="required">*</span></label>
          <input class="form-control" id="ma-email" placeholder="email@psn.th">
        </div>
        <div class="form-group">
          <label class="form-label">ตำแหน่ง</label>
          <input class="form-control" id="ma-role" placeholder="Support Engineer">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="ma-cancel">ยกเลิก</button>
        <button class="btn btn-accent" id="ma-save">เพิ่ม Agent</button>
      </div>
    </div>
  `;
    document.body.appendChild(overlay);
    overlay.querySelector('#ma-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#ma-save').addEventListener('click', () => {
        const name = overlay.querySelector('#ma-name').value.trim();
        const email = overlay.querySelector('#ma-email').value.trim();
        const role = overlay.querySelector('#ma-role').value.trim() || 'Support Engineer';
        if (!name || !email) { showToast('warning', 'กรุณากรอกข้อมูลให้ครบ', ''); return; }
        const av = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const agent = { id: `a-${Date.now()}`, name, email, role, avatar: av };
        const agents = getAgents();
        agents.push(agent);
        saveAgents(agents);
        document.getElementById('agent-list').insertAdjacentHTML('beforeend', agentCard(agent));
        overlay.remove();
        showToast('success', 'เพิ่ม Agent แล้ว', name);
    });
}
