function addPhoneInput() {
    const container = document.querySelector('.phone-inputs');
    const newInput = document.createElement('div');
    newInput.className = 'phone-input-group';
    newInput.innerHTML = `
        <input type="tel" name="phones[]" class="phone-input">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Удалить</button>
    `;
    container.appendChild(newInput);
}

document.addEventListener('DOMContentLoaded', async function() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    if (searchInput) searchInput.addEventListener('input', filterAndSortContacts);
    if (sortSelect) sortSelect.addEventListener('change', filterAndSortContacts);

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
});

async function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const response = await fetch('/add_contact', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const contactsGrid = document.querySelector('.contacts-grid');
            const newContactHtml = `
                <div class="contact-card">
                    <div class="contact-content">
                        <div class="contact-avatar">
                            <img src="${result.contact.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.contact.name)}&background=random`}" 
                                 alt="${result.contact.name}">
                        </div>
                        <div class="contact-info">
                            <h3>${result.contact.name}</h3>
                            <p class="position"><i class="fas fa-briefcase"></i> ${result.contact.position}</p>
                            <p class="department"><i class="fas fa-building"></i> ${result.contact.department}</p>
                            <p class="email"><i class="fas fa-envelope"></i> ${result.contact.email}</p>
                            ${result.contact.phones.map(phone => 
                                `<p class="phone"><i class="fas fa-phone"></i> ${phone}</p>`
                            ).join('')}
                        </div>
                        <div class="contact-actions">
                            <button class="action-btn message-btn" onclick="window.location.href='mailto:${result.contact.email}'">
                                <i class="fas fa-envelope"></i> Написать
                            </button>
                            <button class="action-btn info-btn" onclick="showContactDetails(${result.contact.id})">
                                <i class="fas fa-info-circle"></i> Информация
                            </button>
                        </div>
                    </div>
                </div>`;

            contactsGrid.insertAdjacentHTML('afterbegin', newContactHtml);

            // Очищаем форму и скрываем её
            e.target.reset();
            toggleForm();
        } else {
            alert('Ошибка при добавлении контакта');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при добавлении контакта');
    }
}

function toggleForm() {
    const form = document.getElementById('addContactForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function cancelContactForm() {
    const formContainer = document.getElementById('addContactForm');
    const form = document.getElementById('contactForm');
    if (formContainer && form) {
        formContainer.style.display = 'none';
        form.reset();
    }
}

function filterAndSortContacts() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const contactsGrid = document.querySelector('.contacts-grid');

    if (!searchInput || !sortSelect || !contactsGrid) return;

    const searchValue = searchInput.value.toLowerCase();
    const selectedValue = sortSelect.value;
    const contacts = Array.from(contactsGrid.children);

    contacts.forEach(contact => {
        const name = contact.querySelector('h3').textContent.toLowerCase();
        const departmentElement = contact.querySelector('.department');
        const department = departmentElement ? departmentElement.textContent.toLowerCase() : '';
        
        const shouldShow = name.includes(searchValue) && 
                          (selectedValue === 'name' || 
                           (department.includes(selectedValue.toLowerCase())));
        
        contact.style.display = shouldShow ? '' : 'none';
    });

    contacts.sort((a, b) => {
        if (selectedValue === 'name') {
            const nameA = a.querySelector('h3').textContent.toLowerCase();
            const nameB = b.querySelector('h3').textContent.toLowerCase();
            return nameA.localeCompare(nameB);
        } else {
            const depA = (a.querySelector('.department')?.textContent || '').replace(/['"]/g, '');
            const depB = (b.querySelector('.department')?.textContent || '').replace(/['"]/g, '');
            return depA.localeCompare(depB);
        }
    });

    contactsGrid.innerHTML = '';
    contacts.forEach(contact => contactsGrid.appendChild(contact));
}

async function showContactDetails(contactId) {
    try {
        const response = await fetch(`/contact/${contactId}`);
        const contact = await response.json();

        const modal = document.getElementById('contactDetailsModal');
        const detailsContainer = document.getElementById('contactDetails');

        if (!modal || !detailsContainer) return;

        detailsContainer.innerHTML = `
            <div class="contact-details">
                <div class="contact-details-header">
                    <div class="contact-avatar">
                        <img src="${contact.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`}" 
                             alt="${contact.name}">
                    </div>
                    <div>
                        <h2>${contact.name}</h2>
                        <p class="position">${contact.position}</p>
                    </div>
                </div>
                <div class="contact-details-info">
                    <p><i class="fas fa-envelope"></i> ${contact.email}</p>
                    ${contact.phones.map(phone => 
                        `<p><i class="fas fa-phone"></i> ${phone}</p>`
                    ).join('')}
                    <p><i class="fas fa-building"></i> ${contact.department}</p>
                    <p><i class="fas fa-sticky-note"></i> ${contact.notes || 'Нет заметок'}</p>
                </div>
                <div class="contact-actions">
                    <button class="btn btn-danger" onclick="deleteContact(${contact.id})">
                        <i class="fas fa-trash"></i> Удалить контакт
                    </button>
                </div>
            </div>`;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке деталей контакта');
    }
}

function closeContactDetails() {
    const modal = document.getElementById('contactDetailsModal');
    if (modal) modal.style.display = 'none';
}

async function deleteContact(contactId) {
    if (confirm('Вы уверены, что хотите удалить этот контакт?')) {
        try {
            const response = await fetch(`/contact/${contactId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                location.reload();
            }
        } catch (error) {
            console.error('Ошибка при удалении контакта:', error);
            alert('Ошибка при удалении контакта');
        }
    }
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('contactDetailsModal');
    if (event.target == modal) {
        closeContactDetails();
    }
}