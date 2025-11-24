// recycle-bin.js - Updated with professional modals
let currentItemId = null;
let currentItemType = null;

document.addEventListener('DOMContentLoaded', async function () {
    await db.waitForInit();
    loadRecycleBin();

    // Empty bin button
    const emptyBinBtn = document.getElementById('emptyBin');
    if (emptyBinBtn) {
        emptyBinBtn.addEventListener('click', emptyRecycleBin);
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }

    // Restore modal events
    setupRestoreModal();
    setupDeleteModal();
});

function setupRestoreModal() {
    const modal = document.getElementById('restoreModal');
    if (!modal) return;

    const confirmInput = document.getElementById('restoreConfirmInput');
    const confirmBtn = document.getElementById('confirmRestore');
    const cancelBtn = document.getElementById('cancelRestore');

    if (!confirmInput || !confirmBtn || !cancelBtn) return;

    // Real-time validation
    confirmInput.addEventListener('input', function() {
        const isValid = this.value.trim().toUpperCase() === 'RESTORE';
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

    // Confirm restore
    confirmBtn.addEventListener('click', async function() {
        if (currentItemId && currentItemType) {
            await performRestore(currentItemId, currentItemType);
            modal.style.display = 'none';
            resetModalInputs();
        }
    });

    // Cancel restore
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        resetModalInputs();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetModalInputs();
        }
    });
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
        if (currentItemId) {
            await performPermanentDelete(currentItemId);
            modal.style.display = 'none';
            resetModalInputs();
        }
    });

    // Cancel delete
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        resetModalInputs();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetModalInputs();
        }
    });
}

function resetModalInputs() {
    const restoreInput = document.getElementById('restoreConfirmInput');
    const deleteInput = document.getElementById('deleteConfirmInput');
    const restoreBtn = document.getElementById('confirmRestore');
    const deleteBtn = document.getElementById('confirmDelete');
    
    if (restoreInput) restoreInput.value = '';
    if (deleteInput) deleteInput.value = '';
    if (restoreBtn) restoreBtn.disabled = true;
    if (deleteBtn) deleteBtn.disabled = true;
    currentItemId = null;
    currentItemType = null;
}

async function loadRecycleBin() {
    try {
        const items = await db.getRecycleBinItems();
        displayRecycleBinItems(items);
    } catch (error) {
        console.error('Error loading recycle bin:', error);
        showSuccessToast('Error loading recycle bin. Please try again.', 'error');
    }
}

function displayRecycleBinItems(items) {
    const container = document.getElementById('deletedInvoices');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p>Recycle bin is empty.</p>';
        return;
    }

    container.innerHTML = items.map(item => {
        let title, details, amount;
        
        switch (item.type) {
            case 'invoice':
                title = `Invoice #${item.invoiceNumber}`;
                details = `<p><strong>Customer:</strong> ${item.customerName}</p>
                          <p><strong>Phone:</strong> ${item.customerPhone}</p>`;
                amount = `₹${Utils.formatCurrency(item.grandTotal)}`;
                break;
            case 'customer':
                title = `Customer: ${item.name}`;
                details = `<p><strong>Phone:</strong> ${item.phone}</p>
                          <p><strong>Address:</strong> ${item.address || 'Not provided'}</p>`;
                amount = 'Customer';
                break;
            case 'product':
                title = `Product: ${item.shortcut}`;
                details = `<p><strong>Description:</strong> ${item.description}</p>`;
                amount = 'Product Shortcut';
                break;
            default:
                title = 'Unknown Item';
                details = '';
                amount = '';
        }

        return `
            <div class="deleted-invoice-card">
                <div class="invoice-header">
                    <h3>${title}</h3>
                    <span class="item-type">${item.type}</span>
                </div>
                <div class="invoice-details">
                    ${details}
                    <p><strong>Amount:</strong> ${amount}</p>
                    <p><strong>Deleted on:</strong> ${Utils.formatDate(item.deletedAt?.toDate?.() || item.deletedAt || item.createdAt)}</p>
                </div>
                <div class="invoice-actions">
                    <button class="btn-restore" onclick="showRestoreModal('${item.id}', '${item.type}')">
                        <i class="fas fa-trash-restore"></i> Restore
                    </button>
                    <button class="btn-delete" onclick="showDeleteModal('${item.id}', '${item.type}')">
                        <i class="fas fa-fire-alt"></i> Delete Permanently
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function showRestoreModal(id, type) {
    try {
        const items = await db.getRecycleBinItems();
        const item = items.find(i => i.id === id);
        
        if (!item) {
            showSuccessToast('Item not found in recycle bin.', 'error');
            return;
        }

        currentItemId = id;
        currentItemType = type;
        
        // Populate modal with item data
        let title, details;
        
        switch (type) {
            case 'invoice':
                title = `Invoice #${item.invoiceNumber}`;
                details = `<p><strong>Customer:</strong> ${item.customerName}</p>
                          <p><strong>Amount:</strong> ₹${Utils.formatCurrency(item.grandTotal)}</p>`;
                break;
            case 'customer':
                title = `Customer: ${item.name}`;
                details = `<p><strong>Phone:</strong> ${item.phone}</p>`;
                break;
            case 'product':
                title = `Product: ${item.shortcut}`;
                details = `<p><strong>Description:</strong> ${item.description}</p>`;
                break;
        }

        const restoreInvoiceNumber = document.getElementById('restoreInvoiceNumber');
        const restoreCustomerName = document.getElementById('restoreCustomerName');
        const modal = document.getElementById('restoreModal');
        
        if (!restoreInvoiceNumber || !restoreCustomerName || !modal) return;
        
        restoreInvoiceNumber.textContent = title;
        restoreCustomerName.innerHTML = details;
        
        // Show modal
        modal.style.display = 'block';
        
        // Focus on input field
        setTimeout(() => {
            const confirmInput = document.getElementById('restoreConfirmInput');
            if (confirmInput) confirmInput.focus();
        }, 100);
    } catch (error) {
        console.error('Error showing restore modal:', error);
        showSuccessToast('Error loading item details.', 'error');
    }
}

