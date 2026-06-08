let barChart = null;
let lineChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadReport();
    loadCurrentSize();

    document.getElementById('runBenchmark').addEventListener('click', runLiveBenchmark);
    document.getElementById('clearBenchmark').addEventListener('click', clearBenchmark);

    document.querySelectorAll('.generate-actions button').forEach(btn => {
        btn.addEventListener('click', () => generateSample(Number(btn.dataset.size)));
    });
});

function initCharts() {
    if (typeof Chart === 'undefined') return;

    barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Normal Search (ms)', data: [], backgroundColor: 'rgba(59,130,246,0.75)', borderRadius: 8 },
                { label: 'Smart Search (ms)', data: [], backgroundColor: 'rgba(34,197,94,0.75)', borderRadius: 8 },
            ],
        },
        options: chartOptions('Search Speed (ms)'),
    });

    lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Normal Search (ms)', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', fill: true, tension: 0.3 },
                { label: 'Smart Search (ms)', data: [], borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)', fill: true, tension: 0.3 },
            ],
        },
        options: chartOptions('Search Speed (ms)'),
    });
}

function chartOptions(yLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9aa0b4' } } },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: yLabel, color: '#9aa0b4' }, ticks: { color: '#9aa0b4' } },
            x: { ticks: { color: '#9aa0b4' }, grid: { display: false } },
        },
    };
}

function clearBenchmark() {
    document.getElementById('perfQuery').value = '';
    ['benchmarkComparison', 'benchmarkTiming', 'benchmarkStats', 'barChartSection'].forEach(id => {
        document.getElementById(id).classList.add('hidden-section');
    });
    document.getElementById('benchmarkComparison').innerHTML = '';
    document.getElementById('benchmarkTiming').innerHTML = '';
}

async function loadCurrentSize() {
    const stats = await apiFetch('/api/stats');
    document.getElementById('currentDataSize').textContent = `Current contacts: ${stats.total_contacts}`;
}

async function generateSample(size) {
    const data = await apiFetch(`/api/generate/${size}`, { method: 'POST' });
    showToast(data.message);
    await loadCurrentSize();
    await loadReport();
}

async function loadReport() {
    const report = await apiFetch('/api/performance/report');
    const tbody = document.getElementById('reportBody');

    tbody.innerHTML = report.map(row => `
        <tr>
            <td><strong>${row.data_size}</strong></td>
            <td>${row.normal_search_time_ms}</td>
            <td>${row.smart_search_time_ms}</td>
            <td>${row.contacts_checked}</td>
            <td>${row.lookups_performed}</td>
            <td>${escapeHtml(row.faster)}</td>
        </tr>
    `).join('');

    if (barChart && lineChart) {
        const labels = report.map(r => r.data_size.toString());
        barChart.data.labels = labels;
        barChart.data.datasets[0].data = report.map(r => r.normal_search_time_ms);
        barChart.data.datasets[1].data = report.map(r => r.smart_search_time_ms);
        barChart.update();

        lineChart.data.labels = labels;
        lineChart.data.datasets[0].data = report.map(r => r.normal_search_time_ms);
        lineChart.data.datasets[1].data = report.map(r => r.smart_search_time_ms);
        lineChart.update();
    }
}

async function runLiveBenchmark() {
    const query = document.getElementById('perfQuery').value.trim();
    if (!query) {
        showToast('Enter a name or phone number', 'error');
        return;
    }

    const data = await apiFetch(`/api/performance/search?q=${encodeURIComponent(query)}`);

    document.getElementById('benchmarkComparison').innerHTML = `
        <div class="compare-card">
            <h4>Normal Search</h4>
            <div class="compare-stat">
                <span class="compare-stat-label">Contacts Checked</span>
                <span class="compare-stat-value">${data.contacts_checked}</span>
            </div>
        </div>
        <div class="compare-card winner">
            <h4>Smart Search</h4>
            <div class="compare-stat">
                <span class="compare-stat-label">Lookups Performed</span>
                <span class="compare-stat-value">${data.lookups_performed}</span>
            </div>
        </div>
    `;

    document.getElementById('benchmarkTiming').innerHTML = `
        <div class="timing-row">
            <div class="timing-item"><span>Normal Search</span><strong>${data.normal_search_time_ms} ms</strong></div>
            <div class="timing-item highlight"><span>Smart Search</span><strong>${data.smart_search_time_ms} ms</strong></div>
            <div class="timing-item winner-badge"><span>Best Search Method</span><strong>${escapeHtml(data.faster)}</strong></div>
        </div>
    `;

    document.getElementById('listTime').textContent = `${data.normal_search_time_ms} ms`;
    document.getElementById('dictTime').textContent = `${data.smart_search_time_ms} ms`;
    document.getElementById('listComparisons').textContent = data.contacts_checked;
    document.getElementById('dictComparisons').textContent = data.lookups_performed;
    document.getElementById('fasterMethod').textContent = data.faster;

    ['benchmarkComparison', 'benchmarkTiming', 'benchmarkStats', 'barChartSection'].forEach(id => {
        document.getElementById(id).classList.remove('hidden-section');
    });

    if (barChart) {
        barChart.data.labels = ['This Search'];
        barChart.data.datasets[0].data = [data.normal_search_time_ms];
        barChart.data.datasets[1].data = [data.smart_search_time_ms];
        barChart.update();
    }

    showToast('Search comparison complete!');
}
