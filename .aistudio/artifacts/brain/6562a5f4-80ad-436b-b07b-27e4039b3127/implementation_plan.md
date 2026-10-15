# Implementation Plan: Landing Page Mobile Navbar Optimization (Revised)

Refine the landing page top navigation bar so that the tagline subtitle under the logo is hidden **only on mobile viewports** (and preserved on desktop/tablet), while arranging the Log In, Start Free, and Install App buttons to fit without overlapping or horizontal overflow.

## User Review Required

> [!IMPORTANT]
> Revised specifications based on your feedback:
> 1. **Tagline Visibility**: The tagline *"Know Your Numbers, Grow Your Business"* is removed **only on mobile screens** (`< sm`) and remains fully visible on desktop and tablet (`sm:` and up).
> 2. **Mobile Button Arrangement**: Align "Log In" and "Start Free" with compact, touch-friendly padding (`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm`) and `whitespace-nowrap` to prevent awkward wrapping.
> 3. **Professional Install App Adjustment**: Format the Install App button to show a sleek, compact smartphone icon trigger on mobile (`variant="icon"` in a soft emerald badge) and the full button with text on desktop/tablet.
> 4. **No Horizontal Overlap**: Header container margins and flex layout configured with `overflow-x-hidden` and `gap-1.5 sm:gap-3` so all mobile screen sizes (360px–430px) display everything on one balanced line.

---

## Proposed Changes

### 1. MarketMateLogo Component (`src/components/common/MarketMateLogo.tsx`)
- Add `hideSubtitleOnMobile?: boolean` to `MarketMateLogoProps`.
- In the subtitle render block:
  - When `hideSubtitleOnMobile` is true, render with `hidden sm:block` so the subtitle is hidden strictly on mobile viewports and remains visible on tablet and desktop.

---

### 2. Landing Page Header (`src/components/landing/LandingPage.tsx`)
- In `<header>`:
  - Pass `showSubtitle={true}` and `hideSubtitleOnMobile={true}` to `<MarketMateLogo size="md" />`.
  - Wrap the logo container in `flex items-center min-w-0 shrink`.
  - Update the right-side action group:
    - **Install App Trigger**: On mobile, render a compact smartphone icon button (`w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80`); on desktop (`sm:block`), render the standard compact button with label.
    - **Log In Button**: `text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-2 sm:px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap`.
    - **Start Free Button**: `Button onClick={onStartFree} size="sm"` with `px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0`.
  - Container padding adjusted to `px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3`.

---

## Verification Plan

### Automated Build & Compilation
- Run `npm run build` and `tsc --noEmit` to ensure type safety and error-free compilation.

### Visual & Viewport Verification
- **Mobile Viewports (360px, 375px, 390px, 414px)**:
  - Verify that the tagline subtitle is hidden.
  - Verify that the logo, Install App icon, Log In, and Start Free buttons sit cleanly in a single horizontal row with zero overflow.
- **Desktop Viewport (>= 640px / 1024px)**:
  - Verify that the tagline *"Know Your Numbers, Grow Your Business"* is visible under the logo.
  - Verify that the full Install App button with label is shown.
