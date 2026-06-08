let sortChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initSortChart();

    document.getElementById('compareSortsBtn').addEventListener('click', compareSorts);
    document.getElementById('clearSortsBtn').addEventListener('click', clearSorting);

    document.querySelectorAll('.sort-generate button').forEach(btn => {
        btn.addEventListener('click', () => generateRandomArray(Number(btn.dataset.size)));
    });
});

function initSortChart() {
    if (typeof Chart === 'undefined') return;

    sortChart = new Chart(document.getElementById('sortChart').getContext('2d'), {
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
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Execution Time (ms)', color: '#9aa0b4' },
                    ticks: { color: '#9aa0b4' },
                },
                x: { ticks: { color: '#9aa0b4' }, grid: { display: false } },
            },
        },
    });
}

function formatArrayDisplay(numbers, maxShow = 80) {
    if (!numbers || !numbers.length) return '—';
    const text = numbers.join(', ');
    if (numbers.length <= maxShow) return text;
    const preview = numbers.slice(0, maxShow).join(', ');
    return `${preview}, … (+${numbers.length - maxShow} more)`;
}

function clearSorting() {
    document.getElementById('arrayInput').value = '';
    document.getElementById('arrayInfoSection').classList.add('hidden-section');
    document.getElementById('sortResultsSection').classList.add('hidden-section');
    document.getElementById('sortMethodGrid').innerHTML = '';
    document.getElementById('sortWinnerCard').innerHTML = '';
    document.getElementById('sortChartPlaceholder').classList.remove('hidden-section');
    document.getElementById('sortChart').classList.add('hidden-section');

    if (sortChart) {
        sortChart.data.datasets[0].data = [0, 0];
        sortChart.update();
    }
}

async function generateRandomArray(size) {
    try {
        const data = await apiFetch(`/api/sorting/random/${size}`);
        document.getElementById('arrayInput').value = data.display;
        showToast(`Generated ${data.array_size} random numbers`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderSortResults(data) {
    const bubbleTime = formatSearchTime(data.bubble_sort_time_ms);
    const mergeTime = formatSearchTime(data.merge_sort_time_ms);
    const bubbleMs = Number(data.bubble_sort_time_ms) || 0;
    const mergeMs = Number(data.merge_sort_time_ms) || 0;
    const diffTime = formatSearchTime(data.performance_difference_ms);
    const faster = data.faster_algorithm || '—';

    document.getElementById('arraySizeValue').textContent = data.array_size;
    document.getElementById('originalArrayDisplay').textContent =
        formatArrayDisplay(data.original_array);
    document.getElementById('sortedArrayDisplay').textContent =
        formatArrayDisplay(data.sorted_array);

    document.getElementById('sortMethodGrid').innerHTML = `
        <div class="method-card bubble-card">
            <h4>Bubble Sort</h4>
            <ul class="method-stats">
                <li><span>Time Complexity</span><strong>${data.bubble_complexity || 'O(n²)'}</strong></li>
                <li><span>Execution Time</span><strong class="time-value">${bubbleTime}</strong></li>
            </ul>
        </div>
        <div class="method-card winner merge-card">
            <h4>Merge Sort</h4>
            <ul class="method-stats">
                <li><span>Time Complexity</span><strong>${data.merge_complexity || 'O(n log n)'}</strong></li>
                <li><span>Execution Time</span><strong class="time-value">${mergeTime}</strong></li>
            </ul>
        </div>
    `;

    document.getElementById('sortWinnerCard').innerHTML = `
        <div class="winner-inner">
            <span class="winner-icon">🏆</span>
            <div>
                <p class="winner-label">Faster Algorithm</p>
                <h4 class="winner-name">${escapeHtml(faster)}</h4>
                <p class="winner-desc">Performance difference: <strong>${diffTime}</strong> faster than the other algorithm for this array.</p>
            </div>
        </div>
    `;

    document.getElementById('arrayInfoSection').classList.remove('hidden-section');
    document.getElementById('sortResultsSection').classList.remove('hidden-section');
    document.getElementById('sortChartPlaceholder').classList.add('hidden-section');
    document.getElementById('sortChart').classList.remove('hidden-section');

    if (sortChart) {
        sortChart.data.datasets[0].data = [bubbleMs, mergeMs];
        sortChart.update('active');
        requestAnimationFrame(() => sortChart.resize());
    }
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
        showToast('Sort comparison complete!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}
