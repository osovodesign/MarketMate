# Implementation Plan: Official MarketMate Logo Integration

Integrate the official MarketMate logo (light and dark mode vector assets) across the entire application, maintaining exact identity, colors, and proportions across desktop, mobile, PWA manifests, and print documents.

## User Review Required

> [!IMPORTANT]
> The official logo geometry consists of:
> 1. **Light Mode**: White squircle background, emerald green shopping bag outline with growth arrow, and navy blue (`#07203B`) 4-column financial chart.
> 2. **Dark Mode**: Deep navy blue squircle background (`#07203B`), emerald green shopping bag outline with growth arrow, and crisp white (`#FFFFFF`) 4-column financial chart.
> 3. **Placement**: Emblem with MarketMate wordmark in desktop headers & sidebars; standalone emblem in mobile headers, app icons, and PWA assets; automatic theme matching across the app.

---

## Proposed Changes

### 1. Vector Emblem & Wordmark Component (`src/components/common/MarketMateLogo.tsx`)
- Update `MarketMateEmblem` with the exact vector geometry, curvature, and proportions from the uploaded official SVG logos:
  - Shopping bag handle arch and body outline in vibrant emerald/lime gradient (`#22c55e` to `#16a34a`).
  - Upward trendline breaking dynamically through the right shoulder with an arrowhead.
  - 4 vertical rounded financial bars:
    - **Light Mode**: Deep navy (`#07203B`).
    - **Dark Mode**: Solid white (`#FFFFFF`).
  - Squircle container: `#FFFFFF` with subtle border in light mode; `#07203B` in dark mode.
- Update `MarketMateLogo`:
  - Support `mode='full'` (Emblem + "MarketMate™" wordmark + optional subtitle).
  - Support `mode='icon'` (Standalone emblem for mobile headers, compact pills, favicons).
  - Support `variant='auto'` (automatically switches between light/dark mode using Tailwind dark class), `variant='light'`, and `variant='dark'`.

---

### 2. Standalone Public Assets & PWA Generation (`public/`)
- Save the exact SVGs in `public/`:
  - `public/logo-light.svg`
  - `public/logo-dark.svg`
  - `public/favicon.svg`
- Use a Node.js script with `sharp` to generate crisp, high-resolution PNGs from the official SVG vector:
  - `public/favicon.ico`
  - `public/pwa-192x192.png` (192×192)
  - `public/pwa-512x512.png` (512×512)
  - `public/pwa-maskable-512x512.png` (512×512 with safe area padding)
  - `public/apple-touch-icon.png` (180×180)

---

### 3. Application-Wide Logo Placements
- **Desktop Top Navigation & Sidebar**:
  - `src/components/dashboard/TopNavbar.tsx` & `Sidebar.tsx`: Ensure seamless emblem + wordmark rendering matching background.
- **Mobile Header & Navigation Drawer**:
  - Render standalone emblem icon in compact mobile headers and full logo in the mobile drawer.
- **Authentication Screens**:
  - `src/components/auth/Login.tsx` & `src/components/auth/Signup.tsx`: Showcase the official full logo above the authentication forms.
- **Landing Page**:
  - `src/components/landing/LandingPage.tsx`: Header navbar and footer branding.
- **Digital Receipts & Invoices**:
  - `src/components/invoices/InvoicePreviewModal.tsx`, `src/components/pos/POSReceiptModal.tsx`, and `src/components/sales/ReceiptModal.tsx`: Render clean, crisp light-mode vector emblem watermark on printed receipts and invoices.
- **Brand Asset Export Modal**:
  - `src/components/common/LogoExportModal.tsx`: Allow merchants and admins to preview and download both official light and dark vector SVG and PNG assets.

---

## Verification Plan

### Automated Build & Compilation
- Run `npm run build` to ensure all vector components and PWA assets compile without syntax or asset resolution errors.
- Run `tsc --noEmit` to verify strict TypeScript adherence.

### Manual Visual Verification
- Toggle between Light Mode and Dark Mode to verify automatic theme switching of the logo emblem (navy bars on white vs. white bars on navy).
- Verify desktop header, mobile header, PWA install prompt, and printed receipts display the new official logo cleanly without distortion.
