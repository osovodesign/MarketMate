# MarketMate --- Multi-Product Sales Recording Upgrade

## Phase-by-Phase Build Specification for Google AI Studio

**Feature:** Record multiple products in one customer transaction.\
**Goal:** Upgrade MarketMate's existing Record Sale/POS workflow so a
merchant can add one or many products to a single sale, complete
checkout once, and let MarketMate calculate totals, update stock and
preserve product-level reporting.

------------------------------------------------------------------------

## Instructions to Google AI Studio

You are modifying the existing MarketMate application. This is an
enhancement, not a new application.

Before coding, inspect the actual project and adapt this specification
to its existing architecture. Reuse existing components, data models,
authentication, database, styling and business logic wherever
appropriate.

-   Do not rebuild the application.
-   Do not replace the current backend or database.
-   Do not break existing single-product sales, historical records,
    reports, receipts, customers, inventory or staff permissions.
-   Do not add unrelated features or redesign unrelated screens.
-   Do not assume suggested field names match the existing code. Inspect
    first.
-   Work one phase at a time. Complete the requested phase, run checks,
    report changed files and issues, then stop for approval before
    continuing.
-   Never modify production data or deploy without explicit
    authorization.

The repository was previously observed to use React, TypeScript, Vite,
Firebase Authentication and Cloud Firestore, with a Node/Express
backend. Verify the current project before relying on this. The existing
POS checkout logic has previously been observed to save a sale and
deduct stock; inspect it carefully before changing it.

## The problem

A merchant may have one customer buy several products in a single visit,
for example:

  Product           Quantity   Unit price     Line total
  ------------ ------------- ------------ --------------
  Shoes                    2      ₦25,000        ₦50,000
  Clothes                  3      ₦15,000        ₦45,000
  Sunglasses               1       ₦8,000         ₦8,000
  Socks                    2       ₦3,000         ₦6,000
  **Total**      **8 units**                **₦109,000**

The merchant should select the customer, add all products, adjust
quantities, review one combined total and complete one sale. They should
not have to create a separate sale for each product.

**Core principle: One customer checkout = one sale transaction = one or
more sale items.**

The same workflow must support a sale containing just one product.

------------------------------------------------------------------------

# Phase 0 --- Inspect the existing application (no code changes)

### Tasks

1.  Inspect the current Record Sale/POS screens and trace the complete
    checkout flow.
2.  Inspect Sale, Product and Customer models/types.
3.  Inspect the database structure and existing historical sale records.
4.  Trace stock deduction and determine whether it is atomic.
5.  Inspect payment methods, discounts, taxes, fees and partial-payment
    behaviour already supported.
6.  Inspect customer purchase history, receipts and invoices.
7.  Identify every dashboard and report calculation that depends on
    sales.
8.  Inspect authentication, business ownership checks, staff roles and
    database security rules.
9.  Identify files/components/functions that need modification.
10. Determine how legacy single-product sales can remain compatible.

### Deliverable

Return an implementation map listing relevant files, current data
structures, checkout sequence, inventory logic, affected reports, risks
and the smallest safe implementation approach.

### Acceptance criteria

-   No code or database changes.
-   Findings are based on the actual repository.
-   Unknowns and risks are stated clearly.

**Stop and request approval before Phase 1.**

------------------------------------------------------------------------

# Phase 1 --- Build the multi-product sales interface

### Goal

Upgrade the existing Record Sale/POS experience to allow multiple
products in one sale.

### Customer

-   Reuse the existing customer selector.
-   Allow selection of an existing customer.
-   Preserve the existing walk-in/guest option if supported.
-   Do not create duplicate customer records.
-   Do not make customer selection mandatory if anonymous sales are
    currently supported.

### Product selection

-   Reuse the existing product catalogue and search.
-   Support the search methods already available, such as product name,
    SKU or barcode.
-   Allow the merchant to add multiple products to one sale.
-   If the same product is selected again, preferably increase its
    existing line quantity rather than creating confusing duplicate
    lines.
-   Show product name, selling price and relevant stock availability.
-   Never expose cost price to staff who are not authorized to see it.

### Sale item list

Each line should show: - Product name. - Quantity control. - Unit
selling price. - Line total. - Remove-item action.

The merchant must be able to change quantities, remove products, add
more products and edit selling prices only where existing business rules
and permissions allow it.

### Totals and checkout

-   Display total units and combined sale amount.
-   Preserve existing payment method selection and required checkout
    fields.
-   Preserve discounts, taxes or fees only if already supported.
-   Disable Complete Sale when the cart is empty or invalid.
-   Recalculate totals immediately when quantities or items change.
-   Prevent accidental double-click/duplicate submissions.
-   Show clear validation, loading and error states.
-   Preserve cart contents after recoverable validation errors.

### Design

