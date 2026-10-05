import { json, methodNotAllowed } from './_lib/_http.js';
import { clearSessionCookie } from './_lib/_auth.js';
export default { async fetch(request) {
  if (request.method !== 'POST') return methodNotAllowed('POST');
  return json({ ok:true }, 200, { 'set-cookie': clearSessionCookie(request) });
}};
