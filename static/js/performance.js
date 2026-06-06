let performanceChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    runBenchmark();

    document.getElementById('runBenchmark').addEventListener('click', runBenchmark);
});

function initChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['List (O(n))', 'Dictionary (O(1))'],
            datasets: [{
                label: 'Search Time (ms)',
                data: [0, 0],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                ],
                borderWidth: 2,
                borderRadius: 8,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e2230',
                    titleColor: '#e8eaed',
                    bodyColor: '#9aa0b4',
                    borderColor: '#2d3348',
                    borderWidth: 1,
                    callbacks: {
                        label: (ctx) => `${ctx.parsed.y.toFixed(4)} ms`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Execution Time (milliseconds)',
                        color: '#9aa0b4',
                    },
                    ticks: { color: '#9aa0b4' },
                    grid: { color: 'rgba(45, 51, 72, 0.5)' },
                },
                x: {
                    ticks: { color: '#9aa0b4' },
                    grid: { display: false },
                },
            },
        },
    });
}

async function runBenchmark() {
    const query = document.getElementById('perfQuery').value.trim() || 'a';

    try {
        const data = await apiFetch(`/api/performance?q=${encodeURIComponent(query)}`);

        document.getElementById('listTime').textContent = `${data.list_time_ms} ms`;
        document.getElementById('dictTime').textContent = `${data.dict_time_ms} ms`;
        document.getElementById('fasterMethod').textContent = data.faster;
        document.getElementById('totalForPerf').textContent = data.total_contacts;

        performanceChart.data.datasets[0].data = [data.list_time_ms, data.dict_time_ms];
        performanceChart.update('active');

        showToast('Benchmark completed!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}
