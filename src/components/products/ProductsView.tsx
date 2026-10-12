import React, { useState, useMemo } from 'react';
import {
  Package,
  PlusCircle,
  Search,
  Tag,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Calculator,
  Scan,
  Barcode,
  DollarSign,
  Lock,
  Shield,
  FileSpreadsheet,
  Download,
  Upload,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { Product, CurrencyCode } from '../../types';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { BulkProductImportModal } from './BulkProductImportModal';
import { hasPermission } from '../../lib/staffPermissions';

interface ProductsViewProps {
  onOpenAddSaleWithProduct?: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onOpenAddSaleWithProduct }) => {
  const { products, sales, deleteProduct, addProduct, updateProduct, currentSession } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const canShowCost = hasPermission(currentSession, 'showCostPrice');
  const canShowMargins = hasPermission(currentSession, 'showProfitAndMargins');
  const canAddProduct = hasPermission(currentSession, 'canEditProducts');
  const canEditProduct = hasPermission(currentSession, 'canEditProducts');

  const [search, setSearch] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Export current catalog to standard CSV format
  const handleExportCatalog = () => {
    if (products.length === 0) return;
    const headers =
      'Product Name,Category,Selling Price (NGN),Cost Price (NGN),Stock Quantity,Barcode / SKU,Low Stock Alert\n';
    const rows = products
      .map((p) => {
        const cleanName = `"${p.name.replace(/"/g, '""')}"`;
        const cleanCat = `"${(p.category || 'General').replace(/"/g, '""')}"`;
        const barcodeVal = `"${(p.barcode || p.sku || '').replace(/"/g, '""')}"`;
        return `${cleanName},${cleanCat},${p.defaultSellingPrice},${p.defaultCostPrice},${p.stockQuantity ?? 0},${barcodeVal},${p.lowStockThreshold || 5}`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${business?.businessName || 'MarketMate'}_Catalog_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [foreignCurrency, setForeignCurrency] = useState<CurrencyCode | ''>('');
  const [foreignCostPrice, setForeignCostPrice] = useState('');
  const [formError, setFormError] = useState('');

  // Performance calculation per product
  const productStats = useMemo(() => {
    const stats: Record<string, { totalSold: number; totalRevenue: number; totalProfit: number }> = {};
    
    sales.forEach((s) => {
      const pName = s.productName.toLowerCase();
      if (!stats[pName]) {
        stats[pName] = { totalSold: 0, totalRevenue: 0, totalProfit: 0 };
      }
      stats[pName].totalSold += s.quantity;
      stats[pName].totalRevenue += s.revenue;
      stats[pName].totalProfit += s.profit;
    });

    return stats;
  }, [sales]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [products, search]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setBarcode('');
    setCategory('');
    setSellingPrice('');
    setCostPrice('');
    setStockQuantity('');
    setLowStockThreshold('5');
    setForeignCurrency('');
    setForeignCostPrice('');
    setFormError('');
    setIsAddingProduct(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku || '');
    setBarcode(p.barcode || '');
    setCategory(p.category || '');
    setSellingPrice(p.defaultSellingPrice.toString());
    setCostPrice(p.defaultCostPrice.toString());
    setStockQuantity(p.stockQuantity !== undefined ? p.stockQuantity.toString() : '');
    setLowStockThreshold(p.lowStockThreshold !== undefined ? p.lowStockThreshold.toString() : '5');
    setForeignCurrency(p.foreignCurrency || '');
    setForeignCostPrice(p.foreignCostPrice !== undefined ? p.foreignCostPrice.toString() : '');
    setFormError('');
    setIsAddingProduct(true);
  };

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
      if (editingProduct) {
        if (updateProduct) {
          await updateProduct(editingProduct.id, {
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
      setIsAddingProduct(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    }
  };

  // Preview Unit Margin Calculation in Form
  const formSelling = parseFloat(sellingPrice) || 0;
  const formCost = parseFloat(costPrice) || 0;
  const formProfit = formSelling - formCost;
  const formMargin = formSelling > 0 ? (formProfit / formSelling) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Price Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Set standard unit costs, default selling prices, and track per-product profit margins.
          </p>
        </div>

        {canAddProduct && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsBulkImportOpen(true)}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 bg-white"
            >
              Bulk Import (Excel/CSV)
            </Button>
            {products.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleExportCatalog}
                leftIcon={<Download className="w-4 h-4 text-slate-600" />}
                className="hidden sm:inline-flex bg-white"
                title="Download current catalog as Excel/CSV"
              >
                Export CSV
              </Button>
            )}
            <Button
              type="button"
              onClick={handleOpenAdd}
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="shadow-xs"
            >
              + Add Product
            </Button>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="bg-white">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog Items</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {products.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Products & services configured</p>
        </Card>

        <Card padding="md" className="bg-emerald-50/60 border-emerald-200">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Average Catalog Margin</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-1">
            {canShowMargins ? (
              products.length > 0
                ? formatPercent(
                    products.reduce((sum, p) => {
                      const margin = p.defaultSellingPrice > 0 ? ((p.defaultSellingPrice - p.defaultCostPrice) / p.defaultSellingPrice) * 100 : 0;
                      return sum + margin;
                    }, 0) / products.length
                  )
                : '0%'
            ) : (
              <span className="flex items-center gap-1.5 text-lg font-mono text-emerald-700">
                <Lock className="w-4 h-4" />
                <span>Confidential</span>
              </span>
            )}
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            {canShowMargins ? 'Target profitability per item' : 'Restricted for current staff role'}
          </p>
        </Card>

        <Card padding="md" className="bg-white">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifetime Units Sold</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {sales.reduce((acc, s) => acc + s.quantity, 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across all recorded customer sales</p>
        </Card>
      </div>

      {/* Search Input */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>
      </div>

      {/* Add / Edit Product Modal or Slide-in Form */}
      {isAddingProduct && (
        <Card padding="lg" className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <div>
              <CardTitle>{editingProduct ? 'Edit Catalog Item' : 'Create New Catalog Item'}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Define cost and selling price to auto-calculate margins during sale recording
              </p>
            </div>
            <button
              onClick={() => setIsAddingProduct(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕ Close
            </button>
          </CardHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

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

            {/* Barcode & SKU Row with Camera Scanner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Barcode / QR Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 9847291038"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    title="Scan Barcode using Camera"
                  >
                    <Scan className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              <Input
                label="Stock Keeping Unit (SKU)"
                placeholder="e.g., KAF-BLU-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>

            {/* Inventory Quantity & Low Stock Threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current Stock Quantity (Optional)"
                type="number"
                placeholder="e.g. 50"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                helperText="Auto-deducts upon POS/sale checkout"
              />

              <Input
                label="Low Stock Warning Alert Threshold"
                type="number"
                placeholder="5"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                helperText="Highlights item when quantity is below this"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Cost Price (${currency})`}
                type="number"
                placeholder="e.g. 15000"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                helperText="How much it costs you to produce or buy in NGN"
              />

              <Input
                label={`Selling Price (${currency})`}
                type="number"
                placeholder="e.g. 25000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                helperText="Amount charged to the customer"
              />
            </div>

            {/* Cross-border Import Foreign Cost (Optional) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Cross-Border Import Sourcing (Optional):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Source Currency:
                  </label>
                  <select
                    value={foreignCurrency}
                    onChange={(e) => setForeignCurrency(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">None (Domestic Nigerian Sourcing)</option>
                    <option value="USD">USD ($) - United States Dollar</option>
                    <option value="CNY">CNY (¥) - Chinese Yuan</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                {foreignCurrency && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Supplier Price in {foreignCurrency}:
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 12.50"
                      value={foreignCostPrice}
                      onChange={(e) => setForeignCostPrice(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Instant Margin Preview Calculator */}
            {formSelling > 0 && (
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-800">Standard Margin Preview:</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    Unit Profit: <strong className="text-emerald-700 font-bold">{formatCurrency(formProfit, currency)}</strong>
                  </span>
                  <span>
                    Profit Margin: <strong className="text-emerald-700 font-bold">{formatPercent(formMargin)}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingProduct(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Barcode Scanner Modal for Product Form */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setBarcode(code);
        }}
        products={products}
      />

      {/* Catalog Table */}
      <Card padding="none" className="overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Item Name / Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-right">
                    {canShowCost ? 'Cost Price' : 'Cost (Shielded)'}
                  </th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  {canShowMargins && <th className="py-3 px-4 text-right">Unit Profit</th>}
                  {canShowMargins && <th className="py-3 px-4 text-right">Margin</th>}
                  <th className="py-3 px-4 text-center">Historical Sales</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((prod) => {
                  const profit = prod.defaultSellingPrice - prod.defaultCostPrice;
                  const margin =
                    prod.defaultSellingPrice > 0
                      ? (profit / prod.defaultSellingPrice) * 100
                      : 0;
                  const hist = productStats[prod.name.toLowerCase()] || {
                    totalSold: 0,
                    totalRevenue: 0,
                    totalProfit: 0,
                  };

                  const isLowStock =
                    prod.stockQuantity !== undefined &&
                    prod.stockQuantity <= (prod.lowStockThreshold || 5);

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                        {(prod.sku || prod.barcode) && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {prod.sku ? `SKU: ${prod.sku}` : ''}
                            {prod.sku && prod.barcode ? ' • ' : ''}
                            {prod.barcode ? `Barcode: ${prod.barcode}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {prod.category ? (
                          <Badge variant="neutral" size="sm">
                            {prod.category}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {prod.stockQuantity !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isLowStock
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {prod.stockQuantity} in stock
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-medium">
                        {canShowCost ? (
                          <>
                            {formatCurrency(prod.defaultCostPrice, currency)}
                            {prod.foreignCostPrice && prod.foreignCurrency && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                ({prod.foreignCurrency} {prod.foreignCostPrice})
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>••••••</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(prod.defaultSellingPrice, currency)}
                      </td>
                      {canShowMargins && (
                        <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                          +{formatCurrency(profit, currency)}
                        </td>
                      )}
                      {canShowMargins && (
                        <td className="py-3 px-4 text-right font-bold text-emerald-800">
                          {formatPercent(margin)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center text-slate-600">
                        <span className="font-semibold text-slate-800">{hist.totalSold}</span> units
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {canEditProduct ? (
                            <button
                              onClick={() => handleOpenEdit(prod)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5">
                              View Only
                            </span>
                          )}
                          {canEditProduct && deleteProduct && (
                            <button
                              onClick={() => deleteProduct(prod.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No items in catalog yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add standard products to speed up sale recording and track margins automatically.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkImportOpen(true)}
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              >
                Upload Excel / CSV (Bulk)
              </Button>
              <Button onClick={handleOpenAdd} size="sm">
                + Add Single Product
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bulk Product Import Modal */}
      <BulkProductImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
