import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  Clipboard,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useBusinessData } from '../../context/BusinessDataContext';

interface BulkProductImportViewProps {
  onBack: () => void;
  onSuccess?: (count: number) => void;
}

interface ParsedProductRow {
  name: string;
  category: string;
  defaultSellingPrice: number;
  defaultCostPrice: number;
  stockQuantity: number;
  barcode: string;
  sku: string;
  lowStockThreshold: number;
  isValid: boolean;
  error?: string;
  marginPercent?: number;
}

export const BulkProductImportView: React.FC<BulkProductImportViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { bulkAddProducts } = useBusinessData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [updateExisting, setUpdateExisting] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ added: number; updated: number } | null>(
    null
  );

  const handleDownloadTemplate = () => {
    const csvContent =
      'Product Name,Category,Selling Price (NGN),Cost Price (NGN),Stock Quantity,Barcode / SKU,Low Stock Alert\n' +
      'Nike Air Force 1 Black,Footwear,38000,25000,15,012345678901,5\n' +
      'Original Swiss Lace 5 Yards,Textiles,55000,38000,8,012345678902,3\n' +
      'Boutique Silk Shirt (L),Apparel,18500,12000,24,012345678903,5\n' +
      'Arabian Oud Perfume 100ml,Cosmetics,28000,17500,12,012345678904,4\n' +
      'Golden Penny Rice 50kg,Foodstuffs,72000,64000,20,012345678905,6\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MarketMate_Bulk_Products_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const splitLine = (text: string, delimiter: string): string[] => {
    if (delimiter === '\t') {
      return text.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    }
    const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push((match[1] || match[2] || '').trim());
    }
    return matches.length > 0 ? matches : text.split(delimiter);
  };

  const parseRawContent = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }

    const firstLine = lines[0];
    const isTab = firstLine.includes('\t');
    const delimiter = isTab ? '\t' : ',';

    const headers = splitLine(firstLine, delimiter).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    const findIndex = (aliases: string[]) =>
      headers.findIndex((h) => aliases.some((a) => h.includes(a)));

    const nameIdx = findIndex(['name', 'title', 'item', 'product']);
    const catIdx = findIndex(['cat', 'department', 'group']);
    const sellIdx = findIndex(['sell', 'price', 'retail']);
    const costIdx = findIndex(['cost', 'wholesale', 'buy', 'supply']);
    const qtyIdx = findIndex(['qty', 'stock', 'quantity', 'count']);
    const barcodeIdx = findIndex(['barcode', 'sku', 'code', 'upc']);
    const threshIdx = findIndex(['alert', 'thresh', 'low', 'reorder']);

    const results: ParsedProductRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i], delimiter);
      if (cols.length === 0 || !cols.some((c) => c.trim())) continue;

      const rawName = nameIdx !== -1 ? cols[nameIdx] || '' : cols[0] || '';
      const rawCat = catIdx !== -1 ? cols[catIdx] || '' : '';
      const rawSell = sellIdx !== -1 ? cols[sellIdx] || '0' : '0';
      const rawCost = costIdx !== -1 ? cols[costIdx] || '0' : '0';
      const rawQty = qtyIdx !== -1 ? cols[qtyIdx] || '0' : '0';
      const rawBarcode = barcodeIdx !== -1 ? cols[barcodeIdx] || '' : '';
      const rawThresh = threshIdx !== -1 ? cols[threshIdx] || '5' : '5';

      const cleanSell = parseFloat(rawSell.replace(/[^0-9.]/g, '')) || 0;
      const cleanCost = parseFloat(rawCost.replace(/[^0-9.]/g, '')) || 0;
      const cleanQty = parseInt(rawQty.replace(/[^0-9]/g, ''), 10) || 0;
      const cleanThresh = parseInt(rawThresh.replace(/[^0-9]/g, ''), 10) || 5;

      const isValid = Boolean(rawName.trim()) && cleanSell > 0;
      let error = '';
      if (!rawName.trim()) error = 'Missing product name';
      else if (cleanSell <= 0) error = 'Missing or invalid selling price';

      const marginPercent =
        cleanSell > 0 && cleanCost > 0
          ? Math.round(((cleanSell - cleanCost) / cleanSell) * 100)
          : undefined;

      results.push({
        name: rawName.trim(),
        category: rawCat.trim() || 'General',
        defaultSellingPrice: cleanSell,
        defaultCostPrice: cleanCost,
        stockQuantity: cleanQty,
        barcode: rawBarcode.trim(),
        sku: rawBarcode.trim(),
        lowStockThreshold: cleanThresh,
        isValid,
        error,
        marginPercent,
      });
    }

    setParsedRows(results);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseRawContent(content);
      }
    };
    reader.readAsText(file);
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) return;
    setFileName('Pasted Spreadsheet Data');
    parseRawContent(pastedText);
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      const result = await bulkAddProducts(validRows, updateExisting);
      setImportSummary({ added: result.addedCount, updated: result.updatedCount });
      onSuccess?.(result.addedCount + result.updatedCount);
    } catch (err) {
      console.error('Failed to bulk import products:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const totalValuation = parsedRows.reduce(
    (sum, r) => sum + (r.isValid ? r.defaultCostPrice * r.stockQuantity : 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bulk Import Products from Excel / CSV
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Upload hundreds of products, barcodes, and stock levels in seconds
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Download Template Callout */}
      <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Step 1: Download Standard Product Template</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Formatted with Name, Category, Cost Price, Selling Price, Quantity &amp; Barcode columns.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="shrink-0 bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
          leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
        >
          Download Sample CSV (.csv)
        </Button>
      </div>

      <Card padding="lg" className="space-y-6">
        {/* Step 2: Upload or Paste Selection */}
        {!importSummary && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Step 2: Provide Your Spreadsheet Data
              </span>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'file'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload CSV / Excel
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'paste'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Paste from Excel
                </button>
              </div>
            </div>

            {inputMode === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Upload className="w-9 h-9 text-slate-400 group-hover:text-emerald-600 mx-auto mb-2.5 transition-colors" />
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {fileName ? fileName : 'Click to select or drag & drop CSV file here'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports .CSV, .TSV and Tab-Delimited spreadsheet exports (up to 5,000 items)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={7}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Select your products in Excel or Google Sheets, copy them (Ctrl+C), and paste directly here..."
                  className="w-full p-3.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleParsePasted}
                    disabled={!pastedText.trim()}
                    leftIcon={<Clipboard className="w-3.5 h-3.5" />}
                  >
                    Parse &amp; Preview Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview & Validation Table */}
        {parsedRows.length > 0 && !importSummary && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Preview &amp; Audit:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ {validCount} Valid Products
                </span>
                {invalidCount > 0 && (
                  <span className="font-bold text-rose-700 dark:text-rose-400">
                    · ⚠ {invalidCount} Skipped (Missing Name/Price)
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                Batch Valuation: <strong>₦{totalValuation.toLocaleString()}</strong>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800 sticky top-0 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Status</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Cost (₦)</th>
                    <th className="p-3 text-right">Selling (₦)</th>
                    <th className="p-3 text-center">Margin</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3">Barcode / SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedRows.slice(0, 25).map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.isValid
                          ? 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                          : 'bg-rose-50/50 dark:bg-rose-950/30'
                      }
                    >
                      <td className="p-3">
                        {row.isValid ? (
                          <span className="text-emerald-600 font-bold text-[11px]">✓ Ready</span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[11px]" title={row.error}>
                            ⚠ {row.error}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white max-w-[160px] truncate">
                        {row.name}
                      </td>
                      <td className="p-3 text-slate-500">{row.category}</td>
                      <td className="p-3 text-right font-mono">
                        {row.defaultCostPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {row.defaultSellingPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {row.marginPercent !== undefined ? (
                          <span
                            className={`font-bold ${
                              row.marginPercent >= 25
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {row.marginPercent}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold">{row.stockQuantity}</td>
                      <td className="p-3 font-mono text-slate-500">{row.barcode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedRows.length > 25 && (
              <p className="text-[11px] text-center text-slate-400">
                Showing first 25 of {parsedRows.length} total rows. All valid items will be imported.
              </p>
            )}

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  Update existing products if Barcode or SKU matches an item already in your store
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Success Summary View */}
        {importSummary && (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Bulk Import Completed Successfully!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              <strong>{importSummary.added}</strong> new products added to your catalog, and{' '}
              <strong>{importSummary.updated}</strong> existing items updated. They are now
              available for barcode scanning and POS sales!
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            {importSummary ? 'Back to Catalog' : 'Cancel'}
          </Button>

          {!importSummary && (
            <Button
              type="button"
              disabled={validCount === 0 || isImporting}
              isLoading={isImporting}
              onClick={handleConfirmImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm &amp; Import {validCount} Products
            </Button>
          )}

          {importSummary && (
            <Button
              type="button"
              onClick={onBack}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Done &amp; View Inventory
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
