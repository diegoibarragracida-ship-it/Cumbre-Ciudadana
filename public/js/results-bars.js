/* Barras de resultados reales por candidato: sube cada una a su % real,
   brilla al llegar a su tope y se re-anima suave cuando llegan votos nuevos. */
(function () {
  var gridEl = document.getElementById('results-grid'), barsEl = document.getElementById('results-bars');
  if (!gridEl || !barsEl || !window.DISTRICT_ID) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FALLBACK = ['#3EE6D0', '#7C9CFF', '#FF9A44', '#FF5D6C', '#B58CFF', '#6FE07A'];
  var current = null, built = false, MAXV = 10;

  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  // Colores mas serios: baja saturacion y ajusta la luz a un rango sobrio (no neon, no apagado del todo).
  function muted(hex) {
    hex = (hex || '#3EE6D0').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(hex.substr(0, 2), 16) / 255, g = parseInt(hex.substr(2, 2), 16) / 255, b = parseInt(hex.substr(4, 2), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h /= 6;
    }
    s = Math.min(s, .5); l = Math.max(.32, Math.min(l, .48));
    function h2 (p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < .5) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    var rr = h2(p, q, h + 1 / 3), gg = h2(p, q, h), bb = h2(p, q, h - 1 / 3);
    function hx (x) { var v = Math.round(x * 255).toString(16); return v.length === 1 ? '0' + v : v; }
    return '#' + hx(rr) + hx(gg) + hx(bb);
  }
  function initials(name) {
    return (name || '?').replace(/[^\p{L}0-9 ]/gu, '').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0]; }).join('').toUpperCase() || '?';
  }
  function color(c, i) { return muted((c.partyColors && c.partyColors[0]) || FALLBACK[i % FALLBACK.length]); }
  function grad(c, i) {
    var cols = ((c.partyColors && c.partyColors.length) ? c.partyColors : [color(c, i)]).map(muted);
    if (cols.length === 1) return cols[0];
    var step = 100 / cols.length;
    return 'linear-gradient(180deg, ' + cols.map(function (x, k) { return x + ' ' + (k * step).toFixed(0) + '%'; }).join(', ') + ')';
  }
  function grid() {
    var step = MAXV <= 20 ? 5 : (MAXV <= 60 ? 10 : 20), out = '';
    for (var y = 0; y <= MAXV + .001; y += step) out += '<i style="--y:' + (y / MAXV * 100).toFixed(2) + '"><b>' + Math.round(y) + '%</b></i>';
    gridEl.innerHTML = out;
  }
  function build(sorted, total) {
    barsEl.style.setProperty('--cols', sorted.length || 1);
    barsEl.innerHTML = sorted.map(function (c, i) {
      var pct = total ? (c.votes / total * 100) : 0;
      var photo = c.photoUrl || '/img/default-avatar.svg';
      return '<div class="c-col" data-id="' + c.id + '" data-pct="' + pct.toFixed(2) + '" data-v="' + c.votes + '" style="--c:' + color(c, i) + '">' +
        '<div class="c-well"><div class="c-bar" style="height:0%;background:' + grad(c, i) + '">' +
          '<span class="c-val">0%</span><i class="c-cap"></i><i class="c-ring"></i><i class="c-ring r2"></i></div></div>' +
        '<div class="c-logo"><span class="c-chip c-chip-photo"><img src="' + esc(photo) + '" alt="' + esc(c.name) + '" onerror="this.src=\'/img/default-avatar.svg\'"></span>' +
          '<small>' + esc(c.name.split(' ')[0]) + '<br>' + esc(c.party) + '</small></div></div>';
    }).join('') || '<p class="empty">Aún no hay candidatos con votos en este distrito.</p>';
  }
  function animateTo(el, pct, delay) {
    var bar = el.querySelector('.c-bar'), val = el.querySelector('.c-val');
    setTimeout(function () {
      el.classList.add('on');
      bar.style.transition = 'height 1.1s cubic-bezier(.2,.8,.25,1)';
      bar.style.height = (pct / MAXV * 100).toFixed(2) + '%';
      var t0 = performance.now(), from = parseFloat(val.dataset.shown || '0');
      (function step(t) {
        var k = Math.min(1, (t - t0) / 1100), v = from + (pct - from) * (1 - Math.pow(1 - k, 3));
        val.textContent = Math.round(v) + '%'; val.dataset.shown = v;
        if (k < 1) requestAnimationFrame(step);
        else { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
      })(t0);
    }, reduce ? 0 : delay);
  }
  function apply(sorted, total) {
    MAXV = Math.max(10, Math.ceil(Math.max.apply(null, sorted.map(function (c) { return total ? c.votes / total * 100 : 0; }).concat(1)) * 1.25 / 5) * 5);
    grid();
    if (!built) { build(sorted, total); built = true; }
    else {
      var order = sorted.map(function (c) { return c.id; }).join(',');
      var have = [].slice.call(barsEl.querySelectorAll('.c-col')).map(function (e) { return e.dataset.id; }).join(',');
      if (order !== have) build(sorted, total);
    }
    [].slice.call(barsEl.querySelectorAll('.c-col')).forEach(function (el, i) {
      var c = sorted[i]; if (!c) return;
      var pct = total ? (c.votes / total * 100) : 0;
      animateTo(el, pct, i * 140 + 120);
    });
  }
  async function tick() {
    try {
      var res = await fetch('/api/distrito/' + window.DISTRICT_ID + '/resultados');
      var data = await res.json();
      var total = data.reduce(function (s, c) { return s + c.votes; }, 0);
      var sorted = data.slice().sort(function (a, b) { return b.votes - a.votes; });
      current = JSON.stringify(sorted.map(function (c) { return c.id + ':' + c.votes; }));
      apply(sorted, total);
    } catch (e) { barsEl.innerHTML = '<p class="empty">No se pudieron cargar los resultados.</p>'; }
  }
  tick(); setInterval(tick, 5000);
})();
