import { get } from '@vercel/blob';
export default { async fetch(request) {
  if (request.method !== 'GET') return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
  const key=new URL(request.url).searchParams.get('key') || '';
  if (!/^[a-f0-9]{24}\.(?:png|jpg|webp)$/i.test(key)) return new Response('Not Found',{status:404});
  try {
    const result=await get('media/'+key,{access:'private',useCache:true});
    if (!result?.stream) return new Response('Not Found',{status:404});
    const headers=new Headers();
    headers.set('content-type', result.blob?.contentType || 'application/octet-stream');
    headers.set('cache-control','public, max-age=31536000, immutable');
    headers.set('x-content-type-options','nosniff');
    return new Response(result.stream,{status:200,headers});
  } catch(e) { console.error(e); return new Response('Not Found',{status:404}); }
}};
