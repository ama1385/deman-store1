import crypto from 'node:crypto';

const COOKIE = 'deman_session';
const TTL = 60 * 60 * 24 * 7;

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  const key = secret();
  if (!key) return '';
  return crypto.createHmac('sha256', key).update(value).digest('base64url');
}

export function passwordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export function checkPassword(input) {
  const expected = String(process.env.ADMIN_PASSWORD || '');
  const got = String(input || '');
  if (!expected || expected.length !== got.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got)); }
  catch { return false; }
}

export function createSession() {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now()/1000) + TTL }));
  return payload + '.' + sign(payload);
}

function cookieMap(request) {
  const raw = request.headers.get('cookie') || '';
  const out = {};
  raw.split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0,i).trim()] = decodeURIComponent(part.slice(i+1).trim());
  });
  return out;
}

export function isAdmin(request) {
  const token = cookieMap(request)[COOKIE];
  if (!token || !secret()) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (expected.length !== sig.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(data.exp) > Math.floor(Date.now()/1000);
  } catch { return false; }
}

export function requireAdmin(request) {
  if (!isAdmin(request)) throw Object.assign(new Error('غير مصرح'), { status: 401 });
}

export function sessionCookie(request, token) {
  const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':','');
  const secure = proto === 'https' ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}${secure}`;
}

export function clearSessionCookie(request) {
  const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':','');
  const secure = proto === 'https' ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
