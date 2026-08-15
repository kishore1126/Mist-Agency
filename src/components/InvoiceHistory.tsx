import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Copy, Download, Printer, Trash2, Plus, ArrowUpDown, Filter, FileText } from 'lucide-react';
import { InvoiceData } from '../types/invoice';

interface InvoiceHistoryProps {
  onEdit: (invoice: InvoiceData) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownloadPdf: (invoice: InvoiceData) => void;
  onPrint: (invoice: InvoiceData) => void;
  onCreateNew: () => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  onEdit,
  onDuplicate,
  onDelete,
  onDownloadPdf,
  onPrint,
  onCreateNew
}) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'number' | 'amount'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/invoices?search=${encodeURIComponent(search)}&sortBy=${sortBy}`);
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, sortBy]);

  const handleDeleteConfirm = (id: string, number: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${number}? This action cannot be undone.`)) {
      onDelete(id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  return (
    <div className="bg-slate-800 text-slate-100 rounded-xl p-6 border border-slate-700 shadow-2xl space-y-6">
      
      {/* Header & New Invoice Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📂 Invoice History & Records
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage all created invoices. Search, edit, duplicate, print, or download PDFs anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Invoice
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #, customer name, date..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="number">Invoice Number</option>
            <option value="amount">Amount (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
          <p className="font-semibold text-sm text-slate-300">No invoices found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Try adjusting your search criteria.' : 'Create your first invoice to populate history!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-slate-300 border-b border-slate-700">
                <th className="p-3 font-semibold">Invoice No</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Customer / Buyer</th>
                <th className="p-3 font-semibold text-right">Total Amount</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-700/30 transition">
                  <td className="p-3 font-bold text-white font-mono">{inv.invoiceNumber}</td>
                  <td className="p-3 text-slate-300">{inv.invoiceDate}</td>
                  <td className="p-3 font-semibold text-slate-200">
                    {inv.buyer?.companyName || 'Cash Customer'}
                  </td>
                  <td className="p-3 text-right font-extrabold text-emerald-400">
                    ₹{Number(inv.summary?.totalAmountAfterTax || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                      inv.status === 'Cancelled' ? 'bg-red-950 text-red-300 border border-red-700' :
                      inv.status === 'Draft' ? 'bg-slate-700 text-slate-300 border border-slate-600' :
                      'bg-blue-950 text-blue-300 border border-blue-700'
                    }`}>
                      {inv.status || 'Issued'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(inv)}
                        className="p-1.5 bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white rounded transition"
                        title="Edit / View Invoice"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(inv.id!)}
                        className="p-1.5 bg-slate-700 hover:bg-amber-600 text-slate-200 hover:text-white rounded transition"
                        title="Duplicate Invoice"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadPdf(inv)}
                        className="p-1.5 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded transition"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrint(inv)}
                        className="p-1.5 bg-slate-700 hover:bg-purple-600 text-slate-200 hover:text-white rounded transition"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConfirm(inv.id!, inv.invoiceNumber)}
                        className="p-1.5 bg-slate-700 hover:bg-red-600 text-slate-200 hover:text-white rounded transition"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
