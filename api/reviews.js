import { json, readJson, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { isAdmin } from './_lib/_auth.js';
import { loadReviews, saveReviews } from './_lib/_store.js';
import { cleanReview, newReviewId } from './_lib/_review.js';

export default { async fetch(request) {
  try {
    const url=new URL(request.url);
    if (request.method === 'GET') {
      const all=url.searchParams.get('all') === '1';
      if (all && !isAdmin(request)) return json({error:'غير مصرح'},401);
      let list=await loadReviews();
      if (!all) list=list.filter(r=>r.status==='approved');
      list=list.slice().sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
      return json(list);
    }
    if (request.method === 'POST') {
      const admin=request.headers.get('x-requested-with') === 'deman-admin' && isAdmin(request);
      if (admin) requireAjax(request);
      const body=await readJson(request);
      // honeypot: pretend success for bots
      if (!admin && String(body.website||'').trim()) return json({ok:true,pending:true},202);
      const list=await loadReviews();
      const review=cleanReview(body,{},admin);
      review.id=newReviewId(list);
      review.created_at=new Date().toISOString();
      review.source=admin ? 'admin' : 'customer';
      if (admin && !body.status) review.status='approved';
      list.push(review); await saveReviews(list);
      return json(admin ? {ok:true,review} : {ok:true,pending:true,message:'شكراً لك — تم إرسال رأيك للمراجعة قبل النشر.'}, admin?201:202);
    }
    return methodNotAllowed('GET, POST');
  } catch(e) { return errorResponse(e); }
}};
