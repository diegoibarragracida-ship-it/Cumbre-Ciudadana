(function () {
  const container = document.getElementById('results-chart');
  const historyList = document.getElementById('vote-history');
  const pieCanvas = document.getElementById('results-pie');
  if (!window.DISTRICT_ID) return;

  const PARTY_COLORS = ['#FF9A44', '#3EE6D0', '#7C9CFF', '#FF5D6C', '#B58CFF', '#6FE07A'];
  let pieChart = null;

  async function fetchResults() {
    if (!container) return;
    try {
      const res = await fetch(`/api/distrito/${window.DISTRICT_ID}/resultados`);
      const data = await res.json();
      render(data);
      renderPie(data);
    } catch (err) {
      container.innerHTML = '<p class="empty">No se pudieron cargar los resultados.</p>';
    }
  }

  async function fetchHistory() {
    if (!historyList) return;
    try {
      const res = await fetch(`/api/distrito/${window.DISTRICT_ID}/historial`);
      const data = await res.json();
      renderHistory(data);
    } catch (err) {
      historyList.innerHTML = '<li class="empty">No se pudo cargar el historial.</li>';
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

  function renderPie(data) {
    if (!pieCanvas || typeof Chart === 'undefined') return;
    const sorted = [...data].sort((a, b) => b.votes - a.votes);
    const hasVotes = sorted.some(c => c.votes > 0);

    const chartData = {
      labels: sorted.map(c => c.name),
      datasets: [{
        data: sorted.map(c => c.votes),
        backgroundColor: sorted.map((c, i) => PARTY_COLORS[i % PARTY_COLORS.length]),
        borderColor: '#0d1117',
        borderWidth: 2
      }]
    };

    if (pieChart) {
      pieChart.data = chartData;
      pieChart.update();
      return;
    }

    pieChart = new Chart(pieCanvas, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#c9d1d9', font: { family: "'Manrope', sans-serif" } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return `${ctx.label}: ${ctx.parsed} voto${ctx.parsed === 1 ? '' : 's'} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    if (!hasVotes) {
      pieCanvas.insertAdjacentHTML('afterend', '<p class="empty" data-pie-empty>Aún no hay votos para graficar.</p>');
    } else {
      const prevEmpty = pieCanvas.parentElement.querySelector('[data-pie-empty]');
      if (prevEmpty) prevEmpty.remove();
    }
  }

  function renderHistory(data) {
    if (data.length === 0) {
      historyList.innerHTML = '<li class="empty">Aún no hay votos registrados en este distrito.</li>';
      return;
    }

    historyList.innerHTML = data.map(v => `
      <li>
        <div class="comment-avatar">
          ${v.userPhoto ? `<img src="${escapeHtml(v.userPhoto)}" alt="">` : ''}
        </div>
        <div>
          <p class="comment-author">${escapeHtml(v.userName)} <span class="comment-date">votó por ${escapeHtml(v.candidateName)} · ${new Date(v.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
        </div>
      </li>`).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  fetchResults();
  fetchHistory();
  setInterval(fetchResults, 5000); // actualiza cada 5s para sensacion de "en vivo"
  setInterval(fetchHistory, 8000);
})();
