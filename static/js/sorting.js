let sortTimeChart = null;
let sortComplexityChart = null;

const BUBBLE_COLOR = 'rgba(249, 115, 22, 0.85)';
const BUBBLE_BORDER = 'rgba(249, 115, 22, 1)';
const MERGE_COLOR = 'rgba(34, 197, 94, 0.85)';
const MERGE_BORDER = 'rgba(34, 197, 94, 1)';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('compareSortsBtn').addEventListener('click', compareSorts);
    document.getElementById('clearSortsBtn').addEventListener('click', clearSorting);

    document.getElementById('arrayInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            compareSorts();
        }
    });
});

function getChartTheme() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    return {
        tickColor: isDark ? '#9aa0b4' : '#64748b',
        gridColor: isDark ? 'rgba(45, 51, 72, 0.5)' : 'rgba(148, 163, 184, 0.35)',
    };
}

function barValuePlugin(unit) {
    return {
        id: 'barValuePlugin',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            ctx.font = '600 12px Inter, sans-serif';
            ctx.fillStyle = getChartTheme().tickColor;
            ctx.textAlign = 'center';

            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.data.forEach((bar, index) => {
                    const value = dataset.data[index];
                    const label = unit === 'ms'
                        ? `${Number(value).toFixed(3)} ms`
                        : String(value);
                    ctx.fillText(label, bar.x, bar.y - 8);
                });
            });

            ctx.restore();
        },
    };
}

function buildBarChartOptions(yLabel, tickColor, gridColor) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.label}: ${ctx.parsed.y}${yLabel.includes('ms') ? ' ms' : ''}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: yLabel, color: tickColor },
                ticks: { color: tickColor },
                grid: { color: gridColor },
            },
            x: {
                ticks: { color: tickColor, font: { weight: '600' } },
                grid: { display: false },
            },
        },
    };
}

function renderSortCharts(data) {
    if (typeof Chart === 'undefined') return;

    const { tickColor, gridColor } = getChartTheme();
    const bubbleMs = Number(data.bubble_sort_time_ms) || 0;
    const mergeMs = Number(data.merge_sort_time_ms) || 0;
    const bubbleOps = data.bubble_theoretical_ops || 0;
    const mergeOps = data.merge_theoretical_ops || 0;

    document.getElementById('chartArraySize').textContent = data.array_size;
    document.getElementById('sortChartPlaceholder').classList.add('hidden-section');
    document.getElementById('sortChartGrid').classList.remove('hidden-section');

    const timeCanvas = document.getElementById('sortTimeChart');
    const complexityCanvas = document.getElementById('sortComplexityChart');

    if (sortTimeChart) sortTimeChart.destroy();
    if (sortComplexityChart) sortComplexityChart.destroy();

    sortTimeChart = new Chart(timeCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['🫧 Bubble Sort', '🔀 Merge Sort'],
            datasets: [{
                label: 'Execution Time',
                data: [bubbleMs, mergeMs],
                backgroundColor: [BUBBLE_COLOR, MERGE_COLOR],
                borderColor: [BUBBLE_BORDER, MERGE_BORDER],
                borderWidth: 2,
                borderRadius: 10,
            }],
        },
        options: buildBarChartOptions('Time (ms)', tickColor, gridColor),
        plugins: [barValuePlugin('ms')],
    });

    sortComplexityChart = new Chart(complexityCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['🫧 Bubble O(n²)', '🔀 Merge O(n log n)'],
            datasets: [{
                label: 'Theoretical Operations',
                data: [bubbleOps, mergeOps],
                backgroundColor: [BUBBLE_COLOR, MERGE_COLOR],
                borderColor: [BUBBLE_BORDER, MERGE_BORDER],
                borderWidth: 2,
                borderRadius: 10,
            }],
        },
        options: buildBarChartOptions('Operations (n² vs n log n)', tickColor, gridColor),
        plugins: [barValuePlugin('ops')],
    });
}

function formatArrayDisplay(numbers, maxShow = 80) {
    if (!numbers || !numbers.length) return '—';
    const text = numbers.join(', ');
    if (numbers.length <= maxShow) return text;
    const preview = numbers.slice(0, maxShow).join(', ');
    return `${preview}, … (+${numbers.length - maxShow} more)`;
}

