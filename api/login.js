import { json, readJson, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { checkPassword, createSession, sessionCookie, passwordConfigured } from './_lib/_auth.js';
export default { async fetch(request) {
  if (request.method !== 'POST') return methodNotAllowed('POST');
  try {
    requireAjax(request);
    if (!passwordConfigured()) return json({ error: 'ADMIN_PASSWORD و SESSION_SECRET لازم تنضبط في Vercel.' }, 503);
    const body=await readJson(request);
    if (!checkPassword(body.password)) return json({ error: 'كلمة المرور غير صحيحة' }, 401);
    return json({ ok:true }, 200, { 'set-cookie': sessionCookie(request, createSession()) });
  } catch(e) { return errorResponse(e); }
}};
