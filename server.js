'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

let MongoClient;
let ObjectId;
try {
  ({ MongoClient, ObjectId } = require('mongodb'));
} catch {
  console.error('Avval `npm i mongodb` ni ishga tushiring.');
  process.exit(1);
}

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const STATIC_FILES = new Map([
  ['admin-attendance.html', 'text/html; charset=utf-8'],
  ['admin-content.html', 'text/html; charset=utf-8'],
  ['admin-finance.html', 'text/html; charset=utf-8'],
  ['admin-groups.html', 'text/html; charset=utf-8'],
  ['admin-landing.html', 'text/html; charset=utf-8'],
  ['admin-users.html', 'text/html; charset=utf-8'],
  ['ai.html', 'text/html; charset=utf-8'],
  ['announcements.html', 'text/html; charset=utf-8'],
  ['attendance.html', 'text/html; charset=utf-8'],
  ['app.css', 'text/css; charset=utf-8'],
  ['app.js', 'application/javascript; charset=utf-8'],
  ['chat.html', 'text/html; charset=utf-8'],
  ['chats.html', 'text/html; charset=utf-8'],
  ['dashboard.html', 'text/html; charset=utf-8'],
  ['group.html', 'text/html; charset=utf-8'],
  ['groups.html', 'text/html; charset=utf-8'],
  ['index.html', 'text/html; charset=utf-8'],
  ['login.html', 'text/html; charset=utf-8'],
  ['material.html', 'text/html; charset=utf-8'],
  ['materials.html', 'text/html; charset=utf-8'],
  ['payment.html', 'text/html; charset=utf-8'],
  ['profile.html', 'text/html; charset=utf-8'],
  ['register.html', 'text/html; charset=utf-8'],
  ['video.html', 'text/html; charset=utf-8'],
  ['videos.html', 'text/html; charset=utf-8'],
  ['schedule.html', 'text/html; charset=utf-8'],
  ['search.html', 'text/html; charset=utf-8'],
]);

loadEnv(path.join(ROOT, '.env'));

const PORT = Number(process.env.PORT || 3000);
const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'pulsechat';
const APP_SECRET = process.env.APP_SECRET || 'change-me';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const ADMIN_PAYMENT_CARD = clean(process.env.ADMIN_PAYMENT_CARD || '8600 0000 0000 0000', 120);
const ADMIN_PAYMENT_OWNER = clean(process.env.ADMIN_PAYMENT_OWNER || 'Cliffs Admin', 120);
const ADMIN_COMMISSION_PERCENT = Math.max(0, Math.min(100, Number(process.env.ADMIN_COMMISSION_PERCENT || 10) || 10));
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || '';
const HALLAYMTURN_API = clean(process.env.HALLAYMTURN_API || process.env.TURN_URL || process.env.EXPRESSTURN_TURN_URLS || '', 8000);
const HALLAYM_STUN_URLS = splitCsv(process.env.HALLAYM_STUN_URLS || process.env.EXPRESSTURN_STUN_URLS || process.env.TURN_STUN_URLS || 'stun:stun.l.google.com:19302');
const HALLAYM_TURN_URLS = splitCsv(HALLAYMTURN_API || process.env.HALLAYM_TURN_URLS || process.env.TURN_URLS || '');
const HALLAYM_TURN_USERNAME = process.env.HALLAYM_TURN_USERNAME || process.env.TURN_USERNAME || process.env.EXPRESSTURN_USERNAME || '';
const HALLAYM_TURN_PASSWORD = process.env.HALLAYM_TURN_PASSWORD || process.env.TURN_PASSWORD || process.env.EXPRESSTURN_CREDENTIAL || process.env.TURN_CREDENTIAL || '';
const HALLAYM_TURN_SECRET_KEY = process.env.HALLAYMTURN_SECRET_KEY || process.env.EXPRESSTURN_SECRET_KEY || '';
const HALLAYM_DISABLE_PUBLIC_TURN = /^(1|true|yes)$/i.test(String(process.env.DISABLE_PUBLIC_TURN || process.env.HALLAYM_DISABLE_PUBLIC_TURN || '0'));
const MAX_GROUP_CALL_PARTICIPANTS = Number(process.env.MAX_GROUP_CALL_PARTICIPANTS || process.env.HALLAYM_MAX_GROUP_CALL_PARTICIPANTS || 50);
const SITE_CONTENT_KEY = 'landing';

const mongo = new MongoClient(DB_URI);
let users;
let chats;
let messages;
let calls;
let signals;
let attendance;
let announcements;
let schedules;
let materials;
let materialSubmissions;
let tuitionPlans;
let studentPayments;
let teacherPayrolls;
let financeExpenses;
let siteContent;
let teacherFollowers;
let groupJoinRequests;
let videoLessons;
let videoLessonLikes;
let videoLessonComments;
let liveSessions;
let liveSignals;
let liveSessionLikes;
let liveSessionComments;

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function err(message, code = 400) {
  const e = new Error(message);
  e.code = code;
  return e;
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': type.includes('html') ? 'no-cache' : 'no-store' });
  res.end(body);
}

function json(res, code, body) {
  send(res, code, JSON.stringify(body), 'application/json; charset=utf-8');
}

function text(res, code, body, type = 'text/plain; charset=utf-8') {
  send(res, code, body, type);
}

function mimeType(name) {
  const ext = path.extname(name).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webmanifest': 'application/manifest+json',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
  }[ext] || 'application/octet-stream';
}

function redir(res, to) {
  res.writeHead(302, { Location: to });
  res.end();
}

function clean(v, max = 9999) {
  return String(v || '').trim().slice(0, max);
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function username(v) {
  return clean(v, 24).toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '');
}

function phone(v) {
  const p = clean(v, 40).replace(/[^\d+]/g, '');
  return p ? (p.startsWith('+') ? p : '+' + p) : '';
}

function oid(v) {
  if (!v) return null;
  if (v instanceof ObjectId) return v;
  return ObjectId.isValid(v) ? new ObjectId(v) : null;
}

function uniqIds(list) {
  const s = new Set();
  const out = [];
  for (const item of list) {
    const id = oid(item);
    if (!id) continue;
    const k = String(id);
    if (s.has(k)) continue;
    s.add(k);
    out.push(id);
  }
  return out;
}

function hash(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pass, salt, 64).toString('hex');
}

function check(pass, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const d = crypto.scryptSync(pass, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(d, 'hex'));
}

function b64(v) {
  return Buffer.from(v).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function unb64(v) {
  const s = v.replace(/-/g, '+').replace(/_/g, '/');
  const p = s.length % 4 ? s + '='.repeat(4 - (s.length % 4)) : s;
  return Buffer.from(p, 'base64').toString('utf8');
}

function signedToken(payload) {
  const p = b64(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  const sig = crypto.createHmac('sha256', APP_SECRET).update(p).digest('hex');
  return p + '.' + sig;
}

function token(id) {
  return signedToken({ kind: 'user', id: String(id) });
}

function adminToken() {
  return signedToken({ kind: 'admin', login: ADMIN_LOGIN });
}

function readToken(v) {
  if (!v || !v.includes('.')) return null;
  const [p, sig] = v.split('.');
  const ex = crypto.createHmac('sha256', APP_SECRET).update(p).digest('hex');
  if (sig.length !== ex.length || !crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(ex, 'hex'))) return null;
  try {
    const data = JSON.parse(unb64(p));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function pubUser(u) {
  return u
    ? {
        id: String(u._id),
        fullName: u.fullName || '',
        username: u.username || '',
        phone: u.phone || '',
        bio: u.bio || '',
        avatar: u.avatar || '',
        role: u.role || 'member',
        approvalStatus: approvalStatus(u.approvalStatus),
        mentorTeacherId: u.mentorTeacherId ? String(u.mentorTeacherId) : '',
        studyGroupIds: (u.studyGroupIds || []).map((id) => String(id)),
      }
    : null;
}

function preview(msg) {
  if (msg.text) return clean(msg.text, 70);
  if (msg.mediaUrl) return 'Rasm yuborildi';
  return 'Yangi xabar';
}

const MESSAGE_REACTION_SET = new Set(['👍', '❤️', '🔥', '👏', '😂', '😮', '😢']);

function reactionEmoji(value) {
  const emoji = clean(value, 8);
  if (!MESSAGE_REACTION_SET.has(emoji)) throw err('Reaksiya noto‘g‘ri');
  return emoji;
}

function normalizeMessageReactions(raw = [], viewerId = null) {
  const viewerKey = viewerId ? String(viewerId) : '';
  return (Array.isArray(raw) ? raw : [])
    .map((item) => {
      const emoji = clean(item?.emoji, 8);
      if (!MESSAGE_REACTION_SET.has(emoji)) return null;
      const userIds = uniqIds(item?.userIds || []);
      const userKeys = userIds.map((id) => String(id));
      return {
        emoji,
        count: userKeys.length,
        reacted: viewerKey ? userKeys.includes(viewerKey) : false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}

function safeRegex(v) {
  return String(v || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function youtubeId(value) {
  const raw = clean(value, 600);
  if (!raw) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  let textValue = raw;
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'youtu.be') {
      textValue = parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(textValue) ? textValue : '';
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const direct = parsed.searchParams.get('v');
      if (direct && /^[a-zA-Z0-9_-]{11}$/.test(direct)) return direct;
      const parts = parsed.pathname.split('/').filter(Boolean);
      for (const i of [1, 2]) {
        const valuePart = parts[i];
        if (valuePart && /^[a-zA-Z0-9_-]{11}$/.test(valuePart) && ['embed', 'shorts', 'live'].includes(parts[0] || '')) {
          return valuePart;
        }
      }
    }
  } catch {}
  const fallback = raw.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return fallback ? fallback[1] : '';
}

function youtubeMeta(link) {
  const id = youtubeId(link);
  if (!id) {
    return {
      youtubeId: '',
      youtubeEmbedUrl: '',
      youtubeWatchUrl: '',
      youtubeThumbnail: '',
      hasYoutubeVideo: false,
    };
  }
  return {
    youtubeId: id,
    youtubeEmbedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&controls=1&iv_load_policy=3`,
    youtubeWatchUrl: `https://www.youtube.com/watch?v=${id}`,
    youtubeThumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    hasYoutubeVideo: true,
  };
}

function parseBody(req, max = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const a = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > max) {
        reject(err('Fayl juda katta', 413));
        req.destroy();
        return;
      }
      a.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(a).toString('utf8')));
    req.on('error', reject);
  });
}

async function body(req) {
  const raw = await parseBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw err('JSON noto‘g‘ri');
  }
}

async function auth(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw err('Kirish kerak', 401);
  const p = readToken(h.slice(7));
  if (!p || p.kind !== 'user') throw err('Sessiya tugagan', 401);
  const user = await users.findOne({ _id: oid(p.id) });
  if (!user) throw err('User topilmadi', 401);
  return user;
}

async function optionalAuth(req) {
  try {
    return await auth(req);
  } catch {
    return null;
  }
}

function adminHeader(req) {
  const direct = req.headers['x-admin-token'];
  if (direct) return String(direct);
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Admin ')) return authHeader.slice(6);
  return '';
}

async function adminAuth(req) {
  const payload = readToken(adminHeader(req));
  if (!payload || payload.kind !== 'admin' || payload.login !== ADMIN_LOGIN) throw err('Admin sessiya kerak', 401);
  return payload;
}

function isRole(user, ...roles) {
  return roles.includes(String(user?.role || '').toLowerCase());
}

function ensureRole(user, ...roles) {
  if (!isRole(user, ...roles)) throw err('Bu amal uchun ruxsat yo‘q', 403);
}

async function stats(id) {
  const [direct, group, sent] = await Promise.all([
    chats.countDocuments({ type: 'direct', members: id }),
    chats.countDocuments({ type: 'group', members: id }),
    messages.countDocuments({ senderId: id }),
  ]);
  return { direct, group, sent };
}

async function hydrateChats(list, viewerId) {
  const ids = new Set();
  for (const chat of list) {
    for (const m of chat.members || []) ids.add(String(m));
    if (chat.lastSenderId) ids.add(String(chat.lastSenderId));
  }
  const userDocs = ids.size ? await users.find({ _id: { $in: [...ids].map(oid).filter(Boolean) } }).toArray() : [];
  const map = new Map(userDocs.map((u) => [String(u._id), u]));
  return list.map((chat) => {
    const members = (chat.members || []).map((m) => map.get(String(m))).filter(Boolean);
    let name = chat.name || 'Chat';
    let avatar = chat.avatar || '';
    let subtitle = chat.description || '';
    let user = null;
    if (chat.type === 'direct') {
      if (!viewerId && members.length > 1) {
        name = members
          .slice(0, 2)
          .map((member) => member.fullName || member.username || 'User')
          .join(' & ');
        avatar = members[0]?.avatar || '';
        subtitle = 'Direct chat';
      } else {
        user = members.find((m) => String(m._id) !== String(viewerId)) || members[0] || null;
      }
      if (user) {
        name = user.fullName || user.username;
        avatar = user.avatar || '';
        subtitle = user.username ? '@' + user.username : user.phone || 'Shaxsiy chat';
      }
    }
    return {
      id: String(chat._id),
      type: chat.type,
      name,
      avatar,
      subtitle,
      description: chat.description || '',
      username: chat.username || '',
      updatedAt: chat.updatedAt || chat.createdAt,
      lastMessageAt: chat.lastMessageAt || chat.updatedAt || chat.createdAt,
      lastMessagePreview: chat.lastMessagePreview || 'Suhbatni boshlang',
      lastSenderName: chat.lastSenderId ? map.get(String(chat.lastSenderId))?.fullName || '' : '',
      members: members.map(pubUser),
      memberCount: members.length,
      user: pubUser(user),
      subject: chat.subject || '',
      coursePrice: roundAmount(chat.coursePrice || 0),
      teacherId: chat.teacherId ? String(chat.teacherId) : '',
      teacher: pubUser(map.get(String(chat.teacherId || ''))),
      groupAdminId: chat.groupAdminId ? String(chat.groupAdminId) : '',
    };
  });
}

async function hydrateMessages(list, viewerId = null) {
  const replyIds = uniqIds(list.map((m) => m.replyToId));
  const [replyDocs, userDocs] = await Promise.all([
    replyIds.length ? messages.find({ _id: { $in: replyIds } }).toArray() : [],
    (() => {
      const senderIds = uniqIds([
        ...list.map((m) => m.senderId),
        ...(replyIds.length ? [] : []),
      ]);
      return senderIds.length ? users.find({ _id: { $in: senderIds } }).toArray() : [];
    })(),
  ]);
  const replyMap = new Map(replyDocs.map((item) => [String(item._id), item]));
  const extraSenderIds = uniqIds(replyDocs.map((item) => item.senderId));
  const allUserIds = uniqIds([...(userDocs || []).map((item) => item._id), ...extraSenderIds]);
  const allUsersDocs = allUserIds.length ? await users.find({ _id: { $in: allUserIds } }).toArray() : [];
  const userMap = new Map(allUsersDocs.map((u) => [String(u._id), u]));

  return list.map((m) => {
    const reply = m.replyToId ? replyMap.get(String(m.replyToId)) : null;
    return {
      id: String(m._id),
      text: m.text || '',
      mediaUrl: m.mediaUrl || '',
      mediaType: m.mediaType || '',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt || m.createdAt,
      editedAt: m.editedAt || null,
      sender: pubUser(userMap.get(String(m.senderId))),
      replyToId: m.replyToId ? String(m.replyToId) : '',
      replyTo: reply
        ? {
            id: String(reply._id),
            text: clean(reply.text, 180),
            mediaUrl: reply.mediaUrl || '',
            sender: pubUser(userMap.get(String(reply.senderId))),
          }
        : null,
      reactions: normalizeMessageReactions(m.reactions || [], viewerId),
    };
  });
}

async function hydrateAdminMessages(list) {
  const senderIds = uniqIds(list.map((m) => m.senderId));
  const chatIds = uniqIds(list.map((m) => m.chatId));
  const [senderDocs, chatDocs] = await Promise.all([
    senderIds.length ? users.find({ _id: { $in: senderIds } }).toArray() : [],
    chatIds.length ? chats.find({ _id: { $in: chatIds } }).toArray() : [],
  ]);
  const senderMap = new Map(senderDocs.map((user) => [String(user._id), user]));
  const hydratedChats = await hydrateChats(chatDocs, null);
  const chatMap = new Map(hydratedChats.map((chat) => [String(chat.id), chat]));
  return list.map((message) => ({
    id: String(message._id),
    text: message.text || '',
    mediaUrl: message.mediaUrl || '',
    mediaType: message.mediaType || '',
    createdAt: message.createdAt,
    sender: pubUser(senderMap.get(String(message.senderId))),
    chatId: String(message.chatId),
    chatName: chatMap.get(String(message.chatId))?.name || 'Chat',
  }));
}

async function mustChat(chatId, userId) {
  const chat = await chats.findOne({ _id: chatId, members: userId });
  if (!chat) throw err('Chat sizniki emas', 403);
  return chat;
}

function dateKey(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw err('Sana noto‘g‘ri');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthKey(value) {
  const text = clean(value, 7);
  if (text) {
    const m = text.match(/^(\d{4})-(\d{2})$/);
    if (m) {
      const month = Number(m[2]);
      if (month >= 1 && month <= 12) return text;
      throw err('Oy noto‘g‘ri');
    }
  }
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw err('Oy noto‘g‘ri');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthStart(key, day = 1) {
  const [y, m] = monthKey(key).split('-').map(Number);
  return new Date(y, m - 1, Math.max(1, Math.min(28, Number(day) || 1)), 0, 0, 0, 0);
}

function startOfDay(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw err('Sana noto‘g‘ri');
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function dateValue(value, fallback = new Date(), label = 'Sana') {
  if (value === undefined || value === null || value === '') return new Date(fallback);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw err(`${label} noto‘g‘ri`);
  return d;
}

function amountValue(input, label = 'Summa', allowZero = false) {
  const n = Number(input);
  if (!Number.isFinite(n)) throw err(`${label} raqam bo‘lishi kerak`);
  const rounded = Math.round(n * 100) / 100;
  if (allowZero ? rounded < 0 : rounded <= 0) throw err(`${label} musbat bo‘lsin`);
  if (rounded > 1_000_000_000_000) throw err(`${label} juda katta`);
  return rounded;
}

function optionalAmount(input, label = 'Summa', fallback = 0) {
  if (input === undefined || input === null || input === '') return roundAmount(fallback);
  return amountValue(input, label, true);
}

function approvalStatus(value) {
  const key = clean(value, 20).toLowerCase();
  if (['approved', 'pending', 'rejected'].includes(key)) return key;
  return 'approved';
}

function approvalQuery(status = 'approved') {
  const target = approvalStatus(status);
  return target === 'approved'
    ? { $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] }
    : { approvalStatus: target };
}

function dueDay(value, fallback = 5) {
  const raw = value === undefined || value === null || value === '' ? fallback : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 28) throw err('To‘lov kuni 1 dan 28 gacha bo‘lsin');
  return n;
}

function roundAmount(value) {
  const n = Number(value || 0);
  return Math.round(n * 100) / 100;
}

function financeStatus(month, monthlyFee, paidAmount, dueDayValue, now = new Date()) {
  const key = monthKey(month);
  const fee = Math.max(0, roundAmount(monthlyFee));
  const paid = Math.max(0, roundAmount(paidAmount));
  const remaining = Math.max(0, roundAmount(fee - paid));
  const due = dueDay(dueDayValue || 5, 5);
  const dueAt = monthStart(key, due);
  const today = startOfDay(now);
  const diffMs = dueAt.getTime() - today.getTime();
  const dueInDays = Math.ceil(diffMs / 86400000);
  const overdueDays = dueInDays < 0 ? Math.abs(dueInDays) : 0;
  let status = 'unpaid';
  if (!fee) status = 'not_set';
  else if (!remaining) status = 'paid';
  else if (paid > 0) status = 'partial';

  const notices = [];
  const isCurrent = key === monthKey(now);
  if (isCurrent && remaining > 0) {
    if (dueInDays < 0) notices.push(`Oylik muddati o‘tgan. ${overdueDays} kun kechikkan, qolgan ${remaining} so‘mni to‘lang.`);
    else if (dueInDays <= 7) notices.push(`Oylik to‘lov muddati yaqin: ${dueInDays} kun qoldi. Qolgan summa: ${remaining} so‘m.`);
    if (status === 'partial') notices.push(`Qisman to‘langan. Qolgan ${remaining} so‘mni to‘liq yoping.`);
  }

  return {
    month: key,
    monthlyFee: fee,
    paid,
    remaining,
    dueDay: due,
    dueDate: dateKey(dueAt),
    dueInDays,
    overdueDays,
    status,
    notices,
    isCurrent,
    isDueSoon: remaining > 0 && dueInDays >= 0 && dueInDays <= 7,
    isOverdue: remaining > 0 && dueInDays < 0,
  };
}

async function mustCourseGroupForUser(chatId, user) {
  const chat = await mustChat(chatId, user._id);
  if (chat.type !== 'group') throw err('Faqat guruh uchun', 400);
  return chat;
}

async function readAttendanceForGroup(chat, options = {}) {
  const month = clean(options.month, 7);
  const limitRaw = Number(options.limit || 180);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(480, Math.trunc(limitRaw))) : 180;
  const query = {
    groupId: chat._id,
    ...(month ? { date: { $regex: '^' + safeRegex(month) } } : {}),
  };
  const docs = await attendance.find(query).sort({ date: -1, createdAt: -1 }).limit(limit).toArray();
  const userIds = new Set();
  for (const item of docs) {
    for (const rec of item.records || []) userIds.add(String(rec.studentId));
  }
  const studentDocs = userIds.size ? await users.find({ _id: { $in: [...userIds].map(oid).filter(Boolean) } }).toArray() : [];
  const studentMap = new Map(studentDocs.map((u) => [String(u._id), u]));
  return docs.map((item) => {
    const records = (item.records || []).map((row) => ({
        studentId: String(row.studentId),
        present: !!row.present,
        note: row.note || '',
        student: pubUser(studentMap.get(String(row.studentId))),
    }));
    return {
      id: String(item._id),
      groupId: String(item.groupId),
      date: item.date,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || item.createdAt,
      lessonTopic: item.lessonTopic || '',
      lessonNote: item.lessonNote || '',
      homework: item.homework || '',
      markedBy: String(item.markedBy),
      presentCount: records.filter((row) => row.present).length,
      absentCount: records.filter((row) => !row.present).length,
      records,
    };
  });
}

