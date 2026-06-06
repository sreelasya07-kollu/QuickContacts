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

    ['searchResultsSection', 'performanceSection'].forEach(id => {
        document.getElementById(id).classList.add('hidden-section');
    });

    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchComparisonCards').innerHTML = '';
    document.getElementById('timingResults').innerHTML = '';
    document.getElementById('searchPerfMetrics').innerHTML = '';
    document.getElementById('comparisonIntro').textContent = '';
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
    section.classList.add('fade-load');
    countEl.textContent = `${results.length} found`;

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-state">No matching contacts found. Try a different name or phone number.</p>';
        return;
    }

    container.innerHTML = results.map((contact, index) => `
        <div class="contact-card fade-load" style="--delay: ${index}">
            <div class="contact-card-header">
                <div class="contact-avatar">${getInitials(contact.name)}</div>
                <div>
                    <h3>${escapeHtml(contact.name)}</h3>
                    ${contact.category ? getCategoryTag(contact.category) : ''}
                </div>
            </div>
            <p>📞 ${escapeHtml(contact.phone)}</p>
            <p>✉️ ${escapeHtml(contact.email)}</p>
        </div>
    `).join('');
}

function renderPerformanceMetrics(performance) {
    if (!performance) return;

    const section = document.getElementById('performanceSection');
    section.classList.remove('hidden-section');
    section.classList.add('fade-load');

    document.getElementById('comparisonIntro').textContent = performance.faster_explanation;

    document.getElementById('searchComparisonCards').innerHTML = `
        <div class="compare-card normal-search">
            <div class="compare-card-top">
                <span class="compare-icon">📋</span>
                <div>
                    <h3>Normal Search</h3>
                    <p>Checks contacts one by one in a list</p>
                </div>
            </div>
            <div class="compare-stat">
                <span class="compare-stat-label">Contacts Checked</span>
                <span class="compare-stat-value">${performance.contacts_checked}</span>
            </div>
        </div>
        <div class="compare-card smart-search ${performance.faster === 'Smart Search' ? 'winner' : ''}">
            <div class="compare-card-top">
                <span class="compare-icon">⚡</span>
                <div>
                    <h3>Smart Search</h3>
                    <p>Uses a dictionary for instant phone lookup</p>
                </div>
            </div>
            <div class="compare-stat">
                <span class="compare-stat-label">Lookups Performed</span>
                <span class="compare-stat-value">${performance.lookups_performed}</span>
            </div>
        </div>
    `;

    document.getElementById('timingResults').innerHTML = `
        <div class="timing-row">
            <div class="timing-item">
                <span>Normal Search Time</span>
                <strong>${performance.list_time_ms} ms</strong>
            </div>
            <div class="timing-item highlight">
                <span>Smart Search Time</span>
                <strong>${performance.dict_time_ms} ms</strong>
            </div>
            <div class="timing-item winner-badge">
                <span>Faster Method</span>
                <strong>${escapeHtml(performance.faster)}</strong>
            </div>
        </div>
    `;

    document.getElementById('searchPerfMetrics').innerHTML = `
        <div class="perf-metrics-grid">
            <div class="perf-metric">
                <span class="perf-label">Python List · Linear Search</span>
                <span class="perf-value">${performance.list_time_ms} ms</span>
                <span class="perf-sub">${performance.list_complexity} · ${performance.contacts_checked} comparisons</span>
            </div>
            <div class="perf-metric">
                <span class="perf-label">Python Dictionary · Hash Lookup</span>
                <span class="perf-value">${performance.dict_time_ms} ms</span>
                <span class="perf-sub">${performance.dict_complexity} · ${performance.lookups_performed} lookup(s)</span>
            </div>
            <div class="perf-metric">
                <span class="perf-label">Total Contacts Stored</span>
                <span class="perf-value">${performance.total_contacts}</span>
            </div>
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
            labels: ['Normal Search', 'Smart Search'],
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
            animation: { duration: 700, easing: 'easeOutQuart' },
            plugins: { legend: { display: false } },
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

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
