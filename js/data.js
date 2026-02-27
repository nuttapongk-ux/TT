// data.js — Global Data Layer (no ES modules)
"use strict";

const DB_KEYS = { tickets: 'psn_tickets', agents: 'psn_agents', categories: 'psn_categories', settings: 'psn_settings', comments: 'psn_comments' };

const SEED_AGENTS = [
  { id: 'a1', name: 'สมชาย วงศ์ดี', email: 'somchai@psn.th', role: 'Senior Support', avatar: 'SC' },
  { id: 'a2', name: 'นภา รักดี', email: 'napa@psn.th', role: 'Support Engineer', avatar: 'NR' },
  { id: 'a3', name: 'กิตติ พรหมมา', email: 'kitti@psn.th', role: 'Technical Lead', avatar: 'KP' },
  { id: 'a4', name: 'วรรณา สุขใจ', email: 'wanna@psn.th', role: 'Support Engineer', avatar: 'WS' },
];
const SEED_CATEGORIES = [
  { id: 'c1', name: 'Payment Timeout', icon: '⏱️', color: '#f59e0b' },
  { id: 'c2', name: 'Duplicate Charge', icon: '💳', color: '#ef4444' },
  { id: 'c3', name: 'Failed Transaction', icon: '❌', color: '#dc2626' },
  { id: 'c4', name: 'Refund Issue', icon: '↩️', color: '#8b5cf6' },
  { id: 'c5', name: 'Authentication Error', icon: '🔐', color: '#f97316' },
  { id: 'c6', name: 'Webhook Not Received', icon: '🔗', color: '#06b6d4' },
  { id: 'c7', name: 'Settlement Delay', icon: '🏦', color: '#10b981' },
  { id: 'c8', name: 'Other', icon: '📋', color: '#6b7280' },
];
const SEED_SETTINGS = { sla: { critical: 2, high: 8, medium: 24, low: 72 } };

function _genId() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return 'TKT-' + d + '-' + Math.floor(1000 + Math.random() * 9000);
}
function _now() { return new Date().toISOString(); }

