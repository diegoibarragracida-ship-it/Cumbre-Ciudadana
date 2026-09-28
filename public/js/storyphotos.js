/* Entrada con fotos: zoom continuo + desenfoque + fundido entre escenas, movido por el scroll */
(function () {
  var sec = document.querySelector('[data-story][data-mode="photo"]'); if (!sec) return;
  var imgs = [].slice.call(sec.querySelectorAll('.s-photo')), n = imgs.length, on = false;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  // Fotos verticales: encuadrar hacia arriba (la cumbre) al recortarlas en pantalla horizontal
  imgs.forEach(function (im) {
    var fix = function () { if (im.naturalHeight > im.naturalWidth) im.style.objectPosition = '50% 24%'; };
    if (im.complete) fix(); else im.addEventListener('load', fix);
  });
  function apply(p) {
    var w = .92 / n;
    imgs.forEach(function (im, i) {
      var a = i * w, inT = i ? ease(seg(p, a - .07, a + .03)) : 1;
      var outT = i < n - 1 ? ease(seg(p, a + w - .03, a + w + .07)) : 0;
      var life = clamp((p - (a - .07)) / (w + .14));
      var blur = ((1 - inT) + outT) * 12;
      im.style.opacity = (inT * (1 - outT)).toFixed(3);
      im.style.transform = 'translate3d(0,' + ((.5 - life) * 3).toFixed(2) + '%,0) scale(' + (1.04 + life * .3).toFixed(3) + ')';
      im.style.filter = blur > .4 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
      im.style.zIndex = i;
    });
  }
  function loop() { if (!on) return; apply(window.CumbreStory ? window.CumbreStory.progress() : 0); requestAnimationFrame(loop); }
  apply(reduce ? .72 : 0);
  if (reduce) return;
  new IntersectionObserver(function (es) {
    var v = es[0].isIntersecting; if (v && !on) { on = true; requestAnimationFrame(loop); } on = v;
  }, { rootMargin: '10% 0px' }).observe(sec);
})();
