document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stats = await apiFetch('/api/stats');

        document.getElementById('totalContacts').textContent = stats.total_contacts;

        const lastSearch = stats.last_search || {};
        document.getElementById('lastSearchTime').textContent =
            formatDateTime(lastSearch.searched_at);

        const contactEl = document.getElementById('lastSearchedContact');
        const phoneEl = document.getElementById('lastSearchedPhone');

        if (lastSearch.contact_name && lastSearch.query) {
            contactEl.textContent = lastSearch.contact_name;
            phoneEl.textContent = lastSearch.contact_phone
                ? `📞 ${lastSearch.contact_phone}`
                : '';
        } else {
            contactEl.textContent = '—';
            phoneEl.textContent = '';
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
});
