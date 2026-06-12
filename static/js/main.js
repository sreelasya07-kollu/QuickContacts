const THEME_KEY = 'contacthub-theme';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initThemeToggle();
});

function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (!menuToggle || !sidebar) return;

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

function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    updateThemeToggleLabel(getTheme());

    toggle.addEventListener('click', () => {
        const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        updateThemeToggleLabel(nextTheme);
    });
}

function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.body.classList.add('theme-transition');
    window.setTimeout(() => document.body.classList.remove('theme-transition'), 350);
}

function updateThemeToggleLabel(theme) {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    toggle.setAttribute('data-theme-state', theme);

    const label = toggle.querySelector('.theme-label');
    if (label) {
        label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

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

function getCategoryTag(category) {
    return `<span class="category-tag ${category}">${category}</span>`;
}

function formatDateTime(value) {
    if (!value) return 'No searches yet';
    return value;
}

function formatSearchTime(ms) {
    const value = Number(ms);
    if (!Number.isFinite(value)) return '—';
    if (value === 0) return '0 ms';
    if (value < 0.001) return '< 0.001 ms';
    if (value < 1) return `${value.toFixed(3)} ms`;
    return `${value.toFixed(3)} ms`;
}

function getInitials(name) {
    return (name || '')
        .split(' ')
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';
}

function emptyState(icon, title, description, actionHtml = '') {
    return `
        <div class="empty-state-box">
            <span class="empty-state-icon">${icon}</span>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
            ${actionHtml}
        </div>
    `;
}

function renderContactCard(contact, showActions = false) {
    const actions = showActions ? `
        <div class="card-footer">
            <span class="contact-id">#${contact.id}</span>
            <div class="card-actions">
                <button type="button" class="btn-icon" onclick="openEditModal(${contact.id})" title="Edit">✏️</button>
                <button type="button" class="btn-icon danger" onclick="deleteContact(${contact.id})" title="Delete">🗑️</button>
            </div>
        </div>
    ` : '';

    return `
        <div class="contact-card fade-load">
            <div class="contact-card-header">
                <div class="contact-avatar">${getInitials(contact.name)}</div>
                <div>
                    <h3>${escapeHtml(contact.name)}</h3>
                    ${contact.category ? getCategoryTag(contact.category) : ''}
                </div>
            </div>
            <p>📞 ${escapeHtml(contact.phone)}</p>
            <p>✉️ ${escapeHtml(contact.email)}</p>
            ${actions}
        </div>
    `;
}
