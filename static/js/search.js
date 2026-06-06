let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
    loadRecentSearches();

    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length === 0) {
            suggestionsList.classList.remove('active');
            suggestionsList.innerHTML = '';
            document.getElementById('searchResultsSection').style.display = 'none';
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
            <li data-id="${s.id}" data-name="${escapeHtml(s.name)}">
                <span>
                    <span class="suggestion-name">${escapeHtml(s.name)}</span>
                    <span class="suggestion-phone">${escapeHtml(s.phone)}</span>
                </span>
                ${getCategoryTag(s.category)}
            </li>
        `).join('');

        suggestionsList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                selectSuggestion(Number(li.dataset.id), li.dataset.name);
            });
        });

        suggestionsList.classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function selectSuggestion(id, name) {
    document.getElementById('searchInput').value = name;
    document.getElementById('suggestionsList').classList.remove('active');
    performSearch(name, id);
}

async function performSearch(query, contactId = null) {
    if (!query) return;

    try {
        const results = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
        renderSearchResults(results);

        if (contactId) {
            await apiFetch(`/api/recent-searches/${contactId}`, { method: 'POST' });
        } else if (results.length > 0) {
            await apiFetch(`/api/recent-searches/${results[0].id}`, { method: 'POST' });
        }

        loadRecentSearches();
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
        <div class="contact-card ${contact.category === 'Emergency' ? 'emergency' : ''}">
            <h3>${escapeHtml(contact.name)}</h3>
            <p>📞 ${escapeHtml(contact.phone)}</p>
            <p>✉️ ${escapeHtml(contact.email)}</p>
            <div class="card-footer">
                ${getCategoryTag(contact.category)}
                <button class="btn icon-btn small ${contact.favorite ? 'active' : ''}"
                        onclick="toggleSearchFavorite(${contact.id})">
                    ${contact.favorite ? '⭐' : '☆'}
                </button>
            </div>
        </div>
    `).join('');
}

async function toggleSearchFavorite(id) {
    try {
        await apiFetch(`/api/contacts/${id}/favorite`, { method: 'POST' });
        performSearch(document.getElementById('searchInput').value.trim());
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadRecentSearches() {
    try {
        const searches = await apiFetch('/api/recent-searches');
        renderRecentSearches(document.getElementById('recentSearchesList'), searches);
    } catch (err) {
        showToast(err.message, 'error');
    }
}
