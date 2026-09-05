import React, { useState, useEffect, useRef } from 'react';
import { FileText, History, Settings, Download, Printer, Save, Plus, CheckCircle2, AlertCircle, Sparkles, ZoomIn, ZoomOut, Maximize2, X, RotateCcw, Eye } from 'lucide-react';
import { InvoiceData, TemplateData } from './types/invoice';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { TemplateEditor } from './components/TemplateEditor';
import { InvoiceHistory } from './components/InvoiceHistory';
import { calculateItemRow, calculateInvoiceTotals } from './utils/calculations';
import { generateInvoiceHtml } from './utils/invoiceHtmlGenerator';

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
        const invoicesRes = await fetch('/api/invoices?sortBy=newest');
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
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInvoice)
      });

      if (!res.ok) throw new Error('Failed to save invoice to database');
      const savedData = await res.json();
      setCurrentInvoice(savedData);
      showToast(`Invoice ${savedData.invoiceNumber} saved successfully!`);
    } catch (err: any) {
      console.error('Save invoice error:', err);
      showToast(err.message || 'Error saving invoice', 'error');
    } finally {
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
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete invoice');
      showToast('Invoice deleted successfully');
      if (currentInvoice?.id === id) {
        createNewInvoiceDraft();
      }
    } catch (err) {
      showToast('Error deleting invoice', 'error');
    }
  };

  // Browser Direct Printing Handler
  const handlePrint = (invToPrint?: InvoiceData) => {
    const target = invToPrint || currentInvoice;
    if (target && target.id !== currentInvoice?.id) {
      setCurrentInvoice(target);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Universal PDF Download Handler for ANY invoice (works from history, editor, or preview)
  const handleDownloadPdf = async (invToDownload?: InvoiceData) => {
    const targetInvoice = invToDownload || currentInvoice;
    if (!targetInvoice || !template) return;

    const cleanNum = (targetInvoice.invoiceNumber || 'invoice').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `MIST_Agencies_Invoice_${cleanNum}.pdf`;

    try {
      setIsGeneratingPdf(true);

      // Auto-save the target invoice in background if not already saved
      fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetInvoice)
      }).catch(e => console.warn('Auto-save on PDF download notice:', e));

      let pdfDownloaded = false;

      // 1. Try server-side Puppeteer generation with standalone HTML generator
      try {
        const standaloneHtml = generateInvoiceHtml(targetInvoice, template);

        const res = await fetch('/api/invoices/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            htmlContent: standaloneHtml,
            invoice: targetInvoice,
            template
          })
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
        console.warn('Server PDF generation failed, switching to client fallback...', serverErr);
      }

      // 2. Client-side html2pdf fallback if server generation was unreachable
      if (!pdfDownloaded && (window as any).html2pdf) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generateInvoiceHtml(targetInvoice, template);
        document.body.appendChild(tempDiv);

        const opt = {
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await (window as any).html2pdf().set(opt).from(tempDiv).save();
        document.body.removeChild(tempDiv);
        pdfDownloaded = true;
      }

      if (pdfDownloaded) {
        showToast(`Invoice ${targetInvoice.invoiceNumber} PDF downloaded!`);
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
              onClick={() => handlePrint()}
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
                onClick={() => handlePrint()}
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
