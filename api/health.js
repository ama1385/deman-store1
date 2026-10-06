import { json, methodNotAllowed } from './_lib/_http.js';
import { handleChat } from './_lib/chat.js';

function isChat(request) {
  const url = new URL(request.url);
  return url.searchParams.get('route') === 'chat' || url.pathname === '/api/chat';
}

export default { async fetch(request) {
  if (isChat(request)) return handleChat(request);
  if (request.method !== 'GET') return methodNotAllowed('GET');
  return json({ok:true,service:'Deman.Store Vercel API',admin_password_configured:Boolean(process.env.ADMIN_PASSWORD),session_secret_configured:Boolean(process.env.SESSION_SECRET)});
}};
