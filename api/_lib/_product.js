import crypto from 'node:crypto';

const ALLOWED = [
  'name','category','featured','badge','duration','short','description','price','old_price','rating','reviews_count',
  'features','included','delivery','faq','images','visible','sort','buy_link','currency','demo'
];

function str(v, max=5000) { return String(v == null ? '' : v).slice(0,max); }
function arr(v, max=30) { return Array.isArray(v) ? v.slice(0,max) : []; }
function bool(v, d=false) { return typeof v === 'boolean' ? v : d; }
function num(v, d=0) { const n=Number(v); return Number.isFinite(n) ? n : d; }

export function cleanProduct(input, previous = {}) {
  const o = { ...previous };
  for (const k of ALLOWED) if (Object.prototype.hasOwnProperty.call(input || {}, k)) o[k]=input[k];
  o.name=str(o.name,300).trim();
  if (!o.name) throw Object.assign(new Error('اسم المنتج مطلوب'), { status: 400 });
  o.category=str(o.category,80).trim();
  o.badge=str(o.badge,120).trim();
  o.duration=str(o.duration,120).trim();
  o.short=str(o.short,1000).trim();
  o.description=str(o.description,5000);
  o.price=num(o.price,0);
  o.old_price=(o.old_price === '' || o.old_price == null) ? null : num(o.old_price,0);
  o.rating=num(o.rating,5);
  o.reviews_count=num(o.reviews_count,0);
  o.features=arr(o.features,40).map(x=>str(x,300).trim()).filter(Boolean);
  o.included=arr(o.included,40).map(x=>str(x,300).trim()).filter(Boolean);
  o.delivery=str(o.delivery,1500);
  o.faq=arr(o.faq,40).map(f=>({q:str(f?.q,300).trim(),a:str(f?.a,1200).trim()})).filter(f=>f.q||f.a);
  o.images=arr(o.images,12).map(x=>str(x,1000).trim()).filter(x=>/^(https:\/\/|\/api\/img\/|\/images\/)/i.test(x));
  o.visible=bool(o.visible,true); o.featured=bool(o.featured,false); o.demo=bool(o.demo,false);
  o.sort=num(o.sort,0); o.buy_link=str(o.buy_link,1000).trim(); o.currency=str(o.currency,20).trim();
  return o;
}

export function newProductId(name, existing) {
  let base=String(name||'product').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
  if (!base) base='product';
  let id=base;
  const ids=new Set(existing.map(x=>x.id));
  while(ids.has(id)) id=base+'-'+crypto.randomBytes(3).toString('hex');
  return id;
}
