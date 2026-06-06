document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stats = await apiFetch('/api/stats');
        document.getElementById('totalContacts').textContent = stats.total_contacts;
    } catch (err) {
        showToast(err.message, 'error');
    }
});
