document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stats = await apiFetch('/api/stats');

        document.getElementById('totalContacts').textContent = stats.total_contacts;

        const lastSearch = stats.last_search || {};
        document.getElementById('lastSearchTime').textContent =
            formatDateTime(lastSearch.searched_at);

        const contactEl = document.getElementById('lastSearchedContact');
        const phoneEl = document.getElementById('lastSearchedPhone');

        if (lastSearch.name && lastSearch.name !== 'No match found') {
            contactEl.textContent = lastSearch.name;
            phoneEl.textContent = lastSearch.phone && lastSearch.phone !== '—'
                ? `📞 ${lastSearch.phone}`
                : '';
        } else {
            contactEl.textContent = '—';
            phoneEl.textContent = '';
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
});
