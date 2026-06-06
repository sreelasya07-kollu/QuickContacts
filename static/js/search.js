let debounceTimer;
let searchChart = null;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');

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
            suggestionsList.classList.remove('active');
            suggestionsList.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => fetchSuggestions(query), 250);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value.trim());
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            suggestionsList.classList.remove('active');
        }
    });

    toggleClearButton();
});

function toggleClearButton() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearInputBtn');
    if (!input || !clearBtn) return;
    clearBtn.classList.toggle('visible', input.value.length > 0);
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');

    searchInput.value = '';
    suggestionsList.classList.remove('active');
    suggestionsList.innerHTML = '';

    document.getElementById('searchResultsSection').classList.add('hidden-section');
    document.getElementById('performanceSection').classList.add('hidden-section');
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchPerfMetrics').innerHTML = '';
    document.getElementById('resultCount').textContent = '0 found';

    if (searchChart) {
        searchChart.destroy();
        searchChart = null;
    }

    toggleClearButton();
    searchInput.focus();
}

async function fetchSuggestions(query) {
    try {
        const suggestions = await apiFetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        const suggestionsList = document.getElementById('suggestionsList');

        if (suggestions.length === 0) {
            suggestionsList.classList.remove('active');
            return;
        }

        suggestionsList.innerHTML = suggestions.map(s => `
            <li data-id="${s.id}" data-name="${escapeHtml(s.name)}" data-phone="${escapeHtml(s.phone)}">
                <span>
                    <span class="suggestion-name">${escapeHtml(s.name)}</span>
                    <span class="suggestion-phone">${escapeHtml(s.phone)}</span>
                </span>
                ${s.category ? getCategoryTag(s.category) : ''}
            </li>
        `).join('');

        suggestionsList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                document.getElementById('searchInput').value = li.dataset.name;
                toggleClearButton();
                suggestionsList.classList.remove('active');
                performSearch(li.dataset.name);
            });
        });

        suggestionsList.classList.add('active');
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
    const countEl = document.getElementById('resultCount');

    section.classList.remove('hidden-section');
    countEl.textContent = `${results.length} found`;

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-state">No matching contacts found</p>';
        return;
    }

    container.innerHTML = results.map(contact => `
        <div class="contact-card ${contact.category === 'Emergency' ? 'emergency' : ''}">
            <h3>${escapeHtml(contact.name)}</h3>
            <p>📞 ${escapeHtml(contact.phone)}</p>
            <p>✉️ ${escapeHtml(contact.email)}</p>
            ${contact.category ? `<div class="card-footer">${getCategoryTag(contact.category)}</div>` : ''}
        </div>
    `).join('');
}

function renderPerformanceMetrics(performance) {
    if (!performance) return;

    const section = document.getElementById('performanceSection');
    const container = document.getElementById('searchPerfMetrics');

    section.classList.remove('hidden-section');
    container.innerHTML = `
        <div class="perf-metric">
            <span class="perf-label">List Search Time</span>
            <span class="perf-value">${performance.list_time_ms} ms</span>
            <span class="perf-sub">O(n) · ${performance.list_comparisons} comparisons</span>
        </div>
        <div class="perf-metric">
            <span class="perf-label">Dictionary Search Time</span>
            <span class="perf-value">${performance.dict_time_ms} ms</span>
            <span class="perf-sub">O(1) · ${performance.dict_comparisons} comparisons</span>
        </div>
        <div class="perf-metric highlight">
            <span class="perf-label">Faster Method</span>
            <span class="perf-value small">${escapeHtml(performance.faster)}</span>
        </div>
        <div class="perf-metric">
            <span class="perf-label">Total Contacts</span>
            <span class="perf-value">${performance.total_contacts}</span>
        </div>
    `;

    renderSearchChart(performance);
}

function renderSearchChart(performance) {
    const canvas = document.getElementById('searchPerfChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (searchChart) {
        searchChart.destroy();
    }

    const isDark = getTheme() === 'dark';
    const tickColor = isDark ? '#9aa0b4' : '#64748b';
    const gridColor = isDark ? 'rgba(45, 51, 72, 0.5)' : 'rgba(148, 163, 184, 0.35)';

    searchChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['List Search O(n)', 'Dictionary Search O(1)'],
            datasets: [{
                label: 'Search Time (ms)',
                data: [performance.list_time_ms, performance.dict_time_ms],
                backgroundColor: ['rgba(59, 130, 246, 0.75)', 'rgba(34, 197, 94, 0.75)'],
                borderColor: ['rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)'],
                borderWidth: 2,
                borderRadius: 10,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 700,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: {
                    beginAtZero: true,
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

function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
}
