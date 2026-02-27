// data.js — Firebase Realtime Database Layer (no ES modules)
"use strict";

// ── Firebase Config ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAfal6grNtLApn1oiX8p0mbyb4TpsMYrDo",
  authDomain: "gloy-8831a.firebaseapp.com",
  databaseURL: "https://gloy-8831a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gloy-8831a",
  storageBucket: "gloy-8831a.firebasestorage.app",
  messagingSenderId: "920776916154",
  appId: "1:920776916154:web:eef1247abf4e1d77c89683",
  measurementId: "G-34F6XB9S9T"
};

// ── Teams & Permissions ──────────────────────────────────────
window.TEAMS = {
  CS: { label: 'Customer Service', short: 'CS', color: '#6366f1', bg: 'rgba(99,102,241,.18)', icon: '🎧', perms: { create: true, editAll: true, closeAll: true, admin: false, viewReports: true } },
  Sale: { label: 'Sales', short: 'Sale', color: '#f59e0b', bg: 'rgba(245,158,11,.18)', icon: '💼', perms: { create: true, editAll: false, closeAll: false, admin: false, viewReports: false } },
  ACC: { label: 'Accounting', short: 'ACC', color: '#10b981', bg: 'rgba(16,185,129,.18)', icon: '🏦', perms: { create: false, editAll: false, closeAll: false, admin: false, viewReports: true } },
  MKT: { label: 'Marketing', short: 'MKT', color: '#ec4899', bg: 'rgba(236,72,153,.18)', icon: '📣', perms: { create: false, editAll: false, closeAll: false, admin: false, viewReports: false } },
  ADMIN: { label: 'Administrator', short: 'ADMIN', color: '#a78bfa', bg: 'rgba(167,139,250,.18)', icon: '👑', perms: { create: true, editAll: true, closeAll: true, admin: true, viewReports: true } },
};

// ── Seed Users (local only — no Firebase) ────────────────────
const SEED_USERS = [
  { id: 'u1', username: 'cs01', password: 'cs1234', name: 'สมชาย วงศ์ดี', team: 'CS', role: 'Senior Support', avatar: 'SC' },
  { id: 'u2', username: 'cs02', password: 'cs1234', name: 'นภา รักดี', team: 'CS', role: 'Support Engineer', avatar: 'NR' },
  { id: 'u3', username: 'sale01', password: 'sale1234', name: 'อนุวัต คงดี', team: 'Sale', role: 'Sales Executive', avatar: 'AK' },
  { id: 'u4', username: 'sale02', password: 'sale1234', name: 'มาลี พงษ์ไทย', team: 'Sale', role: 'Sales Executive', avatar: 'MP' },
  { id: 'u5', username: 'acc01', password: 'acc1234', name: 'กัลยา รุ่งเรือง', team: 'ACC', role: 'Accountant', avatar: 'KR' },
  { id: 'u6', username: 'acc02', password: 'acc1234', name: 'วรรณา สุขใจ', team: 'ACC', role: 'Finance Officer', avatar: 'WS' },
  { id: 'u7', username: 'mkt01', password: 'mkt1234', name: 'พิมพ์ใจ ลำดวน', team: 'MKT', role: 'Marketing Manager', avatar: 'PL' },
  { id: 'u8', username: 'mkt02', password: 'mkt1234', name: 'ธนพล สว่างใจ', team: 'MKT', role: 'Content Creator', avatar: 'TS' },
  { id: 'u9', username: 'admin', password: 'admin1234', name: 'Administrator', team: 'ADMIN', role: 'System Admin', avatar: 'AD' },
];

