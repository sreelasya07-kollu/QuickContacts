let barChart = null;
let lineChart = null;
let debounceTimer;
let totalContacts = 0;

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadReport();
    loadCurrentSize();

    document.getElementById('runBenchmark').addEventListener('click', runLiveBenchmark);
    document.getElementById('clearBenchmark').addEventListener('click', clearBenchmark);
    document.getElementById('clearPerfInput').addEventListener('click', clearInput);

    const perfQuery = document.getElementById('perfQuery');
    perfQuery.addEventListener('input', () => {
        toggleClearButton();
        clearTimeout(debounceTimer);
        const query = perfQuery.value.trim();
        if (!query) {
            document.getElementById('perfSuggestions').classList.remove('active');
            document.getElementById('perfSuggestions').innerHTML = '';
            return;
        }
        debounceTimer = setTimeout(() => fetchSuggestions(query), 200);
    });

    perfQuery.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runLiveBenchmark();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            document.getElementById('perfSuggestions').classList.remove('active');
        }
    });

    document.querySelectorAll('.generate-actions button').forEach(btn => {
        btn.addEventListener('click', () => generateSample(Number(btn.dataset.size)));
    });

    toggleClearButton();
});

function toggleClearButton() {
    const input = document.getElementById('perfQuery');
    const btn = document.getElementById('clearPerfInput');
    if (input && btn) btn.classList.toggle('visible', input.value.length > 0);
}

function setBenchmarkEnabled(enabled) {
    const btn = document.getElementById('runBenchmark');
    const msg = document.getElementById('noContactsMsg');
    btn.disabled = !enabled;
    msg.classList.toggle('hidden-section', enabled);
}

function clearInput() {
    document.getElementById('perfQuery').value = '';
    document.getElementById('perfSuggestions').classList.remove('active');
    document.getElementById('perfSuggestions').innerHTML = '';
    toggleClearButton();
    document.getElementById('perfQuery').focus();
}

function clearBenchmark() {
    clearInput();

    document.getElementById('resultsSection').classList.add('hidden-section');
    document.getElementById('searchMethodGrid').innerHTML = '';
    document.getElementById('contactsCheckedBanner').innerHTML = '';
    document.getElementById('winnerCard').innerHTML = '';

    document.getElementById('barChartPlaceholder').classList.remove('hidden-section');
    document.getElementById('barChart').classList.add('hidden-section');

    if (barChart) {
        barChart.data.labels = [];
        barChart.data.datasets[0].data = [];
        barChart.data.datasets[1].data = [];
        barChart.update();
    }

}

async function fetchSuggestions(query) {
    try {
        const suggestions = await apiFetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        const list = document.getElementById('perfSuggestions');

        if (!suggestions.length) {
            list.classList.remove('active');
            return;
        }

        list.innerHTML = suggestions.map(s => `
            <li data-name="${escapeHtml(s.name)}">
                ${getContactAvatar(s.name, 'small')}
                <span class="suggestion-text">
                    <span class="suggestion-name">${escapeHtml(s.name)}</span>
                    <span class="suggestion-phone">${escapeHtml(s.phone)}</span>
                </span>
            </li>
        `).join('');

        list.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                document.getElementById('perfQuery').value = li.dataset.name;
                toggleClearButton();
                list.classList.remove('active');
            });
        });

        list.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function initCharts() {
    if (typeof Chart === 'undefined') return;

    barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Normal Search', 'Smart Search'],
            datasets: [{
                label: 'Execution Time (ms)',
                data: [0, 0],
                backgroundColor: ['rgba(59,130,246,0.75)', 'rgba(34,197,94,0.75)'],
                borderRadius: 10,
            }],
        },
        options: chartOptions('Execution Time (ms)'),
    });

    lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Normal Search', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.3 },
                { label: 'Smart Search', data: [], borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)', fill: true, tension: 0.3 },
            ],
        },
        options: chartOptions('Execution Time (ms)'),
    });
}

function chartOptions(yLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: { legend: { labels: { color: '#9aa0b4' } } },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: yLabel, color: '#9aa0b4' }, ticks: { color: '#9aa0b4' } },
            x: { ticks: { color: '#9aa0b4' }, grid: { display: false } },
        },
    };
}

