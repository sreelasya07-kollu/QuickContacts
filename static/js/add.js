document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addContactForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            category: document.getElementById('category').value,
        };

        try {
            await apiFetch('/api/contacts', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            showToast('Contact added successfully!');
            e.target.reset();
            setTimeout(() => { window.location.href = '/contacts'; }, 800);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
});