// ── Seed Data ────────────────────────────────────────────────
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
function _fireKey(str) { return str.replace(/[.#$/\[\]]/g, '_'); }

// ── DB State ─────────────────────────────────────────────────
let _rtdb = null;

// ── Main DB Object ────────────────────────────────────────────
window.DB = {

  // ── Firebase Init ──────────────────────────────────────────
  async init() {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    _rtdb = firebase.database();
    // Seed if first run (check /meta/initialized)
    const snap = await _rtdb.ref('/meta/initialized').once('value');
    if (!snap.val()) {
      await this._seed();
      await _rtdb.ref('/meta/initialized').set(true);
      await _rtdb.ref('/meta/seededAt').set(_now());
    }
  },

  async _seed() {
    // Initialise default agents, categories and settings only — no mock tickets
    const agentsObj = Object.fromEntries(SEED_AGENTS.map(a => [a.id, a]));
    await _rtdb.ref('/agents').set(agentsObj);
    const catsObj = Object.fromEntries(SEED_CATEGORIES.map(c => [c.id, c]));
    await _rtdb.ref('/categories').set(catsObj);
    await _rtdb.ref('/settings').set(SEED_SETTINGS);
  },

  // ── Auth (local sessionStorage — no Firebase Auth needed) ──
  getUsers() { return SEED_USERS; },
  login(username, password) {
    const u = SEED_USERS.find(u => u.username === username && u.password === password);
    if (!u) return null;
    const sess = { userId: u.id, username: u.username, name: u.name, team: u.team, role: u.role, avatar: u.avatar, loginAt: _now() };
    sessionStorage.setItem('psn_session', JSON.stringify(sess));
    return sess;
  },
  logout() { sessionStorage.removeItem('psn_session'); },
  getSession() { return JSON.parse(sessionStorage.getItem('psn_session') || 'null'); },
  isLoggedIn() { return !!this.getSession(); },
  can(perm) { const sess = this.getSession(); if (!sess) return false; return !!(TEAMS[sess.team]?.perms?.[perm]); },

  // ── Tickets ────────────────────────────────────────────────
  async getTickets() {
    const snap = await _rtdb.ref('/tickets').once('value');
    const val = snap.val();
    if (!val) return [];
    return Object.values(val).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getTicketById(id) {
    const snap = await _rtdb.ref('/tickets/' + _fireKey(id)).once('value');
    return snap.val() || null;
  },
  async createTicket(data) {
    const sess = this.getSession();
    const id = _genId();
    const key = _fireKey(id);
    const t = { ...data, id, status: 'open', assignee: null, createdBy: sess?.username, createdByTeam: sess?.team, createdAt: _now(), updatedAt: _now() };
    await _rtdb.ref('/tickets/' + key).set(t);
    // Init comment
    const cmtKey = 'cmt-' + Date.now();
    await _rtdb.ref('/comments/' + key + '/' + cmtKey).set({ id: cmtKey, type: 'system', text: `Ticket ถูกสร้างโดย <strong>${sess?.name || 'Unknown'}</strong> (ทีม ${sess?.team || '-'})`, author: 'ระบบ', avatar: '⚙️', createdAt: _now() });
    return t;
  },
  async updateTicket(id, changes) {
    const key = _fireKey(id);
    await _rtdb.ref('/tickets/' + key).update({ ...changes, updatedAt: _now() });
    const snap = await _rtdb.ref('/tickets/' + key).once('value');
    return snap.val();
  },
  async deleteTicket(id) {
    const key = _fireKey(id);
    await _rtdb.ref('/tickets/' + key).remove();
    await _rtdb.ref('/comments/' + key).remove();
  },

  // ── Comments ────────────────────────────────────────────────
  async getComments(ticketId) {
    const snap = await _rtdb.ref('/comments/' + _fireKey(ticketId)).once('value');
    const val = snap.val();
    if (!val) return [];
    return Object.values(val).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async addComment(ticketId, { text, author, avatar, type = 'comment' }) {
    const key = _fireKey(ticketId);
    const cmtKey = 'cmt-' + Date.now();
    const c = { id: cmtKey, type, text, author, avatar, createdAt: _now() };
    await _rtdb.ref('/comments/' + key + '/' + cmtKey).set(c);
    return c;
  },

  // ── Agents ─────────────────────────────────────────────────
  async getAgents() {
    const snap = await _rtdb.ref('/agents').once('value');
    const val = snap.val();
    return val ? Object.values(val) : [];
  },
  async saveAgents(arr) {
    const obj = Object.fromEntries(arr.map(a => [a.id, a]));
    await _rtdb.ref('/agents').set(obj);
  },

  // ── Categories ──────────────────────────────────────────────
  async getCategories() {
    const snap = await _rtdb.ref('/categories').once('value');
    const val = snap.val();
    return val ? Object.values(val) : [];
  },
  async saveCategories(arr) {
    const obj = Object.fromEntries(arr.map(c => [c.id, c]));
    await _rtdb.ref('/categories').set(obj);
  },

  // ── Settings ────────────────────────────────────────────────
  async getSettings() {
    const snap = await _rtdb.ref('/settings').once('value');
    return snap.val() || {};
  },
  async saveSettings(s) {
    await _rtdb.ref('/settings').set(s);
  },

  // ── Stats ──────────────────────────────────────────────────
  async getStats() {
    const t = await this.getTickets();
    return {
      total: t.length,
      open: t.filter(x => x.status === 'open').length,
      in_progress: t.filter(x => x.status === 'in_progress').length,
      resolved: t.filter(x => x.status === 'resolved').length,
      closed: t.filter(x => x.status === 'closed').length,
      critical: t.filter(x => x.priority === 'critical').length,
      high: t.filter(x => x.priority === 'high').length,
      medium: t.filter(x => x.priority === 'medium').length,
      low: t.filter(x => x.priority === 'low').length,
    };
  },

  // ── Reset ───────────────────────────────────────────────────
  async resetAll() {
    await _rtdb.ref('/').remove();
    await this._seed();
    await _rtdb.ref('/meta/initialized').set(true);
    await _rtdb.ref('/meta/seededAt').set(_now());
  },
};

// ── Constants ─────────────────────────────────────────────────
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
  async getSLAStatus(ticket) {
    const sla = (await DB.getSettings()).sla || {};
    const hours = sla[ticket.priority] || 24;
    const elapsed = (Date.now() - new Date(ticket.createdAt).getTime()) / 3600000;
    const pct = Math.min(Math.round((elapsed / hours) * 100), 100);
    const rem = Math.max(hours - elapsed, 0);
    return { pct, remaining: rem < 1 ? Math.round(rem * 60) + ' นาที' : rem.toFixed(1) + ' ชั่วโมง', breached: elapsed > hours, resolved: ['resolved', 'closed'].includes(ticket.status) };
  },
  esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
};
