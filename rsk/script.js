document.addEventListener('DOMContentLoaded', function () {
    // Initialize variables
    let items = [];
    let taxes = [];

    // DOM elements
    const itemsTableBody = document.querySelector('#itemsTable tbody');
    const taxTableBody = document.querySelector('#taxTable tbody');
    const addItemBtn = document.getElementById('addItemBtn');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const totalAmountCell = document.getElementById('totalAmount');
    const totalTaxCell = document.getElementById('totalTax');
    const taxInWordsSpan = document.getElementById('taxInWords');

    // Add event listeners
    addItemBtn.addEventListener('click', addNewItemRow);
    generatePdfBtn.addEventListener('click', generatePdf);
    resetFormBtn.addEventListener('click', resetForm);

    // Initialize with one empty item row
    addNewItemRow();

    // Functions
    function addNewItemRow() {
        const newItem = {
            id: Date.now(),
            description: '',
            hsn: '',
            quantity: 1,
            rate: 0,
            per: 'PCS',
            amount: 0
        };

        items.push(newItem);
        renderItemsTable();

        // Focus on the description field of the new row
        const newRow = itemsTableBody.lastElementChild;
        if (newRow) {
            const descInput = newRow.querySelector('.item-desc');
            if (descInput) descInput.focus();
        }
    }

    function renderItemsTable() {
        itemsTableBody.innerHTML = '';

        items.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><input type="text" class="item-desc" value="${item.description}" data-id="${item.id}"></td>
                <td><input type="text" class="item-hsn" value="${item.hsn}" data-id="${item.id}"></td>
                <td><input type="number" class="item-qty" value="${item.quantity}" min="1" data-id="${item.id}"></td>
                <td><input type="number" class="item-rate" value="${item.rate}" min="0" step="0.01" data-id="${item.id}"></td>
                <td>
                    <select class="item-per" data-id="${item.id}">
                        <option value="PCS" ${item.per === 'PCS' ? 'selected' : ''}>PCS</option>
                        <option value="KG" ${item.per === 'KG' ? 'selected' : ''}>KG</option>
                        <option value="METER" ${item.per === 'METER' ? 'selected' : ''}>METER</option>
                        <option value="LTR" ${item.per === 'LTR' ? 'selected' : ''}>LTR</option>
                        <option value="SET" ${item.per === 'SET' ? 'selected' : ''}>SET</option>
                    </select>
                </td>
                <td class="item-amount">${item.amount.toFixed(2)}</td>
                <td><button class="btn remove-item" data-id="${item.id}">Remove</button></td>
            `;

            itemsTableBody.appendChild(row);
        });

        // Add event listeners to inputs
        document.querySelectorAll('.item-desc').forEach(input => {
            input.addEventListener('input', handleItemUpdate);
        });

        document.querySelectorAll('.item-hsn').forEach(input => {
            input.addEventListener('input', handleItemUpdate);
        });

        document.querySelectorAll('.item-qty').forEach(input => {
            input.addEventListener('input', handleItemUpdate);
        });

        document.querySelectorAll('.item-rate').forEach(input => {
            input.addEventListener('input', handleItemUpdate);
        });

        document.querySelectorAll('.item-per').forEach(select => {
            select.addEventListener('change', handleItemUpdate);
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', handleRemoveItem);
        });

        calculateTotals();
    }

    function handleItemUpdate(e) {
        const id = parseInt(e.target.dataset.id);
        const item = items.find(item => item.id === id);

        if (!item) return;

        if (e.target.classList.contains('item-desc')) {
            item.description = e.target.value;
        } else if (e.target.classList.contains('item-hsn')) {
            item.hsn = e.target.value;
        } else if (e.target.classList.contains('item-qty')) {
            item.quantity = parseFloat(e.target.value) || 0;
        } else if (e.target.classList.contains('item-rate')) {
            item.rate = parseFloat(e.target.value) || 0;
        } else if (e.target.classList.contains('item-per')) {
            item.per = e.target.value;
        }

        // Calculate amount
        item.amount = item.quantity * item.rate;

        // Update the amount cell
        const row = e.target.closest('tr');
        if (row) {
            const amountCell = row.querySelector('.item-amount');
            if (amountCell) {
                amountCell.textContent = item.amount.toFixed(2);
            }
        }

        calculateTotals();
    }

    function handleRemoveItem(e) {
        const id = parseInt(e.target.dataset.id);
        items = items.filter(item => item.id !== id);
        renderItemsTable();
    }

    function calculateTotals() {
        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
        totalAmountCell.textContent = totalAmount.toFixed(2);

        // Calculate taxes (simplified - you can add more complex tax calculations)
        taxes = [];

        // Group by HSN code and calculate tax
        const hsnGroups = {};
        items.forEach(item => {
            if (!hsnGroups[item.hsn]) {
                hsnGroups[item.hsn] = {
                    hsn: item.hsn,
                    taxableValue: 0,
                    cgstRate: 9, // Default CGST rate (9%)
                    sgstRate: 9, // Default SGST rate (9%)
                    cgstAmount: 0,
                    sgstAmount: 0
                };
            }
            hsnGroups[item.hsn].taxableValue += item.amount;
        });

        // Calculate tax amounts
        for (const hsn in hsnGroups) {
            const group = hsnGroups[hsn];
            group.cgstAmount = group.taxableValue * (group.cgstRate / 100);
            group.sgstAmount = group.taxableValue * (group.sgstRate / 100);
            taxes.push(group);
        }

        // Calculate grand total (amount + tax)
        const totalTax = taxes.reduce((sum, tax) => sum + tax.cgstAmount + tax.sgstAmount, 0);
        const grandTotal = totalAmount + totalTax;

        renderTaxTable();

        // Update the total amount in the items table to show grand total
        totalAmountCell.textContent = grandTotal.toFixed(2);

        // Update the amount in words to show grand total (changed from taxInWordsSpan)
        taxInWordsSpan.textContent = numberToWords(grandTotal) + ' Only';
    }

    function renderTaxTable() {
        taxTableBody.innerHTML = '';

        taxes.forEach(tax => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tax.hsn || '-'}</td>
                <td>${tax.taxableValue.toFixed(2)}</td>
                <td>${tax.cgstRate}%<br>${tax.cgstAmount.toFixed(2)}</td>
                <td>${tax.sgstRate}%<br>${tax.sgstAmount.toFixed(2)}</td>
                <td>${(tax.cgstAmount + tax.sgstAmount).toFixed(2)}</td>
            `;
            taxTableBody.appendChild(row);
        });

        // Calculate total tax
        const totalTax = taxes.reduce((sum, tax) => sum + tax.cgstAmount + tax.sgstAmount, 0);
        totalTaxCell.textContent = totalTax.toFixed(2);


        // Update tax in words
        taxInWordsSpan.textContent = numberToWords(totalTax) + ' Only';
    }
    function numberToWords(inputNum) {
        // Simplified number to words conversion
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
        let num = parseFloat(inputNum) || 0;
        let rupees = Math.floor(num);  // Changed from const to let
        const paise = Math.round((num - rupees) * 100);
    
        let words = 'INR ';
    
        if (rupees === 0) {
            words += 'Zero';
        } else {
            if (rupees >= 10000000) {
                const crores = Math.floor(rupees / 10000000);
                words += units[crores] + ' Crore ';
                rupees %= 10000000;
            }
            if (rupees >= 100000) {
                const lakhs = Math.floor(rupees / 100000);
                words += (lakhs >= 20 ? tens[Math.floor(lakhs / 10)] + ' ' + units[lakhs % 10] : (lakhs >= 10 ? teens[lakhs - 10] : units[lakhs])) + ' Lakh ';
                rupees %= 100000;
            }

            if (rupees >= 1000) {
                const thousands = Math.floor(rupees / 1000);
                words += (thousands >= 20 ? tens[Math.floor(thousands / 10)] + ' ' + units[thousands % 10] : (thousands >= 10 ? teens[thousands - 10] : units[thousands])) + ' Thousand ';
                rupees %= 1000;
            }

            if (rupees >= 100) {
                const hundreds = Math.floor(rupees / 100);
                words += units[hundreds] + ' Hundred ';
                rupees %= 100;
            }

            if (rupees > 0) {
                if (rupees >= 20) {
                    words += tens[Math.floor(rupees / 10)] + ' ' + units[rupees % 10];
                } else if (rupees >= 10) {
                    words += teens[rupees - 10];
                } else {
                    words += units[rupees];
                }
            }
        }

        if (paise > 0) {
            words += ' and ';
            if (paise >= 20) {
                words += tens[Math.floor(paise / 10)] + ' ' + units[paise % 10];
            } else if (paise >= 10) {
                words += teens[paise - 10];
            } else {
                words += units[paise];
            }
            words += ' Paise';
        }

        return words;
    }

    function generatePdf() {
        // Get all form values
        const invoiceNo = document.getElementById('invoiceNo').value;
        const invoiceDate = document.getElementById('invoiceDate').value;
        const deliveryNote = document.getElementById('deliveryNote').value;
        const modeTel = document.getElementById('modeTel').value;
        const consigneeName = document.getElementById('consigneeName').value;
        const consigneeContact = document.getElementById('consigneeContact').value;
        const consigneeAddress = document.getElementById('consigneeAddress').value;
        const consigneePhone = document.getElementById('consigneePhone').value;
        const consigneeGST = document.getElementById('consigneeGST').value;
        const bankName = document.getElementById('bankName').value;
        const accountNo = document.getElementById('accountNo').value;
        const branchIFSC = document.getElementById('branchIFSC').value;
        const declaration = document.getElementById('declaration').value;

        const totalAmount = parseFloat(totalAmountCell.textContent) || 0;
        const totalTax = parseFloat(totalTaxCell.textContent) || 0;
        const grandTotal = totalAmount + totalTax;

        // Format date
        const formattedDate = formatDate(invoiceDate);

        // Create HTML for PDF
        const pdfContent = `
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.5; }
                .invoice-header { text-align: center; margin-bottom: 20px; }
                .invoice-title { font-size: 24px; font-weight: bold; }
                .invoice-details { margin-bottom: 20px; }
                .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 8px; }
                .invoice-table th { background-color: #f2f2f2; text-align: left; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .signature { margin-top: 50px; }
                .footer { margin-top: 30px; font-size: 12px; }
            </style>
            
            <div class="invoice-header">
                <div class="invoice-title">R.S.K ENTERPRISES</div>
                <div>76(3) Padmavathipuram, Angeripalayam Road, Tiruppur-641603</div>
                <div>GSTIN/UIN: 33EQEPR2516A12B | State Name : Tamil Nadu, Code : 33</div>
                <div>E-Mail : rskenterprises@gmail.com</div>
            </div>
            
            <table class="invoice-details">
                <tr>
                    <td width="50%">
                        <strong>Invoice No:</strong> ${invoiceNo}<br>
                        <strong>Dated:</strong> ${formattedDate}<br>
                        <strong>Delivery Note:</strong> ${deliveryNote || '-'}<br>
                        <strong>Mode/Tel:</strong> ${modeTel || '-'}
                    </td>
                    <td width="50%">
                        <strong>Consignee:</strong><br>
                        ${consigneeName}<br>
                        ${consigneeContact}<br>
                        ${consigneeAddress}<br>
                        Ph: ${consigneePhone}<br>
                        GSTIN/UIN: ${consigneeGST}
                    </td>
                </tr>
            </table>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th width="5%">S.No</th>
                        <th width="35%">Description of Goods and services</th>
                        <th width="10%">HSN/SAC</th>
                        <th width="10%">Quantity</th>
                        <th width="10%">Rate</th>
                        <th width="10%">Per</th>
                        <th width="10%">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.description || '-'}</td>
                            <td>${item.hsn || '-'}</td>
                            <td>${item.quantity}</td>
                            <td>${item.rate.toFixed(2)}</td>
                            <td>${item.per}</td>
                            <td class="text-right">${item.amount.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="6" class="text-right"><strong>Total</strong></td>
                        <td class="text-right"><strong>${totalAmount.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <div><strong>Amount Chargeable (in words):</strong> ${numberToWords(grandTotal)}</div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>HSN/SAC</th>
                        <th>Taxable value</th>
                        <th>Central Tax</th>
                        <th>State Tax</th>
                        <th>Total Tax</th>
                    </tr>
                </thead>
                <tbody>
                    ${taxes.map(tax => `
                        <tr>
                            <td>${tax.hsn || '-'}</td>
                            <td>${tax.taxableValue.toFixed(2)}</td>
                            <td>${tax.cgstRate}%<br>${tax.cgstAmount.toFixed(2)}</td>
                            <td>${tax.sgstRate}%<br>${tax.sgstAmount.toFixed(2)}</td>
                            <td>${(tax.cgstAmount + tax.sgstAmount).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="4" class="text-right"><strong>Total Tax</strong></td>
                        <td class="text-right"><strong>${totalTax.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <div><strong>Tax Amount (in words):</strong> ${taxInWordsSpan.textContent}</div>
            
            <div style="margin-top: 20px;">
                <strong>Company's Bank Details</strong><br>
                <strong>Bank Name:</strong> ${bankName}<br>
                <strong>A/c No:</strong> ${accountNo || '-'}<br>
                <strong>Branch & IFC Code:</strong> ${branchIFSC}
            </div>
            
            <div style="margin-top: 20px;">
                <strong>Declaration:</strong><br>
                ${declaration}
            </div>
            
            <div class="signature">
                <div style="float: right;">
                    <strong>For R.S.K ENTERPRISES</strong><br><br><br>
                    <div style="border-top: 1px solid #000; width: 200px;">Authorized Signatory</div>
                </div>
                <div style="clear: both;"></div>
            </div>
            
            <div class="footer">
                <div class="text-center">This is a computer generated invoice</div>
            </div>
        `;

        // Generate PDF
        const options = {
            margin: 10,
            filename: `Invoice_${invoiceNo}_${formattedDate.replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(pdfContent).save();
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function resetForm() {
        if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
            items = [];
            taxes = [];
            document.querySelector('form').reset();
            addNewItemRow();
            calculateTotals();
        }
    }
});