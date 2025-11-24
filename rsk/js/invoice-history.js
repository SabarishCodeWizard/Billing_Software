// invoice-history.js - Invoice history page functionality
document.addEventListener('DOMContentLoaded', async function () {
  await db.waitForInit();
  loadInvoices();

  // Filter functionality with null checks
  const filterBtn = document.getElementById('filterBtn');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const logoutBtn = document.getElementById('logoutBtn');

  if (filterBtn) {
    filterBtn.addEventListener('click', loadInvoices);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('isLoggedIn');
      window.location.href = 'login.html';
    });
  }

  // Modal close buttons
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function () {
      this.closest('.modal').style.display = 'none';
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
});

async function loadInvoices() {
  try {
    const invoices = await db.getInvoices();
    const filteredInvoices = filterInvoices(invoices);
    displayInvoices(filteredInvoices);
  } catch (error) {
    console.error('Error loading invoices:', error);
    alert('Error loading invoices. Please try again.');
  }
}

function filterInvoices(invoices) {
  const searchInput = document.getElementById('searchInput');
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const dateFrom = dateFromInput ? dateFromInput.value : '';
  const dateTo = dateToInput ? dateToInput.value : '';

  return invoices.filter(invoice => {
    // Search filter
    const matchesSearch = !searchTerm ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
      invoice.customerName.toLowerCase().includes(searchTerm) ||
      invoice.customerPhone.includes(searchTerm);

    // Date filter
    const invoiceDate = new Date(invoice.date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const matchesDate = (!fromDate || invoiceDate >= fromDate) &&
      (!toDate || invoiceDate <= toDate);

    return matchesSearch && matchesDate;
  });
}

function displayInvoices(invoices) {
  const invoiceList = document.getElementById('invoiceList');

  if (!invoiceList) {
    console.error('Invoice list container not found');
    return;
  }

  if (invoices.length === 0) {
    invoiceList.innerHTML = '<p>No invoices found.</p>';
    return;
  }

  invoiceList.innerHTML = invoices.map(invoice => `
        <div class="invoice-card">
            <div class="invoice-header">
                <h3>Invoice #${invoice.invoiceNumber}</h3>
                <span class="invoice-date">${Utils.formatDate(invoice.date)}</span>
            </div>
            <div class="invoice-details">
                <p><strong>Customer:</strong> ${invoice.customerName}</p>
                <p><strong>Phone:</strong> ${invoice.customerPhone}</p>
                <p><strong>Amount:</strong> ₹${Utils.formatCurrency(invoice.grandTotal)}</p>
            </div>
            <div class="invoice-actions">
                <button class="btn-view" onclick="viewInvoice('${invoice.id}')">View</button>
                <button class="btn-edit" onclick="editInvoice('${invoice.id}')">Edit</button>
                <button class="btn-share" onclick="shareInvoice('${invoice.id}')">Share</button>
                <button class="btn-delete" onclick="confirmDelete('${invoice.id}', '${invoice.invoiceNumber}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function clearFilters() {
  const searchInput = document.getElementById('searchInput');
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');

  if (searchInput) searchInput.value = '';
  if (dateFromInput) dateFromInput.value = '';
  if (dateToInput) dateToInput.value = '';
  
  loadInvoices();
}

let currentViewModal = null;

async function viewInvoice(id) {
  try {
    const invoice = await db.getInvoiceByNumber(id);
    if (!invoice) {
      // If not found by number, try by ID
      const allInvoices = await db.getInvoices();
      const foundInvoice = allInvoices.find(inv => inv.id === id);
      if (!foundInvoice) {
        throw new Error('Invoice not found');
      }
      showInvoiceModal(foundInvoice);
    } else {
      showInvoiceModal(invoice);
    }
  } catch (error) {
    console.error('Error viewing invoice:', error);
    alert('Error loading invoice details. Please try again.');
  }
}

function showInvoiceModal(invoice) {
  // Remove existing modal if any
  if (currentViewModal) {
    currentViewModal.remove();
  }

  // Create modal element
  const modal = document.createElement('div');
  modal.className = 'modal invoice-view-modal';
  modal.innerHTML = generateInvoiceModalHTML(invoice);

  document.body.appendChild(modal);
  currentViewModal = modal;

  // Show modal
  modal.style.display = 'block';

  // Add close functionality
  const closeBtn = modal.querySelector('.close-invoice-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeInvoiceModal);
  }

  // Close when clicking outside
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeInvoiceModal();
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && currentViewModal) {
      closeInvoiceModal();
    }
  });
}

function closeInvoiceModal() {
  if (currentViewModal) {
    currentViewModal.remove();
    currentViewModal = null;
  }
}

function generateInvoiceModalHTML(invoice) {
  return `
        <div class="modal-content invoice-modal-content">
            <div class="invoice-modal-header">
                <h2>Invoice #${invoice.invoiceNumber}</h2>
                <button class="close-invoice-modal">&times;</button>
            </div>
            <div class="invoice-modal-body">
                <div class="invoice-section">
                    <h3>Invoice Details</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Invoice Date:</label>
                            <span>${Utils.formatDate(invoice.date)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Supply Date:</label>
                            <span>${Utils.formatDate(invoice.supplyDate)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Transport:</label>
                            <span>${invoice.transportMode || 'N/A'} ${invoice.vehicleNumber ? `(${invoice.vehicleNumber})` : ''}</span>
                        </div>
                        <div class="detail-item">
                            <label>Place of Supply:</label>
                            <span>${invoice.placeOfSupply || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-section">
                    <h3>Customer Details</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Name:</label>
                            <span>${invoice.customerName}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${invoice.customerPhone}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>Address:</label>
                            <span>${invoice.customerAddress}</span>
                        </div>
                        <div class="detail-item">
                            <label>State:</label>
                            <span>${invoice.state} (Code: ${invoice.stateCode})</span>
                        </div>
                        <div class="detail-item">
                            <label>GSTIN:</label>
                            <span>${invoice.customerGSTIN || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-section">
                    <h3>Products & Services</h3>
                    <table class="invoice-products-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>HSN Code</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.products.map(product => `
                                <tr>
                                    <td>${product.description}</td>
                                    <td>${product.hsnCode || 'N/A'}</td>
                                    <td>${product.qty}</td>
                                    <td>₹${Utils.formatCurrency(product.rate)}</td>
                                    <td>₹${Utils.formatCurrency(product.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="invoice-section">
                    <h3>Tax Calculation</h3>
                    <div class="tax-calculation-grid">
                        <div class="tax-row">
                            <label>Sub Total:</label>
                            <span>₹${Utils.formatCurrency(invoice.subTotal)}</span>
                        </div>
                        ${invoice.cgstRate > 0 ? `
                        <div class="tax-row">
                            <label>CGST (${invoice.cgstRate}%):</label>
                            <span>₹${Utils.formatCurrency(invoice.cgstAmount)}</span>
                        </div>
                        ` : ''}
                        ${invoice.sgstRate > 0 ? `
                        <div class="tax-row">
                            <label>SGST (${invoice.sgstRate}%):</label>
                            <span>₹${Utils.formatCurrency(invoice.sgstAmount)}</span>
                        </div>
                        ` : ''}
                        ${invoice.igstRate > 0 ? `
                        <div class="tax-row">
                            <label>IGST (${invoice.igstRate}%):</label>
                            <span>₹${Utils.formatCurrency(invoice.igstAmount)}</span>
                        </div>
                        ` : ''}
                        <div class="tax-row">
                            <label>Total Tax Amount:</label>
                            <span>₹${Utils.formatCurrency(invoice.totalTaxAmount)}</span>
                        </div>
                        <div class="tax-row">
                            <label>Round Off:</label>
                            <span>₹${Utils.formatCurrency(invoice.roundOff)}</span>
                        </div>
                        <div class="tax-row grand-total">
                            <label>Grand Total:</label>
                            <span>₹${Utils.formatCurrency(invoice.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-section">
                    <h3>Amount in Words</h3>
                    <div class="amount-words">
                        ${invoice.amountInWords}
                    </div>
                </div>

                <div class="invoice-section">
                    <h3>Bank Details</h3>
                    <div class="bank-details-grid">
                        <div class="bank-item">
                            <label>Account Name:</label>
                            <span>RSK ENTERPRISES</span>
                        </div>
                        <div class="bank-item">
                            <label>Bank Name:</label>
                            <span>CANARA BANK</span>
                        </div>
                        <div class="bank-item">
                            <label>Account Number:</label>
                            <span>120033201829</span>
                        </div>
                        <div class="bank-item">
                            <label>IFSC Code:</label>
                            <span>CNRBOO16563</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="invoice-modal-footer">
                <button class="btn-print" onclick="printInvoice('${invoice.id}')">Print</button>
                <button class="btn-close" onclick="closeInvoiceModal()">Close</button>
            </div>
        </div>
    `;
}

function printInvoice(invoiceId) {
  // You can implement print functionality here
  window.print();
}

function editInvoice(id) {
  // Navigate to main page with edit parameter
  window.location.href = `index.html?edit=${id}`;
}

function confirmDelete(id, invoiceNumber) {
    const modal = document.getElementById('deleteModal');
    if (!modal) {
        console.error('Delete modal not found');
        return;
    }

    const invoiceToDelete = document.getElementById('invoiceToDelete');
    const confirmInput = document.getElementById('confirmInvoiceNumber');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');

    if (!invoiceToDelete || !confirmInput || !confirmBtn || !cancelBtn) {
        console.error('Delete modal elements not found');
        return;
    }

    invoiceToDelete.textContent = invoiceNumber;
    confirmInput.value = '';
    modal.style.display = 'block';

    // Enable/disable button based on input
    function validateInput() {
        const enteredNumber = confirmInput.value.trim();
        const isValid = enteredNumber === invoiceNumber;
        
        confirmBtn.disabled = !isValid;
        
        if (enteredNumber && !isValid) {
            confirmInput.classList.add('error');
        } else {
            confirmInput.classList.remove('error');
        }
    }

    // Real-time validation
    confirmInput.addEventListener('input', validateInput);
    
    // Enter key support
    confirmInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !confirmBtn.disabled) {
            deleteInvoice(id);
        }
    });

    // Set up delete confirmation
    confirmBtn.onclick = function () {
        if (!confirmBtn.disabled) {
            deleteInvoice(id);
        }
    };

    cancelBtn.onclick = function () {
        modal.style.display = 'none';
    };

    // Focus on input field
    setTimeout(() => {
        confirmInput.focus();
    }, 100);
}

async function deleteInvoice(id) {
    try {
        // Get the invoice first to save to recycle bin
        const allInvoices = await db.getInvoices();
        const invoice = allInvoices.find(inv => inv.id === id);
        
        if (invoice) {
            // Add to recycle bin
            await db.addToRecycleBin(invoice, 'invoice');
            
            // Delete from main collection
            await db.deleteInvoice(id);
        }
        
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }
        
        // Show temporary success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Invoice successfully moved to Recycle Bin';
        successMsg.style.position = 'fixed';
        successMsg.style.top = '20px';
        successMsg.style.right = '20px';
        successMsg.style.zIndex = '1000';
        successMsg.style.padding = '15px 20px';
        successMsg.style.borderRadius = '6px';
        successMsg.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        document.body.appendChild(successMsg);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.parentNode.removeChild(successMsg);
            }
        }, 3000);
        
        loadInvoices();
    } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error moving invoice to recycle bin. Please try again.');
    }
}

async function shareInvoice(id) {
    try {
        const allInvoices = await db.getInvoices();
        const invoice = allInvoices.find(inv => inv.id === id);
        
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        
        showShareModal(invoice);
    } catch (error) {
        console.error('Error sharing invoice:', error);
        alert('Error sharing invoice. Please try again.');
    }
}

function showShareModal(invoice) {
    // Remove existing modal if any
    const existingModal = document.getElementById('shareInvoiceModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'shareInvoiceModal';
    modal.className = 'modal share-invoice-modal';
    modal.innerHTML = generateShareModalHTML(invoice);

    document.body.appendChild(modal);

    // Show modal
    modal.style.display = 'block';

    // Add event listeners
    const closeBtn = modal.querySelector('.close-share-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeShareModal);
    }

    // Share option buttons
    const shareProfessionalBtn = modal.querySelector('#shareProfessional');
    const shareSimpleBtn = modal.querySelector('#shareSimple');

    if (shareProfessionalBtn) {
        shareProfessionalBtn.addEventListener('click', function() {
            Utils.shareCompleteInvoice(invoice);
            closeShareModal();
        });
    }

    if (shareSimpleBtn) {
        shareSimpleBtn.addEventListener('click', function() {
            const simpleMessage = Utils.generateSimpleInvoiceMessage(invoice);
            Utils.shareOnWhatsApp(invoice.customerPhone, simpleMessage);
            closeShareModal();
        });
    }

    // Close when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeShareModal();
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal) {
            closeShareModal();
        }
    });
}

function closeShareModal() {
    const modal = document.getElementById('shareInvoiceModal');
    if (modal) {
        modal.remove();
    }
}

function generateShareModalHTML(invoice) {
    return `
        <div class="modal-content share-modal-content">
            <div class="share-modal-header">
                <h2>Share Invoice</h2>
                <button class="close-share-modal">&times;</button>
            </div>
            <div class="share-modal-body">
                <div class="share-preview">
                    <div class="preview-header">
                        <h4>#${invoice.invoiceNumber}</h4>
                        <span class="preview-date">${Utils.formatDate(invoice.date)}</span>
                    </div>
                    <div class="preview-customer">
                        <p><strong>${invoice.customerName}</strong></p>
                        <p>₹${Utils.formatCurrency(invoice.grandTotal)}</p>
                    </div>
                </div>

                <div class="share-options">
                    <div class="share-option-card" data-option="professional">
                        <div class="option-header">
                            <i class="fas fa-file-invoice"></i>
                            <div class="option-info">
                                <h5>Professional</h5>
                                <p>Complete details with taxes</p>
                            </div>
                        </div>
                        <ul class="option-features">
                            <li><i class="fas fa-check"></i> Full business info</li>
                            <li><i class="fas fa-check"></i> Tax breakdown</li>
                            <li><i class="fas fa-check"></i> Bank details</li>
                        </ul>
                        <button id="shareProfessional" class="btn-share-option">
                            <i class="fab fa-whatsapp"></i> Share
                        </button>
                    </div>

                    <div class="share-option-card" data-option="simple">
                        <div class="option-header">
                            <i class="fas fa-mobile-alt"></i>
                            <div class="option-info">
                                <h5>Simple</h5>
                                <p>Quick mobile summary</p>
                            </div>
                        </div>
                        <ul class="option-features">
                            <li><i class="fas fa-check"></i> Essential info</li>
                            <li><i class="fas fa-check"></i> Mobile optimized</li>
                            <li><i class="fas fa-check"></i> Fast loading</li>
                        </ul>
                        <button id="shareSimple" class="btn-share-option">
                            <i class="fab fa-whatsapp"></i> Share
                        </button>
                    </div>
                </div>

                <div class="share-info">
                    <i class="fas fa-info-circle"></i>
                    <p>Sharing with: <strong>${invoice.customerName}</strong> (${invoice.customerPhone})</p>
                </div>
            </div>
        </div>
    `;
}