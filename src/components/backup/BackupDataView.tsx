import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  FileJson,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { ProFeatureGate } from '../subscription/ProFeatureGate';

interface BackupDataViewProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

export const BackupDataView: React.FC<BackupDataViewProps> = ({
  onBack,
  onUpgrade,
}) => {
  const {
    exportAllDataJSON,
    importAllDataJSON,
    sales,
    expenses,
    products,
    debts,
    customers,
    suppliers,
    invoices,
  } = useBusinessData();
  const { business, isSubscribed } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadBackup = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (business?.businessName || 'marketmate_data')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `${safeName}_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportStatus({ type: null, message: '' });
      const text = await file.text();
      const result = await importAllDataJSON(text);
      if (result.success) {
        setImportStatus({ type: 'success', message: result.message });
      } else {
        setImportStatus({ type: 'error', message: result.message });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to read backup file.',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isSubscribed) {
    return (
      <ProFeatureGate
        title="Encrypted Data Backup & Vault"
        subtitle="Download complete offline backup snapshots and restore previous business ledgers safely to ensure your financial records are never lost."
        icon={Database}
        benefits={[
          'Export full business JSON ledger snapshots anytime',
          'Restore complete inventory, customer, sales, and debt databases',
          'Encrypted offline portability across any laptop, phone, or tablet',
          'Protection against device loss, data corruption, or hardware damage',
        ]}
        onUpgrade={onUpgrade}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Backup & Restore Vault
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-md">
                Data Security
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Download complete offline backup snapshots or restore previous business ledgers safely
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {importStatus.type && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-semibold ${
            importStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
          }`}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Current Database Summary */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            Current Store Ledger Records
          </p>
          <span className="text-[11px] font-medium text-slate-500">
            Store: <strong className="text-slate-800 dark:text-white">{business?.businessName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{sales.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">Sales</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{expenses.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">Expenses</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{products.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">Products</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {debts.length + invoices.length + customers.length + suppliers.length}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">
              CRM & Bills
            </p>
          </div>
        </div>
      </Card>

      {/* Export & Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backup Option */}
        <Card padding="lg" className="flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Export Full Backup File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Downloads a secure, self-contained JSON snapshot of all your sales, expenses, product catalog, invoices, customers, and credit ledgers.
            </p>
          </div>

          <Button
            onClick={handleDownloadBackup}
            variant="primary"
            className="w-full"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download Backup (.json)
          </Button>
        </Card>

        {/* Restore Option */}
        <Card padding="lg" className="flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Restore From Backup File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload a previously exported MarketMate `.json` backup file to restore your store records and transactions onto this device.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            isLoading={isImporting}
            className="w-full border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400"
            leftIcon={<FileJson className="w-4 h-4 text-slate-500" />}
          >
            Select Backup File (.json)
          </Button>
        </Card>
      </div>
    </div>
  );
};
