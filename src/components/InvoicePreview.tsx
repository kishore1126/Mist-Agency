import React from 'react';
import { InvoiceData, TemplateData } from '../types/invoice';
import { DEFAULT_LOGO_BASE64 } from '../utils/logoBase64';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  template: TemplateData;
  id?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, template, id = 'invoice-preview' }) => {
  const { buyer, shippedTo, shippedFrom, items, summary } = invoice;
  const logoSrc = (template.logoUrl && template.logoUrl.startsWith('data:')) 
    ? template.logoUrl 
    : DEFAULT_LOGO_BASE64;

  return (
    <div
      id={id}
      className="invoice-preview-container bg-white text-black text-[11px] leading-tight font-sans mx-auto shadow-2xl relative select-text"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm 10mm 10mm 10mm',
        boxSizing: 'border-box',
        color: '#000',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Outer Border Box */}
      <div className="border border-black h-full flex flex-col justify-between relative">
        
        {/* HEADER SECTION MATCHING ORIGINAL MASTER REFERENCE */}
        <div className="p-3 border-b border-black">
          {/* Top Line: MIST AGENCIES (Left) + Invoice No & Date (Right) */}
          <div className="flex justify-between items-baseline mb-1">
            <h1 className="font-serif text-[32px] font-bold tracking-wide text-black leading-none">
              {template.companyName || 'MIST AGENCIES'}
            </h1>
            <div className="text-[12px] font-bold text-right flex items-center gap-6">
              <p className="text-gray-900">
                <span className="text-[#2b6eb5] font-medium">Invoice No : </span>
                <span className="font-semibold">{invoice.invoiceNumber}</span>
              </p>
              <p className="text-gray-900">
                <span className="text-[#2b6eb5] font-medium">Invoice Date : </span>
                <span className="font-semibold">{invoice.invoiceDate}</span>
              </p>
            </div>
          </div>

          {/* Middle & Bottom Header Row: Blue Banner + Address + Phone + Right Logo */}
          <div className="flex justify-between items-start mt-1">
            {/* Left Content Area (Banner & Contact) */}
            <div className="flex-1 pr-4">
              {/* Blue Banner Subtitle */}
              <div className="bg-[#2e6cb0] text-white text-[11.5px] font-bold px-3 py-[3.5px] tracking-wider uppercase inline-block w-[72%] mb-2">
                {template.subtitle || 'DISTRIBUTOR OF PACKAGED DRINKING WATER'}
              </div>

              {/* Address & Phone Row */}
              <div className="flex justify-between items-start text-[10px] text-black">
                <div className="leading-snug">
                  <p>{template.addressLine1 || 'No.34, New Balaji Nagar, Kottaipalayam(PO)'}</p>
                  <p>{template.addressLine2 || 'S S Kulam, Coimbatore, Tamil Nadu-641 110. India'}</p>
                  <p className="mt-0.5">email: <span className="underline">{template.email || 'mistwateragencies@gmail.com'}</span></p>
                </div>

                {/* Phone Section */}
                <div className="flex items-center gap-2 mr-4">
                  <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-[12px]">
                    📞
                  </div>
                  <div className="text-[11px] font-bold leading-snug">
                    <p>: {template.phone1 || '90033 42551'}</p>
                    <p>: {template.phone2 || '99521 88999'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Far Right Logo Mark (Base64 Inline Data URI) */}
            <div className="w-28 h-20 flex items-center justify-end">
              <img
                src={logoSrc}
                alt="MIST Agencies Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* GSTIN / TAX INVOICE / ORIGINAL FOR RECIPIENT STRIP */}
        <div className="grid grid-cols-3 border-b border-black text-[11px] font-bold text-center">
          <div className="p-1 border-r border-black text-left px-2">
            GSTIN : <span className="font-semibold">{template.gstin || '33ADZPL9469J1ZI'}</span>
          </div>
          <div className="p-1 border-r border-black uppercase text-[12px] tracking-wider font-extrabold">
            TAX INVOICE
          </div>
          <div className="p-1 text-right px-2 font-normal text-gray-800">
            Original for Recipient
          </div>
        </div>

        {/* 3-COLUMN BUYER / SHIPPED TO / SHIPPED FROM GRID */}
        <div className="grid grid-cols-3 border-b border-black text-[10px]">
          {/* Column 1: Details of Buyer */}
          <div className="p-2 border-r border-black flex flex-col justify-between">
            <div>
              <p className="font-bold text-[11px] mb-1.5">Details of Buyer - ( Billed To )</p>
              <p className="font-bold uppercase text-[11px] text-gray-900 mb-1">{buyer.companyName}</p>
              <p className="whitespace-pre-line text-gray-800 leading-snug">{buyer.address}</p>
            </div>
            <div className="mt-2 space-y-0.5">
              <p><span className="font-semibold">Mobile :</span> {buyer.mobile}</p>
              <div className="flex justify-between pr-2">
                <p><span className="font-semibold">State :</span> {buyer.state}</p>
                <p><span className="font-semibold">Code :</span> {buyer.code}</p>
              </div>
              <p><span className="font-semibold">GSTIN :</span> {buyer.gstin}</p>
            </div>
          </div>

          {/* Column 2: Shipped To */}
          <div className="p-2 border-r border-black flex flex-col justify-between">
            <div>
              <p className="font-bold text-[11px] mb-1.5">Shipped To :</p>
              <p className="font-bold uppercase text-[11px] text-gray-900 mb-1">{shippedTo.companyName}</p>
              <p className="whitespace-pre-line text-gray-800 leading-snug">{shippedTo.address}</p>
            </div>
            <div className="mt-2 space-y-0.5">
              <p><span className="font-semibold">Mobile :</span> {shippedTo.mobile}</p>
              <p><span className="font-semibold">State :</span> {shippedTo.state}</p>
              <p><span className="font-semibold">GSTIN :</span> {shippedTo.gstin}</p>
              <p><span className="font-semibold">Code :</span> {shippedTo.code}</p>
            </div>
          </div>

          {/* Column 3: Shipped From */}
          <div className="p-2 flex flex-col justify-between">
            <div>
              <p className="font-bold text-[11px] mb-1.5">Shipped From :</p>
              <p className="font-bold uppercase text-[11px] text-gray-900 mb-1">{shippedFrom.companyName}</p>
              <p className="whitespace-pre-line text-gray-800 leading-snug">{shippedFrom.address}</p>
            </div>
            <div className="mt-2 space-y-0.5">
              <p><span className="font-semibold">State :</span> {shippedFrom.state}</p>
              <p><span className="font-semibold">GSTIN :</span> {shippedFrom.gstin}</p>
            </div>
          </div>
        </div>

        {/* ITEM TABLE SECTION */}
        <div className="flex-1 flex flex-col relative min-h-[380px]">
          {/* Faint Watermark Logo in background of item table */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-0">
            <img src={logoSrc} alt="Watermark" className="w-[260px] grayscale filter" />
          </div>

          <table className="w-full border-collapse text-[10px] z-10 relative flex-1">
            <thead>
              <tr className="border-b border-black text-center font-bold">
                <th className="p-1 border-r border-black w-[6%] font-semibold">Sr No:</th>
                <th className="p-1 border-r border-black w-[30%] font-semibold">Particulars</th>
                <th className="p-1 border-r border-black w-[12%] font-semibold">HSN Code</th>
                <th className="p-1 border-r border-black w-[8%] font-semibold">Qty</th>
                <th className="p-1 border-r border-black w-[10%] font-semibold">Rate</th>
                <th className="p-1 border-r border-black w-[12%] font-semibold leading-tight">Taxable<br/>value</th>
                <th className="border-r border-black w-[14%]" colSpan={2}>
                  <div className="border-b border-black p-0.5">IGST</div>
                  <div className="grid grid-cols-2">
                    <div className="border-r border-black p-0.5">%</div>
                    <div className="p-0.5">Amount</div>
                  </div>
                </th>
                <th className="p-1 w-[12%] font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="text-center align-top">
                  <td className="p-1.5 border-r border-black">{item.srNo || String(idx + 1).padStart(2, '0')}</td>
                  <td className="p-1.5 border-r border-black text-left font-semibold uppercase whitespace-pre-line leading-normal">
                    {item.particulars}
                  </td>
                  <td className="p-1.5 border-r border-black font-mono">{item.hsnCode}</td>
                  <td className="p-1.5 border-r border-black font-semibold">{item.quantity}</td>
                  <td className="p-1.5 border-r border-black">{Number(item.rate).toFixed(2)}</td>
                  <td className="p-1.5 border-r border-black font-medium">{Number(item.taxableValue).toFixed(2)}</td>
                  <td className="p-1.5 border-r border-black w-[5%]">{item.gstPercent}</td>
                  <td className="p-1.5 border-r border-black w-[9%]">{Number(item.gstAmount).toFixed(2)}</td>
                  <td className="p-1.5 font-semibold text-right pr-2">{Number(item.total).toFixed(2)}</td>
                </tr>
              ))}

              {/* Empty spacing rows to stretch table height gracefully */}
              {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-8">
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>

            {/* Table Footer Total Row */}
            <tfoot>
              <tr className="border-t border-b border-black font-bold text-center text-[10.5px]">
                <td colSpan={5} className="p-1 text-right border-r border-black pr-3 uppercase">Total</td>
                <td className="p-1 border-r border-black font-bold">{Number(summary.totalTaxableAmount).toFixed(2)}</td>
                <td className="border-r border-black"></td>
                <td className="p-1 border-r border-black font-bold">{Number(summary.totalTax || summary.addIgst).toFixed(2)}</td>
                <td className="p-1 text-right pr-2 font-bold">{Number(summary.totalAmountAfterTax).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BOTTOM SECTION: WORDS & BANK DETAILS (LEFT) / SUMMARY TOTALS (RIGHT) */}
        <div className="grid grid-cols-12 border-t border-black text-[10px]">
          {/* Left Column (7 cols): Words, Bank, Terms */}
          <div className="col-span-7 border-r border-black flex flex-col justify-between">
            {/* Total in Words */}
            <div className="border-b border-black p-1.5">
              <p className="font-semibold text-gray-700 text-center mb-1">Total in words</p>
              <p className="font-bold text-center text-[11px] capitalize">
                {summary.amountInWords}
              </p>
            </div>

            {/* Bank Details */}
            <div className="p-2 border-b border-black flex-1">
              <p className="font-bold text-center text-[11px] mb-1.5">Bank Details</p>
              <div className="space-y-0.5 max-w-[280px] mx-auto text-[10.5px]">
                <div className="grid grid-cols-12">
                  <span className="col-span-5 font-bold">BANK NAME</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-bold uppercase">{template.bankName || 'CANARA BANK'}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 font-bold">BRANCH</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-bold uppercase">{template.branch || 'S . S KULAM'}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 font-bold">ACCOUNT NO</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-bold">{template.accountNo || '120002370290'}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 font-bold">IFSC</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-bold uppercase">{template.ifsc || 'CNRB0001034'}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="p-1.5 text-[8.5px] leading-tight text-gray-800">
              <span className="font-bold">Terms and Conditions:</span> {template.terms || 'Empty cans must be returned during the next delivery; loss or damage will incur additional charges.'}
            </div>
          </div>

          {/* Right Column (5 cols): Tax Breakdowns & Signature */}
          <div className="col-span-5 flex flex-col justify-between">
            <div className="divide-y divide-black text-[10px]">
              <div className="flex justify-between p-1 px-2">
                <span className="text-gray-700">Taxable Amount</span>
                <span className="font-bold">{Number(summary.totalTaxableAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-1 px-2">
                <span className="text-gray-700">Add : IGST</span>
                <span className="font-bold">{Number(summary.addIgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-1 px-2">
                <span className="text-gray-700">Total Tax</span>
                <span className="font-bold">{Number(summary.totalTax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-1 px-2 bg-gray-50 font-bold text-[11px]">
                <span>Total Amount After Tax</span>
                <span>{Number(summary.totalAmountAfterTax).toFixed(2)}</span>
              </div>
            </div>

            {/* Signature Box */}
            <div className="p-2 border-t border-black flex flex-col justify-between h-[100px] text-center">
              <p className="text-[8px] italic text-gray-700">
                {template.certifiedStatement || 'Certified that the particulars given above are true and correct'}
              </p>

              <div className="font-serif font-bold text-[15px] text-black tracking-wide my-1">
                {template.companyName || 'MIST AGENCIES'}
              </div>

              <div className="text-[9.5px] font-semibold text-right pr-2 pt-2">
                Authorised Signature
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
