import React from 'react';
import { Plus, Trash2, Copy, Save, RefreshCw, Calculator } from 'lucide-react';
import { InvoiceData, InvoiceItem, TemplateData } from '../types/invoice';
import { calculateItemRow, calculateInvoiceTotals } from '../utils/calculations';

interface InvoiceFormProps {
  invoice: InvoiceData;
  template: TemplateData;
  onChange: (updatedInvoice: InvoiceData) => void;
  onSave: () => void;
  isSaving: boolean;
  onReset: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  template,
  onChange,
  onSave,
  isSaving,
  onReset
}) => {
  // Update nested buyer field
  const handleBuyerChange = (field: keyof InvoiceData['buyer'], value: string) => {
    onChange({
      ...invoice,
      buyer: {
        ...invoice.buyer,
        [field]: value
      }
    });
  };

  // Update nested shippedTo field
  const handleShippedToChange = (field: keyof InvoiceData['shippedTo'], value: string) => {
    onChange({
      ...invoice,
      shippedTo: {
        ...invoice.shippedTo,
        [field]: value
      }
    });
  };

  // Copy buyer details to Shipped To
  const handleCopyBuyerToShippedTo = () => {
    onChange({
      ...invoice,
      shippedTo: {
        companyName: invoice.buyer.companyName,
        address: invoice.buyer.address,
        mobile: invoice.buyer.mobile,
        state: invoice.buyer.state,
        code: invoice.buyer.code,
        gstin: invoice.buyer.gstin
      }
    });
  };

  // Update nested shippedFrom field
  const handleShippedFromChange = (field: keyof InvoiceData['shippedFrom'], value: string) => {
    onChange({
      ...invoice,
      shippedFrom: {
        ...invoice.shippedFrom,
        [field]: value
      }
    });
  };

  // Item field change handler with auto-calculate defaults & owner manual override support
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...invoice.items];
    const currentItem = { ...updatedItems[index], [field]: value };

    // If changing qty, rate, or gstPercent, recalculate row defaults unless user is directly modifying taxableValue/gstAmount/total
    if (['quantity', 'rate', 'gstPercent'].includes(field as string)) {
      const recalculated = calculateItemRow(currentItem);
      updatedItems[index] = recalculated;
    } else {
      updatedItems[index] = currentItem as InvoiceItem;
    }

    // Recalculate summary totals automatically
    const updatedSummary = calculateInvoiceTotals(updatedItems);

    onChange({
      ...invoice,
      items: updatedItems,
      summary: updatedSummary
    });
  };

  // Add Item Row
  const handleAddItem = () => {
    const newItemNumber = String(invoice.items.length + 1).padStart(2, '0');
    const newItem = calculateItemRow({
      id: `item-${Date.now()}`,
      srNo: newItemNumber,
      particulars: 'PACKAGED DRINKING WATER BOTTLE / CAN',
      hsnCode: '22011010',
      quantity: 10,
      rate: 85.71,
      gstPercent: 5
    });

    const updatedItems = [...invoice.items, newItem];
    const updatedSummary = calculateInvoiceTotals(updatedItems);

    onChange({
      ...invoice,
      items: updatedItems,
      summary: updatedSummary
    });
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (invoice.items.length <= 1) {
      alert('Invoice must contain at least one product item.');
      return;
    }
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    const updatedSummary = calculateInvoiceTotals(updatedItems);

    onChange({
      ...invoice,
      items: updatedItems,
      summary: updatedSummary
    });
  };

  // Summary Manual Override Handler
  const handleSummaryChange = (field: keyof InvoiceData['summary'], value: string | number) => {
    onChange({
      ...invoice,
      summary: {
        ...invoice.summary,
        [field]: value
      }
    });
  };

  // Recalculate all defaults manually button
  const handleAutoRecalculateAll = () => {
    const recalculatedItems = invoice.items.map(item => calculateItemRow(item));
    const recalculatedSummary = calculateInvoiceTotals(recalculatedItems);

    onChange({
      ...invoice,
      items: recalculatedItems,
      summary: recalculatedSummary
    });
  };

  return (
    <div className="bg-slate-800 text-slate-100 rounded-xl p-5 border border-slate-700 shadow-xl space-y-6">
      
      {/* Top Action Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📝 Daily Billing Editor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fill invoice details. All amounts are auto-calculated and fully editable by the owner.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoRecalculateAll}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition"
            title="Recalculate standard math"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            Recalculate Defaults
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Form
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>

      {/* SECTION 1: INVOICE DETAILS */}
      <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/60 space-y-3">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <span>📅</span> Invoice Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Invoice Number *</label>
            <input
              type="text"
              value={invoice.invoiceNumber}
              onChange={e => onChange({ ...invoice, invoiceNumber: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white font-medium focus:border-blue-500 focus:outline-none"
              placeholder="e.g. 26/ 2026 -2027"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Invoice Date *</label>
            <input
              type="text"
              value={invoice.invoiceDate}
              onChange={e => onChange({ ...invoice, invoiceDate: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white font-medium focus:border-blue-500 focus:outline-none"
              placeholder="DD/MM/YYYY"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Invoice Status</label>
            <select
              value={invoice.status || 'Issued'}
              onChange={e => onChange({ ...invoice, status: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Issued">Issued</option>
              <option value="Paid">Paid</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: BUYER & SHIPPING DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* BUYER DETAILS */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <span>🏢</span> Buyer Details (Billed To)
            </h3>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Company / Customer Name *</label>
              <input
                type="text"
                value={invoice.buyer.companyName}
                onChange={e => handleBuyerChange('companyName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="INDIA LAND TECH PARK PRIVATE LIMITED"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Full Address</label>
              <textarea
                rows={2}
                value={invoice.buyer.address}
                onChange={e => handleBuyerChange('address', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                placeholder="Address..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Mobile</label>
                <input
                  type="text"
                  value={invoice.buyer.mobile}
                  onChange={e => handleBuyerChange('mobile', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">GSTIN</label>
                <input
                  type="text"
                  value={invoice.buyer.gstin}
                  onChange={e => handleBuyerChange('gstin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none uppercase font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">State</label>
                <input
                  type="text"
                  value={invoice.buyer.state}
                  onChange={e => handleBuyerChange('state', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">State Code</label>
                <input
                  type="text"
                  value={invoice.buyer.code}
                  onChange={e => handleBuyerChange('code', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SHIPPED TO DETAILS */}
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <span>🚚</span> Shipped To Details
            </h3>
            <button
              type="button"
              onClick={handleCopyBuyerToShippedTo}
              className="text-[11px] bg-slate-700 hover:bg-slate-600 text-blue-300 font-semibold px-2 py-1 rounded flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3" /> Same as Buyer
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Company Name</label>
              <input
                type="text"
                value={invoice.shippedTo.companyName}
                onChange={e => handleShippedToChange('companyName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Full Address</label>
              <textarea
                rows={2}
                value={invoice.shippedTo.address}
                onChange={e => handleShippedToChange('address', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Mobile</label>
                <input
                  type="text"
                  value={invoice.shippedTo.mobile}
                  onChange={e => handleShippedToChange('mobile', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">GSTIN</label>
                <input
                  type="text"
                  value={invoice.shippedTo.gstin}
                  onChange={e => handleShippedToChange('gstin', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none uppercase font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">State</label>
                <input
                  type="text"
                  value={invoice.shippedTo.state}
                  onChange={e => handleShippedToChange('state', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">State Code</label>
                <input
                  type="text"
                  value={invoice.shippedTo.code}
                  onChange={e => handleShippedToChange('code', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PRODUCT ITEMS TABLE */}
      <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <span>📦</span> Particulars / Product Line Items
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-300 border-b border-slate-700">
                <th className="p-2 w-12 text-center">Sr</th>
                <th className="p-2">Particulars / Description</th>
                <th className="p-2 w-24">HSN</th>
                <th className="p-2 w-20">Qty</th>
                <th className="p-2 w-24">Rate (₹)</th>
                <th className="p-2 w-28">Taxable (₹)</th>
                <th className="p-2 w-16">GST %</th>
                <th className="p-2 w-24">GST Amt (₹)</th>
                <th className="p-2 w-28">Total (₹)</th>
                <th className="p-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-800/40">
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={item.srNo}
                      onChange={e => handleItemChange(idx, 'srNo', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1 text-center text-white"
                    />
                  </td>
                  <td className="p-1.5">
                    <textarea
                      rows={2}
                      value={item.particulars}
                      onChange={e => handleItemChange(idx, 'particulars', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={e => handleItemChange(idx, 'hsnCode', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white font-mono"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={e => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white font-bold"
                    />
                  </td>
                  {/* Owner Editable Taxable Value */}
                  <td className="p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={item.taxableValue}
                      onChange={e => handleItemChange(idx, 'taxableValue', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-amber-500/50 rounded px-1.5 py-1 text-amber-300 font-semibold"
                      title="Editable Taxable Value override"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      value={item.gstPercent}
                      onChange={e => handleItemChange(idx, 'gstPercent', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1 text-center text-white"
                    />
                  </td>
                  {/* Owner Editable GST Amount */}
                  <td className="p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={item.gstAmount}
                      onChange={e => handleItemChange(idx, 'gstAmount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-amber-500/50 rounded px-1.5 py-1 text-amber-300 font-semibold"
                      title="Editable GST Amount override"
                    />
                  </td>
                  {/* Owner Editable Item Total */}
                  <td className="p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={item.total}
                      onChange={e => handleItemChange(idx, 'total', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-amber-500/50 rounded px-1.5 py-1 text-amber-300 font-bold"
                      title="Editable Item Total override"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-red-400 p-1 rounded transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: SUMMARY & OWNER EDITABLE TOTAL OVERRIDES */}
      <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/60 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span>✏️</span> Owner Editable Invoice Summary & Totals
          </h3>
          <span className="text-[11px] text-amber-400/80 bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-700/50">
            Manual Override Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Total Taxable Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              value={invoice.summary.totalTaxableAmount}
              onChange={e => handleSummaryChange('totalTaxableAmount', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-amber-500/60 rounded px-3 py-1.5 text-sm text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Add : IGST (₹)</label>
            <input
              type="number"
              step="0.01"
              value={invoice.summary.addIgst}
              onChange={e => handleSummaryChange('addIgst', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-amber-500/60 rounded px-3 py-1.5 text-sm text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Total Tax (₹)</label>
            <input
              type="number"
              step="0.01"
              value={invoice.summary.totalTax}
              onChange={e => handleSummaryChange('totalTax', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-amber-500/60 rounded px-3 py-1.5 text-sm text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Grand Total After Tax (₹)</label>
            <input
              type="number"
              step="0.01"
              value={invoice.summary.totalAmountAfterTax}
              onChange={e => handleSummaryChange('totalAmountAfterTax', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-emerald-500/80 rounded px-3 py-1.5 text-sm text-emerald-300 font-extrabold focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Total in Words (Indian Currency Wording)</label>
          <input
            type="text"
            value={invoice.summary.amountInWords}
            onChange={e => handleSummaryChange('amountInWords', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 font-medium focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Seven Thousand Two Hundred Rupees and Six Paise Only"
          />
        </div>
      </div>

    </div>
  );
};
