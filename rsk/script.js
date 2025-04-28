document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default for invoice and supply date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    document.getElementById('supplyDate').value = today;

    // Add product row
    document.getElementById('addProductBtn').addEventListener('click', addProductRow);
    
    // Remove product row
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-btn')) {
            e.target.closest('tr').remove();
            updateSerialNumbers();
            calculateTotals();
        }
    });
    
    // Calculate totals when any product field changes
    document.getElementById('productTable').addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity') || e.target.classList.contains('rate')) {
            calculateRowAmount(e.target.closest('tr'));
            calculateTotals();
        }
    });
    
    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculateTotals);
    
    // Reset form
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Generate PDF
    document.getElementById('generatePdfBtn').addEventListener('click', generatePDF);
    
    // Initialize with one product row
    addProductRow();
});

function addProductRow() {
    const tbody = document.querySelector('#productTable tbody');
    const rowCount = tbody.rows.length;
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${rowCount + 1}</td>
        <td><input type="text" class="product-desc" placeholder="Product description"></td>
        <td><input type="text" class="hsn-code" placeholder="HSN code"></td>
        <td><input type="number" class="quantity" min="1" value="1"></td>
        <td><input type="number" class="rate" min="0" step="0.01" value="0"></td>
        <td><span class="amount">0.00</span></td>
        <td><button class="remove-btn">Remove</button></td>
    `;
    
    tbody.appendChild(newRow);
}

function updateSerialNumbers() {
    const rows = document.querySelectorAll('#productTable tbody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
}

function calculateRowAmount(row) {
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const rate = parseFloat(row.querySelector('.rate').value) || 0;
    const amount = quantity * rate;
    row.querySelector('.amount').textContent = amount.toFixed(2);
}

function calculateTotals() {
    const rows = document.querySelectorAll('#productTable tbody tr');
    let taxableValue = 0;
    
    // Calculate total amount from all products
    rows.forEach(row => {
        calculateRowAmount(row);
        taxableValue += parseFloat(row.querySelector('.amount').textContent) || 0;
    });
    
    // Calculate taxes
    const cgst = taxableValue * 0.025;
    const sgst = taxableValue * 0.025;
    const totalTax = cgst + sgst;
    const grandTotal = taxableValue + totalTax;
    const roundedTotal = Math.round(grandTotal);
    const roundOff = roundedTotal - grandTotal;
    
    // Update the UI
    document.getElementById('taxableValue').value = taxableValue.toFixed(2);
    document.getElementById('cgst').value = cgst.toFixed(2);
    document.getElementById('sgst').value = sgst.toFixed(2);
    document.getElementById('totalTax').value = totalTax.toFixed(2);
    document.getElementById('grandTotal').value = roundedTotal.toFixed(2);
    document.getElementById('roundOff').value = roundOff.toFixed(2);
}

function resetForm() {
    if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
        document.querySelector('form').reset();
        const tbody = document.querySelector('#productTable tbody');
        tbody.innerHTML = '';
        addProductRow();
        
        // Reset calculated fields
        document.getElementById('taxableValue').value = '';
        document.getElementById('cgst').value = '';
        document.getElementById('sgst').value = '';
        document.getElementById('totalTax').value = '';
        document.getElementById('grandTotal').value = '';
        document.getElementById('roundOff').value = '';
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;
        document.getElementById('supplyDate').value = today;
    }
}

function generatePDF() {
    // First calculate totals to ensure all values are up to date
    calculateTotals();
    
    // Check if jsPDF is available
    if (typeof jsPDF !== 'function') {
        alert('PDF library not loaded. Please try again.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add company header
    doc.setFontSize(16);
    doc.text('PR FABRICS', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('42/65,THIRUNEELAKANDA PURAM, 1ST STREET, TIRUPUR 641-602', 105, 22, { align: 'center' });
    doc.text('CELL NO: 9952520181 | GSTIN: 33CLJPG4331G1ZG', 105, 28, { align: 'center' });
    
    // Add tax invoice title
    doc.setFontSize(14);
    doc.text('TAX INVOICE', 105, 38, { align: 'center' });
    
    // Add invoice details
    doc.setFontSize(10);
    doc.text(`Invoice No: ${document.getElementById('invoiceNumber').value || '---'}`, 15, 45);
    doc.text(`Invoice Date: ${formatDate(document.getElementById('invoiceDate').value)}`, 15, 52);
    doc.text(`Date of Supply: ${formatDate(document.getElementById('supplyDate').value)}`, 15, 59);
    doc.text(`Reverse Charge: ${document.getElementById('reverseCharge').value}`, 15, 66);
    
    doc.text(`Transport Mode: ${document.getElementById('transportMode').value || '---'}`, 105, 45);
    doc.text(`Vehicle number: ${document.getElementById('vehicleNumber').value || '---'}`, 105, 52);
    doc.text(`State: ${document.getElementById('customerState').value || 'TAMILNADU'}`, 105, 59);
    doc.text(`Place of Supply: ${document.getElementById('customerState').value || 'TAMILNADU'}`, 105, 66);
    
    // Add customer details
    doc.setFontSize(10);
    doc.text('Bill to Party:', 15, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(`${document.getElementById('customerName').value || '---'}`, 15, 86);
    doc.setFont('helvetica', 'normal');
    doc.text(`${document.getElementById('customerAddress').value || '---'}`, 15, 92);
    doc.text(`State: ${document.getElementById('customerState').value || 'TAMILNADU'}`, 15, 98);
    doc.text(`GSTIN: ${document.getElementById('customerGST').value || '---'}`, 15, 104);
    
    // Add product table
    const headers = [["S.No.", "Product Description", "HSN Code", "Qty", "Rate", "Amount"]];
    const rows = [];
    
    document.querySelectorAll('#productTable tbody tr').forEach(row => {
        rows.push([
            row.cells[0].textContent,
            row.querySelector('.product-desc').value || '---',
            row.querySelector('.hsn-code').value || '---',
            row.querySelector('.quantity').value || '0',
            parseFloat(row.querySelector('.rate').value || 0).toFixed(2),
            parseFloat(row.querySelector('.amount').textContent || 0).toFixed(2)
        ]);
    });
    
    doc.autoTable({
        startY: 115,
        head: headers,
        body: rows,
        margin: { left: 15 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 152, 219] }
    });
    
    // Add totals
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.text(`Taxable Value: ${document.getElementById('taxableValue').value || '0.00'}`, 140, finalY);
    doc.text(`Add: CGST (2.5%): ${document.getElementById('cgst').value || '0.00'}`, 140, finalY + 6);
    doc.text(`Add: SGST (2.5%): ${document.getElementById('sgst').value || '0.00'}`, 140, finalY + 12);
    doc.text(`Total Tax Amount: ${document.getElementById('totalTax').value || '0.00'}`, 140, finalY + 18);
    doc.text(`Round off: ${document.getElementById('roundOff').value || '0.00'}`, 140, finalY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: ${document.getElementById('grandTotal').value || '0.00'}`, 140, finalY + 30);
    doc.setFont('helvetica', 'normal');
    
    // Add bank details
    doc.text('Bank Details:', 15, finalY);
    doc.text(`Bank Name: ${document.getElementById('bankName').value || 'CANARA BANK'}`, 15, finalY + 6);
    doc.text(`Bank A/C No: ${document.getElementById('accountNumber').value || '65631010003339'}`, 15, finalY + 12);
    doc.text(`Bank IFSC Code: ${document.getElementById('ifscCode').value || 'CNRB0016563'}`, 15, finalY + 18);
    
    // Add terms and signature
    doc.text('**TERMS AND CONDITIONS APPLY', 15, finalY + 30);
    doc.text('Certified that the particulars given above are true and correct', 15, finalY + 36);
    doc.text('Agreed and accepted the conditions and signed', 15, finalY + 42);
    doc.text(`Signature of Customer: ${document.getElementById('signature').value || 'Authorized signatory'}`, 15, finalY + 48);
    
    // Save the PDF
    const invoiceNumber = document.getElementById('invoiceNumber').value || 'invoice';
    doc.save(`PR_Fabrics_Invoice_${invoiceNumber}.pdf`);
}

function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}