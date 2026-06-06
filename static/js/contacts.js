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
    const tbody = document.getElementById('contactsBody');
    document.getElementById('contactCount').textContent =
        `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`;

    if (contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No contacts found</td></tr>';
        return;
    }

    tbody.innerHTML = contacts.map(contact => `
        <tr>
            <td>${contact.id}</td>
            <td><strong>${escapeHtml(contact.name)}</strong></td>
            <td>${escapeHtml(contact.phone)}</td>
            <td>${escapeHtml(contact.email)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn small secondary" onclick="openEditModal(${contact.id})">Edit</button>
                    <button class="btn small danger" onclick="deleteContact(${contact.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openEditModal(id) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    document.getElementById('editId').value = contact.id;
    document.getElementById('editName').value = contact.name;
    document.getElementById('editPhone').value = contact.phone;
    document.getElementById('editEmail').value = contact.email;
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function handleEdit(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const data = {
        name: document.getElementById('editName').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
    };

    try {
        await apiFetch(`/api/contacts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
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
