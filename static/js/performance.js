let performanceChart = null;
let sortPerfChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    document.getElementById('runBenchmark').addEventListener('click', runBenchmark);
    document.getElementById('compareSortsPerf').addEventListener('click', compareSortsPerf);
    document.getElementById('clearSortsPerf').addEventListener('click', clearSortsPerf);

    document.getElementById('sortArrayInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            compareSortsPerf();
        }
    });
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
        options: chartOptions('Execution Time (ms)', tickColor, gridColor),
    });
}

function chartOptions(yLabel, tickColor, gridColor) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: 'easeOutQuart' },
        plugins: { legend: { display: false } },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: yLabel, color: tickColor },
                ticks: { color: tickColor },
                grid: { color: gridColor },
            },
            x: {
                ticks: { color: tickColor },
                grid: { display: false },
            },
        },
    };
}

function initSortPerfChart() {
    if (sortPerfChart || typeof Chart === 'undefined') return;

    const canvas = document.getElementById('sortPerfChart');
    if (!canvas) return;

    const isDark = getTheme() === 'dark';
    const tickColor = isDark ? '#9aa0b4' : '#64748b';
    const gridColor = isDark ? 'rgba(45, 51, 72, 0.5)' : 'rgba(148, 163, 184, 0.35)';

    sortPerfChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Bubble Sort', 'Merge Sort'],
            datasets: [{
                label: 'Execution Time (ms)',
                data: [0, 0],
                backgroundColor: ['rgba(249, 115, 22, 0.75)', 'rgba(34, 197, 94, 0.75)'],
                borderRadius: 10,
            }],
        },
        options: chartOptions('Execution Time (ms)', tickColor, gridColor),
    });
}

function formatArrayDisplay(numbers, maxShow = 80) {
    if (!numbers || !numbers.length) return '—';
    const text = numbers.join(', ');
    if (numbers.length <= maxShow) return text;
    return `${numbers.slice(0, maxShow).join(', ')}, … (+${numbers.length - maxShow} more)`;
}

async function runBenchmark() {
    const query = document.getElementById('perfQuery').value.trim();
    if (!query) {
        showToast('Enter a contact name to compare search speed', 'error');
        return;
    }

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

        showToast('Search benchmark completed!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function compareSortsPerf() {
    const numbers = document.getElementById('sortArrayInput').value.trim();
    if (!numbers) {
        showToast('Enter numbers separated by commas', 'error');
        return;
    }

    try {
        const data = await apiFetch('/api/sorting/compare', {
            method: 'POST',
            body: JSON.stringify({ numbers }),
        });
        renderSortPerfResults(data);
        showToast('Sort comparison complete!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderSortPerfResults(data) {
    const bubbleTime = formatSearchTime(data.bubble_sort_time_ms);
    const mergeTime = formatSearchTime(data.merge_sort_time_ms);
    const bubbleMs = Number(data.bubble_sort_time_ms) || 0;
    const mergeMs = Number(data.merge_sort_time_ms) || 0;
    const diffTime = formatSearchTime(data.performance_difference_ms);
    const faster = data.faster_algorithm || '—';
    const bubbleWins = faster === 'Bubble Sort';

    document.getElementById('sortPerfArraySize').textContent = data.array_size;
    document.getElementById('sortPerfOriginal').textContent = formatArrayDisplay(data.original_array);
    document.getElementById('sortPerfSorted').textContent = formatArrayDisplay(data.sorted_array);
    document.getElementById('perfBubbleTime').textContent = bubbleTime;
    document.getElementById('perfMergeTime').textContent = mergeTime;
    document.getElementById('perfBubbleComplexity').textContent = data.bubble_complexity || 'O(n²)';
    document.getElementById('perfMergeComplexity').textContent = data.merge_complexity || 'O(n log n)';
    document.getElementById('perfSortWinnerName').textContent = faster;
    document.getElementById('perfSortWinnerDesc').innerHTML =
        `Performance difference: <strong>${diffTime}</strong> faster than the other algorithm.`;

    document.querySelector('#sortPerfResultsSection .bubble-card')?.classList.toggle('winner', bubbleWins);
    document.querySelector('#sortPerfResultsSection .merge-card')?.classList.toggle('winner', !bubbleWins);

    document.getElementById('sortPerfInfoSection').classList.remove('hidden-section');
    document.getElementById('sortPerfInfoSection').classList.add('fade-load');
    document.getElementById('sortPerfChartPlaceholder').classList.add('hidden-section');
    document.getElementById('sortPerfChart').classList.remove('hidden-section');

    initSortPerfChart();
    if (sortPerfChart) {
        sortPerfChart.data.datasets[0].data = [bubbleMs, mergeMs];
        sortPerfChart.update('active');
        requestAnimationFrame(() => sortPerfChart.resize());
    }
}

function clearSortsPerf() {
    document.getElementById('sortArrayInput').value = '';
    document.getElementById('sortPerfInfoSection').classList.add('hidden-section');
    document.getElementById('perfBubbleTime').textContent = '—';
    document.getElementById('perfMergeTime').textContent = '—';
    document.getElementById('perfBubbleComplexity').textContent = 'O(n²)';
    document.getElementById('perfMergeComplexity').textContent = 'O(n log n)';
    document.getElementById('perfSortWinnerName').textContent = 'Enter numbers and compare';
    document.getElementById('perfSortWinnerDesc').textContent =
        'Click Compare Sorts to measure Bubble Sort and Merge Sort.';
    document.querySelector('#sortPerfResultsSection .bubble-card')?.classList.remove('winner');
    document.querySelector('#sortPerfResultsSection .merge-card')?.classList.remove('winner');
    document.getElementById('sortPerfChartPlaceholder').classList.remove('hidden-section');
    document.getElementById('sortPerfChart').classList.add('hidden-section');

    if (sortPerfChart) {
        sortPerfChart.data.datasets[0].data = [0, 0];
        sortPerfChart.update();
    }
}

function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
}