async function showDeleteModal(id, type) {
    try {
        const items = await db.getRecycleBinItems();
        const item = items.find(i => i.id === id);
        
        if (!item) {
            showSuccessToast('Item not found in recycle bin.', 'error');
            return;
        }

        currentItemId = id;
        currentItemType = type;
        
        // Populate modal with item data
        let title, details;
        
        switch (type) {
            case 'invoice':
                title = `Invoice #${item.invoiceNumber}`;
                details = `<p><strong>Customer:</strong> ${item.customerName}</p>
                          <p><strong>Amount:</strong> ₹${Utils.formatCurrency(item.grandTotal)}</p>`;
                break;
            case 'customer':
                title = `Customer: ${item.name}`;
                details = `<p><strong>Phone:</strong> ${item.phone}</p>`;
                break;
            case 'product':
                title = `Product: ${item.shortcut}`;
                details = `<p><strong>Description:</strong> ${item.description}</p>`;
                break;
        }

        const deleteInvoiceNumber = document.getElementById('deleteInvoiceNumber');
        const deleteCustomerName = document.getElementById('deleteCustomerName');
        const deleteInvoiceDate = document.getElementById('deleteInvoiceDate');
        const modal = document.getElementById('deleteModal');
        
        if (!deleteInvoiceNumber || !deleteCustomerName || !deleteInvoiceDate || !modal) return;
        
        deleteInvoiceNumber.textContent = title;
        deleteCustomerName.innerHTML = details;
        deleteInvoiceDate.textContent = Utils.formatDate(item.deletedAt?.toDate?.() || item.deletedAt || item.createdAt);
        
        // Show modal
        modal.style.display = 'block';
        
        // Focus on input field
        setTimeout(() => {
            const confirmInput = document.getElementById('deleteConfirmInput');
            if (confirmInput) confirmInput.focus();
        }, 100);
    } catch (error) {
        console.error('Error showing delete modal:', error);
        showSuccessToast('Error loading item details.', 'error');
    }
}

async function performRestore(id, type) {
    try {
        console.log('Attempting to restore item:', { id, type });
        await db.restoreFromRecycleBin(id, type);
        loadRecycleBin();
        showSuccessToast('Item restored successfully!', 'success');
    } catch (error) {
        console.error('Error restoring item:', error);
        showSuccessToast('Error restoring item: ' + error.message, 'error');
    }
}

async function performPermanentDelete(id) {
    try {
        console.log('Attempting to delete item:', id);
        await db.permanentDeleteFromRecycleBin(id);
        loadRecycleBin();
        showSuccessToast('Item permanently deleted.', 'warning');
    } catch (error) {
        console.error('Error deleting item:', error);
        showSuccessToast('Error deleting item: ' + error.message, 'error');
    }
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

async function emptyRecycleBin() {
    if (confirm('Are you sure you want to empty the recycle bin? All deleted items will be permanently lost.')) {
        try {
            const items = await db.getRecycleBinItems();
            
            if (items.length === 0) {
                showSuccessToast('Recycle bin is already empty.', 'warning');
                return;
            }
            
            // Delete all items permanently
            for (const item of items) {
                await db.permanentDeleteFromRecycleBin(item.id);
            }
            
            loadRecycleBin();
            showSuccessToast('Recycle bin emptied successfully!', 'warning');
        } catch (error) {
            console.error('Error emptying recycle bin:', error);
            showSuccessToast('Error emptying recycle bin: ' + error.message, 'error');
        }
    }
}