/* Deman.Store checkout — Moyasar Form (cards, Apple Pay, STC Pay). */
(function () {
  "use strict";

  var I = window.DEMAN_I18N, T = I.t;
  var INACTIVE = T("حساب التاجر في ميسر غير مفعّل بعد، لذلك الدفع المباشر متوقف حالياً. تقدر تكمل الشراء عبر ديسكورد إلى أن يتم تفعيل الحساب.");
  var DISCORD = '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.4C.6 9.1-.3 13.6.1 18.1A19.9 19.9 0 0 0 6.2 21l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6.1-3c.5-5.2-.9-9.7-3.6-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeDiscord(url) {
    url = String(url || "").trim();
    return /^https:\/\/(?:discord\.gg\/|discord\.com\/invite\/)[A-Za-z0-9-]+\/?$/.test(url) ? url : "";
  }
  function safeImg(url) {
    url = String(url || "");
    return /^(https?:\/\/|\/api\/img\/|\/?images\/)/.test(url) ? url : "";
  }
  function appleLabel(name) {
    var label = String(name || "").trim();
    return /^[\x20-\x7E]+$/.test(label) ? label.slice(0, 64) : "Deman.Store";
  }
  function showError(message) {
    var box = document.getElementById("payError");
    if (!box) return;
    box.hidden = false;
    box.textContent = message;
  }
  function inactiveError(error) {
    var type = error && error.type ? String(error.type) : "";
    var message = typeof error === "string" ? error : String(error && error.message || "");
    var blob = type + " " + message;
    return /account_inactive/i.test(blob) || /not activated/i.test(blob) || /entity not activated/i.test(blob);
  }

  var root = document.getElementById("checkout");
  var productId = new URLSearchParams(location.search).get("product") || "";

  function failPage(title, text, discord) {
    root.innerHTML = '<div class="checkout-status"><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p>' +
      (discord ? '<a class="btn btn-p" href="' + esc(discord) + '" target="_blank" rel="noopener">' + DISCORD + T("اشترِ عبر ديسكورد") + '</a> ' : '') +
      '<a class="btn btn-o" href="index.html#products">' + T("الرجوع للمنتجات") + '</a></div>';
  }

  Promise.all([
    fetch("/api/products", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("products"); return r.json(); }),
    fetch("/api/payments/config", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("config"); return r.json(); })
  ]).then(function (res) {
    var products = res[0] || [];
    var pay = res[1] || {};
    var product = products.filter(function (item) { return item && item.id === productId; })[0];
    var quote = (pay.products || []).filter(function (item) { return item && item.id === productId; })[0];
    var discord = safeDiscord(pay.discord_invite);
    if (!product || !quote) {
      failPage(T("المنتج غير متاح"), T("تأكد من رابط المنتج، أو ارجع للمتجر واختر منتجاً ظاهراً."), discord);
      return;
    }
    if (!pay.payments_ready || !pay.publishable_key) {
      failPage(T("الدفع الإلكتروني غير جاهز"), T("ما نقدر نفتح نموذج الدفع حالياً. تقدر تكمل الشراء عبر ديسكورد."), discord);
      return;
    }
    if (!quote.amount || quote.amount < 100) {
      failPage(T("السعر غير صالح للدفع"), T("مبلغ هذا المنتج أقل من الحد الأدنى في ميسر. أكمل الشراء عبر ديسكورد."), discord);
      return;
    }

    var img = safeImg(product.images && product.images[0]) || "images/logo-512.png";
    var description = ("Deman.Store — " + product.name).slice(0, 200);
    var callbackUrl = new URL("thanks.html", location.href);
    callbackUrl.search = "";
    callbackUrl.hash = "";
    document.title = T("الدفع") + " | " + (pay.store_name || "Deman.Store");
    var duration = quote.duration ? (I.en ? I.durationEn(quote.duration) : quote.duration) : "";

    root.innerHTML =
      '<div class="pay-stage">' +
        '<a class="pay-back" href="product.html?id=' + encodeURIComponent(product.id) + '">' + T("رجوع للمنتج") + '</a>' +
        '<article class="pay-panel" aria-label="' + T("إتمام الشراء") + '">' +
          '<header class="pay-hero">' +
            '<img src="' + esc(img) + '" alt="">' +
            '<div class="pay-id"><span class="tag"><i class="dot"></i>' + T("إتمام الشراء") + '</span><h1>' + esc(product.name) + '</h1>' +
              (duration ? '<p>' + esc(duration) + '</p>' : '') + '</div>' +
            // The charge is always in SAR; the visitor's own currency is shown beside it as a guide only.
            '<div class="pay-amount"><small>' + T("المبلغ") + '</small><b dir="ltr">' + esc(quote.amount_sar) + '</b><span>' + esc(I.sarLabel()) + '</span>' +
              I.approxHTML(quote.amount / 100) + '</div>' +
          '</header>' +
          '<div class="pay-methods" aria-label="' + T("طرق الدفع") + '">' +
            '<div class="pay-method apple"><b>Apple Pay</b><span>' + T("يظهر زرّه على سفاري وأجهزة آبل") + '</span></div>' +
            '<div class="pay-method card"><b>' + T("البطاقة") + '</b><span>' + T("مدى · فيزا · ماستركارد") + '</span></div>' +
            '<div class="pay-method stc"><b>STC Pay</b><span>' + T("من داخل نموذج الدفع") + '</span></div>' +
          '</div>' +
          '<p class="pay-alert" id="payError" hidden></p>' +
          '<div class="pay-form"><div id="moyasar-form"></div></div>' +
          '<p class="pay-trust">' + T("دفع آمن ومشفّر عبر ميسر. ما نعتبر الطلب مكتملًا إلا بعد التحقق من المبلغ، والتسليم يصير بتذكرة في ديسكورد.") + '</p>' +
          '<p class="pay-terms">' + T("بإتمام الدفع أنت موافق على {terms} و{refund}.", {
            terms: '<a href="terms.html" target="_blank" rel="noopener">' + T("الشروط والأحكام") + '</a>',
            refund: '<a href="refund.html" target="_blank" rel="noopener">' + T("سياسة الاسترجاع") + '</a>'
          }) + '</p>' +
          (discord ? '<p class="pay-alt">' + T("تبي طريقة ثانية؟") + ' <a href="' + esc(discord) + '" target="_blank" rel="noopener">' + DISCORD + T("أكمل عبر ديسكورد") + '</a></p>' : '') +
        '</article>' +
      '</div>';

    if (!window.Moyasar || typeof window.Moyasar.init !== "function") {
      showError(T("تعذر تحميل نموذج الدفع. حدّث الصفحة، أو اشترِ عبر ديسكورد."));
      return;
    }

    try {
      window.Moyasar.init({
        element: "#moyasar-form",
        amount: quote.amount,
        currency: "SAR",
        description: description,
        publishable_api_key: pay.publishable_key,
        callback_url: callbackUrl.href,
        language: I.lang,
        fixed_width: false,
        supported_networks: ["mada", "visa", "mastercard", "unionpay"],
        methods: ["creditcard", "applepay", "stcpay"],
        metadata: { product_id: product.id },
        apple_pay: {
          country: "SA",
          label: appleLabel(pay.store_name),
          validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate"
        },
        on_initiating: async function () {
          try {
            var freshRes = await fetch("/api/payments/config", { cache: "no-store" });
            if (!freshRes.ok) return false;
            var fresh = await freshRes.json();
            var next = (fresh.products || []).filter(function (item) { return item && item.id === product.id; })[0];
            if (!next || !next.amount || next.amount < 100) return false;
            return {
              amount: next.amount,
              description: description,
              callback_url: callbackUrl.href,
              metadata: { product_id: product.id }
            };
          } catch (error) {
            showError(T("تعذر تحديث سعر الدفع. حدّث الصفحة وحاول مرة ثانية."));
            return false;
          }
        },
        on_failure: async function (error) {
          if (inactiveError(error)) showError(INACTIVE);
          else showError(T("ما اكتمل الدفع. جرّب مرة ثانية، أو اشترِ عبر ديسكورد."));
        }
      });
    } catch (error) {
      console.error(error);
      showError(T("تعذر فتح نموذج الدفع. حدّث الصفحة أو اشترِ عبر ديسكورد."));
    }
  }).catch(function () {
    failPage(T("تعذر تجهيز الدفع"), T("صار خلل أثناء تحميل بيانات الدفع. حدّث الصفحة بعد قليل."), "");
  });
})();
