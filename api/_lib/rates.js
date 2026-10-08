import { json, methodNotAllowed } from './_http.js';

/**
 * Display-only exchange rates: how much of each currency one SAR buys.
 * Prices are stored and charged in SAR; the storefront uses these to show an approximate
 * price in the visitor's currency. To offer another currency add it here and to
 * CURRENCIES in js/i18n.js.
 *
 * FALLBACK is used whenever the live source is unreachable (values of 2026-10-07).
 */
const FALLBACK = {
  USD: 0.266667,
  EUR: 0.2374,
  GBP: 0.2013,
  AED: 0.979333,
  KWD: 0.0826,
  QAR: 0.970667,
  BHD: 0.100267,
  OMR: 0.1026,
  EGP: 13.95,
};

// Free daily rates (CC0), served from two independent hosts.
const SOURCES = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/sar.min.json',
  'https://latest.currency-api.pages.dev/v1/currencies/sar.min.json',
];
const SOURCE_TIMEOUT_MS = 2500;
const MEMORY_TTL_MS = 6 * 60 * 60 * 1000;
// A live value further than this from the fallback is treated as bad data and ignored.
const MAX_DRIFT = 2;

let memory = null;

/** Keeps only the currencies we offer, and only values that look sane. */
export function pickRates(payload) {
  const table = payload && typeof payload === 'object' ? payload.sar : null;
  if (!table || typeof table !== 'object') return null;
  const rates = {};
  for (const [code, fallback] of Object.entries(FALLBACK)) {
    const value = Number(table[code.toLowerCase()]);
    const sane = Number.isFinite(value) && value > fallback / MAX_DRIFT && value < fallback * MAX_DRIFT;
    rates[code] = sane ? value : fallback;
  }
  return { rates, date: typeof payload.date === 'string' ? payload.date.slice(0, 10) : null };
}

async function fetchLive() {
  for (const url of SOURCES) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
      if (!response.ok) continue;
      const picked = pickRates(await response.json());
      if (picked) return picked;
    } catch (error) {
      console.warn('rates: source unavailable', error && error.name);
    }
  }
  return null;
}

export async function handleRates(request) {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  if (!memory || Date.now() - memory.at > MEMORY_TTL_MS) {
    const live = await fetchLive();
    if (live) memory = { at: Date.now(), ...live };
  }
  const live = Boolean(memory);
  return json(
    { base: 'SAR', rates: { SAR: 1, ...(live ? memory.rates : FALLBACK) }, date: live ? memory.date : null, live },
    200,
    // Shared by every visitor: the CDN keeps it for 6 hours and refreshes in the background.
    { 'cache-control': live ? 'public, max-age=600, s-maxage=21600, stale-while-revalidate=86400' : 'public, max-age=60, s-maxage=300' },
  );
}
