// customer-details.js - Updated with professional modals
let currentCustomerPhone = null;

document.addEventListener('DOMContentLoaded', async function () {
    await db.waitForInit();
    loadCustomers();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    const searchCustomer = document.getElementById('searchCustomer');
    if (searchCustomer) {
        searchCustomer.addEventListener('input', loadCustomers);
    }

    // Add customer button
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function () {
            openCustomerModal();
        });
    }

    // Customer form submission
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', saveCustomer);
    }

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            this.closest('.modal').style.display = 'none';
        });
    });

    const cancelCustomer = document.getElementById('cancelCustomer');
    if (cancelCustomer) {
        cancelCustomer.addEventListener('click', function () {
            const customerModal = document.getElementById('customerModal');
            if (customerModal) {
                customerModal.style.display = 'none';
            }
        });
    }

    // Success modal
    const successModalOk = document.getElementById('successModalOk');
    if (successModalOk) {
        successModalOk.addEventListener('click', function() {
            const successModal = document.getElementById('successModal');
            if (successModal) {
                successModal.style.display = 'none';
            }
        });
    }

    // Delete modal events
    setupDeleteModal();

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }
}

function setupDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (!modal) return;

    const confirmInput = document.getElementById('deleteConfirmInput');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');

    if (!confirmInput || !confirmBtn || !cancelBtn) return;

    // Real-time validation
    confirmInput.addEventListener('input', function() {
        const isValid = this.value.trim().toUpperCase() === 'DELETE';
        confirmBtn.disabled = !isValid;
        
        if (this.value && !isValid) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });

    // Enter key support
    confirmInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !confirmBtn.disabled) {
            confirmBtn.click();
        }
    });

    // Confirm delete
    confirmBtn.addEventListener('click', async function() {
        if (currentCustomerPhone) {
            await performDeleteCustomer(currentCustomerPhone);
            modal.style.display = 'none';
            resetDeleteModal();
        }
    });

    // Cancel delete
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        resetDeleteModal();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetDeleteModal();
        }
    });
}

function resetDeleteModal() {
    const confirmInput = document.getElementById('deleteConfirmInput');
    const confirmBtn = document.getElementById('confirmDelete');
    
    if (confirmInput) confirmInput.value = '';
    if (confirmBtn) confirmBtn.disabled = true;
    currentCustomerPhone = null;
}

async function loadCustomers() {
    try {
        const customers = await db.getCustomers();
        const searchCustomer = document.getElementById('searchCustomer');
        const searchTerm = searchCustomer ? searchCustomer.value.toLowerCase() : '';

        const filteredCustomers = customers.filter(customer =>
            !searchTerm ||
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm) ||
            (customer.gstin && customer.gstin.toLowerCase().includes(searchTerm))
        );

        displayCustomers(filteredCustomers);
    } catch (error) {
        console.error('Error loading customers:', error);
        showSuccessModal('Error', 'Error loading customers. Please try again.', 'error');
    }
}

