import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { ProFeatureGate } from '../subscription/ProFeatureGate';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  FileJson,
  ShieldCheck,
} from 'lucide-react';

interface BackupDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const BackupDataModal: React.FC<BackupDataModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  const { exportAllDataJSON, importAllDataJSON, sales, expenses, products, debts } = useBusinessData();
  const { business, user, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();
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
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ProFeatureGate
          mode="modal"
          title="Encrypted Data Backup & Vault"
          subtitle="Download complete offline backup snapshots and restore previous business ledgers safely to ensure your financial records are never lost."
          icon={Database}
          benefits={[
            'Export full business JSON ledger snapshots anytime',
            'Restore complete inventory, customer, sales, and debt databases',
            'Encrypted offline portability across any laptop, phone, or tablet',
            'Protection against device loss, data corruption, or hardware damage',
          ]}
          onUpgrade={() => {
            onClose();
            onUpgrade?.();
          }}
          onBack={onClose}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Data Backup & Restore Vault"
      description="Download complete offline backup snapshots or restore previous business ledgers safely"
      size="md"
    >
      <div className="space-y-5 pt-2">
        {/* Status Message */}
        {importStatus.type && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Current Database Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-700" />
            Current Store Data Summary
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-white rounded-xl border border-slate-200/80">
              <p className="text-base font-extrabold text-slate-900">{sales.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Sales</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200/80">
              <p className="text-base font-extrabold text-slate-900">{expenses.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Expenses</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200/80">
              <p className="text-base font-extrabold text-slate-900">{products.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Products</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200/80">
              <p className="text-base font-extrabold text-slate-900">{debts.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Credit/Debts</p>
            </div>
          </div>
        </div>

        {/* Backup Option */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Export Full Backup File
              </p>
              <p className="text-xs text-slate-500">
                Downloads a secure, self-contained JSON snapshot of all your sales, expenses, catalog, and debts.
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadBackup}
            variant="primary"
            className="w-full"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download Backup (.json)
          </Button>
        </div>

        {/* Restore Option */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-amber-600" />
              Restore From Backup File
            </p>
            <p className="text-xs text-slate-500">
              Upload a previously exported backup file to restore your transactions on this device.
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
            className="w-full border-dashed border-slate-300 hover:border-slate-400"
            leftIcon={<FileJson className="w-4 h-4 text-slate-500" />}
          >
            Select Backup File (.json) to Restore
          </Button>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