function _buildSeedTickets() {
  const T = (h) => new Date(Date.now() - h * 3600000).toISOString();
  return [
    { id: _genId(), title: 'ไม่สามารถชำระเงินผ่าน QR Code ได้', description: 'ลูกค้าร้องเรียนว่าเมื่อสแกน QR แล้วระบบแสดง timeout ทุกครั้ง เกิดขึ้นตั้งแต่เวลา 14:00 น. วันนี้ ลูกค้าหลายรายได้รับผลกระทบ', reporterName: 'วิชัย ทองดี', reporterEmail: 'wichai@merchant.co.th', reporterPhone: '081-234-5678', category: 'c1', priority: 'critical', status: 'open', assignee: null, createdAt: T(2), updatedAt: T(2), merchantId: 'MER-0023', transactionRef: 'TXN-20260227-001' },
    { id: _genId(), title: 'ถูกตัดเงินซ้ำซ้อน 2 ครั้ง', description: 'ลูกค้าชำระเงิน 1,500 บาท แต่ถูกหักจากบัญชี 3,000 บาท เกิดขึ้น 1 ครั้ง ลูกค้าต้องการขอคืนเงินส่วนเกิน', reporterName: 'สุนิสา ใจดี', reporterEmail: 'sunisa@example.com', reporterPhone: '089-876-5432', category: 'c2', priority: 'high', status: 'in_progress', assignee: 'a1', createdAt: T(5), updatedAt: T(1), merchantId: 'MER-0045', transactionRef: 'TXN-20260226-882' },
    { id: _genId(), title: 'Transaction failed แต่ระบบไม่แจ้งผล', description: 'ทำรายการชำระไม่สำเร็จ แต่ระบบไม่ส่ง callback กลับมายัง merchant ทำให้ order ค้างอยู่ใน pending', reporterName: 'ประเสริฐ มีสุข', reporterEmail: 'prasert@shop.th', reporterPhone: '062-111-2222', category: 'c3', priority: 'high', status: 'open', assignee: 'a2', createdAt: T(8), updatedAt: T(8), merchantId: 'MER-0012', transactionRef: 'TXN-20260226-445' },
    { id: _genId(), title: 'Refund ไม่เข้าบัญชีลูกค้าหลัง 7 วัน', description: 'ทำการ refund ผ่านระบบเมื่อ 7 วันที่แล้ว แต่ลูกค้ายังไม่ได้รับเงินคืน ต้องการตรวจสอบสถานะ', reporterName: 'กัลยา รุ่งเรือง', reporterEmail: 'kanya@boutique.com', reporterPhone: '095-333-4444', category: 'c4', priority: 'medium', status: 'in_progress', assignee: 'a3', createdAt: T(48), updatedAt: T(4), merchantId: 'MER-0067', transactionRef: 'REF-20260220-123' },
    { id: _genId(), title: '3D Secure OTP ไม่ส่ง SMS', description: 'ลูกค้ายืนยันการชำระด้วยบัตรเครดิต แต่ไม่ได้รับ OTP ทาง SMS ทำให้ชำระเงินไม่สำเร็จ', reporterName: 'ธนพล สว่างใจ', reporterEmail: 'tanaphon@store.th', reporterPhone: '098-555-6666', category: 'c5', priority: 'high', status: 'resolved', assignee: 'a1', createdAt: T(72), updatedAt: T(24), merchantId: 'MER-0034', transactionRef: 'TXN-20260224-777' },
    { id: _genId(), title: 'Webhook ไม่ถูกส่งเมื่อรายการสำเร็จ', description: 'ระบบ payment สำเร็จแต่ webhook endpoint ของ merchant ไม่ได้รับ event ทำให้ order ไม่ถูก fulfill', reporterName: 'อนุวัต คงดี', reporterEmail: 'anuwat@techstore.co.th', reporterPhone: '085-777-8888', category: 'c6', priority: 'medium', status: 'open', assignee: null, createdAt: T(96), updatedAt: T(96), merchantId: 'MER-0089', transactionRef: 'TXN-20260223-321' },
    { id: _genId(), title: 'Settlement ล่าช้ากว่ากำหนด', description: 'รอบ settlement วันที่ 25 ก.พ. ยังไม่โอนเงินเข้าบัญชีธนาคาร ทั้งที่ครบกำหนดแล้ว', reporterName: 'มาลี พงษ์ไทย', reporterEmail: 'malee@fashion.th', reporterPhone: '082-999-0000', category: 'c7', priority: 'high', status: 'closed', assignee: 'a4', createdAt: T(120), updatedAt: T(48), merchantId: 'MER-0056', transactionRef: 'SET-20260225-001' },
    { id: _genId(), title: 'ระบบแสดง error Invalid merchant key', description: 'ตั้งแต่เมื่อวานเว็บไซต์ merchant แสดง error Invalid merchant key ทั้งที่ key ไม่ได้เปลี่ยนแปลง', reporterName: 'จิรายุ บุญมา', reporterEmail: 'jirayu@online.co.th', reporterPhone: '091-222-3333', category: 'c5', priority: 'critical', status: 'in_progress', assignee: 'a3', createdAt: T(24), updatedAt: T(2), merchantId: 'MER-0011', transactionRef: null },
    { id: _genId(), title: 'ไม่สามารถยกเลิก Subscription ได้', description: 'ลูกค้าต้องการยกเลิก recurring payment แต่ระบบไม่มีตัวเลือก หรือกดยกเลิกแล้วยังถูกตัดเงินต่อ', reporterName: 'พิมพ์ใจ ลำดวน', reporterEmail: 'pimjai@service.com', reporterPhone: '076-444-5555', category: 'c8', priority: 'medium', status: 'resolved', assignee: 'a2', createdAt: T(168), updatedAt: T(72), merchantId: 'MER-0078', transactionRef: 'SUB-20260220-099' },
    { id: _genId(), title: 'API เรียกไม่ได้ 502 Bad Gateway', description: 'Production API endpoint ตอบกลับด้วย 502 Bad Gateway ตั้งแต่เวลา 10:30 น. ส่งผลต่อ merchant ทั้งหมด', reporterName: 'ณัฐพงศ์ ศรีวิชัย', reporterEmail: 'nattaphong@it.corp.th', reporterPhone: '086-660-7711', category: 'c3', priority: 'critical', status: 'open', assignee: 'a3', createdAt: T(3), updatedAt: T(3), merchantId: null, transactionRef: null },
  ];
}

