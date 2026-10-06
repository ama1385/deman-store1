import { json, methodNotAllowed } from './_http.js';
import { SEED_CONFIG } from './_seed.js';
import { loadConfig } from './_store.js';
import { buildSystemPrompt } from './support-knowledge.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const MAX_MESSAGE_CHARS = 800;
const MAX_HISTORY = 12;
const MAX_TOKENS = 500;
const GROQ_TIMEOUT_MS = 8000;

const FRIENDLY_ERROR = 'عذراً، المساعد مشغول الحين. حاول مرة ثانية بعد قليل، أو كلم الدعم في سيرفر الديسكورد.';
const TOO_LONG_ERROR = 'الرسالة طويلة أو المحادثة كبيرة. اختصر سؤالك وأرسله مرة ثانية.';

const DISCORD_RE = /^https:\/\/(?:discord\.gg\/|discord\.com\/invite\/)[A-Za-z0-9-]+\/?$/;
const BAN_PROMISE_RE = /لن\s+(?:يتم\s+)?(?:حظره|يُحظر|ينحظر|يتبند|يتم\s+حظر)|ما\s+راح\s+(?:ينحظر|تنحظر|يتبند|يكون\s+فيه\s+باند)|بدون\s+باند|ما\s+فيه\s+باند|ضمان\s+عدم\s+الحظر|حسابك\s+(?:آمن|في\s+أمان)\s+من\s+الحظر|won'?t\s+be\s+banned|will\s+not\s+be\s+banned|\bno\s+ban\b|ban-free|never\s+be\s+banned/i;
const DISABLE_PROTECTION_RE = /windows\s*security|real-?\s*time\s*protection|virus\s*&\s*threat|defender|الحماية\s+اللحظ|إيقاف\s+الحماية|اطفاء\s+الحماية|إطفاء\s+الحماية|طف(?:ي|ّئ|ئ)?\s*الحماية|عطّ?ل\s+الحماية/i;

function friendly(status = 502) {
  return json({ error: FRIENDLY_ERROR }, status);
}

function isEnglish(text) {
  const letters = String(text || '').replace(/[^A-Za-z\u0600-\u06FF]/g, '');
  if (!letters) return false;
  const latin = (letters.match(/[A-Za-z]/g) || []).length;
  return latin / letters.length >= 0.6;
}

function cleanReply(text, english) {
  let out = String(text || '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  out = out.replace(/overset/ig, 'Deman.Store');
  if (!out) return '';
  if (out.length > 1800) out = out.slice(0, 1800).trim();
  if (DISABLE_PROTECTION_RE.test(out)) {
    return english
      ? 'If the file disappeared or the download is blocked, try another browser. If it still fails, a support staff member in the ticket will help you.'
      : 'إذا اختفى الملف أو انحظر التحميل، جرّب متصفح ثاني. وإذا استمرت المشكلة، حوّل التكت لموظف الدعم عشان يساعدك.';
  }
  if (BAN_PROMISE_RE.test(out)) {
    return english
      ? 'I can’t promise that a game account won’t be banned. I can only say the Deman.Store files are safe according to support, and the tool is external and does not enter the game files.'
      : 'ما أقدر أعدك إن حساب اللعبة ما ينحظر. اللي أقدر أقوله إن ملفات Deman.Store آمنة بحسب معلومات الدعم، والأداة خارجية وما تدخل ملفات اللعبة.';
  }
  return out;
}

function normalizeMessages(body) {
  const list = body && Array.isArray(body.messages) ? body.messages : null;
  if (!list) return { error: TOO_LONG_ERROR, status: 400 };
  const cleaned = [];
  for (const item of list) {
    if (!item || (item.role !== 'user' && item.role !== 'assistant')) continue;
    if (typeof item.content !== 'string') return { error: TOO_LONG_ERROR, status: 400 };
    const content = item.content.replace(/\u0000/g, '').trim();
    if (!content) continue;
    if (content.length > MAX_MESSAGE_CHARS) return { error: TOO_LONG_ERROR, status: 400 };
    cleaned.push({ role: item.role, content });
  }
  if (cleaned.length > MAX_HISTORY) return { error: TOO_LONG_ERROR, status: 400 };
  if (!cleaned.some((m) => m.role === 'user')) return { error: 'اكتب سؤالك وأرسله مرة ثانية.', status: 400 };
  return { messages: cleaned };
}

async function discordInvite() {
  const fallback = String(SEED_CONFIG.discord_invite || '').trim();
  try {
    const config = await loadConfig();
    const live = String(config && config.discord_invite || '').trim();
    if (DISCORD_RE.test(live)) return live;
  } catch (error) {
    console.error('chat: config unavailable');
  }
  return DISCORD_RE.test(fallback) ? fallback : '';
}

async function readBody(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 20_000) return { error: TOO_LONG_ERROR, status: 413 };
  const raw = await request.text();
  if (raw.length > 20_000) return { error: TOO_LONG_ERROR, status: 413 };
  try { return { body: raw ? JSON.parse(raw) : {} }; }
  catch { return { error: 'تعذر قراءة الرسالة. أعد الإرسال.', status: 400 }; }
}

export async function handleChat(request) {
  if (request.method !== 'POST') return methodNotAllowed('POST');

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('chat: GROQ_API_KEY is not set');
    return friendly(503);
  }

  try {
    const parsed = await readBody(request);
    if (parsed.error) return json({ error: parsed.error }, parsed.status);
    const normalized = normalizeMessages(parsed.body);
    if (normalized.error) return json({ error: normalized.error }, normalized.status);

    const invite = await discordInvite();
    const latestUser = [...normalized.messages].reverse().find((m) => m.role === 'user');
    const english = isEnglish(latestUser && latestUser.content);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
    let groqRes;
    try {
      groqRes = await fetch(GROQ_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: buildSystemPrompt(invite) },
            ...normalized.messages
          ],
          max_completion_tokens: MAX_TOKENS,
          temperature: 0.5,
          reasoning_effort: 'low',
          include_reasoning: false
        })
      });
    } finally {
      clearTimeout(timer);
    }

    if (!groqRes.ok) {
      console.error('chat: upstream status', groqRes.status);
      return friendly(502);
    }

    const data = await groqRes.json().catch(() => null);
    const message = data && data.choices && data.choices[0] && data.choices[0].message;
    let content = '';
    if (message && typeof message.content === 'string') content = message.content;
    else if (message && Array.isArray(message.content)) {
      content = message.content.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('\n');
    }
    const reply = cleanReply(content, english);
    if (!reply) {
      console.error('chat: empty upstream reply');
      return friendly(502);
    }
    return json({ reply });
  } catch (error) {
    console.error('chat: request failed', error && error.name ? error.name : 'error');
    return friendly(502);
  }
}
