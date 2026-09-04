import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'invoices.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

export const defaultTemplate = {
  companyName: 'MIST AGENCIES',
  subtitle: 'DISTRIBUTOR OF PACKAGED DRINKING WATER',
  addressLine1: 'No.34, New Balaji Nagar, Kottaipalayam(PO)',
  addressLine2: 'S S Kulam, Coimbatore, Tamil Nadu-641 110. India',
  email: 'mistwateragencies@gmail.com',
  phone1: '90033 42551',
  phone2: '99521 88999',
  gstin: '33ADZPL9469J1ZI',
  logoUrl: '',
  shippedFromCompanyName: 'MIST AGENCIES',
  shippedFromAddress: 'No.34, New Balaji Nagar, Kottaipalayam(PO S S Kulam, Coimbatore, - 641 110.',
  shippedFromState: 'TAMIL NADU',
  shippedFromGstin: '33ADZPL9469J1ZI',
  bankName: 'CANARA BANK',
  branch: 'S . S KULAM',
  accountNo: '120002370290',
  ifsc: 'CNRB0001034',
  terms: 'Empty cans must be returned during the next delivery; loss or damage will incur additional charges.',
  certifiedStatement: 'Certified that the particulars given above are true and correct',
  nextInvoiceNumber: 27
};

export const defaultSampleInvoice = {
  invoiceNumber: '26/ 2026 -2027',
  invoiceDate: '20/06/2026',
  buyer: {
    companyName: 'INDIA LAND TECH PARK PRIVATE LIMITED',
    address: 'CHIL SEZ Area, Keernatham Village,\nSaravanampatti, Coimbatore - 641 035',
    mobile: '',
    state: 'TAMIL NADU',
    code: '33 - TN',
    gstin: '33AADCK0511G1Z8'
  },
  shippedTo: {
    companyName: 'INDIA LAND TECH PARK PRIVATE LIMITED',
    address: 'CHIL SEZ Area, Keernatham Village,\nSaravanampatti, Coimbatore - 641 035',
    mobile: '',
    state: 'TAMIL NADU',
    code: '33 - TN',
    gstin: '33AADCK0511G1Z8'
  },
  shippedFrom: {
    companyName: 'MIST AGENCIES',
    address: 'No.34, New Balaji Nagar, Kottaipalayam(PO\nS S Kulam, Coimbatore, - 641 110.',
    state: 'TAMIL NADU',
    gstin: '33ADZPL9469J1ZI'
  },
  items: [
    {
      id: 'item-1',
      srNo: '01',
      particulars: 'TWENTY LITRE\nWATER JAR &\nEmpty can\nReplaceable',
      hsnCode: '22011010',
      quantity: 80,
      rate: 85.71,
      taxableValue: 6857.2,
      gstPercent: 5,
      gstAmount: 342.86,
      total: 7200.06
    }
  ],
  summary: {
    totalTaxableAmount: 6857.2,
    addIgst: 342.86,
    totalTax: 342.86,
    totalAmountAfterTax: 7200.06,
    amountInWords: 'Seven Thousand Two Hundred only'
  },
  status: 'Issued',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export function initDb() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS template (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Issued',
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default template if empty
  const templateRow = db.prepare('SELECT * FROM template WHERE id = 1').get();
  if (!templateRow) {
    db.prepare('INSERT INTO template (id, data, updated_at) VALUES (1, ?, ?)').run(
      JSON.stringify(defaultTemplate),
      new Date().toISOString()
    );
  }

  // Update or insert reference invoice
  const sampleId = 'inv-ref-26';
  const existingSample = db.prepare('SELECT * FROM invoices WHERE id = ?').get(sampleId);
  if (!existingSample) {
    db.prepare(`
      INSERT INTO invoices (id, invoice_number, invoice_date, customer_name, total_amount, status, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sampleId,
      defaultSampleInvoice.invoiceNumber,
      defaultSampleInvoice.invoiceDate,
      defaultSampleInvoice.buyer.companyName,
      defaultSampleInvoice.summary.totalAmountAfterTax,
      'Issued',
      JSON.stringify({ ...defaultSampleInvoice, id: sampleId }),
      defaultSampleInvoice.createdAt,
      defaultSampleInvoice.updatedAt
    );
  } else {
    // Update existing sample to ensure exact reference matches
    db.prepare(`
      UPDATE invoices
      SET invoice_number = ?, invoice_date = ?, customer_name = ?, total_amount = ?, data = ?
      WHERE id = ?
    `).run(
      defaultSampleInvoice.invoiceNumber,
      defaultSampleInvoice.invoiceDate,
      defaultSampleInvoice.buyer.companyName,
      defaultSampleInvoice.summary.totalAmountAfterTax,
      JSON.stringify({ ...defaultSampleInvoice, id: sampleId }),
      sampleId
    );
  }
}


export function getTemplate() {
  const row = db.prepare('SELECT data FROM template WHERE id = 1').get();
  return row ? JSON.parse(row.data) : defaultTemplate;
}

export function updateTemplate(data) {
  const updatedAt = new Date().toISOString();
  db.prepare('UPDATE template SET data = ?, updated_at = ? WHERE id = 1').run(
    JSON.stringify(data),
    updatedAt
  );
  return getTemplate();
}

export function resetTemplate() {
  return updateTemplate(defaultTemplate);
}

export function getAllInvoices({ search = '', sortBy = 'newest' } = {}) {
  let query = 'SELECT * FROM invoices';
  const params = [];

  if (search) {
    query += ' WHERE invoice_number LIKE ? OR customer_name LIKE ? OR invoice_date LIKE ?';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (sortBy === 'newest') {
    query += ' ORDER BY created_at DESC';
  } else if (sortBy === 'oldest') {
    query += ' ORDER BY created_at ASC';
  } else if (sortBy === 'number') {
    query += ' ORDER BY invoice_number ASC';
  } else if (sortBy === 'amount') {
    query += ' ORDER BY total_amount DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...JSON.parse(r.data),
    id: r.id,
    invoiceNumber: r.invoice_number,
    invoiceDate: r.invoice_date,
    customerName: r.customer_name,
    totalAmount: r.total_amount,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export function getInvoiceById(id) {
  const row = db.prepare('SELECT data FROM invoices WHERE id = ?').get(id);
  return row ? JSON.parse(row.data) : null;
}

export function createInvoice(invoiceData) {
  const id = invoiceData.id || `inv-${Date.now()}`;
  const now = new Date().toISOString();
  const invoiceToSave = {
    ...invoiceData,
    id,
    createdAt: invoiceData.createdAt || now,
    updatedAt: now
  };

  db.prepare(`
    INSERT INTO invoices (id, invoice_number, invoice_date, customer_name, total_amount, status, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    invoiceToSave.invoiceNumber,
    invoiceToSave.invoiceDate,
    invoiceToSave.buyer?.companyName || 'Cash Customer',
    Number(invoiceToSave.summary?.totalAmountAfterTax || 0),
    invoiceToSave.status || 'Issued',
    JSON.stringify(invoiceToSave),
    invoiceToSave.createdAt,
    invoiceToSave.updatedAt
  );

  return invoiceToSave;
}

export function updateInvoice(id, invoiceData) {
  const now = new Date().toISOString();
  const updatedInvoice = {
    ...invoiceData,
    id,
    updatedAt: now
  };

  db.prepare(`
    UPDATE invoices
    SET invoice_number = ?, invoice_date = ?, customer_name = ?, total_amount = ?, status = ?, data = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updatedInvoice.invoiceNumber,
    updatedInvoice.invoiceDate,
    updatedInvoice.buyer?.companyName || 'Cash Customer',
    Number(updatedInvoice.summary?.totalAmountAfterTax || 0),
    updatedInvoice.status || 'Issued',
    JSON.stringify(updatedInvoice),
    now,
    id
  );

  return updatedInvoice;
}

export function deleteInvoice(id) {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  return { success: true, id };
}

export default db;
