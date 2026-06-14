/**
 * PDF Export Utility
 * Generate professional PDFs for quotations, reports, and more
 * Uses browser print functionality for simplicity (no external dependencies)
 */

// D-KRAFT branding
const COMPANY_INFO = {
    name: 'D-KRAFT',
    fullName: 'Dovecreek Manufacturing',
    address: 'Tijuana, BC, Mexico',
    phone: '+52 664 123 4567',
    email: 'info@dkraft.com.mx',
    website: 'www.dkraft.com.mx'
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount || 0);
};

// Format date
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Generate PDF styles
const getPDFStyles = () => `
    <style>
        @page {
            size: letter;
            margin: 0.5in;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            background: white;
        }
        .pdf-container {
            max-width: 8in;
            margin: 0 auto;
            padding: 0.25in;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #d35400;
            padding-bottom: 20px;
            margin-bottom: 25px;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #0033b3 0%, #0047e0 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24pt;
            font-weight: bold;
        }
        .company-name {
            font-size: 24pt;
            font-weight: bold;
            color: #0033b3;
        }
        .company-tagline {
            font-size: 9pt;
            color: #666;
        }
        .doc-info {
            text-align: right;
        }
        .doc-type {
            font-size: 18pt;
            font-weight: bold;
            color: #d35400;
            text-transform: uppercase;
        }
        .doc-number {
            font-size: 12pt;
            color: #666;
            margin-top: 4px;
        }
        .doc-date {
            font-size: 10pt;
            color: #888;
            margin-top: 2px;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            gap: 40px;
        }
        .info-block {
            flex: 1;
        }
        .info-block h3 {
            font-size: 10pt;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #ddd;
        }
        .info-block p {
            font-size: 10pt;
            margin: 3px 0;
        }
        .info-block .highlight {
            font-weight: 600;
            color: #0033b3;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        th {
            background: #f5f5f5;
            padding: 10px 12px;
            text-align: left;
            font-size: 9pt;
            font-weight: 600;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-bottom: 2px solid #ddd;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 10pt;
        }
        tr:nth-child(even) {
            background: #fafafa;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 25px;
        }
        .totals-box {
            width: 280px;
            background: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 10pt;
        }
        .total-row.grand {
            border-top: 2px solid #d35400;
            margin-top: 8px;
            padding-top: 12px;
            font-size: 14pt;
            font-weight: bold;
            color: #d35400;
        }
        .notes {
            background: #fff8f0;
            border: 1px solid #ffe0cc;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 25px;
        }
        .notes h4 {
            font-size: 10pt;
            color: #d35400;
            margin-bottom: 8px;
        }
        .notes p {
            font-size: 9pt;
            color: #666;
        }
        .terms {
            font-size: 8pt;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 15px;
            margin-top: 20px;
        }
        .terms h4 {
            font-size: 9pt;
            color: #666;
            margin-bottom: 6px;
        }
        .terms ul {
            margin-left: 20px;
        }
        .terms li {
            margin: 3px 0;
        }
        .footer {
            text-align: center;
            font-size: 8pt;
            color: #999;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-draft { background: #e2e8f0; color: #475569; }
        .status-sent { background: #dbeafe; color: #1d4ed8; }
        .status-approved { background: #d1fae5; color: #059669; }
        .status-rejected { background: #fee2e2; color: #dc2626; }
        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
    </style>
`;

/**
 * Export Quotation to PDF
 */
