/* Deman.Store support chat. Name and greeting: js/chat-config.js */
(function () {
  "use strict";
  if (/\/admin(\/|$)/.test(location.pathname)) return;

  var cfg = window.DEMAN_CHAT || {};
  var BOT_NAME = cfg.name || "مساعد ديمان";
  var GREETING = cfg.greeting || "هلا! أنا مساعد Deman.Store، كيف أقدر أساعدك؟";
  var STORE_KEY = "deman.chat.v1";
  var MAX_CHARS = 800;
  var MAX_HISTORY = 12;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function validList(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (m) {
      return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() && !m.local;
    }).map(function (m) {
      return { role: m.role, content: m.content.trim().slice(0, MAX_CHARS) };
    }).slice(-MAX_HISTORY);
  }

  function loadHistory() {
    try {
      var saved = validList(JSON.parse(sessionStorage.getItem(STORE_KEY) || "null"));
      if (saved.length) return saved;
    } catch (e) {}
    return [{ role: "assistant", content: GREETING }];
  }

  function saveHistory(list) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(validList(list).slice(-MAX_HISTORY))); }
    catch (e) {}
  }

  var history = loadHistory();
  var root = document.createElement("div");
  root.className = "deman-chat";
  root.innerHTML =
    '<section class="deman-chat-panel" id="demanChatPanel" hidden aria-label="' + esc(BOT_NAME) + '">' +
      '<header class="deman-chat-head">' +
        '<span class="deman-chat-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z"/></svg></span>' +
        '<div class="deman-chat-id"><b></b><small>Deman.Store</small></div>' +
        '<button type="button" class="deman-chat-x" aria-label="إغلاق المحادثة">×</button>' +
      "</header>" +
      '<div class="deman-chat-log" id="demanChatLog" role="log" aria-live="polite"></div>' +
      '<form class="deman-chat-form">' +
        '<label class="deman-chat-sr" for="demanChatInput">رسالتك</label>' +
        '<textarea id="demanChatInput" rows="1" maxlength="' + MAX_CHARS + '" placeholder="اكتب سؤالك..." enterkeyhint="send"></textarea>' +
        '<button type="submit" aria-label="إرسال"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>' +
      "</form>" +
    "</section>" +
    '<button type="button" class="deman-chat-fab" id="demanChatFab" aria-expanded="false" aria-controls="demanChatPanel">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z"/></svg>' +
      '<span class="deman-chat-tip"></span>' +
    "</button>";
  document.body.appendChild(root);

  var panel = root.querySelector(".deman-chat-panel");
  var fab = root.querySelector(".deman-chat-fab");
  var log = root.querySelector(".deman-chat-log");
  var form = root.querySelector(".deman-chat-form");
  var input = root.querySelector("#demanChatInput");
  var sendBtn = form.querySelector('button[type="submit"]');
  root.querySelector(".deman-chat-id b").textContent = BOT_NAME;
  root.querySelector(".deman-chat-tip").textContent = BOT_NAME;
  fab.setAttribute("aria-label", BOT_NAME);
  fab.title = BOT_NAME;

  var pending = false;

  function bubble(role, text, extra) {
    var el = document.createElement("div");
    el.className = "deman-chat-msg " + (role === "user" ? "is-user" : "is-bot") + (extra ? " " + extra : "");
    var body = document.createElement("div");
    body.className = "deman-chat-bubble";
    body.dir = "auto";
    body.textContent = text;
    el.appendChild(body);
    return el;
  }

  function paint() {
    log.replaceChildren();
    history.forEach(function (m) { log.appendChild(bubble(m.role, m.content, m.local ? "is-local" : "")); });
    if (pending) log.appendChild(bubble("assistant", "يكتب...", "is-typing"));
    log.scrollTop = log.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("deman-chat-open", open);
    if (open) {
      paint();
      setTimeout(function () { input.focus(); }, 40);
    }
  }

  function grow() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 96) + "px";
  }

  fab.addEventListener("click", function () { setOpen(panel.hidden); });
  root.querySelector(".deman-chat-x").addEventListener("click", function () { setOpen(false); fab.focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) { setOpen(false); fab.focus(); }
  });
  input.addEventListener("input", grow);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || pending) return;
    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
    history.push({ role: "user", content: text });
    history = validList(history);
    saveHistory(history);
    input.value = "";
    grow();
    pending = true;
    sendBtn.disabled = true;
    paint();

    var payload = validList(history);
    fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: payload })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok || !data.reply) throw new Error(data.error || "عذراً، صار خلل. حاول مرة ثانية أو كلم الدعم في الديسكورد.");
        return data.reply;
      });
    }).then(function (reply) {
      history.push({ role: "assistant", content: String(reply) });
      history = validList(history);
      saveHistory(history);
    }).catch(function (err) {
      history.push({ role: "assistant", content: err.message || "عذراً، صار خلل. حاول مرة ثانية.", local: true });
    }).then(function () {
      pending = false;
      sendBtn.disabled = false;
      paint();
      input.focus();
    });
  });

  paint();
})();
