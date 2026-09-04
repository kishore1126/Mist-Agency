import React, { useState, useEffect, useRef } from 'react';
import { FileText, History, Settings, Download, Printer, Save, Plus, CheckCircle2, AlertCircle, Sparkles, ZoomIn, ZoomOut, Maximize2, X, RotateCcw, Eye } from 'lucide-react';
import { InvoiceData, TemplateData } from './types/invoice';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { TemplateEditor } from './components/TemplateEditor';
import { InvoiceHistory } from './components/InvoiceHistory';
import { calculateItemRow, calculateInvoiceTotals } from './utils/calculations';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'template'>('create');
  
  // Master Template state
  const [template, setTemplate] = useState<TemplateData | null>(null);
  
  // Active Invoice draft state
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Live Preview Zoom & Modal State
  const [zoomMode, setZoomMode] = useState<'fit' | '100' | 'custom'>('fit');
  const [customZoom, setCustomZoom] = useState<number>(100);
  const [fitScale, setFitScale] = useState<number>(0.85);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const previewScrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-calculate optimal fit scale so the full A4 sheet is visible with zero scrolling
  useEffect(() => {
    const updateFitScale = () => {
      if (!previewScrollContainerRef.current) return;
      const { clientWidth, clientHeight } = previewScrollContainerRef.current;
      if (clientWidth <= 50 || clientHeight <= 50) return;
      
      // A4 at 96 DPI: 210mm = 793.7px, 297mm = 1122.5px
      const a4Width = 793.7;
      const a4Height = 1122.5;
      
      const paddingX = 24;
      const paddingY = 24;
      const scaleX = (clientWidth - paddingX) / a4Width;
      const scaleY = (clientHeight - paddingY) / a4Height;
      
      // Fit both width & height so entire page is fully visible
      const optimalFit = Math.min(scaleX, scaleY);
      if (optimalFit > 0) {
        setFitScale(Math.max(0.35, Math.min(optimalFit, 1.3)));
      }
    };

    // Run immediately and after layout paint
    updateFitScale();
    const rafId = requestAnimationFrame(updateFitScale);
    const timeoutId = setTimeout(updateFitScale, 150);
    window.addEventListener('resize', updateFitScale);
    
    let observer: ResizeObserver | null = null;
    if (previewScrollContainerRef.current) {
      observer = new ResizeObserver(() => {
        updateFitScale();
      });
      observer.observe(previewScrollContainerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateFitScale);
      if (observer) observer.disconnect();
    };
  }, [activeTab]);

  const currentScale = zoomMode === 'fit' ? fitScale : (zoomMode === '100' ? 1.0 : customZoom / 100);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial template and pre-seeded invoice from server
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch Template
        const templateRes = await fetch('/api/template');
        const templateData = await templateRes.json();
        setTemplate(templateData);

        // Fetch Recent / Sample Invoice
        const invoicesRes = await fetch('/api/invoices');
        const invoicesData = await invoicesRes.json();
        
        if (invoicesData && invoicesData.length > 0) {
          setCurrentInvoice(invoicesData[0]);
        } else {
          // Create default fallback invoice matching reference image
          createNewInvoiceDraft(templateData);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
        showToast('Error loading application data from server', 'error');
      }
    };

    loadInitialData();
  }, []);

  // Helper to construct a new fresh invoice draft
  const createNewInvoiceDraft = (tmplData?: TemplateData) => {
    const t = tmplData || template;
    const nextNum = t?.nextInvoiceNumber || 27;
    const year = new Date().getFullYear();
    const invNo = `${nextNum}/ ${year} -${year + 1}`;
    const dateStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

    const defaultItem = calculateItemRow({
      id: `item-${Date.now()}`,
      srNo: '01',
      particulars: 'TWENTY LITRE\nWATER JAR &\nEmpty can\nReplaceable',
      hsnCode: '22011010',
      quantity: 80,
      rate: 85.71,
      gstPercent: 5
    });

    const defaultSummary = calculateInvoiceTotals([defaultItem], {
      amountInWords: 'Seven Thousand Two Hundred only'
    });

    const newDraft: InvoiceData = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNo,
      invoiceDate: dateStr,
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
        companyName: t?.shippedFromCompanyName || 'MIST AGENCIES',
        address: t?.shippedFromAddress || 'No.34, New Balaji Nagar, Kottaipalayam(PO\nS S Kulam, Coimbatore, - 641 110.',
        state: t?.shippedFromState || 'TAMIL NADU',
        gstin: t?.shippedFromGstin || '33ADZPL9469J1ZI'
      },
      items: [defaultItem],
      summary: defaultSummary,
      status: 'Issued'
    };

    setCurrentInvoice(newDraft);
  };

  // Save current invoice to database
  const handleSaveInvoice = async () => {
    if (!currentInvoice) return;

    try {
      setIsSaving(true);
      const isExisting = Boolean(currentInvoice.id && !currentInvoice.id.startsWith('inv-draft-'));
      const endpoint = isExisting ? `/api/invoices/${currentInvoice.id}` : '/api/invoices';
      const method = isExisting ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInvoice)
      });

      if (!res.ok) throw new Error('Failed to save invoice');
      const savedData = await res.json();
      setCurrentInvoice(savedData);
      showToast(`Invoice ${savedData.invoiceNumber} saved successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Error saving invoice', 'error');
    } fontFinally: {
      setIsSaving(false);
    }
  };

  // Save updated master template
  const handleSaveTemplate = async (updatedTemplate: TemplateData) => {
    try {
      const res = await fetch('/api/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate)
      });
      const data = await res.json();
      setTemplate(data);

      // Also update shippedFrom on current active invoice if matching default
      if (currentInvoice) {
        setCurrentInvoice({
          ...currentInvoice,
          shippedFrom: {
            companyName: data.shippedFromCompanyName,
            address: data.shippedFromAddress,
            state: data.shippedFromState,
            gstin: data.shippedFromGstin
          }
        });
      }

      showToast('Master template updated successfully!');
      setActiveTab('create');
    } catch (err: any) {
      showToast('Error saving master template', 'error');
    }
  };

  // Reset master template to defaults
  const handleResetTemplate = async () => {
    try {
      const res = await fetch('/api/template/reset', { method: 'POST' });
      const data = await res.json();
      setTemplate(data);
      showToast('Master template reset to original defaults!');
      setActiveTab('create');
    } catch (err) {
      showToast('Error resetting template', 'error');
    }
  };

  // Duplicate an invoice
  const handleDuplicateInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate');
      const duplicated = await res.json();
      setCurrentInvoice(duplicated);
      setActiveTab('create');
      showToast(`Duplicated into new invoice ${duplicated.invoiceNumber}`);
    } catch (err: any) {
      showToast('Error duplicating invoice', 'error');
    }
  };

  // Delete invoice handler
  const handleDeleteInvoice = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      showToast('Invoice deleted');
      if (currentInvoice?.id === id) {
        createNewInvoiceDraft();
      }
    } catch (err) {
      showToast('Error deleting invoice', 'error');
    }
  };

  // Browser Direct Printing Handler
  const handlePrint = () => {
    window.print();
  };

  // Server-side PDF Download Handler with automatic client-side fallback
  const handleDownloadPdf = async (invToDownload?: InvoiceData) => {
    const targetInvoice = invToDownload || currentInvoice;
    if (!targetInvoice || !template) return;

    const cleanNum = targetInvoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `MIST_Agencies_Invoice_${cleanNum}.pdf`;

    try {
      setIsGeneratingPdf(true);
      const previewElement = document.getElementById('invoice-preview');
      if (!previewElement) {
        throw new Error('Invoice preview element not found');
      }

      let pdfDownloaded = false;

      // 1. Try Server Puppeteer generation
      try {
        const standaloneHtml = `
          <!DOCTYPE html>
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
                .logo-container svg, .logo-container img { height: 100%; width: auto; display: block; object-fit: contain; }
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
                .table-watermark svg { width: 100%; height: 100%; }
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
              ${previewElement.outerHTML}
            </body>
          </html>
        `;

        const res = await fetch('/api/invoices/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ htmlContent: standaloneHtml })
        });

        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/pdf')) {
          const blob = await res.blob();
          if (blob.size > 1000) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            pdfDownloaded = true;
          }
        }
      } catch (serverErr) {
        console.warn('Server PDF generation failed, switching to client-side renderer...', serverErr);
      }

      // 2. Client-side html2pdf fallback if server did not produce PDF binary
      if (!pdfDownloaded && (window as any).html2pdf) {
        const opt = {
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await (window as any).html2pdf().set(opt).from(previewElement).save();
        pdfDownloaded = true;
      }

      if (pdfDownloaded) {
        showToast('PDF downloaded successfully!');
      } else {
        throw new Error('Could not generate PDF file.');
      }
    } catch (err: any) {
      console.error('PDF error:', err);
      showToast(err.message || 'Error generating PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!template || !currentInvoice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide">Loading MIST Agencies System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* APP TOP NAVIGATION BAR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-serif text-xl shadow-md shadow-blue-600/30">
              M
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-white leading-tight tracking-wide">
                MIST AGENCIES
              </h1>
              <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                Tax Invoice Generator System
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Create / Edit Invoice
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Invoice History
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'template'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Edit Template
            </button>
          </nav>

          {/* Global Action Header Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => createNewInvoiceDraft()}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" /> New Draft
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="text-xs bg-purple-700 hover:bg-purple-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              title="Print directly using browser"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              title="Download high-fidelity A4 PDF"
            >
              <Download className="w-3.5 h-3.5" />
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>
          </div>

        </div>
      </header>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-2.5 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-600/60'
              : 'bg-red-950 text-red-200 border-red-600/60'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            {toastMessage.text}
          </div>
        </div>
      )}

      {/* MAIN BODY AREA */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-3 sm:p-5 lg:p-6">
        
        {/* MODE A: CREATE / EDIT DAILY INVOICE */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Editable Invoice Form (5 cols on xl) */}
            <div className="xl:col-span-5 2xl:col-span-5 space-y-4">
              <InvoiceForm
                invoice={currentInvoice}
                template={template}
                onChange={setCurrentInvoice}
                onSave={handleSaveInvoice}
                isSaving={isSaving}
                onReset={() => createNewInvoiceDraft()}
              />
            </div>

            {/* Right Column: Live A4 Invoice Preview (7 cols on xl) */}
            <div className="xl:col-span-7 2xl:col-span-7 sticky top-16">
              <div className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 shadow-2xl space-y-3 flex flex-col h-[calc(100vh-5.5rem)]">
                
                {/* Preview Toolbar Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live A4 Invoice Preview
                    </h3>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono hidden sm:inline-block">
                      210mm × 297mm
                    </span>
                  </div>

                  {/* Zoom Controls & View Actions */}
                  <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setZoomMode('fit')}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded transition ${
                        zoomMode === 'fit'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="Auto-fit whole A4 page to screen without scrolling"
                    >
                      Fit Page
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomMode('100')}
                      className={`text-[11px] font-semibold px-2 py-1 rounded transition ${
                        zoomMode === '100'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="View at 100% actual size"
                    >
                      100%
                    </button>
                    
                    <div className="h-3.5 w-px bg-slate-800 mx-0.5" />

                    <button
                      type="button"
                      onClick={() => {
                        setZoomMode('custom');
                        setCustomZoom(prev => Math.max(40, Math.round(currentScale * 100) - 10));
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    
                    <span className="text-[10px] font-mono text-slate-300 w-10 text-center select-none font-bold">
                      {Math.round(currentScale * 100)}%
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setZoomMode('custom');
                        setCustomZoom(prev => Math.min(150, Math.round(currentScale * 100) + 10));
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-3.5 w-px bg-slate-800 mx-0.5" />

                    <button
                      type="button"
                      onClick={() => setIsFullscreenPreview(true)}
                      className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                      title="Expand Fullscreen Preview"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Viewport Canvas with Perfect Centering & Scaled Wrapper */}
                <div
                  ref={previewScrollContainerRef}
                  className="flex-1 overflow-auto bg-slate-950/90 rounded-lg p-3 sm:p-4 flex items-start justify-center border border-slate-800/80 shadow-inner"
                >
                  <div
                    style={{
                      width: `${210 * currentScale}mm`,
                      height: `${297 * currentScale}mm`,
                      minWidth: `${210 * currentScale}mm`,
                      minHeight: `${297 * currentScale}mm`,
                      position: 'relative',
                    }}
                    className="transition-[width,height] duration-75 flex-shrink-0"
                  >
                    <div
                      style={{
                        transform: `scale(${currentScale})`,
                        transformOrigin: 'top left',
                        width: '210mm',
                        height: '297mm',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                      className="shadow-2xl rounded-sm"
                    >
                      <InvoicePreview
                        invoice={currentInvoice}
                        template={template}
                        id="invoice-preview"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* MODE B: MASTER TEMPLATE EDITOR */}
        {activeTab === 'template' && (
          <TemplateEditor
            template={template}
            onSave={handleSaveTemplate}
            onReset={handleResetTemplate}
            onCancel={() => setActiveTab('create')}
          />
        )}

        {/* MODE C: INVOICE HISTORY */}
        {activeTab === 'history' && (
          <InvoiceHistory
            onEdit={inv => {
              setCurrentInvoice(inv);
              setActiveTab('create');
            }}
            onDuplicate={handleDuplicateInvoice}
            onDelete={handleDeleteInvoice}
            onDownloadPdf={handleDownloadPdf}
            onPrint={inv => {
              setCurrentInvoice(inv);
              setTimeout(() => window.print(), 300);
            }}
            onCreateNew={() => {
              createNewInvoiceDraft();
              setActiveTab('create');
            }}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        MIST Agencies Tax Invoice System &copy; {new Date().getFullYear()} — Production Ready Billing Application
      </footer>

      {/* FULLSCREEN PREVIEW MODAL */}
      {isFullscreenPreview && currentInvoice && template && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 max-w-5xl w-full mx-auto border-b border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold tracking-wide">
                A4 Invoice Preview &bull; <span className="font-mono text-blue-400">{currentInvoice.invoiceNumber}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="text-xs bg-purple-700 hover:bg-purple-600 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf()}
                disabled={isGeneratingPdf}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreenPreview(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition ml-2"
                title="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-6 flex justify-center">
            <div className="shadow-2xl">
              <InvoicePreview
                invoice={currentInvoice}
                template={template}
                id="invoice-preview-fullscreen"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
