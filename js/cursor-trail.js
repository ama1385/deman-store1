/* Meteor cursor trail. Fine pointers only, one canvas, never blocks clicks. */
(function () {
  if (!window.matchMedia) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var fine = matchMedia("(pointer: fine)").matches || matchMedia("(any-pointer: fine)").matches;
  if (!fine) return;
  var c = document.createElement("canvas");
  c.id = "cursor-trail";
  c.setAttribute("aria-hidden", "true");
  document.body.appendChild(c);
  var ctx = c.getContext("2d", { alpha: true });
  if (!ctx) return;
  var dpr = 1, pts = [], mx = -1e4, my = -1e4, hot = false, running = false;
  var LIFE = 460, MAX = 26;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    c.height = Math.max(1, Math.floor(window.innerHeight * dpr));
  }
  function frame(now) {
    running = true;
    var i, keep = [];
    for (i = 0; i < pts.length; i++) if (now - pts[i].t < LIFE) keep.push(pts[i]);
    pts = keep;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineCap = "round";
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var fade = 1 - (now - b.t) / LIFE;
      if (fade <= 0) continue;
      ctx.strokeStyle = "rgba(210,155,253," + (fade * 0.5).toFixed(3) + ")";
      ctx.lineWidth = 1.2 + fade * 2.4;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (pts.length) {
      var h = pts[pts.length - 1];
      var g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 16);
      g.addColorStop(0, "rgba(255,248,255,.95)");
      g.addColorStop(0.28, "rgba(210,155,253,.8)");
      g.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 16, 0, 6.2832);
      ctx.fill();
    }
    if (pts.length || hot) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() { if (!running) requestAnimationFrame(frame); }
  function add(x, y) {
    mx = x; my = y;
    pts.push({ x: x, y: y, t: performance.now() });
    if (pts.length > MAX) pts.splice(0, pts.length - MAX);
    kick();
  }
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    hot = true;
    var dx = e.clientX - mx, dy = e.clientY - my;
    if (dx * dx + dy * dy < 16) return;
    add(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener("pointerdown", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    hot = true;
    add(e.clientX, e.clientY);
  }, { passive: true });
  document.addEventListener("mouseleave", function () { hot = false; });
  window.addEventListener("blur", function () { hot = false; });
  window.addEventListener("resize", resize);
  resize();
})();
