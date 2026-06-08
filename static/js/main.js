document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
});

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

function getInitial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
}

function getContactAvatar(name, size = '') {
    const letter = getInitial(name);
    return `<div class="contact-avatar ${size}">${letter}</div>`;
}

function getCategoryTag(category) {
    if (!category) return '';
    return `<span class="category-tag ${category}">${escapeHtml(category)}</span>`;
}

function emptyState(icon, title, message, actionHtml = '') {
    return `
        <div class="empty-state-box">
            <span class="empty-icon">${icon}</span>
            <h3>${title}</h3>
            <p>${message}</p>
            ${actionHtml}
        </div>
    `;
}

function renderContactCard(contact, showActions = false) {
    const actions = showActions ? `
        <div class="card-actions">
            <button class="btn small secondary" onclick="openEditModal(${contact.id})">Edit</button>
            <button class="btn small danger" onclick="deleteContact(${contact.id})">Delete</button>
        </div>
    ` : '';

    return `
        <div class="contact-card fade-load">
            <div class="contact-card-header">
                ${getContactAvatar(contact.name)}
                <div class="contact-card-info">
                    <h3>${escapeHtml(contact.name)}</h3>
                    ${getCategoryTag(contact.category)}
                </div>
            </div>
            <div class="contact-details">
                <p><span class="detail-label">Phone</span> ${escapeHtml(contact.phone)}</p>
                <p><span class="detail-label">Email</span> ${escapeHtml(contact.email)}</p>
            </div>
            ${actions}
        </div>
    `;
}
