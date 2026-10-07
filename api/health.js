import { json, methodNotAllowed } from './_lib/_http.js';
import { handleChat } from './_lib/chat.js';
import { handlePaymentsConfig, handlePaymentsVerify } from './_lib/payments.js';
import { handleRates } from './_lib/rates.js';

function routeOf(request) {
  const url = new URL(request.url);
  const route = url.searchParams.get('route');
  if (route === 'chat' || url.pathname === '/api/chat') return 'chat';
  if (route === 'rates' || url.pathname === '/api/rates') return 'rates';
  if (route === 'payments-config' || url.pathname === '/api/payments/config') return 'payments-config';
  if (route === 'payments-verify' || url.pathname === '/api/payments/verify' || url.pathname.startsWith('/api/payments/verify/')) {
    return 'payments-verify';
  }
  return '';
}

export default { async fetch(request) {
  const route = routeOf(request);
  if (route === 'chat') return handleChat(request);
  if (route === 'rates') return handleRates(request);
  if (route === 'payments-config') return handlePaymentsConfig(request);
  if (route === 'payments-verify') return handlePaymentsVerify(request);
  if (request.method !== 'GET') return methodNotAllowed('GET');
  return json({
    ok: true,
    service: 'Deman.Store Vercel API',
    admin_password_configured: Boolean(process.env.ADMIN_PASSWORD),
    session_secret_configured: Boolean(process.env.SESSION_SECRET),
    moyasar_publishable_configured: Boolean(process.env.MOYASAR_PUBLISHABLE_KEY),
    moyasar_secret_configured: Boolean(process.env.MOYASAR_SECRET_KEY),
  });
}};
