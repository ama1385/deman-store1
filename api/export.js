import { json, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { requireAdmin } from './_lib/_auth.js';
import { loadProducts, loadConfig } from './_lib/_store.js';
export default { async fetch(request) {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  try { requireAjax(request); requireAdmin(request); return json({exported_at:new Date().toISOString(),config:await loadConfig(),products:await loadProducts()}); }
  catch(e) { return errorResponse(e); }
}};
