import { get, put } from '@vercel/blob';
import { SEED_PRODUCTS, SEED_CONFIG, SEED_REVIEWS } from './_seed.js';

const ACCESS = 'private';
const PRODUCT_PATH = 'data/products.json';
const CONFIG_PATH = 'data/config.json';
const REVIEWS_PATH = 'data/reviews.json';

function clone(v) { return JSON.parse(JSON.stringify(v)); }

async function readPrivateJson(pathname, fallback) {
  try {
    const result = await get(pathname, { access: ACCESS, useCache: false });
    if (!result?.stream) return clone(fallback);
    return JSON.parse(await new Response(result.stream).text());
  } catch (error) {
    // Before the first write the object does not exist. Also lets the recovered
    // storefront render before Blob is connected; writes still require Blob.
    console.warn(`Blob read fallback for ${pathname}:`, error?.message || error);
    return clone(fallback);
  }
}

async function writePrivateJson(pathname, value) {
  try {
    await put(pathname, JSON.stringify(value, null, 2), {
      access: ACCESS,
      contentType: 'application/json; charset=utf-8',
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
  } catch (error) {
    console.error('Blob write failed:', error);
    throw Object.assign(new Error('التخزين غير مربوط. اربط Private Vercel Blob بالمشروع ثم أعد المحاولة.'), { status: 503 });
  }
  return value;
}

export const loadProducts = () => readPrivateJson(PRODUCT_PATH, SEED_PRODUCTS);
export const saveProducts = (v) => writePrivateJson(PRODUCT_PATH, v);
export const loadConfig = () => readPrivateJson(CONFIG_PATH, SEED_CONFIG);
export const saveConfig = (v) => writePrivateJson(CONFIG_PATH, v);
export const loadReviews = () => readPrivateJson(REVIEWS_PATH, SEED_REVIEWS);
export const saveReviews = (v) => writePrivateJson(REVIEWS_PATH, v);
