import React from 'react';
import { InvoiceData, TemplateData } from '../types/invoice';
import { DEFAULT_LOGO_BASE64 } from '../utils/logoBase64';
import '../invoice.css';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  template: TemplateData;
  id?: string;
}

// Helper to format numbers cleanly (e.g. 6857.2 matching original bill)
const formatAmount = (num: number | string | undefined): string => {
  if (num === undefined || num === null || num === '') return '0.00';
  const val = Number(num);
  if (isNaN(val)) return String(num);
  const str = val.toFixed(2);
  return str.endsWith('0') && !str.endsWith('.00') ? val.toFixed(1) : str;
};

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, template, id = 'invoice-preview' }) => {
  const { buyer, shippedTo, shippedFrom, items, summary } = invoice;
  const hasCustomLogo = Boolean(template.logoUrl && template.logoUrl.startsWith('data:'));
  const logoSrc = hasCustomLogo ? template.logoUrl : DEFAULT_LOGO_BASE64;

  return (
    <div id={id} className="page invoice-preview-page">
      <div className="invoice-frame">

        {/* Header Row 1: MIST AGENCIES, Invoice No, Invoice Date in single baseline row */}
        <div className="header-row-1">
          <div className="brand-title">{template.companyName || 'MIST AGENCIES'}</div>
          <div className="invoice-meta-fields">
            <div className="meta-field">
              <span className="label">Invoice No : </span>
              <span className="value">{invoice.invoiceNumber}</span>
            </div>
            <div className="meta-field">
              <span className="label">Invoice Date : </span>
              <span className="value">{invoice.invoiceDate}</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Left (Banner + Address/Phone) and Right (Full-height Logo) */}
        <div className="header-middle-section">
          <div className="left-section-col">
            <div className="banner-strip">
              {template.subtitle || 'DISTRIBUTOR OF PACKAGED DRINKING WATER'}
            </div>
            <div className="contact-row">
              <div className="contact-address">
                <p>{template.addressLine1 || 'No.34, New Balaji Nagar, Kottaipalayam(PO)'}</p>
                <p>{template.addressLine2 || 'S S Kulam, Coimbatore, Tamil Nadu-641 110. India'}</p>
                <p>
                  email: <a href={`mailto:${template.email || 'mistwateragencies@gmail.com'}`}>{template.email || 'mistwateragencies@gmail.com'}</a>
                </p>
              </div>
              <div className="contact-phones">
                <div className="phone-circle-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="#000">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <div className="phone-numbers">
                  <p>: {template.phone1 || '90033 42551'}</p>
                  <p>: {template.phone2 || '99521 88999'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="right-logo-col">
            <div className="logo-container" aria-hidden="true">
              <img src={logoSrc} alt="MIST Logo" />
            </div>
          </div>
        </div>

        {/* BOX 1: Party Details */}
        <div className="box-party">
          {/* Header row without vertical lines, centered text */}
          <div className="gstin-header-row">
            <div className="gstin-cell gstin-left">GSTIN : {template.gstin || '33ADZPL9469J1ZI'}</div>
            <div className="gstin-cell gstin-center">TAX INVOICE</div>
            <div className="gstin-cell gstin-right">Original for Recipient</div>
          </div>
          <div className="party-columns">
            <div className="party-col">
              <div className="party-title">Details of Buyer - ( Billed To )</div>
              <div className="party-company-name">{buyer.companyName}</div>
              <div className="party-address">{buyer.address}</div>
              <div className="party-meta">
                <p><strong>Mobile :</strong> {buyer.mobile || ''}</p>
                <p><strong>State :</strong> &nbsp;{buyer.state} &nbsp;&nbsp;&nbsp;&nbsp;<strong>Code :</strong> &nbsp;{buyer.code}</p>
                <p><strong>GSTIN :</strong> &nbsp;{buyer.gstin}</p>
              </div>
            </div>
            <div className="party-col">
              <div className="party-title">Shipped To :</div>
              <div className="party-company-name">{shippedTo.companyName}</div>
              <div className="party-address">{shippedTo.address}</div>
              <div className="party-meta">
                <p><strong>Mobile :</strong> {shippedTo.mobile || ''}</p>
                <p><strong>State :</strong> &nbsp;{shippedTo.state}</p>
                <p><strong>GSTIN :</strong> &nbsp;{shippedTo.gstin}</p>
                <p><strong>Code :</strong> &nbsp;{shippedTo.code}</p>
              </div>
            </div>
            <div className="party-col">
              <div className="party-title">Shipped From :</div>
              <div className="party-company-name">{shippedFrom.companyName}</div>
              <div className="party-address">{shippedFrom.address}</div>
              <div className="party-meta">
                <p><strong>State :</strong> &nbsp;{shippedFrom.state}</p>
                <p><strong>GSTIN :</strong> &nbsp;{shippedFrom.gstin}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOX 2: Line Items Table */}
        <div className="box-items">
          {/* Faint Watermark */}
          <div className="table-watermark" aria-hidden="true">
            <img src={logoSrc} alt="" />
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th className="col-sr" rowSpan={2}>Sr No:</th>
                <th className="col-particulars" rowSpan={2}>Particulars</th>
                <th className="col-hsn" rowSpan={2}>HSN Code</th>
                <th className="col-qty" rowSpan={2}>Qty</th>
                <th className="col-rate" rowSpan={2}>Rate</th>
                <th className="col-taxable" rowSpan={2}>Taxable<br />valve</th>
                <th className="col-igst-header" colSpan={2}>IGST</th>
                <th className="col-total" rowSpan={2}>Total</th>
              </tr>
              <tr>
                <th className="col-igst-pct">%</th>
                <th className="col-igst-amt">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="col-sr">{item.srNo || String(idx + 1).padStart(2, '0')}</td>
                  <td className="col-particulars" style={{ whiteSpace: 'pre-line' }}>{item.particulars}</td>
                  <td className="col-hsn">{item.hsnCode}</td>
                  <td className="col-qty">{item.quantity}</td>
                  <td className="col-rate">{formatAmount(item.rate)}</td>
                  <td className="col-taxable">{formatAmount(item.taxableValue)}</td>
                  <td className="col-igst-pct">{item.gstPercent}</td>
                  <td className="col-igst-amt">{formatAmount(item.gstAmount)}</td>
                  <td className="col-total">{formatAmount(item.total)}</td>
                </tr>
              ))}
              <tr className="blank-area-row">
                <td className="col-sr"></td>
                <td className="col-particulars"></td>
                <td className="col-hsn"></td>
                <td className="col-qty"></td>
                <td className="col-rate"></td>
                <td className="col-taxable"></td>
                <td className="col-igst-pct"></td>
                <td className="col-igst-amt"></td>
                <td className="col-total"></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="total-label">Total</td>
                <td className="col-taxable">{formatAmount(summary.totalTaxableAmount)}</td>
                <td className="col-igst-pct"></td>
                <td className="col-igst-amt">{formatAmount(summary.totalTax || summary.addIgst)}</td>
                <td className="col-total">{formatAmount(summary.totalAmountAfterTax)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BOX 3: Summary, Bank, Terms & Signature */}
        <div className="box-summary">
          {/* Left Column: Total in words, Bank Details, Terms and Conditions */}
          <div className="summary-left-pane">
            <div className="pane-header-bar">Total in words</div>
            <div className="words-content-area">{summary.amountInWords || 'Seven Thousand Two Hundred only'}</div>
            <div className="bank-header-bar">Bank Details</div>
            <div className="bank-details-content">
              <p><strong>BANK NAME</strong> &nbsp;&nbsp;&nbsp;: {template.bankName || 'CANARA BANK'}</p>
              <p><strong>BRANCH</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {template.branch || 'S . S KULAM'}</p>
              <p><strong>ACCOUNT NO</strong> &nbsp;: {template.accountNo || '120002370290'}</p>
              <p><strong>IFSC</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {template.ifsc || 'CNRB0001034'}</p>
            </div>
            <div className="terms-content-area">
              <strong>Terms and Conditions:</strong> {template.terms || 'Empty cans must be returned during the next delivery; loss or damage will incur additional charges.'}
            </div>
          </div>

          {/* Right Column: Tax Table, Certified Statement, Brand Name, Authorised Signature */}
          <div className="summary-right-pane">
            <table className="tax-calc-table">
              <tbody>
                <tr><td>Taxable Amount</td><td>{formatAmount(summary.totalTaxableAmount)}</td></tr>
                <tr><td>Add : IGST</td><td>{formatAmount(summary.addIgst)}</td></tr>
                <tr><td>Total Tax</td><td>{formatAmount(summary.totalTax)}</td></tr>
                <tr className="row-total-after-tax"><td>Total Amount After Tax</td><td>{formatAmount(summary.totalAmountAfterTax)}</td></tr>
              </tbody>
            </table>
            <div className="sign-content-area">
              <div className="sign-certify-text">{template.certifiedStatement || 'Certified that the particulars given above are true and correct'}</div>
              <div className="sign-brand-name">{template.companyName || 'MIST AGENCIES'}</div>
              <div className="auth-signature-text">Authorised Signature</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
