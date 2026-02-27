// ============================================================
// ticket-form.js — Create / Edit Ticket
// ============================================================

import {
    createTicket, getTicketById, updateTicket, getCategories, getAgents,
    PRIORITY_LABELS,
} from './data.js';

export function renderTicketForm(container, editId = null) {
    const cats = getCategories();
    const ticket = editId ? getTicketById(editId) : null;
    const isEdit = !!ticket;

    container.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <span class="dot"></span>${isEdit ? 'แก้ไข Ticket' : 'สร้าง Ticket ใหม่'}
      </div>
      <button class="btn btn-outline" onclick="history.back()">← ย้อนกลับ</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">🎫 ${isEdit ? `แก้ไข: ${ticket.id}` : 'ข้อมูล Ticket'}</div>
      </div>
      <div class="card-body">
        <form id="ticket-form">
          <div style="display:flex;flex-direction:column;gap:20px">

            <!-- Section: ข้อมูลปัญหา -->
            <div>
              <div style="font-size:0.8rem;font-weight:700;color:var(--accent-light);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
                📝 ข้อมูลปัญหา
              </div>
              <div class="form-grid">
                <div class="form-group form-full">
                  <label class="form-label">หัวข้อปัญหา <span class="required">*</span></label>
                  <input type="text" class="form-control" id="f-title" placeholder="อธิบายปัญหาสั้นๆ เช่น ไม่สามารถชำระเงินได้"
                    value="${esc(ticket?.title)}">
                  <span class="form-error" id="err-title"></span>
                </div>
                <div class="form-group form-full">
                  <label class="form-label">รายละเอียดปัญหา <span class="required">*</span></label>
                  <textarea class="form-control" id="f-desc" rows="4"
                    placeholder="อธิบายปัญหาโดยละเอียด: เกิดขึ้นเมื่อไหร่ / ขั้นตอนก่อนเกิดปัญหา / รหัส error ที่ได้รับ">${esc(ticket?.description)}</textarea>
                  <span class="form-error" id="err-desc"></span>
                </div>
                <div class="form-group">
                  <label class="form-label">หมวดหมู่ <span class="required">*</span></label>
                  <select class="form-control" id="f-category">
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    ${cats.map(c => `<option value="${c.id}" ${ticket?.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
                  </select>
                  <span class="form-error" id="err-category"></span>
                </div>
                <div class="form-group">
                  <label class="form-label">ความสำคัญ <span class="required">*</span></label>
                  <select class="form-control" id="f-priority">
                    <option value="">-- เลือกระดับ --</option>
                    <option value="low"      ${ticket?.priority === 'low' ? 'selected' : ''}>🟢 Low — ปัญหาเล็กน้อย</option>
                    <option value="medium"   ${ticket?.priority === 'medium' ? 'selected' : ''}>🟡 Medium — ปัญหาระดับกลาง</option>
                    <option value="high"     ${ticket?.priority === 'high' ? 'selected' : ''}>🟠 High — ปัญหาสำคัญ</option>
                    <option value="critical" ${ticket?.priority === 'critical' ? 'selected' : ''}>🔴 Critical — เร่งด่วนมาก</option>
                  </select>
                  <span class="form-error" id="err-priority"></span>
                </div>
              </div>
            </div>

            <!-- Section: Transaction Info -->
            <div>
              <div style="font-size:0.8rem;font-weight:700;color:var(--accent-2);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
                💳 ข้อมูลธุรกรรม (ถ้ามี)
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Merchant ID</label>
                  <input type="text" class="form-control" id="f-merchant" placeholder="เช่น MER-0023"
                    value="${esc(ticket?.merchantId)}">
                </div>
                <div class="form-group">
                  <label class="form-label">Transaction Reference</label>
                  <input type="text" class="form-control" id="f-txref" placeholder="เช่น TXN-20260227-001"
                    value="${esc(ticket?.transactionRef)}">
                </div>
              </div>
            </div>

            <!-- Section: ข้อมูลผู้แจ้ง -->
            <div>
              <div style="font-size:0.8rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid var(--border)">
                👤 ข้อมูลผู้แจ้ง
              </div>
              <div class="form-grid cols-3">
                <div class="form-group">
                  <label class="form-label">ชื่อ-นามสกุล <span class="required">*</span></label>
                  <input type="text" class="form-control" id="f-name" placeholder="ชื่อ นามสกุล"
                    value="${esc(ticket?.reporterName)}">
                  <span class="form-error" id="err-name"></span>
                </div>
                <div class="form-group">
                  <label class="form-label">อีเมล <span class="required">*</span></label>
                  <input type="email" class="form-control" id="f-email" placeholder="email@example.com"
                    value="${esc(ticket?.reporterEmail)}">
                  <span class="form-error" id="err-email"></span>
                </div>
                <div class="form-group">
                  <label class="form-label">เบอร์โทร</label>
                  <input type="tel" class="form-control" id="f-phone" placeholder="0XX-XXX-XXXX"
                    value="${esc(ticket?.reporterPhone)}">
                </div>
              </div>
            </div>

          </div>
          <!-- Submit -->
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
            <button type="button" class="btn btn-outline" onclick="history.back()">ยกเลิก</button>
            <button type="submit" class="btn btn-accent" id="submit-btn">
              ${isEdit ? '💾 บันทึกการแก้ไข' : '➕ สร้าง Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    document.getElementById('ticket-form').addEventListener('submit', e => {
        e.preventDefault();
        submitForm(isEdit, editId);
    });
}

function submitForm(isEdit, editId) {
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const setErr = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg; };
    const setInvalid = (id, bad) => { document.getElementById(id)?.classList[bad ? 'add' : 'remove']('is-invalid'); };

    // Clear errors
    ['title', 'desc', 'category', 'priority', 'name', 'email'].forEach(f => { setErr(`err-${f}`, ''); setInvalid(`f-${f}`, false); });

    let valid = true;
    const v = (field, errId, msg, check) => {
        if (!check) { setErr(errId, msg); setInvalid(`f-${field}`, true); valid = false; }
    };

    const title = get('f-title');
    const desc = get('f-desc');
    const category = get('f-category');
    const priority = get('f-priority');
    const name = get('f-name');
    const email = get('f-email');

    v('title', 'err-title', 'กรุณากรอกหัวข้อปัญหา', title.length >= 5);
    v('desc', 'err-desc', 'กรุณากรอกรายละเอียด', desc.length >= 10);
    v('category', 'err-category', 'กรุณาเลือกหมวดหมู่', !!category);
    v('priority', 'err-priority', 'กรุณาเลือกความสำคัญ', !!priority);
    v('name', 'err-name', 'กรุณากรอกชื่อ', name.length >= 2);
    v('email', 'err-email', 'กรุณากรอก email ที่ถูกต้อง', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (!valid) return;

    const data = {
        title,
        description: desc,
        category,
        priority,
        reporterName: name,
        reporterEmail: email,
        reporterPhone: get('f-phone'),
        merchantId: get('f-merchant') || null,
        transactionRef: get('f-txref') || null,
    };

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';

    setTimeout(() => {
        if (isEdit) {
            updateTicket(editId, data);
            showToast('success', 'บันทึกสำเร็จ', `Ticket ${editId} ถูกอัปเดตแล้ว`);
            navigate(`#tickets/${editId}`);
        } else {
            const t = createTicket(data);
            showToast('success', 'สร้าง Ticket สำเร็จ', `${t.id} ถูกสร้างแล้ว`);
            navigate(`#tickets/${t.id}`);
        }
    }, 300);
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