// ── Init ──────────────────────────────────────────────────────
window.DB = {
  init() {
    if (!localStorage.getItem(DB_KEYS.agents)) localStorage.setItem(DB_KEYS.agents, JSON.stringify(SEED_AGENTS));
    if (!localStorage.getItem(DB_KEYS.categories)) localStorage.setItem(DB_KEYS.categories, JSON.stringify(SEED_CATEGORIES));
    if (!localStorage.getItem(DB_KEYS.settings)) localStorage.setItem(DB_KEYS.settings, JSON.stringify(SEED_SETTINGS));
    if (!localStorage.getItem(DB_KEYS.tickets)) {
      const tickets = _buildSeedTickets();
      localStorage.setItem(DB_KEYS.tickets, JSON.stringify(tickets));
      const comments = {};
      tickets.forEach(t => { comments[t.id] = [{ id: 'cmt0', type: 'system', text: 'Ticket ถูกสร้างขึ้นแล้ว', author: 'ระบบ', avatar: '⚙️', createdAt: t.createdAt }]; });
      localStorage.setItem(DB_KEYS.comments, JSON.stringify(comments));
    }
  },

  // Tickets
  getTickets() { return JSON.parse(localStorage.getItem(DB_KEYS.tickets) || '[]'); },
  getTicketById(id) { return this.getTickets().find(t => t.id === id) || null; },
  createTicket(data) {
    const tickets = this.getTickets();
    const t = { ...data, id: _genId(), status: 'open', assignee: null, createdAt: _now(), updatedAt: _now() };
    tickets.unshift(t);
    localStorage.setItem(DB_KEYS.tickets, JSON.stringify(tickets));
    const all = this.getAllComments();
    all[t.id] = [{ id: 'cmt-init', type: 'system', text: 'Ticket ถูกสร้างขึ้นแล้ว', author: 'ระบบ', avatar: '⚙️', createdAt: _now() }];
    localStorage.setItem(DB_KEYS.comments, JSON.stringify(all));
    return t;
  },
  updateTicket(id, changes) {
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === id); if (idx === -1) return null;
    tickets[idx] = { ...tickets[idx], ...changes, updatedAt: _now() };
    localStorage.setItem(DB_KEYS.tickets, JSON.stringify(tickets));
    return tickets[idx];
  },
  deleteTicket(id) { localStorage.setItem(DB_KEYS.tickets, JSON.stringify(this.getTickets().filter(t => t.id !== id))); },

  // Comments
  getAllComments() { return JSON.parse(localStorage.getItem(DB_KEYS.comments) || '{}'); },
  getComments(tid) { return this.getAllComments()[tid] || []; },
  addComment(tid, { text, author, avatar, type = 'comment' }) {
    const all = this.getAllComments();
    if (!all[tid]) all[tid] = [];
    const c = { id: 'cmt-' + Date.now(), type, text, author, avatar, createdAt: _now() };
    all[tid].push(c);
    localStorage.setItem(DB_KEYS.comments, JSON.stringify(all));
    return c;
  },

  // Agents / Categories / Settings
  getAgents() { return JSON.parse(localStorage.getItem(DB_KEYS.agents) || '[]'); },
  saveAgents(a) { localStorage.setItem(DB_KEYS.agents, JSON.stringify(a)); },
  getCategories() { return JSON.parse(localStorage.getItem(DB_KEYS.categories) || '[]'); },
  saveCategories(c) { localStorage.setItem(DB_KEYS.categories, JSON.stringify(c)); },
  getSettings() { return JSON.parse(localStorage.getItem(DB_KEYS.settings) || '{}'); },
  saveSettings(s) { localStorage.setItem(DB_KEYS.settings, JSON.stringify(s)); },

  // Stats
  getStats() {
    const t = this.getTickets();
    return {
      total: t.length,
      open: t.filter(x => x.status === 'open').length,
      in_progress: t.filter(x => x.status === 'in_progress').length,
      resolved: t.filter(x => x.status === 'resolved').length,
      closed: t.filter(x => x.status === 'closed').length,
      critical: t.filter(x => x.priority === 'critical').length,
      high: t.filter(x => x.priority === 'high').length,
      medium: t.filter(x => x.priority === 'medium').length,
      low: x => x.priority === 'low', // fixed below
    };
  },
};

// Fix stats.low
const _origGetStats = window.DB.getStats.bind(window.DB);
window.DB.getStats = function () { const s = _origGetStats(); s.low = this.getTickets().filter(x => x.priority === 'low').length; return s; };

// ── Constants ────────────────────────────────────────────────
window.C = {
  STATUS_LABELS: { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' },
  STATUS_COLORS: { open: '#ef4444', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' },
  PRIORITY_LABELS: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
  PRIORITY_COLORS: { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' },

  formatDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  timeAgo(iso) {
    if (!iso) return '-';
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'เมื่อสักครู่';
    if (m < 60) return m + ' นาทีที่แล้ว';
    const h = Math.floor(m / 60); if (h < 24) return h + ' ชั่วโมงที่แล้ว';
    return Math.floor(h / 24) + ' วันที่แล้ว';
  },
  getSLAStatus(ticket) {
    const sla = DB.getSettings().sla || {};
    const hours = sla[ticket.priority] || 24;
    const elapsed = (Date.now() - new Date(ticket.createdAt).getTime()) / 3600000;
    const pct = Math.min(Math.round((elapsed / hours) * 100), 100);
    const rem = Math.max(hours - elapsed, 0);
    return {
      pct,
      remaining: rem < 1 ? Math.round(rem * 60) + ' นาที' : rem.toFixed(1) + ' ชั่วโมง',
      breached: elapsed > hours,
      resolved: ['resolved', 'closed'].includes(ticket.status),
    };
  },
  esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
