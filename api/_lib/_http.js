export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

export function methodNotAllowed(allow) {
  return json({ error: 'Method Not Allowed' }, 405, { allow });
}

export async function readJson(request) {
  try { return await request.json(); }
  catch { throw Object.assign(new Error('JSON غير صالح'), { status: 400 }); }
}

export function errorResponse(error) {
  console.error(error);
  const status = Number(error?.status) || 500;
  return json({ error: status >= 500 ? 'حدث خطأ في الخادم' : (error?.message || 'خطأ') }, status);
}

export function requireAjax(request) {
  if (request.headers.get('x-requested-with') !== 'deman-admin') {
    throw Object.assign(new Error('طلب غير مسموح'), { status: 403 });
  }
}
