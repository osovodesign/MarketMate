# Dashboard First-Screen Financial Snapshot & Action Flow

Elevate the **Current Sales, Expenses, and Net Profit** snapshot to be the immediate, unencumbered focal point of MarketMate the moment a user logs in, followed directly by intuitive one-click navigation into recording sales and expenses.

## User Feedback & Strategic Rationale

> [!NOTE]
> Feedback from users highlights that merchants open their business management app with one primary objective: **to know their numbers first** before doing work.
> Seeing today's sales, expenses, and true take-home profit immediately upon login provides instant operational awareness and eliminates anxiety before recording subsequent sales.

---

## 1. Overview & Proposed Flow

1. **Top Financial Snapshot First**:
   - The three core performance cards (**Today's Sales**, **Operating Expenses**, and **Net Take-Home Profit**) sit at the very top of the viewport immediately below the header.
   - Zero visual clutter: Greeting text and quick-start guides are designed compactly so the three primary numbers are 100% visible above the fold on both mobile smartphones and desktop screens.
2. **Seamless Transition to Recording**:
   - Position prominent, high-contrast action buttons (**`+ Record Sale`** in emerald and **`+ Record Expense`** in subtle outline) directly attached to the financial summary.
   - When clicked, smoothly transitions into the dedicated full-page `RecordSaleView` or `RecordExpenseView`.
   - After saving, automatically returns back to the Dashboard, where the live numbers immediately tick up with fresh data and animated metric feedback.
3. **Role-Based Privacy by Default**:
   - **Store Owner & Manager**: Sees full sales revenue, operating expenses, gross margins, and take-home net profit.
   - **Cashier / Sales Clerk**: Sees today's counter sales volume and transaction count, while confidential cost prices, store expenses, and net profits remain masked with role-based security badges.

---

## 2. Visual & Architectural Improvements

### A. Layout Hierarchy on Dashboard (`DashboardView.tsx`)
```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header: Store Name • Cashier Profile • Quick Help                  │
├────────────────────────────────────────────────────────────────────────┤
│ Period Tabs: [ Today (Active) ] [ This Week ] [ This Month ]           │
├────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ │
│ │    TODAY'S SALES     │ │   TODAY'S EXPENSES   │ │ TAKE-HOME PROFIT │ │
│ │      ₦145,000        │ │       ₦18,500        │ │     ₦42,800      │ │
│ │   12 sales recorded  │ │   3 costs logged     │ │   29.5% margin   │ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ Quick Entry Strip:                                                     │
│   [ + Record New Sale ]               [ + Record Expense ]             │
├────────────────────────────────────────────────────────────────────────┤
│ Recent Activity • AI Recommendations • Financial Charts                │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Mobile Screen Ergonomics
- Ensure that on mobile viewport heights (375px–430px), the 3 cards and the Record buttons fit within the first visible screen without requiring any downward scroll.
- Convert the period selector into a streamlined segmented pill toggle.
- Add live subtle delta indicators (e.g., `+15% vs yesterday`) to give merchants immediate context on whether today's trade is pacing ahead or behind.

---

## 3. Technical Implementation Details

1. **`src/components/dashboard/DashboardView.tsx`**:
   - Reposition the period selector and core metric cards to the top of the content stream.
   - Tighten header padding and move the QuickStartGuide into a dismissible compact pill if still uncompleted.
   - Connect the primary action strip directly to `onOpenAddSale` and `onOpenAddExpense`.
2. **Real-time Recalculation Verification**:
   - Verify that upon returning from `RecordSaleView` and `RecordExpenseView`, the dashboard numbers update deterministically via `BusinessDataContext` without requiring manual refresh.
3. **Permissions Hardening**:
   - Ensure `canViewProfit` and `canViewExpenses` remain strictly enforced so staff log-ins respect owner confidentiality.

---

## 4. Verification & Testing

1. **Mobile & Desktop Viewport Testing**: Test screen layouts at 375px (iPhone SE), 390px (iPhone 14/15), and 1280px (Laptop).
2. **Navigation Loop**:
   - Log in -> Verify Dashboard displays Today's Sales, Expenses, and Profit above fold.
   - Click `+ Record Sale` -> Opens full-page `RecordSaleView`.
   - Save sale -> Returns to Dashboard -> Verify Today's Sales and Profit immediately reflect the new transaction.
3. **Build & Lint Verification**: Run `compile_applet` and `lint_applet` to ensure zero compilation or styling errors.