async function hydrateAttendanceRows(rows, viewerId = null) {
  const groupIds = uniqIds(rows.map((item) => item.groupId));
  const studentIds = uniqIds(rows.flatMap((item) => (item.records || []).map((row) => row.studentId)));
  const [groupDocs, studentDocs] = await Promise.all([
    groupIds.length ? chats.find({ _id: { $in: groupIds } }).toArray() : [],
    studentIds.length ? users.find({ _id: { $in: studentIds } }).toArray() : [],
  ]);
  const groupMap = new Map(groupDocs.map((group) => [String(group._id), group]));
  const studentMap = new Map(studentDocs.map((student) => [String(student._id), student]));
  return rows.map((item) => {
    const group = groupMap.get(String(item.groupId || ''));
    const records = (item.records || []).map((row) => {
      const studentId = String(row.studentId);
      return {
        studentId,
        present: !!row.present,
        note: row.note || '',
        student: pubUser(studentMap.get(studentId)),
      };
    });
    const own = viewerId ? records.find((row) => String(row.studentId) === String(viewerId)) : null;
    return {
      id: String(item._id),
      groupId: String(item.groupId),
      date: item.date,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || item.createdAt,
      lessonTopic: item.lessonTopic || '',
      lessonNote: item.lessonNote || '',
      homework: item.homework || '',
      markedBy: String(item.markedBy || ''),
      group: group
        ? {
            id: String(group._id),
            name: group.name || 'Guruh',
            subject: group.subject || '',
          }
        : null,
      presentCount: records.filter((row) => row.present).length,
      absentCount: records.filter((row) => !row.present).length,
      records,
      myStatus: own ? { present: !!own.present, note: own.note || '' } : null,
    };
  });
}

async function teacherFollowSnapshot(teacherIds, viewerId = null) {
  const normalizedTeacherIds = uniqIds(teacherIds || []);
  if (!normalizedTeacherIds.length) return { counts: new Map(), following: new Set() };
  const [followerDocs, myDocs] = await Promise.all([
    teacherFollowers.find({ teacherId: { $in: normalizedTeacherIds } }, { projection: { teacherId: 1 } }).toArray(),
    viewerId ? teacherFollowers.find({ teacherId: { $in: normalizedTeacherIds }, followerId: oid(viewerId) }, { projection: { teacherId: 1 } }).toArray() : [],
  ]);
  const counts = new Map();
  for (const row of followerDocs) {
    const key = String(row.teacherId || '');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const following = new Set(myDocs.map((row) => String(row.teacherId || '')));
  return { counts, following };
}

async function hydrateVideoLessons(list, viewerId = null) {
  const teacherIds = uniqIds(list.map((item) => item.teacherId));
  const videoIds = uniqIds(list.map((item) => item._id));
  const [teacherDocs, likeDocs, commentDocs, viewerLikeDocs] = await Promise.all([
    teacherIds.length ? users.find({ _id: { $in: teacherIds } }).toArray() : [],
    videoIds.length ? videoLessonLikes.find({ videoId: { $in: videoIds } }, { projection: { videoId: 1, userId: 1 } }).toArray() : [],
    videoIds.length ? videoLessonComments.find({ videoId: { $in: videoIds } }, { projection: { videoId: 1 } }).toArray() : [],
    viewerId && videoIds.length ? videoLessonLikes.find({ videoId: { $in: videoIds }, userId: oid(viewerId) }, { projection: { videoId: 1 } }).toArray() : [],
  ]);
  const teacherMap = new Map(teacherDocs.map((item) => [String(item._id), item]));
  const likesMap = new Map();
  for (const item of likeDocs) {
    const key = String(item.videoId || '');
    likesMap.set(key, (likesMap.get(key) || 0) + 1);
  }
  const commentsMap = new Map();
  for (const item of commentDocs) {
    const key = String(item.videoId || '');
    commentsMap.set(key, (commentsMap.get(key) || 0) + 1);
  }
  const likedSet = new Set(viewerLikeDocs.map((item) => String(item.videoId || '')));
  return list.map((item) => {
    const yt = youtubeMeta(item.link || item.youtubeWatchUrl || '');
    const id = String(item._id);
    return {
      id,
      teacherId: item.teacherId ? String(item.teacherId) : '',
      teacher: pubUser(teacherMap.get(String(item.teacherId || ''))),
      title: item.title || '',
      description: item.description || '',
      link: item.link || '',
      youtubeId: item.youtubeId || yt.youtubeId || '',
      youtubeEmbedUrl: item.youtubeEmbedUrl || yt.youtubeEmbedUrl || '',
      youtubeWatchUrl: item.youtubeWatchUrl || yt.youtubeWatchUrl || item.link || '',
      youtubeThumbnail: item.youtubeThumbnail || yt.youtubeThumbnail || '',
      hasYoutubeVideo: item.hasYoutubeVideo === false ? false : !!(item.youtubeId || yt.youtubeId),
      tags: asList(item.tags || [], 12, 30),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || item.createdAt,
      likesCount: likesMap.get(id) || 0,
      commentsCount: commentsMap.get(id) || 0,
      isLiked: likedSet.has(id),
      score: (likesMap.get(id) || 0) * 2 + (commentsMap.get(id) || 0),
    };
  });
}

async function hydrateVideoComments(list) {
  const userIds = uniqIds(list.map((item) => item.userId));
  const userDocs = userIds.length ? await users.find({ _id: { $in: userIds } }).toArray() : [];
  const userMap = new Map(userDocs.map((item) => [String(item._id), item]));
  return list.map((item) => ({
    id: String(item._id),
    videoId: String(item.videoId),
    userId: String(item.userId),
    text: item.text || '',
    createdAt: item.createdAt,
    user: pubUser(userMap.get(String(item.userId || ''))),
  }));
}

async function hydrateLiveSessions(list, viewerId = null) {
  const teacherIds = uniqIds(list.map((item) => item.teacherId));
  const sessionIds = uniqIds(list.map((item) => item._id));
  const participantIds = uniqIds(list.flatMap((item) => item.participants || []));
  const [teacherDocs, participantDocs, likeDocs, commentDocs, viewerLikeDocs] = await Promise.all([
    teacherIds.length ? users.find({ _id: { $in: teacherIds } }).toArray() : [],
    participantIds.length ? users.find({ _id: { $in: participantIds } }).toArray() : [],
    sessionIds.length ? liveSessionLikes.find({ sessionId: { $in: sessionIds } }, { projection: { sessionId: 1 } }).toArray() : [],
    sessionIds.length ? liveSessionComments.find({ sessionId: { $in: sessionIds } }, { projection: { sessionId: 1 } }).toArray() : [],
    viewerId && sessionIds.length ? liveSessionLikes.find({ sessionId: { $in: sessionIds }, userId: oid(viewerId) }, { projection: { sessionId: 1 } }).toArray() : [],
  ]);
  const teacherMap = new Map(teacherDocs.map((item) => [String(item._id), item]));
  const participantMap = new Map(participantDocs.map((item) => [String(item._id), item]));
  const likesMap = new Map();
  for (const item of likeDocs) {
    const key = String(item.sessionId || '');
    likesMap.set(key, (likesMap.get(key) || 0) + 1);
  }
  const commentsMap = new Map();
  for (const item of commentDocs) {
    const key = String(item.sessionId || '');
    commentsMap.set(key, (commentsMap.get(key) || 0) + 1);
  }
  const likedSet = new Set(viewerLikeDocs.map((item) => String(item.sessionId || '')));

  return list.map((item) => {
    const id = String(item._id);
    const teacher = teacherMap.get(String(item.teacherId || ''));
    const participants = (item.participants || [])
      .map((member) => participantMap.get(String(member)))
      .filter(Boolean)
      .map(pubUser);
    return {
      id,
      title: item.title || 'Jonli efir',
      description: item.description || '',
      thumbnail: item.thumbnail || '',
      active: !!item.active,
      startedAt: item.startedAt || item.createdAt,
      updatedAt: item.updatedAt || item.startedAt || item.createdAt,
      teacherId: item.teacherId ? String(item.teacherId) : '',
      teacher: pubUser(teacher),
      participants,
      participantCount: participants.length,
      likesCount: likesMap.get(id) || 0,
      commentsCount: commentsMap.get(id) || 0,
      isLiked: likedSet.has(id),
    };
  });
}

async function hydrateLiveComments(list) {
  const userIds = uniqIds(list.map((item) => item.userId));
  const docs = userIds.length ? await users.find({ _id: { $in: userIds } }).toArray() : [];
  const map = new Map(docs.map((item) => [String(item._id), item]));
  return list.map((item) => ({
    id: String(item._id),
    sessionId: String(item.sessionId),
    userId: String(item.userId),
    text: item.text || '',
    createdAt: item.createdAt,
    user: pubUser(map.get(String(item.userId || ''))),
  }));
}

async function buildLandingPayload(viewerId = null) {
  const site = await readSiteContent();
  const [teacherDocs, groupDocs, paymentDocs, videoDocs, liveDocs] = await Promise.all([
    users.find({ role: 'teacher', ...approvalQuery('approved') }).sort({ createdAt: -1 }).limit(240).toArray(),
    chats.find({ type: 'group' }).sort({ updatedAt: -1 }).limit(800).toArray(),
    studentPayments.find({}).sort({ paidAt: -1, createdAt: -1 }).limit(10000).toArray(),
    videoLessons.find({}).sort({ createdAt: -1 }).limit(40).toArray(),
    liveSessions.find({ active: true }).sort({ startedAt: -1, createdAt: -1 }).limit(20).toArray(),
  ]);
  const teacherIds = teacherDocs.map((item) => item._id);
  const followSnapshot = await teacherFollowSnapshot(teacherIds, viewerId);
  const groupsByTeacher = new Map();
  for (const group of groupDocs) {
    const key = String(group.teacherId || '');
    const list = groupsByTeacher.get(key) || [];
    list.push(group);
    groupsByTeacher.set(key, list);
  }

  const paymentsByGroup = new Map();
  for (const payment of paymentDocs) {
    const key = String(payment.groupId || '');
    if (!key) continue;
    const stats = paymentsByGroup.get(key) || { paidTotal: 0, paymentsCount: 0 };
    stats.paidTotal += Number(payment.amount || 0);
    stats.paymentsCount += 1;
    paymentsByGroup.set(key, stats);
  }

  const liveByTeacher = new Set(liveDocs.map((item) => String(item.teacherId || '')));
  const topTeachers = teacherDocs
    .map((teacher) => {
      const key = String(teacher._id);
      const teacherGroups = groupsByTeacher.get(key) || [];
      const studentCount = teacherGroups.reduce((acc, group) => {
        const memberCount = (group.members || []).filter((member) => String(member) !== key).length;
        return acc + memberCount;
      }, 0);
      return {
        ...pubUser(teacher),
        followerCount: followSnapshot.counts.get(key) || 0,
        studentCount,
        groupCount: teacherGroups.length,
        isLive: liveByTeacher.has(key),
        isFollowing: followSnapshot.following.has(key),
      };
    })
    .sort((a, b) => (b.followerCount - a.followerCount) || (b.studentCount - a.studentCount))
    .slice(0, 8);

  const courseStats = groupDocs
    .map((group) => {
      const key = String(group._id);
      const teacherId = String(group.teacherId || '');
      const memberCount = (group.members || []).filter((member) => String(member) !== teacherId).length;
      const paid = paymentsByGroup.get(key) || { paidTotal: 0, paymentsCount: 0 };
      return {
        id: key,
        name: group.name || 'Guruh',
        subject: group.subject || '',
        coursePrice: roundAmount(group.coursePrice || 0),
        teacherId,
        memberCount,
        paidTotal: roundAmount(paid.paidTotal),
        paymentsCount: paid.paymentsCount,
      };
    });

  const topCourses = [...courseStats]
    .sort((a, b) => (b.memberCount - a.memberCount) || (b.paidTotal - a.paidTotal))
    .slice(0, 10);

  const topCoursesByPayments = [...courseStats]
    .sort((a, b) => (b.paidTotal - a.paidTotal) || (b.memberCount - a.memberCount))
    .slice(0, 6);

  const hydratedVideos = await hydrateVideoLessons(videoDocs, viewerId);
  const featuredVideos = [...hydratedVideos]
    .sort((a, b) => (b.score - a.score) || (new Date(b.createdAt) - new Date(a.createdAt)))
    .slice(0, 8);

  const activeLives = (await hydrateLiveSessions(liveDocs, viewerId)).slice(0, 10);

  return {
    site,
    highlights: {
      topTeachers,
      topCourses,
      topCoursesByPayments,
      featuredVideos,
      activeLives,
      totals: {
        teachers: teacherDocs.length,
        groups: groupDocs.length,
        videos: hydratedVideos.length,
        live: activeLives.length,
      },
    },
  };
}

async function buildUserProfile(viewer, targetId) {
  const user = await users.findOne({ _id: targetId });
  if (!user) throw err('Foydalanuvchi topilmadi', 404);

  const isTeacherProfile = isRole(user, 'teacher');
  const [followerCount, followingCount, viewerFollowDoc] = await Promise.all([
    isTeacherProfile ? teacherFollowers.countDocuments({ teacherId: targetId }) : 0,
    teacherFollowers.countDocuments({ followerId: targetId }),
    isTeacherProfile && viewer?._id ? teacherFollowers.findOne({ teacherId: targetId, followerId: viewer._id }) : null,
  ]);

  const statsData = await stats(targetId);
  const groupDocs = await chats
    .find({
      type: 'group',
      ...(isRole(user, 'teacher') ? { $or: [{ teacherId: targetId }, { members: targetId }] } : { members: targetId }),
    })
    .sort({ updatedAt: -1 })
    .limit(24)
    .toArray();
  const groups = await hydrateChats(groupDocs, viewer?._id || targetId);

  let mentorTeacher = null;
  let students = [];
  let attendanceSummary = { total: 0, present: 0, absent: 0 };
  let attendanceFeed = [];
  let finance = null;

  if (user.mentorTeacherId) {
    mentorTeacher = pubUser(await users.findOne({ _id: user.mentorTeacherId }));
  }

  if (isRole(user, 'teacher')) {
    const studentDocs = await users.find({ mentorTeacherId: targetId }).sort({ fullName: 1 }).limit(24).toArray();
    students = studentDocs.map(pubUser);
    const groupIds = groupDocs.map((group) => group._id);
    const attendanceDocs = await attendance.find(groupIds.length ? { groupId: { $in: groupIds } } : { _id: null }).sort({ date: -1 }).limit(24).toArray();
    attendanceFeed = attendanceDocs.map((item) => ({
      id: String(item._id),
      date: item.date,
      groupId: String(item.groupId),
      presentCount: (item.records || []).filter((row) => row.present).length,
      absentCount: (item.records || []).filter((row) => !row.present).length,
    }));
    attendanceSummary = attendanceFeed.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.present += item.presentCount || 0;
        acc.absent += item.absentCount || 0;
        return acc;
      },
      { total: 0, present: 0, absent: 0 }
    );
  } else if (isRole(user, 'abituriyent')) {
    const attendanceDocs = await attendance.find({ 'records.studentId': targetId }).sort({ date: -1 }).limit(24).toArray();
    for (const item of attendanceDocs) {
      const own = (item.records || []).find((row) => String(row.studentId) === String(targetId));
      if (!own) continue;
      attendanceSummary.total += 1;
      if (own.present) attendanceSummary.present += 1;
      else attendanceSummary.absent += 1;
      attendanceFeed.push({
        id: String(item._id),
        date: item.date,
        groupId: String(item.groupId),
        present: !!own.present,
        note: own.note || '',
      });
    }
    finance = await readStudentFinanceStatus(targetId).catch(() => null);
  }

  return {
    user: pubUser(user),
    stats: statsData,
    groups,
    mentorTeacher,
    students,
    attendanceSummary,
    attendanceFeed,
    finance,
    social: {
      followerCount,
      followingCount,
      isFollowing: !!viewerFollowDoc,
      courseCount: isTeacherProfile ? groups.length : 0,
      studentCount: isTeacherProfile ? students.length : 0,
    },
    isSelf: String(viewer?._id || '') === String(targetId),
  };
}

function weekDay(value) {
  const day = Number(value);
  if (!Number.isInteger(day) || day < 0 || day > 6) throw err('Hafta kuni 0 dan 6 gacha bo‘lsin');
  return day;
}

function clock(value, label = 'Vaqt') {
  const textValue = clean(value, 5);
  if (!/^\d{2}:\d{2}$/.test(textValue)) throw err(`${label} HH:MM ko‘rinishida bo‘lsin`);
  const [hours, minutes] = textValue.split(':').map(Number);
  if (hours > 23 || minutes > 59) throw err(`${label} noto‘g‘ri`);
  return textValue;
}

function canManageGroupContent(chat, user) {
  return isRole(user, 'admin') || String(chat.teacherId || '') === String(user._id) || String(chat.groupAdminId || '') === String(user._id);
}

function defaultSiteContent() {
  return {
    brandName: 'Cliffs',
    brandTagline: "Cliffs o'quv markazi",
    heroTitle: 'Ingliz tili, rus tili va mobile dasturlash kurslari',
    heroSubtitle: "Yangi avlod o'quv markazi: tajribali ustozlar, real amaliyot va natijaga yo'naltirilgan darslar.",
    heroImage: '',
    logoUrl: '',
    faviconUrl: '',
    address: '',
    phone: '',
    telegram: '',
    email: '',
    workingHours: 'Dushanba - Shanba, 09:00 - 20:00',
    heroPrimaryCta: "Ro'yxatdan o'tish",
    heroSecondaryCta: 'Kurslar',
    footerTitle: "Cliffs o'quv markazi",
    footerDescription: "Sifatli ta'lim va zamonaviy o'quv jarayoni.",
    footerCopyright: '© 2026 Cliffs. Barcha huquqlar himoyalangan.',
    courses: ['Ingliz tili', 'Rus tili', 'Mobile dasturlash', 'Matematika', 'IELTS tayyorlov'],
    gallery: [],
  };
}

