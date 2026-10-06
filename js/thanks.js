/* Payment result. The query status is ignored; the server verifies the payment with Moyasar. */
(function () {
  "use strict";

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>';
  var WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>';
  var CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeDiscord(url) {
    url = String(url || "").trim();
    return /^https:\/\/(?:discord\.gg\/|discord\.com\/invite\/)[A-Za-z0-9-]+\/?$/.test(url) ? url : "";
  }

  var root = document.getElementById("result");
  var id = String(new URLSearchParams(location.search).get("id") || "").trim();
  var idOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  function paint(kind, title, lead, extra) {
    var icon = kind === "ok" ? CHECK : kind === "warn" ? WARN : CLOCK;
    root.innerHTML = '<article class="result-card ' + kind + '"><div class="result-ico" aria-hidden="true">' + icon + '</div><h1>' +
      esc(title) + '</h1><p class="lead">' + esc(lead) + '</p>' + (extra || "") + '</article>';
  }

  function actions(discord) {
    var html = '<div class="result-actions">';
    if (discord) html += '<a class="btn btn-p js-discord" href="' + esc(discord) + '" target="_blank" rel="noopener">افتح ديسكورد لاستلام المنتج</a>';
    html += '<a class="btn btn-o" href="index.html">الرجوع للمتجر</a></div>';
    return html;
  }

  if (!idOk) {
    paint("bad", "ما وصلنا رقم العملية", "ارجع لصفحة الدفع وأعد المحاولة. إذا انخصم المبلغ، افتح ديسكورد وأرسل إثبات الدفع.", actions(""));
    return;
  }

  fetch("/api/payments/verify/" + encodeURIComponent(id), { cache: "no-store" })
    .then(function (r) { return r.json().catch(function () { return {}; }); })
    .then(function (data) {
      var discord = safeDiscord(data.discord_invite);
      var ref = '<p class="result-id" dir="ltr">' + esc(id) + '</p>';
      if (data && data.paid && data.ok) {
        var product = data.product || {};
        var meta = '<div class="result-meta"><b>' + esc(product.name || "المنتج") + '</b>' +
          (product.duration ? '<span>' + esc(product.duration) + '</span>' : '') +
          (data.amount_sar ? '<div class="result-sum" dir="ltr">' + esc(data.amount_sar) + ' <small>SAR</small></div>' : '') +
          ref + '</div>';
        paint("ok", "تم الدفع", data.message || "تم تأكيد الدفع. افتح ديسكورد وافتح تذكرة عشان نسلمك المنتج.", meta + actions(discord));
        return;
      }
      var kind = data && data.code === "account_inactive" ? "warn" : "bad";
      var title = kind === "warn" ? "الحساب غير مفعّل" : "ما اكتمل الدفع";
      paint(kind, title, (data && data.error) || "تعذر التحقق من الدفع. حدّث الصفحة، وإذا انخصم المبلغ افتح ديسكورد.", ref + actions(discord));
    })
    .catch(function () {
      paint("bad", "تعذر التحقق", "ما قدرنا نأكد العملية مع ميسر. حدّث الصفحة، وإذا انخصم المبلغ افتح ديسكورد وأرسل رقم العملية.", '<p class="result-id" dir="ltr">' + esc(id) + '</p>' + actions(""));
    });
})();
