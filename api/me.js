import { json, methodNotAllowed } from './_lib/_http.js';
import { isAdmin } from './_lib/_auth.js';
export default { async fetch(request) {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  return json({ admin: isAdmin(request) });
}};
