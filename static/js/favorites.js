document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
});

async function loadFavorites() {
    try {
        const favorites = await apiFetch('/api/favorites');
        renderFavorites(favorites);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderFavorites(favorites) {
    const grid = document.getElementById('favoritesGrid');
    document.getElementById('favoriteCount').textContent =
        `${favorites.length} favorite${favorites.length !== 1 ? 's' : ''}`;

    if (favorites.length === 0) {
        grid.innerHTML = '<p class="empty-state">No favorite contacts yet. Star a contact to add it here!</p>';
        return;
    }

    grid.innerHTML = favorites.map(contact => `
        <div class="favorite-card ${contact.category === 'Emergency' ? 'emergency' : ''}">
            <span class="star-badge">⭐</span>
            <h3>${escapeHtml(contact.name)}</h3>
            <p>📞 ${escapeHtml(contact.phone)}</p>
            <p>✉️ ${escapeHtml(contact.email)}</p>
            <p>${getCategoryTag(contact.category)}</p>
            <div class="card-actions">
                <button class="btn small secondary" onclick="removeFavorite(${contact.id})">
                    Remove from Favorites
                </button>
            </div>
        </div>
    `).join('');
}

async function removeFavorite(id) {
    try {
        await apiFetch(`/api/contacts/${id}/favorite`, { method: 'POST' });
        showToast('Removed from favorites');
        loadFavorites();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
