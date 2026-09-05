import { InvoiceData, TemplateData } from '../types/invoice';
import { DEFAULT_LOGO_BASE64 } from './logoBase64';

const formatAmount = (num: number | string | undefined): string => {
  if (num === undefined || num === null || num === '') return '0.00';
  const val = Number(num);
  if (isNaN(val)) return String(num);
  const str = val.toFixed(2);
  return str.endsWith('0') && !str.endsWith('.00') ? val.toFixed(1) : str;
};

export function generateInvoiceHtml(invoice: InvoiceData, template: TemplateData): string {
  const { buyer, shippedTo, shippedFrom, items, summary } = invoice;
  const hasCustomLogo = Boolean(template.logoUrl && template.logoUrl.startsWith('data:'));
  const logoSrc = hasCustomLogo ? template.logoUrl : DEFAULT_LOGO_BASE64;

  const itemRowsHtml = items.map((item, idx) => `
    <tr>
      <td class="col-sr">${item.srNo || String(idx + 1).padStart(2, '0')}</td>
      <td class="col-particulars" style="white-space: pre-line;">${(item.particulars || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      <td class="col-hsn">${item.hsnCode || ''}</td>
      <td class="col-qty">${item.quantity || 0}</td>
      <td class="col-rate">${formatAmount(item.rate)}</td>
      <td class="col-taxable">${formatAmount(item.taxableValue)}</td>
      <td class="col-igst-pct">${item.gstPercent || 0}</td>
      <td class="col-igst-amt">${formatAmount(item.gstAmount)}</td>
      <td class="col-total">${formatAmount(item.total)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>MIST AGENCIES - Tax Invoice</title>
  <style>
    :root {
      --blue-banner:  #3672B1;
      --blue-brand:   #1A4588;
      --logo-blue:    #3572B0;
      --logo-green:   #8CC63F;
      --ink:          #000000;
      --rule:         #000000;
      --rule-line:    1px solid #000000;
      --grey-bg:      #EDEDED;
    }
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--ink);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page, .invoice-preview-page {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 auto !important;
      background: #ffffff !important;
      padding: 7.5mm 6mm !important;
      position: relative !important;
      box-sizing: border-box !important;
      border: var(--rule-line) !important;
      box-shadow: none !important;
    }
    p { margin: 0.5mm 0; }
    .invoice-frame { width: 100%; height: 100%; position: relative; }
    .header-row-1 { display: flex; justify-content: space-between; align-items: baseline; padding: 0 0 2.5mm 0; }
    .brand-title { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 32pt; letter-spacing: 0.5px; line-height: 1; color: #000000; }
    .invoice-meta-fields { display: flex; align-items: baseline; gap: 12mm; font-size: 9.5pt; white-space: nowrap; }
    .meta-field { display: inline-flex; align-items: baseline; gap: 1.5mm; }
    .meta-field .label { font-weight: 400; color: #000; }
    .meta-field .value { font-weight: 700; color: #000; }
    .header-middle-section { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 3.5mm; margin-left: -6mm; width: calc(100% + 6mm); height: 27mm; }
    .left-section-col { width: 74.5%; display: flex; flex-direction: column; justify-content: space-between; }
    .banner-strip { width: 100%; height: 8.5mm; background: var(--blue-banner); color: #ffffff; font-weight: 700; font-size: 12.5pt; letter-spacing: 0.5px; padding-left: 6mm; display: flex; align-items: center; text-transform: uppercase; }
    .contact-row { display: flex; justify-content: space-between; align-items: center; padding: 1.5mm 0 0 6mm; font-size: 8.8pt; line-height: 1.35; }
    .contact-address p { margin: 0.5mm 0; }
    .contact-address a { color: var(--ink); text-decoration: underline; }
    .contact-phones { display: flex; align-items: center; gap: 2.5mm; font-weight: 700; font-size: 9.5pt; margin-left: auto; white-space: nowrap; }
    .phone-circle-icon { width: 7.5mm; height: 7.5mm; border-radius: 50%; border: 1.2pt solid #000; display: flex; align-items: center; justify-content: center; }
    .phone-numbers p { margin: 0.5mm 0; }
    .right-logo-col { width: 25.5%; display: flex; justify-content: flex-end; align-items: stretch; padding-right: 0; }
    .logo-container { width: 100%; height: 100%; display: flex; justify-content: flex-end; }
    .logo-container img { height: 100%; width: auto; display: block; object-fit: contain; }
    .box-party { border: var(--rule-line); margin-bottom: 3.5mm; }
    .gstin-header-row { display: flex; border-bottom: var(--rule-line); font-size: 9.5pt; padding: 1.8mm 0; }
    .gstin-cell { padding: 0 2mm; border-right: none; }
    .gstin-left { width: 33.333%; font-weight: 700; text-align: center; }
    .gstin-center { width: 33.333%; font-weight: 700; text-align: center; }
    .gstin-right { width: 33.333%; text-align: center; font-weight: 400; }
    .party-columns { display: flex; min-height: 38mm; }
    .party-col { width: 33.333%; padding: 2.5mm 3.5mm; border-right: var(--rule-line); font-size: 8.5pt; line-height: 1.35; display: flex; flex-direction: column; }
    .party-col:last-child { border-right: none; }
    .party-title { font-weight: 700; font-size: 9.5pt; margin-bottom: 2mm; }
    .party-company-name { font-weight: 700; font-size: 9pt; color: #000; margin-bottom: 1.5mm; text-transform: uppercase; }
    .party-address { margin: 0 0 2mm 0; white-space: pre-line; }
    .party-meta { margin-top: auto; }
    .party-meta p { margin: 0.6mm 0; }
    .box-items { border: var(--rule-line); margin-bottom: 3.5mm; position: relative; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .items-table th, .items-table td { border: var(--rule-line); padding: 1.5mm 2mm; }
    .items-table thead th { font-weight: 700; text-align: center; background-color: var(--grey-bg); }
    .col-sr { width: 7.5%; text-align: center; }
    .col-particulars { width: 27%; text-align: left; }
    .col-hsn { width: 11%; text-align: center; }
    .col-qty { width: 7%; text-align: center; }
    .col-rate { width: 8%; text-align: center; }
    .col-taxable { width: 11.5%; text-align: center; }
    .col-igst-pct { width: 5.5%; text-align: center; }
    .col-igst-amt { width: 10.5%; text-align: center; }
    .col-total { width: 12%; text-align: center; }
    .items-table tbody td { text-align: center; vertical-align: top; border-top: none; border-bottom: none; }
    .items-table tbody td.col-particulars { text-align: left; font-weight: 700; line-height: 1.3; }
    .blank-area-row td { height: 53.5mm; border-top: none; border-bottom: none; }
    .table-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 55mm; height: 45mm; opacity: 0.08; pointer-events: none; z-index: 1; }
    .table-watermark img { width: 100%; height: 100%; object-fit: contain; }
    .items-table tfoot tr { border-top: var(--rule-line); background-color: var(--grey-bg); }
    .items-table tfoot td { font-weight: 700; text-align: center; padding: 2mm; background-color: var(--grey-bg); }
    .items-table tfoot td.total-label { text-align: center; }
    .box-summary { border: var(--rule-line); display: flex; align-items: stretch; }
    .summary-left-pane { width: 57%; border-right: var(--rule-line); display: flex; flex-direction: column; }
    .pane-header-bar { border-bottom: var(--rule-line); text-align: center; font-weight: 700; font-size: 9.5pt; padding: 1.8mm 2mm; }
    .words-content-area { padding: 2mm 4mm; height: 14mm; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 700; font-size: 10.5pt; }
    .bank-header-bar { border-top: var(--rule-line); border-bottom: var(--rule-line); text-align: center; font-weight: 700; font-size: 9.5pt; padding: 1.8mm 2mm; }
    .bank-details-content { padding: 2.5mm 4mm; font-size: 9pt; line-height: 1.45; }
    .bank-details-content p { margin: 0.8mm 0; }
    .terms-content-area { border-top: var(--rule-line); padding: 2mm 3.5mm; font-size: 7.5pt; line-height: 1.35; margin-top: auto; }
    .terms-content-area strong { font-size: 8pt; }
    .summary-right-pane { width: 43%; display: flex; flex-direction: column; }
    .tax-calc-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .tax-calc-table td { padding: 1.6mm 3.5mm; border-bottom: var(--rule-line); }
    .tax-calc-table td:last-child { text-align: right; }
    .tax-calc-table tr.row-total-after-tax td { font-weight: 700; font-size: 9.5pt; border-top: var(--rule-line); border-bottom: var(--rule-line); padding: 1.8mm 3.5mm; }
    .sign-content-area { padding: 3mm 4mm 2.5mm 4mm; text-align: center; display: flex; flex-direction: column; flex: 1 1 auto; }
    .sign-certify-text { font-size: 7.5pt; font-style: italic; color: #111; margin-bottom: 2mm; }
    .sign-brand-name { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; font-size: 15pt; color: #000; }
    .auth-signature-text { margin-top: auto; font-size: 8.5pt; text-align: center; width: 100%; padding-top: 10mm; }
  </style>
</head>
<body>
  <div class="page invoice-preview-page">
    <div class="invoice-frame">

      <!-- Header Row 1 -->
      <div class="header-row-1">
        <div class="brand-title">${template.companyName || 'MIST AGENCIES'}</div>
        <div class="invoice-meta-fields">
          <div class="meta-field">
            <span class="label">Invoice No : </span>
            <span class="value">${invoice.invoiceNumber || ''}</span>
          </div>
          <div class="meta-field">
            <span class="label">Invoice Date : </span>
            <span class="value">${invoice.invoiceDate || ''}</span>
          </div>
        </div>
      </div>

      <!-- Middle Section -->
      <div class="header-middle-section">
        <div class="left-section-col">
          <div class="banner-strip">
            ${template.subtitle || 'DISTRIBUTOR OF PACKAGED DRINKING WATER'}
          </div>
          <div class="contact-row">
            <div class="contact-address">
              <p>${template.addressLine1 || 'No.34, New Balaji Nagar, Kottaipalayam(PO)'}</p>
              <p>${template.addressLine2 || 'S S Kulam, Coimbatore, Tamil Nadu-641 110. India'}</p>
              <p>email: <a href="mailto:${template.email || 'mistwateragencies@gmail.com'}">${template.email || 'mistwateragencies@gmail.com'}</a></p>
            </div>
            <div class="contact-phones">
              <div class="phone-circle-icon">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#000">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                </svg>
              </div>
              <div class="phone-numbers">
                <p>: ${template.phone1 || '90033 42551'}</p>
                <p>: ${template.phone2 || '99521 88999'}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="right-logo-col">
          <div class="logo-container">
            <img src="${logoSrc}" alt="MIST Logo" />
          </div>
        </div>
      </div>

      <!-- BOX 1: Party Details -->
      <div class="box-party">
        <div class="gstin-header-row">
          <div class="gstin-cell gstin-left">GSTIN : ${template.gstin || '33ADZPL9469J1ZI'}</div>
          <div class="gstin-cell gstin-center">TAX INVOICE</div>
          <div class="gstin-cell gstin-right">Original for Recipient</div>
        </div>
        <div class="party-columns">
          <div class="party-col">
            <div class="party-title">Details of Buyer - ( Billed To )</div>
            <div class="party-company-name">${buyer.companyName || ''}</div>
            <div class="party-address">${(buyer.address || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="party-meta">
              <p><strong>Mobile :</strong> ${buyer.mobile || ''}</p>
              <p><strong>State :</strong> &nbsp;${buyer.state || ''} &nbsp;&nbsp;&nbsp;&nbsp;<strong>Code :</strong> &nbsp;${buyer.code || ''}</p>
              <p><strong>GSTIN :</strong> &nbsp;${buyer.gstin || ''}</p>
            </div>
          </div>
          <div class="party-col">
            <div class="party-title">Shipped To :</div>
            <div class="party-company-name">${shippedTo.companyName || ''}</div>
            <div class="party-address">${(shippedTo.address || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="party-meta">
              <p><strong>Mobile :</strong> ${shippedTo.mobile || ''}</p>
              <p><strong>State :</strong> &nbsp;${shippedTo.state || ''}</p>
              <p><strong>GSTIN :</strong> &nbsp;${shippedTo.gstin || ''}</p>
              <p><strong>Code :</strong> &nbsp;${shippedTo.code || ''}</p>
            </div>
          </div>
          <div class="party-col">
            <div class="party-title">Shipped From :</div>
            <div class="party-company-name">${shippedFrom.companyName || ''}</div>
            <div class="party-address">${(shippedFrom.address || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="party-meta">
              <p><strong>State :</strong> &nbsp;${shippedFrom.state || ''}</p>
              <p><strong>GSTIN :</strong> &nbsp;${shippedFrom.gstin || ''}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- BOX 2: Items Table -->
      <div class="box-items">
        <div class="table-watermark">
          <img src="${logoSrc}" alt="" />
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-sr" rowspan="2">Sr No:</th>
              <th class="col-particulars" rowspan="2">Particulars</th>
              <th class="col-hsn" rowspan="2">HSN Code</th>
              <th class="col-qty" rowspan="2">Qty</th>
              <th class="col-rate" rowspan="2">Rate</th>
              <th class="col-taxable" rowspan="2">Taxable<br />valve</th>
              <th class="col-igst-header" colspan="2">IGST</th>
              <th class="col-total" rowspan="2">Total</th>
            </tr>
            <tr>
              <th class="col-igst-pct">%</th>
              <th class="col-igst-amt">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
            <tr class="blank-area-row">
              <td class="col-sr"></td>
              <td class="col-particulars"></td>
              <td class="col-hsn"></td>
              <td class="col-qty"></td>
              <td class="col-rate"></td>
              <td class="col-taxable"></td>
              <td class="col-igst-pct"></td>
              <td class="col-igst-amt"></td>
              <td class="col-total"></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="total-label">Total</td>
              <td class="col-taxable">${formatAmount(summary.totalTaxableAmount)}</td>
              <td class="col-igst-pct"></td>
              <td class="col-igst-amt">${formatAmount(summary.totalTax || summary.addIgst)}</td>
              <td class="col-total">${formatAmount(summary.totalAmountAfterTax)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- BOX 3: Summary, Bank, Terms & Signature -->
      <div class="box-summary">
        <div class="summary-left-pane">
          <div class="pane-header-bar">Total in words</div>
          <div class="words-content-area">${summary.amountInWords || 'Seven Thousand Two Hundred only'}</div>
          <div class="bank-header-bar">Bank Details</div>
          <div class="bank-details-content">
            <p><strong>BANK NAME</strong> &nbsp;&nbsp;&nbsp;: ${template.bankName || 'CANARA BANK'}</p>
            <p><strong>BRANCH</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${template.branch || 'S . S KULAM'}</p>
            <p><strong>ACCOUNT NO</strong> &nbsp;: ${template.accountNo || '120002370290'}</p>
            <p><strong>IFSC</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${template.ifsc || 'CNRB0001034'}</p>
          </div>
          <div class="terms-content-area">
            <strong>Terms and Conditions:</strong> ${template.terms || 'Empty cans must be returned during the next delivery; loss or damage will incur additional charges.'}
          </div>
        </div>

        <div class="summary-right-pane">
          <table class="tax-calc-table">
            <tbody>
              <tr><td>Taxable Amount</td><td>${formatAmount(summary.totalTaxableAmount)}</td></tr>
              <tr><td>Add : IGST</td><td>${formatAmount(summary.addIgst)}</td></tr>
              <tr><td>Total Tax</td><td>${formatAmount(summary.totalTax)}</td></tr>
              <tr class="row-total-after-tax"><td>Total Amount After Tax</td><td>${formatAmount(summary.totalAmountAfterTax)}</td></tr>
            </tbody>
          </table>
          <div class="sign-content-area">
            <div class="sign-certify-text">${template.certifiedStatement || 'Certified that the particulars given above are true and correct'}</div>
            <div class="sign-brand-name">${template.companyName || 'MIST AGENCIES'}</div>
            <div class="auth-signature-text">Authorised Signature</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
}
