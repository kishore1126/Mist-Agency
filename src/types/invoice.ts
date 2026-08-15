export interface InvoiceItem {
  id: string;
  srNo: string;
  particulars: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  taxableValue: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
}

export interface BuyerDetails {
  companyName: string;
  address: string;
  mobile: string;
  state: string;
  code: string;
  gstin: string;
}

export interface ShippedToDetails {
  companyName: string;
  address: string;
  mobile: string;
  state: string;
  code: string;
  gstin: string;
}

export interface ShippedFromDetails {
  companyName: string;
  address: string;
  state: string;
  gstin: string;
}

export interface InvoiceSummary {
  totalTaxableAmount: number;
  addIgst: number;
  totalTax: number;
  totalAmountAfterTax: number;
  amountInWords: string;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  buyer: BuyerDetails;
  shippedTo: ShippedToDetails;
  shippedFrom: ShippedFromDetails;
  items: InvoiceItem[];
  summary: InvoiceSummary;
  status?: 'Issued' | 'Draft' | 'Paid' | 'Cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateData {
  companyName: string;
  subtitle: string;
  addressLine1: string;
  addressLine2: string;
  email: string;
  phone1: string;
  phone2: string;
  gstin: string;
  logoUrl: string;
  shippedFromCompanyName: string;
  shippedFromAddress: string;
  shippedFromState: string;
  shippedFromGstin: string;
  bankName: string;
  branch: string;
  accountNo: string;
  ifsc: string;
  terms: string;
  certifiedStatement: string;
  nextInvoiceNumber?: number;
}
