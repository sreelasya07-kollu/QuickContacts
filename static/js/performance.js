let performanceChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    document.getElementById('runBenchmark').addEventListener('click', runBenchmark);
});

function initChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const isDark = getTheme() === 'dark';
    const tickColor = isDark ? '#9aa0b4' : '#64748b';
    const gridColor = isDark ? 'rgba(45, 51, 72, 0.5)' : 'rgba(148, 163, 184, 0.35)';

    performanceChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Normal Search', 'Smart Search'],
            datasets: [{
                label: 'Search Time (ms)',
                data: [0, 0],
                backgroundColor: ['rgba(59, 130, 246, 0.75)', 'rgba(34, 197, 94, 0.75)'],
                borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)'],
                borderWidth: 2,
                borderRadius: 10,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 700, easing: 'easeOutQuart' },
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Execution Time (ms)', color: tickColor },
                    ticks: { color: tickColor },
                    grid: { color: gridColor },
                },
                x: {
                    ticks: { color: tickColor },
                    grid: { display: false },
                },
            },
        },
    });
}

async function runBenchmark() {
    const query = document.getElementById('perfQuery').value.trim() || 'a';

    try {
        const data = await apiFetch(`/api/performance/search?q=${encodeURIComponent(query)}`);

        document.getElementById('listTime').textContent = `${data.list_time_ms} ms`;
        document.getElementById('dictTime').textContent = `${data.dict_time_ms} ms`;
        document.getElementById('fasterMethod').textContent = data.faster;
        document.getElementById('totalForPerf').textContent = data.total_contacts;

        document.getElementById('benchmarkComparison').innerHTML = `
            <div class="compare-card normal-search">
                <div class="compare-card-top">
                    <span class="compare-icon">📋</span>
                    <div>
                        <h3>Normal Search</h3>
                        <p>Python List · Linear Search</p>
                    </div>
                </div>
                <div class="compare-stat">
                    <span class="compare-stat-label">Contacts Checked</span>
                    <span class="compare-stat-value">${data.contacts_checked}</span>
                </div>
            </div>
            <div class="compare-card smart-search ${data.faster === 'Smart Search' ? 'winner' : ''}">
                <div class="compare-card-top">
                    <span class="compare-icon">⚡</span>
                    <div>
                        <h3>Smart Search</h3>
                        <p>Python Dictionary · Hash Lookup</p>
                    </div>
                </div>
                <div class="compare-stat">
                    <span class="compare-stat-label">Lookups Performed</span>
                    <span class="compare-stat-value">${data.lookups_performed}</span>
                </div>
            </div>
        `;

        document.getElementById('benchmarkTiming').innerHTML = `
            <div class="timing-row">
                <div class="timing-item">
                    <span>Normal Search Time</span>
                    <strong>${data.list_time_ms} ms</strong>
                </div>
                <div class="timing-item highlight">
                    <span>Smart Search Time</span>
                    <strong>${data.dict_time_ms} ms</strong>
                </div>
                <div class="timing-item winner-badge">
                    <span>Faster Method</span>
                    <strong>${escapeHtml(data.faster)}</strong>
                </div>
            </div>
        `;

        ['benchmarkComparison', 'benchmarkTiming', 'benchmarkChartSection'].forEach(id => {
            document.getElementById(id).classList.remove('hidden-section');
            document.getElementById(id).classList.add('fade-load');
        });

        if (performanceChart) {
            performanceChart.data.datasets[0].data = [data.list_time_ms, data.dict_time_ms];
            performanceChart.update('active');
        }

        showToast('Benchmark completed!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
}