function resetSortResults() {
    document.getElementById('bubbleTimeValue').textContent = '—';
    document.getElementById('mergeTimeValue').textContent = '—';
    document.getElementById('bubbleComplexityValue').textContent = 'O(n²)';
    document.getElementById('mergeComplexityValue').textContent = 'O(n log n)';
    document.getElementById('sortWinnerName').textContent = 'Click Compare Sorts';
    document.getElementById('sortWinnerDesc').textContent =
        'Enter numbers above and click Compare Sorts to see which algorithm is faster.';
    document.getElementById('complexityOutput')?.classList.add('hidden-section');
    document.getElementById('sortChartPlaceholder').classList.remove('hidden-section');
    document.getElementById('sortChartPlaceholder').innerHTML =
        'Click <strong>Compare Sorts</strong> to generate the graphs below.';
    document.getElementById('sortChartGrid').classList.add('hidden-section');
    document.querySelector('.method-card.bubble-card')?.classList.remove('winner');
    document.querySelector('.method-card.merge-card')?.classList.remove('winner');

    if (sortTimeChart) {
        sortTimeChart.destroy();
        sortTimeChart = null;
    }
    if (sortComplexityChart) {
        sortComplexityChart.destroy();
        sortComplexityChart = null;
    }
}

function clearSorting() {
    document.getElementById('arrayInput').value = '';
    document.getElementById('arrayInfoSection').classList.add('hidden-section');
    resetSortResults();
}

function renderSortResults(data) {
    const bubbleTime = formatSearchTime(data.bubble_sort_time_ms);
    const mergeTime = formatSearchTime(data.merge_sort_time_ms);
    const diffTime = formatSearchTime(data.performance_difference_ms);
    const faster = data.faster_algorithm || '—';
    const bubbleWins = faster === 'Bubble Sort';

    document.getElementById('arraySizeValue').textContent = data.array_size;
    document.getElementById('originalArrayDisplay').textContent =
        formatArrayDisplay(data.original_array);
    document.getElementById('sortedArrayDisplay').textContent =
        formatArrayDisplay(data.sorted_array);

    const bubbleComplexity = data.bubble_complexity || 'O(n²)';
    const mergeComplexity = data.merge_complexity || 'O(n log n)';

    document.getElementById('bubbleTimeValue').textContent = bubbleTime;
    document.getElementById('mergeTimeValue').textContent = mergeTime;
    document.getElementById('bubbleComplexityValue').textContent = bubbleComplexity;
    document.getElementById('mergeComplexityValue').textContent = mergeComplexity;
    document.getElementById('bubbleComplexityOutput').textContent = bubbleComplexity;
    document.getElementById('mergeComplexityOutput').textContent = mergeComplexity;
    document.getElementById('complexitySummary').textContent =
        `For ${data.array_size} elements: Bubble Sort (${bubbleComplexity}) = ${data.bubble_theoretical_ops} ops, ` +
        `Merge Sort (${mergeComplexity}) = ${data.merge_theoretical_ops} ops. ${faster} was faster in execution.`;
    document.getElementById('complexityOutput').classList.remove('hidden-section');

    document.querySelector('.method-card.bubble-card')?.classList.toggle('winner', bubbleWins);
    document.querySelector('.method-card.merge-card')?.classList.toggle('winner', !bubbleWins);

    document.getElementById('sortWinnerName').textContent = faster;
    document.getElementById('sortWinnerDesc').innerHTML =
        `Performance difference: <strong>${diffTime}</strong> faster than the other algorithm for this array.`;

    document.getElementById('arrayInfoSection').classList.remove('hidden-section');
    renderSortCharts(data);
}

async function compareSorts() {
    const numbers = document.getElementById('arrayInput').value.trim();
    if (!numbers) {
        showToast('Enter numbers separated by commas', 'error');
        return;
    }

    try {
        const data = await apiFetch('/api/sorting/compare', {
            method: 'POST',
            body: JSON.stringify({ numbers }),
        });
        renderSortResults(data);
        showToast('Sort graphs updated!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}