async function loadCurrentSize() {
    try {
        const stats = await apiFetch('/api/stats');
        totalContacts = stats.total_contacts;
        document.getElementById('currentDataSize').textContent = `Current contacts: ${totalContacts}`;
        setBenchmarkEnabled(totalContacts > 0);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function generateSample(size) {
    try {
        const data = await apiFetch(`/api/generate/${size}`, { method: 'POST' });
        showToast(data.message);
        await loadCurrentSize();
        await loadReport();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadReport() {
    try {
        const report = await apiFetch('/api/performance/report');
        document.getElementById('reportBody').innerHTML = report.map(row => {
            const { normalMs, smartMs } = getPerformanceTimes(row);
            return `
                <tr>
                    <td><strong>${row.data_size}</strong></td>
                    <td>${formatSearchTime(normalMs)}</td>
                    <td>${formatSearchTime(smartMs)}</td>
                    <td>${row.contacts_checked}</td>
                    <td>${row.lookups_performed}</td>
                    <td>${escapeHtml(row.best_search_method || row.faster_method || row.faster)}</td>
                </tr>
            `;
        }).join('');

        if (lineChart) {
            lineChart.data.labels = report.map(r => r.data_size.toString());
            lineChart.data.datasets[0].data = report.map(r => Number(getPerformanceTimes(r).normalMs) || 0);
            lineChart.data.datasets[1].data = report.map(r => Number(getPerformanceTimes(r).smartMs) || 0);
            lineChart.update();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderComparison(data) {
    const { normalMs, smartMs } = getPerformanceTimes(data);
    const normalTime = formatSearchTime(normalMs);
    const smartTime = formatSearchTime(smartMs);
    const chartNormal = Number(normalMs) || 0;
    const chartSmart = Number(smartMs) || 0;
    const bestMethod = data.best_search_method || data.faster_method || data.faster || '—';
    const isSmart = bestMethod === 'Smart Search';

    document.getElementById('resultsSection').classList.remove('hidden-section');
    document.getElementById('totalContactsValue').textContent = data.total_contacts ?? totalContacts;

    document.getElementById('searchMethodGrid').innerHTML = `
        <div class="method-card">
            <h4>Normal Search</h4>
            <ul class="method-stats">
                <li><span>Execution Time</span><strong class="time-value">${normalTime}</strong></li>
                <li><span>Contacts Checked</span><strong>${data.contacts_checked ?? 0}</strong></li>
                <li><span>Complexity</span><strong>${data.list_complexity || 'O(n)'}</strong></li>
            </ul>
        </div>
        <div class="method-card winner">
            <h4>Smart Search</h4>
            <ul class="method-stats">
                <li><span>Execution Time</span><strong class="time-value">${smartTime}</strong></li>
                <li><span>Lookups Performed</span><strong>${data.lookups_performed ?? 1}</strong></li>
                <li><span>Complexity</span><strong>${data.dict_complexity || 'O(1)'}</strong></li>
            </ul>
        </div>
    `;

    document.getElementById('contactsCheckedBanner').innerHTML = `
        <p class="checked-line"><strong>Normal Search:</strong> ${data.contacts_checked ?? 0} contacts checked</p>
        <p class="checked-line highlight-line"><strong>Smart Search:</strong> ${data.lookups_performed ?? 1} lookup</p>
    `;

    document.getElementById('winnerCard').innerHTML = `
        <div class="winner-inner">
            <span class="winner-icon">🏆</span>
            <div>
                <p class="winner-label">Best Search Method</p>
                <h4 class="winner-name">${escapeHtml(bestMethod)}</h4>
                <p class="winner-desc">${isSmart
                    ? 'Smart Search is recommended for large contact lists because it finds contacts directly without checking every contact.'
                    : escapeHtml(data.winner_message || 'Normal Search completed the lookup for this search.')}</p>
            </div>
        </div>
    `;

    document.getElementById('barChartPlaceholder').classList.add('hidden-section');
    document.getElementById('barChart').classList.remove('hidden-section');

    if (barChart) {
        barChart.data.labels = ['Normal Search', 'Smart Search'];
        barChart.data.datasets[0].data = [chartNormal, chartSmart];
        barChart.update('active');
        requestAnimationFrame(() => barChart.resize());
    }
}

async function runLiveBenchmark() {
    const query = document.getElementById('perfQuery').value.trim();
    if (!query) {
        showToast('Enter a contact name to compare search speed', 'error');
        return;
    }

    if (!totalContacts) {
        showToast('No contacts available. Generate sample contacts first.', 'error');
        return;
    }

    try {
        const data = await apiFetch(`/api/performance/search?q=${encodeURIComponent(query)}`);
        renderComparison(data);
        toggleClearButton();
        showToast('Search comparison complete!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}
