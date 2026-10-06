import { json, readJson, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { requireAdmin } from './_lib/_auth.js';
import { loadReviews, saveReviews } from './_lib/_store.js';
import { cleanReview } from './_lib/_review.js';

export default { async fetch(request) {
  try {
    requireAjax(request); requireAdmin(request);
    const id=new URL(request.url).searchParams.get('id') || '';
    if (!id) return json({error:'معرّف الرأي مفقود'},400);
    const list=await loadReviews(), i=list.findIndex(r=>r.id===id);
    if (i<0) return json({error:'الرأي غير موجود'},404);
    if (request.method === 'PUT') {
      const body=await readJson(request); const next=cleanReview(body,list[i],true);
      next.id=list[i].id; next.created_at=list[i].created_at; next.source=list[i].source || 'admin';
      list[i]=next; await saveReviews(list); return json({ok:true,review:next});
    }
    if (request.method === 'DELETE') {
      const [deleted]=list.splice(i,1); await saveReviews(list); return json({ok:true,review:deleted});
    }
    return methodNotAllowed('PUT, DELETE');
  } catch(e) { return errorResponse(e); }
}};