function asList(input, max = 20, itemLimit = 180) {
  const raw = Array.isArray(input) ? input : String(input || '').split(/\r?\n|,/);
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const text = clean(item, itemLimit);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

function normalizeSiteContent(input = {}, base = defaultSiteContent()) {
  const merged = {
    ...base,
    ...input,
  };
  return {
    brandName: clean(merged.brandName, 60) || base.brandName,
    brandTagline: clean(merged.brandTagline, 120) || base.brandTagline,
    heroTitle: clean(merged.heroTitle, 160) || base.heroTitle,
    heroSubtitle: clean(merged.heroSubtitle, 600) || base.heroSubtitle,
    heroImage: clean(merged.heroImage, 500),
    logoUrl: clean(merged.logoUrl, 500),
    faviconUrl: clean(merged.faviconUrl, 500),
    address: clean(merged.address, 240),
    phone: clean(merged.phone, 80),
    telegram: clean(merged.telegram, 120),
    email: clean(merged.email, 120),
    workingHours: clean(merged.workingHours, 120),
    heroPrimaryCta: clean(merged.heroPrimaryCta, 50) || base.heroPrimaryCta,
    heroSecondaryCta: clean(merged.heroSecondaryCta, 50) || base.heroSecondaryCta,
    footerTitle: clean(merged.footerTitle, 90) || base.footerTitle,
    footerDescription: clean(merged.footerDescription, 280) || base.footerDescription,
    footerCopyright: clean(merged.footerCopyright, 180) || base.footerCopyright,
    courses: asList(merged.courses, 12, 90),
    gallery: asList(merged.gallery, 24, 500),
  };
}

async function readSiteContent() {
  let doc = await siteContent.findOne({ _id: SITE_CONTENT_KEY });
  if (!doc) {
    const now = new Date();
    doc = { _id: SITE_CONTENT_KEY, ...defaultSiteContent(), createdAt: now, updatedAt: now };
    await siteContent.insertOne(doc);
  }
  const normalized = normalizeSiteContent(doc);
  return {
    ...normalized,
    updatedAt: doc.updatedAt || doc.createdAt || null,
  };
}

async function listGroupDocsForUser(user, limit = 24) {
  return chats.find({ type: 'group', members: user._id }).sort({ updatedAt: -1 }).limit(limit).toArray();
}

async function hydrateAnnouncements(list) {
  const groupIds = uniqIds(list.map((item) => item.groupId));
  const groupDocs = groupIds.length ? await chats.find({ _id: { $in: groupIds } }).toArray() : [];
  const groupMap = new Map(groupDocs.map((group) => [String(group._id), group]));
  return list.map((item) => {
    const group = groupMap.get(String(item.groupId || ''));
    return {
      id: String(item._id),
      title: item.title || '',
      body: item.body || '',
      pinned: !!item.pinned,
      createdAt: item.createdAt,
      authorName: item.createdByName || 'Admin',
      authorRole: item.createdByRole || 'admin',
      group: group
        ? {
            id: String(group._id),
            name: group.name || 'Guruh',
            subject: group.subject || '',
          }
        : null,
    };
  });
}

async function hydrateSchedules(list) {
  const groupIds = uniqIds(list.map((item) => item.groupId));
  const groupDocs = groupIds.length ? await chats.find({ _id: { $in: groupIds } }).toArray() : [];
  const groupMap = new Map(groupDocs.map((group) => [String(group._id), group]));
  return list.map((item) => {
    const group = groupMap.get(String(item.groupId || ''));
    return {
      id: String(item._id),
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      room: item.room || '',
      note: item.note || '',
      createdAt: item.createdAt,
      group: group
        ? {
            id: String(group._id),
            name: group.name || 'Guruh',
            subject: group.subject || '',
            teacherId: group.teacherId ? String(group.teacherId) : '',
          }
        : null,
    };
  });
}

async function hydrateMaterials(list) {
  const groupIds = uniqIds(list.map((item) => item.groupId));
  const groupDocs = groupIds.length ? await chats.find({ _id: { $in: groupIds } }).toArray() : [];
  const groupMap = new Map(groupDocs.map((group) => [String(group._id), group]));
  return list.map((item) => {
    const group = groupMap.get(String(item.groupId || ''));
    const yt = youtubeMeta(item.link || '');
    return {
      id: String(item._id),
      type: item.type || 'material',
      title: item.title || '',
      description: item.description || '',
      link: item.link || '',
      youtubeId: yt.youtubeId,
      youtubeEmbedUrl: yt.youtubeEmbedUrl,
      youtubeWatchUrl: yt.youtubeWatchUrl,
      youtubeThumbnail: yt.youtubeThumbnail,
      hasYoutubeVideo: yt.hasYoutubeVideo,
      dueDate: item.dueDate || '',
      createdAt: item.createdAt,
      authorName: item.createdByName || 'Admin',
      authorRole: item.createdByRole || 'admin',
      group: group
        ? {
            id: String(group._id),
            name: group.name || 'Guruh',
            subject: group.subject || '',
          }
        : null,
    };
  });
}

async function hydrateMaterialSubmissions(list) {
  const studentIds = uniqIds(list.map((item) => item.studentId));
  const docs = studentIds.length ? await users.find({ _id: { $in: studentIds } }).toArray() : [];
  const map = new Map(docs.map((user) => [String(user._id), user]));
  return list.map((item) => ({
    id: String(item._id),
    materialId: String(item.materialId),
    studentId: String(item.studentId),
    text: item.text || '',
    link: item.link || '',
    attachmentUrl: item.attachmentUrl || '',
    status: item.status || 'submitted',
    score: Number.isFinite(Number(item.score)) ? Number(item.score) : null,
    teacherNote: item.teacherNote || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || item.createdAt,
    student: pubUser(map.get(String(item.studentId))),
  }));
}

async function readStudentFinanceStatus(studentId, month = monthKey(new Date())) {
  const targetId = oid(studentId);
  if (!targetId) throw err('Student ID noto‘g‘ri');
  const key = monthKey(month);
  const [studentDoc, planDoc, monthPayments, recentPayments] = await Promise.all([
    users.findOne({ _id: targetId }),
    tuitionPlans.findOne({ studentId: targetId }),
    studentPayments.find({ studentId: targetId, month: key }).sort({ paidAt: -1, createdAt: -1 }).limit(240).toArray(),
    studentPayments.find({ studentId: targetId }).sort({ paidAt: -1, createdAt: -1 }).limit(20).toArray(),
  ]);
  if (!studentDoc) throw err('Talaba topilmadi', 404);
  const isActive = planDoc ? planDoc.active !== false : false;
  const monthlyFee = isActive ? Number(planDoc?.monthlyFee || 0) : 0;
  const dueDayValue = Number(planDoc?.dueDay || 5);
  const paidAmount = monthPayments.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const status = financeStatus(key, monthlyFee, paidAmount, dueDayValue);
  return {
    student: pubUser(studentDoc),
    plan: {
      active: isActive,
      monthlyFee: status.monthlyFee,
      dueDay: status.dueDay,
      groupId: planDoc?.groupId ? String(planDoc.groupId) : '',
      note: planDoc?.note || '',
      updatedAt: planDoc?.updatedAt || planDoc?.createdAt || null,
    },
    ...status,
    recentPayments: recentPayments.map((item) => ({
      id: String(item._id),
      month: item.month,
      amount: roundAmount(item.amount),
      method: item.method || 'cash',
      note: item.note || '',
      paidAt: item.paidAt || item.createdAt,
      createdAt: item.createdAt,
    })),
  };
}

async function readFinanceOverview(month = monthKey(new Date())) {
  const key = monthKey(month);
  const [plans, paymentDocs, salaryDocs, expenseDocs] = await Promise.all([
    tuitionPlans.find({}).sort({ updatedAt: -1 }).limit(4000).toArray(),
    studentPayments.find({ month: key }).sort({ paidAt: -1, createdAt: -1 }).limit(5000).toArray(),
    teacherPayrolls.find({ month: key }).sort({ paidAt: -1, createdAt: -1 }).limit(2000).toArray(),
    financeExpenses.find({ month: key }).sort({ spentAt: -1, createdAt: -1 }).limit(2000).toArray(),
  ]);

  const studentIds = uniqIds(plans.map((item) => item.studentId));
  const groupIds = uniqIds(plans.map((item) => item.groupId));
  const teacherIds = uniqIds(salaryDocs.map((item) => item.teacherId));
  const paymentStudentIds = uniqIds(paymentDocs.map((item) => item.studentId));
  const paymentGroupIds = uniqIds(paymentDocs.map((item) => item.groupId));

  const [studentDocs, teacherDocs, groupDocs] = await Promise.all([
    studentIds.length || paymentStudentIds.length ? users.find({ _id: { $in: uniqIds([...studentIds, ...paymentStudentIds]) } }).toArray() : [],
    teacherIds.length ? users.find({ _id: { $in: teacherIds } }).toArray() : [],
    groupIds.length || paymentGroupIds.length ? chats.find({ _id: { $in: uniqIds([...groupIds, ...paymentGroupIds]) } }).toArray() : [],
  ]);

  const studentMap = new Map(studentDocs.map((item) => [String(item._id), item]));
  const teacherMap = new Map(teacherDocs.map((item) => [String(item._id), item]));
  const groupMap = new Map(groupDocs.map((item) => [String(item._id), item]));
  const paidByStudent = new Map();
  for (const item of paymentDocs) {
    const keyId = String(item.studentId);
    paidByStudent.set(keyId, roundAmount((paidByStudent.get(keyId) || 0) + Number(item.amount || 0)));
  }

  const studentPlans = plans
    .filter((item) => item.studentId)
    .map((item) => {
      const studentId = String(item.studentId);
      const monthlyFee = Number(item.monthlyFee || 0);
      const paid = Number(paidByStudent.get(studentId) || 0);
      const status = financeStatus(key, monthlyFee, paid, Number(item.dueDay || 5));
      const student = studentMap.get(studentId);
      const group = groupMap.get(String(item.groupId || ''));
      return {
        id: String(item._id),
        studentId,
        monthlyFee: status.monthlyFee,
        dueDay: status.dueDay,
        groupId: item.groupId ? String(item.groupId) : '',
        note: item.note || '',
        active: item.active !== false,
        updatedAt: item.updatedAt || item.createdAt,
        student: student ? pubUser(student) : null,
        group: group
          ? {
              id: String(group._id),
              name: group.name || 'Guruh',
              subject: group.subject || '',
            }
          : null,
        ...status,
      };
    })
    .sort((a, b) => String(a.student?.fullName || '').localeCompare(String(b.student?.fullName || '')));

  const activePlans = studentPlans.filter((item) => item.active && item.monthlyFee > 0);
  const expectedIncome = roundAmount(activePlans.reduce((acc, item) => acc + Number(item.monthlyFee || 0), 0));
  const collectedIncome = roundAmount(paymentDocs.reduce((acc, item) => acc + Number(item.amount || 0), 0));
  const receivable = roundAmount(activePlans.reduce((acc, item) => acc + Number(item.remaining || 0), 0));
  const salaryTotal = roundAmount(salaryDocs.reduce((acc, item) => acc + Number(item.amount || 0), 0));
  const expenseTotal = roundAmount(expenseDocs.reduce((acc, item) => acc + Number(item.amount || 0), 0));
  const ownerNet = roundAmount(collectedIncome - salaryTotal - expenseTotal);

  return {
    month: key,
    summary: {
      expectedIncome,
      collectedIncome,
      receivable,
      salaryTotal,
      expenseTotal,
      ownerNet,
    },
    counts: {
      activePlans: activePlans.length,
      paid: activePlans.filter((item) => item.status === 'paid').length,
      partial: activePlans.filter((item) => item.status === 'partial').length,
      unpaid: activePlans.filter((item) => item.status === 'unpaid').length,
      dueSoon: activePlans.filter((item) => item.isDueSoon).length,
      overdue: activePlans.filter((item) => item.isOverdue).length,
      payments: paymentDocs.length,
      salaries: salaryDocs.length,
      expenses: expenseDocs.length,
    },
    studentPlans,
    paymentEntries: paymentDocs.map((item) => {
      const student = studentMap.get(String(item.studentId || ''));
      const group = groupMap.get(String(item.groupId || ''));
      return {
        id: String(item._id),
        studentId: item.studentId ? String(item.studentId) : '',
        groupId: item.groupId ? String(item.groupId) : '',
        month: item.month,
        amount: roundAmount(item.amount),
        method: item.method || 'cash',
        note: item.note || '',
        paidAt: item.paidAt || item.createdAt,
        createdAt: item.createdAt,
        student: student ? pubUser(student) : null,
        group: group
          ? {
              id: String(group._id),
              name: group.name || 'Guruh',
              subject: group.subject || '',
            }
          : null,
      };
    }),
    salaryEntries: salaryDocs.map((item) => ({
      id: String(item._id),
      teacherId: item.teacherId ? String(item.teacherId) : '',
      month: item.month,
      amount: roundAmount(item.amount),
      note: item.note || '',
      paidAt: item.paidAt || item.createdAt,
      createdAt: item.createdAt,
      teacher: pubUser(teacherMap.get(String(item.teacherId || ''))),
    })),
    expenseEntries: expenseDocs.map((item) => ({
      id: String(item._id),
      month: item.month,
      title: item.title || '',
      category: item.category || 'boshqa',
      amount: roundAmount(item.amount),
      note: item.note || '',
      spentAt: item.spentAt || item.createdAt,
      createdAt: item.createdAt,
    })),
  };
}

async function mustMaterialForUser(materialId, user) {
  const material = await materials.findOne({ _id: materialId });
  if (!material) throw err('Material topilmadi', 404);
  let group;
  if (isRole(user, 'admin')) {
    group = await chats.findOne({ _id: material.groupId, type: 'group' });
    if (!group) throw err('Material guruhi topilmadi', 404);
  } else {
    group = await mustCourseGroupForUser(material.groupId, user);
  }
  return { material, group };
}

async function buildDashboard(user) {
  const finance = isRole(user, 'abituriyent') ? await readStudentFinanceStatus(user._id).catch(() => null) : null;
  const [groupDocs, directDocs] = await Promise.all([
    listGroupDocsForUser(user, 16),
    chats.find({ type: 'direct', members: user._id }).sort({ updatedAt: -1 }).limit(6).toArray(),
  ]);
  const groupIds = groupDocs.map((group) => group._id);
  const today = new Date();
  const todayKey = dateKey(today);
  const todayDay = today.getDay();

  const [groupList, recentChats, newsDocs, scheduleDocs, materialDocs, attendanceDocs] = await Promise.all([
    hydrateChats(groupDocs, user._id),
    hydrateChats(directDocs, user._id),
    announcements
      .find(groupIds.length ? { $or: [{ groupId: null }, { groupId: { $in: groupIds } }] } : { groupId: null })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(8)
      .toArray(),
    schedules
      .find(groupIds.length ? { groupId: { $in: groupIds }, dayOfWeek: todayDay } : { _id: null })
      .sort({ startTime: 1 })
      .limit(12)
      .toArray(),
    materials
      .find(groupIds.length ? { groupId: { $in: groupIds } } : { _id: null })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
    attendance
      .find(groupIds.length ? { groupId: { $in: groupIds }, date: todayKey } : { _id: null })
      .sort({ date: -1 })
      .limit(12)
      .toArray(),
  ]);

  const attendanceMap = new Map(attendanceDocs.map((item) => [String(item.groupId), item]));

  return {
    groups: groupList.map((group) => ({
      ...group,
      todayAttendanceTaken: attendanceMap.has(String(group.id)),
    })),
    recentChats,
    announcements: await hydrateAnnouncements(newsDocs),
    todaySchedule: await hydrateSchedules(scheduleDocs),
    materials: await hydrateMaterials(materialDocs),
    today: todayKey,
    finance,
  };
}

function signCloud(params) {
  return crypto
    .createHash('sha1')
    .update(
      Object.keys(params)
        .filter((k) => params[k] !== '' && params[k] !== undefined && params[k] !== null)
        .sort()
        .map((k) => k + '=' + params[k])
        .join('&') + CLOUD_SECRET
    )
    .digest('hex');
}

async function uploadImage(dataUrl, folder) {
  if (!String(dataUrl || '').startsWith('data:image/')) throw err('Faqat rasm yuklash mumkin');
  if (!CLOUD_NAME) throw err('Cloudinary sozlanmagan', 500);
  const f = 'pulsechat/' + clean(folder || 'misc', 24);
  const form = new URLSearchParams();
  form.set('file', dataUrl);
  form.set('folder', f);
  if (CLOUD_PRESET && !CLOUD_SECRET) {
    form.set('upload_preset', CLOUD_PRESET);
  } else {
    if (!CLOUD_KEY || !CLOUD_SECRET) throw err('Cloudinary kalitlari yo‘q', 500);
    const ts = Math.floor(Date.now() / 1000);
    form.set('timestamp', String(ts));
    form.set('api_key', CLOUD_KEY);
    form.set('signature', signCloud({ folder: f, timestamp: ts }));
  }
  const r = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`, { method: 'POST', body: form });
  const d = await r.json();
  if (!r.ok) throw err(d.error?.message || 'Cloudinary xatolik', 500);
  return { url: d.secure_url, publicId: d.public_id };
}

function iceServers() {
  const list = [];
  if (!HALLAYM_DISABLE_PUBLIC_TURN && HALLAYM_STUN_URLS.length) list.push({ urls: HALLAYM_STUN_URLS });
  if (HALLAYM_TURN_URLS.length) {
    list.push({
      urls: HALLAYM_TURN_URLS,
      username: HALLAYM_TURN_USERNAME,
      credential: HALLAYM_TURN_PASSWORD,
    });
  }
  return list;
}

async function syncChatMeta(chatId) {
  const chat = await chats.findOne({ _id: chatId });
  if (!chat) return;
  const latest = await messages.find({ chatId }).sort({ createdAt: -1 }).limit(1).toArray();
  const payload = latest[0];
  await chats.updateOne(
    { _id: chatId },
    {
      $set: payload
        ? {
            updatedAt: payload.createdAt,
            lastMessageAt: payload.createdAt,
            lastMessagePreview: preview(payload),
            lastSenderId: payload.senderId,
          }
        : {
            updatedAt: chat.updatedAt || new Date(),
            lastMessageAt: chat.createdAt || new Date(),
            lastMessagePreview: chat.type === 'group' ? 'Guruh yaratildi' : 'Suhbatni boshlang',
            lastSenderId: chat.createdBy || chat.members?.[0] || null,
          },
    }
  );
}

async function deleteCallCascade(callId) {
  await signals.deleteMany({ callId });
  await calls.deleteOne({ _id: callId });
}

async function deleteChatCascade(chatId) {
  const callDocs = await calls.find({ chatId }).toArray();
  for (const call of callDocs) {
    await deleteCallCascade(call._id);
  }
  const groupMaterials = await materials.find({ groupId: chatId }, { projection: { _id: 1 } }).toArray();
  const materialIds = groupMaterials.map((item) => item._id);
  if (materialIds.length) {
    await materialSubmissions.deleteMany({ materialId: { $in: materialIds } });
  }
  await messages.deleteMany({ chatId });
  await attendance.deleteMany({ groupId: chatId });
  await announcements.deleteMany({ groupId: chatId });
  await schedules.deleteMany({ groupId: chatId });
  await materials.deleteMany({ groupId: chatId });
  await groupJoinRequests.deleteMany({ groupId: chatId });
  await chats.deleteOne({ _id: chatId });
}

async function deleteUserCascade(userId) {
  const relatedChats = await chats.find({ members: userId }).toArray();
  const ownedVideoDocs = await videoLessons.find({ teacherId: userId }, { projection: { _id: 1 } }).toArray();
  const ownedVideoIds = ownedVideoDocs.map((item) => item._id);
  const ownedLiveDocs = await liveSessions.find({ teacherId: userId }, { projection: { _id: 1 } }).toArray();
  const ownedLiveIds = ownedLiveDocs.map((item) => item._id);
  await messages.deleteMany({ senderId: userId });
  await materialSubmissions.deleteMany({ studentId: userId });
  await tuitionPlans.deleteOne({ studentId: userId });
  await studentPayments.deleteMany({ studentId: userId });
  await teacherPayrolls.deleteMany({ teacherId: userId });
  await teacherFollowers.deleteMany({ $or: [{ teacherId: userId }, { followerId: userId }] });
  await groupJoinRequests.deleteMany({ $or: [{ userId }, { teacherId: userId }, { processedBy: userId }] });
  if (ownedVideoIds.length) {
    await videoLessonLikes.deleteMany({ videoId: { $in: ownedVideoIds } });
    await videoLessonComments.deleteMany({ videoId: { $in: ownedVideoIds } });
    await videoLessons.deleteMany({ _id: { $in: ownedVideoIds } });
  }
  await videoLessonLikes.deleteMany({ userId });
  await videoLessonComments.deleteMany({ userId });
  if (ownedLiveIds.length) {
    await liveSignals.deleteMany({ sessionId: { $in: ownedLiveIds } });
    await liveSessionLikes.deleteMany({ sessionId: { $in: ownedLiveIds } });
    await liveSessionComments.deleteMany({ sessionId: { $in: ownedLiveIds } });
    await liveSessions.deleteMany({ _id: { $in: ownedLiveIds } });
  }
  await liveSessions.updateMany({ participants: userId }, { $pull: { participants: userId }, $set: { updatedAt: new Date() } });
  await liveSignals.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] });
  await liveSessionLikes.deleteMany({ userId });
  await liveSessionComments.deleteMany({ userId });
  for (const chat of relatedChats) {
    if (chat.type === 'direct' || (chat.members || []).length <= 2) {
      await deleteChatCascade(chat._id);
      continue;
    }
    await chats.updateOne(
      { _id: chat._id },
      {
        $pull: { members: userId },
        $set: { updatedAt: new Date() },
      }
    );
    await syncChatMeta(chat._id);
  }
  await calls.updateMany({ participants: userId }, { $pull: { participants: userId } });
  await users.deleteOne({ _id: userId });
}

async function hydrateCall(call) {
  if (!call) return null;
  const participantIds = uniqIds(call.participants || []);
  const participantDocs = participantIds.length ? await users.find({ _id: { $in: participantIds } }).toArray() : [];
  return {
    id: String(call._id),
    chatId: String(call.chatId),
    active: !!call.active,
    startedAt: call.startedAt,
    createdBy: String(call.createdBy),
    participants: participantDocs.map(pubUser),
  };
}

async function mustCall(callId, userId) {
  const call = await calls.findOne({ _id: callId, active: true });
  if (!call) throw err('Videochat topilmadi', 404);
  await mustChat(call.chatId, userId);
  return call;
}

async function initDb() {
  await mongo.connect();
  const db = mongo.db(DB_NAME);
  users = db.collection('users');
  chats = db.collection('chats');
  messages = db.collection('messages');
  calls = db.collection('calls');
  signals = db.collection('signals');
  attendance = db.collection('attendance');
  announcements = db.collection('announcements');
  schedules = db.collection('schedules');
  materials = db.collection('materials');
  materialSubmissions = db.collection('materialSubmissions');
  tuitionPlans = db.collection('tuitionPlans');
  studentPayments = db.collection('studentPayments');
  teacherPayrolls = db.collection('teacherPayrolls');
  financeExpenses = db.collection('financeExpenses');
  siteContent = db.collection('siteContent');
  teacherFollowers = db.collection('teacherFollowers');
  groupJoinRequests = db.collection('groupJoinRequests');
  videoLessons = db.collection('videoLessons');
  videoLessonLikes = db.collection('videoLessonLikes');
  videoLessonComments = db.collection('videoLessonComments');
  liveSessions = db.collection('liveSessions');
  liveSignals = db.collection('liveSignals');
  liveSessionLikes = db.collection('liveSessionLikes');
  liveSessionComments = db.collection('liveSessionComments');
  await Promise.all([
    users.createIndex({ username: 1 }, { unique: true }),
    users.createIndex({ phone: 1 }, { unique: true, sparse: true }),
    users.createIndex({ approvalStatus: 1, createdAt: -1 }),
    chats.createIndex({ members: 1, updatedAt: -1 }),
    chats.createIndex({ type: 1, updatedAt: -1 }),
    messages.createIndex({ chatId: 1, createdAt: -1 }),
    calls.createIndex({ chatId: 1, active: 1 }),
    signals.createIndex({ callId: 1, toUserId: 1, createdAt: 1 }),
    attendance.createIndex({ groupId: 1, date: -1 }),
    attendance.createIndex({ groupId: 1, date: 1 }, { unique: true }),
    announcements.createIndex({ groupId: 1, createdAt: -1 }),
    announcements.createIndex({ createdAt: -1 }),
    schedules.createIndex({ groupId: 1, dayOfWeek: 1, startTime: 1 }),
    materials.createIndex({ groupId: 1, createdAt: -1 }),
    materialSubmissions.createIndex({ materialId: 1, studentId: 1 }, { unique: true }),
    materialSubmissions.createIndex({ studentId: 1, createdAt: -1 }),
    tuitionPlans.createIndex({ studentId: 1 }, { unique: true }),
    tuitionPlans.createIndex({ active: 1, updatedAt: -1 }),
    studentPayments.createIndex({ studentId: 1, month: 1, paidAt: -1 }),
    studentPayments.createIndex({ month: 1, paidAt: -1 }),
    teacherPayrolls.createIndex({ teacherId: 1, month: 1, paidAt: -1 }),
    teacherPayrolls.createIndex({ month: 1, paidAt: -1 }),
    financeExpenses.createIndex({ month: 1, spentAt: -1 }),
    siteContent.createIndex({ updatedAt: -1 }),
    teacherFollowers.createIndex({ teacherId: 1, followerId: 1 }, { unique: true }),
    teacherFollowers.createIndex({ followerId: 1, createdAt: -1 }),
    groupJoinRequests.createIndex({ status: 1, createdAt: -1 }),
    groupJoinRequests.createIndex({ userId: 1, status: 1, createdAt: -1 }),
    groupJoinRequests.createIndex({ groupId: 1, status: 1, createdAt: -1 }),
    videoLessons.createIndex({ teacherId: 1, createdAt: -1 }),
    videoLessons.createIndex({ createdAt: -1 }),
    videoLessonLikes.createIndex({ videoId: 1, userId: 1 }, { unique: true }),
    videoLessonLikes.createIndex({ userId: 1, createdAt: -1 }),
    videoLessonComments.createIndex({ videoId: 1, createdAt: -1 }),
    liveSessions.createIndex({ active: 1, startedAt: -1 }),
    liveSessions.createIndex({ teacherId: 1, active: 1, startedAt: -1 }),
    liveSignals.createIndex({ sessionId: 1, toUserId: 1, createdAt: 1 }),
    liveSessionLikes.createIndex({ sessionId: 1, userId: 1 }, { unique: true }),
    liveSessionComments.createIndex({ sessionId: 1, createdAt: -1 }),
  ]);
}

async function api(req, res, url) {
  if (req.method === 'POST' && url.pathname === '/api/login') {
    const b = await body(req);
    const key = clean(b.identifier, 60);
    const tel = phone(key);
    const user = username(key);
    const doc = await users.findOne({ $or: [{ username: user }, ...(tel ? [{ phone: tel }] : [])] });
    if (!doc || !check(String(b.password || ''), doc.passwordHash)) throw err('Login yoki parol xato', 401);
    const status = approvalStatus(doc.approvalStatus);
    if (status === 'pending') throw err('Akkaunt admin tasdig‘ini kutmoqda', 403);
    if (status === 'rejected') throw err('Ro‘yxatdan o‘tish so‘rovi rad etilgan. Admin bilan bog‘laning', 403);
    return json(res, 200, { token: token(doc._id), user: pubUser(doc), stats: await stats(doc._id) });
  }

  if (req.method === 'POST' && url.pathname === '/api/register') {
    const b = await body(req);
    const fullName = clean(b.fullName, 40);
    const user = username(b.username);
    const tel = phone(b.phone);
    const pass = String(b.password || '');
    if (fullName.length < 2) throw err('Ism kamida 2 ta harf bo‘lsin');
    if (user.length < 3) throw err('Username kamida 3 ta harf bo‘lsin');
    if (pass.length < 6) throw err('Parol kamida 6 ta bo‘lsin');
    if (tel.length < 7) throw err('Telefon raqamini kiriting');
    const exists = await users.findOne({ $or: [{ username: user }, { phone: tel }] });
    if (exists) throw err('Username yoki telefon band', 409);
    const now = new Date();
    await users.insertOne({
      fullName,
      username: user,
      phone: tel,
      passwordHash: hash(pass),
      bio: clean(b.bio, 160),
      avatar: '',
      role: 'abituriyent',
      approvalStatus: 'pending',
      mentorTeacherId: null,
      studyGroupIds: [],
      createdAt: now,
      updatedAt: now,
      approvedAt: null,
      rejectedAt: null,
    });
    return json(res, 201, { ok: true, message: 'So‘rov yuborildi. Admin tasdiqlagach tizimga kira olasiz.' });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/login') {
    const b = await body(req);
    const login = clean(b.login, 80);
    const password = String(b.password || '');
    if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) throw err('Admin login yoki parol xato', 401);
    return json(res, 200, { token: adminToken(), admin: { login: ADMIN_LOGIN } });
  }

  if (req.method === 'GET' && url.pathname === '/api/public/site-content') {
    return json(res, 200, { site: await readSiteContent() });
  }

  if (req.method === 'GET' && url.pathname === '/api/public/payment-config') {
    return json(res, 200, {
      payment: {
        adminCard: ADMIN_PAYMENT_CARD,
        owner: ADMIN_PAYMENT_OWNER,
        adminCommissionPercent: ADMIN_COMMISSION_PERCENT,
        note: `${ADMIN_COMMISSION_PERCENT}% admin ulushi eslatmasi`,
      },
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/public/landing') {
    const viewer = await optionalAuth(req);
    return json(res, 200, await buildLandingPayload(viewer?._id || null));
  }

  if (req.method === 'GET' && url.pathname === '/api/public/teachers') {
    const viewer = await optionalAuth(req);
    const q = clean(url.searchParams.get('q'), 60);
    const rx = q ? new RegExp(safeRegex(q), 'i') : null;
    const teacherDocs = await users
      .find({
        $and: [
          { role: 'teacher' },
          approvalQuery('approved'),
          ...(rx ? [{ $or: [{ fullName: rx }, { username: rx }, { bio: rx }, { phone: rx }] }] : []),
        ],
      })
      .sort({ createdAt: -1 })
      .limit(120)
      .toArray();
    const teacherIds = teacherDocs.map((item) => item._id);
    const [groupsByTeacher, followSnapshot] = await Promise.all([
      teacherIds.length ? chats.find({ type: 'group', teacherId: { $in: teacherIds } }).toArray() : [],
      teacherFollowSnapshot(teacherIds, viewer?._id || null),
    ]);
    const groupsMap = new Map();
    for (const group of groupsByTeacher) {
      const key = String(group.teacherId || '');
      const list = groupsMap.get(key) || [];
      list.push(group);
      groupsMap.set(key, list);
    }
    const teachers = teacherDocs.map((teacher) => {
      const teacherKey = String(teacher._id);
      const courses = (groupsMap.get(teacherKey) || []).map((group) => group.subject || group.name || '').filter(Boolean).slice(0, 6);
      return {
        ...pubUser(teacher),
        followerCount: followSnapshot.counts.get(teacherKey) || 0,
        isFollowing: followSnapshot.following.has(teacherKey),
        groupCount: (groupsMap.get(teacherKey) || []).length,
        courses,
      };
    });
    return json(res, 200, { teachers });
  }

  if (req.method === 'GET' && url.pathname === '/api/public/live/active') {
    const viewer = await optionalAuth(req);
    const list = await liveSessions.find({ active: true }).sort({ startedAt: -1, createdAt: -1 }).limit(20).toArray();
    return json(res, 200, { sessions: await hydrateLiveSessions(list, viewer?._id || null) });
  }

  if (req.method === 'GET' && url.pathname === '/api/public/videos') {
    const viewer = await optionalAuth(req);
    const q = clean(url.searchParams.get('q'), 80);
    const rx = q ? new RegExp(safeRegex(q), 'i') : null;
    const teacherId = oid(url.searchParams.get('teacherId'));
    const sortBy = clean(url.searchParams.get('sort'), 24).toLowerCase() || 'trending';
    const list = await videoLessons
      .find({
        ...(teacherId ? { teacherId } : {}),
        ...(rx ? { $or: [{ title: rx }, { description: rx }, { tags: rx }] } : {}),
      })
      .sort({ createdAt: -1 })
      .limit(220)
      .toArray();
    let videos = await hydrateVideoLessons(list, viewer?._id || null);
    if (sortBy === 'new' || sortBy === 'newest') {
      videos = videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'likes' || sortBy === 'top') {
      videos = videos.sort((a, b) => (b.likesCount - a.likesCount) || (b.commentsCount - a.commentsCount));
    } else {
      videos = videos.sort((a, b) => (b.score - a.score) || (new Date(b.createdAt) - new Date(a.createdAt)));
    }
    return json(res, 200, { videos, canWatch: !!viewer?._id });
  }

  const publicParts = url.pathname.split('/').filter(Boolean);
  if (publicParts[0] === 'api' && publicParts[1] === 'public' && publicParts[2] === 'videos' && publicParts[3] && publicParts.length === 4 && req.method === 'GET') {
    const viewer = await optionalAuth(req);
    const videoId = oid(publicParts[3]);
    if (!videoId) throw err('Video ID noto‘g‘ri');
    const videoDoc = await videoLessons.findOne({ _id: videoId });
    if (!videoDoc) throw err('Video topilmadi', 404);
    const [videoHydrated, commentDocs] = await Promise.all([
      hydrateVideoLessons([videoDoc], viewer?._id || null),
      videoLessonComments.find({ videoId }).sort({ createdAt: -1 }).limit(120).toArray(),
    ]);
    const comments = await hydrateVideoComments(commentDocs);
    return json(res, 200, {
      video: videoHydrated[0] || null,
      comments,
      canWatch: !!viewer?._id,
    });
  }

  if (publicParts[0] === 'api' && publicParts[1] === 'public' && publicParts[2] === 'users' && publicParts[3] && publicParts[4] === 'profile' && req.method === 'GET') {
    const viewer = await optionalAuth(req);
    const userId = oid(publicParts[3]);
    if (!userId) throw err('User ID noto‘g‘ri');
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) throw err('Foydalanuvchi topilmadi', 404);
    if (approvalStatus(userDoc.approvalStatus) !== 'approved') throw err('Profil topilmadi', 404);
    const payload = await buildUserProfile(viewer, userId);
    if (String(viewer?._id || '') !== String(userId)) {
      payload.finance = null;
    }
    return json(res, 200, payload);
  }

  if ((req.method === 'POST' || req.method === 'PUT') && (url.pathname === '/api/upload' || url.pathname === '/api/upload/')) {
    const b = await body(req);
    let allowed = false;
    try {
      await auth(req);
      allowed = true;
    } catch (e) {
      if (e?.code !== 401) throw e;
    }
    if (!allowed) {
      await adminAuth(req);
    }
    return json(res, 201, await uploadImage(b.dataUrl, b.folder));
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (url.pathname.startsWith('/api/admin/')) {
    await adminAuth(req);

    if (req.method === 'POST' && url.pathname === '/api/admin/upload') {
      const b = await body(req);
      return json(res, 201, await uploadImage(b.dataUrl, b.folder || 'admin'));
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/overview') {
      const [u, d, g, m, c, t, a, at, an, sc, mt, planCount, paymentCount, salaryCount, expenseCount, videoCount, liveCount, joinRequestCount] = await Promise.all([
        users.countDocuments(),
        chats.countDocuments({ type: 'direct' }),
        chats.countDocuments({ type: 'group' }),
        messages.countDocuments(),
        calls.countDocuments({ active: true }),
        users.countDocuments({ role: 'teacher' }),
        users.countDocuments({ role: 'abituriyent' }),
        attendance.countDocuments(),
        announcements.countDocuments(),
        schedules.countDocuments(),
        materials.countDocuments(),
        tuitionPlans.countDocuments(),
        studentPayments.countDocuments(),
        teacherPayrolls.countDocuments(),
        financeExpenses.countDocuments(),
        videoLessons.countDocuments(),
        liveSessions.countDocuments({ active: true }),
        groupJoinRequests.countDocuments({ status: 'pending' }),
      ]);
      return json(res, 200, {
        counts: {
          users: u,
          direct: d,
          group: g,
          messages: m,
          calls: c,
          teachers: t,
          abituriyent: a,
          attendance: at,
          announcements: an,
          schedules: sc,
          materials: mt,
          tuitionPlans: planCount,
          studentPayments: paymentCount,
          teacherPayrolls: salaryCount,
          financeExpenses: expenseCount,
          videoLessons: videoCount,
          activeLives: liveCount,
          pendingJoinRequests: joinRequestCount,
        },
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/users') {
      const q = clean(url.searchParams.get('q'), 50);
      const role = clean(url.searchParams.get('role'), 24);
      const requestedApprovalStatus = clean(url.searchParams.get('approvalStatus'), 24).toLowerCase();
      const rx = q ? new RegExp(safeRegex(q), 'i') : null;
      const andList = [];
      if (role && role !== 'all') andList.push({ role });
      if (requestedApprovalStatus && requestedApprovalStatus !== 'all') {
        andList.push(approvalQuery(requestedApprovalStatus));
      }
      if (rx) {
        andList.push({ $or: [{ fullName: rx }, { username: rx }, { phone: rx }, { bio: rx }] });
      }
      const list = await users
        .find(andList.length ? { $and: andList } : {})
        .sort({ createdAt: -1 })
        .limit(120)
        .toArray();
      return json(res, 200, { users: list.map(pubUser) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/users') {
      const b = await body(req);
      const fullName = clean(b.fullName, 40);
      const user = username(b.username);
      const tel = phone(b.phone);
      const pass = String(b.password || '');
      const role = clean(b.role, 24).toLowerCase();
      if (fullName.length < 2) throw err('Ism kamida 2 ta harf bo‘lsin');
      if (user.length < 3) throw err('Username kamida 3 ta harf bo‘lsin');
      if (pass.length < 6) throw err('Parol kamida 6 ta bo‘lsin');
      if (!['teacher', 'abituriyent', 'admin'].includes(role)) throw err('Role: admin, teacher yoki abituriyent bo‘lishi kerak');
      const groupId = oid(b.groupId);
      const teacherId = oid(b.teacherId);
      if (role === 'abituriyent') {
        if (!groupId) throw err('Abituriyent uchun guruh tanlang');
        if (!teacherId) throw err('Abituriyent uchun o‘qituvchi tanlang');
        const [groupDoc, teacherDoc] = await Promise.all([
          chats.findOne({ _id: groupId, type: 'group' }),
          users.findOne({ _id: teacherId }),
        ]);
        if (!groupDoc) throw err('Guruh topilmadi');
        if (!teacherDoc || !isRole(teacherDoc, 'teacher')) throw err('O‘qituvchi noto‘g‘ri');
        if (String(groupDoc.teacherId || '') !== String(teacherId)) {
          throw err('Abituriyent guruhning biriktirilgan o‘qituvchisiga ulanishi kerak');
        }
      }
      const exists = await users.findOne({ $or: [{ username: user }, ...(tel ? [{ phone: tel }] : [])] });
      if (exists) throw err('Username yoki telefon band', 409);
      const doc = {
        fullName,
        username: user,
        phone: tel,
        passwordHash: hash(pass),
        bio: clean(b.bio, 160),
        avatar: clean(b.avatar, 500),
        role,
        approvalStatus: 'approved',
        mentorTeacherId: role === 'abituriyent' ? teacherId : null,
        studyGroupIds: role === 'abituriyent' ? [groupId] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: new Date(),
        rejectedAt: null,
      };
      const ins = await users.insertOne(doc);
      if (role === 'abituriyent') {
        await chats.updateOne({ _id: groupId }, { $addToSet: { members: ins.insertedId }, $set: { updatedAt: new Date() } });
      }
      return json(res, 201, { user: pubUser({ ...doc, _id: ins.insertedId }) });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/chats') {
      const q = clean(url.searchParams.get('q'), 50);
      const type = clean(url.searchParams.get('type'), 20);
      const rx = q ? new RegExp(safeRegex(q), 'i') : null;
      const query = {
        ...(type && type !== 'all' ? { type } : {}),
        ...(rx ? { $or: [{ name: rx }, { description: rx }, { subject: rx }, { username: rx }] } : {}),
      };
      const list = await chats.find(query).sort({ updatedAt: -1 }).limit(80).toArray();
      return json(res, 200, { chats: await hydrateChats(list, null) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/groups') {
      const b = await body(req);
      const name = clean(b.name, 50);
      const description = clean(b.description, 160);
      const subject = clean(b.subject, 80);
      const coursePrice = optionalAmount(b.coursePrice, 'Kurs narxi', 0);
      const groupUsername = username(b.username || b.handle || b.slug || name);
      const teacherId = oid(b.teacherId);
      if (name.length < 3) throw err('Guruh nomi qisqa');
      if (subject.length < 2) throw err('Fan nomini kiriting');
      if (groupUsername && groupUsername.length < 3) throw err('Guruh username kamida 3 ta belgidan iborat bo‘lsin');
      if (!teacherId) throw err('O‘qituvchi tanlanmagan');
      if (groupUsername) {
        const duplicate = await chats.findOne({ type: 'group', username: groupUsername });
        if (duplicate) throw err('Guruh username band', 409);
      }
      const teacherDoc = await users.findOne({ _id: teacherId });
      if (!teacherDoc || !isRole(teacherDoc, 'teacher')) throw err('Faqat o‘qituvchi biriktiriladi');
      const studentIds = uniqIds(b.studentIds || []);
      const studentDocs = studentIds.length ? await users.find({ _id: { $in: studentIds } }).toArray() : [];
      for (const student of studentDocs) {
        if (!isRole(student, 'abituriyent')) throw err('Guruhga faqat abituriyent qo‘shiladi');
      }
      const memberIds = uniqIds([teacherId, ...studentIds]);
      const now = new Date();
      const ins = await chats.insertOne({
        type: 'group',
        name,
        description,
        subject,
        coursePrice,
        username: groupUsername,
        avatar: clean(b.avatar, 500),
        members: memberIds,
        teacherId,
        groupAdminId: teacherId,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        lastMessagePreview: 'Guruh yaratildi',
        lastSenderId: teacherId,
        createdBy: teacherId,
      });
      const chat = await chats.findOne({ _id: ins.insertedId });
      await users.updateOne({ _id: teacherId }, { $addToSet: { studyGroupIds: ins.insertedId } });
      if (studentIds.length) {
        await users.updateMany(
          { _id: { $in: studentIds } },
          {
            $addToSet: { studyGroupIds: ins.insertedId },
            $set: { mentorTeacherId: teacherId },
          }
        );
      }
      return json(res, 201, { chat: (await hydrateChats([chat], null))[0] });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/messages') {
      const q = clean(url.searchParams.get('q'), 80);
      const chatId = oid(url.searchParams.get('chatId'));
      const rx = q ? new RegExp(safeRegex(q), 'i') : null;
      const query = {
        ...(chatId ? { chatId } : {}),
        ...(rx ? { text: rx } : {}),
      };
      const list = await messages.find(query).sort({ createdAt: -1 }).limit(100).toArray();
      return json(res, 200, { messages: await hydrateAdminMessages(list) });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/announcements') {
      const q = clean(url.searchParams.get('q'), 80);
      const rx = q ? new RegExp(safeRegex(q), 'i') : null;
      const query = rx ? { $or: [{ title: rx }, { body: rx }, { createdByName: rx }] } : {};
      const list = await announcements.find(query).sort({ pinned: -1, createdAt: -1 }).limit(120).toArray();
      return json(res, 200, { announcements: await hydrateAnnouncements(list) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/announcements') {
      const b = await body(req);
      const title = clean(b.title, 80);
      const bodyText = clean(b.body, 2000);
      const groupId = oid(b.groupId);
      if (title.length < 3) throw err('E‘lon sarlavhasi qisqa');
      if (bodyText.length < 4) throw err('E‘lon matnini kiriting');
      if (groupId) {
        const group = await chats.findOne({ _id: groupId, type: 'group' });
        if (!group) throw err('Guruh topilmadi');
      }
      const doc = {
        groupId: groupId || null,
        title,
        body: bodyText,
        pinned: !!b.pinned,
        createdBy: null,
        createdByName: 'Admin',
        createdByRole: 'admin',
        createdAt: new Date(),
      };
      const ins = await announcements.insertOne(doc);
      return json(res, 201, { announcement: (await hydrateAnnouncements([{ ...doc, _id: ins.insertedId }]))[0] });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/schedules') {
      const groupId = oid(url.searchParams.get('groupId'));
      const list = await schedules.find(groupId ? { groupId } : {}).sort({ dayOfWeek: 1, startTime: 1 }).limit(160).toArray();
      return json(res, 200, { schedules: await hydrateSchedules(list) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/schedules') {
      const b = await body(req);
      const groupId = oid(b.groupId);
      if (!groupId) throw err('Guruh tanlang');
      const group = await chats.findOne({ _id: groupId, type: 'group' });
      if (!group) throw err('Guruh topilmadi');
      const doc = {
        groupId,
        dayOfWeek: weekDay(b.dayOfWeek),
        startTime: clock(b.startTime, 'Boshlanish vaqti'),
        endTime: clock(b.endTime, 'Tugash vaqti'),
        room: clean(b.room, 40),
        note: clean(b.note, 140),
        createdAt: new Date(),
      };
      const ins = await schedules.insertOne(doc);
      return json(res, 201, { schedule: (await hydrateSchedules([{ ...doc, _id: ins.insertedId }]))[0] });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/materials') {
      const q = clean(url.searchParams.get('q'), 80);
      const type = clean(url.searchParams.get('type'), 24);
      const rx = q ? new RegExp(safeRegex(q), 'i') : null;
      const query = {
        ...(type && type !== 'all' ? { type } : {}),
        ...(rx ? { $or: [{ title: rx }, { description: rx }, { createdByName: rx }, { dueDate: rx }] } : {}),
      };
      const list = await materials.find(query).sort({ createdAt: -1 }).limit(120).toArray();
      return json(res, 200, { materials: await hydrateMaterials(list) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/materials') {
      const b = await body(req);
      const groupId = oid(b.groupId);
      const type = clean(b.type, 24) || 'material';
      if (!groupId) throw err('Guruh tanlang');
      if (!['material', 'homework', 'lesson'].includes(type)) throw err('Type noto‘g‘ri');
      const group = await chats.findOne({ _id: groupId, type: 'group' });
      if (!group) throw err('Guruh topilmadi');
      const title = clean(b.title, 80);
      const description = clean(b.description, 1600);
      if (title.length < 3) throw err('Nom juda qisqa');
      if (description.length < 3) throw err('Izoh kiriting');
      const dueDate = b.dueDate ? dateKey(b.dueDate) : '';
      const doc = {
        groupId,
        type,
        title,
        description,
        link: clean(b.link, 500),
        dueDate,
        createdBy: null,
        createdByName: 'Admin',
        createdByRole: 'admin',
        createdAt: new Date(),
      };
      const ins = await materials.insertOne(doc);
      return json(res, 201, { material: (await hydrateMaterials([{ ...doc, _id: ins.insertedId }]))[0] });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/site-content') {
      return json(res, 200, { site: await readSiteContent() });
    }

    if ((req.method === 'PUT' || req.method === 'PATCH') && url.pathname === '/api/admin/site-content') {
      const b = await body(req);
      const current = await readSiteContent();
      const next = normalizeSiteContent(b, current);
      const now = new Date();
      await siteContent.updateOne(
        { _id: SITE_CONTENT_KEY },
        {
          $set: { ...next, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      return json(res, 200, { site: { ...next, updatedAt: now } });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/finance/overview') {
      const month = monthKey(url.searchParams.get('month') || monthKey(new Date()));
      return json(res, 200, await readFinanceOverview(month));
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'finance' && parts[3] === 'tuition' && parts[4] && req.method === 'PATCH') {
      const studentId = oid(parts[4]);
      if (!studentId) throw err('Talaba ID noto‘g‘ri');
      const student = await users.findOne({ _id: studentId });
      if (!student || !isRole(student, 'abituriyent')) throw err('Faqat abituriyent uchun oylik reja beriladi');
      const b = await body(req);
      const groupId = oid(b.groupId);
      if (groupId) {
        const group = await chats.findOne({ _id: groupId, type: 'group' });
        if (!group) throw err('Guruh topilmadi');
      }
      const now = new Date();
      const patch = {
        monthlyFee: amountValue(b.monthlyFee, 'Oylik summa', true),
        dueDay: dueDay(b.dueDay, 5),
        groupId: groupId || null,
        note: clean(b.note, 160),
        active: b.active === undefined ? true : !!b.active,
        updatedAt: now,
      };
      await tuitionPlans.updateOne(
        { studentId },
        {
          $set: patch,
          $setOnInsert: { studentId, createdAt: now },
        },
        { upsert: true }
      );
      const month = monthKey(b.month || monthKey(now));
      return json(res, 200, { finance: await readStudentFinanceStatus(studentId, month) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/finance/payments') {
      const b = await body(req);
      const studentId = oid(b.studentId);
      if (!studentId) throw err('Talaba ID noto‘g‘ri');
      const student = await users.findOne({ _id: studentId });
      if (!student || !isRole(student, 'abituriyent')) throw err('To‘lov faqat abituriyentga biriktiriladi');
      const plan = await tuitionPlans.findOne({ studentId });
      const paidAt = dateValue(b.paidAt, new Date(), 'To‘lov sanasi');
      const month = monthKey(b.month || monthKey(paidAt));
      const amount = amountValue(b.amount, 'To‘lov summasi');
      const groupId = oid(b.groupId) || plan?.groupId || null;
      if (groupId) {
        const group = await chats.findOne({ _id: groupId, type: 'group' });
        if (!group) throw err('Guruh topilmadi');
      }
      const doc = {
        studentId,
        groupId,
        month,
        amount,
        method: clean(b.method, 24) || 'cash',
        note: clean(b.note, 180),
        paidAt,
        createdBy: 'admin',
        createdAt: new Date(),
      };
      const ins = await studentPayments.insertOne(doc);
      return json(res, 201, { payment: { id: String(ins.insertedId), ...doc }, finance: await readStudentFinanceStatus(studentId, month) });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'finance' && parts[3] === 'payments' && parts[4] && req.method === 'DELETE') {
      const paymentId = oid(parts[4]);
      if (!paymentId) throw err('To‘lov ID noto‘g‘ri');
      const doc = await studentPayments.findOne({ _id: paymentId });
      if (!doc) throw err('To‘lov topilmadi', 404);
      await studentPayments.deleteOne({ _id: paymentId });
      return json(res, 200, { ok: true, month: doc.month });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/finance/salaries') {
      const b = await body(req);
      const teacherId = oid(b.teacherId);
      if (!teacherId) throw err('O‘qituvchi ID noto‘g‘ri');
      const teacher = await users.findOne({ _id: teacherId });
      if (!teacher || !isRole(teacher, 'teacher')) throw err('Faqat o‘qituvchi uchun maosh ajratiladi');
      const paidAt = dateValue(b.paidAt, new Date(), 'Maosh sanasi');
      const doc = {
        teacherId,
        month: monthKey(b.month || monthKey(paidAt)),
        amount: amountValue(b.amount, 'Maosh summasi'),
        note: clean(b.note, 180),
        paidAt,
        createdBy: 'admin',
        createdAt: new Date(),
      };
      const ins = await teacherPayrolls.insertOne(doc);
      return json(res, 201, { salary: { id: String(ins.insertedId), ...doc } });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'finance' && parts[3] === 'salaries' && parts[4] && req.method === 'DELETE') {
      const salaryId = oid(parts[4]);
      if (!salaryId) throw err('Maosh ID noto‘g‘ri');
      const del = await teacherPayrolls.deleteOne({ _id: salaryId });
      if (!del.deletedCount) throw err('Maosh yozuvi topilmadi', 404);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/finance/expenses') {
      const b = await body(req);
      const title = clean(b.title, 80);
      if (title.length < 2) throw err('Xarajat nomi qisqa');
      const spentAt = dateValue(b.spentAt, new Date(), 'Xarajat sanasi');
      const doc = {
        title,
        category: clean(b.category, 40) || 'boshqa',
        month: monthKey(b.month || monthKey(spentAt)),
        amount: amountValue(b.amount, 'Xarajat summasi'),
        note: clean(b.note, 180),
        spentAt,
        createdBy: 'admin',
        createdAt: new Date(),
      };
      const ins = await financeExpenses.insertOne(doc);
      return json(res, 201, { expense: { id: String(ins.insertedId), ...doc } });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'finance' && parts[3] === 'expenses' && parts[4] && req.method === 'DELETE') {
      const expenseId = oid(parts[4]);
      if (!expenseId) throw err('Xarajat ID noto‘g‘ri');
      const del = await financeExpenses.deleteOne({ _id: expenseId });
      if (!del.deletedCount) throw err('Xarajat yozuvi topilmadi', 404);
      return json(res, 200, { ok: true });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'users' && parts[3] && req.method === 'PATCH') {
      const userId = oid(parts[3]);
      if (!userId) throw err('User ID noto‘g‘ri');
      const b = await body(req);
      const currentUser = await users.findOne({ _id: userId });
      if (!currentUser) throw err('User topilmadi', 404);
      const patch = {
        ...(b.fullName !== undefined ? { fullName: clean(b.fullName, 40) } : {}),
        ...(b.username !== undefined ? { username: username(b.username) } : {}),
        ...(b.phone !== undefined ? { phone: phone(b.phone) } : {}),
        ...(b.bio !== undefined ? { bio: clean(b.bio, 160) } : {}),
        ...(b.avatar !== undefined ? { avatar: clean(b.avatar, 500) } : {}),
        ...(b.role !== undefined ? { role: clean(b.role, 20).toLowerCase() || 'abituriyent' } : {}),
        ...(b.approvalStatus !== undefined ? { approvalStatus: approvalStatus(b.approvalStatus) } : {}),
      };
      if (patch.role && !['admin', 'teacher', 'abituriyent'].includes(patch.role)) throw err('Role noto‘g‘ri');
      if (patch.approvalStatus && !['approved', 'pending', 'rejected'].includes(patch.approvalStatus)) throw err('Approval status noto‘g‘ri');
      if (patch.approvalStatus === 'approved') {
        patch.approvedAt = new Date();
        patch.rejectedAt = null;
      }
      if (patch.approvalStatus === 'rejected') {
        patch.rejectedAt = new Date();
      }

      const roleAfter = patch.role || currentUser.role || 'abituriyent';
      const now = new Date();
      const prevGroupIds = uniqIds(currentUser.studyGroupIds || []);
      let nextGroupIds = [...prevGroupIds];

      const teacherIdInputProvided = b.teacherId !== undefined;
      const primaryGroupProvided = b.groupId !== undefined;
      const addGroupProvided = b.addGroupId !== undefined;
      const removeGroupProvided = b.removeGroupId !== undefined;

      const teacherId = teacherIdInputProvided ? oid(b.teacherId) : null;
      const primaryGroupId = primaryGroupProvided ? oid(b.groupId) : null;
      const addGroupId = addGroupProvided ? oid(b.addGroupId) : null;
      const removeGroupId = removeGroupProvided ? oid(b.removeGroupId) : null;

      if (roleAfter === 'abituriyent') {
        if (teacherIdInputProvided) {
          if (!teacherId) throw err('O‘qituvchi ID noto‘g‘ri');
          const teacherDoc = await users.findOne({ _id: teacherId });
          if (!teacherDoc || !isRole(teacherDoc, 'teacher')) throw err('O‘qituvchi noto‘g‘ri');
          patch.mentorTeacherId = teacherId;
        }
        if (primaryGroupProvided) {
          if (!primaryGroupId) throw err('Guruh ID noto‘g‘ri');
          const groupDoc = await chats.findOne({ _id: primaryGroupId, type: 'group' });
          if (!groupDoc) throw err('Guruh topilmadi');
          nextGroupIds = [primaryGroupId];
          if (!teacherIdInputProvided && groupDoc.teacherId) patch.mentorTeacherId = groupDoc.teacherId;
        }
        if (addGroupProvided) {
          if (!addGroupId) throw err('Qo‘shiladigan guruh ID noto‘g‘ri');
          const groupDoc = await chats.findOne({ _id: addGroupId, type: 'group' });
          if (!groupDoc) throw err('Guruh topilmadi');
          if (!nextGroupIds.some((id) => String(id) === String(addGroupId))) nextGroupIds.push(addGroupId);
        }
        if (removeGroupProvided) {
          if (!removeGroupId) throw err('O‘chiriladigan guruh ID noto‘g‘ri');
          nextGroupIds = nextGroupIds.filter((id) => String(id) !== String(removeGroupId));
        }
        if (primaryGroupProvided || addGroupProvided || removeGroupProvided) {
          patch.studyGroupIds = nextGroupIds;
        }
      } else if (patch.role && patch.role !== 'abituriyent') {
        patch.mentorTeacherId = null;
        patch.studyGroupIds = [];
        nextGroupIds = [];
      }

      if (!Object.keys(patch).length) throw err('Yangilash uchun maydon yo‘q');
      await users.updateOne({ _id: userId }, { $set: patch });

      const addedGroups = nextGroupIds.filter((id) => !prevGroupIds.some((prevId) => String(prevId) === String(id)));
      const removedGroups = prevGroupIds.filter((id) => !nextGroupIds.some((nextId) => String(nextId) === String(id)));
      if (addedGroups.length) {
        await chats.updateMany({ _id: { $in: addedGroups }, type: 'group' }, { $addToSet: { members: userId }, $set: { updatedAt: now } });
      }
      if (removedGroups.length) {
        await chats.updateMany({ _id: { $in: removedGroups }, type: 'group' }, { $pull: { members: userId }, $set: { updatedAt: now } });
      }

      const fresh = await users.findOne({ _id: userId });
      return json(res, 200, { user: pubUser(fresh) });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'users' && parts[3] && req.method === 'DELETE') {
      const userId = oid(parts[3]);
      if (!userId) throw err('User ID noto‘g‘ri');
      await deleteUserCascade(userId);
      return json(res, 200, { ok: true });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'chats' && parts[3] && req.method === 'PATCH') {
      const chatId = oid(parts[3]);
      if (!chatId) throw err('Chat ID noto‘g‘ri');
      const b = await body(req);
      const chatDoc = await chats.findOne({ _id: chatId });
      if (!chatDoc) throw err('Chat topilmadi', 404);
      const nextUsername = b.username !== undefined ? username(b.username) : null;
      if (b.username !== undefined) {
        if (nextUsername && nextUsername.length < 3) throw err('Guruh username kamida 3 ta belgidan iborat bo‘lsin');
        if (nextUsername) {
          const duplicate = await chats.findOne({ _id: { $ne: chatId }, type: 'group', username: nextUsername });
          if (duplicate) throw err('Guruh username band', 409);
        }
      }
      await chats.updateOne(
        { _id: chatId },
        {
          $set: {
            ...(b.name !== undefined ? { name: clean(b.name, 50) } : {}),
            ...(b.description !== undefined ? { description: clean(b.description, 160) } : {}),
            ...(b.subject !== undefined ? { subject: clean(b.subject, 80) } : {}),
            ...(b.coursePrice !== undefined ? { coursePrice: optionalAmount(b.coursePrice, 'Kurs narxi', 0) } : {}),
            ...(b.username !== undefined ? { username: nextUsername } : {}),
            ...(b.avatar !== undefined ? { avatar: clean(b.avatar, 500) } : {}),
            updatedAt: new Date(),
          },
        }
      );
      const fresh = await chats.findOne({ _id: chatId });
      return json(res, 200, { chat: (await hydrateChats([fresh], null))[0] });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'chats' && parts[3] && req.method === 'DELETE') {
      const chatId = oid(parts[3]);
      if (!chatId) throw err('Chat ID noto‘g‘ri');
      await deleteChatCascade(chatId);
      return json(res, 200, { ok: true });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'messages' && parts[3] && req.method === 'DELETE') {
      const messageId = oid(parts[3]);
      if (!messageId) throw err('Message ID noto‘g‘ri');
      const doc = await messages.findOne({ _id: messageId });
      if (!doc) throw err('Xabar topilmadi', 404);
      await messages.deleteOne({ _id: messageId });
      await syncChatMeta(doc.chatId);
      return json(res, 200, { ok: true });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'announcements' && parts[3] && req.method === 'DELETE') {
      const announcementId = oid(parts[3]);
      if (!announcementId) throw err('E‘lon ID noto‘g‘ri');
      await announcements.deleteOne({ _id: announcementId });
      return json(res, 200, { ok: true });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'schedules' && parts[3] && req.method === 'DELETE') {
      const scheduleId = oid(parts[3]);
      if (!scheduleId) throw err('Jadval ID noto‘g‘ri');
      await schedules.deleteOne({ _id: scheduleId });
      return json(res, 200, { ok: true });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'materials' && parts[3] && req.method === 'DELETE') {
      const materialId = oid(parts[3]);
      if (!materialId) throw err('Material ID noto‘g‘ri');
      await materials.deleteOne({ _id: materialId });
      await materialSubmissions.deleteMany({ materialId });
      return json(res, 200, { ok: true });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'groups' && parts[3] && parts[4] === 'attendance' && req.method === 'GET') {
      const groupId = oid(parts[3]);
      if (!groupId) throw err('Guruh ID noto‘g‘ri');
      const group = await chats.findOne({ _id: groupId, type: 'group' });
      if (!group) throw err('Guruh topilmadi', 404);
      const docs = await readAttendanceForGroup(group, {
        month: url.searchParams.get('month'),
        limit: url.searchParams.get('limit'),
      });
      return json(res, 200, { attendance: docs });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/group-join-requests') {
      const status = clean(url.searchParams.get('status'), 20).toLowerCase();
      const q = clean(url.searchParams.get('q'), 80);
      const rx = q ? new RegExp(safeRegex(q), 'i') : null;
      const query = {
        ...(status && status !== 'all' ? { status } : {}),
      };
      const list = await groupJoinRequests.find(query).sort({ createdAt: -1 }).limit(400).toArray();
      const userIds = uniqIds(list.map((item) => item.userId));
      const teacherIds = uniqIds(list.map((item) => item.teacherId));
      const groupIds = uniqIds(list.map((item) => item.groupId));
      const adminIds = uniqIds(list.map((item) => item.processedBy));
      const [userDocs, teacherDocs, groupDocs, adminDocs] = await Promise.all([
        userIds.length ? users.find({ _id: { $in: userIds } }).toArray() : [],
        teacherIds.length ? users.find({ _id: { $in: teacherIds } }).toArray() : [],
        groupIds.length ? chats.find({ _id: { $in: groupIds } }).toArray() : [],
        adminIds.length ? users.find({ _id: { $in: adminIds } }).toArray() : [],
      ]);
      const userMap = new Map(userDocs.map((item) => [String(item._id), item]));
      const teacherMap = new Map(teacherDocs.map((item) => [String(item._id), item]));
      const groupMap = new Map(groupDocs.map((item) => [String(item._id), item]));
      const adminMap = new Map(adminDocs.map((item) => [String(item._id), item]));
      const requests = list
        .map((item) => {
          const userDoc = userMap.get(String(item.userId || ''));
          const teacherDoc = teacherMap.get(String(item.teacherId || ''));
          const groupDoc = groupMap.get(String(item.groupId || ''));
          const adminDoc = adminMap.get(String(item.processedBy || ''));
          return {
            id: String(item._id),
            status: item.status || 'pending',
            fullName: item.fullName || userDoc?.fullName || '',
            phone: item.phone || userDoc?.phone || '',
            paymentConsent: !!item.paymentConsent,
            paymentAmount: roundAmount(item.paymentAmount || 0),
            paymentScreenshotUrl: item.paymentScreenshotUrl || '',
            adminShareAmount: roundAmount(item.adminShareAmount || 0),
            adminCommissionPercent: Number(item.adminCommissionPercent || ADMIN_COMMISSION_PERCENT),
            note: item.note || '',
            adminNote: item.adminNote || '',
            createdAt: item.createdAt,
            processedAt: item.processedAt || null,
            user: pubUser(userDoc),
            teacher: pubUser(teacherDoc),
            group: groupDoc
              ? {
                  id: String(groupDoc._id),
                  name: groupDoc.name || 'Guruh',
                  subject: groupDoc.subject || '',
                  coursePrice: roundAmount(groupDoc.coursePrice || 0),
                }
              : null,
            processedBy: pubUser(adminDoc),
            processedByLogin: item.processedByLogin || '',
          };
        })
        .filter((item) => {
          if (!rx) return true;
          return (
            rx.test(item.fullName || '') ||
            rx.test(item.phone || '') ||
            rx.test(item.note || '') ||
            rx.test(item.group?.name || '') ||
            rx.test(item.teacher?.fullName || '') ||
            rx.test(item.user?.fullName || '') ||
            rx.test(item.user?.username || '')
          );
        });
      return json(res, 200, { requests });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'group-join-requests' && parts[3] && req.method === 'PATCH') {
      const requestId = oid(parts[3]);
      if (!requestId) throw err('So‘rov ID noto‘g‘ri');
      const existing = await groupJoinRequests.findOne({ _id: requestId });
      if (!existing) throw err('So‘rov topilmadi', 404);
      const b = await body(req);
      const action = clean(b.action, 20).toLowerCase();
      if (!['approve', 'reject'].includes(action)) throw err('action: approve yoki reject bo‘lsin');
      if (existing.status === 'approved' && action === 'approve') throw err('So‘rov avval tasdiqlangan');
      if (existing.status === 'rejected' && action === 'reject') throw err('So‘rov avval rad etilgan');

      const nextGroupId = oid(b.groupId) || existing.groupId || null;
      const nextTeacherId = oid(b.teacherId) || existing.teacherId || null;
      const now = new Date();
      let teacherIdForUpdate = nextTeacherId;

      if (action === 'approve') {
        const userId = oid(existing.userId);
        if (!userId) throw err('So‘rov foydalanuvchisi topilmadi');
        if (!nextGroupId) throw err('Tasdiqlash uchun guruh tanlang');
        const [userDoc, groupDoc] = await Promise.all([
          users.findOne({ _id: userId }),
          chats.findOne({ _id: nextGroupId, type: 'group' }),
        ]);
        if (!userDoc) throw err('Foydalanuvchi topilmadi', 404);
        if (!isRole(userDoc, 'abituriyent')) throw err('Faqat abituriyent so‘rovi tasdiqlanadi');
        if (!groupDoc) throw err('Guruh topilmadi', 404);
        const teacherIdToAssign = nextTeacherId || groupDoc.teacherId || null;
        if (!teacherIdToAssign) throw err('Guruh uchun o‘qituvchi biriktirilmagan');
        const teacherDoc = await users.findOne({ _id: teacherIdToAssign });
        if (!teacherDoc || !isRole(teacherDoc, 'teacher')) throw err('O‘qituvchi noto‘g‘ri');
        teacherIdForUpdate = teacherDoc._id;

        await chats.updateOne(
          { _id: groupDoc._id },
          {
            $addToSet: { members: userDoc._id },
            $set: { updatedAt: now },
          }
        );
        await users.updateOne(
          { _id: userDoc._id },
          {
            $addToSet: { studyGroupIds: groupDoc._id },
            $set: { mentorTeacherId: teacherDoc._id },
          }
        );
      }

      await groupJoinRequests.updateOne(
        { _id: requestId },
        {
          $set: {
            status: action === 'approve' ? 'approved' : 'rejected',
            groupId: nextGroupId,
            teacherId: teacherIdForUpdate,
            adminNote: clean(b.adminNote, 220),
            processedAt: now,
            processedBy: existing.processedBy || null,
            processedByLogin: ADMIN_LOGIN,
            updatedAt: now,
          },
        }
      );

      return json(res, 200, { ok: true });
    }

    throw err('Admin route topilmadi', 404);
  }

  const me = await auth(req);

  if (req.method === 'GET' && url.pathname === '/api/me') {
    return json(res, 200, { user: pubUser(me), stats: await stats(me._id) });
  }

  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    return json(res, 200, await buildDashboard(me));
  }

  if (req.method === 'GET' && url.pathname === '/api/announcements') {
    const groupDocs = await listGroupDocsForUser(me, 64);
    const groupIds = groupDocs.map((group) => group._id);
    const list = await announcements
      .find(groupIds.length ? { $or: [{ groupId: null }, { groupId: { $in: groupIds } }] } : { groupId: null })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(120)
      .toArray();
    return json(res, 200, { announcements: await hydrateAnnouncements(list) });
  }

  if (req.method === 'GET' && url.pathname === '/api/schedules') {
    const groupDocs = await listGroupDocsForUser(me, 64);
    const groupIds = groupDocs.map((group) => group._id);
    const day = url.searchParams.get('day');
    const dayOfWeek = day !== null ? weekDay(day) : null;
    const query = {
      ...(groupIds.length ? { groupId: { $in: groupIds } } : { _id: null }),
      ...(dayOfWeek !== null ? { dayOfWeek } : {}),
    };
    const list = await schedules.find(query).sort({ dayOfWeek: 1, startTime: 1 }).limit(240).toArray();
    return json(res, 200, { schedules: await hydrateSchedules(list) });
  }

  if (req.method === 'GET' && url.pathname === '/api/materials') {
    const groupDocs = await listGroupDocsForUser(me, 64);
    const groupIds = groupDocs.map((group) => group._id);
    const type = clean(url.searchParams.get('type'), 24);
    const query = {
      ...(groupIds.length ? { groupId: { $in: groupIds } } : { _id: null }),
      ...(type && type !== 'all' ? { type } : {}),
    };
    const list = await materials.find(query).sort({ createdAt: -1 }).limit(180).toArray();
    return json(res, 200, { materials: await hydrateMaterials(list) });
  }

  if (parts[0] === 'api' && parts[1] === 'materials' && parts[2] && parts.length === 3 && req.method === 'GET') {
    const materialId = oid(parts[2]);
    if (!materialId) throw err('Material ID noto‘g‘ri');
    const { material, group } = await mustMaterialForUser(materialId, me);
    const submissionDocs = await materialSubmissions.find({ materialId }).sort({ createdAt: -1 }).toArray();
    const submissions = await hydrateMaterialSubmissions(submissionDocs);
    const mySubmission = submissions.find((item) => String(item.studentId) === String(me._id)) || null;
    const canReview = isRole(me, 'admin') || String(group.teacherId || '') === String(me._id) || String(group.groupAdminId || '') === String(me._id);
    return json(res, 200, {
      material: (await hydrateMaterials([{ ...material }]))[0] || null,
      group: (await hydrateChats([group], me._id))[0] || null,
      mySubmission,
      submissions: canReview ? submissions : submissions.filter((item) => String(item.studentId) === String(me._id)),
      canSubmit: isRole(me, 'abituriyent'),
      canReview,
    });
  }

  if (parts[0] === 'api' && parts[1] === 'materials' && parts[2] && parts[3] === 'submissions' && req.method === 'POST') {
    const materialId = oid(parts[2]);
    if (!materialId) throw err('Material ID noto‘g‘ri');
    const { material } = await mustMaterialForUser(materialId, me);
    if (!isRole(me, 'abituriyent')) throw err('Topshiriqni faqat abituriyent yuboradi', 403);
    const payload = await body(req);
    const textValue = clean(payload.text, 2000);
    const linkValue = clean(payload.link, 500);
    const attachmentUrl = clean(payload.attachmentUrl, 500);
    if (!textValue && !linkValue && !attachmentUrl) throw err('Topshiriq matni yoki fayl yuboring');
    const now = new Date();
    await materialSubmissions.updateOne(
      { materialId, studentId: me._id },
      {
        $set: {
          text: textValue,
          link: linkValue,
          attachmentUrl,
          status: 'submitted',
          updatedAt: now,
          materialGroupId: material.groupId,
        },
        $setOnInsert: {
          createdAt: now,
          materialCreatedAt: material.createdAt || now,
        },
      },
      { upsert: true }
    );
    const fresh = await materialSubmissions.findOne({ materialId, studentId: me._id });
    return json(res, 201, { submission: (await hydrateMaterialSubmissions([fresh]))[0] });
  }

  if (parts[0] === 'api' && parts[1] === 'materials' && parts[2] && parts[3] === 'submissions' && parts[4] === 'review' && req.method === 'PATCH') {
    const materialId = oid(parts[2]);
    if (!materialId) throw err('Material ID noto‘g‘ri');
    const { group } = await mustMaterialForUser(materialId, me);
    const canReview = isRole(me, 'admin') || String(group.teacherId || '') === String(me._id) || String(group.groupAdminId || '') === String(me._id);
    if (!canReview) throw err('Faqat admin yoki ustoz baholaydi', 403);
    const payload = await body(req);
    const studentId = oid(payload.studentId);
    if (!studentId) throw err('Student ID noto‘g‘ri');
    const status = clean(payload.status, 24).toLowerCase();
    const patch = {
      ...(status ? { status } : {}),
      teacherNote: clean(payload.teacherNote, 600),
      updatedAt: new Date(),
    };
    if (payload.score !== undefined && payload.score !== null && payload.score !== '') {
      const score = Number(payload.score);
      if (!Number.isFinite(score)) throw err('Ball noto‘g‘ri');
      patch.score = Math.max(0, Math.min(100, score));
    }
    await materialSubmissions.updateOne({ materialId, studentId }, { $set: patch });
    const docs = await materialSubmissions.find({ materialId }).sort({ createdAt: -1 }).toArray();
    return json(res, 200, { submissions: await hydrateMaterialSubmissions(docs) });
  }

  if (req.method === 'GET' && url.pathname === '/api/attendance/history') {
    const groupDocs = await listGroupDocsForUser(me, 80);
    const groupIds = groupDocs.map((group) => group._id);
    const groupId = oid(url.searchParams.get('groupId'));
    const month = clean(url.searchParams.get('month'), 7);
    const limitRaw = Number(url.searchParams.get('limit') || 240);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(480, Math.trunc(limitRaw))) : 240;
    if (groupId && !groupIds.some((id) => String(id) === String(groupId))) throw err('Bu guruh sizga biriktirilmagan', 403);
    const query = {
      ...(groupId ? { groupId } : groupIds.length ? { groupId: { $in: groupIds } } : { _id: null }),
      ...(month ? { date: { $regex: '^' + safeRegex(month) } } : {}),
    };
    const docs = await attendance.find(query).sort({ date: -1, createdAt: -1 }).limit(limit).toArray();
    return json(res, 200, {
      history: await hydrateAttendanceRows(docs, me._id),
      groups: (await hydrateChats(groupDocs, me._id)).map((group) => ({ id: group.id, name: group.name, subject: group.subject })),
    });
  }

  if (parts[0] === 'api' && parts[1] === 'users' && parts[2] && parts[3] === 'profile' && req.method === 'GET') {
    const userId = oid(parts[2]);
    if (!userId) throw err('User ID noto‘g‘ri');
    return json(res, 200, await buildUserProfile(me, userId));
  }

  if (req.method === 'PUT' && url.pathname === '/api/profile') {
    const b = await body(req);
    const fullName = clean(b.fullName, 40);
    const user = username(b.username);
    const tel = phone(b.phone);
    if (fullName.length < 2) throw err('Ism kamida 2 ta harf bo‘lsin');
    if (user.length < 3) throw err('Username kamida 3 ta harf bo‘lsin');
    const dup = await users.findOne({ _id: { $ne: me._id }, $or: [{ username: user }, ...(tel ? [{ phone: tel }] : [])] });
    if (dup) throw err('Username yoki telefon band', 409);
    await users.updateOne({ _id: me._id }, { $set: { fullName, username: user, phone: tel, bio: clean(b.bio, 160), avatar: clean(b.avatar, 500) } });
    const fresh = await users.findOne({ _id: me._id });
    return json(res, 200, { user: pubUser(fresh), stats: await stats(me._id) });
  }

  if (req.method === 'GET' && url.pathname === '/api/finance/my') {
    if (!isRole(me, 'abituriyent')) return json(res, 200, { finance: null });
    const month = monthKey(url.searchParams.get('month') || monthKey(new Date()));
    return json(res, 200, { finance: await readStudentFinanceStatus(me._id, month) });
  }

  if (req.method === 'GET' && url.pathname === '/api/video/config') {
    return json(res, 200, {
      engine: 'HALLAYM',
      iceServers: iceServers(),
      maxGroupParticipants: Number.isFinite(MAX_GROUP_CALL_PARTICIPANTS) ? MAX_GROUP_CALL_PARTICIPANTS : 50,
      hallaymTurnApiDefined: !!HALLAYMTURN_API,
      hallaymTurnSecretDefined: !!HALLAYM_TURN_SECRET_KEY,
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const q = clean(url.searchParams.get('q'), 40);
    const rx = q ? new RegExp(safeRegex(q), 'i') : null;
    const [userDocs, groupDocs, videoDocs, liveDocs] = await Promise.all([
      users.find({ _id: { $ne: me._id }, ...(rx ? { $or: [{ fullName: rx }, { username: rx }, { phone: rx }] } : {}) }).sort({ createdAt: -1 }).limit(12).toArray(),
      chats.find({ type: 'group', ...(rx ? { $or: [{ name: rx }, { description: rx }, { subject: rx }, { username: rx }] } : {}) }).sort({ updatedAt: -1 }).limit(20).toArray(),
      videoLessons.find(rx ? { $or: [{ title: rx }, { description: rx }, { tags: rx }] } : {}).sort({ createdAt: -1 }).limit(20).toArray(),
      liveSessions.find({ active: true, ...(rx ? { $or: [{ title: rx }, { description: rx }] } : {}) }).sort({ startedAt: -1 }).limit(20).toArray(),
    ]);
    const hydratedGroups = await hydrateChats(groupDocs, me._id);
    const hydratedVideos = await hydrateVideoLessons(videoDocs, me._id);
    const hydratedLives = await hydrateLiveSessions(liveDocs, me._id);
    return json(res, 200, {
      users: userDocs.map(pubUser),
      groups: hydratedGroups.map((group) => ({
        ...group,
        isMember: (group.members || []).some((member) => String(member.id) === String(me._id)),
      })),
      videos: hydratedVideos,
      liveSessions: hydratedLives,
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/teachers') {
    const q = clean(url.searchParams.get('q'), 60);
    const rx = q ? new RegExp(safeRegex(q), 'i') : null;
    const teacherDocs = await users
      .find({
        $and: [
          { role: 'teacher' },
          approvalQuery('approved'),
          ...(rx ? [{ $or: [{ fullName: rx }, { username: rx }, { bio: rx }, { phone: rx }] }] : []),
        ],
      })
      .sort({ createdAt: -1 })
      .limit(120)
      .toArray();
    const teacherIds = teacherDocs.map((item) => item._id);
    const [groupsByTeacher, followSnapshot] = await Promise.all([
      teacherIds.length ? chats.find({ type: 'group', teacherId: { $in: teacherIds } }).toArray() : [],
      teacherFollowSnapshot(teacherIds, me._id),
    ]);
    const groupsMap = new Map();
    for (const group of groupsByTeacher) {
      const key = String(group.teacherId || '');
      const list = groupsMap.get(key) || [];
      list.push(group);
      groupsMap.set(key, list);
    }
    const teachers = teacherDocs.map((teacher) => {
      const teacherKey = String(teacher._id);
      const courses = (groupsMap.get(teacherKey) || []).map((group) => group.subject || group.name || '').filter(Boolean).slice(0, 6);
      return {
        ...pubUser(teacher),
        followerCount: followSnapshot.counts.get(teacherKey) || 0,
        isFollowing: followSnapshot.following.has(teacherKey),
        groupCount: (groupsMap.get(teacherKey) || []).length,
        courses,
      };
    });
    return json(res, 200, { teachers });
  }

  if (parts[0] === 'api' && parts[1] === 'teachers' && parts[2] && parts[3] === 'follow' && req.method === 'POST') {
    const teacherId = oid(parts[2]);
    if (!teacherId) throw err('O‘qituvchi ID noto‘g‘ri');
    if (String(teacherId) === String(me._id)) throw err('O‘zingizga obuna bo‘lolmaysiz');
    const teacherDoc = await users.findOne({ _id: teacherId });
    if (!teacherDoc || !isRole(teacherDoc, 'teacher')) throw err('O‘qituvchi topilmadi', 404);
    const now = new Date();
    await teacherFollowers.updateOne(
      { teacherId, followerId: me._id },
      { $setOnInsert: { teacherId, followerId: me._id, createdAt: now } },
      { upsert: true }
    );
    const followerCount = await teacherFollowers.countDocuments({ teacherId });
    return json(res, 200, { ok: true, followerCount, isFollowing: true });
  }

  if (parts[0] === 'api' && parts[1] === 'teachers' && parts[2] && parts[3] === 'follow' && req.method === 'DELETE') {
    const teacherId = oid(parts[2]);
    if (!teacherId) throw err('O‘qituvchi ID noto‘g‘ri');
    await teacherFollowers.deleteOne({ teacherId, followerId: me._id });
    const followerCount = await teacherFollowers.countDocuments({ teacherId });
    return json(res, 200, { ok: true, followerCount, isFollowing: false });
  }

  if (req.method === 'GET' && url.pathname === '/api/group-join-requests/my') {
    const list = await groupJoinRequests.find({ userId: me._id }).sort({ createdAt: -1 }).limit(200).toArray();
    const groupIds = uniqIds(list.map((item) => item.groupId));
    const teacherIds = uniqIds(list.map((item) => item.teacherId));
    const [groupDocs, teacherDocs] = await Promise.all([
      groupIds.length ? chats.find({ _id: { $in: groupIds } }).toArray() : [],
      teacherIds.length ? users.find({ _id: { $in: teacherIds } }).toArray() : [],
    ]);
    const groupMap = new Map(groupDocs.map((item) => [String(item._id), item]));
    const teacherMap = new Map(teacherDocs.map((item) => [String(item._id), item]));
    return json(res, 200, {
      requests: list.map((item) => {
        const groupDoc = groupMap.get(String(item.groupId || ''));
        const teacherDoc = teacherMap.get(String(item.teacherId || ''));
        return {
          id: String(item._id),
          status: item.status || 'pending',
          fullName: item.fullName || me.fullName || '',
          phone: item.phone || me.phone || '',
          paymentConsent: !!item.paymentConsent,
          paymentAmount: roundAmount(item.paymentAmount || 0),
          paymentScreenshotUrl: item.paymentScreenshotUrl || '',
          adminShareAmount: roundAmount(item.adminShareAmount || 0),
          adminCommissionPercent: Number(item.adminCommissionPercent || ADMIN_COMMISSION_PERCENT),
          note: item.note || '',
          adminNote: item.adminNote || '',
          createdAt: item.createdAt,
          processedAt: item.processedAt || null,
          group: groupDoc
            ? {
                id: String(groupDoc._id),
                name: groupDoc.name || 'Guruh',
                subject: groupDoc.subject || '',
                coursePrice: roundAmount(groupDoc.coursePrice || 0),
              }
            : null,
          teacher: pubUser(teacherDoc),
          processedByLogin: item.processedByLogin || '',
        };
      }),
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/group-join-requests') {
    if (!isRole(me, 'abituriyent')) throw err('So‘rovni faqat abituriyent yuboradi', 403);
    const b = await body(req);
    const groupId = oid(b.groupId);
    if (!groupId) throw err('Guruh tanlanmagan');
    const group = await chats.findOne({ _id: groupId, type: 'group' });
    if (!group) throw err('Guruh topilmadi');
    if ((group.members || []).some((member) => String(member) === String(me._id))) {
      throw err('Siz bu guruhga allaqachon birikgansiz');
    }
    const fullName = clean(b.fullName, 70) || me.fullName || '';
    const userPhone = phone(b.phone) || me.phone || '';
    if (fullName.length < 3) throw err('Ism-familya to‘liq kiriting');
    if (userPhone.length < 7) throw err('Telefon raqami kerak');
    if (!b.paymentConsent) throw err('Oylik to‘lov roziligini belgilang');
    const paymentAmount = optionalAmount(b.paymentAmount, 'To‘lov summasi', 0);
    const coursePrice = roundAmount(group.coursePrice || 0);
    if (coursePrice > 0 && paymentAmount < coursePrice) throw err(`Kurs summasi kamida ${coursePrice} so‘m bo‘lishi kerak`);
    const paymentScreenshotUrl = clean(b.paymentScreenshotUrl, 500);
    if (!paymentScreenshotUrl) throw err('To‘lov skrinshotini yuklang');
    const duplicate = await groupJoinRequests.findOne({
      userId: me._id,
      groupId,
      status: 'pending',
    });
    if (duplicate) throw err('Bu guruh bo‘yicha so‘rov allaqachon yuborilgan');
    const now = new Date();
    const doc = {
      userId: me._id,
      groupId,
      teacherId: group.teacherId || null,
      fullName,
      phone: userPhone,
      note: clean(b.note, 220),
      paymentConsent: true,
      paymentAmount,
      paymentScreenshotUrl,
      coursePriceAtRequest: coursePrice,
      adminCommissionPercent: ADMIN_COMMISSION_PERCENT,
      adminShareAmount: roundAmount((paymentAmount * ADMIN_COMMISSION_PERCENT) / 100),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      processedAt: null,
      processedBy: null,
      processedByLogin: '',
      adminNote: '',
    };
    const ins = await groupJoinRequests.insertOne(doc);
    return json(res, 201, {
      request: {
        id: String(ins.insertedId),
        status: doc.status,
        createdAt: doc.createdAt,
        fullName: doc.fullName,
        phone: doc.phone,
        note: doc.note,
        paymentConsent: doc.paymentConsent,
        paymentAmount: doc.paymentAmount,
        paymentScreenshotUrl: doc.paymentScreenshotUrl,
      },
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/videos') {
    const q = clean(url.searchParams.get('q'), 80);
    const rx = q ? new RegExp(safeRegex(q), 'i') : null;
    const teacherId = oid(url.searchParams.get('teacherId'));
    const sortBy = clean(url.searchParams.get('sort'), 24).toLowerCase() || 'trending';
    const list = await videoLessons
      .find({
        ...(teacherId ? { teacherId } : {}),
        ...(rx ? { $or: [{ title: rx }, { description: rx }, { tags: rx }] } : {}),
      })
      .sort({ createdAt: -1 })
      .limit(220)
      .toArray();
    let videos = await hydrateVideoLessons(list, me._id);
    if (sortBy === 'new' || sortBy === 'newest') {
      videos = videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'likes' || sortBy === 'top') {
      videos = videos.sort((a, b) => (b.likesCount - a.likesCount) || (b.commentsCount - a.commentsCount));
    } else {
      videos = videos.sort((a, b) => (b.score - a.score) || (new Date(b.createdAt) - new Date(a.createdAt)));
    }
    return json(res, 200, { videos });
  }

  if (req.method === 'POST' && url.pathname === '/api/videos') {
    ensureRole(me, 'teacher', 'admin');
    const b = await body(req);
    const title = clean(b.title, 120);
    const description = clean(b.description, 2200);
    const link = clean(b.link, 600);
    if (title.length < 3) throw err('Video nomi qisqa');
    if (description.length < 3) throw err('Video tavsifi kiriting');
    const teacherId = isRole(me, 'admin') ? oid(b.teacherId) || me._id : me._id;
    const teacherDoc = await users.findOne({ _id: teacherId });
    if (!teacherDoc || !isRole(teacherDoc, 'teacher', 'admin')) throw err('Video uchun o‘qituvchi topilmadi');
    const yt = youtubeMeta(link);
    const now = new Date();
    const doc = {
      teacherId,
      title,
      description,
      link,
      youtubeId: yt.youtubeId || '',
      youtubeEmbedUrl: yt.youtubeEmbedUrl || '',
      youtubeWatchUrl: yt.youtubeWatchUrl || '',
      youtubeThumbnail: yt.youtubeThumbnail || '',
      hasYoutubeVideo: !!yt.youtubeId,
      tags: asList(b.tags || [], 12, 30),
      createdAt: now,
      updatedAt: now,
    };
    const ins = await videoLessons.insertOne(doc);
    const fresh = await videoLessons.findOne({ _id: ins.insertedId });
    const hydrated = await hydrateVideoLessons([fresh], me._id);
    return json(res, 201, { video: hydrated[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'videos' && parts[2] && parts.length === 3 && req.method === 'GET') {
    const videoId = oid(parts[2]);
    if (!videoId) throw err('Video ID noto‘g‘ri');
    const videoDoc = await videoLessons.findOne({ _id: videoId });
    if (!videoDoc) throw err('Video topilmadi', 404);
    const [videoHydrated, commentDocs] = await Promise.all([
      hydrateVideoLessons([videoDoc], me._id),
      videoLessonComments.find({ videoId }).sort({ createdAt: -1 }).limit(300).toArray(),
    ]);
    const comments = await hydrateVideoComments(commentDocs);
    return json(res, 200, { video: videoHydrated[0] || null, comments });
  }

  if (parts[0] === 'api' && parts[1] === 'videos' && parts[2] && parts.length === 3 && req.method === 'PATCH') {
    const videoId = oid(parts[2]);
    if (!videoId) throw err('Video ID noto‘g‘ri');
    const videoDoc = await videoLessons.findOne({ _id: videoId });
    if (!videoDoc) throw err('Video topilmadi', 404);
    if (!isRole(me, 'admin') && String(videoDoc.teacherId || '') !== String(me._id)) throw err('Faqat video egasi tahrirlaydi', 403);
    const b = await body(req);
    const link = b.link !== undefined ? clean(b.link, 600) : videoDoc.link || '';
    const yt = youtubeMeta(link);
    const patch = {
      ...(b.title !== undefined ? { title: clean(b.title, 120) } : {}),
      ...(b.description !== undefined ? { description: clean(b.description, 2200) } : {}),
      ...(b.tags !== undefined ? { tags: asList(b.tags || [], 12, 30) } : {}),
      ...(b.link !== undefined
        ? {
            link,
            youtubeId: yt.youtubeId || '',
            youtubeEmbedUrl: yt.youtubeEmbedUrl || '',
            youtubeWatchUrl: yt.youtubeWatchUrl || '',
            youtubeThumbnail: yt.youtubeThumbnail || '',
            hasYoutubeVideo: !!yt.youtubeId,
          }
        : {}),
      updatedAt: new Date(),
    };
    if (patch.title !== undefined && patch.title.length < 3) throw err('Video nomi qisqa');
    if (patch.description !== undefined && patch.description.length < 3) throw err('Video tavsifi kiriting');
    await videoLessons.updateOne({ _id: videoId }, { $set: patch });
    const fresh = await videoLessons.findOne({ _id: videoId });
    return json(res, 200, { video: (await hydrateVideoLessons([fresh], me._id))[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'videos' && parts[2] && parts.length === 3 && req.method === 'DELETE') {
    const videoId = oid(parts[2]);
    if (!videoId) throw err('Video ID noto‘g‘ri');
    const videoDoc = await videoLessons.findOne({ _id: videoId });
    if (!videoDoc) throw err('Video topilmadi', 404);
    if (!isRole(me, 'admin') && String(videoDoc.teacherId || '') !== String(me._id)) throw err('Faqat video egasi o‘chiradi', 403);
    await videoLessonLikes.deleteMany({ videoId });
    await videoLessonComments.deleteMany({ videoId });
    await videoLessons.deleteOne({ _id: videoId });
    return json(res, 200, { ok: true });
  }

  if (parts[0] === 'api' && parts[1] === 'videos' && parts[2] && parts[3] === 'like' && req.method === 'POST') {
    const videoId = oid(parts[2]);
    if (!videoId) throw err('Video ID noto‘g‘ri');
    const videoDoc = await videoLessons.findOne({ _id: videoId });
    if (!videoDoc) throw err('Video topilmadi', 404);
    const existing = await videoLessonLikes.findOne({ videoId, userId: me._id });
    if (existing) await videoLessonLikes.deleteOne({ _id: existing._id });
    else await videoLessonLikes.insertOne({ videoId, userId: me._id, createdAt: new Date() });
    const likesCount = await videoLessonLikes.countDocuments({ videoId });
    return json(res, 200, { ok: true, isLiked: !existing, likesCount });
  }

  if (parts[0] === 'api' && parts[1] === 'videos' && parts[2] && parts[3] === 'comments' && req.method === 'POST') {
    const videoId = oid(parts[2]);
    if (!videoId) throw err('Video ID noto‘g‘ri');
    const videoDoc = await videoLessons.findOne({ _id: videoId });
    if (!videoDoc) throw err('Video topilmadi', 404);
    const b = await body(req);
    const textValue = clean(b.text, 1200);
    if (textValue.length < 1) throw err('Izoh matni bo‘sh');
    const doc = { videoId, userId: me._id, text: textValue, createdAt: new Date() };
    const ins = await videoLessonComments.insertOne(doc);
    const fresh = await videoLessonComments.findOne({ _id: ins.insertedId });
    const comments = await hydrateVideoComments([fresh]);
    const commentsCount = await videoLessonComments.countDocuments({ videoId });
    return json(res, 201, { comment: comments[0] || null, commentsCount });
  }

  if (req.method === 'GET' && url.pathname === '/api/live/active') {
    const docs = await liveSessions.find({ active: true }).sort({ startedAt: -1, createdAt: -1 }).limit(80).toArray();
    return json(res, 200, { sessions: await hydrateLiveSessions(docs, me._id) });
  }

  if (req.method === 'POST' && url.pathname === '/api/live/start') {
    ensureRole(me, 'teacher', 'admin');
    const b = await body(req);
    const now = new Date();
    const existing = await liveSessions.findOne({ teacherId: me._id, active: true });
    if (existing) {
      await liveSessions.updateOne(
        { _id: existing._id },
        {
          $set: {
            title: clean(b.title, 120) || existing.title || 'Jonli efir',
            description: clean(b.description, 500) || existing.description || '',
            thumbnail: clean(b.thumbnail, 500) || existing.thumbnail || '',
            updatedAt: now,
          },
          $addToSet: { participants: me._id },
        }
      );
      const fresh = await liveSessions.findOne({ _id: existing._id });
      return json(res, 200, { session: (await hydrateLiveSessions([fresh], me._id))[0] || null });
    }
    const doc = {
      teacherId: me._id,
      title: clean(b.title, 120) || `${me.fullName || me.username || 'Ustoz'} jonli efiri`,
      description: clean(b.description, 500),
      thumbnail: clean(b.thumbnail, 500),
      active: true,
      participants: [me._id],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const ins = await liveSessions.insertOne(doc);
    const fresh = await liveSessions.findOne({ _id: ins.insertedId });
    return json(res, 201, { session: (await hydrateLiveSessions([fresh], me._id))[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts.length === 3 && req.method === 'GET') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const doc = await liveSessions.findOne({ _id: sessionId, active: true });
    if (!doc) throw err('Jonli efir topilmadi', 404);
    const [session] = await hydrateLiveSessions([doc], me._id);
    const commentDocs = await liveSessionComments.find({ sessionId }).sort({ createdAt: -1 }).limit(200).toArray();
    return json(res, 200, { session: session || null, comments: await hydrateLiveComments(commentDocs) });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts[3] === 'join' && req.method === 'POST') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const doc = await liveSessions.findOne({ _id: sessionId, active: true });
    if (!doc) throw err('Jonli efir topilmadi', 404);
    await liveSessions.updateOne({ _id: sessionId }, { $addToSet: { participants: me._id }, $set: { updatedAt: new Date() } });
    const fresh = await liveSessions.findOne({ _id: sessionId });
    return json(res, 200, { session: (await hydrateLiveSessions([fresh], me._id))[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts[3] === 'leave' && req.method === 'POST') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const doc = await liveSessions.findOne({ _id: sessionId });
    if (!doc) throw err('Jonli efir topilmadi', 404);
    await liveSessions.updateOne({ _id: sessionId }, { $pull: { participants: me._id }, $set: { updatedAt: new Date() } });
    const fresh = await liveSessions.findOne({ _id: sessionId });
    if (!fresh) return json(res, 200, { session: null });
    const participants = fresh.participants || [];
    const shouldStop = String(fresh.teacherId || '') === String(me._id) || !participants.length;
    if (shouldStop) {
      await liveSessions.updateOne({ _id: sessionId }, { $set: { active: false, endedAt: new Date(), updatedAt: new Date() } });
      await liveSignals.deleteMany({ sessionId });
      return json(res, 200, { session: null });
    }
    const after = await liveSessions.findOne({ _id: sessionId });
    return json(res, 200, { session: (await hydrateLiveSessions([after], me._id))[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts[3] === 'stop' && req.method === 'POST') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const doc = await liveSessions.findOne({ _id: sessionId });
    if (!doc) throw err('Jonli efir topilmadi', 404);
    if (!isRole(me, 'admin') && String(doc.teacherId || '') !== String(me._id)) throw err('Faqat efir egasi to‘xtatadi', 403);
    await liveSessions.updateOne({ _id: sessionId }, { $set: { active: false, endedAt: new Date(), updatedAt: new Date() } });
    await liveSignals.deleteMany({ sessionId });
    return json(res, 200, { ok: true });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts[3] === 'poll' && req.method === 'GET') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const doc = await liveSessions.findOne({ _id: sessionId, active: true });
    if (!doc) throw err('Jonli efir tugagan', 404);
    await liveSessions.updateOne({ _id: sessionId }, { $addToSet: { participants: me._id }, $set: { updatedAt: new Date() } });
    const inbox = await liveSignals.find({ sessionId, $or: [{ toUserId: me._id }, { toUserId: null }] }).sort({ createdAt: 1 }).limit(140).toArray();
    if (inbox.length) {
      await liveSignals.deleteMany({ _id: { $in: inbox.map((item) => item._id) } });
    }
    const [fresh] = await hydrateLiveSessions([await liveSessions.findOne({ _id: sessionId })], me._id);
    const comments = await hydrateLiveComments(await liveSessionComments.find({ sessionId }).sort({ createdAt: -1 }).limit(80).toArray());
    return json(res, 200, {
      session: fresh || null,
      comments,
      signals: inbox.map((item) => ({
        id: String(item._id),
        fromUserId: String(item.fromUserId),
        toUserId: item.toUserId ? String(item.toUserId) : '',
        type: item.type,
        data: item.data || {},
        createdAt: item.createdAt,
      })),
    });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts[3] === 'signal' && req.method === 'POST') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const sessionDoc = await liveSessions.findOne({ _id: sessionId, active: true });
    if (!sessionDoc) throw err('Jonli efir topilmadi', 404);
    const b = await body(req);
    const toUserId = b.toUserId ? oid(b.toUserId) : null;
    const type = clean(b.type, 20);
    if (!['offer', 'answer', 'candidate'].includes(type)) throw err('Signal turi noto‘g‘ri');
    await liveSignals.insertOne({
      sessionId,
      fromUserId: me._id,
      toUserId,
      type,
      data: b.data || {},
      createdAt: new Date(),
    });
    await liveSessions.updateOne({ _id: sessionId }, { $set: { updatedAt: new Date() } });
    return json(res, 201, { ok: true });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts[3] === 'like' && req.method === 'POST') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const sessionDoc = await liveSessions.findOne({ _id: sessionId });
    if (!sessionDoc) throw err('Jonli efir topilmadi', 404);
    const existing = await liveSessionLikes.findOne({ sessionId, userId: me._id });
    if (existing) await liveSessionLikes.deleteOne({ _id: existing._id });
    else await liveSessionLikes.insertOne({ sessionId, userId: me._id, createdAt: new Date() });
    const likesCount = await liveSessionLikes.countDocuments({ sessionId });
    return json(res, 200, { ok: true, isLiked: !existing, likesCount });
  }

  if (parts[0] === 'api' && parts[1] === 'live' && parts[2] && parts[3] === 'comments' && req.method === 'POST') {
    const sessionId = oid(parts[2]);
    if (!sessionId) throw err('Jonli efir ID noto‘g‘ri');
    const sessionDoc = await liveSessions.findOne({ _id: sessionId });
    if (!sessionDoc) throw err('Jonli efir topilmadi', 404);
    const b = await body(req);
    const textValue = clean(b.text, 900);
    if (!textValue) throw err('Izoh matni bo‘sh');
    const ins = await liveSessionComments.insertOne({ sessionId, userId: me._id, text: textValue, createdAt: new Date() });
    const fresh = await liveSessionComments.findOne({ _id: ins.insertedId });
    const comments = await hydrateLiveComments([fresh]);
    const commentsCount = await liveSessionComments.countDocuments({ sessionId });
    return json(res, 201, { comment: comments[0] || null, commentsCount });
  }

  if (req.method === 'GET' && url.pathname === '/api/chats') {
    const scope = clean(url.searchParams.get('scope') || 'all', 10);
    const query = { members: me._id, ...(scope === 'direct' ? { type: 'direct' } : scope === 'group' ? { type: 'group' } : {}) };
    const list = await chats.find(query).sort({ updatedAt: -1 }).limit(50).toArray();
    return json(res, 200, { chats: await hydrateChats(list, me._id) });
  }

  if (req.method === 'POST' && url.pathname === '/api/chats/direct') {
    const b = await body(req);
    const other = oid(b.userId);
    if (!other || String(other) === String(me._id)) throw err('User noto‘g‘ri');
    const target = await users.findOne({ _id: other });
    if (!target) throw err('User topilmadi', 404);
    let chat = await chats.findOne({ type: 'direct', members: { $all: [me._id, other], $size: 2 } });
    if (!chat) {
      const now = new Date();
      const ins = await chats.insertOne({ type: 'direct', members: [me._id, other], createdAt: now, updatedAt: now, lastMessageAt: now, lastMessagePreview: 'Suhbatni boshlang', lastSenderId: me._id });
      chat = await chats.findOne({ _id: ins.insertedId });
    }
    return json(res, 201, { chat: (await hydrateChats([chat], me._id))[0] });
  }

  if (req.method === 'POST' && url.pathname === '/api/groups') {
    throw err('Guruhlarni faqat admin qo‘shadi', 403);
  }

  if (req.method === 'GET' && url.pathname === '/api/groups') {
    const list = await chats.find({ type: 'group' }).sort({ updatedAt: -1 }).limit(120).toArray();
    const hydrated = await hydrateChats(list, me._id);
    const result = hydrated.map((group) => ({
      ...group,
      isMember: (group.members || []).some((item) => item.id === String(me._id)),
    }));
    return json(res, 200, { groups: result });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && req.method === 'PATCH') {
    const groupId = oid(parts[2]);
    if (!groupId) throw err('Guruh ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat ushbu guruh ustozi tahrirlay oladi', 403);
    const b = await body(req);
    const nextUsername = b.username !== undefined ? username(b.username) : null;
    if (b.username !== undefined) {
      if (nextUsername && nextUsername.length < 3) throw err('Guruh username kamida 3 ta bo‘lsin');
      if (nextUsername) {
        const duplicate = await chats.findOne({ _id: { $ne: groupId }, type: 'group', username: nextUsername });
        if (duplicate) throw err('Guruh username band', 409);
      }
    }
    const patch = {
      ...(b.name !== undefined ? { name: clean(b.name, 50) } : {}),
      ...(b.subject !== undefined ? { subject: clean(b.subject, 80) } : {}),
      ...(b.description !== undefined ? { description: clean(b.description, 160) } : {}),
      ...(b.avatar !== undefined ? { avatar: clean(b.avatar, 500) } : {}),
      ...(b.username !== undefined ? { username: nextUsername } : {}),
      updatedAt: new Date(),
    };
    await chats.updateOne({ _id: groupId, type: 'group' }, { $set: patch });
    const fresh = await chats.findOne({ _id: groupId, type: 'group' });
    return json(res, 200, { group: (await hydrateChats([fresh], me._id))[0] });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && req.method === 'DELETE') {
    const groupId = oid(parts[2]);
    if (!groupId) throw err('Guruh ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat ushbu guruh ustozi o‘chirishi mumkin', 403);
    await deleteChatCascade(groupId);
    await users.updateMany({ studyGroupIds: groupId }, { $pull: { studyGroupIds: groupId } });
    return json(res, 200, { ok: true });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'hub' && req.method === 'GET') {
    const groupId = oid(parts[2]);
    if (!groupId) throw err('Guruh ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    const [announcementDocs, scheduleDocs, materialDocs] = await Promise.all([
      announcements.find({ $or: [{ groupId: null }, { groupId }] }).sort({ pinned: -1, createdAt: -1 }).limit(10).toArray(),
      schedules.find({ groupId }).sort({ dayOfWeek: 1, startTime: 1 }).limit(30).toArray(),
      materials.find({ groupId }).sort({ createdAt: -1 }).limit(24).toArray(),
    ]);
    return json(res, 200, {
      canManage: canManageGroupContent(group, me),
      announcements: await hydrateAnnouncements(announcementDocs),
      schedule: await hydrateSchedules(scheduleDocs),
      materials: await hydrateMaterials(materialDocs),
    });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'join' && req.method === 'POST') {
    throw err('Guruhga qo‘shishni faqat admin belgilaydi', 403);
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'announcements' && req.method === 'POST') {
    const groupId = oid(parts[2]);
    if (!groupId) throw err('Guruh ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat shu guruh ustoziga ruxsat beriladi', 403);
    const b = await body(req);
    const title = clean(b.title, 80);
    const bodyText = clean(b.body, 1600);
    if (title.length < 3) throw err('E‘lon sarlavhasi qisqa');
    if (bodyText.length < 4) throw err('E‘lon matnini kiriting');
    const doc = {
      groupId,
      title,
      body: bodyText,
      pinned: !!b.pinned,
      createdBy: me._id,
      createdByName: me.fullName || me.username || 'Ustoz',
      createdByRole: me.role || 'teacher',
      createdAt: new Date(),
    };
    const ins = await announcements.insertOne(doc);
    return json(res, 201, { announcement: (await hydrateAnnouncements([{ ...doc, _id: ins.insertedId }]))[0] });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'announcements' && parts[4] && req.method === 'PATCH') {
    const groupId = oid(parts[2]);
    const announcementId = oid(parts[4]);
    if (!groupId || !announcementId) throw err('ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat shu guruh ustoziga ruxsat beriladi', 403);
    const existing = await announcements.findOne({ _id: announcementId, groupId });
    if (!existing) throw err('E‘lon topilmadi', 404);
    const b = await body(req);
    const patch = {
      ...(b.title !== undefined ? { title: clean(b.title, 80) } : {}),
      ...(b.body !== undefined ? { body: clean(b.body, 1600) } : {}),
      ...(b.pinned !== undefined ? { pinned: !!b.pinned } : {}),
      updatedAt: new Date(),
    };
    if (patch.title !== undefined && patch.title.length < 3) throw err('E‘lon sarlavhasi qisqa');
    if (patch.body !== undefined && patch.body.length < 4) throw err('E‘lon matnini kiriting');
    await announcements.updateOne({ _id: announcementId, groupId }, { $set: patch });
    const fresh = await announcements.findOne({ _id: announcementId, groupId });
    return json(res, 200, { announcement: (await hydrateAnnouncements([fresh]))[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'announcements' && parts[4] && req.method === 'DELETE') {
    const groupId = oid(parts[2]);
    const announcementId = oid(parts[4]);
    if (!groupId || !announcementId) throw err('ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat shu guruh ustoziga ruxsat beriladi', 403);
    await announcements.deleteOne({ _id: announcementId, groupId });
    return json(res, 200, { ok: true });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'materials' && req.method === 'POST') {
    const groupId = oid(parts[2]);
    if (!groupId) throw err('Guruh ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat shu guruh ustoziga ruxsat beriladi', 403);
    const b = await body(req);
    const type = clean(b.type, 24) || 'material';
    if (!['material', 'homework', 'lesson'].includes(type)) throw err('Type noto‘g‘ri');
    const title = clean(b.title, 80);
    const description = clean(b.description, 1600);
    if (title.length < 3) throw err('Nomi juda qisqa');
    if (description.length < 3) throw err('Izoh kiriting');
    const dueDate = b.dueDate ? dateKey(b.dueDate) : '';
    const doc = {
      groupId,
      type,
      title,
      description,
      link: clean(b.link, 500),
      dueDate,
      createdBy: me._id,
      createdByName: me.fullName || me.username || 'Ustoz',
      createdByRole: me.role || 'teacher',
      createdAt: new Date(),
    };
    const ins = await materials.insertOne(doc);
    return json(res, 201, { material: (await hydrateMaterials([{ ...doc, _id: ins.insertedId }]))[0] });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'materials' && parts[4] && req.method === 'PATCH') {
    const groupId = oid(parts[2]);
    const materialId = oid(parts[4]);
    if (!groupId || !materialId) throw err('ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat shu guruh ustoziga ruxsat beriladi', 403);
    const existing = await materials.findOne({ _id: materialId, groupId });
    if (!existing) throw err('Material topilmadi', 404);
    const b = await body(req);
    const patch = {
      ...(b.type !== undefined ? { type: clean(b.type, 24) || 'material' } : {}),
      ...(b.title !== undefined ? { title: clean(b.title, 80) } : {}),
      ...(b.description !== undefined ? { description: clean(b.description, 1600) } : {}),
      ...(b.link !== undefined ? { link: clean(b.link, 500) } : {}),
      ...(b.dueDate !== undefined ? { dueDate: b.dueDate ? dateKey(b.dueDate) : '' } : {}),
      updatedAt: new Date(),
    };
    if (patch.type !== undefined && !['material', 'homework', 'lesson'].includes(patch.type)) throw err('Type noto‘g‘ri');
    if (patch.title !== undefined && patch.title.length < 3) throw err('Nomi juda qisqa');
    if (patch.description !== undefined && patch.description.length < 3) throw err('Izoh kiriting');
    await materials.updateOne({ _id: materialId, groupId }, { $set: patch });
    const fresh = await materials.findOne({ _id: materialId, groupId });
    return json(res, 200, { material: (await hydrateMaterials([fresh]))[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'materials' && parts[4] && req.method === 'DELETE') {
    const groupId = oid(parts[2]);
    const materialId = oid(parts[4]);
    if (!groupId || !materialId) throw err('ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (!canManageGroupContent(group, me)) throw err('Faqat shu guruh ustoziga ruxsat beriladi', 403);
    await materials.deleteOne({ _id: materialId, groupId });
    await materialSubmissions.deleteMany({ materialId });
    return json(res, 200, { ok: true });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'attendance' && req.method === 'GET') {
    const groupId = oid(parts[2]);
    if (!groupId) throw err('Guruh ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    const list = await readAttendanceForGroup(group, {
      month: url.searchParams.get('month'),
      limit: url.searchParams.get('limit'),
    });
    return json(res, 200, { attendance: list });
  }

  if (parts[0] === 'api' && parts[1] === 'groups' && parts[2] && parts[3] === 'attendance' && req.method === 'POST') {
    const groupId = oid(parts[2]);
    if (!groupId) throw err('Guruh ID noto‘g‘ri');
    const group = await mustCourseGroupForUser(groupId, me);
    if (String(group.teacherId || '') !== String(me._id)) throw err('Davomatni faqat biriktirilgan o‘qituvchi kiritadi', 403);
    const b = await body(req);
    const date = dateKey(b.date);
    const records = Array.isArray(b.records) ? b.records : [];
    if (!records.length) throw err('Davomat ro‘yxati bo‘sh');
    const cleaned = [];
    for (const row of records) {
      const studentId = oid(row.studentId);
      if (!studentId) continue;
      const memberOk = (group.members || []).some((member) => String(member) === String(studentId));
      if (!memberOk || String(studentId) === String(group.teacherId || '')) continue;
      const studentDoc = await users.findOne({ _id: studentId });
      if (!studentDoc || !isRole(studentDoc, 'abituriyent')) continue;
      cleaned.push({
        studentId,
        present: !!row.present,
        note: clean(row.note, 120),
      });
    }
    if (!cleaned.length) throw err('Yaroqli abituriyent topilmadi');
    const now = new Date();
    await attendance.updateOne(
      { groupId, date },
      {
        $set: {
          records: cleaned,
          markedBy: me._id,
          lessonTopic: clean(b.lessonTopic, 120),
          lessonNote: clean(b.lessonNote, 240),
          homework: clean(b.homework, 240),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    const list = await readAttendanceForGroup(group, { limit: 180 });
    return json(res, 200, { attendance: list });
  }

  if (req.method === 'POST' && url.pathname === '/api/ai/chat') {
    const b = await body(req);
    const prompt = clean(b.prompt, 2000);
    if (!prompt) throw err('Savol kiriting');
    if (!GROQ_API_KEY) throw err('GROQ_API_KEY sozlanmagan', 500);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'Siz o‘quv markaz yordamchisiz. Qisqa, aniq, darsga oid javob bering. Nomaqbul so‘rovlarga rad javobi bering.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw err(data.error?.message || 'Groq API xatolik', 500);
    const answer = data.choices?.[0]?.message?.content || 'Javob topilmadi';
    return json(res, 200, { answer });
  }

  if (parts[0] === 'api' && parts[1] === 'chats' && parts[2] && parts[3] === 'call' && req.method === 'GET') {
    const chatId = oid(parts[2]);
    await mustChat(chatId, me._id);
    const call = await calls.findOne({ chatId, active: true });
    return json(res, 200, { call: await hydrateCall(call) });
  }

  if (parts[0] === 'api' && parts[1] === 'chats' && parts[2] && parts[3] === 'call' && parts[4] === 'start' && req.method === 'POST') {
    const chatId = oid(parts[2]);
    const chat = await mustChat(chatId, me._id);
    let call = await calls.findOne({ chatId, active: true });
    const maxParticipants = Number.isFinite(MAX_GROUP_CALL_PARTICIPANTS) && MAX_GROUP_CALL_PARTICIPANTS > 0 ? Math.trunc(MAX_GROUP_CALL_PARTICIPANTS) : 50;
    if (call && chat.type === 'group') {
      const participants = call.participants || [];
      const alreadyJoined = participants.some((item) => String(item) === String(me._id));
      if (!alreadyJoined && participants.length >= maxParticipants) {
        throw err(`Guruh videochat limiti ${maxParticipants} ta ishtirokchi`, 403);
      }
    }
    if (!call) {
      const now = new Date();
      const ins = await calls.insertOne({
        chatId,
        createdBy: me._id,
        participants: [me._id],
        active: true,
        startedAt: now,
        updatedAt: now,
      });
      call = await calls.findOne({ _id: ins.insertedId });
    } else {
      await calls.updateOne({ _id: call._id }, { $addToSet: { participants: me._id }, $set: { updatedAt: new Date(), active: true } });
      call = await calls.findOne({ _id: call._id });
    }
    return json(res, 200, { call: await hydrateCall(call) });
  }

  if (parts[0] === 'api' && parts[1] === 'calls' && parts[2] && parts[3] === 'join' && req.method === 'POST') {
    const callId = oid(parts[2]);
    const call = await mustCall(callId, me._id);
    const chat = await chats.findOne({ _id: call.chatId });
    const maxParticipants = Number.isFinite(MAX_GROUP_CALL_PARTICIPANTS) && MAX_GROUP_CALL_PARTICIPANTS > 0 ? Math.trunc(MAX_GROUP_CALL_PARTICIPANTS) : 50;
    if (chat?.type === 'group') {
      const participants = call.participants || [];
      const alreadyJoined = participants.some((item) => String(item) === String(me._id));
      if (!alreadyJoined && participants.length >= maxParticipants) {
        throw err(`Guruh videochat limiti ${maxParticipants} ta ishtirokchi`, 403);
      }
    }
    await calls.updateOne({ _id: call._id }, { $addToSet: { participants: me._id }, $set: { updatedAt: new Date(), active: true } });
    const fresh = await calls.findOne({ _id: call._id });
    return json(res, 200, { call: await hydrateCall(fresh) });
  }

  if (parts[0] === 'api' && parts[1] === 'calls' && parts[2] && parts[3] === 'leave' && req.method === 'POST') {
    const callId = oid(parts[2]);
    const call = await mustCall(callId, me._id);
    await calls.updateOne({ _id: call._id }, { $pull: { participants: me._id }, $set: { updatedAt: new Date() } });
    const fresh = await calls.findOne({ _id: call._id });
    if (!fresh || !(fresh.participants || []).length) {
      await deleteCallCascade(call._id);
      return json(res, 200, { call: null });
    }
    return json(res, 200, { call: await hydrateCall(fresh) });
  }

  if (parts[0] === 'api' && parts[1] === 'calls' && parts[2] && parts[3] === 'poll' && req.method === 'GET') {
    const callId = oid(parts[2]);
    const call = await mustCall(callId, me._id);
    await calls.updateOne({ _id: call._id }, { $addToSet: { participants: me._id }, $set: { updatedAt: new Date() } });
    const inbox = await signals.find({ callId, $or: [{ toUserId: me._id }, { toUserId: null }] }).sort({ createdAt: 1 }).limit(120).toArray();
    if (inbox.length) {
      await signals.deleteMany({ _id: { $in: inbox.map((item) => item._id) } });
    }
    const fresh = await calls.findOne({ _id: call._id });
    return json(res, 200, {
      call: await hydrateCall(fresh),
      signals: inbox.map((item) => ({
        id: String(item._id),
        fromUserId: String(item.fromUserId),
        toUserId: item.toUserId ? String(item.toUserId) : '',
        type: item.type,
        data: item.data || {},
        createdAt: item.createdAt,
      })),
    });
  }

  if (parts[0] === 'api' && parts[1] === 'calls' && parts[2] && parts[3] === 'signal' && req.method === 'POST') {
    const callId = oid(parts[2]);
    const call = await mustCall(callId, me._id);
    const b = await body(req);
    const toUserId = b.toUserId ? oid(b.toUserId) : null;
    const type = clean(b.type, 20);
    if (!['offer', 'answer', 'candidate'].includes(type)) throw err('Signal turi noto‘g‘ri');
    await signals.insertOne({
      callId: call._id,
      fromUserId: me._id,
      toUserId,
      type,
      data: b.data || {},
      createdAt: new Date(),
    });
    await calls.updateOne({ _id: call._id }, { $set: { updatedAt: new Date() } });
    return json(res, 201, { ok: true });
  }

  if (parts[0] === 'api' && parts[1] === 'chats' && parts[2] && parts.length === 3 && req.method === 'GET') {
    const chat = await mustChat(oid(parts[2]), me._id);
    return json(res, 200, { chat: (await hydrateChats([chat], me._id))[0] });
  }

  if (parts[0] === 'api' && parts[1] === 'chats' && parts[2] && parts[3] === 'messages' && req.method === 'GET') {
    const chatId = oid(parts[2]);
    await mustChat(chatId, me._id);
    const list = await messages.find({ chatId }).sort({ createdAt: -1 }).limit(60).toArray();
    list.reverse();
    return json(res, 200, { messages: await hydrateMessages(list, me._id) });
  }

  if (parts[0] === 'api' && parts[1] === 'chats' && parts[2] && parts[3] === 'messages' && req.method === 'POST') {
    const chatId = oid(parts[2]);
    await mustChat(chatId, me._id);
    const b = await body(req);
    const textMsg = clean(b.text, 1500);
    const mediaUrl = clean(b.mediaUrl, 500);
    const replyToId = oid(b.replyToId);
    if (!textMsg && !mediaUrl) throw err('Xabar yoki rasm yuboring');
    if (replyToId) {
      const parent = await messages.findOne({ _id: replyToId, chatId });
      if (!parent) throw err('Reply qilinadigan xabar topilmadi');
    }
    const now = new Date();
    const doc = {
      chatId,
      senderId: me._id,
      text: textMsg,
      mediaUrl,
      mediaType: clean(b.mediaType, 30),
      replyToId: replyToId || null,
      reactions: [],
      createdAt: now,
      updatedAt: now,
      editedAt: null,
    };
    const ins = await messages.insertOne(doc);
    await chats.updateOne({ _id: chatId }, { $set: { updatedAt: doc.createdAt, lastMessageAt: doc.createdAt, lastMessagePreview: preview(doc), lastSenderId: me._id } });
    return json(res, 201, { message: (await hydrateMessages([{ ...doc, _id: ins.insertedId }], me._id))[0] });
  }

  if (parts[0] === 'api' && parts[1] === 'chats' && parts[2] && parts[3] === 'messages' && parts[4] && req.method === 'PATCH') {
    const chatId = oid(parts[2]);
    const messageId = oid(parts[4]);
    if (!chatId || !messageId) throw err('ID noto‘g‘ri');
    await mustChat(chatId, me._id);
    const messageDoc = await messages.findOne({ _id: messageId, chatId });
    if (!messageDoc) throw err('Xabar topilmadi', 404);
    if (String(messageDoc.senderId || '') !== String(me._id)) throw err('Faqat o‘zingiz yozgan xabarni tahrirlaysiz', 403);
    const b = await body(req);
    const nextText = clean(b.text, 1500);
    if (!nextText && !messageDoc.mediaUrl) throw err('Xabar bo‘sh bo‘lib qolmasin');
    const now = new Date();
    await messages.updateOne(
      { _id: messageId, chatId },
      {
        $set: {
          text: nextText,
          updatedAt: now,
          editedAt: now,
        },
      }
    );
    const fresh = await messages.findOne({ _id: messageId, chatId });
    await syncChatMeta(chatId);
    return json(res, 200, { message: (await hydrateMessages([fresh], me._id))[0] || null });
  }

  if (parts[0] === 'api' && parts[1] === 'chats' && parts[2] && parts[3] === 'messages' && parts[4] && parts[5] === 'reactions' && req.method === 'POST') {
    const chatId = oid(parts[2]);
    const messageId = oid(parts[4]);
    if (!chatId || !messageId) throw err('ID noto‘g‘ri');
    await mustChat(chatId, me._id);
    const messageDoc = await messages.findOne({ _id: messageId, chatId });
    if (!messageDoc) throw err('Xabar topilmadi', 404);
    const b = await body(req);
    const emoji = reactionEmoji(b.emoji);
    const mine = String(me._id);
    const nextReactions = Array.isArray(messageDoc.reactions) ? [...messageDoc.reactions] : [];
    const reactionIndex = nextReactions.findIndex((item) => item?.emoji === emoji);
    if (reactionIndex === -1) {
      nextReactions.push({ emoji, userIds: [me._id] });
    } else {
      const userIds = uniqIds(nextReactions[reactionIndex].userIds || []);
      const hasMine = userIds.some((id) => String(id) === mine);
      if (hasMine) {
        const trimmed = userIds.filter((id) => String(id) !== mine);
        if (!trimmed.length) nextReactions.splice(reactionIndex, 1);
        else nextReactions[reactionIndex] = { emoji, userIds: trimmed };
      } else {
        userIds.push(me._id);
        nextReactions[reactionIndex] = { emoji, userIds };
      }
    }
    await messages.updateOne({ _id: messageId, chatId }, { $set: { reactions: nextReactions, updatedAt: new Date() } });
    const fresh = await messages.findOne({ _id: messageId, chatId });
    return json(res, 200, { message: (await hydrateMessages([fresh], me._id))[0] || null });
  }

  throw err('Topilmadi', 404);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const learnhubIndex = path.join(PUBLIC, 'learnhub-1.0.0', 'dist', 'index.html');
    if (req.method === 'GET' && url.pathname === '/') {
      return redir(res, '/index.html');
    }
    if (req.method === 'GET' && url.pathname === '/learnhub') {
      if (!fs.existsSync(learnhubIndex)) return json(res, 404, { error: 'LearnHub build topilmadi' });
      return text(res, 200, fs.readFileSync(learnhubIndex, 'utf8'), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/admin') {
      return text(res, 200, fs.readFileSync(path.join(PUBLIC, 'admin.html'), 'utf8'), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/admin.html') {
      return json(res, 404, { error: 'Topilmadi' });
    }
    if (req.method === 'GET' && url.pathname === '/login') return redir(res, '/login.html');
    if (req.method === 'GET' && url.pathname === '/dashboard') return redir(res, '/dashboard.html');
    if (req.method === 'GET' && url.pathname === '/register') return redir(res, '/register.html');
    if (req.method === 'GET' && url.pathname === '/payment') return redir(res, '/payment.html');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method === 'GET') {
      const fileName = url.pathname.slice(1);
      const type = STATIC_FILES.get(fileName);
      if (type) {
        return text(res, 200, fs.readFileSync(path.join(PUBLIC, fileName), 'utf8'), type);
      }
      if (fileName) {
        const filePath = path.join(PUBLIC, fileName);
        if (!path.relative(PUBLIC, filePath).startsWith('..') && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          return send(res, 200, fs.readFileSync(filePath), mimeType(filePath));
        }
      }
    }
    json(res, 404, { error: 'Topilmadi' });
  } catch (e) {
    console.error(e);
    json(res, e.code || 500, { error: e.message || 'Server xatosi' });
  }
});

async function start() {
  await initDb();
  server.listen(PORT, () => console.log('Cliffs App -> http://localhost:' + PORT));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
