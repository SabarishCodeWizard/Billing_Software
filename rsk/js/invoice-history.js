document.addEventListener('DOMContentLoaded', async function () {
    // Set default dates for search
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('searchDateFrom').value = today;
    document.getElementById('searchDateTo').value = today;

    // Initialize database
    let db;
    try {
        db = await initDB();
        console.log('Database initialized');
        // Load all invoices initially
        searchInvoices();
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }

    // Search button event listener
    document.getElementById('searchInvoices').addEventListener('click', searchInvoices);

    // Database initialization
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PRFabricsInvoicesDB', 1);

            request.onerror = function(event) {
                console.error('Database error:', event.target.error);
                reject('Database error');
            };

            request.onsuccess = function(event) {
                resolve(event.target.result);
            };

            request.onupgradeneeded = function(event) {
                // Create object store if it doesn't exist
                const db = event.target.result;
                if (!db.objectStoreNames.contains('invoices')) {
                    const invoiceStore = db.createObjectStore('invoices', { keyPath: 'invoiceNo' });
                    invoiceStore.createIndex('customerName', 'customerName', { unique: false });
                    invoiceStore.createIndex('invoiceDate', 'invoiceDate', { unique: false });
                }
            };
        });
    }

    // Function to search invoices
    function searchInvoices() {
        const invoiceNo = document.getElementById('searchInvoiceNo').value.trim();
        const customerName = document.getElementById('searchCustomer').value.trim();
        const dateFrom = document.getElementById('searchDateFrom').value;
        const dateTo = document.getElementById('searchDateTo').value;

        const transaction = db.transaction(['invoices'], 'readonly');
        const invoiceStore = transaction.objectStore('invoices');
        
        let request;
        
        if (invoiceNo) {
            // Search by exact invoice number
            request = invoiceStore.get(invoiceNo);
            request.onsuccess = function(event) {
                const result = event.target.result;
                displaySearchResults(result ? [result] : []);
            };
        } else {
            // Search by other criteria
            const results = [];
            let index;
            
            if (customerName) {
                index = invoiceStore.index('customerName');
                request = index.openCursor(IDBKeyRange.only(customerName));
            } else if (dateFrom || dateTo) {
                index = invoiceStore.index('invoiceDate');
                const range = dateFrom && dateTo 
                    ? IDBKeyRange.bound(dateFrom, dateTo)
                    : dateFrom 
                        ? IDBKeyRange.lowerBound(dateFrom)
                        : IDBKeyRange.upperBound(dateTo);
                request = index.openCursor(range);
            } else {
                // Get all invoices if no search criteria
                request = invoiceStore.openCursor();
            }
            
            request.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    displaySearchResults(results);
                }
            };
        }
        
        request.onerror = function(event) {
            console.error('Search error:', event.target.error);
            alert('Error searching invoices');
        };
    }

    // Function to display search results
    function displaySearchResults(invoices) {
        const tbody = document.getElementById('invoiceResultsBody');
        tbody.innerHTML = '';
        
        if (invoices.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" style="text-align: center;">No invoices found matching your criteria</td>';
            tbody.appendChild(row);
            return;
        }
        
        // Sort by date (newest first)
        invoices.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
        
        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoiceNo}</td>
                <td>${formatDate(invoice.invoiceDate)}</td>
                <td>${invoice.customerName}</td>
                <td>₹${parseFloat(invoice.grandTotal).toFixed(2)}</td>
                <td>
                    <button class="view-invoice-btn" data-invoice="${invoice.invoiceNo}">View</button>
                    <button class="remove-invoice-btn" data-invoice="${invoice.invoiceNo}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-invoice-btn').forEach(button => {
            button.addEventListener('click', function() {
                viewInvoice(this.getAttribute('data-invoice'));
            });
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-invoice-btn').forEach(button => {
            button.addEventListener('click', function() {
                deleteInvoice(this.getAttribute('data-invoice'));
            });
        });
    }

    // Function to view an invoice
    function viewInvoice(invoiceNo) {
        // Open in a new tab with the invoice data
        window.open(`index.html?invoice=${invoiceNo}`, '_blank');
    }

    // Function to delete an invoice
    function deleteInvoice(invoiceNo) {
        if (confirm(`Are you sure you want to permanently delete invoice ${invoiceNo}? This action cannot be undone.`)) {
            const transaction = db.transaction(['invoices'], 'readwrite');
            const invoiceStore = transaction.objectStore('invoices');
            const request = invoiceStore.delete(invoiceNo);

            request.onsuccess = function() {
                alert(`Invoice ${invoiceNo} deleted successfully`);
                searchInvoices(); // Refresh the results
            };

            request.onerror = function(event) {
                console.error('Error deleting invoice:', event.target.error);
                alert('Error deleting invoice');
            };
        }
    }

    // Helper function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }
});