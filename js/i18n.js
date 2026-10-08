/* Deman.Store — لغة الواجهة (عربي / إنجليزي) + عملة العرض.
 *
 * اللغة: النص العربي هو الأصل. الترجمة الإنجليزية في الجدول EN تحت، ومفتاحها هو
 * النص العربي نفسه. أي نص ما له ترجمة يظهر بالعربي. لإضافة ترجمة: أضف سطراً في EN.
 *
 * العملة: الأسعار محفوظة ومخصومة بالريال السعودي. باقي العملات تحويل للعرض فقط
 * بأسعار الصرف من ‎/api/rates، وإذا تعذّر جلبها يبقى العرض بالريال.
 */
(function () {
  "use strict";

  var LS_LANG = "deman.lang", LS_CUR = "deman.cur", LS_RATES = "deman.rates.v1", SS_SCROLL = "deman.scroll";
  var RATES_TTL = 12 * 60 * 60 * 1000;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- language ---------- */
  var asked = null;
  try { asked = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  var lang = asked === "en" || asked === "ar" ? asked : (lsGet(LS_LANG) === "en" ? "en" : "ar");
  if (asked === lang) lsSet(LS_LANG, lang);
  var EN_ON = lang === "en";

  var html = document.documentElement;
  html.lang = lang;
  html.dir = EN_ON ? "ltr" : "rtl";
  if (EN_ON) {
    // Hide the Arabic source text until it is swapped, so English visitors never see it flash.
    html.classList.add("lang-en", "i18n-wait");
    var st = document.createElement("style");
    st.textContent = "html.i18n-wait body{visibility:hidden}";
    document.head.appendChild(st);
    setTimeout(function () { html.classList.remove("i18n-wait"); }, 1500);
  }

  var EN = {
    /* nav + shared */
    "Deman.Store | متجر ديمان": "Deman.Store | Digital Store",
    "Deman.Store — متجر ديمان للبرامج والمنتجات الرقمية، شراء وتسليم فوري عبر ديسكورد.": "Deman.Store — software and digital products, with instant delivery via Discord.",
    "متجر ديمان": "Digital Store",
    "الرئيسية": "Home",
    "المنتجات": "Products",
    "طريقة الشراء": "How to buy",
    "التقييمات": "Reviews",
    "الأسئلة": "FAQ",
    "الأسئلة الشائعة": "Frequently asked questions",
    "القائمة": "Menu",
    "ديسكورد": "Discord",
    "سيرفر الديسكورد": "Discord server",
    "روابط": "Links",
    "تواصل": "Contact",
    "طرق الدفع": "Payment methods",
    "Deman.Store — جميع الحقوق محفوظة": "Deman.Store — All rights reserved",
    "صُنع بـ 💜": "Made with 💜",
    "تنقل سريع": "Quick navigation",
    "العملة": "Currency",
    "اللغة": "Language",
    "متجر رقمي سعودي للبرامج والمنتجات الرقمية — تسليم فوري ودعم مباشر عبر ديسكورد.": "A Saudi digital store for software and digital products — instant delivery and direct support via Discord.",
    "متجر رقمي للبرامج والمنتجات الرقمية — تسليم فوري ودعم مباشر عبر ديسكورد.": "A digital store for software and digital products — instant delivery and direct support via Discord.",

    /* home */
    "المتجر الرقمي": "The digital store",
    "اشترِ عبر ديسكورد": "Buy via Discord",
    "انضم للسيرفر واستلم فوراً": "Join the server and get it instantly",
    "منتجاتنا": "Our products",
    "شعار Deman.Store": "Deman.Store logo",
    "تسليم فوري": "Instant delivery",
    "24/7 عبر ديسكورد": "24/7 via Discord",
    "تفعيل سهل": "Easy activation",
    "شرح خطوة بخطوة": "Step-by-step guide",
    "تحديثات مستمرة": "Regular updates",
    "دايم على آخر نسخة": "Always on the latest version",
    "أحدث": "Latest",
    "منتجات رقمية مختارة — السعر بالريال، وادفع من المتجر أو عبر ديسكورد.": "Hand-picked digital products — pay on the store or via Discord.",
    "ثلاث خطوات": "Three steps",
    "وتستلم": "and it's yours",
    "ادفع من المتجر بالبطاقة أو Apple Pay أو STC Pay، واستلم عبر ديسكورد. الشراء من السيرفر يبقى متاح.": "Pay on the store by card, Apple Pay or STC Pay, and receive your product via Discord. Buying through the server is still available.",
    "اختر منتجك": "Choose your product",
    "تصفّح المنتجات هنا وشوف التفاصيل والسعر بالريال.": "Browse the products here and check the details and the price.",
    "ادفع الآن": "Pay now",
    "بطاقة مدى أو فيزا أو ماستركارد، أو Apple Pay، أو STC Pay.": "Mada, Visa or Mastercard, Apple Pay, or STC Pay.",
    "استلم عبر ديسكورد": "Receive via Discord",
    "بعد نجاح الدفع افتح تذكرة في السيرفر ويوصلك المنتج.": "After a successful payment, open a ticket in the server and your product is delivered there.",
    "آراء": "Reviews from",
    "العملاء": "customers",
    "شارك تجربتك": "Share your experience",
    "اكتب رأيك": "Write a review",
    "الاسم": "Name",
    "اسمك أو اسم مختصر": "Your name or a short name",
    "المنتج": "Product",
    "— اختر المنتج —": "— Choose a product —",
    "التقييم": "Rating",
    "★★★★★ — ممتاز": "★★★★★ — Excellent",
    "★★★★☆ — جيد جداً": "★★★★☆ — Very good",
    "★★★☆☆ — جيد": "★★★☆☆ — Good",
    "رأيك": "Your review",
    "اكتب تجربتك باختصار...": "Briefly describe your experience...",
    "إرسال الرأي": "Submit review",
    "عندك": "Got a",
    "سؤال؟": "question?",
    "جاهز تبدأ؟": "Ready to start?",
    "ادخل سيرفر الديسكورد وكلّمنا مباشرة — الشراء والتسليم والدعم كله هناك.": "Join the Discord server and talk to us directly — purchases, delivery and support all happen there.",
    "انضم لسيرفر Deman.Store": "Join the Deman.Store server",
    "زائر الآن": "visitors now",
    "زائر يتصفح المتجر الآن": "visitors browsing the store now",
    "ما فيه منتجات في هذي الفئة حالياً.": "No products in this category right now.",
    "طلب": "orders",
    "طلب مكتمل": "completed orders",
    "تقييم من العملاء": "customer reviews",
    "{n} من 5": "{n} out of 5",
    "✓ شراء موثّق": "✓ Verified purchase",
    "ما فيه آراء منشورة حتى الآن — كن أول من يشارك تجربته.": "No reviews published yet — be the first to share your experience.",
    "تعذر إرسال الرأي": "Couldn't submit the review",
    "شكراً لك — تم استلام رأيك.": "Thank you — your review was received.",
    "الاسم مطلوب": "Name is required",
    "اكتب رأيك بشكل أوضح": "Please write a clearer review",
    "شراء جديد": "New purchase",
    "تعذّر تحميل بيانات المتجر، حدّث الصفحة بعد شوي.": "Couldn't load the store data. Please refresh the page shortly.",

    /* product cards + product page */
    "مثال": "Example",
    "اشترِ الآن": "Buy now",
    "التفاصيل": "Details",
    "أو عبر ديسكورد": "Or via Discord",
    "24 ساعة": "24 hours",
    "الكل": "All",
    "ادوات": "Tools",
    "أدوات": "Tools",
    "تحويل بنكي": "Bank transfer",
    "الأكثر طلباً": "Most popular",
    "أفضل قيمة": "Best value",
    "جديد": "New",
    "المنتج | Deman.Store": "Product | Deman.Store",
    "تفاصيل المنتج في Deman.Store": "Product details on Deman.Store",
    "المنتج غير موجود": "Product not found",
    "تأكد من الرابط.": "Check the link.",
    "الرجوع للمتجر": "Back to store",
    "اختر المدة": "Choose a duration",
    "{n} خيارات": "{n} options",
    "وفّر {n}٪": "Save {n}%",
    "/ يوم": "/ day",
    "الوصف": "Description",
    "أبرز المميزات": "Key features",
    "وش يشمل": "What's included",
    "التسليم": "Delivery",
    "اضغط «اشترِ الآن»": "Click “Buy now”",
    "ادفع بالبطاقة أو Apple Pay أو STC Pay. تقدر كمان تشتري عبر ديسكورد.": "Pay by card, Apple Pay or STC Pay. You can also buy via Discord.",
    "بعد الدفع افتح الديسكورد": "After paying, open Discord",
    "ادخل السيرفر وافتح تذكرة شراء.": "Join the server and open a purchase ticket.",
    "استلم منتجك": "Receive your product",
    "يوصلك المنتج داخل تذكرتك في سيرفر الديسكورد بعد تأكيد الدفع.": "Your product is delivered inside your ticket on the Discord server once the payment is confirmed.",
    "مسار التنقل": "Breadcrumb",
    "صور المنتج": "Product images",
    "الصورة السابقة": "Previous image",
    "الصورة التالية": "Next image",
    "تكبير الصورة": "Zoom image",
    "صورة {n}": "Image {n}",
    "منتج تجريبي (مثال)": "Demo product (example)",
    "متوفر · تسليم فوري": "In stock · Instant delivery",
    "تجريبي": "demo",
    "السعر": "Price",
    "خصم {n}٪": "{n}% off",
    "الدفع بالبطاقة أو Apple Pay أو STC Pay، والتسليم عبر ديسكورد.": "Pay by card, Apple Pay or STC Pay. Delivery is via Discord.",
    "مشاركة الرابط": "Share link",
    "مشاركة": "Share",
    "استفسار قبل الشراء": "Ask before you buy",
    "داخل تذكرتك بعد الدفع": "Inside your ticket after payment",
    "دعم مباشر": "Direct support",
    "فريقنا معك في الديسكورد": "Our team is with you on Discord",
    "شراء آمن": "Secure purchase",
    "طلبك موثّق بتذكرة خاصة": "Your order is tracked in a private ticket",
    "طوال مدة الاشتراك": "For the whole subscription period",
    "طرق الدفع المتاحة": "Available payment methods",
    "تفاصيل المنتج": "Product details",
    "منتجات قد تعجبك": "You may also like",
    "عرض الكل": "View all",
    "عرض الصورة": "Image viewer",
    "إغلاق": "Close",
    "السابقة": "Previous",
    "التالية": "Next",
    "تم نسخ الرابط": "Link copied",
    "السعر تقريبي — الدفع يتم بالريال السعودي ({sar}).": "Approximate price — you are charged in Saudi Riyal ({sar}).",

    /* checkout */
    "الدفع | Deman.Store": "Checkout | Deman.Store",
    "الدفع": "Checkout",
    "الدفع الآمن عبر ميسر في Deman.Store": "Secure payment via Moyasar on Deman.Store",
    "جاري تجهيز الدفع…": "Preparing checkout…",
    "حساب التاجر في ميسر غير مفعّل بعد، لذلك الدفع المباشر متوقف حالياً. تقدر تكمل الشراء عبر ديسكورد إلى أن يتم تفعيل الحساب.": "The merchant's Moyasar account isn't activated yet, so direct payment is currently unavailable. You can complete your purchase via Discord until the account is activated.",
    "الرجوع للمنتجات": "Back to products",
    "المنتج غير متاح": "Product unavailable",
    "تأكد من رابط المنتج، أو ارجع للمتجر واختر منتجاً ظاهراً.": "Check the product link, or go back to the store and pick an available product.",
    "الدفع الإلكتروني غير جاهز": "Online payment isn't ready",
    "ما نقدر نفتح نموذج الدفع حالياً. تقدر تكمل الشراء عبر ديسكورد.": "We can't open the payment form right now. You can complete your purchase via Discord.",
    "السعر غير صالح للدفع": "Price not valid for payment",
    "مبلغ هذا المنتج أقل من الحد الأدنى في ميسر. أكمل الشراء عبر ديسكورد.": "This product's amount is below Moyasar's minimum. Complete your purchase via Discord.",
    "رجوع للمنتج": "Back to product",
    "إتمام الشراء": "Complete your purchase",
    "المبلغ": "Amount",
    "يظهر زرّه على سفاري وأجهزة آبل": "The button appears on Safari and Apple devices",
    "البطاقة": "Card",
    "مدى · فيزا · ماستركارد": "Mada · Visa · Mastercard",
    "من داخل نموذج الدفع": "Inside the payment form",
    "دفع آمن ومشفّر عبر ميسر. ما نعتبر الطلب مكتملًا إلا بعد التحقق من المبلغ، والتسليم يصير بتذكرة في ديسكورد.": "Secure, encrypted payment via Moyasar. An order only counts as complete once the amount is verified, and delivery happens through a ticket on Discord.",
    "تبي طريقة ثانية؟": "Want another way?",
    "أكمل عبر ديسكورد": "Continue via Discord",
    "تعذر تحميل نموذج الدفع. حدّث الصفحة، أو اشترِ عبر ديسكورد.": "Couldn't load the payment form. Refresh the page, or buy via Discord.",
    "تعذر تحديث سعر الدفع. حدّث الصفحة وحاول مرة ثانية.": "Couldn't refresh the payment amount. Refresh the page and try again.",
    "ما اكتمل الدفع. جرّب مرة ثانية، أو اشترِ عبر ديسكورد.": "The payment didn't go through. Try again, or buy via Discord.",
    "تعذر فتح نموذج الدفع. حدّث الصفحة أو اشترِ عبر ديسكورد.": "Couldn't open the payment form. Refresh the page or buy via Discord.",
    "تعذر تجهيز الدفع": "Couldn't prepare checkout",
    "صار خلل أثناء تحميل بيانات الدفع. حدّث الصفحة بعد قليل.": "Something went wrong while loading the payment data. Please refresh shortly.",

    /* payment result */
    "نتيجة الدفع | Deman.Store": "Payment result | Deman.Store",
    "نتيجة عملية الدفع في Deman.Store": "Payment result on Deman.Store",
    "نتحقق من الدفع": "Verifying your payment",
    "لحظة ونأكد العملية مع ميسر قبل ما نعتبرها ناجحة.": "One moment — we're confirming the transaction with Moyasar before marking it successful.",
    "افتح ديسكورد لاستلام المنتج": "Open Discord to receive your product",
    "ما وصلنا رقم العملية": "We didn't receive a transaction ID",
    "ارجع لصفحة الدفع وأعد المحاولة. إذا انخصم المبلغ، افتح ديسكورد وأرسل إثبات الدفع.": "Go back to the checkout page and try again. If you were charged, open Discord and send proof of payment.",
    "تم الدفع": "Payment complete",
    "تم تأكيد الدفع. افتح ديسكورد وافتح تذكرة عشان نسلمك المنتج.": "Payment confirmed. Open Discord and create a ticket so we can deliver your product.",
    "تم الدفع بنجاح. افتح ديسكورد وافتح تذكرة عشان نسلمك المنتج.": "Payment successful. Open Discord and create a ticket so we can deliver your product.",
    "الحساب غير مفعّل": "Account not activated",
    "ما اكتمل الدفع": "Payment not completed",
    "تعذر التحقق من الدفع. حدّث الصفحة، وإذا انخصم المبلغ افتح ديسكورد.": "Couldn't verify the payment. Refresh the page, and if you were charged open Discord.",
    "تعذر التحقق": "Couldn't verify",
    "ما قدرنا نأكد العملية مع ميسر. حدّث الصفحة، وإذا انخصم المبلغ افتح ديسكورد وأرسل رقم العملية.": "We couldn't confirm the transaction with Moyasar. Refresh the page, and if you were charged open Discord and send the transaction ID.",
    "معرّف عملية الدفع غير صالح.": "Invalid payment ID.",
    "الدفع الإلكتروني غير مهيأ على الخادم.": "Online payment isn't configured on the server.",
    "تعذر الاتصال بميسر. حدّث الصفحة بعد قليل.": "Couldn't reach Moyasar. Please refresh shortly.",
    "لم نجد عملية الدفع.": "Payment not found.",
    "تعذر التحقق من الدفع. إذا انخصم المبلغ افتح ديسكورد وأرسل رقم العملية.": "Couldn't verify the payment. If you were charged, open Discord and send the transaction ID.",
    "استجابة التحقق لا تطابق عملية الدفع.": "The verification response doesn't match the payment.",
    "عملية الدفع غير مرتبطة بمنتج معروف، لذلك ما نعتبرها مكتملة.": "This payment isn't linked to a known product, so we can't mark it complete.",
    "المبلغ أو العملة لا تطابق سعر المنتج. لا نعتبر الطلب مكتملًا — راسلنا في الديسكورد مع رقم العملية.": "The amount or currency doesn't match the product price. The order isn't complete — message us on Discord with the transaction ID.",
    "فشلت عملية الدفع. جرّب مرة ثانية أو اشترِ عبر ديسكورد.": "The payment failed. Try again or buy via Discord.",
    "الدفع لم يكتمل بعد. إذا خُصم المبلغ حدّث الصفحة، أو افتح ديسكورد وأرسل رقم العملية.": "The payment isn't complete yet. If you were charged, refresh the page, or open Discord and send the transaction ID.",

    /* policy pages + footer links */
    "السياسات": "Policies",
    "سياسة الاسترجاع": "Refund policy",
    "الشروط والأحكام": "Terms & conditions",
    "الخصوصية": "Privacy",
    "تواصل معنا": "Contact us",
    "سياسة الاسترجاع | Deman.Store": "Refund policy | Deman.Store",
    "الشروط والأحكام | Deman.Store": "Terms & conditions | Deman.Store",
    "سياسة الخصوصية | Deman.Store": "Privacy policy | Deman.Store",
    "تواصل معنا | Deman.Store": "Contact us | Deman.Store",
    "سياسة الاسترجاع في Deman.Store للمنتجات الرقمية والخدمات.": "Deman.Store refund policy for digital products and services.",
    "الشروط والأحكام للشراء من Deman.Store.": "Terms and conditions for buying from Deman.Store.",
    "كيف يتعامل Deman.Store مع بياناتك.": "How Deman.Store handles your data.",
    "تواصل مع Deman.Store عبر سيرفر الديسكورد.": "Contact Deman.Store on our Discord server.",
    "بإتمام الدفع أنت موافق على {terms} و{refund}.": "By completing the payment you agree to the {terms} and the {refund}.",

    /* support chat */
    "مساعد ديمان": "Deman Assistant",
    "هلا! أنا مساعد Deman.Store، كيف أقدر أساعدك؟": "Hi! I'm the Deman.Store assistant. How can I help?",
    "إغلاق المحادثة": "Close chat",
    "رسالتك": "Your message",
    "اكتب سؤالك...": "Type your question...",
    "إرسال": "Send",
    "يكتب...": "Typing...",
    "عذراً، صار خلل. حاول مرة ثانية أو كلم الدعم في الديسكورد.": "Sorry, something went wrong. Try again or contact support on Discord.",
    "عذراً، صار خلل. حاول مرة ثانية.": "Sorry, something went wrong. Please try again.",
    "عذراً، المساعد مشغول الحين. حاول مرة ثانية بعد قليل، أو كلم الدعم في سيرفر الديسكورد.": "Sorry, the assistant is busy right now. Try again shortly, or contact support on the Discord server.",
    "المساعد مزدحم الحين. حاول مرة ثانية بعد كم ثانية.": "The assistant is busy right now. Please try again in a few seconds.",
    "الرسالة طويلة أو المحادثة كبيرة. اختصر سؤالك وأرسله مرة ثانية.": "The message is too long or the conversation is too large. Shorten your question and send it again.",
    "اكتب سؤالك وأرسله مرة ثانية.": "Type your question and send it again."
  };

  function toLatin(s) {
    return String(s).replace(/[٠-٩]/g, function (d) { return String("٠١٢٣٤٥٦٧٨٩".indexOf(d)); });
  }
  function norm(s) { return toLatin(s).replace(/\s+/g, " ").trim(); }
  function fill(s, vars) {
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? m : String(vars[k]); });
  }
  /** Arabic source text in, the active language out. */
  function t(s, vars) {
    var src = String(s == null ? "" : s);
    if (!EN_ON) return fill(src, vars);
    var hit = EN[norm(src)];
    return fill(hit == null ? src : hit, vars);
  }
  /** Admin content: the English field (key + "_en") when the site is in English and it is filled. */
  function pick(obj, key) {
    if (!obj) return "";
    var en = obj[key + "_en"];
    if (EN_ON && en != null && (Array.isArray(en) ? en.length : String(en).trim())) return en;
    return obj[key];
  }

  var UNITS = [
    [/سنتين/, "2 years"], [/شهرين/, "2 months"], [/[أا]سبوعين/, "2 weeks"], [/يومين/, "2 days"],
    [/سنة|سنه|سنوات|عام/, "year"], [/شهر|[أا]شهر|شهور/, "month"], [/[أا]سبوع|[أا]سابيع/, "week"], [/يوم|[أا]يام/, "day"]
  ];
  /** "شهر واحد" → "1 month", "3 أشهر" → "3 months". Anything unrecognised is returned as written. */
  function durationEn(v) {
    var s = toLatin(String(v || "")).trim();
    if (!s || !/[؀-ۿ]/.test(s)) return s;
    if (/مدى الحياة|دائم/.test(s)) return "Lifetime";
    for (var i = 0; i < UNITS.length; i++) {
      if (!UNITS[i][0].test(s)) continue;
      if (/^\d/.test(UNITS[i][1])) return UNITS[i][1];
      var m = s.match(/(\d+(?:\.\d+)?)/), n = m ? Number(m[1]) : 1;
      return n + " " + UNITS[i][1] + (n === 1 ? "" : "s");
    }
    return s;
  }

  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  /** Swap the Arabic text written in the HTML for English. No-op in Arabic. */
  function applyStatic(root) {
    if (!EN_ON) return;
    root = root || document;
    var scope = root.body || root;
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var p = node.parentElement;
      if (!p || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName)) return;
      var raw = node.nodeValue, key = norm(raw);
      if (!key || EN[key] == null) return;
      node.nodeValue = raw.match(/^\s*/)[0] + EN[key] + raw.match(/\s*$/)[0];
    });
    Array.prototype.forEach.call(scope.querySelectorAll("[placeholder],[aria-label],[title],[alt]"), function (el) {
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && EN[norm(v)] != null) el.setAttribute(a, EN[norm(v)]);
      });
    });
    if (root === document) {
      if (EN[norm(document.title)] != null) document.title = EN[norm(document.title)];
      var md = document.querySelector('meta[name="description"]');
      if (md && EN[norm(md.content)] != null) md.content = EN[norm(md.content)];
    }
  }

  /* ---------- currency ---------- */
  var CURRENCIES = [
    { code: "SAR", ar: "ر.س", dec: 2 },
    { code: "USD", ar: "$", dec: 2 },
    { code: "EUR", ar: "€", dec: 2 },
    { code: "GBP", ar: "£", dec: 2 },
    { code: "AED", ar: "د.إ", dec: 2 },
    { code: "KWD", ar: "د.ك", dec: 3 },
    { code: "QAR", ar: "ر.ق", dec: 2 },
    { code: "BHD", ar: "د.ب", dec: 3 },
    { code: "OMR", ar: "ر.ع", dec: 3 },
    { code: "EGP", ar: "ج.م", dec: 2 }
  ];
  function curInfo(code) {
    for (var i = 0; i < CURRENCIES.length; i++) if (CURRENCIES[i].code === code) return CURRENCIES[i];
    return null;
  }
  var chosen = curInfo(lsGet(LS_CUR)) ? lsGet(LS_CUR) : "SAR";
  var rates = null, ratesFresh = false, sarLabelAr = "ر.س";

  function validRates(r) {
    if (!r || typeof r !== "object") return null;
    var out = { SAR: 1 }, any = false;
    CURRENCIES.forEach(function (c) {
      var v = Number(r[c.code]);
      if (c.code !== "SAR" && isFinite(v) && v > 0) { out[c.code] = v; any = true; }
    });
    return any ? out : null;
  }
  (function readCachedRates() {
    try {
      var saved = JSON.parse(lsGet(LS_RATES) || "null");
      // An older copy is still used for the first paint; ensureRates() replaces it in the background.
      if (saved) { rates = validRates(saved.rates); ratesFresh = Boolean(rates) && Date.now() - Number(saved.at) < RATES_TTL; }
    } catch (e) {}
  })();

  var ratesPromise = null;
  /** Fetches today's exchange rates unless a fresh copy is already cached. Never rejects. */
  function ensureRates() {
    if (ratesFresh || location.protocol === "file:") return Promise.resolve(rates);
    if (!ratesPromise) {
      var ctl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
      ratesPromise = fetch("/api/rates", ctl ? { signal: ctl.signal } : {})
        .then(function (r) { if (!r.ok) throw new Error("rates"); return r.json(); })
        .then(function (d) {
          var next = validRates(d && d.rates);
          if (next) { rates = next; ratesFresh = true; lsSet(LS_RATES, JSON.stringify({ at: Date.now(), rates: rates })); }
          return rates;
        })
        .catch(function () { ratesPromise = null; return rates; })
        .then(function (r) { clearTimeout(timer); return r; });
    }
    return ratesPromise;
  }
  /** The currency actually on screen: the chosen one, or SAR while its rate is unknown. */
  function active() { return chosen !== "SAR" && rates && rates[chosen] ? chosen : "SAR"; }
  function labelOf(code) {
    if (EN_ON) return code;
    return code === "SAR" ? sarLabelAr : curInfo(code).ar;
  }
  function numText(value, dec) {
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function sarText(sar) { var n = Number(sar); return numText(isFinite(n) ? n : 0, 2); }
  function moneyText(sar) {
    var n = Number(sar), code = active();
    if (!isFinite(n)) n = 0;
    return numText(code === "SAR" ? n : n * rates[code], curInfo(code).dec);
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sarAttr(sar) { var n = Number(sar); return ' data-sar="' + (isFinite(n) ? n : 0) + '"'; }
  /** Price markup that follows the currency switch without re-rendering the page. */
  function moneyHTML(sar) { return '<span class="js-money"' + sarAttr(sar) + ">" + moneyText(sar) + "</span>"; }
  function curHTML() { return '<span class="js-cur">' + esc(labelOf(active())) + "</span>"; }
  function approxText(sar) { return "≈ " + moneyText(sar) + " " + labelOf(active()); }
  function noteText(sar) { return t("السعر تقريبي — الدفع يتم بالريال السعودي ({sar}).", { sar: sarText(sar) + " " + labelOf("SAR") }); }
  /** "≈ 1.99 USD" beside an amount that is charged in SAR. Hidden while the display currency is SAR. */
  function approxHTML(sar) {
    var isSar = active() === "SAR";
    return '<span class="js-approx" dir="ltr"' + sarAttr(sar) + (isSar ? " hidden" : "") + ">" + (isSar ? "" : esc(approxText(sar))) + "</span>";
  }
  /** One-line reminder that the charge is in SAR. Hidden while the display currency is SAR. */
  function sarNoteHTML(sar) {
    var isSar = active() === "SAR";
    return '<p class="cur-note js-sar-note"' + sarAttr(sar) + (isSar ? " hidden" : "") + ">" + (isSar ? "" : esc(noteText(sar))) + "</p>";
  }

  function refreshMoney(root) {
    root = root || document;
    var isSar = active() === "SAR", label = labelOf(active());
    function each(sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); }
    each(".js-money", function (el) { el.textContent = moneyText(el.getAttribute("data-sar")); });
    each(".js-cur", function (el) { el.textContent = label; });
    each(".js-approx", function (el) {
      el.hidden = isSar;
      el.textContent = isSar ? "" : approxText(el.getAttribute("data-sar"));
    });
    each(".js-sar-note", function (el) {
      el.hidden = isSar;
      el.textContent = isSar ? "" : noteText(el.getAttribute("data-sar"));
    });
    // The switch shows what is really on screen: it stays on SAR while a rate is unavailable.
    var sel = document.getElementById("prefCur");
    if (sel) sel.value = active();
  }

  function setCurrency(code) {
    if (!curInfo(code)) return;
    chosen = code;
    lsSet(LS_CUR, code);
    if (code === "SAR" || rates) refreshMoney(document);
    if (code !== "SAR") ensureRates().then(function () { refreshMoney(document); });
  }
  function setSarLabel(v) {
    v = String(v == null ? "" : v).trim();
    if (v) sarLabelAr = v.slice(0, 20);
    refreshMoney(document);
  }
  function setLang(next) {
    if (next !== "ar" && next !== "en" || next === lang) return;
    lsSet(LS_LANG, next);
    try { sessionStorage.setItem(SS_SCROLL, String(window.scrollY || 0)); } catch (e) {}
    var url = new URL(location.href);
    url.searchParams.delete("lang");
    if (url.href === location.href) location.reload();
    else location.replace(url.href);
  }
  /** After a language switch, put the visitor back where they were. Call once the page has rendered. */
  function restoreScroll() {
    try {
      var y = Number(sessionStorage.getItem(SS_SCROLL));
      sessionStorage.removeItem(SS_SCROLL);
      if (y > 0) window.scrollTo(0, y);
    } catch (e) {}
  }

  /* ---------- header controls ---------- */
  function mountControls() {
    var host = document.querySelector(".nav-act");
    if (!host || document.getElementById("prefCur")) return;
    var box = document.createElement("div");
    box.className = "prefs";
    var sel = document.createElement("select");
    sel.id = "prefCur";
    sel.className = "pref-cur";
    sel.setAttribute("aria-label", t("العملة"));
    sel.title = t("العملة");
    CURRENCIES.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.code;
      o.textContent = c.code;
      sel.appendChild(o);
    });
    sel.value = active();
    sel.addEventListener("change", function () { setCurrency(sel.value); });

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "prefLang";
    btn.className = "pref-lang";
    btn.lang = EN_ON ? "ar" : "en";
    btn.setAttribute("aria-label", EN_ON ? "العربية" : "English");
    btn.title = EN_ON ? "العربية" : "English";
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18"/></svg><span>' +
      (EN_ON ? "عربي" : "EN") + "</span>";
    btn.addEventListener("click", function () { setLang(EN_ON ? "ar" : "en"); });

    box.appendChild(sel);
    box.appendChild(btn);
    host.insertBefore(box, host.firstChild);
  }

  var started = false;
  /** Translate the static page and add the header switches. Safe to call more than once. */
  function init() {
    if (started) return;
    started = true;
    applyStatic(document);
    mountControls();
    html.classList.remove("i18n-wait");
    // The page never waits for rates: prices show in SAR (or with the cached rate) and update in place.
    if (chosen !== "SAR") ensureRates().then(function () { refreshMoney(document); });
  }

  window.DEMAN_I18N = {
    lang: lang, en: EN_ON, dir: EN_ON ? "ltr" : "rtl", pct: EN_ON ? "%" : "٪",
    t: t, pick: pick, durationEn: durationEn, applyStatic: applyStatic, init: init,
    currency: function () { return active(); }, label: function () { return labelOf(active()); },
    sarLabel: function () { return labelOf("SAR"); }, sarText: sarText,
    moneyHTML: moneyHTML, curHTML: curHTML, approxHTML: approxHTML, sarNoteHTML: sarNoteHTML,
    refreshMoney: refreshMoney, setCurrency: setCurrency, setSarLabel: setSarLabel, setLang: setLang,
    restoreScroll: restoreScroll
  };
})();
