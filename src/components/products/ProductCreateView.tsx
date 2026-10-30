import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Scan,
  Calculator,
  CheckCircle2,
  Globe,
  Tag,
  Layers,
} from 'lucide-react';
import { Product, CurrencyCode } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';

interface ProductCreateViewProps {
  onBack: () => void;
  onSuccess: () => void;
  initialProduct?: Product | null;
}

export const ProductCreateView: React.FC<ProductCreateViewProps> = ({
  onBack,
  onSuccess,
  initialProduct,
}) => {
  const { addProduct, updateProduct } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');
  const [category, setCategory] = useState(initialProduct?.category || '');
  const [sellingPrice, setSellingPrice] = useState(
    initialProduct ? initialProduct.defaultSellingPrice.toString() : ''
  );
  const [costPrice, setCostPrice] = useState(
    initialProduct ? initialProduct.defaultCostPrice.toString() : ''
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct?.stockQuantity !== undefined ? initialProduct.stockQuantity.toString() : ''
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialProduct?.lowStockThreshold !== undefined ? initialProduct.lowStockThreshold.toString() : '5'
  );
  const [foreignCurrency, setForeignCurrency] = useState<CurrencyCode | ''>(
    initialProduct?.foreignCurrency || ''
  );
  const [foreignCostPrice, setForeignCostPrice] = useState(
    initialProduct?.foreignCostPrice !== undefined ? initialProduct.foreignCostPrice.toString() : ''
  );

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setSku(initialProduct.sku || '');
      setBarcode(initialProduct.barcode || '');
      setCategory(initialProduct.category || '');
      setSellingPrice(initialProduct.defaultSellingPrice.toString());
      setCostPrice(initialProduct.defaultCostPrice.toString());
      setStockQuantity(
        initialProduct.stockQuantity !== undefined ? initialProduct.stockQuantity.toString() : ''
      );
      setLowStockThreshold(
        initialProduct.lowStockThreshold !== undefined
          ? initialProduct.lowStockThreshold.toString()
          : '5'
      );
      setForeignCurrency(initialProduct.foreignCurrency || '');
      setForeignCostPrice(
        initialProduct.foreignCostPrice !== undefined
          ? initialProduct.foreignCostPrice.toString()
          : ''
      );
    }
  }, [initialProduct]);

  const formSelling = parseFloat(sellingPrice) || 0;
  const formCost = parseFloat(costPrice) || 0;
  const formProfit = formSelling - formCost;
  const formMargin = formSelling > 0 ? (formProfit / formSelling) * 100 : 0;

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a valid product or service name.');
      return;
    }

    const sp = parseFloat(sellingPrice) || 0;
    const cp = parseFloat(costPrice) || 0;

    if (sp <= 0) {
      setFormError('Default selling price must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      if (initialProduct) {
        if (updateProduct) {
          await updateProduct(initialProduct.id, {
            name: name.trim(),
            sku: sku.trim() || undefined,
            barcode: barcode.trim() || undefined,
            category: category.trim() || undefined,
            defaultSellingPrice: sp,
            defaultCostPrice: cp,
            stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : undefined,
            lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : undefined,
            foreignCurrency: foreignCurrency || undefined,
            foreignCostPrice: foreignCostPrice ? parseFloat(foreignCostPrice) : undefined,
          });
        }
      } else {
        if (addProduct) {
          await addProduct({
            name: name.trim(),
            sku: sku.trim() || undefined,
            barcode: barcode.trim() || undefined,
            category: category.trim() || undefined,
            defaultSellingPrice: sp,
            defaultCostPrice: cp,
            stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : undefined,
            lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : undefined,
            foreignCurrency: foreignCurrency || undefined,
            foreignCostPrice: foreignCostPrice ? parseFloat(foreignCostPrice) : undefined,
          });
        }
      }

      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {initialProduct ? 'Edit Catalog Item' : 'Add Catalog Product'}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-md">
                Inventory
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Define unit cost, default selling price, and stock levels to automate profit margins
            </p>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSaveProduct} className="space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Product Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product / Item Name"
              placeholder="e.g., Silk Kaftan, Delivery Packaging, 20L Fuel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Category / Tag (Optional)"
              placeholder="e.g., Ready-to-Wear, Men, Accessories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {/* Pricing & Margin Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Unit Cost Price (${currency})`}
              type="number"
              step="any"
              placeholder="e.g. 15000"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              helperText="How much it costs you to produce or buy per unit"
            />

            <Input
              label={`Default Selling Price (${currency})`}
              type="number"
              step="any"
              placeholder="e.g. 25000"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
              helperText="Standard price charged to customers at checkout"
            />
          </div>

          {/* Instant Margin Preview Calculator */}
          {formSelling > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Live Unit Profit & Margin Preview:
                </span>
              </div>
              <div className="flex items-center gap-5">
                <span>
                  Unit Profit:{' '}
                  <strong
                    className={`font-extrabold ${
                      formProfit >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(formProfit, currency)}
                  </strong>
                </span>
                <span>
                  Profit Margin:{' '}
                  <strong
                    className={`font-extrabold ${
                      formMargin >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatPercent(formMargin)}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Inventory Quantity & Low Stock Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Input
              label="Current Stock Quantity (Optional)"
              type="number"
              placeholder="e.g. 50"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              helperText="Automatically deducts upon POS & sale checkout"
            />

            <Input
              label="Low Stock Warning Alert Threshold"
              type="number"
              placeholder="5"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              helperText="Alerts you when remaining stock drops to or below this level"
            />
          </div>

          {/* Barcode & SKU Row with Camera Scanner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Barcode / QR Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 9847291038"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  title="Scan Barcode using Camera"
                >
                  <Scan className="w-4 h-4 text-emerald-600" />
                  <span>Scan</span>
                </button>
              </div>
            </div>

            <Input
              label="Stock Keeping Unit / SKU (Optional)"
              placeholder="e.g., KAF-BLU-01"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          {/* Cross-border Import Foreign Cost (Optional) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Cross-Border Import Sourcing (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Source Currency:
                </label>
                <select
                  value={foreignCurrency}
                  onChange={(e) => setForeignCurrency(e.target.value as any)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="">None (Domestic Sourcing)</option>
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="CNY">CNY (¥) - Chinese Yuan</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              {foreignCurrency && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Supplier Unit Price in {foreignCurrency}:
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 12.50"
                    value={foreignCostPrice}
                    onChange={(e) => setForeignCostPrice(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {initialProduct ? 'Save Product Changes' : 'Create Catalog Product'}
            </Button>
          </div>
        </form>
      </Card>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scan Item Barcode to Catalog"
        onScanSuccess={(decodedCode) => {
          setBarcode(decodedCode);
        }}
      />
    </div>
  );
};
