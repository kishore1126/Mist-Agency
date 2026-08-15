# MIST Agencies Tax Invoice Generator

Production-ready Tax Invoice Management Web Application designed specifically to reproduce the **MIST AGENCIES** master reference invoice template with visual fidelity, automatic calculations with owner override capabilities, master template editor, SQLite database persistence, invoice history search/sort, duplicate invoice generation, Puppeteer A4 PDF rendering, and browser direct printing.

---

## Live Access Links

### Local Development / Production Web Server:
- **Local Address**: [http://localhost:5000](http://localhost:5000)
- **Local Network Address**: [http://10.248.74.50:5000](http://10.248.74.50:5000)

---

## Key Features

1. **Exact Master Design Reproduction**:
   - Classic serif title, vibrant blue banner (`DISTRIBUTOR OF PACKAGED DRINKING WATER`), dual contact phone section, company address, top-right invoice number/date placement.
   - Master MIST Agencies logo mark and faint item table watermark.
   - 3-column billing/shipping grid: `Details of Buyer - ( Billed To )`, `Shipped To :`, `Shipped From :`.
   - Sharp 1px table grid borders, IGST split sub-headers (`%` and `Amount`).
   - Bottom section: `Total in words` (Indian currency formatting), `Bank Details` (Canara Bank), `Terms and Conditions`, and `Authorised Signature` declaration box.

2. **Dual Operational Modes**:
   - **Mode A (Daily Billing)**: Input form for daily invoice details with instant side-by-side A4 live preview.
   - **Mode B (Edit Master Template)**: Safe manager to edit permanent company information, default Shipped From address, bank details, terms, and custom logo upload without corrupting previously saved invoices.

3. **Owner-Editable Financial Calculations**:
   - Automatically calculates taxable value, IGST, totals, and Indian currency words defaults.
   - All financial fields (Taxable Value, GST Amount, Item Total, Total Taxable Amount, Total Tax, Grand Total, and Amount in Words) are **100% editable by the owner**.

4. **Invoice History & Duplication**:
   - SQLite database (`invoices.db`) storing invoices & master template configuration.
   - Live search (by invoice number, buyer name, date) and sorting (Newest, Oldest, Amount).
   - 1-click **Duplicate Invoice** for recurring buyers.

5. **PDF Export & Browser Direct Printing**:
   - Server-side Puppeteer PDF rendering with Base64 embedded inline images.
   - Automatic `html2pdf.js` client-side fallback.
   - Browser `@media print` rules hiding all app navigation and forms when printing.

---

## Local Setup & Production Build

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Production Bundle
```bash
npm run build
```

### 3. Start Production Application Server
```bash
npm start
```

Open `http://localhost:5000` in your web browser.

---

## Cloud Deployment Guide

### Deploying to Render.com (Recommended Free Hosting)

1. Push this repository to GitHub or GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select **Environment**: `Docker` (using the included `Dockerfile` and `render.yaml`).
5. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. Render will automatically build the container and deploy the application with a public URL (e.g., `https://mist-agencies-invoice.onrender.com`).

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Web server listening port | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `production` |
