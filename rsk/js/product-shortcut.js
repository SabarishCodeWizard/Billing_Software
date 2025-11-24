// product-shortcut.js - Updated with professional modals and edit functionality
let currentShortcutKey = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', async function () {
    await db.waitForInit();
    loadShortcuts();
    setupEventListeners();
});

function setupEventListeners() {
    // Form submission
    const shortcutForm = document.getElementById('shortcutForm');
    if (shortcutForm) {
        shortcutForm.addEventListener('submit', saveShortcut);
    }
    
    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancelEdit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', cancelEdit);
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
        if (currentShortcutKey) {
            await performDeleteShortcut(currentShortcutKey);
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
    currentShortcutKey = null;
}

async function loadShortcuts() {
    try {
        const shortcuts = await db.getProducts();
        displayShortcuts(shortcuts);
    } catch (error) {
        console.error('Error loading shortcuts:', error);
        showSuccessModal('Error', 'Error loading shortcuts. Please try again.', 'error');
    }
}

function displayShortcuts(shortcuts) {
    const container = document.getElementById('shortcutsContainer');
    if (!container) return;

    if (shortcuts.length === 0) {
        container.innerHTML = '<p>No shortcuts found. Add your first shortcut above.</p>';
        return;
    }

    container.innerHTML = shortcuts.map(shortcut => `
        <div class="shortcut-card">
            <div class="shortcut-info">
                <strong>${shortcut.shortcut}</strong> → ${shortcut.description}
            </div>
            <div class="shortcut-actions">
                <button class="btn-edit" onclick="editShortcut('${shortcut.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="showDeleteModal('${shortcut.id}', '${shortcut.shortcut}', '${shortcut.description.replace(/'/g, "\\'")}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function saveShortcut(e) {
    e.preventDefault();

    const shortcutInput = document.getElementById('shortcut');
    const descriptionInput = document.getElementById('description');

    if (!shortcutInput || !descriptionInput) return;

    const shortcut = {
        shortcut: shortcutInput.value.trim(),
        description: descriptionInput.value.trim()
    };

    if (!shortcut.shortcut || !shortcut.description) {
        showSuccessModal('Error', 'Please fill in both fields.', 'error');
        return;
    }

    try {
        if (isEditing) {
            // Update existing shortcut
            const editShortcutId = document.getElementById('editShortcutId');
            if (!editShortcutId) return;

            const shortcutId = editShortcutId.value;
            await db.updateProduct(shortcutId, shortcut);
            showSuccessModal('Success', 'Shortcut updated successfully!', 'success');
            cancelEdit();
        } else {
            // Check if shortcut already exists
            const existingShortcuts = await db.getProducts();
            const duplicate = existingShortcuts.find(s => s.shortcut === shortcut.shortcut);
            
            if (duplicate) {
                showSuccessModal('Error', 'Shortcut already exists. Please use a different shortcut key.', 'error');
                return;
            }
            
            // Add new shortcut
            await db.addProduct(shortcut);
            showSuccessModal('Success', 'Shortcut saved successfully!', 'success');
            const shortcutForm = document.getElementById('shortcutForm');
            if (shortcutForm) shortcutForm.reset();
        }
        
        loadShortcuts();
    } catch (error) {
        console.error('Error saving shortcut:', error);
        showSuccessModal('Error', 'Error saving shortcut. Please try again.', 'error');
    }
}

async function editShortcut(shortcutId) {
    try {
        const products = await db.getProducts();
        const shortcut = products.find(p => p.id === shortcutId);
        
        if (shortcut) {
            isEditing = true;
            
            const editShortcutId = document.getElementById('editShortcutId');
            const shortcutInput = document.getElementById('shortcut');
            const descriptionInput = document.getElementById('description');
            const formTitle = document.getElementById('formTitle');
            const submitBtn = document.getElementById('submitBtn');
            const cancelEditBtn = document.getElementById('cancelEdit');
            
            if (editShortcutId) editShortcutId.value = shortcut.id;
            if (shortcutInput) shortcutInput.value = shortcut.shortcut;
            if (descriptionInput) descriptionInput.value = shortcut.description;
            if (formTitle) formTitle.textContent = 'Edit Shortcut';
            if (submitBtn) submitBtn.textContent = 'Update Shortcut';
            if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
            
            if (shortcutInput) shortcutInput.focus();
        } else {
            showSuccessModal('Error', 'Shortcut not found.', 'error');
        }
    } catch (error) {
        console.error('Error loading shortcut:', error);
        showSuccessModal('Error', 'Error loading shortcut data.', 'error');
    }
}

function cancelEdit() {
    isEditing = false;
    
    const editShortcutId = document.getElementById('editShortcutId');
    const shortcutForm = document.getElementById('shortcutForm');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelEditBtn = document.getElementById('cancelEdit');
    
    if (editShortcutId) editShortcutId.value = '';
    if (shortcutForm) shortcutForm.reset();
    if (formTitle) formTitle.textContent = 'Add New Shortcut';
    if (submitBtn) submitBtn.textContent = 'Add Shortcut';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
}

function showDeleteModal(shortcutId, shortcutKey, description) {
    currentShortcutKey = shortcutId;
    
    const deleteShortcutKey = document.getElementById('deleteShortcutKey');
    const deleteShortcutDesc = document.getElementById('deleteShortcutDesc');
    const modal = document.getElementById('deleteModal');
    
    if (!deleteShortcutKey || !deleteShortcutDesc || !modal) return;
    
    // Populate modal with shortcut data
    deleteShortcutKey.textContent = shortcutKey;
    deleteShortcutDesc.textContent = description;
    
    // Show modal
    modal.style.display = 'block';
    
    // Focus on input field
    setTimeout(() => {
        const confirmInput = document.getElementById('deleteConfirmInput');
        if (confirmInput) confirmInput.focus();
    }, 100);
}

async function performDeleteShortcut(shortcutId) {
    try {
        // Get product data first to save to recycle bin
        const products = await db.getProducts();
        const product = products.find(p => p.id === shortcutId);
        
        if (product) {
            // Add to recycle bin
            await db.addToRecycleBin(product, 'product');
            
            // Delete from main collection
            await db.deleteProduct(shortcutId);
        }
        
        loadShortcuts();
        showSuccessToast('Shortcut moved to recycle bin successfully!', 'warning');
    } catch (error) {
        console.error('Error deleting shortcut:', error);
        showSuccessToast('Error deleting shortcut. Please try again.', 'error');
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