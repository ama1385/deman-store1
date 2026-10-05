import { json, methodNotAllowed } from './_lib/_http.js';
export default { async fetch(request) {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  return json({ok:true,service:'Deman.Store Vercel API',admin_password_configured:Boolean(process.env.ADMIN_PASSWORD),session_secret_configured:Boolean(process.env.SESSION_SECRET)});
}};