Use MarketMate's existing design system and component patterns. Keep the
experience clean, professional and mobile-friendly. Do not redesign
unrelated screens.

### Acceptance criteria

-   One-product sale still works.
-   Multiple products can be added to one sale.
-   Quantities and totals update correctly.
-   Removing an item recalculates totals.
-   Existing customer and payment behaviour remains intact.
-   Adding products to the cart does not yet save a sale or deduct
    stock.

**Stop and request approval before Phase 2.**

------------------------------------------------------------------------

# Phase 2 --- Transaction data model and persistence

### Goal

Save the checkout as one parent sale transaction containing multiple
sale items.

Adapt the following conceptual structure to the existing database. Do
not create a parallel sales system if the current model can be extended
safely.

### Parent sale transaction

Preserve the transaction-level fields the application needs, such as: -
Unique sale/transaction ID. - Business ID. - Customer ID, where
applicable. - Customer display name or existing customer reference. -
Transaction timestamp. - Payment method and payment status, if
supported. - Subtotal, discounts, taxes, fees and grand total, where
applicable. - Total cost of goods sold. - Total gross profit. -
Created-by user/staff ID. - Existing notes, receipt number or reference
fields.

### Sale item / line item

Each item must preserve: - Product ID. - Product name snapshot. -
SKU/barcode snapshot where useful. - Quantity. - Unit selling price at
time of sale. - Unit cost price at time of sale. - Line revenue. - Line
cost. - Line gross profit.

**Historical accuracy is essential:** store the selling price and cost
snapshot on the sale item. Do not calculate historical profit later
using the product's current price or cost, because catalogue values may
change.

### Calculations

For each line: - Line revenue = quantity × unit selling price. - Line
cost = quantity × unit cost price. - Line gross profit = line revenue −
line cost.

For the transaction: - Subtotal = sum of line revenues. - Total cost =
sum of line costs. - Gross profit = subtotal − total cost, adjusted only
according to existing accounting rules for discounts, taxes and fees.

Follow the application's existing money representation, currency
formatting and rounding conventions. Avoid floating-point money errors.

### Historical compatibility

-   Do not delete or rewrite historical sales.
-   Do not assume every old sale already has a line-items array.
-   Keep legacy single-product sales readable.
-   If migration or compatibility logic is needed, make it safe and
    document it.
-   Update existing screens to handle legacy and new records.

### Acceptance criteria

-   One checkout creates one sale transaction.
-   All products are stored as line items under that transaction.
-   Stored totals match the reviewed checkout.
-   Historical prices and costs remain accurate after catalogue changes.
-   Existing sales continue to load.

**Stop and request approval before Phase 3.**

------------------------------------------------------------------------

# Phase 3 --- Inventory, customer history, receipts and reports

### Inventory

-   Deduct each sold product's quantity only after successful sale
    completion.
-   Update each affected product exactly once.
-   Validate stock against existing business rules.
-   Prevent negative stock unless the application explicitly allows it.
-   Handle concurrent sales safely.
-   Use database transactions or an equivalent atomic server-enforced
    approach where supported.
-   If sale persistence fails, do not leave stock partially deducted.
-   If stock updates fail, do not show checkout success.
-   Never deduct stock merely because an item was added to the cart.

### Customer history

-   Link the complete sale to the selected customer.
-   Show one transaction in purchase history, not one transaction per
    product.
-   When opened, show every purchased product and quantity.
-   Update customer lifetime totals once per transaction.
-   Preserve walk-in/guest behaviour.

### Sales records and receipts

-   Show one sale row/card for the entire transaction.
-   Display total, customer, date and payment details using existing
    conventions.
-   Allow the merchant to open the transaction and inspect its line
    items.
-   Receipts/invoices must list every product, quantity, unit price and
    line total.
-   Preserve existing filters, search, date ranges and pagination.

### Reports and dashboard

Review all sales-dependent calculations: - Revenue/total sales. - Number
of transactions. - Units sold. - Product performance. - Cost of goods
sold. - Gross profit. - Customer purchase totals. - Payment-method
summaries.

Maintain these distinctions: - **Transaction count:** number of
completed sale transactions. - **Units sold:** sum of quantities across
all sale items. - **Product sales quantity:** sum of quantities for that
product. - **Revenue:** sum of line revenues, counted once. -
**Profit:** based on historical cost snapshots and existing accounting
rules.

Do not count each line item as a separate transaction. Avoid
double-counting revenue or profit.

### Acceptance criteria

-   Stock is correct for every product.
-   Customer history contains one complete transaction.
-   Sales records show one transaction with inspectable line items.
-   Receipts list all items.
-   Dashboard and reports remain mathematically correct.
-   Historical reports are not corrupted.

**Stop and request approval before Phase 4.**

------------------------------------------------------------------------

