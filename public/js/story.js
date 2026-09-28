/* Entrada cinematográfica: el scroll mueve puntos -> cuadrícula -> gráfica -> zoom a los distritos */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var trap = function (p, a, b, c, d) { return ease(seg(p, a, b)) * (1 - ease(seg(p, c, d))); };

  /* ---- Barra de progreso + parallax del hero ---- */
  var bar = document.querySelector('.s-progress');
  var hero = document.querySelector('.l-hero');
  var heroEls = hero ? [['.l-pill', .06], ['.l-title', .2], ['.l-sub', .13], ['.l-cta', .09], ['.l-stats', .04], ['.l-float', .32]]
    .map(function (x) { return { el: hero.querySelector(x[0]), k: x[1] }; }).filter(function (x) { return x.el; }) : [];
  function onScroll() {
    var sy = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? sy / max : 0) + ')';
    if (reduce || !hero) return;
    var hp = clamp(sy / hero.offsetHeight);
    heroEls.forEach(function (x) { x.el.style.transform = 'translate3d(0,' + (sy * x.k).toFixed(1) + 'px,0)'; });
    hero.style.opacity = (1 - hp * .9).toFixed(3);
    var t = hero.querySelector('.l-title'); if (t) t.style.transform += ' scale(' + (1 - hp * .1).toFixed(3) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- Escena fijada ---- */
  var sec = document.querySelector('[data-story]'); if (!sec) return;
  var cv = sec.querySelector('canvas.s-2d'), ctx = cv.getContext('2d');
  var stage = sec.querySelector('.s-stage'), big = sec.querySelector('.s-big'), hint = sec.querySelector('.s-hint');
  var caps = [].slice.call(sec.querySelectorAll('.s-cap'));
  var data = JSON.parse(document.getElementById('story-data').textContent);
  var W, H, dpr, dots = [], cur = 0, tgt = 0, running = false, mode3d = !!sec.dataset.mode;
  var rnd = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function build() {
    dots = data.map(function (d, i) { return { d: d, sx: .06 + rnd(i + 1) * .88, sy: .08 + rnd(i + 99) * .84, ph: rnd(i + 7) * 6.28, r0: 3 + rnd(i + 3) * 4 }; });
    rank();
  }
  function rank() {
    dots.slice().sort(function (a, b) { return b.d.v - a.d.v; }).forEach(function (d, i) { d.rk = i; });
  }
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var N = dots.length || 1, gw = W * .84, gh = H * .46;
    var cols = Math.max(1, Math.round(Math.sqrt(N * gw / gh)));
    var rows = Math.ceil(N / cols), cell = Math.min(gw / cols, gh / rows);
    var maxV = Math.max.apply(null, dots.map(function (d) { return d.d.v; }).concat(1));
    var slot = W * .8 / N, baseY = H * .8, maxH = H * .42;
    dots.forEach(function (d, i) {
      d.gx = (W - cell * cols) / 2 + (i % cols + .5) * cell;
      d.gy = H * .56 - cell * rows / 2 + (Math.floor(i / cols) + .5) * cell;
      d.gr = Math.min(cell * .3, 13);
      d.bw = Math.max(3, slot * .62);
      d.bh = 8 + (d.d.v / maxV) * (maxH - 8);
      d.bx = W * .1 + (d.rk + .5) * slot;
      d.by = baseY - d.bh / 2;
    });
    layout.baseY = baseY;
  }
  function rr(x, y, w, h) {
    var r = Math.min(w, h) / 2; ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var a1 = ease(seg(cur, .2, .48)), a2 = ease(seg(cur, .55, .8));
    ctx.fillStyle = 'rgba(160,200,230,' + (.25 * a2) + ')'; ctx.fillRect(W * .08, layout.baseY + 1, W * .84, 1);
    dots.forEach(function (d) {
      var sx = d.sx * W + Math.sin(t / 1800 + d.ph) * 16, sy = d.sy * H + Math.cos(t / 2100 + d.ph) * 16;
      var x = lerp(lerp(sx, d.gx, a1), d.bx, a2), y = lerp(lerp(sy, d.gy, a1), d.by, a2);
      var w = lerp(lerp(d.r0 * 2, d.gr * 2, a1), d.bw, a2), h = lerp(lerp(d.r0 * 2, d.gr * 2, a1), d.bh, a2);
      var col = d.d.c || '#3EE6D0';
      ctx.globalAlpha = d.d.c ? 1 : .55; ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = d.d.c ? 14 : 6;
      rr(x - w / 2, y - h / 2, w, h); ctx.fill();
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    if (a2 > .5) {
      ctx.font = '600 12px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(232,240,248,' + ((a2 - .5) * 2) + ')';
      dots.filter(function (d) { return d.d.v > 0 && d.rk < 3; }).forEach(function (d) {
        ctx.fillText(d.d.n, Math.min(W - 50, Math.max(50, d.bx)), d.by - d.bh / 2 - 10);
      });
    }
  }
  function ui() {
    var p = cur, bp = seg(p, 0, .3);
    big.style.transform = 'translate(-50%,-50%) scale(' + (1 + ease(bp) * 5).toFixed(3) + ')';
    big.style.opacity = (1 - seg(p, .04, .26)).toFixed(3);
    if (hint) hint.style.opacity = (1 - seg(p, 0, .06)).toFixed(3);
    var wins = [[.16, .24, .4, .48], [.44, .52, .68, .76], [.7, .78, .86, .92]];
    caps.forEach(function (c, i) {
      var o = trap.apply(null, [p].concat(wins[i]));
      c.style.opacity = o.toFixed(3); c.style.transform = 'translateY(' + ((1 - o) * 26).toFixed(1) + 'px)';
    });
    var z = ease(seg(p, .9, 1));
    stage.style.transform = 'scale(' + (1 + z * .55).toFixed(3) + ')';
    stage.style.opacity = (1 - z).toFixed(3);
  }
  function target() {
    var r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight;
    tgt = clamp(-r.top / span);
  }
  function loop(t) {
    if (!running) return;
    var dt = Math.min((t - (loop.t || t)) / 1000, .1); loop.t = t;
    target(); cur += (tgt - cur) * (1 - Math.exp(-dt * 9)); if (Math.abs(tgt - cur) < .0004) cur = tgt;
    ui(); if (!mode3d) draw(t); requestAnimationFrame(loop);
  }
  build(); layout();
  if (reduce) { sec.classList.add('is-static'); cur = .72; layout(); ui(); draw(0); stage.style.transform = ''; stage.style.opacity = 1; }
  else {
    new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting; if (on && !running) { running = true; requestAnimationFrame(loop); } running = on;
    }, { rootMargin: '10% 0px' }).observe(sec);
  }
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); if (reduce) draw(0); }, 120); });

  /* Datos en vivo desde landing.js */
  window.CumbreStory = { progress: function () { return cur; }, update: function (cards) {
    var by = {}; cards.forEach(function (c) { by[c.id] = c; });
    dots.forEach(function (d) { var c = by[d.d.id]; if (c) { d.d.v = c.votes; d.d.c = c.leader ? c.leader.color : null; } });
    rank(); layout();
  } };
})();
