import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, ZapOff, AlertCircle, Search, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string, matchedProduct?: Product) => void;
  products?: Product[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  products = [],
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'marketmate-barcode-reader';

  // Find product by code
  const findProduct = (code: string): Product | undefined => {
    const clean = code.trim().toLowerCase();
    return products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        (p.sku && p.sku.toLowerCase() === clean)
    );
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setManualCode('');
      setCameraError(null);
      setMatchedProduct(null);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        setIsScanning(true);

        // Small delay to ensure DOM element is mounted
        await new Promise((r) => setTimeout(r, 200));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.333,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleCodeDetected(decodedText);
          },
          () => {
            // Ignore frame parse errors while searching for barcode
          }
        );
      } catch (err: any) {
        console.warn('Barcode camera start warning:', err);
        setCameraError(
          'Could not access camera or camera permission was not granted. You can type or paste the barcode/SKU below.'
        );
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // Safe catch on cleanup
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const handleCodeDetected = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Play subtle audio beep if supported
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context not allowed or unsupported
    }

    const matched = findProduct(trimmed);
    setMatchedProduct(matched || null);
    onScanSuccess(trimmed, matched);
    stopScanner();
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode);
  };

  const toggleTorch = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn } as any],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Torch not supported on this device/browser');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Barcode & QR Scanner</h2>
              <p className="text-[11px] text-slate-500">Scan product packaging or shelf tags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center overflow-y-auto">
          {cameraError ? (
            <div className="w-full p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Camera Access Notice</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">{cameraError}</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-[320px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner aspect-[4/3] flex items-center justify-center">
              <div id={readerElementId} className="w-full h-full" />
              
              {/* Overlay targeting guidelines */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-28 border-2 border-emerald-400/80 rounded-lg relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500/70 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                </div>
              </div>

              {/* Torch Toggle if available */}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="p-1.5 rounded-md bg-slate-900/80 text-white hover:bg-slate-800 text-xs flex items-center gap-1 backdrop-blur-xs"
                  title="Toggle Light"
                >
                  {torchOn ? <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <ZapOff className="w-3.5 h-3.5 text-slate-300" />}
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 text-center mt-3">
            Supports Standard EAN-13, UPC-A, Code-128, and QR Codes.
          </p>

          {/* Quick Demo Barcodes to try */}
          <div className="w-full mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Test Barcodes in Catalog:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {products
                .filter((p) => p.barcode || p.sku)
                .slice(0, 4)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleCodeDetected(p.barcode || p.sku || '')}
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded-md font-mono text-slate-700 transition-colors flex items-center gap-1"
                  >
                    <span>{p.name.slice(0, 14)}...</span>
                    <span className="text-slate-400 font-bold">({p.barcode || p.sku})</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Manual Barcode / SKU entry fallback */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or type/paste barcode or SKU..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
