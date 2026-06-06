document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stats = await apiFetch('/api/stats');

        document.getElementById('totalContacts').textContent = stats.total_contacts;
        document.getElementById('favoriteContacts').textContent = stats.favorite_contacts;
        document.getElementById('recentSearchCount').textContent = stats.recent_searches.length;
        document.getElementById('emergencyContacts').textContent = stats.category_counts.Emergency || 0;

        renderRecentSearches(
            document.getElementById('recentSearchesList'),
            stats.recent_searches
        );

        renderCategoryBars(stats.category_counts, stats.total_contacts);
    } catch (err) {
        showToast(err.message, 'error');
    }
});

function renderCategoryBars(counts, total) {
    const container = document.getElementById('categoryBars');
    if (!container) return;

    const categories = [
        { name: 'Family', key: 'Family', class: 'family' },
        { name: 'Friends', key: 'Friends', class: 'friends' },
        { name: 'Work', key: 'Work', class: 'work' },
        { name: 'Emergency', key: 'Emergency', class: 'emergency' },
    ];

    container.innerHTML = categories.map(cat => {
        const count = counts[cat.key] || 0;
        const percent = total > 0 ? (count / total) * 100 : 0;
        return `
            <div class="category-bar-item">
                <div class="category-bar-label">
                    <span>${cat.name}</span>
                    <span>${count} contact${count !== 1 ? 's' : ''}</span>
                </div>
                <div class="category-bar-track">
                    <div class="category-bar-fill ${cat.class}" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }).join('');
}
