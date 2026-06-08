document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stats = await apiFetch('/api/stats');

        document.getElementById('totalContacts').textContent = stats.total_contacts;

        const added = stats.last_added || {};
        document.getElementById('lastAddedContact').textContent = added.name || '—';
        document.getElementById('lastAddedPhone').textContent =
            added.phone ? `📞 ${added.phone}` : '';

        const searched = stats.last_search || {};
        document.getElementById('lastSearchedContact').textContent = searched.name || '—';
        document.getElementById('lastSearchedPhone').textContent =
            searched.phone && searched.phone !== '—' ? `📞 ${searched.phone}` : '';

        document.getElementById('bestSearchMethod').textContent =
            stats.best_search_method || 'Smart Search';
    } catch (err) {
        showToast(err.message, 'error');
    }
});
