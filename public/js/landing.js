(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Number(n).toLocaleString('es-MX'); };

  // Contadores animados
  function countUp(el, to) {
    if (reduce || to < 2) { el.textContent = fmt(to); return; }
    var from = 0, t0 = performance.now(), dur = 1400;
    (function tick(t) {
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  $$('[data-count]').forEach(function (el) { countUp(el, +el.dataset.count); });

  // Reveal al hacer scroll
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    $$('.reveal').forEach(function (el, i) { el.style.transitionDelay = Math.min(i % 8, 7) * 40 + 'ms'; io.observe(el); });
  } else { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }

  // Foco de luz que sigue al mouse en tarjetas
  $$('.l-card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Filtros: tipo, región, indígena y búsqueda
  var state = { type: 'all', region: 'all', ind: false, q: '' };
  var cards = $$('.l-card'), empty = $('[data-empty]');
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  cards.forEach(function (c) { c._q = norm(c.dataset.q); });
  function apply() {
    var shown = 0, q = norm(state.q.trim());
    cards.forEach(function (c) {
      var ok = (state.type === 'all' || c.dataset.type === state.type) &&
               (state.region === 'all' || c.dataset.region === state.region) &&
               (!state.ind || c.dataset.ind === '1') &&
               (!q || c._q.indexOf(q) !== -1);
      c.hidden = !ok; if (ok) { shown++; c.classList.add('in'); }
    });
    if (empty) empty.hidden = shown !== 0;
  }
  $$('[data-tabs] button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-tabs] button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      state.type = b.dataset.type; apply();
    });
  });
  $$('[data-regions] button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.flag === 'indigenous') { state.ind = !state.ind; b.classList.toggle('is-on', state.ind); }
      else {
        $$('[data-region]', $('[data-regions]')).forEach(function (x) { x.classList.toggle('is-on', x === b); });
        state.region = b.dataset.region;
      }
      apply();
    });
  });
  var search = $('[data-search]');
  if (search) search.addEventListener('input', function () { state.q = search.value; apply(); });

  // Datos en vivo (cada 20 s, solo si la pestaña está visible)
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function refresh() {
    if (document.hidden) return;
    fetch('/api/estado/resumen').then(function (r) { return r.json(); }).then(function (data) {
      if (!data || !data.totals) return;
      $$('[data-key]').forEach(function (el) { if (data.totals[el.dataset.key] != null) el.textContent = fmt(data.totals[el.dataset.key]); });
      data.cards.forEach(function (d) {
        var card = $('.l-card[data-id="' + d.id + '"]'); if (!card) return;
        var lead = $('[data-lead]', card);
        if (d.leader) {
          card.style.setProperty('--c', d.leader.color);
          lead.innerHTML = '<span class="l-lead-name">' + esc(d.leader.name) + '</span>' +
            '<span class="l-bar"><i style="width:' + d.leader.pct + '%"></i></span>' +
            '<em>' + d.leader.pct + '% · ' + fmt(d.votes) + ' votos</em>';
        }
      });
    }).catch(function () {});
  }
  setInterval(refresh, 20000);
})();
