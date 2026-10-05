/* Deman.Store admin panel */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function isImgUrl(u) { return /^(https?:\/\/|\/api\/img\/|\/?images\/)/.test(String(u || "")); }
  function imgSrc(u) { u = String(u || ""); return /^images\//.test(u) ? "/" + u : u; }
  var MAX = 2 * 1024 * 1024, TYPES = ["image/png", "image/jpeg", "image/webp"];
  var S = { products: [], config: {}, edit: null, images: [] };

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
    $("#vProducts").hidden = v !== "products"; $("#vSettings").hidden = v !== "settings";
    history.replaceState(null, "", v === "settings" ? "#settings" : "#");
  });

  function loadAll() {
    return Promise.all([api("/api/products?all=1"), api("/api/config")]).then(function (r) {
      S.products = r[0]; S.config = r[1];
      renderProducts(); renderSettings();
      if (location.hash === "#settings") $('#tabs [data-v="settings"]').click();
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
        '<div><h4>' + esc(p.name) + '</h4><div class="meta"><b>' + esc(p.price) + ' ' + esc(p.currency || S.config.currency || "") + '</b>' +
        (p.duration ? '<span>⏱ ' + esc(p.duration) + '</span>' : '') + '<span>' + esc(catName(p.category)) + '</span><span>ترتيب: ' + esc(p.sort) + '</span>' +
        '<span class="pill ' + (p.visible !== false ? 'on">ظاهر' : 'off">مخفي') + '</span></div></div>' +
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
        S.products = S.products.filter(function (x) { return x.id !== id; }); renderProducts(); toast("انحذف المنتج");
      }).catch(function (x) { toast(x.message, "bad"); });
    }
  });
  $("#pList").addEventListener("change", function (e) {
    var cb = e.target.closest('[data-act="vis"]'); if (!cb) return;
    var id = cb.closest(".prow").getAttribute("data-id");
    api("/api/products/" + encodeURIComponent(id), { method: "PUT", body: { visible: cb.checked } }).then(function (d) {
      S.products = S.products.map(function (x) { return x.id === id ? d.product : x; }); renderProducts(); toast(d.product.visible ? "صار ظاهر" : "صار مخفي");
    }).catch(function (x) { cb.checked = !cb.checked; toast(x.message, "bad"); });
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
    F.price.value = p.price != null ? p.price : ""; F.currency.value = p.currency || "";
    F.sort.value = p.sort != null ? p.sort : ""; F.duration.value = p.duration || "";
    F.buy_link.value = p.buy_link || ""; F.short.value = p.short || "";
    F.old_price.value = p.old_price != null ? p.old_price : ""; F.badge.value = p.badge || "";
    F.features.value = (p.features || []).join("\n"); F.included.value = (p.included || []).join("\n");
    F.delivery.value = p.delivery || "";
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
      name: F.name.value, description: F.description.value, price: F.price.value, currency: F.currency.value,
      sort: F.sort.value, duration: F.duration.value, category: F.category.value, buy_link: F.buy_link.value,
      visible: F.visible.checked, featured: F.featured.checked, demo: F.demo.checked, images: S.images,
      short: F.short.value, old_price: F.old_price.value, badge: F.badge.value,
      features: lines(F.features.value), included: lines(F.included.value), delivery: F.delivery.value
    };
    if (body.buy_link && !/^https?:\/\//i.test(body.buy_link.trim())) { toast("رابط الشراء لازم يبدأ بـ https://", "bad"); return; }
    var b = $("#edSave"); busy(b, true);
    var req = S.edit ? api("/api/products/" + encodeURIComponent(S.edit.id), { method: "PUT", body: body }) : api("/api/products", { method: "POST", body: body });
    req.then(function () { closeEditor(); toast("انحفظ المنتج"); return api("/api/products?all=1"); })
      .then(function (l) { S.products = l; renderProducts(); })
      .catch(function (x) { toast(x.message, "bad"); })
      .then(function () { busy(b, false); });
  });

  /* ---------- settings ---------- */
  var SF = $("#setForm");
  var FIELDS = ["store_name", "brand_ar", "discord_invite", "currency", "domain", "hero_title", "hero_subtitle", "announcement"];
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
    return '<div class="rp cat"><div class="col"><input class="c-name" placeholder="اسم الفئة" maxlength="60" value="' + esc(c.name) + '"></div>' +
      '<div class="col"><input class="c-id" placeholder="المعرّف (english-id)" maxlength="40" dir="ltr" value="' + esc(c.id) + '"></div>' +
      '<button type="button" class="btn btn-d rm-row" aria-label="حذف">✕</button></div>';
  }
  function faqRow(f) {
    f = f || {};
    return '<div class="rp faq"><div class="col"><input class="fq" placeholder="السؤال" maxlength="300" value="' + esc(f.q) + '">' +
      '<textarea class="fa" rows="2" placeholder="الجواب">' + esc(f.a) + '</textarea></div>' +
      '<button type="button" class="btn btn-d rm-row" aria-label="حذف">✕</button></div>';
  }
  function renderSettings() {
    var c = S.config;
    FIELDS.forEach(function (k) { SF[k].value = c[k] != null ? c[k] : (k === "store_name" ? (c.brand || "") : ""); });
    $("#payList").innerHTML = (c.payment_methods || []).map(payRow).join("");
    $("#catList").innerHTML = (c.categories || []).filter(function (x) { return x.id !== "all"; }).map(catRow).join("");
    $("#faqList").innerHTML = (c.faq || []).map(faqRow).join("");
  }
  $("#addPay").addEventListener("click", function () { $("#payList").insertAdjacentHTML("beforeend", payRow()); $("#payList .rp:last-child .pm-name").focus(); });
  $("#addCat").addEventListener("click", function () { $("#catList").insertAdjacentHTML("beforeend", catRow()); $("#catList .rp:last-child .c-name").focus(); });
  $("#addFaq").addEventListener("click", function () { $("#faqList").insertAdjacentHTML("beforeend", faqRow()); $("#faqList .rp:last-child .fq").focus(); });
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
    if (body.discord_invite && !/^https?:\/\//i.test(body.discord_invite.trim())) { toast("رابط الديسكورد لازم يبدأ بـ https://", "bad"); return; }
    body.payment_methods = $$("#payList .rp").map(function (r) { return { name: $(".pm-name", r).value.trim(), icon: $(".pm-icon", r).value.trim() }; }).filter(function (m) { return m.name; });
    body.categories = $$("#catList .rp").map(function (r) {
      var name = $(".c-name", r).value.trim(), id = $(".c-id", r).value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
      if (!id && name) id = "cat-" + Math.random().toString(36).slice(2, 7);
      return { id: id, name: name };
    }).filter(function (c) { return c.id && c.name; });
    body.faq = $$("#faqList .rp").map(function (r) { return { q: $(".fq", r).value.trim(), a: $(".fa", r).value.trim() }; }).filter(function (f) { return f.q || f.a; });
    var b = $("#saveSet"); busy(b, true);
    api("/api/config", { method: "PUT", body: body }).then(function (d) { S.config = d.config; renderSettings(); renderProducts(); toast("انحفظت الإعدادات"); })
      .catch(function (x) { toast(x.message, "bad"); }).then(function () { busy(b, false); });
  });

  /* ---------- boot ---------- */
  api("/api/me").then(function (d) { if (d.admin) showApp(); else showLogin(); }).catch(function () { showLogin(); });
})();
