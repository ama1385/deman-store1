import { json, readJson, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { requireAdmin, isAdmin } from './_lib/_auth.js';
import { loadProducts, saveProducts } from './_lib/_store.js';
import { cleanProduct, newProductId } from './_lib/_product.js';
export default { async fetch(request) {
  try {
    const url=new URL(request.url);
    if (request.method === 'GET') {
      const all=url.searchParams.get('all') === '1';
      if (all && !isAdmin(request)) return json({error:'غير مصرح'},401);
      let list=await loadProducts();
      if (!all) list=list.filter(p=>p.visible !== false);
      list.sort((a,b)=>(Number(a.sort)||0)-(Number(b.sort)||0));
      return json(list);
    }
    if (request.method === 'POST') {
      requireAjax(request); requireAdmin(request);
      const list=await loadProducts(); const body=await readJson(request);
      const product=cleanProduct(body); product.id=newProductId(product.name,list);
      list.push(product); await saveProducts(list);
      return json({ok:true,product},201);
    }
    return methodNotAllowed('GET, POST');
  } catch(e) { return errorResponse(e); }
}};
