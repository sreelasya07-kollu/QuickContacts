let debounceTimer;
let searchChart = null;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');

    document.getElementById('searchBtn').addEventListener('click', () => {
        performSearch(searchInput.value.trim());
    });
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    document.getElementById('clearInputBtn').addEventListener('click', clearSearch);

    searchInput.addEventListener('input', () => {
        toggleClearButton();
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        if (query.length === 0) {
            document.getElementById('suggestionsList').classList.remove('active');
            document.getElementById('suggestionsList').innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => fetchSuggestions(query), 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch(searchInput.value.trim());
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            document.getElementById('suggestionsList').classList.remove('active');
        }
    });

    toggleClearButton();
});

function toggleClearButton() {
    const input = document.getElementById('searchInput');
    const btn = document.getElementById('clearInputBtn');
    if (input && btn) btn.classList.toggle('visible', input.value.length > 0);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('suggestionsList').classList.remove('active');
    document.getElementById('suggestionsList').innerHTML = '';

    ['searchResultsSection', 'performanceSection'].forEach(id => {
        document.getElementById(id).classList.add('hidden-section');
    });

    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchComparisonCards').innerHTML = '';
    document.getElementById('timingResults').innerHTML = '';
    document.getElementById('resultCount').textContent = '0 found';

    if (searchChart) {
        searchChart.destroy();
        searchChart = null;
    }

    toggleClearButton();
    document.getElementById('searchInput').focus();
}

async function fetchSuggestions(query) {
    try {
        const suggestions = await apiFetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        const list = document.getElementById('suggestionsList');

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
                document.getElementById('searchInput').value = li.dataset.name;
                toggleClearButton();
                list.classList.remove('active');
            });
        });

        list.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function performSearch(query) {
    if (!query) {
        showToast('Enter a name or phone number to search', 'error');
        return;
    }

    try {
        const data = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
        renderSearchResults(data.results);
        renderPerformanceMetrics(data.performance);
        toggleClearButton();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderSearchResults(results) {
    const section = document.getElementById('searchResultsSection');
    const container = document.getElementById('searchResults');

    section.classList.remove('hidden-section');
    document.getElementById('resultCount').textContent = `${results.length} found`;

    if (!results.length) {
        container.innerHTML = emptyState(
            '🔍',
            'No matching contacts found',
            'Try a different name or phone number.',
            '<a href="/add" class="btn small primary">Add Contact</a>'
        );
        return;
    }

    container.innerHTML = results.map(c => renderContactCard(c)).join('');
}

function renderPerformanceMetrics(perf) {
    if (!perf) return;

    document.getElementById('performanceSection').classList.remove('hidden-section');

    document.getElementById('searchComparisonCards').innerHTML = `
        <div class="compare-card">
            <h4>Normal Search</h4>
            <p class="compare-desc">Checks contacts one by one</p>
            <div class="compare-stat">
                <span class="compare-stat-label">Contacts Checked</span>
                <span class="compare-stat-value">${perf.contacts_checked}</span>
            </div>
        </div>
        <div class="compare-card winner">
            <h4>Smart Search</h4>
            <p class="compare-desc">Fast instant lookup</p>
            <div class="compare-stat">
                <span class="compare-stat-label">Lookups Performed</span>
                <span class="compare-stat-value">${perf.lookups_performed}</span>
            </div>
        </div>
    `;

    document.getElementById('timingResults').innerHTML = `
        <div class="timing-row">
            <div class="timing-item">
                <span>Normal Search</span>
                <strong>${perf.normal_search_time_ms} ms</strong>
            </div>
            <div class="timing-item highlight">
                <span>Smart Search</span>
                <strong>${perf.smart_search_time_ms} ms</strong>
            </div>
            <div class="timing-item winner-badge">
                <span>Best Search Method</span>
                <strong>${escapeHtml(perf.best_search_method || perf.faster)}</strong>
            </div>
        </div>
    `;

    renderSearchChart(perf);
}

function renderSearchChart(perf) {
    const canvas = document.getElementById('searchPerfChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (searchChart) searchChart.destroy();

    searchChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Normal Search', 'Smart Search'],
            datasets: [{
                label: 'Time (ms)',
                data: [perf.normal_search_time_ms, perf.smart_search_time_ms],
                backgroundColor: ['rgba(59, 130, 246, 0.75)', 'rgba(34, 197, 94, 0.75)'],
                borderRadius: 10,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
        },
    });
}
