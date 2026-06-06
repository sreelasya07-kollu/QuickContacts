let barChart = null;
let lineChart = null;
let reportData = [];

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadReport();
    loadCurrentSize();

    document.getElementById('runBenchmark').addEventListener('click', runLiveBenchmark);

    document.querySelectorAll('.generate-actions button').forEach(button => {
        button.addEventListener('click', () => generateSample(Number(button.dataset.size)));
    });
});

function initCharts() {
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'List Search (ms)',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                },
                {
                    label: 'Dictionary Search (ms)',
                    data: [],
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                },
            ],
        },
        options: chartOptions('Search Time (ms)'),
    });

    const lineCtx = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'List Search (ms)',
                    data: [],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: 'Dictionary Search (ms)',
                    data: [],
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    fill: true,
                    tension: 0.3,
                },
            ],
        },
        options: chartOptions('Execution Time (ms)'),
    });
}

function chartOptions(yLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#9aa0b4' } },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: yLabel, color: '#9aa0b4' },
                ticks: { color: '#9aa0b4' },
                grid: { color: 'rgba(45, 51, 72, 0.5)' },
            },
            x: {
                ticks: { color: '#9aa0b4' },
                grid: { display: false },
            },
        },
    };
}

async function loadCurrentSize() {
    try {
        const stats = await apiFetch('/api/stats');
        document.getElementById('currentDataSize').textContent =
            `Current contacts: ${stats.total_contacts}`;
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
        reportData = await apiFetch('/api/performance/report');
        renderReportTable(reportData);
        updateCharts(reportData);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderReportTable(report) {
    const tbody = document.getElementById('reportBody');

    if (!report.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No report data</td></tr>';
        return;
    }

    tbody.innerHTML = report.map(row => `
        <tr>
            <td><strong>${row.data_size}</strong></td>
            <td>${row.list_time_ms}</td>
            <td>${row.dict_time_ms}</td>
            <td>${row.list_comparisons}</td>
            <td>${row.dict_comparisons}</td>
            <td>${escapeHtml(row.faster)}</td>
        </tr>
    `).join('');
}

function updateCharts(report) {
    const labels = report.map(r => r.data_size.toString());
    const listTimes = report.map(r => r.list_time_ms);
    const dictTimes = report.map(r => r.dict_time_ms);

    barChart.data.labels = labels;
    barChart.data.datasets[0].data = listTimes;
    barChart.data.datasets[1].data = dictTimes;
    barChart.update();

    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = listTimes;
    lineChart.data.datasets[1].data = dictTimes;
    lineChart.update();
}

async function runLiveBenchmark() {
    const query = document.getElementById('perfQuery').value.trim();
    if (!query) {
        showToast('Enter a phone number to search', 'error');
        return;
    }

    try {
        const data = await apiFetch(`/api/performance/search?q=${encodeURIComponent(query)}`);

        document.getElementById('benchmarkStats').style.display = 'grid';
        document.getElementById('listTime').textContent = `${data.list_time_ms} ms`;
        document.getElementById('dictTime').textContent = `${data.dict_time_ms} ms`;
        document.getElementById('listComparisons').textContent = data.list_comparisons;
        document.getElementById('dictComparisons').textContent = data.dict_comparisons;
        document.getElementById('fasterMethod').textContent = data.faster;

        showToast('Benchmark completed!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}
