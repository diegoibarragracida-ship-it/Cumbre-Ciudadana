/* Gráfica de barras automática (datos de ejemplo): cada barra sube, brilla al llegar a su tope y arranca la siguiente */
(function () {
  var sec = document.querySelector('[data-chart]'); if (!sec) return;
  var wrap = sec.querySelector('.c-wrap'), cols = [].slice.call(sec.querySelectorAll('.c-col'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var MAXV, STEP = 1500, RISE = 1300, HOLD = 4200, FADE = 700, running = false, t0 = null;
  var items = cols.map(function (c) {
    return { el: c, bar: c.querySelector('.c-bar'), val: c.querySelector('.c-val'), v: +c.dataset.v, hit: false };
  });
  MAXV = Math.max(10, Math.ceil(Math.max.apply(null, items.map(function (it) { return it.v; }).concat(1)) * 1.2 / 5) * 5);
  var total = STEP * (items.length - 1) + RISE;

  function reset() {
    items.forEach(function (it) {
      it.hit = false; it.el.classList.remove('on', 'hit'); it.bar.style.height = '0%'; it.val.textContent = '0%';
    });
  }
  function setFinal() {
    items.forEach(function (it) {
      it.el.classList.add('on'); it.bar.style.height = (it.v / MAXV * 100) + '%'; it.val.textContent = it.v + '%';
    });
  }
  function frame(now) {
    if (!running) return;
    if (t0 === null) t0 = now;
    var e = now - t0, alpha = 1;
    if (e > total + HOLD + FADE) { t0 = now; e = 0; reset(); }
    if (e > total + HOLD) alpha = 1 - (e - total - HOLD) / FADE;
    wrap.style.opacity = alpha.toFixed(3);
    items.forEach(function (it, i) {
      if (e < i * STEP) return;
      var p = clamp((e - i * STEP) / RISE), k = 1 - Math.pow(1 - p, 3);
      it.el.classList.add('on');
      it.bar.style.height = (it.v / MAXV * 100 * k).toFixed(2) + '%';
      it.val.textContent = Math.round(it.v * k) + '%';
      if (p >= 1 && !it.hit) { it.hit = true; it.el.classList.add('hit'); }
    });
    requestAnimationFrame(frame);
  }
  if (reduce) { setFinal(); return; }
  new IntersectionObserver(function (es) {
    var on = es[0].isIntersecting;
    if (on && !running) { running = true; t0 = null; reset(); requestAnimationFrame(frame); }
    running = on;
  }, { threshold: .3 }).observe(sec);
})();
