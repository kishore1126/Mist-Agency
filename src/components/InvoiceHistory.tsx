import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Copy,
  Download,
  Printer,
  Trash2,
  Plus,
  ArrowUpDown,
  FileText,
  RefreshCw,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { InvoiceData } from '../types/invoice';

interface InvoiceHistoryProps {
  onEdit: (invoice: InvoiceData) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownloadPdf: (invoice: InvoiceData) => Promise<void> | void;
  onPrint: (invoice: InvoiceData) => void;
  onCreateNew: () => void;
}

interface StatsData {
  totalInvoices: number;
  totalRevenue: number;
  statusCounts: {
    Issued: number;
    Paid: number;
    Draft: number;
    Cancelled: number;
  };
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
  const [stats, setStats] = useState<StatsData | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'number' | 'amount'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInvoicesAndStats = async () => {
    try {
      setIsLoading(true);
      const [invRes, statsRes] = await Promise.all([
        fetch(`/api/invoices?search=${encodeURIComponent(search)}&sortBy=${sortBy}`),
        fetch('/api/invoices/stats')
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch invoice history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesAndStats();
  }, [search, sortBy]);

  const handleDownload = async (inv: InvoiceData) => {
    try {
      setDownloadingId(inv.id || inv.invoiceNumber);
      await onDownloadPdf(inv);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteConfirm = async (id: string, number: string) => {
    if (window.confirm(`Are you sure you want to permanently delete invoice "${number}"?\nThis will remove the record from the database.`)) {
      try {
        setDeletingId(id);
        await onDelete(id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        // Refresh stats
        const statsRes = await fetch('/api/invoices/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filter invoices by status
  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'all') return true;
    return (inv.status || 'Issued').toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-5 sm:p-7 border border-slate-800 shadow-2xl space-y-6">
      
      {/* Header & New Invoice Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              📂
            </span>
            Invoice Records & History Database
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            All created, issued, and drafted invoices are permanently stored in SQLite. Edit, download A4 PDFs, duplicate, or delete anytime.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchInvoicesAndStats}
            disabled={isLoading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Create New Invoice
          </button>
        </div>
      </div>

      {/* STATS SUMMARY METRIC CARDS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Invoices</p>
              <p className="text-xl font-bold text-white mt-0.5">{stats.totalInvoices}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                ₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Issued Invoices</p>
              <p className="text-xl font-bold text-blue-300 mt-0.5">{stats.statusCounts.Issued || 0}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Paid Invoices</p>
              <p className="text-xl font-bold text-emerald-300 mt-0.5">{stats.statusCounts.Paid || 0}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* SEARCH, STATUS FILTER & SORT CONTROLS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by invoice number, customer company, date..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Status Filter & Sort Options */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700/70 text-xs">
            {['all', 'Issued', 'Paid', 'Draft', 'Cancelled'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700/70">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-800">Newest Created</option>
              <option value="oldest" className="bg-slate-800">Oldest Created</option>
              <option value="number" className="bg-slate-800">Invoice Number</option>
              <option value="amount" className="bg-slate-800">Amount (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* INVOICE LIST TABLE */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading invoices from database...</span>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto opacity-70" />
          <div>
            <p className="font-semibold text-sm text-slate-300">No invoices found</p>
            <p className="text-xs text-slate-500 mt-1">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Create and save your first tax invoice to start recording history!'}
            </p>
          </div>
          {search || statusFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="text-xs text-blue-400 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" /> Create Invoice Now
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-300 border-b border-slate-800">
                <th className="p-3.5 font-bold uppercase tracking-wider">Invoice No</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Date</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Customer / Buyer</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-right">Total Amount</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-center">Status</th>
                <th className="p-3.5 font-bold uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {filteredInvoices.map(inv => {
                const isDownloading = downloadingId === (inv.id || inv.invoiceNumber);
                const isDeleting = deletingId === inv.id;

                return (
                  <tr key={inv.id || inv.invoiceNumber} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {inv.invoiceNumber}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">
                      {inv.invoiceDate}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">
                      <div>
                        <p>{inv.buyer?.companyName || 'Cash Customer'}</p>
                        {inv.buyer?.gstin && (
                          <p className="text-[10px] text-slate-400 font-mono font-normal">
                            GSTIN: {inv.buyer.gstin}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-emerald-400 text-sm">
                      ₹{Number(inv.summary?.totalAmountAfterTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                          : inv.status === 'Cancelled'
                          ? 'bg-red-950/80 text-red-300 border-red-600/60'
                          : inv.status === 'Draft'
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-blue-950/80 text-blue-300 border-blue-600/60'
                      }`}>
                        {inv.status || 'Issued'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => onEdit(inv)}
                          className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition"
                          title="Edit Invoice Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* DOWNLOAD PDF BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDownload(inv)}
                          disabled={isDownloading}
                          className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition disabled:opacity-50"
                          title="Download A4 PDF"
                        >
                          {isDownloading ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* DUPLICATE BUTTON */}
                        <button
                          type="button"
                          onClick={() => onDuplicate(inv.id!)}
                          className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition"
                          title="Duplicate as New Invoice"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* PRINT BUTTON */}
                        <button
                          type="button"
                          onClick={() => onPrint(inv)}
                          className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition"
                          title="Print Direct"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDeleteConfirm(inv.id!, inv.invoiceNumber)}
                          disabled={isDeleting}
                          className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition disabled:opacity-50"
                          title="Delete from Database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER RECORD COUNT */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
        <span>Showing {filteredInvoices.length} of {invoices.length} total invoice records</span>
        <span>SQLite persistent storage active &bull; Auto-synced</span>
      </div>

    </div>
  );
};
