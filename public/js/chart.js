/* Gráfica de participación: la línea se dibuja con el scroll, sube y baja por distrito y brilla en su punto máximo */
(function () {
  var sec = document.querySelector('[data-chart]'); if (!sec) return;
  var cv = sec.querySelector('canvas'), ctx = cv.getContext('2d'), stage = sec.querySelector('.c-stage');
  var numEl = sec.querySelector('[data-c-num]'), labEl = sec.querySelector('[data-c-label]');
  var peakEl = sec.querySelector('[data-c-peak]'), pName = sec.querySelector('[data-c-pname]'), pVal = sec.querySelector('[data-c-pval]');
  var hint = sec.querySelector('.c-hint');
  var data = JSON.parse(document.getElementById('chart-data').textContent);
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var fmt = function (n) { return Number(n).toLocaleString('es-MX'); };
  var W, H, dpr, L, R, T, B, vals = [], sy = [], M = 2, maxV = 1, peakIdx = 0, peakT = .5, demo = false;
  var cur = 0, tgt = 0, running = false, crossAt = null, lastIdx = -1, S = 14;

  function cr(p0, p1, p2, p3, t) {
    return .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  }
  function prep() {
    var N = data.length || 1;
    demo = !data.some(function (d) { return d.v > 0; });
    vals = data.map(function (d, i) {
      if (!demo) return d.v;
      var x = i / Math.max(1, N - 1);   // forma de ejemplo mientras no hay votos
      return 18 + 70 * Math.exp(-Math.pow((x - .62) / .13, 2)) + 22 * Math.exp(-Math.pow((x - .22) / .1, 2)) + 8 * Math.sin(x * 14);
    });
    if (!vals.length) vals = [0];
    maxV = Math.max.apply(null, vals.concat(1));
    peakIdx = vals.indexOf(Math.max.apply(null, vals));
    peakT = N > 1 ? peakIdx / (N - 1) : .5;
    sy = [];
    if (vals.length === 1) sy = [vals[0], vals[0]];
    else {
      for (var i = 0; i < vals.length - 1; i++) for (var s = 0; s < S; s++)
        sy.push(Math.max(0, Math.min(maxV, cr(vals[Math.max(0, i - 1)], vals[i], vals[i + 1], vals[Math.min(vals.length - 1, i + 2)], s / S))));
      sy.push(vals[vals.length - 1]);
    }
    M = sy.length;
    var d = data[peakIdx] || { n: '', v: 0 };
    pName.textContent = demo ? 'Aquí llegará el punto máximo' : d.n;
    pVal.textContent = demo ? '' : fmt(d.v) + ' votos';
    lastIdx = -1;
  }
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = stage.clientWidth; H = stage.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    L = W * .06; R = W * .94; T = H * .56; B = H * .9;
  }
  var X = function (f) { return L + f * (R - L); };
  var Y = function (v) { return B - (v / maxV) * (B - T); };

  function draw(t, time) {
    ctx.clearRect(0, 0, W, H);
    for (var g = 0; g <= 4; g++) {
      var gy = B - (B - T) * g / 4;
      ctx.strokeStyle = 'rgba(160,200,230,' + (g ? .07 : .22) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, gy); ctx.lineTo(R, gy); ctx.stroke();
    }
    if (t < peakT - .02) crossAt = null;
    var k = t * (M - 1), i = Math.min(M - 2, Math.floor(k)), hx = X(t), hv = lerp(sy[i], sy[i + 1], k - i), hy = Y(hv);
    var gl = ease(seg(t, peakT - .07, peakT)) * (t > peakT ? lerp(1, .6, seg(t, peakT, peakT + .2)) : 1);
    var pulse = .5 + .5 * Math.sin(time / 320), px = X(peakT), py = T;
    if (t > .002) {
      var trace = function () {
        ctx.beginPath(); ctx.moveTo(X(0), Y(sy[0]));
        for (var j = 1; j <= i; j++) ctx.lineTo(X(j / (M - 1)), Y(sy[j]));
        ctx.lineTo(hx, hy);
      };
      trace(); ctx.lineTo(hx, B); ctx.lineTo(X(0), B); ctx.closePath();
      var ag = ctx.createLinearGradient(0, T, 0, B);
      ag.addColorStop(0, 'rgba(62,230,208,' + (.32 + .16 * gl) + ')'); ag.addColorStop(1, 'rgba(62,230,208,0)');
      ctx.fillStyle = ag; ctx.fill();
      var sg = ctx.createLinearGradient(L, 0, R, 0);
      sg.addColorStop(0, '#3EE6D0'); sg.addColorStop(.6, '#7C9CFF'); sg.addColorStop(1, '#FF9A44');
      trace(); ctx.strokeStyle = sg; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(62,230,208,.9)'; ctx.shadowBlur = 10 + 24 * gl; ctx.stroke(); ctx.shadowBlur = 0;
    }
    if (gl > .01) {
      var a = gl * (.75 + .25 * pulse);
      var bm = ctx.createLinearGradient(0, py, 0, 0);
      bm.addColorStop(0, 'rgba(255,220,170,' + (.6 * a) + ')'); bm.addColorStop(1, 'rgba(255,154,68,0)');
      ctx.fillStyle = bm; ctx.fillRect(px - 1.5, 0, 3, py);
      ctx.globalAlpha = .18; ctx.fillRect(px - 12, 0, 24, py); ctx.globalAlpha = 1;
      var rad = 46 + 60 * a, rg = ctx.createRadialGradient(px, py, 0, px, py, rad);
      rg.addColorStop(0, 'rgba(255,244,214,' + (.95 * a) + ')'); rg.addColorStop(.35, 'rgba(255,170,90,' + (.5 * a) + ')'); rg.addColorStop(1, 'rgba(255,154,68,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.283); ctx.fill();
    }
    if (t >= peakT) {
      if (crossAt === null) crossAt = time;
      for (var r = 0; r < 3; r++) {
        var age = (time - crossAt - r * 260) / 1500;
        if (age > 0 && age < 1) {
          ctx.strokeStyle = 'rgba(255,190,120,' + ((1 - age) * .85) + ')'; ctx.lineWidth = 2 * (1 - age) + .5;
          ctx.beginPath(); ctx.arc(px, py, 10 + age * 130, 0, 6.283); ctx.stroke();
        }
      }
      var sa = (time - crossAt) / 1300;
      if (sa > 0 && sa < 1) for (var q = 0; q < 16; q++) {
        var ang = q / 16 * 6.283 + q * .7, dist = 20 + sa * (60 + (q % 4) * 22);
        ctx.fillStyle = 'rgba(255,225,170,' + ((1 - sa) * .9) + ')';
        ctx.beginPath(); ctx.arc(px + Math.cos(ang) * dist, py + Math.sin(ang) * dist, 2.2 * (1 - sa) + .4, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#FF9A44'; ctx.shadowBlur = 8 + 24 * gl;
      ctx.beginPath(); ctx.arc(px, py, 5 + 4 * gl, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
    }
    if (t > .002 && t < .999) {
      var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 30);
      hg.addColorStop(0, 'rgba(62,230,208,.7)'); hg.addColorStop(1, 'rgba(62,230,208,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, 30, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, 6.283); ctx.fill();
    }
    peakEl.style.left = Math.max(110, Math.min(W - 110, px)) + 'px'; peakEl.style.top = (py - 26) + 'px';
    peakEl.style.opacity = ease(seg(t, peakT - .03, peakT + .01)).toFixed(3);
    var idx = Math.round(t * (data.length - 1));
    if (idx !== lastIdx && data.length) {
      lastIdx = idx; var d = data[idx];
      labEl.textContent = demo ? 'Participación por distrito' : (d.t === 'federal' ? 'Federal ' : 'Local ') + String(d.k).padStart(2, '0') + ' · ' + d.n;
      numEl.textContent = demo ? '—' : fmt(d.v);
    }
    if (hint) hint.style.opacity = (1 - seg(cur, 0, .05)).toFixed(3);
  }
  function loop(now) {
    if (!running) return;
    var dt = Math.min((now - (loop.t || now)) / 1000, .1); loop.t = now;
    var r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight;
    tgt = clamp(-r.top / span);
    cur += (tgt - cur) * (1 - Math.exp(-dt * 9)); if (Math.abs(tgt - cur) < .0004) cur = tgt;
    draw(seg(cur, .05, .88), now); requestAnimationFrame(loop);
  }
  prep(); layout();
  if (reduce) { sec.classList.add('is-static'); layout(); crossAt = -1e6; cur = 1; draw(1, 0); }
  else new IntersectionObserver(function (es) {
    var on = es[0].isIntersecting; if (on && !running) { running = true; requestAnimationFrame(loop); } running = on;
  }, { rootMargin: '10% 0px' }).observe(sec);
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); if (reduce) draw(1, 0); }, 120); });

  window.CumbreChart = { update: function (cards) {
    var by = {}; cards.forEach(function (c) { by[c.id] = c; });
    data.forEach(function (d) { var c = by[d.id]; if (c) d.v = c.votes || 0; });
    prep();
  } };
})();
