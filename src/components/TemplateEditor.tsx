import React, { useState } from 'react';
import { Save, RefreshCw, Upload, Image as ImageIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TemplateData } from '../types/invoice';

interface TemplateEditorProps {
  template: TemplateData;
  onSave: (updatedTemplate: TemplateData) => void;
  onReset: () => void;
  onCancel: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onReset,
  onCancel
}) => {
  const [formData, setFormData] = useState<TemplateData>(template);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof TemplateData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('logo', file);

    try {
      setIsUploading(true);
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        body: data
      });
      const result = await res.json();

      if (result.success && result.logoUrl) {
        setFormData(prev => ({ ...prev, logoUrl: result.logoUrl }));
      } else {
        alert(result.error || 'Failed to upload logo');
      }
    } catch (err: any) {
      alert(`Logo upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetConfirm = () => {
    if (window.confirm('Are you sure you want to reset the template to standard MIST AGENCIES defaults? All customized template changes will be reverted.')) {
      onReset();
    }
  };

  return (
    <div className="bg-slate-800 text-slate-100 rounded-xl p-6 border border-slate-700 shadow-2xl max-w-5xl mx-auto space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ⚙️ Edit Master Invoice Template
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Modify permanent business info, default bank accounts, default terms, and logo. All future invoices will automatically use this updated template.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-2 rounded-lg font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResetConfirm}
            className="text-xs bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
          >
            <Save className="w-4 h-4" />
            Save Master Template
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Master template saved successfully! All future invoices will use these settings.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BUSINESS INFORMATION & LOGO */}
        <div className="bg-slate-900/60 rounded-lg p-5 border border-slate-700/60 space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            🏢 Business Information & Branding
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => handleChange('companyName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Subtitle Banner</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={e => handleChange('subtitle', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Address Line 1</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={e => handleChange('addressLine1', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Address Line 2</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={e => handleChange('addressLine2', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone Number 1</label>
              <input
                type="text"
                value={formData.phone1}
                onChange={e => handleChange('phone1', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone Number 2</label>
              <input
                type="text"
                value={formData.phone2}
                onChange={e => handleChange('phone2', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={e => handleChange('gstin', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Logo Upload Box */}
          <div className="border-t border-slate-700/60 pt-4 flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Business Logo</label>
              <p className="text-[11px] text-slate-400">
                Upload custom logo or leave empty to use default vector MIST logo mark.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {formData.logoUrl && (
                <div className="w-16 h-12 bg-white rounded p-1 border border-slate-600 flex items-center justify-center">
                  <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-2 transition">
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? 'Uploading...' : formData.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => handleChange('logoUrl', '')}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: DEFAULT SHIPPED FROM LOCATION */}
        <div className="bg-slate-900/60 rounded-lg p-5 border border-slate-700/60 space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            🚚 Default "Shipped From" Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Shipped From Company Name</label>
              <input
                type="text"
                value={formData.shippedFromCompanyName}
                onChange={e => handleChange('shippedFromCompanyName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Shipped From GSTIN</label>
              <input
                type="text"
                value={formData.shippedFromGstin}
                onChange={e => handleChange('shippedFromGstin', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Shipped From Address</label>
              <input
                type="text"
                value={formData.shippedFromAddress}
                onChange={e => handleChange('shippedFromAddress', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">State</label>
              <input
                type="text"
                value={formData.shippedFromState}
                onChange={e => handleChange('shippedFromState', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BANK DETAILS */}
        <div className="bg-slate-900/60 rounded-lg p-5 border border-slate-700/60 space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            🏦 Master Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={e => handleChange('bankName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white font-semibold uppercase focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={e => handleChange('branch', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white uppercase focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNo}
                onChange={e => handleChange('accountNo', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc}
                onChange={e => handleChange('ifsc', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white font-mono uppercase focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: TERMS & CERTIFICATION */}
        <div className="bg-slate-900/60 rounded-lg p-5 border border-slate-700/60 space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            📜 Terms & Certification Declaration
          </h3>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Terms and Conditions Statement</label>
            <textarea
              rows={2}
              value={formData.terms}
              onChange={e => handleChange('terms', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Certified Declaration Statement</label>
            <input
              type="text"
              value={formData.certifiedStatement}
              onChange={e => handleChange('certifiedStatement', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

      </form>
    </div>
  );
};
