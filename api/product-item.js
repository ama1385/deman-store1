import { json, readJson, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { requireAdmin } from './_lib/_auth.js';
import { loadProducts, saveProducts } from './_lib/_store.js';
import { cleanProduct } from './_lib/_product.js';
export default { async fetch(request) {
  try {
    requireAjax(request); requireAdmin(request);
    const id=new URL(request.url).searchParams.get('id') || '';
    if (!id) return json({error:'معرّف المنتج مفقود'},400);
    const list=await loadProducts(); const i=list.findIndex(p=>p.id===id);
    if (i<0) return json({error:'المنتج غير موجود'},404);
    if (request.method === 'PUT') {
      const body=await readJson(request); const product=cleanProduct(body,list[i]); product.id=list[i].id;
      list[i]=product; await saveProducts(list); return json({ok:true,product});
    }
    if (request.method === 'DELETE') {
      const [deleted]=list.splice(i,1); await saveProducts(list); return json({ok:true,product:deleted});
    }
    return methodNotAllowed('PUT, DELETE');
  } catch(e) { return errorResponse(e); }
}};
