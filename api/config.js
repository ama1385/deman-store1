import { json, readJson, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { requireAdmin } from './_lib/_auth.js';
import { loadConfig, saveConfig } from './_lib/_store.js';
export default { async fetch(request) {
  try {
    if (request.method === 'GET') return json(await loadConfig());
    if (request.method === 'PUT') {
      requireAjax(request); requireAdmin(request);
      const current=await loadConfig(); const body=await readJson(request);
      const next={...current,...body}; await saveConfig(next);
      return json({ ok:true, config:next });
    }
    return methodNotAllowed('GET, PUT');
  } catch(e) { return errorResponse(e); }
}};
