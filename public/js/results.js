(function () {
  const container = document.getElementById('results-chart');
  if (!container || !window.DISTRICT_ID) return;

  const PARTY_COLORS = ['#FF9A44', '#3EE6D0', '#7C9CFF', '#FF5D6C', '#B58CFF', '#6FE07A'];

  async function fetchResults() {
    try {
      const res = await fetch(`/api/distrito/${window.DISTRICT_ID}/resultados`);
      const data = await res.json();
      render(data);
    } catch (err) {
      container.innerHTML = '<p class="empty">No se pudieron cargar los resultados.</p>';
    }
  }

  function render(data) {
    const total = data.reduce((sum, c) => sum + c.votes, 0) || 1;
    const sorted = [...data].sort((a, b) => b.votes - a.votes);

    container.innerHTML = sorted.map((c, i) => {
      const pct = ((c.votes / total) * 100).toFixed(1);
      const color = PARTY_COLORS[i % PARTY_COLORS.length];
      return `
        <div class="bar-row">
          <div class="bar-label">
            <span class="bar-name">${escapeHtml(c.name)}</span>
            <span class="bar-party">${escapeHtml(c.party)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%; background:${color}; box-shadow:0 0 12px 0 ${color}66;"></div>
          </div>
          <div class="bar-stats">
            <span class="bar-pct">${pct}%</span>
            <span class="bar-count">${c.votes} voto${c.votes === 1 ? '' : 's'}</span>
          </div>
        </div>`;
    }).join('') || '<p class="empty">Aún no hay votos registrados en este distrito.</p>';

    container.insertAdjacentHTML('beforeend', `<p class="total-votes">Total de votos de opinión: ${total === 1 && sorted.length === 0 ? 0 : total}</p>`);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  fetchResults();
  setInterval(fetchResults, 5000); // actualiza cada 5s para sensacion de "en vivo"
})();
