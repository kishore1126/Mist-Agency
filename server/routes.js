import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import {
  getTemplate,
  updateTemplate,
  resetTemplate,
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Logo Upload Route returning base64 Data URI
router.post('/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileBuffer = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype || 'image/png';
    const logoUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    
    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.json({ success: true, logoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Template Routes
router.get('/template', (req, res) => {
  try {
    const template = getTemplate();
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/template', (req, res) => {
  try {
    const updated = updateTemplate(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/template/reset', (req, res) => {
  try {
    const resetted = resetTemplate();
    res.json(resetted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invoice Routes
router.get('/invoices', (req, res) => {
  try {
    const { search, sortBy } = req.query;
    const invoices = getAllInvoices({ search, sortBy });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices/:id', (req, res) => {
  try {
    const invoice = getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invoices', (req, res) => {
  try {
    const created = createInvoice(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/invoices/:id', (req, res) => {
  try {
    const updated = updateInvoice(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/invoices/:id', (req, res) => {
  try {
    const result = deleteInvoice(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate Invoice Route
router.post('/invoices/:id/duplicate', (req, res) => {
  try {
    const original = getInvoiceById(req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Original invoice not found' });
    }

    const template = getTemplate();
    const nextNum = template.nextInvoiceNumber || 28;
    const newInvoiceNumber = `${nextNum}/ ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    const duplicate = {
      ...original,
      id: `inv-${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      invoiceDate: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Increment next invoice number in template
    updateTemplate({ ...template, nextInvoiceNumber: nextNum + 1 });

    const created = createInvoice(duplicate);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PDF Generation Route using Puppeteer
router.post('/invoices/pdf', async (req, res) => {
  let browser;
  try {
    const { htmlContent } = req.body;
    if (!htmlContent) {
      return res.status(400).json({ error: 'HTML content required for PDF generation' });
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    
    // Set viewport to A4 dimensions
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    
    // Set HTML content with load timeout
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait a brief moment for fonts and SVG rendering
    await new Promise(r => setTimeout(r, 500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    const buffer = Buffer.from(pdfBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename="MIST_Agencies_Invoice.pdf"');
    res.end(buffer, 'binary');
  } catch (err) {
    console.error('PDF Generation error:', err);
    res.status(500).json({ error: `PDF Generation Failed: ${err.message}` });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

export default router;
