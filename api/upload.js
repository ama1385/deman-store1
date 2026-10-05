import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { json, errorResponse, methodNotAllowed, requireAjax } from './_lib/_http.js';
import { requireAdmin } from './_lib/_auth.js';
const TYPES={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
const MAX=2*1024*1024;
export default { async fetch(request) {
  if (request.method !== 'POST') return methodNotAllowed('POST');
  try {
    requireAjax(request); requireAdmin(request);
    const type=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if (!TYPES[type]) return json({error:'نوع الصورة غير مدعوم (PNG / JPG / WEBP فقط)'},415);
    const data=Buffer.from(await request.arrayBuffer());
    if (!data.length) return json({error:'ملف فارغ'},400);
    if (data.length>MAX) return json({error:'الصورة أكبر من 2MB'},413);
    const key=crypto.randomBytes(12).toString('hex')+'.'+TYPES[type];
    try {
      await put('media/'+key, data, { access:'private', contentType:type, addRandomSuffix:false });
    } catch (e) {
      console.error(e); throw Object.assign(new Error('تعذر رفع الصورة. اربط Private Vercel Blob بالمشروع.'),{status:503});
    }
    return json({ok:true,url:'/api/img/'+key});
  } catch(e) { return errorResponse(e); }
}};
