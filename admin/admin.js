/* Deman.Store admin panel */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function isImgUrl(u) { return /^(https?:\/\/|\/api\/img\/|\/?images\/)/.test(String(u || "")); }
  function imgSrc(u) { u = String(u || ""); return /^images\//.test(u) ? "/" + u : u; }
  var MAX = 2 * 1024 * 1024, TYPES = ["image/png", "image/jpeg", "image/webp"];
  var S = { products: [], config: {}, reviews: [], edit: null, images: [], reviewEdit: null, reviewFilter: "all" };

  var tt;
  function toast(msg, kind) {
    var t = $("#toast"); t.textContent = msg; t.className = "toast " + (kind || "ok"); t.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2800);
  }
  function api(path, opts) {
    opts = opts || {};
    var h = { "x-requested-with": "deman-admin" };
    var body = opts.body;
    if (body && !(body instanceof Blob)) { h["content-type"] = "application/json"; body = JSON.stringify(body); }
    else if (body instanceof Blob) h["content-type"] = body.type || "application/octet-stream";
    return fetch(path, { method: opts.method || "GET", headers: h, body: body, credentials: "same-origin", cache: "no-store" })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 401 && path !== "/api/login") { showLogin(); throw new Error("انتهت الجلسة، سجّل دخول من جديد"); }
          if (!r.ok) throw new Error(d.error || ("خطأ " + r.status));
          return d;
        });
      });
  }
  function busy(btn, on) { if (!btn) return; btn.disabled = on; if (on) { btn.dataset.t = btn.textContent; btn.textContent = "…"; } else if (btn.dataset.t) btn.textContent = btn.dataset.t; }

  /* ---------- auth ---------- */
  function showLogin() { $("#vApp").hidden = true; $("#ed").hidden = true; $("#vLogin").hidden = false; setTimeout(function () { $("#pw").focus(); }, 50); }
  function showApp() { $("#vLogin").hidden = true; $("#vApp").hidden = false; loadAll(); }
  function setPwVisible(show) {
    var i = $("#pw"), t = $("#pwToggle"); if (!i || !t) return;
    i.type = show ? "text" : "password";
    var lbl = show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور";
    t.classList.toggle("on", show); t.setAttribute("aria-pressed", show ? "true" : "false");
    t.setAttribute("aria-label", lbl); t.title = lbl;
  }
  (function () {
    var t = $("#pwToggle"); if (!t) return;
    t.addEventListener("mousedown", function (e) { e.preventDefault(); }); // keep focus/caret in input
    t.addEventListener("click", function (e) {
      e.preventDefault();
      var i = $("#pw"), pos = i.selectionStart;
      setPwVisible(i.type === "password");
      try { i.focus(); if (pos != null) i.setSelectionRange(pos, pos); } catch (x) {}
    });
  })();
  $("#loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var b = $("#loginBtn"), er = $("#loginErr"); er.hidden = true; busy(b, true);
    api("/api/login", { method: "POST", body: { password: $("#pw").value } })
      .then(function () { $("#pw").value = ""; setPwVisible(false); showApp(); })
      .catch(function (x) { er.textContent = x.message; er.hidden = false; })
      .then(function () { busy(b, false); });
  });
  $("#logoutBtn").addEventListener("click", function () {
    api("/api/logout", { method: "POST" }).catch(function () {}).then(showLogin);
  });

  /* ---------- tabs ---------- */
  $("#tabs").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    $$("#tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
    var v = b.getAttribute("data-v");
    $("#vProducts").hidden = v !== "products"; $("#vStats").hidden = v !== "stats"; $("#vReviews").hidden = v !== "reviews"; $("#vSettings").hidden = v !== "settings";
    history.replaceState(null, "", v === "settings" ? "#settings" : (v === "reviews" ? "#reviews" : (v === "stats" ? "#stats" : "#")));
  });

  function loadAll() {
    return Promise.all([api("/api/products?all=1"), api("/api/config"), api("/api/reviews?all=1")]).then(function (r) {
      S.products = r[0]; S.config = r[1]; S.reviews = r[2];
      renderProducts(); renderStats(); renderSettings(); renderReviews();
      if (location.hash === "#settings") $('#tabs [data-v="settings"]').click();
      if (location.hash === "#reviews") $('#tabs [data-v="reviews"]').click();
      if (location.hash === "#stats") $('#tabs [data-v="stats"]').click();
    }).catch(function (x) { toast(x.message, "bad"); });
  }

  /* ---------- products ---------- */
  function catName(id) { var c = (S.config.categories || []).filter(function (x) { return x.id === id; })[0]; return c ? c.name : (id || "—"); }
  function renderProducts() {
    var L = $("#pList"), list = S.products;
    $("#pCount").textContent = list.length + " منتج · " + list.filter(function (p) { return p.visible !== false; }).length + " ظاهر";
    if (!list.length) { L.innerHTML = '<div class="card empty"><p class="mut">ما فيه منتجات. اضغط «إضافة منتج».</p></div>'; return; }
    L.innerHTML = list.map(function (p) {
      var img = (p.images && p.images[0]) ? imgSrc(p.images[0]) : "/images/logo-512.png";
      return '<div class="card prow" data-id="' + esc(p.id) + '">' +
        '<img class="th" src="' + esc(img) + '" alt="" loading="lazy">' +
        '<div><h4>' + esc(p.name) + '</h4><div class="meta"><b>' + esc(p.price) + ' ' + esc(S.config.currency || "ر.س") + '</b>' +
        (p.duration ? '<span>⏱ ' + esc(p.duration) + '</span>' : '') + '<span>' + esc(catName(p.category)) + '</span><span>ترتيب: ' + esc(p.sort) + '</span>' +
        '<span>طلبات: ' + esc(p.purchases_count || 0) + '</span><span class="pill ' + (p.visible !== false ? 'on">ظاهر' : 'off">مخفي') + '</span></div></div>' +
        '<label class="tg vis" title="ظاهر/مخفي"><input type="checkbox" data-act="vis"' + (p.visible !== false ? " checked" : "") + '><i></i></label>' +
        '<div class="pact"><button class="btn btn-o sm" data-act="edit">تعديل</button><button class="btn btn-d sm" data-act="del">حذف</button></div></div>';
    }).join("");
  }
  $("#pList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var id = b.closest(".prow").getAttribute("data-id");
    var p = S.products.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var act = b.getAttribute("data-act");
    if (act === "edit") openEditor(p);
    if (act === "del") {
      if (!confirm("حذف «" + p.name + "»؟ ما تقدر ترجعه.")) return;
      api("/api/products/" + encodeURIComponent(id), { method: "DELETE" }).then(function () {
        S.products = S.products.filter(function (x) { return x.id !== id; }); renderProducts(); renderStats(); toast("انحذف المنتج");
      }).catch(function (x) { toast(x.message, "bad"); });
    }
  });
  $("#pList").addEventListener("change", function (e) {
    var cb = e.target.closest('[data-act="vis"]'); if (!cb) return;
    var id = cb.closest(".prow").getAttribute("data-id");
    api("/api/products/" + encodeURIComponent(id), { method: "PUT", body: { visible: cb.checked } }).then(function (d) {
      S.products = S.products.map(function (x) { return x.id === id ? d.product : x; }); renderProducts(); renderStats(); toast(d.product.visible ? "صار ظاهر" : "صار مخفي");
    }).catch(function (x) { cb.checked = !cb.checked; toast(x.message, "bad"); });
  });


  /* ---------- stats / manual purchase counts ---------- */
  function sumPurchases(){return S.products.reduce(function(t,p){return t+Math.max(0,Math.floor(Number(p.purchases_count)||0));},0);}
  function renderStats(){
    var cards=$("#statsCards"), list=$("#salesList"); if(!cards||!list)return;
    var approved=S.reviews.filter(function(r){return r.status==='approved'&&!r.demo;}).length;
    var pending=S.reviews.filter(function(r){return r.status==='pending';}).length; var demos=S.reviews.filter(function(r){return r.demo;}).length;
    cards.innerHTML=''
      +'<div class="stat-card card"><span>إجمالي الطلبات</span><b>'+sumPurchases().toLocaleString('ar-SA')+'</b><small>مجموع الأرقام المسجلة على المنتجات</small></div>'
      +'<div class="stat-card card"><span>المنتجات الظاهرة</span><b>'+S.products.filter(function(p){return p.visible!==false;}).length+'</b><small>من أصل '+S.products.length+' منتج</small></div>'
      +'<div class="stat-card card"><span>آراء منشورة</span><b>'+approved+'</b><small>آراء حقيقية ظاهرة للزوار</small></div>'
      +'<div class="stat-card card"><span>بانتظار المراجعة</span><b>'+pending+'</b><small>تحتاج اعتمادك قبل النشر</small></div>';
    list.innerHTML=S.products.length?S.products.map(function(p){
      var n=Math.max(0,Math.floor(Number(p.purchases_count)||0));
      return '<div class="sales-admin-row" data-id="'+esc(p.id)+'"><div class="sales-admin-name"><b>'+esc(p.name)+'</b><span>'+esc(p.duration||'')+'</span></div><div class="sales-stepper"><button type="button" class="btn btn-o sm" data-sales-delta="-10">-10</button><button type="button" class="btn btn-o sm" data-sales-delta="-1">-1</button><input data-sales-input type="number" min="0" step="1" value="'+n+'" inputmode="numeric" dir="ltr"><button type="button" class="btn btn-o sm" data-sales-delta="1">+1</button><button type="button" class="btn btn-o sm" data-sales-delta="10">+10</button><button type="button" class="btn btn-p sm" data-sales-save>حفظ</button></div></div>';
    }).join(''):'<p class="mut">ما فيه منتجات.</p>';
  }
  $("#salesList").addEventListener('click',function(e){
    var row=e.target.closest('.sales-admin-row'); if(!row)return; var inp=row.querySelector('[data-sales-input]');
    var d=e.target.closest('[data-sales-delta]'); if(d){inp.value=Math.max(0,(parseInt(inp.value||'0',10)||0)+(parseInt(d.getAttribute('data-sales-delta'),10)||0));return;}
    var save=e.target.closest('[data-sales-save]'); if(!save)return;
    var id=row.getAttribute('data-id'), value=Math.max(0,Math.floor(Number(inp.value)||0)); busy(save,true);
    api('/api/products/'+encodeURIComponent(id),{method:'PUT',body:{purchases_count:value}}).then(function(d){
      S.products=S.products.map(function(x){return x.id===id?d.product:x;}); renderProducts(); renderStats(); toast('تم تحديث عدد الطلبات');
    }).catch(function(x){toast(x.message,'bad');}).then(function(){busy(save,false);});
  });

  /* ---------- editor ---------- */
  var F = $("#edForm");
  function fillCats(sel) {
    var cats = (S.config.categories || []).filter(function (c) { return c.id !== "all"; });
    $("#catSel").innerHTML = '<option value="">— بدون —</option>' + cats.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join("");
    if (sel && !cats.some(function (c) { return c.id === sel; })) $("#catSel").insertAdjacentHTML("beforeend", '<option value="' + esc(sel) + '">' + esc(sel) + '</option>');
    $("#catSel").value = sel || "";
  }
  function openEditor(p) {
    S.edit = p || null; p = p || {};
    $("#edTitle").textContent = S.edit ? "تعديل منتج" : "منتج جديد";
    F.reset();
    F.name.value = p.name || ""; F.description.value = p.description || "";
    F.price.value = p.price != null ? p.price : "";
    F.sort.value = p.sort != null ? p.sort : ""; F.duration.value = p.duration || ""; F.purchases_count.value = p.purchases_count != null ? p.purchases_count : 0;
    F.buy_link.value = p.buy_link || ""; F.short.value = p.short || "";
    F.old_price.value = p.old_price != null ? p.old_price : ""; F.badge.value = p.badge || "";
    F.features.value = (p.features || []).join("\n"); F.included.value = (p.included || []).join("\n");
    F.delivery.value = p.delivery || "";
    F.short_en.value = p.short_en || ""; F.description_en.value = p.description_en || ""; F.badge_en.value = p.badge_en || "";
    F.features_en.value = (p.features_en || []).join("\n"); F.included_en.value = (p.included_en || []).join("\n");
    F.delivery_en.value = p.delivery_en || "";
    F.visible.checked = p.visible !== false; F.featured.checked = !!p.featured; F.demo.checked = !!p.demo;
    fillCats(p.category || (S.edit ? "" : ((S.config.categories || [])[1] || {}).id));
    S.images = (p.images || []).slice();
    renderImgs(); syncPicks(); $("#imgErr").hidden = true;
    $("#ed").hidden = false; document.body.style.overflow = "hidden";
    setTimeout(function () { F.name.focus(); }, 50);
  }
  function closeEditor() { $("#ed").hidden = true; document.body.style.overflow = ""; }
  $("#addBtn").addEventListener("click", function () { openEditor(null); });
  $("#edClose").addEventListener("click", closeEditor);
  $("#edCancel").addEventListener("click", closeEditor);
  $("#ed").addEventListener("click", function (e) { if (e.target.id === "ed") closeEditor(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#ed").hidden) closeEditor(); });
  function syncPicks() { $$("#durPicks button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-d") === F.duration.value.trim()); }); }
  $("#durPicks").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; F.duration.value = b.getAttribute("data-d"); syncPicks(); });
  F.duration.addEventListener("input", syncPicks);

  function renderImgs() {
    $("#imgs").innerHTML = S.images.map(function (u, i) {
      return '<div class="im' + (i === 0 ? " lead" : "") + '"><img src="' + esc(imgSrc(u)) + '" alt=""><button type="button" class="rm" data-i="' + i + '" aria-label="حذف">✕</button>' +
        '<button type="button" class="mk" data-i="' + i + '">' + (i === 0 ? "الرئيسية" : "اجعلها رئيسية") + '</button></div>';
    }).join("") || '<p class="mut" style="font-size:13px">ما فيه صور — بتظهر صورة الشعار.</p>';
  }
  $("#imgs").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; var i = +b.getAttribute("data-i");
    if (b.classList.contains("rm")) S.images.splice(i, 1);
    else if (i > 0) S.images.unshift(S.images.splice(i, 1)[0]);
    renderImgs();
  });
  function checkFile(f) {
    if (TYPES.indexOf(f.type) < 0) return "نوع الصورة غير مدعوم (PNG / JPG / WEBP فقط)";
    if (f.size > MAX) return "الصورة أكبر من 2MB (" + (f.size / 1048576).toFixed(1) + "MB)";
    return "";
  }
  function upload(f) { return api("/api/upload", { method: "POST", body: f }); }
  $("#imgFile").addEventListener("change", function () {
    var f = this.files[0], er = $("#imgErr"); this.value = ""; er.hidden = true; if (!f) return;
    var m = checkFile(f); if (m) { er.textContent = m; er.hidden = false; return; }
    var prev = URL.createObjectURL(f);
    S.images.push(prev); renderImgs();
    upload(f).then(function (d) {
      S.images = S.images.map(function (u) { return u === prev ? d.url : u; }); renderImgs(); toast("انرفعت الصورة");
    }).catch(function (x) {
      S.images = S.images.filter(function (u) { return u !== prev; }); renderImgs(); er.textContent = x.message; er.hidden = false;
    }).then(function () { URL.revokeObjectURL(prev); });
  });

  F.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!F.name.value.trim()) { F.name.focus(); toast("اسم المنتج مطلوب", "bad"); return; }
    if (S.images.some(function (u) { return /^blob:/.test(u); })) { toast("انتظر لين تخلص الصورة", "bad"); return; }
    var lines = function (v) { return v.split("\n").map(function (s) { return s.trim(); }).filter(Boolean); };
    var body = {
      name: F.name.value, description: F.description.value, price: F.price.value,
      sort: F.sort.value, duration: F.duration.value, category: F.category.value, buy_link: F.buy_link.value,
      visible: F.visible.checked, featured: F.featured.checked, demo: F.demo.checked, images: S.images,
      short: F.short.value, old_price: F.old_price.value, badge: F.badge.value, purchases_count: F.purchases_count.value,
      features: lines(F.features.value), included: lines(F.included.value), delivery: F.delivery.value,
      short_en: F.short_en.value, description_en: F.description_en.value, badge_en: F.badge_en.value,
      features_en: lines(F.features_en.value), included_en: lines(F.included_en.value), delivery_en: F.delivery_en.value
    };
    if (body.buy_link && !/^https?:\/\//i.test(body.buy_link.trim())) { toast("رابط الشراء لازم يبدأ بـ https://", "bad"); return; }
    var b = $("#edSave"); busy(b, true);
    var req = S.edit ? api("/api/products/" + encodeURIComponent(S.edit.id), { method: "PUT", body: body }) : api("/api/products", { method: "POST", body: body });
    req.then(function () { closeEditor(); toast("انحفظ المنتج"); return api("/api/products?all=1"); })
      .then(function (l) { S.products = l; renderProducts(); renderStats(); })
      .catch(function (x) { toast(x.message, "bad"); })
      .then(function () { busy(b, false); });
  });


  /* ---------- reviews ---------- */
  function prodName(id) { var p=S.products.filter(function(x){return x.id===id;})[0]; return p ? p.name : (id || 'بدون منتج'); }
  function reviewStatusName(s) { return s==='approved'?'منشور':s==='hidden'?'مخفي':'بانتظار المراجعة'; }
  function renderReviews() {
    var pending=S.reviews.filter(function(r){return r.status==='pending';}).length; var demos=S.reviews.filter(function(r){return r.demo;}).length;
    var pb=$('#pendingBadge'); pb.hidden=!pending; pb.textContent=pending || '';
    $('#rCount').textContent=S.reviews.length+' رأي · '+pending+' بانتظار المراجعة'; var db=$('#deleteDemoReviews'); if(db) db.hidden=!demos;
    var list=S.reviews.filter(function(r){return S.reviewFilter==='all' || r.status===S.reviewFilter;});
    var L=$('#rList');
    if(!list.length){L.innerHTML='<div class="card empty"><p class="mut">ما فيه آراء في هذا القسم.</p></div>';return;}
    L.innerHTML=list.map(function(r){
      return '<div class="card rrow" data-id="'+esc(r.id)+'"><div class="rmain"><div class="rhead"><b>'+esc(r.name)+'</b><span class="rstars">'+('★★★★★'.slice(0,Math.max(1,Math.min(5,+r.stars||5))))+'</span></div><p>'+esc(r.text)+'</p><div class="meta"><span>'+esc(prodName(r.product_id))+'</span><span class="pill '+(r.status==='approved'?'on':r.status==='hidden'?'off':'wait')+'">'+reviewStatusName(r.status)+'</span>'+(r.verified?'<span>✓ شراء موثّق</span>':'')+(r.demo?'<span>تجريبي</span>':'')+'</div></div><div class="pact"><button class="btn btn-o sm" data-ract="edit">تعديل</button>'+(r.status!=='approved'?'<button class="btn btn-o sm" data-ract="approve">اعتماد</button>':'')+'<button class="btn btn-d sm" data-ract="del">حذف</button></div></div>';
    }).join('');
  }
  $('.review-tools').addEventListener('click',function(e){var b=e.target.closest('[data-rfilter]');if(!b)return;S.reviewFilter=b.getAttribute('data-rfilter');$$('[data-rfilter]',this).forEach(function(x){x.classList.toggle('on',x===b);});renderReviews();});
  $('#deleteDemoReviews').addEventListener('click',function(){if(!confirm('حذف كل الآراء التجريبية؟ الآراء الحقيقية لن تتأثر.'))return;var b=this;busy(b,true);api('/api/reviews?demo=1',{method:'DELETE'}).then(function(d){S.reviews=S.reviews.filter(function(r){return !r.demo;});renderReviews();renderStats();toast('تم حذف الآراء التجريبية');}).catch(function(x){toast(x.message,'bad');}).then(function(){busy(b,false);});});
  $('#rList').addEventListener('click',function(e){var b=e.target.closest('[data-ract]');if(!b)return;var row=b.closest('.rrow'),id=row.getAttribute('data-id'),r=S.reviews.filter(function(x){return x.id===id;})[0];if(!r)return;var a=b.getAttribute('data-ract');if(a==='edit')return openReviewEditor(r);if(a==='approve'){api('/api/reviews/'+encodeURIComponent(id),{method:'PUT',body:{status:'approved'}}).then(function(d){S.reviews=S.reviews.map(function(x){return x.id===id?d.review:x;});renderReviews();renderStats();toast('تم اعتماد الرأي');}).catch(function(x){toast(x.message,'bad');});}if(a==='del'){if(!confirm('حذف رأي «'+r.name+'»؟'))return;api('/api/reviews/'+encodeURIComponent(id),{method:'DELETE'}).then(function(){S.reviews=S.reviews.filter(function(x){return x.id!==id;});renderReviews();renderStats();toast('انحذف الرأي');}).catch(function(x){toast(x.message,'bad');});}});
  var RF=$('#rvForm');
  function fillReviewProducts(sel){$('#rvProduct').innerHTML='<option value="">— بدون منتج —</option>'+S.products.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>';}).join('');$('#rvProduct').value=sel||'';}
  function openReviewEditor(r){S.reviewEdit=r||null;r=r||{};RF.reset();$('#rvTitle').textContent=S.reviewEdit?'تعديل رأي':'إضافة رأي';RF.name.value=r.name||'';RF.stars.value=r.stars||5;RF.text.value=r.text||'';RF.status.value=r.status||'approved';RF.verified.checked=!!r.verified;RF.demo.checked=!!r.demo;fillReviewProducts(r.product_id||'');$('#rvEd').hidden=false;document.body.style.overflow='hidden';setTimeout(function(){RF.name.focus();},50);}
  function closeReviewEditor(){$('#rvEd').hidden=true;document.body.style.overflow='';}
  $('#addReviewBtn').addEventListener('click',function(){openReviewEditor(null);}); $('#rvClose').addEventListener('click',closeReviewEditor); $('#rvCancel').addEventListener('click',closeReviewEditor); $('#rvEd').addEventListener('click',function(e){if(e.target.id==='rvEd')closeReviewEditor();});
  RF.addEventListener('submit',function(e){e.preventDefault();var body={name:RF.name.value,stars:RF.stars.value,text:RF.text.value,product_id:RF.product_id.value,status:RF.status.value,verified:RF.verified.checked,demo:RF.demo.checked};var b=$('#rvSave');busy(b,true);var req=S.reviewEdit?api('/api/reviews/'+encodeURIComponent(S.reviewEdit.id),{method:'PUT',body:body}):api('/api/reviews',{method:'POST',body:body});req.then(function(){closeReviewEditor();toast('انحفظ الرأي');return api('/api/reviews?all=1');}).then(function(l){S.reviews=l;renderReviews();renderStats();}).catch(function(x){toast(x.message,'bad');}).then(function(){busy(b,false);});});

  /* ---------- settings ---------- */
  var SF = $("#setForm");
  var FIELDS = ["store_name", "brand_ar", "discord_invite", "currency", "domain", "legal_note", "hero_title", "hero_subtitle", "announcement", "hero_title_en", "hero_subtitle_en", "announcement_en", "purchase_label", "total_sales_label", "published_reviews_label", "floating_discord_label", "live_visitors_count", "live_visitors_label", "purchase_popup_title", "purchase_popup_interval", "purchase_popup_duration"];
  function payRow(m) {
    m = m || {}; var ic = m.icon || "";
    return '<div class="rp pay"><div class="col"><input class="pm-name" placeholder="اسم الطريقة (مثلاً: STC Pay)" maxlength="60" value="' + esc(m.name) + '"></div>' +
      '<div class="col"><div class="ic-wrap"><span class="ic-prev">' + (isImgUrl(ic) ? '<img src="' + esc(imgSrc(ic)) + '" alt="">' : esc(ic)) + '</span>' +
      '<input class="pm-icon" placeholder="إيموجي/نص أو رابط صورة" maxlength="300" value="' + esc(ic) + '">' +
      '<label class="btn btn-o sm" title="رفع أيقونة">رفع<input type="file" class="pm-file" accept="image/png,image/jpeg,image/webp" hidden></label></div></div>' +
      '<button type="button" class="btn btn-d rm-row" aria-label="حذف">✕</button></div>';
  }
  function catRow(c) {
    c = c || {};
    return '<div class="rp cat"><div class="col"><input class="c-name" placeholder="اسم الفئة" maxlength="60" value="' + esc(c.name) + '">' +
      '<input class="c-name-en" placeholder="English name (optional)" maxlength="60" dir="ltr" value="' + esc(c.name_en) + '"></div>' +
      '<div class="col"><input class="c-id" placeholder="المعرّف (english-id)" maxlength="40" dir="ltr" value="' + esc(c.id) + '"></div>' +
      '<button type="button" class="btn btn-d rm-row" aria-label="حذف">✕</button></div>';
  }
  function faqRow(f) {
    f = f || {};
    return '<div class="rp faq"><div class="col"><input class="fq" placeholder="السؤال" maxlength="300" value="' + esc(f.q) + '">' +
      '<textarea class="fa" rows="2" placeholder="الجواب">' + esc(f.a) + '</textarea>' +
      '<input class="fq-en" placeholder="Question in English (optional)" maxlength="300" dir="ltr" value="' + esc(f.q_en) + '">' +
      '<textarea class="fa-en" rows="2" placeholder="Answer in English (optional)" dir="ltr">' + esc(f.a_en) + '</textarea></div>' +
      '<button type="button" class="btn btn-d rm-row" aria-label="حذف">✕</button></div>';
  }
  function pad2(n){return String(n).padStart(2,"0");}
  function toLocalDateTime(v){
    var d=v?new Date(v):new Date(); if(!isFinite(d.getTime()))d=new Date();
    return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())+"T"+pad2(d.getHours())+":"+pad2(d.getMinutes());
  }
  function purchaseProductOptions(sel){
    return '<option value="">— اختر المنتج —</option>'+S.products.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===sel?' selected':'')+'>'+esc(p.name)+'</option>';}).join('');
  }
  function recentPurchaseRow(o){
    o=o||{};
    return '<div class="rp recent-purchase" data-id="'+esc(o.id||('rp-'+Date.now()+'-'+Math.random().toString(36).slice(2,6)))+'">'+
      '<div class="col"><label class="mini-label">اسم العميل المختصر</label><input class="po-buyer" maxlength="70" placeholder="مثلاً: أحمد م." value="'+esc(o.buyer||'')+'"><label class="mini-label">المنتج</label><select class="po-product">'+purchaseProductOptions(o.product_id||'')+'</select></div>'+
      '<div class="col"><label class="mini-label">وقت العملية</label><input class="po-time" type="datetime-local" value="'+esc(toLocalDateTime(o.created_at))+'"><label class="tg po-toggle"><input class="po-enabled" type="checkbox"'+(o.enabled===false?'':' checked')+'><i></i><span>إظهار هذه العملية</span></label></div>'+
      '<button type="button" class="btn btn-d rm-row" aria-label="حذف">✕</button></div>';
  }
  function renderSettings() {
    var c = S.config;
    var defaults={purchase_label:"طلب",total_sales_label:"طلب مكتمل",published_reviews_label:"تقييم من العملاء",floating_discord_label:"ديسكورد",live_visitors_count:0,live_visitors_label:"زائر يتصفح المتجر الآن",purchase_popup_title:"شراء جديد",purchase_popup_interval:12,purchase_popup_duration:6};
    FIELDS.forEach(function (k) { SF[k].value = c[k] != null ? c[k] : (k === "store_name" ? (c.brand || "") : (defaults[k] != null ? defaults[k] : "")); });
    $("#payList").innerHTML = (c.payment_methods || []).map(payRow).join("");
    $("#catList").innerHTML = (c.categories || []).filter(function (x) { return x.id !== "all"; }).map(catRow).join("");
    $("#faqList").innerHTML = (c.faq || []).map(faqRow).join("");
    var pp=$("#purchasePopupEnabled"); if(pp) pp.checked=c.purchase_popup_enabled!==false;
    var pr=$("#recentPurchasesList"); if(pr) pr.innerHTML=(c.recent_purchases||[]).map(recentPurchaseRow).join("");
  }
  $("#addPay").addEventListener("click", function () { $("#payList").insertAdjacentHTML("beforeend", payRow()); $("#payList .rp:last-child .pm-name").focus(); });
  $("#addCat").addEventListener("click", function () { $("#catList").insertAdjacentHTML("beforeend", catRow()); $("#catList .rp:last-child .c-name").focus(); });
  $("#addFaq").addEventListener("click", function () { $("#faqList").insertAdjacentHTML("beforeend", faqRow()); $("#faqList .rp:last-child .fq").focus(); });
  $("#addRecentPurchase").addEventListener("click", function () { $("#recentPurchasesList").insertAdjacentHTML("afterbegin", recentPurchaseRow({created_at:new Date().toISOString(),enabled:true})); var x=$("#recentPurchasesList .rp:first-child .po-buyer"); if(x)x.focus(); });
  SF.addEventListener("click", function (e) { var b = e.target.closest(".rm-row"); if (b) b.closest(".rp").remove(); });
  SF.addEventListener("input", function (e) {
    if (e.target.classList.contains("pm-icon")) { var v = e.target.value, p = e.target.parentNode.querySelector(".ic-prev"); p.innerHTML = isImgUrl(v) ? '<img src="' + esc(imgSrc(v)) + '" alt="">' : esc(v); }
  });
  SF.addEventListener("change", function (e) {
    if (!e.target.classList.contains("pm-file")) return;
    var f = e.target.files[0], inp = e.target.closest(".ic-wrap").querySelector(".pm-icon"); e.target.value = ""; if (!f) return;
    var m = checkFile(f); if (m) { toast(m, "bad"); return; }
    upload(f).then(function (d) { inp.value = d.url; inp.dispatchEvent(new Event("input", { bubbles: true })); toast("انرفعت الأيقونة — لا تنسى تحفظ"); })
      .catch(function (x) { toast(x.message, "bad"); });
  });
  SF.addEventListener("submit", function (e) {
    e.preventDefault();
    var body = {};
    FIELDS.forEach(function (k) { body[k] = SF[k].value; });
    body.live_visitors_count=Math.max(0,Math.floor(Number(body.live_visitors_count)||0));
    body.purchase_popup_enabled=$("#purchasePopupEnabled") ? $("#purchasePopupEnabled").checked : true;
    body.purchase_popup_interval=Math.max(5,Math.min(120,Math.floor(Number(body.purchase_popup_interval)||12)));
    body.purchase_popup_duration=Math.max(2,Math.min(15,Math.floor(Number(body.purchase_popup_duration)||6)));
    if (body.discord_invite && !/^https?:\/\//i.test(body.discord_invite.trim())) { toast("رابط الديسكورد لازم يبدأ بـ https://", "bad"); return; }
    body.payment_methods = $$("#payList .rp").map(function (r) { return { name: $(".pm-name", r).value.trim(), icon: $(".pm-icon", r).value.trim() }; }).filter(function (m) { return m.name; });
    body.categories = $$("#catList .rp").map(function (r) {
      var name = $(".c-name", r).value.trim(), id = $(".c-id", r).value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
      if (!id && name) id = "cat-" + Math.random().toString(36).slice(2, 7);
      return { id: id, name: name, name_en: $(".c-name-en", r).value.trim() };
    }).filter(function (c) { return c.id && c.name; });
    body.faq = $$("#faqList .rp").map(function (r) { return { q: $(".fq", r).value.trim(), a: $(".fa", r).value.trim(), q_en: $(".fq-en", r).value.trim(), a_en: $(".fa-en", r).value.trim() }; }).filter(function (f) { return f.q || f.a; });
    body.recent_purchases = $$("#recentPurchasesList .recent-purchase").map(function(r){
      var buyer=$(".po-buyer",r).value.trim(), product_id=$(".po-product",r).value, raw=$(".po-time",r).value;
      var d=raw?new Date(raw):new Date();
      return {id:r.getAttribute("data-id")||("rp-"+Date.now()),buyer:buyer,product_id:product_id,created_at:isFinite(d.getTime())?d.toISOString():new Date().toISOString(),enabled:$(".po-enabled",r).checked};
    }).filter(function(x){return x.buyer && x.product_id;});
    var b = $("#saveSet"); busy(b, true);
    api("/api/config", { method: "PUT", body: body }).then(function (d) { S.config = d.config; renderSettings(); renderProducts(); toast("انحفظت الإعدادات"); })
      .catch(function (x) { toast(x.message, "bad"); }).then(function () { busy(b, false); });
  });

  /* ---------- boot ---------- */
  api("/api/me").then(function (d) { if (d.admin) showApp(); else showLogin(); }).catch(function () { showLogin(); });
})();
