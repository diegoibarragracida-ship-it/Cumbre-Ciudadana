(function () {
  const container = document.getElementById('results-chart');
  if (!container || !window.DISTRICT_ID) return;

  const PARTY_COLORS = ['#C98A2C', '#1F4B3F', '#8A2E2A', '#2B5F73', '#6B4A8A', '#4A5B2E'];

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
            <div class="bar-fill" style="width:${pct}%; background:${color};"></div>
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
