/* Deman.Store — البيانات تنقرأ من /api/config و /api/products (Cloudflare Pages Functions + KV) */
(function () {
  "use strict";
  var ICONS = {
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.4C.6 9.1-.3 13.6.1 18.1A19.9 19.9 0 0 0 6.2 21l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6.1-3c.5-5.2-.9-9.7-3.6-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7 7 17M17 7H9M17 7v8"/></svg>',
    arrowl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9L12 3Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>'
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function icons(root) { $$("svg[data-ic]", root).forEach(function (el) { el.outerHTML = ICONS[el.getAttribute("data-ic")] || ""; }); }
  function starStr(r) { var n = Math.round(Number(r) || 0), s = ""; for (var i = 0; i < 5; i++) s += i < n ? "★" : "☆"; return s; }
  function load(u) {
    if (location.protocol === "file:" && window.DEMAN_LOCAL_SEED) {
      if (u === "/api/config") return Promise.resolve(window.DEMAN_LOCAL_SEED.config);
      if (u === "/api/products") return Promise.resolve(window.DEMAN_LOCAL_SEED.products);
      if (u === "/api/reviews") return Promise.resolve(window.DEMAN_LOCAL_SEED.reviews || []);
    }
    return fetch(u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); });
  }

  var CFG = {}, CUR = "ر.س";
  function curOf(p) { return (p && p.currency) || CUR; }
  function buyOf(p) { return (p && p.buy_link) || CFG.discord_invite || "#"; }
  function safeImg(u) { u = String(u || ""); if (location.protocol === "file:" && /^\/images\//.test(u)) u = u.slice(1); return /^(https?:\/\/|\/api\/img\/|\/?images\/)/.test(u) ? u : ""; }
  function shortOf(p) { if (p.short) return p.short; var d = String(p.description || "").split("\n")[0]; return d.length > 140 ? d.slice(0, 140) + "…" : d; }
  function priceHTML(p) {
    var o = Number(p.old_price), n = Number(p.price), off = o > n ? Math.round((1 - n / o) * 100) : 0;
    return '<div class="price"><b>' + esc(p.price) + '<small>' + esc(curOf(p)) + '</small></b>' +
      (off ? '<s>' + esc(p.old_price) + ' ' + esc(curOf(p)) + '</s><span class="off">-' + off + '٪</span>' : "") + "</div>";
  }
  function payHTML() {
    var pm = CFG.payment_methods || [];
    if (!pm.length) return "";
    return '<div class="pay">' + pm.map(function (m) {
      var ic = safeImg(m.icon) ? '<img src="' + esc(m.icon) + '" alt="">' : (m.icon ? '<i>' + esc(m.icon) + '</i>' : "");
      return '<span class="pay-m">' + ic + esc(m.name) + '</span>';
    }).join("") + '</div>';
  }
  function badgeHTML(p) {
    if (!p.badge) return "";
    var isNew = /جديد|new/i.test(p.badge);
    return '<span class="badge' + (isNew ? " new" : "") + '">' + esc(p.badge) + "</span>";
  }
  function salesHTML(p, cls) {
    var n=Math.max(0,Math.floor(Number(p && p.purchases_count)||0)); if(!n) return '';
    var label=String(CFG.purchase_label || 'طلب').trim() || 'طلب';
    return '<span class="sales-pill '+(cls||'')+'" dir="rtl">'+ICONS.bag+'<span class="sales-copy"><b class="js-count" data-count="'+n+'">0</b><span>'+esc(label)+'</span></span></span>';
  }
  function animateCounts(root) {
    var els=$$('.js-count:not([data-done])',root||document); if(!els.length)return;
    var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    function go(el){if(el.dataset.done)return;el.dataset.done='1';var end=Math.max(0,Math.floor(Number(el.dataset.count)||0));if(reduce){el.textContent=end.toLocaleString('ar-SA');el.classList.add('count-done');return;}var st=performance.now(),dur=Math.min(1600,650+end*3);function tick(now){var t=Math.min(1,(now-st)/dur),e=1-Math.pow(1-t,3);el.textContent=Math.round(end*e).toLocaleString('ar-SA');if(t<1)requestAnimationFrame(tick);else el.classList.add('count-done');}requestAnimationFrame(tick);}
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){go(e.target);io.unobserve(e.target);}});},{threshold:.4});els.forEach(function(el){io.observe(el);});}else els.forEach(go);
  }
  function nameHTML(n) {
    var parts = String(n || "").split(" — ");
    return esc(parts[0]) + (parts[1] ? '<span class="sub">' + esc(parts.slice(1).join(" — ")) + "</span>" : "");
  }
  function card(p) {
    var img = safeImg(p.images && p.images[0]) || "images/logo-512.png";
    var url = "product.html?id=" + encodeURIComponent(p.id);
    return '<article class="card rv">' + (p.badge && p.badge === p.duration ? "" : badgeHTML(p)) + (p.demo ? '<span class="demo">مثال</span>' : '') +
      '<a class="th" href="' + url + '" aria-label="' + esc(p.name) + '"><img loading="lazy" src="' + esc(img) + '" alt="' + esc(p.name) + '">' +
      (p.duration ? '<span class="dur">' + ICONS.clock + esc(p.duration) + '</span>' : '') + '</a>' +
      '<div class="bd"><h3><a href="' + url + '">' + nameHTML(p.name) + '</a></h3>' +
      '<p class="ds">' + esc(shortOf(p)) + "</p>" + salesHTML(p,'card-sales') + priceHTML(p) +
      '<div class="card-act"><a class="btn btn-o" href="' + esc(buyOf(p)) + '" target="_blank" rel="noopener">' + ICONS.discord + 'اشترِ عبر ديسكورد</a>' +
      '<a class="btn btn-o btn-i" href="' + url + '" aria-label="التفاصيل" title="التفاصيل">' + ICONS.eye + '</a></div></div></article>';
  }

  function observe() {
    if (!("IntersectionObserver" in window)) { $$(".rv").forEach(function (e) { e.classList.add("in"); }); animateCounts(document); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    $$(".rv:not(.in)").forEach(function (e) { io.observe(e); });
    animateCounts(document);
  }
  function applyConfig() {
    CUR = CFG.currency || CUR;
    var ann = $(".demo-flag");
    if (ann) { if (CFG.announcement) { ann.textContent = CFG.announcement; ann.hidden = false; } else ann.hidden = true; }
    var sn = CFG.store_name || CFG.brand;
    if (sn) $$(".brand-t b").forEach(function (b) { var i = sn.indexOf("."); b.innerHTML = i > 0 ? esc(sn.slice(0, i)) + "<i>" + esc(sn.slice(i)) + "</i>" : esc(sn); });
    $$(".js-pay").forEach(function (e) { var h = payHTML(); e.innerHTML = h ? "<h4>طرق الدفع</h4>" + h : ""; e.hidden = !h; });
    $$(".js-discord").forEach(function (a) { a.href = CFG.discord_invite || "#"; });
    $$(".js-brand-ar").forEach(function (e) { e.textContent = CFG.brand_ar || e.textContent; });
    $$(".js-domain").forEach(function (e) { e.textContent = CFG.domain || ""; });
    $$(".js-year").forEach(function (e) { e.textContent = new Date().getFullYear(); });
    if ($(".js-hero-title") && CFG.hero_title) $(".js-hero-title").textContent = CFG.hero_title;
    if ($(".js-hero-sub")) $(".js-hero-sub").textContent = CFG.hero_subtitle || "";
    var fabLabel=$("#discordFabLabel"); if(fabLabel) fabLabel.textContent=CFG.floating_discord_label || "ديسكورد";
    var fab=$("#discordFab"); if(fab){fab.title=CFG.floating_discord_label || "ديسكورد";fab.setAttribute("aria-label",CFG.floating_discord_label || "ديسكورد");}
    var live=$("#liveVisitors");
    if(live){
      var liveN=Math.max(0,Math.floor(Number(CFG.live_visitors_count)||0));
      var liveLabel=$("#liveVisitorsLabel"); if(liveLabel) liveLabel.textContent=CFG.live_visitors_label || "زائر يتصفح المتجر الآن";
      if(liveN>0){live.hidden=false;var lc=$(".live-count",live);lc.dataset.count=String(liveN);lc.textContent="0";lc.removeAttribute("data-done");setTimeout(function(){animateCounts(live);},80);}else live.hidden=true;
    }
  }

  function initPurchasePopups(products){
    var enabled=CFG.purchase_popup_enabled!==false && CFG.purchase_popup_enabled!=="false";
    var list=(CFG.recent_purchases||[]).filter(function(x){return x && x.enabled!==false && x.buyer && x.product_id;});
    if(!enabled || !list.length)return;
    var map={};products.forEach(function(p){map[p.id]=p;});
    list=list.filter(function(x){return !!map[x.product_id];}).sort(function(a,b){return String(b.created_at||"").localeCompare(String(a.created_at||""));});
    if(!list.length)return;
    var box=document.getElementById('purchaseToast');
    if(!box){box=document.createElement('aside');box.id='purchaseToast';box.className='purchase-toast';box.setAttribute('aria-live','polite');box.hidden=true;document.body.appendChild(box);}
    function ago(v){
      var t=new Date(v).getTime();if(!isFinite(t))return '';
      var sec=Math.max(0,Math.floor((Date.now()-t)/1000)); if(sec<45)return 'الآن';
      var m=Math.floor(sec/60);if(m<60){if(m===1)return 'قبل دقيقة';if(m===2)return 'قبل دقيقتين';return 'قبل '+m+' '+(m<=10?'دقائق':'دقيقة');}
      var h=Math.floor(m/60);if(h<24){if(h===1)return 'قبل ساعة';if(h===2)return 'قبل ساعتين';return 'قبل '+h+' ساعات';}
      var d=Math.floor(h/24);if(d===1)return 'أمس';if(d===2)return 'قبل يومين';return 'قبل '+d+' أيام';
    }
    function cartIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H7"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>';}
    var title=String(CFG.purchase_popup_title||'شراء جديد').trim()||'شراء جديد';
    var duration=Math.max(2,Math.min(15,Math.floor(Number(CFG.purchase_popup_duration)||6)))*1000;
    var interval=Math.max(5,Math.min(120,Math.floor(Number(CFG.purchase_popup_interval)||12)))*1000;
    var i=0, hideTimer;
    function showOne(){
      if(i>=list.length)return; var x=list[i++],p=map[x.product_id];
      box.innerHTML='<div class="purchase-toast-icon">'+cartIcon()+'</div><div class="purchase-toast-copy"><b><span class="purchase-toast-confetti">🎉</span>'+esc(title)+'</b><p>قام <strong>'+esc(x.buyer)+'</strong> بشراء</p><a href="product.html?id='+encodeURIComponent(p.id)+'">'+esc(p.name)+'</a><small>'+esc(ago(x.created_at))+'</small></div>';
      box.hidden=false; requestAnimationFrame(function(){requestAnimationFrame(function(){box.classList.add('show');});});
      clearTimeout(hideTimer);hideTimer=setTimeout(function(){box.classList.remove('show');setTimeout(function(){box.hidden=true;if(i<list.length)setTimeout(showOne,Math.max(600,interval-duration));},420);},duration);
    }
    setTimeout(showOne,1800);
  }

  function home(products, reviews) {
    var fq = $("#faqList");
    if (fq) fq.innerHTML = (CFG.faq || []).map(function (f, i) { return "<details class=\"rv\"" + (i === 0 ? " open" : "") + "><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>"; }).join("");
    var cats = CFG.categories || [{ id: "all", name: "الكل" }];
    var f = $("#filters");
    f.innerHTML = cats.map(function (c, i) { return '<button class="chip' + (i === 0 ? " on" : "") + '" data-c="' + esc(c.id) + '">' + esc(c.name) + "</button>"; }).join("");
    function render(c) {
      var list = products.filter(function (p) { return c === "all" || p.category === c; });
      var g = $("#allGrid");
      g.classList.toggle("few", list.length < 4);
      g.innerHTML = list.length ? list.map(card).join("") : '<p style="color:var(--mut);text-align:center;grid-column:1/-1">ما فيه منتجات في هذي الفئة حالياً.</p>';
      observe();
    }
    f.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      $$(".chip", f).forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); render(b.getAttribute("data-c"));
    });
    render("all");
    var proof=$('#storeProof'); if(proof){
      var total=products.reduce(function(t,p){return t+Math.max(0,Math.floor(Number(p.purchases_count)||0));},0);
      var realReviews=(reviews||[]).filter(function(r){return r && r.status!=='hidden' && !r.demo;}).length;
      if(total>0 || realReviews>0){proof.hidden=false;proof.innerHTML=(total>0?'<div class="proof-item"><span class="proof-ico">'+ICONS.bag+'</span><div><b class="js-count proof-count" data-count="'+total+'">0</b><small>'+esc(CFG.total_sales_label || 'طلب مكتمل')+'</small></div></div>':'')+(realReviews>0?'<div class="proof-item"><span class="proof-ico">'+ICONS.star+'</span><div><b class="js-count proof-count" data-count="'+realReviews+'">0</b><small>'+esc(CFG.published_reviews_label || 'تقييم من العملاء')+'</small></div></div>':'');animateCounts(proof);}
    }
    function productName(id) { var p=products.filter(function(x){return x.id===id;})[0]; return p ? p.name : ''; }
    function renderReviews(list) {
      var box=$('#revs');
      list=(list||[]).filter(function(r){return r && r.status!=='hidden' && !r.demo;});
      box.innerHTML=list.map(function(r,i){var pn=productName(r.product_id);return '<article class="rev rv" style="transition-delay:'+(i%6)*55+'ms"><div class="rev-head"><div class="rev-person"><span class="av">'+esc((r.name||'؟').charAt(0))+'</span><div><b>'+esc(r.name)+'</b>'+(pn?'<span>'+esc(pn)+'</span>':'')+'</div></div><div class="stars" aria-label="'+esc(r.stars)+' من 5">'+starStr(r.stars)+'</div></div><p class="rev-text">“'+esc(r.text)+'”</p><div class="rev-badges">'+(r.verified?'<span class="rev-badge verified">✓ شراء موثّق</span>':'')+'</div></article>';}).join('') || '<p style="color:var(--mut);text-align:center;grid-column:1/-1">ما فيه آراء منشورة حتى الآن — كن أول من يشارك تجربته.</p>';
      observe();
    }
    renderReviews(reviews || []);
    var rp=$('#reviewProduct'); if(rp) rp.innerHTML='<option value="">— اختر المنتج —</option>'+products.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>';}).join('');
    var rf=$('#reviewForm'); if(rf) rf.addEventListener('submit',function(e){e.preventDefault();var b=$('#reviewSubmit'),msg=$('#reviewMsg');msg.className='';msg.textContent='';b.disabled=true;var data={name:rf.name.value,product_id:rf.product_id.value,stars:rf.stars.value,text:rf.text.value,website:rf.website.value};fetch('/api/reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),cache:'no-store'}).then(function(r){return r.json().catch(function(){return {};}).then(function(d){if(!r.ok)throw new Error(d.error||'تعذر إرسال الرأي');return d;});}).then(function(d){rf.reset();msg.className='ok';msg.textContent=d.message||'شكراً لك — تم استلام رأيك.';}).catch(function(x){msg.className='bad';msg.textContent=x.message;}).then(function(){b.disabled=false;});});
  }

  /* ===================== product page (v3) ===================== */
  function fmt(n) { var x = Number(n); return isFinite(x) ? x.toLocaleString("en-US", { maximumFractionDigits: 2 }) : esc(n); }
  function toLatin(s) { return String(s || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }
  // يحوّل نص المدة (يوم واحد / 3 أشهر / سنة / 1 Year …) لعدد أيام تقريبي — للترتيب وسعر اليوم فقط
  function daysOf(p) {
    var s = toLatin((p.duration || "") + " " + (p.duration ? "" : p.name || "")).toLowerCase();
    if (/مدى الحياة|دائم|lifetime|forever/.test(s)) return Infinity;
    var u = /سنتين|سنة|سنه|سنوات|عام|year/.test(s) ? 365 : /شهرين|شهر|أشهر|اشهر|شهور|month/.test(s) ? 30 :
      /أسبوعين|اسبوعين|أسبوع|اسبوع|أسابيع|اسابيع|week/.test(s) ? 7 : /يومين|يوم|أيام|ايام|day/.test(s) ? 1 : 0;
    if (!u) return 0;
    var m = s.match(/(\d+(?:\.\d+)?)/), n = m ? Number(m[1]) : (/يومين|أسبوعين|اسبوعين|شهرين|سنتين/.test(s) ? 2 : 1);
    return n * u;
  }
  function baseName(p) { var n = String(p.name || ""); return n.indexOf(" — ") > 0 ? n.split(" — ")[0].trim() : ""; }
  function planLabel(p) { var parts = String(p.name || "").split(" — "); return p.duration || (parts[1] ? parts.slice(1).join(" — ") : p.name); }
  function plansOf(p, all) {
    var bn = baseName(p), list;
    if (p.category) {
      list = all.filter(function (x) { return x.category === p.category; });
      var same = bn ? list.filter(function (x) { return baseName(x) === bn; }) : [];
      if (same.length >= 2) list = same;
    } else list = bn ? all.filter(function (x) { return !x.category && baseName(x) === bn; }) : [p];
    if (list.indexOf(p) < 0) list.push(p);
    var allD = list.every(function (x) { return daysOf(x) > 0; });
    return list.slice().sort(function (a, b) { return allD ? daysOf(a) - daysOf(b) : (Number(a.price) || 0) - (Number(b.price) || 0); });
  }
  function catName(id) { var c = (CFG.categories || []).filter(function (x) { return x.id === id && id !== "all"; })[0]; return c ? c.name : ""; }
  function listHTML(a) { return '<ul class="checks">' + a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
  function setMeta(n, v) { var m = document.querySelector('meta[name="' + n + '"]'); if (!m) { m = document.createElement("meta"); m.name = n; document.head.appendChild(m); } m.content = v; }

  function product(products, reviews) {
    var m = $("#pmain");
    function find(id) { return products.filter(function (x) { return x.id === id; })[0]; }
    var p = find(new URLSearchParams(location.search).get("id"));
    if (!p) { m.innerHTML = '<div style="padding:90px 0;text-align:center"><h1>المنتج غير موجود</h1><p style="color:var(--mut);margin:10px 0 24px">تأكد من الرابط.</p><a class="btn btn-p" href="index.html">الرجوع للمتجر</a></div>'; return; }
    render(p, false);
    window.addEventListener("popstate", function () { var q = find(new URLSearchParams(location.search).get("id")); if (q) render(q, false); });

    function render(p, animate) {
      var cur = curOf(p), sn = CFG.store_name || "Deman.Store";
      document.title = p.name + " | " + sn;
      setMeta("description", shortOf(p));
      var imgs = (p.images || []).map(safeImg).filter(Boolean); if (!imgs.length) imgs = ["images/logo-512.png"];
      var price = Number(p.price) || 0, old = Number(p.old_price) || 0;
      var save = old > price ? Math.round((1 - price / old) * 100) : 0;
      var plans = plansOf(p, products), cat = catName(p.category);
      var base = plans.filter(function (x) { var d = daysOf(x); return d > 0 && isFinite(d); })[0];
      var baseRate = base ? Number(base.price) / daysOf(base) : 0;
      var buyUrl = esc(buyOf(p));
      var related = products.filter(function (x) { return x.id !== p.id; })
        .sort(function (a, b) { return (b.category === p.category) - (a.category === p.category); }).slice(0, 4);
      var faq = (p.faq || []).length ? p.faq : (CFG.faq || []);
      var feats = p.features || [], inc = p.included || [];

      var planHTML = plans.length < 2 ? "" :
        '<div class="plans" role="radiogroup" aria-label="اختر المدة"><div class="plans-h"><b>' + ICONS.clock + 'اختر المدة</b><small>' + plans.length + ' خيارات</small></div><div class="plans-g">' +
        plans.map(function (x) {
          var on = x.id === p.id, d = daysOf(x), rate = d > 0 && isFinite(d) ? Number(x.price) / d : 0;
          var off = baseRate && rate && d > daysOf(base) ? Math.round((1 - rate / baseRate) * 100) : 0;
          return '<a class="plan' + (on ? " on" : "") + '" role="radio" aria-checked="' + on + '" href="product.html?id=' + encodeURIComponent(x.id) + '" data-id="' + esc(x.id) + '">' +
            (x.badge && x.badge !== planLabel(x) ? '<span class="plan-tag">' + esc(x.badge) + '</span>' : '') +
            '<span class="plan-dot" aria-hidden="true"></span>' +
            '<span class="plan-n">' + esc(planLabel(x)) + '</span>' +
            '<span class="plan-p"><b>' + fmt(x.price) + '</b> <small>' + esc(curOf(x)) + '</small>' + (Number(x.old_price) > Number(x.price) ? ' <s>' + fmt(x.old_price) + '</s>' : '') + '</span>' +
            (off >= 5 ? '<span class="plan-s">وفّر ' + off + '٪</span>' : (rate && d > 1 ? '<span class="plan-r">≈ ' + fmt(rate) + ' / يوم</span>' : '')) +
            '</a>';
        }).join("") + '</div></div>';

      var tabs = [
        { id: "desc", t: "الوصف", h: '<p class="ml">' + esc(p.description || shortOf(p)) + '</p>' + (feats.length ? '<h3>أبرز المميزات</h3>' + listHTML(feats) : '') },
        inc.length ? { id: "inc", t: "وش يشمل", h: listHTML(inc) } : null,
        { id: "dlv", t: "التسليم", h: '<ol class="flow"><li><i>1</i><div><b>اضغط «اشترِ الآن»</b><span>يفتح لك سيرفر الديسكورد.</span></div></li><li><i>2</i><div><b>افتح تذكرة شراء</b><span>اختر المنتج والمدة وأكمل الدفع.</span></div></li><li><i>3</i><div><b>استلم منتجك</b><span>' + esc(p.delivery || "يوصلك المنتج داخل تذكرتك في سيرفر الديسكورد بعد تأكيد الدفع.") + '</span></div></li></ol>' },
        faq.length ? { id: "faq", t: "الأسئلة", h: '<div class="faq">' + faq.map(function (f, i) { return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>"; }).join("") + '</div>' } : null
      ].filter(Boolean);

      var multi = imgs.length > 1;
      m.innerHTML =
        '<nav class="crumb" aria-label="مسار التنقل"><a href="index.html">الرئيسية</a><span>/</span><a href="index.html#products">المنتجات</a>' + (cat ? '<span>/</span><span>' + esc(cat) + '</span>' : '') + '<span>/</span><b>' + esc(p.name) + '</b></nav>' +
        '<div class="pdp' + (animate ? " swap" : "") + '">' +
        '<section class="pg" aria-label="صور المنتج"><div class="pg-stage" id="gstage">' +
          '<img class="pg-bg" id="gbg" src="' + esc(imgs[0]) + '" alt="" aria-hidden="true">' +
          '<img class="pg-img" id="gmain" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '" fetchpriority="high">' +
          (p.badge && p.badge === p.duration ? '' : badgeHTML(p)) + (p.demo ? '<span class="demo">مثال</span>' : '') +
          (multi ? '<button class="pg-nav prev" aria-label="الصورة السابقة">' + ICONS.chev + '</button><button class="pg-nav next" aria-label="الصورة التالية">' + ICONS.chev + '</button><span class="pg-count" id="gcount">1 / ' + imgs.length + '</span>' : '') +
          '<button class="pg-zoom" id="gzoom" aria-label="تكبير الصورة">' + ICONS.zoom + '</button>' +
        '</div>' +
        (multi ? '<div class="pg-thumbs" id="gthumbs">' + imgs.map(function (s, i) { return '<button class="' + (i === 0 ? "on" : "") + '" data-i="' + i + '" aria-label="صورة ' + (i + 1) + '"><img src="' + esc(s) + '" alt="" loading="lazy"></button>'; }).join("") + '</div>' : '') +
        '</section>' +

        '<aside class="buy" id="buybox"><div class="buy-in">' +
          '<div class="buy-tags">' + (cat ? '<span class="tag">' + ICONS.grid + esc(cat) + '</span>' : '') + (p.badge ? '<span class="tag hot">' + esc(p.badge) + '</span>' : '') + (p.demo ? '<span class="tag demo-t">منتج تجريبي (مثال)</span>' : '') + '</div>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<div class="buy-meta"><span class="stock"><i></i>متوفر · تسليم فوري</span>' +
            (p.rating ? '<span class="stars">' + starStr(p.rating) + '<small>' + esc(p.rating) + (p.reviews_count ? ' (' + esc(p.reviews_count) + ')' : '') + (p.demo ? ' · تجريبي' : '') + '</small></span>' : '') + '</div>' + salesHTML(p,'buy-sales') +
          (p.short ? '<p class="buy-short">' + esc(p.short) + '</p>' : '') +
          planHTML +
          '<div class="pbox"><div class="pbox-l"><small>السعر' + (p.duration ? ' · ' + esc(p.duration) : '') + '</small>' +
            '<div class="pbox-p"><b>' + fmt(price) + '</b><span>' + esc(cur) + '</span>' + (save ? '<s>' + fmt(old) + ' ' + esc(cur) + '</s>' : '') + '</div></div>' +
            (save ? '<span class="save">خصم ' + save + '٪</span>' : '') + '</div>' +
          '<a class="btn btn-p cta" id="mainCta" href="' + buyUrl + '" target="_blank" rel="noopener">' + ICONS.discord + '<span>اشترِ الآن عبر ديسكورد</span></a>' +
          '<div class="buy-2"><a class="btn btn-o" href="' + esc(CFG.discord_invite || "#") + '" target="_blank" rel="noopener">' + ICONS.chat + 'استفسار قبل الشراء</a>' +
            '<button class="btn btn-o btn-i" id="shareBtn" aria-label="مشاركة الرابط" title="مشاركة">' + ICONS.share + '</button></div>' +
          '<ul class="assure"><li>' + ICONS.bolt + '<div><b>تسليم فوري</b><span>داخل تذكرتك بعد الدفع</span></div></li>' +
            '<li>' + ICONS.chat + '<div><b>دعم مباشر</b><span>فريقنا معك في الديسكورد</span></div></li>' +
            '<li>' + ICONS.shield + '<div><b>شراء آمن</b><span>طلبك موثّق بتذكرة خاصة</span></div></li>' +
            '<li>' + ICONS.refresh + '<div><b>تحديثات مستمرة</b><span>طوال مدة الاشتراك</span></div></li></ul>' +
          (payHTML() ? '<div class="buy-pay"><small>' + ICONS.lock + 'طرق الدفع المتاحة</small>' + payHTML() + '</div>' : '') +
        '</div></aside>' +

        '<section class="ptabs" aria-label="تفاصيل المنتج"><div class="ptabs-l" role="tablist">' +
          tabs.map(function (t, i) { return '<button role="tab" id="tab-' + t.id + '" aria-controls="tp-' + t.id + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + t.t + '</button>'; }).join("") + '</div>' +
          tabs.map(function (t, i) { return '<div class="ptab" role="tabpanel" id="tp-' + t.id + '" aria-labelledby="tab-' + t.id + '"' + (i === 0 ? '' : ' hidden') + '>' + t.h + '</div>'; }).join("") +
        '</section>' +
        '</div>' +

        (related.length ? '<section class="rel"><div class="rel-h"><h2>منتجات قد تعجبك</h2><a href="index.html#products">عرض الكل ' + ICONS.arrowl + '</a></div><div class="grid' + (related.length < 4 ? " few" : "") + '">' + related.map(card).join("") + '</div></section>' : '') +

        '<div class="mbar" id="mbar"><img src="' + esc(imgs[0]) + '" alt="" width="44" height="44"><div class="mbar-t"><span>' + esc(planLabel(p)) + '</span><b>' + fmt(price) + ' <small>' + esc(cur) + '</small>' + (save ? ' <s>' + fmt(old) + '</s>' : '') + '</b></div>' +
          '<a class="btn btn-p" href="' + buyUrl + '" target="_blank" rel="noopener">' + ICONS.discord + 'اشترِ الآن</a></div>' +
        '<dialog class="lb" id="lb" aria-label="عرض الصورة"><button class="lb-x" aria-label="إغلاق">✕</button><img id="lbimg" src="" alt="' + esc(p.name) + '">' +
          (multi ? '<button class="pg-nav prev" aria-label="السابقة">' + ICONS.chev + '</button><button class="pg-nav next" aria-label="التالية">' + ICONS.chev + '</button>' : '') + '</dialog>';

      // JSON-LD
      var ld = $("#ldjson"); if (!ld) { ld = document.createElement("script"); ld.type = "application/ld+json"; ld.id = "ldjson"; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: p.name, description: shortOf(p), image: imgs.map(function (s) { return new URL(s, location.href).href; }),
        category: cat || undefined, brand: { "@type": "Brand", name: sn },
        offers: { "@type": "Offer", price: price, priceCurrency: /﷼|ر\.?س|sar/i.test(cur) ? "SAR" : "USD", availability: "https://schema.org/InStock", url: location.href } });

      // gallery
      var gi = 0, gm = $("#gmain"), gb = $("#gbg"), lb = $("#lb"), lbi = $("#lbimg");
      function show(i) {
        gi = (i + imgs.length) % imgs.length;
        gm.style.opacity = 0;
        setTimeout(function () { gm.src = imgs[gi]; gb.src = imgs[gi]; gm.style.opacity = 1; }, 140);
        $$("#gthumbs button").forEach(function (b, k) { b.classList.toggle("on", k === gi); if (k === gi && b.scrollIntoView) b.parentNode.scrollTo({ left: b.offsetLeft - b.parentNode.clientWidth / 2 + b.clientWidth / 2, behavior: "smooth" }); });
        var c = $("#gcount"); if (c) c.textContent = (gi + 1) + " / " + imgs.length;
        if (lb.open) lbi.src = imgs[gi];
      }
      // RTL: «التالي» يسار
      $$(".pg-nav.next").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); show(gi + 1); }); });
      $$(".pg-nav.prev").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); show(gi - 1); }); });
      var th = $("#gthumbs"); if (th) th.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) show(+b.getAttribute("data-i")); });
      function openLb() { lbi.src = imgs[gi]; if (lb.showModal) lb.showModal(); }
      $("#gzoom").addEventListener("click", openLb);
      gm.addEventListener("click", openLb);
      lb.addEventListener("click", function (e) { if (e.target === lb || e.target.closest(".lb-x")) lb.close(); });
      var sx = null, st = $("#gstage");
      st.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
      st.addEventListener("touchend", function (e) { if (sx == null || !multi) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(gi + (dx > 0 ? 1 : -1)); sx = null; });
      document.onkeydown = function (e) { if (!lb.open || !multi) return; if (e.key === "ArrowLeft") show(gi + 1); if (e.key === "ArrowRight") show(gi - 1); };

      // plans: switch without full reload
      var pl = $(".plans"); if (pl) pl.addEventListener("click", function (e) {
        var a = e.target.closest(".plan"); if (!a || e.metaKey || e.ctrlKey) return; e.preventDefault();
        var q = find(a.getAttribute("data-id")); if (!q || q.id === p.id) return;
        history.pushState(null, "", "product.html?id=" + encodeURIComponent(q.id));
        render(q, true);
      });

      // tabs
      var tbs = $$('.ptabs [role="tab"]');
      function sel(t) { tbs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; }); }
      tbs.forEach(function (t, i) {
        t.addEventListener("click", function () { sel(t); });
        t.addEventListener("keydown", function (e) { var d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0; if (!d) return; var n = tbs[(i + d + tbs.length) % tbs.length]; sel(n); n.focus(); });
      });

      // share
      $("#shareBtn").addEventListener("click", function () {
        var u = location.href, b = this;
        if (navigator.share) { navigator.share({ title: p.name, url: u }).catch(function () {}); return; }
        (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.classList.add("ok"); b.title = "تم نسخ الرابط"; setTimeout(function () { b.classList.remove("ok"); }, 1600); }).catch(function () {});
      });

      // mobile sticky bar: يظهر بعد ما يختفي زر الشراء الرئيسي
      var mb = $("#mbar"), cta = $("#mainCta");
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { mb.classList.toggle("show", !es[0].isIntersecting && es[0].boundingClientRect.top < 0); });
        io.observe(cta);
      } else mb.classList.add("show");
      observe();
      if (animate) { var bx = $("#buybox"); if (bx && bx.getBoundingClientRect().top < 0) window.scrollTo({ top: window.scrollY + bx.getBoundingClientRect().top - 90, behavior: "smooth" }); }
    }
  }

  /* ---- UI: nav, menu, tabbar, starfield ---- */
  function ui() {
    var nav = $("#nav"), bur = $("#burger"), links = $("#links");
    function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 10); }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    if (bur && links) {
      bur.addEventListener("click", function () { var o = links.classList.toggle("open"); bur.setAttribute("aria-expanded", o); });
      links.addEventListener("click", function (e) { if (e.target.closest("a")) { links.classList.remove("open"); bur.setAttribute("aria-expanded", "false"); } });
    }
    // active section highlighting
    var secs = ["top", "products", "how", "reviews", "faq"].map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (secs.length && "IntersectionObserver" in window) {
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = "#" + e.target.id;
          $$(".links a, .tabbar a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === id); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      secs.forEach(function (s) { so.observe(s); });
    }
    stars();
  }
  function stars() {
    var c = $("#stars"); if (!c || !c.getContext) return;
    var x = c.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, pts = [];
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function size() {
      W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(W * H / 9000); pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + .2, a: Math.random(), s: Math.random() * .015 + .003, v: Math.random() * .08 + .01, p: Math.random() < .12 });
    }
    function draw() {
      x.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.a += p.s; p.y -= p.v; if (p.y < -2) { p.y = H + 2; p.x = Math.random() * W; }
        var o = .25 + Math.abs(Math.sin(p.a)) * .6;
        x.fillStyle = p.p ? "rgba(210,155,253," + o + ")" : "rgba(255,255,255," + o * .8 + ")";
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    size(); draw();
    var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(function () { size(); if (reduce) draw(); }, 150); });
  }

  icons(document);
  ui();
  Promise.all([load("/api/config"), load("/api/products"), load("/api/reviews")]).then(function (r) {
    CFG = r[0] || {}; applyConfig();
    var page = document.body.getAttribute("data-page");
    if (page === "home") home(r[1] || [], r[2] || []); else product(r[1] || [], r[2] || []);
    initPurchasePopups(r[1] || []);
    observe();
  }).catch(function (e) {
    console.error(e);
    var t = document.createElement("p");
    t.style.cssText = "padding:40px;text-align:center;color:#fca5a5";
    t.textContent = "تعذّر تحميل بيانات المتجر، حدّث الصفحة بعد شوي.";
    document.querySelector("main").prepend(t);
    $$(".rv").forEach(function (e) { e.classList.add("in"); });
  });
})();
