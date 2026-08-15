import { InvoiceItem, InvoiceSummary } from '../types/invoice';
import { numberToIndianWords } from './numberToWords';

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateItemRow(item: Partial<InvoiceItem>): InvoiceItem {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const gstPct = Number(item.gstPercent) || 0;

  // Calculate default values if not explicitly provided or manually overridden
  const taxableValue = roundToTwo(qty * rate);
  const gstAmount = roundToTwo(taxableValue * (gstPct / 100));
  const total = roundToTwo(taxableValue + gstAmount);

  return {
    id: item.id || `item-${Date.now()}`,
    srNo: item.srNo || '01',
    particulars: item.particulars || '',
    hsnCode: item.hsnCode || '',
    quantity: qty,
    rate: rate,
    taxableValue: item.taxableValue !== undefined ? Number(item.taxableValue) : taxableValue,
    gstPercent: gstPct,
    gstAmount: item.gstAmount !== undefined ? Number(item.gstAmount) : gstAmount,
    total: item.total !== undefined ? Number(item.total) : total
  };
}

export function calculateInvoiceTotals(items: InvoiceItem[], manualSummary?: Partial<InvoiceSummary>): InvoiceSummary {
  let totalTaxableAmount = 0;
  let totalTax = 0;

  items.forEach(item => {
    totalTaxableAmount += Number(item.taxableValue || 0);
    totalTax += Number(item.gstAmount || 0);
  });

  totalTaxableAmount = roundToTwo(totalTaxableAmount);
  totalTax = roundToTwo(totalTax);
  const grandTotal = roundToTwo(totalTaxableAmount + totalTax);

  const autoWords = numberToIndianWords(grandTotal);

  return {
    totalTaxableAmount: manualSummary?.totalTaxableAmount !== undefined ? Number(manualSummary.totalTaxableAmount) : totalTaxableAmount,
    addIgst: manualSummary?.addIgst !== undefined ? Number(manualSummary.addIgst) : totalTax,
    totalTax: manualSummary?.totalTax !== undefined ? Number(manualSummary.totalTax) : totalTax,
    totalAmountAfterTax: manualSummary?.totalAmountAfterTax !== undefined ? Number(manualSummary.totalAmountAfterTax) : grandTotal,
    amountInWords: manualSummary?.amountInWords || autoWords
  };
}
