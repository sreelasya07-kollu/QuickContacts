let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length === 0) {
            suggestionsList.classList.remove('active');
            suggestionsList.innerHTML = '';
            document.getElementById('searchResultsSection').style.display = 'none';
            document.getElementById('performanceSection').style.display = 'none';
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
});

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
            </li>
        `).join('');

        suggestionsList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                document.getElementById('searchInput').value = li.dataset.phone;
                suggestionsList.classList.remove('active');
                performSearch(li.dataset.phone);
            });
        });

        suggestionsList.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function performSearch(query) {
    if (!query) return;

    try {
        const data = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
        renderSearchResults(data.results);
        renderPerformanceMetrics(data.performance);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderSearchResults(results) {
    const section = document.getElementById('searchResultsSection');
    const container = document.getElementById('searchResults');
    const countEl = document.getElementById('resultCount');

    section.style.display = 'block';
    countEl.textContent = `${results.length} found`;

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-state">No matching contacts found</p>';
        return;
    }

    container.innerHTML = results.map(contact => `
        <div class="contact-card">
            <h3>${escapeHtml(contact.name)}</h3>
            <p>📞 ${escapeHtml(contact.phone)}</p>
            <p>✉️ ${escapeHtml(contact.email)}</p>
        </div>
    `).join('');
}

function renderPerformanceMetrics(performance) {
    if (!performance) return;

    const section = document.getElementById('performanceSection');
    const container = document.getElementById('searchPerfMetrics');

    section.style.display = 'block';
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
}
