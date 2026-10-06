import crypto from 'node:crypto';

function str(v, max=1200) { return String(v == null ? '' : v).slice(0,max); }
function num(v, d=0) { const n=Number(v); return Number.isFinite(n) ? n : d; }
function bool(v, d=false) { return typeof v === 'boolean' ? v : d; }

export function cleanReview(input, previous = {}, admin = false) {
  const o={...previous}; input=input||{};
  if ('name' in input) o.name=str(input.name,80).trim();
  if ('text' in input) o.text=str(input.text,1200).trim();
  if ('stars' in input) o.stars=Math.min(5,Math.max(1,Math.round(num(input.stars,5))));
  if ('product_id' in input) o.product_id=str(input.product_id,100).trim();
  if (!o.name || o.name.length < 2) throw Object.assign(new Error('الاسم مطلوب'), {status:400});
  if (!o.text || o.text.length < 5) throw Object.assign(new Error('اكتب رأيك بشكل أوضح'), {status:400});
  if (!o.stars) o.stars=5;
  if (admin) {
    if ('status' in input) o.status=['approved','pending','hidden'].includes(input.status) ? input.status : 'pending';
    if ('verified' in input) o.verified=bool(input.verified,false);
    if ('demo' in input) o.demo=bool(input.demo,false);
  } else {
    o.status='pending'; o.verified=false; o.demo=false;
  }
  return o;
}

export function newReviewId(existing=[]) {
  const ids=new Set(existing.map(x=>x.id)); let id;
  do { id='rv-'+Date.now().toString(36)+'-'+crypto.randomBytes(3).toString('hex'); } while(ids.has(id));
  return id;
}