function displayCustomers(customers) {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;

    if (customers.length === 0) {
        customerList.innerHTML = '<p>No customers found.</p>';
        return;
    }

    customerList.innerHTML = customers.map(customer => `
        <div class="customer-card">
            <div class="customer-header">
                <h3>${customer.name}</h3>
                <span class="customer-phone">${customer.phone}</span>
            </div>
            <div class="customer-details">
                <p><strong>Address:</strong> ${customer.address || 'Not provided'}</p>
                <p><strong>GSTIN:</strong> ${customer.gstin || 'Not provided'}</p>
            </div>
            <div class="customer-actions">
                <button class="btn-edit" onclick="editCustomer('${customer.phone}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="showDeleteModal('${customer.phone}', '${customer.name.replace(/'/g, "\\'")}', '${customer.gstin || ''}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openCustomerModal(customer = null) {
    const modal = document.getElementById('customerModal');
    const title = document.getElementById('customerModalTitle');
    const form = document.getElementById('customerForm');

    if (!modal || !title || !form) return;

    if (customer) {
        title.textContent = 'Edit Customer';
        const phoneField = document.getElementById('modalCustomerPhone');
        const nameField = document.getElementById('modalCustomerName');
        const addressField = document.getElementById('modalCustomerAddress');
        const gstinField = document.getElementById('modalCustomerGSTIN');
        
        if (phoneField) phoneField.value = customer.phone;
        if (nameField) nameField.value = customer.name;
        if (addressField) addressField.value = customer.address || '';
        if (gstinField) gstinField.value = customer.gstin || '';

        // Make phone field read-only when editing
        if (phoneField) phoneField.readOnly = true;
    } else {
        title.textContent = 'Add New Customer';
        form.reset();
        const phoneField = document.getElementById('modalCustomerPhone');
        if (phoneField) phoneField.readOnly = false;
    }

    modal.style.display = 'block';
}

async function saveCustomer(e) {
    e.preventDefault();

    const phoneField = document.getElementById('modalCustomerPhone');
    const nameField = document.getElementById('modalCustomerName');
    const addressField = document.getElementById('modalCustomerAddress');
    const gstinField = document.getElementById('modalCustomerGSTIN');

    if (!phoneField || !nameField) return;

    const customer = {
        phone: phoneField.value.trim(),
        name: nameField.value.trim(),
        address: addressField ? addressField.value.trim() : '',
        gstin: gstinField ? gstinField.value.trim() : ''
    };

    if (!Utils.isValidPhone(customer.phone)) {
        showSuccessModal('Error', 'Please enter a valid 10-digit phone number.', 'error');
        return;
    }

    if (!customer.name) {
        showSuccessModal('Error', 'Please enter customer name.', 'error');
        return;
    }

    try {
        // Check if we're editing an existing customer
        const existingCustomer = await db.getCustomerByPhone(customer.phone);
        const isEditing = phoneField ? phoneField.readOnly : false;
        
        if (existingCustomer && isEditing) {
            // Update existing customer
            await db.updateCustomer(existingCustomer.id, customer);
            showSuccessModal('Success', 'Customer updated successfully!', 'success');
        } else if (existingCustomer && !isEditing) {
            // Trying to add customer with existing phone number
            showSuccessModal('Error', 'Customer with this phone number already exists.', 'error');
            return;
        } else {
            // Add new customer
            await db.addCustomer(customer);
            showSuccessModal('Success', 'Customer saved successfully!', 'success');
        }
        
        const customerModal = document.getElementById('customerModal');
        if (customerModal) {
            customerModal.style.display = 'none';
        }
        loadCustomers();
    } catch (error) {
        console.error('Error saving customer:', error);
        showSuccessModal('Error', 'Error saving customer. Please try again.', 'error');
    }
}

async function editCustomer(phone) {
    try {
        const customer = await db.getCustomerByPhone(phone);
        if (customer) {
            openCustomerModal(customer);
        } else {
            showSuccessModal('Error', 'Customer not found.', 'error');
        }
    } catch (error) {
        console.error('Error loading customer:', error);
        showSuccessModal('Error', 'Error loading customer data.', 'error');
    }
}

function showDeleteModal(phone, name, gstin) {
    currentCustomerPhone = phone;
    
    const deleteCustomerName = document.getElementById('deleteCustomerName');
    const deleteCustomerPhone = document.getElementById('deleteCustomerPhone');
    const deleteCustomerGSTIN = document.getElementById('deleteCustomerGSTIN');
    const modal = document.getElementById('deleteModal');
    
    if (!deleteCustomerName || !deleteCustomerPhone || !deleteCustomerGSTIN || !modal) return;
    
    // Populate modal with customer data
    deleteCustomerName.textContent = name;
    deleteCustomerPhone.textContent = phone;
    deleteCustomerGSTIN.textContent = gstin || 'Not provided';
    
    // Show modal
    modal.style.display = 'block';
    
    // Focus on input field
    setTimeout(() => {
        const confirmInput = document.getElementById('deleteConfirmInput');
        if (confirmInput) confirmInput.focus();
    }, 100);
}

async function performDeleteCustomer(phone) {
    try {
        // Get customer data first to save to recycle bin
        const customer = await db.getCustomerByPhone(phone);
        if (customer) {
            // Add to recycle bin
            await db.addToRecycleBin(customer, 'customer');
            
            // Delete from main collection
            await db.deleteCustomer(customer.id);
        }
        
        loadCustomers();
        showSuccessToast('Customer moved to recycle bin successfully!', 'warning');
    } catch (error) {
        console.error('Error deleting customer:', error);
        showSuccessToast('Error deleting customer. Please try again.', 'error');
    }
}

function showSuccessModal(title, message, type = 'success') {
    const successModalTitle = document.getElementById('successModalTitle');
    const successModalMessage = document.getElementById('successModalMessage');
    const modal = document.getElementById('successModal');
    
    if (!successModalTitle || !successModalMessage || !modal) return;
    
    successModalTitle.textContent = title;
    successModalMessage.textContent = message;
    
    const headerIcon = modal.querySelector('.modal-header i');
    
    if (type === 'error') {
        if (headerIcon) headerIcon.className = 'fas fa-exclamation-circle fa-lg';
        modal.className = 'confirmation-modal error-modal';
    } else {
        if (headerIcon) headerIcon.className = 'fas fa-check-circle fa-lg';
        modal.className = 'confirmation-modal success-modal';
    }
    
    modal.style.display = 'block';
}

function showSuccessToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    
    let icon = 'fa-check-circle';
    let bgColor = '#28a745';
    
    if (type === 'error') {
        icon = 'fa-exclamation-circle';
        bgColor = '#dc3545';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-triangle';
        bgColor = '#ffc107';
        toast.style.color = '#212529';
    }
    
    toast.style.background = bgColor;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}