export const exportQuotationToPDF = (quotation, items = []) => {
    const statusClass = `status-${(quotation.status || 'draft').toLowerCase()}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quotation ${quotation.folio || 'N/A'}</title>
            ${getPDFStyles()}
        </head>
        <body>
            <div class="pdf-container">
                <div class="header">
                    <div class="logo">
                        <div class="logo-icon">D</div>
                        <div>
                            <div class="company-name">${COMPANY_INFO.name}</div>
                            <div class="company-tagline">${COMPANY_INFO.fullName}</div>
                        </div>
                    </div>
                    <div class="doc-info">
                        <div class="doc-type">Quotation</div>
                        <div class="doc-number">${quotation.folio || 'DRAFT'}</div>
                        <div class="doc-date">${formatDate(quotation.createdAt)}</div>
                        <div style="margin-top: 8px;">
                            <span class="${statusClass} status-badge">${quotation.status || 'Draft'}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-block">
                        <h3>Bill To</h3>
                        <p class="highlight">${quotation.clientName || 'Client Name'}</p>
                        <p>${quotation.clientEmail || ''}</p>
                        <p>${quotation.clientPhone || ''}</p>
                        <p>${quotation.clientAddress || ''}</p>
                    </div>
                    <div class="info-block">
                        <h3>Quote Details</h3>
                        <p><strong>Valid Until:</strong> ${formatDate(quotation.validUntil)}</p>
                        <p><strong>ETA:</strong> ${formatDate(quotation.eta)}</p>
                        <p><strong>Billing Entity:</strong> ${quotation.billingEntity || 'DOVECREEK'}</p>
                        ${quotation.depositRequired ? `<p><strong>Deposit Required:</strong> ${formatCurrency(quotation.deposit)}</p>` : ''}
                    </div>
                    <div class="info-block">
                        <h3>From</h3>
                        <p class="highlight">${COMPANY_INFO.name}</p>
                        <p>${COMPANY_INFO.address}</p>
                        <p>${COMPANY_INFO.phone}</p>
                        <p>${COMPANY_INFO.email}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">#</th>
                            <th>Description</th>
                            <th class="text-center" style="width: 80px;">Qty</th>
                            <th class="text-right" style="width: 100px;">Unit Price</th>
                            <th class="text-right" style="width: 110px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, idx) => `
                            <tr>
                                <td class="text-center">${idx + 1}</td>
                                <td>
                                    <strong>${item.productName || item.name || 'Item'}</strong>
                                    ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
                                </td>
                                <td class="text-center">${item.quantity || 1}</td>
                                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                                <td class="text-right">${formatCurrency(item.subtotal || (item.quantity * item.unitPrice))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="totals-box">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>${formatCurrency(quotation.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax (16%)</span>
                            <span>${formatCurrency(quotation.tax)}</span>
                        </div>
                        ${quotation.discount ? `
                        <div class="total-row">
                            <span>Discount</span>
                            <span>-${formatCurrency(quotation.discount)}</span>
                        </div>
                        ` : ''}
                        <div class="total-row grand">
                            <span>Total</span>
                            <span>${formatCurrency(quotation.total)}</span>
                        </div>
                    </div>
                </div>

                ${quotation.notes ? `
                <div class="notes">
                    <h4>Notes</h4>
                    <p>${quotation.notes}</p>
                </div>
                ` : ''}

                <div class="terms">
                    <h4>Terms & Conditions</h4>
                    <ul>
                        <li>This quotation is valid for 30 days from the date of issue.</li>
                        <li>50% deposit required upon order confirmation.</li>
                        <li>Prices are in USD unless otherwise specified.</li>
                        <li>Delivery times are estimates and subject to material availability.</li>
                    </ul>
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>${COMPANY_INFO.website} | ${COMPANY_INFO.email}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    printDocument(html, `Quotation_${quotation.folio || 'draft'}`);
};

/**
 * Export Report to PDF
 */
export const exportReportToPDF = (title, data, columns) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            ${getPDFStyles()}
        </head>
        <body>
            <div class="pdf-container">
                <div class="header">
                    <div class="logo">
                        <div class="logo-icon">D</div>
                        <div>
                            <div class="company-name">${COMPANY_INFO.name}</div>
                            <div class="company-tagline">Report</div>
                        </div>
                    </div>
                    <div class="doc-info">
                        <div class="doc-type">${title}</div>
                        <div class="doc-date">Generated: ${formatDate(new Date())}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(col => `<td>${row[col.key] || '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Generated by ${COMPANY_INFO.name}</p>
                    <p>${COMPANY_INFO.website}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    printDocument(html, title.replace(/\s+/g, '_'));
};

/**
 * Print HTML document
 */
const printDocument = (html) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to generate PDF');
        return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };
};

export default {
    exportQuotationToPDF,
    exportReportToPDF
};
