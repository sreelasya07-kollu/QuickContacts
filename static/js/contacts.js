let allContacts = [];

document.addEventListener('DOMContentLoaded', () => {
    loadContacts();
    document.getElementById('editContactForm').addEventListener('submit', handleEdit);
    document.getElementById('closeEditModal').addEventListener('click', closeModal);
    document.getElementById('cancelEdit').addEventListener('click', closeModal);
});

async function loadContacts() {
    try {
        allContacts = await apiFetch('/api/contacts');
        renderContacts(allContacts);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderContacts(contacts) {
    const grid = document.getElementById('contactsGrid');
    document.getElementById('contactCount').textContent =
        `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`;

    if (!contacts.length) {
        grid.innerHTML = emptyState(
            '👥',
            'No contacts available',
            'Add your first contact to get started.',
            '<a href="/add" class="btn primary">Add Your First Contact</a>'
        );
        return;
    }

    grid.innerHTML = contacts.map(c => renderContactCard(c, true)).join('');
}

function openEditModal(id) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    document.getElementById('editId').value = contact.id;
    document.getElementById('editName').value = contact.name;
    document.getElementById('editPhone').value = contact.phone;
    document.getElementById('editEmail').value = contact.email;
    document.getElementById('editCategory').value = contact.category || 'Other';
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function handleEdit(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;

    try {
        await apiFetch(`/api/contacts/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: document.getElementById('editName').value.trim(),
                phone: document.getElementById('editPhone').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                category: document.getElementById('editCategory').value,
            }),
        });
        showToast('Contact updated successfully!');
        closeModal();
        loadContacts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
        await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
        showToast('Contact deleted successfully!');
        loadContacts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
