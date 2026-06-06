document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addContactForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
        };

        try {
            await apiFetch('/api/contacts', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            showToast('Contact added successfully!');
            form.reset();
            setTimeout(() => { window.location.href = '/contacts'; }, 800);
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
});