# Phase 4 --- Reliability, security and permissions

### Reliability

-   Prevent duplicate checkout submissions.
-   Use a unique transaction ID or idempotency mechanism so retries
    cannot create duplicate sales or deduct stock twice.
-   Make sale creation and stock updates atomic where supported.
-   Handle network interruptions and retries safely.
-   Distinguish confirmed success from failed or uncertain submission.
-   Do not show success until the database confirms the operation.
-   A retry after timeout must not create a second sale.

### Security and business isolation

-   Every sale must belong to the authenticated user's correct business.
-   Validate business ownership and staff permissions in trusted
    backend/database logic, not only in the frontend.
-   Never allow a user to submit a sale against another business's
    products or customer records.
-   Do not trust client-submitted cost price, profit, business ID, stock
    quantity or totals without trusted validation.
-   Revalidate authoritative product prices, cost values, ownership and
    stock during checkout according to existing pricing rules.
-   Preserve role-based permissions and cashier restrictions.
-   Do not expose private business information.

### Auditability

-   Preserve created-by/staff information.
-   Use consistent timestamps.
-   Follow existing audit/logging conventions.
-   Do not silently overwrite completed transactions.

### Acceptance criteria

-   Retrying cannot create duplicate sales or double-deduct stock.
-   Unauthorized users cannot record sales for another business.
-   Client manipulation cannot set arbitrary profit or bypass stock
    checks.
-   Errors do not leave partial data behind.

**Stop and request approval before Phase 5.**

------------------------------------------------------------------------

# Phase 5 --- Testing and release readiness

### Test scenarios

1.  Record a sale with one product.
2.  Record a sale with four different products.
3.  Add the same product twice and verify the intended quantity
    behaviour.
4.  Increase and decrease quantities.
5.  Remove a product from the cart.
6.  Record a sale for an existing customer.
7.  Record a walk-in/guest sale if supported.
8.  Test each existing payment method.
9.  Attempt to sell more than available stock.
10. Attempt to sell an inactive/unavailable product.
11. Attempt to complete an empty cart.
12. Test zero, negative and invalid quantities.
13. Test invalid selling prices.
14. Simulate a network error during checkout.
15. Retry after timeout and verify no duplicate sale.
16. Verify stock is deducted exactly once per item.
17. Verify customer history shows one transaction.
18. Verify receipt lists every item.
19. Verify sales, product and profit reports.
20. Verify historical single-product sales still display.
21. Verify business data isolation.
22. Test mobile and desktop layouts.

### Regression checks

Confirm these existing areas still work: - Single-product sale
recording. - Product catalogue. - Inventory adjustments. - Customer
records. - Sales history. - Receipts/invoices. - Expenses. - Dashboard
metrics. - Reports and profit calculations. - Staff roles and cashier
permissions. - Authentication and business switching, if supported.

### Release requirements

-   Run available tests, type checks, linting and production build.
-   Fix errors introduced by the feature.
-   Document tests that could not be run.
-   Summarize changed files and data-model changes.
-   Explain migration or deployment steps.
-   Do not deploy or change production data without explicit
    authorization.

**Acceptance:** Release only when core scenarios pass, historical sales
remain compatible and no known data-integrity or business-isolation
issue remains unresolved.

------------------------------------------------------------------------

# Non-negotiable business rules

1.  One checkout is one sale transaction, regardless of item count.
2.  A sale can contain one item or many items.
3.  Every line item preserves its product identity, quantity, selling
    price and historical cost price.
4.  Transaction totals are calculated from line items and existing
    supported adjustments.
5.  Stock is deducted for each line only after successful completion.
6.  Adding products to a cart does not create a sale or deduct stock.
7.  Retries must not duplicate transactions or stock deductions.
8.  Customer history shows one transaction with multiple products.
9.  Reports distinguish transactions, units sold and product quantities.
10. Historical sales remain readable and financially accurate.
11. Merchant/business data remains isolated.
12. Existing MarketMate features must not break.
13. Do not add storefronts, online ordering or payment gateways as part
    of this task.
14. Do not redesign the entire application.

## Phase sequence

  Phase   Scope                                               Approval gate
  ------- --------------------------------------------------- ---------------
  0       Inspect code and produce implementation plan        Required
  1       Multi-product sales interface                       Required
  2       Transaction and line-item persistence               Required
  3       Inventory, customer history, receipts and reports   Required
  4       Reliability, security and permissions               Required
  5       Testing and release readiness                       Final review

## Final product outcome

A merchant should be able to select a customer, add shoes, clothes,
sunglasses and socks, set quantities, review one combined amount and
complete one sale. MarketMate calculates the totals and profit, updates
stock for every product and saves the complete purchase under one
customer transaction.

**The objective: make recording a real-world customer purchase as easy
as the purchase itself.**
