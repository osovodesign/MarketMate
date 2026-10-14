/**
 * High-Precision POS Thermal & Document Print Engine
 * Isolates printable receipts into a dedicated print document so that modals,
 * dark overlays, navigation bars, and buttons NEVER leak into the printout.
 */

export interface PrintOptions {
  title?: string;
  width?: string; // e.g. '80mm', '58mm', or '320px'
}

export const printThermalReceipt = (
  elementIdOrElement: string | HTMLElement,
  options: PrintOptions = {}
): Promise<boolean> => {
  return new Promise((resolve) => {
    const targetElement =
      typeof elementIdOrElement === 'string'
        ? document.getElementById(elementIdOrElement)
        : elementIdOrElement;

    if (!targetElement) {
      console.warn(`Print target element not found:`, elementIdOrElement);
      // Fallback
      window.print();
      resolve(false);
      return;
    }

    // Clone target node to prevent altering DOM
    const clonedElement = targetElement.cloneNode(true) as HTMLElement;

    // Create an invisible iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.id = 'marketmate-print-frame';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      resolve(false);
      return;
    }

    const printWidth = options.width || '80mm';
    const documentTitle = options.title || 'MarketMate Receipt';

    // Build the isolated thermal receipt document
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle}</title>
          <style>
            @page {
              size: ${printWidth} auto;
              margin: 0;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 100%;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace;
              font-size: 11px;
              line-height: 1.35;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              display: flex;
              justify-content: center;
              padding: 6mm 4mm;
            }
            .receipt-print-wrapper {
              width: 100%;
              max-width: ${printWidth};
              margin: 0 auto;
            }
            /* Clean black text and sharp dividers for thermal heads */
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .font-mono { font-family: "Courier New", Courier, monospace; }
            .uppercase { text-transform: uppercase; }
            .truncate {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .border-dashed {
              border-bottom: 1px dashed #000000 !important;
              margin: 6px 0;
            }
            .border-double {
              border-bottom: 3px double #000000 !important;
              margin: 8px 0;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            /* Suppress shadows and borders for thermal paper */
            .shadow-2xs, .shadow-xs, .shadow-sm, .shadow-md, .shadow-lg, .shadow-2xl {
              box-shadow: none !important;
            }
            .bg-slate-50, .bg-slate-100, .bg-emerald-50, .bg-white {
              background-color: transparent !important;
            }
            /* Ensure tabular figures align vertically */
            .tabular-nums {
              font-variant-numeric: tabular-nums;
            }
          </style>
        </head>
        <body>
          <div class="receipt-print-wrapper">
            ${clonedElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Wait for images to load before printing
    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve(true);
      } catch (err) {
        console.error('Print execution error:', err);
        window.print();
        resolve(false);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    };

    // If there are images (like the merchant's logo), ensure they are loaded
    const images = doc.images;
    if (images.length === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      let loadedCount = 0;
      const totalImages = images.length;
      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          triggerPrint();
        }
      };

      for (let i = 0; i < totalImages; i++) {
        const img = images[i];
        if (img.complete) {
          onImageLoad();
        } else {
          img.onload = onImageLoad;
          img.onerror = onImageLoad;
        }
      }

      // Timeout fallback in case an image hangs
      setTimeout(triggerPrint, 800);
    }
  });
};
