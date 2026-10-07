import { json, methodNotAllowed } from './_http.js';
import { loadConfig, loadProducts } from './_store.js';

/**
 * Catalog prices are entered and stored in SAR, and customers are charged that same amount.
 * Other currencies on the storefront are a display-only conversion (api/_lib/rates.js).
 */
export const CURRENCY = 'SAR';
export const STORE_FALLBACK = 'Deman.Store';

export const ACCOUNT_INACTIVE_AR =
  'حساب التاجر في ميسر غير مفعّل بعد، لذلك الدفع المباشر متوقف حالياً. تقدر تكمل الشراء عبر ديسكورد إلى أن يتم تفعيل الحساب.';

const PAYMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MOYASAR_PAYMENT_URL = 'https://api.moyasar.com/v1/payments/';
const MIN_HALALAS = 100;

export function halalasFromSar(sar) {
  const n = Number(sar);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export function sarLabel(halalas) {
  const n = Number(halalas);
  if (!Number.isFinite(n)) return '0.00';
  return (n / 100).toFixed(2);
}

function publishableKey() {
  const key = String(process.env.MOYASAR_PUBLISHABLE_KEY || '').trim();
  if (!/^pk_(?:live|test)_[A-Za-z0-9_-]{8,}$/.test(key)) return '';
  return key;
}

function secretKey() {
  return String(process.env.MOYASAR_SECRET_KEY || '').trim();
}

function discordInvite(config) {
  const url = String(config && config.discord_invite || '').trim();
  return /^https:\/\/(?:discord\.gg\/|discord\.com\/invite\/)[A-Za-z0-9-]+\/?$/.test(url) ? url : '';
}

function storeName(config) {
  return String(config && (config.store_name || config.brand) || STORE_FALLBACK).trim() || STORE_FALLBACK;
}

function quoteProduct(product) {
  const amount = halalasFromSar(product && product.price);
  return {
    id: String(product.id),
    name: String(product.name || ''),
    duration: String(product.duration || ''),
    amount,
    amount_sar: sarLabel(amount),
    currency: CURRENCY,
  };
}

export async function handlePaymentsConfig(request) {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  const [products, config] = await Promise.all([loadProducts(), loadConfig()]);
  const list = (Array.isArray(products) ? products : [])
    .filter((product) => product && product.id && product.visible !== false)
    .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0))
    .map(quoteProduct);
  const key = publishableKey();
  return json({
    publishable_key: key,
    currency: CURRENCY,
    store_name: storeName(config),
    discord_invite: discordInvite(config),
    methods: ['creditcard', 'applepay', 'stcpay'],
    products: list,
    payments_ready: Boolean(key && secretKey()),
  });
}

function isInactive(status, body) {
  const type = String(body && body.type || '');
  const message = String(body && body.message || '');
  const blob = `${type} ${message}`;
  if (type === 'account_inactive_error') return true;
  if (/account_inactive|entity not activated|not activated to use live/i.test(blob)) return true;
  return status === 405 && /activated|inactive|live account/i.test(blob);
}

function productIdFromPayment(payment) {
  const meta = payment && payment.metadata;
  if (!meta || typeof meta !== 'object') return '';
  return String(meta.product_id || meta.productId || '').trim();
}

async function readPostedId(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 4000) return { error: 'الطلب كبير.', status: 413 };
  const raw = await request.text();
  if (raw.length > 4000) return { error: 'الطلب كبير.', status: 413 };
  try {
    const body = raw ? JSON.parse(raw) : {};
    return { id: String(body && body.id || '').trim() };
  } catch {
    return { error: 'تعذر قراءة الطلب.', status: 400 };
  }
}

function fail(error, code, status, extra = {}) {
  return json({ ok: false, paid: false, code, error, ...extra }, status);
}

export async function handlePaymentsVerify(request) {
  if (request.method !== 'GET' && request.method !== 'POST') return methodNotAllowed('GET, POST');

  const url = new URL(request.url);
  let id = String(url.searchParams.get('id') || '').trim();
  if (!id && request.method === 'POST') {
    const posted = await readPostedId(request);
    if (posted.error) return json({ ok: false, paid: false, error: posted.error }, posted.status);
    id = posted.id;
  }
  if (!PAYMENT_ID_RE.test(id)) {
    return fail('معرّف عملية الدفع غير صالح.', 'invalid_id', 400);
  }

  const secret = secretKey();
  if (!secret) return fail('الدفع الإلكتروني غير مهيأ على الخادم.', 'not_configured', 503);

  const auth = Buffer.from(`${secret}:`, 'utf8').toString('base64');
  let response;
  try {
    response = await fetch(`${MOYASAR_PAYMENT_URL}${id}`, {
      headers: { authorization: `Basic ${auth}`, accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('payments: moyasar unreachable', error && error.name);
    return fail('تعذر الاتصال بميسر. حدّث الصفحة بعد قليل.', 'upstream', 502);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || !body || typeof body !== 'object') {
    if (isInactive(response.status, body)) {
      return fail(ACCOUNT_INACTIVE_AR, 'account_inactive', 403);
    }
    if (response.status === 404) return fail('لم نجد عملية الدفع.', 'not_found', 404);
    console.error('payments: moyasar verify', response.status, body && body.type);
    return fail('تعذر التحقق من الدفع. إذا انخصم المبلغ افتح ديسكورد وأرسل رقم العملية.', 'upstream', 502);
  }
  if (body.id && String(body.id).toLowerCase() !== id.toLowerCase()) {
    return fail('استجابة التحقق لا تطابق عملية الدفع.', 'mismatch', 502);
  }

  const [products, config] = await Promise.all([loadProducts(), loadConfig()]);
  const invite = discordInvite(config);
  const productId = productIdFromPayment(body);
  const product = (Array.isArray(products) ? products : []).find((item) => item && item.id === productId);
  if (!product) {
    return fail('عملية الدفع غير مرتبطة بمنتج معروف، لذلك ما نعتبرها مكتملة.', 'unknown_product', 409, {
      discord_invite: invite,
    });
  }

  const expected = halalasFromSar(product.price);
  const amount = Number(body.amount);
  const currency = String(body.currency || '').toUpperCase();
  const status = String(body.status || '');
  const base = {
    discord_invite: invite,
    product: { id: product.id, name: String(product.name || ''), duration: String(product.duration || '') },
  };

  if (!Number.isInteger(amount) || amount !== expected || currency !== CURRENCY || expected < MIN_HALALAS) {
    return fail('المبلغ أو العملة لا تطابق سعر المنتج. لا نعتبر الطلب مكتملًا — راسلنا في الديسكورد مع رقم العملية.', 'amount_mismatch', 409, base);
  }

  if (status !== 'paid') {
    const error = status === 'failed'
      ? 'فشلت عملية الدفع. جرّب مرة ثانية أو اشترِ عبر ديسكورد.'
      : 'الدفع لم يكتمل بعد. إذا خُصم المبلغ حدّث الصفحة، أو افتح ديسكورد وأرسل رقم العملية.';
    return json({ ok: false, paid: false, code: 'not_paid', status, error, ...base });
  }

  return json({
    ok: true,
    paid: true,
    code: 'paid',
    status: 'paid',
    amount: expected,
    amount_sar: sarLabel(expected),
    currency: CURRENCY,
    message: 'تم الدفع بنجاح. افتح ديسكورد وافتح تذكرة عشان نسلمك المنتج.',
    ...base,
  });
}
