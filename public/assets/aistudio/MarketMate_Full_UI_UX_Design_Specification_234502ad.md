# MarketMate --- Full UI/UX Design Specification

**Document type:** Product UI/UX Design Specification\
**Product:** MarketMate\
**Core promise:** Know Your Numbers. Grow Your Business.\
**Primary audience:** Nigerian micro and small business owners, shop
owners, vendors, merchants and their staff\
**Status:** Design direction for the existing application\
**Date:** 30 October 2026

------------------------------------------------------------------------

## 1. Purpose of This Document

This document defines the full user interface (UI) and user experience
(UX) direction for the existing MarketMate application.

It is a redesign specification, not a request to rebuild MarketMate from
scratch. The current application, its codebase, existing features and
the uploaded screen recording are the starting point.

The redesign must make MarketMate easier to understand, faster to use
and more consistent across desktop, tablet and mobile devices.

### Main outcomes

1.  Merchants can quickly find the feature they need.
2.  Recording a sale or expense takes as few steps as reasonably
    possible.
3.  Business figures are easy to understand without accounting
    knowledge.
4.  Screens look and behave consistently.
5.  The mobile experience is treated as a first-class experience.
6.  Existing business operations continue to work after the redesign.

### Important implementation rule

Improve the interface and user journey without casually changing
existing business rules, calculations, stored data, payment records,
authentication, staff permissions, subscription checks or administrator
functions.

If a design improvement requires a change to business logic or data
structure, identify it clearly and obtain approval before making that
change.

------------------------------------------------------------------------

## 2. Product Understanding

MarketMate helps small businesses keep track of money coming in, money
going out, products, customers and business performance.

The application should feel like a helpful business tool, not accounting
software built only for accountants.

### Product experience statement

**MarketMate helps a merchant answer three questions:**

-   What happened in my business?
-   How much money did I make or spend?
-   What should I pay attention to next?

### Core experience

The main experience should follow this simple pattern:

**Record → Understand → Improve**

-   **Record:** Add sales, expenses, products, customer payments and
    other business activities.
-   **Understand:** See sales, costs, profit, stock and business
    reports.
-   **Improve:** Use pricing tools, goals and the Business Assistant to
    make better decisions.

### Audience and user needs

  -----------------------------------------------------------------------
  User type                           Main needs
  ----------------------------------- -----------------------------------
  Business owner                      See business performance, manage
                                      settings, control staff and make
                                      decisions

  Manager                             Monitor sales, expenses, stock and
                                      staff activity based on assigned
                                      access

  Cashier                             Record sales quickly, receive
                                      payments and issue receipts

  Stock manager                       Add products, update stock and
                                      monitor low-stock items

  New merchant                        Set up the business and understand
                                      what to do first
  -----------------------------------------------------------------------

The application must respect the permissions assigned to each role. Do
not assume every staff member should see profit, reports, subscription
details or business settings.

------------------------------------------------------------------------

## 3. Design Principles

### 3.1 Use simple language

Use words that merchants already understand.

Prefer: - Home instead of Dashboard Overview. - Checkout instead of POS
Register Terminal. - Products & Stock instead of Catalog & Inventory. -
Expenses instead of Expenses & Overhead. - Customers instead of Contacts
& CRM. - Customer Debts instead of Debt & Credit Book. - Reports instead
of Reports & P&L. - Staff & Permissions instead of Staff & Team
Access. - Business Assistant instead of MarketMate AI Advisor, where
this label fits the existing feature.

Avoid unnecessary business and accounting terms such as CRM, ledger,
overhead, P&L and SKU in primary navigation. Where a technical term is
necessary, explain it in plain language.

### 3.2 Make common tasks easy to reach

Recording a sale, recording an expense and checking today's performance
should never feel hidden.

### 3.3 Show important information first

Put the most useful information at the top of each screen. Supporting
details can appear below or inside expandable sections.

### 3.4 Keep screens focused

Each screen should have one main purpose and one clear primary action.

### 3.5 Give clear feedback

After an action, tell the merchant what happened. Do not rely on colour
or animation alone.

### 3.6 Design for real business conditions

Assume users may: - Use a small Android phone. - Have a slow or unstable
internet connection. - Be serving a customer while using the app. - Have
limited experience with business software. - Need to correct an entry
they just made.

### 3.7 Keep the experience consistent

Buttons, forms, filters, cards, tables, status labels, confirmation
messages and empty states should work in a consistent way throughout the
application.

------------------------------------------------------------------------

## 4. Brand and Visual Direction

Retain MarketMate's existing brand identity. Do not introduce a new
colour system or change the logo as part of this UI/UX redesign.

### Core colour tokens

  -----------------------------------------------------------------------
  Token                   Colour                  Use
  ----------------------- ----------------------- -----------------------
  Primary Green           `#059669`               Main actions, selected
                                                  states, positive
                                                  highlights

  Deep Navy               `#001A35`               Main headings,
                                                  navigation and strong
                                                  text

  Secondary Navy          `#082F4B`               Supporting dark
                                                  surfaces and secondary
                                                  emphasis

  Page Background         `#F8FAFC`               Main application
                                                  background

  Card White              `#FFFFFF`               Cards, forms and
                                                  content surfaces

  Border                  `#E2E8F0`               Dividers, card borders
                                                  and input borders

  Main Text               `#0F172A`               Primary text

  Secondary Text          `#64748B`               Supporting text and
                                                  descriptions
  -----------------------------------------------------------------------

### Status colours

Use status colours consistently and always pair them with a word or
icon.

  Status        Suggested treatment   Meaning
  ------------- --------------------- ---------------------------------------
  Success       Green                 Completed, paid, available
  Warning       Amber                 Needs attention, low stock, due soon
  Error         Red                   Failed, overdue, invalid
  Information   Blue                  Helpful information or neutral status
  Disabled      Slate/grey            Not currently available

Do not use colour as the only way to communicate a status.

### Typography

-   Use a clean, highly readable sans-serif typeface already supported
    by the project.
-   Use a clear difference between page titles, section headings, labels
    and supporting text.
-   Avoid very small text, especially on mobile.
-   Use tabular numerals for financial figures where supported.
-   Keep labels short and sentence case.

Suggested type scale:

  Text style          Desktop size   Mobile size Weight
  ----------------- -------------- ------------- ---------------
  Page title             28--32 px     24--28 px Semibold/Bold
  Section title          18--22 px     18--20 px Semibold
  Card title             14--16 px     14--16 px Medium
  Body                   14--16 px     14--16 px Regular
  Supporting text        12--14 px     12--14 px Regular
  Button                 14--16 px     14--16 px Semibold

### Spacing and layout

Use a consistent spacing scale based on 4 px increments.

-   4 px: tight icon/text spacing.
-   8 px: small internal gaps.
-   12 px: compact card spacing.
-   16 px: standard padding and form spacing.
-   24 px: section spacing.
-   32 px: major content separation.

Use consistent corner radii and shadows. Avoid excessive rounded cards,
heavy shadows or decorative effects that make the interface feel
crowded.

### Icons

-   Use one consistent icon library already present in the project.
-   Pair icons with text in navigation and important actions.
-   Do not use icons that are difficult to understand without labels.
-   Avoid decorative icons that do not help users complete a task.

------------------------------------------------------------------------

## 5. Application Structure and Navigation

### 5.1 Desktop layout

The desktop application should have:

1.  A persistent left sidebar.
2.  A compact top header.
3.  A clear page title and optional description.
4.  A main content area.
5.  Consistent page-level actions.
6.  Responsive content that does not create unnecessary horizontal
    scrolling.

The sidebar should be easy to scan. Group related items under short
section labels.

### 5.2 Proposed sidebar structure

Use this as the target navigation structure. Map each item to the
correct existing route or feature. Do not create a new feature simply
because it appears in this proposed menu.

**BUSINESS** - Home

**SELL** - Checkout - Sales - Transactions

**PRODUCTS** - Products & Stock

**MONEY** - Expenses - Customer Debts - Invoices & Quotes - Reports

**PEOPLE** - Customers - Suppliers

**BUSINESS TOOLS** - Business Assistant - Product Pricing Calculator -
Profit Planner - Import Cost Calculator, if available to the current
account

**MANAGEMENT** - Staff & Permissions - Business Goals, if available

**ACCOUNT** - Business Profile - Subscription - Settings - Help &
Support

### 5.3 Navigation wording

  -----------------------------------------------------------------------
  Existing wording                    Recommended wording
  ----------------------------------- -----------------------------------
  Dashboard                           Home

  POS Register Terminal               Checkout

  Sales Records                       Sales

  Expenses & Costs                    Expenses

  Catalog & Inventory                 Products & Stock

  Contacts & CRM                      Customers & Suppliers, or separate
                                      Customers and Suppliers if the
                                      existing screens support this

  Debt & Credit Book                  Customer Debts

  Invoices & Quotes                   Invoices & Quotes

  Transactions                        Transactions

  Reports & P&L                       Reports

  Staff & Team Access                 Staff & Permissions

  MarketMate AI                       Business Assistant

  Settings                            Settings
  -----------------------------------------------------------------------

### 5.4 One navigation source

Desktop sidebar, mobile drawer and any quick-action menu should use one
shared navigation configuration.

This avoids different labels, routes or access rules appearing on
different devices.

The shared configuration must support: - Existing route identifiers. -
Role-based visibility. - Subscription-based visibility. - Active route
state. - Group headings. - Optional icons. - Mobile and desktop
rendering.

Do not remove access restrictions by changing only the visual
navigation.

### 5.5 Mobile navigation

Recommended bottom navigation:

-   Home
-   Sales
-   Add (+)
-   Checkout
-   More

The centre Add action opens a quick-action menu with the most common
tasks, such as: - Record Sale - Add Expense - Add Product - Record
Customer Payment, if supported

The More item opens the full navigation drawer.

Only show actions the current user is allowed to use. Keep the bottom
navigation clear of the device's safe areas and avoid covering page
content.

------------------------------------------------------------------------

## 6. Shared Screen Design Standards

Every major screen should use the same basic structure:

1.  Page title.
2.  Short explanation, only where it helps.
3.  Main action.
4.  Important summary figures, where relevant.
5.  Search and filters, where relevant.
6.  Main content.
7.  Helpful empty, loading and error states.

### Buttons

Use clear action labels: - Save Sale - Save Expense - Add Product - Send
Invoice - Record Payment - Update Stock

Avoid vague labels such as Submit, Proceed or Done when a more specific
label is possible.

Button hierarchy: - Primary: one main action per screen or form. -
Secondary: supporting action. - Tertiary: low-priority action. -
Destructive: delete or permanently remove an item; require confirmation.

### Forms

-   Show a visible label above each input.
-   Use examples or helper text when a field may be unclear.
-   Mark required fields.
-   Keep related fields together.
-   Use the correct mobile keyboard for numbers, amounts, email and
    phone fields.
-   Validate fields near the field itself.
-   Preserve entered values when a recoverable error occurs.
-   Prevent accidental double submission.
-   Clearly show when a save is in progress.

### Search and filters

-   Put search near the top of record lists.
-   Use plain filter names.
-   Show active filters.
-   Provide a clear way to reset filters.
-   On mobile, use a filter sheet or drawer rather than squeezing many
    controls into one row.

### Tables and lists

-   Desktop: use tables when they help compare many records.
-   Mobile: use readable cards or stacked rows.
-   Keep the most useful information visible.
-   Put secondary information in a detail view.
-   Do not force mobile users to scroll sideways to read basic
    information.

### Confirmation and feedback

Use confirmations for important or destructive actions. Do not ask for
confirmation for every small action.

Examples: - "Sale saved successfully." - "Expense added." - "Product
updated." - "This will remove the product from your list. Do you want to
continue?"

### Loading, empty and error states

Every data-driven screen must support: - Loading state. - Empty state
with a useful next action. - Error state with a retry option where
possible. - Permission-restricted state. - Offline or connection issue
state where relevant.

Avoid blank screens and unexplained spinners.

------------------------------------------------------------------------

## 7. Screen-by-Screen UI/UX Specification

## 7.1 Sign Up and Login

### Goal

Help a new merchant access the app without confusion.

### Design requirements

-   Keep the form focused.
-   Clearly label email/phone and password fields according to the
    existing authentication method.
-   Provide show/hide password.
-   Explain password requirements before submission.
-   Show useful validation messages.
-   Provide a clear path between sign up and login.
-   Make password recovery easy to find if supported.
-   Keep branding visible but do not let decoration crowd the form.

### Success experience

After successful sign up, take the user into the existing onboarding
flow. Do not ask the user to enter information again if it has already
been collected.

------------------------------------------------------------------------

## 7.2 Business Setup and Onboarding

### Goal

Help the merchant set up the minimum information needed to start using
MarketMate.

### Recommended journey

1.  Welcome to MarketMate.
2.  Enter business name.
3.  Select business type.
4.  Confirm contact details and currency, using supported options.
5.  Review business information.
6.  Add the first product or choose to do it later.
7.  Record the first sale or choose to do it later.
8.  Arrive at Home with a short explanation of the next useful action.

### Design requirements

-   Use a step indicator.
-   Ask only for information needed at that stage.
-   Explain why important information is requested.
-   Allow the user to go back without losing completed entries.
-   Provide a Skip for now option for non-essential steps.
-   Do not make sample data look like real business data.
-   Do not force a merchant to complete every setup task before they can
    explore the app, unless the existing business rules require it.

### First-use guidance

Use small, dismissible hints to explain: - Where to record a sale. -
Where to add expenses. - Where to add products. - Where to see business
performance.

Avoid showing too many tips at once.

------------------------------------------------------------------------

## 7.3 Home (Dashboard)

### Goal

Give the merchant a quick and honest picture of business performance.

### Recommended information order

**Top area** - Greeting or business name. - Selected date range. - Main
action: Record Sale. - Secondary action: Add Expense.

**Business summary** - Sales. - Expenses. - Profit, using the exact
existing calculation and label. - Outstanding customer debts, if
available and permitted.

**Performance** - Sales trend. - Expense trend. - Profit trend, if
supported by existing data.

**Attention area** - Low-stock products. - Unpaid or overdue customer
debts. - Invoices needing attention. - Other existing alerts that
require action.

**Recent activity** - Recent sales. - Recent expenses. - Recent payments
or transactions.

### Date filters

Use simple options: - Today - This Week - This Month - Custom Date

Make the selected date range visible. All summary cards and charts
should use the same selected period unless a card clearly says
otherwise.

### Financial wording

Explain important figures in plain language. For example: - Sales:
"Money received from sales." - Expenses: "Money spent by the
business." - Profit: "What remains after the costs included in this
calculation."

Do not label revenue, cash received, gross profit or net profit
interchangeably. Use the existing calculation definitions and make them
clear.

### Empty state

If the merchant has no sales yet: - Explain that no sales have been
recorded. - Show a Record First Sale button. - Offer Add Product as a
supporting action.

------------------------------------------------------------------------

## 7.4 Checkout (POS)

### Goal

Help a cashier or merchant complete a sale quickly, accurately and
confidently.

### Main layout

**Desktop** - Product search and product list on one side. - Current
cart on the other side. - Checkout summary and payment action clearly
visible.

**Mobile** - Search products. - Select product. - Add to cart. - Open a
clear cart/checkout view. - Complete payment. - Show success and receipt
options.

### Product selection

-   Search by product name and any existing supported product
    identifier.
-   Show product name, selling price and available stock.
-   Make low-stock or unavailable status clear.
-   Do not allow a sale that violates existing stock rules.
-   Allow walk-in sales if supported.
-   Do not force a customer selection when the current business flow
    allows a walk-in sale.

### Cart

Show: - Product name. - Quantity. - Unit price. - Line total. - Remove
or edit quantity action.

Show subtotal and any existing discount, tax or additional charge fields
only if supported by the current application.

### Payment

-   Make payment method easy to select.
-   Show amount due.
-   Show amount received and change where applicable.
-   Validate the received amount according to the selected payment
    method and current rules.
-   Clearly show whether a sale is paid, partly paid or unpaid, if those
    states are supported.

### Completion

After a successful checkout: - Show a clear success state. - Display
sale total and payment status. - Provide the existing
receipt/share/print actions. - Offer a clear New Sale action.

Do not create a second sale if the user taps the action twice or retries
after a slow connection.

------------------------------------------------------------------------

## 7.5 Record Sale Form

### Goal

Allow merchants to record a sale that happened outside the Checkout
flow, or use the existing manual sale process.

### Recommended form sections

**A. What was sold** - Product or service name. - Quantity sold. -
Selling price. - Cost price, if required by the current calculation.

**B. Payment details** - Payment method. - Amount received or payment
status, if supported. - Customer name, optional where appropriate. -
Sale date.

**C. Sale summary** - Total selling amount. - Total cost. - Expected
profit, using the existing calculation.

### Interaction improvements

-   If the user selects a product already in the catalogue, fill in its
    saved selling price and cost price where safe and correct.
-   Allow the merchant to change the values when the business flow
    permits it.
-   If the user enters a new product name, do not silently create a
    catalogue item unless the existing workflow explicitly does so.
-   Update totals as the user changes quantity or price.
-   Explain how the total is calculated.
-   Make the main Save Sale button easy to reach on mobile.
-   Preserve entered values if validation fails.

### Validation

-   Quantity must be valid and greater than zero.
-   Amounts must be valid numbers and cannot be negative.
-   Required fields must be clear.
-   Date must be valid.
-   Show errors beside the relevant field.

### Success

Show a clear message and the saved sale summary. Offer View Sale or
Record Another Sale.

------------------------------------------------------------------------

## 7.6 Sales

### Goal

Help merchants find, review and understand recorded sales.

### Top summary

Use the existing supported metrics, such as: - Total sales. - Product
cost. - Profit. - Average sale value.

Clearly show the date range used.

### Record list

Search and filters: - Search product, customer or sale reference where
supported. - Date range. - Payment method. - Payment status.

**Desktop table columns** - Date. - Sale reference. - Product or
description. - Customer. - Total. - Payment status. - Action.

**Mobile sale card** - Product or sale description. - Date and
reference. - Total amount. - Payment status. - Tap to view details.

### Sale detail

Show: - Sale items. - Quantity and prices. - Payment information. -
Customer information, if recorded. - Sale date. - Existing receipt/share
options. - Any permitted edit or delete actions.

Do not expose actions that the current role is not allowed to perform.

------------------------------------------------------------------------

## 7.7 Expenses

### Goal

Make it easy to record and review business spending.

### Expense form structure

**A. Expense details** - What was the money spent on? - Amount. -
Category.

**B. Payment details** - Payment method. - Date. - Supplier or person
paid, if supported.

**C. Extra details** - Note or description. - Receipt attachment, only
if supported by the current application.

### Category selection

Use familiar category names. Examples may include: - Stock or
Restocking. - Transport or Delivery. - Rent. - Electricity. - Internet
or Airtime. - Packaging. - Repairs and Maintenance. - Staff Payment. -
Other.

Use existing category values where they are already stored. If
categories need to be added or renamed in stored data, treat that as a
data migration decision, not a visual-only change.

### Interaction improvements

-   Make the amount field easy to find.
-   Use category choices that are easy to tap.
-   Allow a merchant to choose Other and add a short explanation.
-   Keep optional fields visibly optional.
-   Show the date and payment method clearly.
-   Make Save Expense the primary action.

### Expense list

Show: - Total expenses for the selected period. - Search. - Date
filter. - Category filter. - Payment method filter, if supported. -
Expense description, amount, category and date.

On mobile, use expense cards rather than a wide table.

### Success

Show "Expense saved successfully" and the saved amount. Offer View
Expenses or Add Another Expense.

------------------------------------------------------------------------

## 7.8 Products & Stock

### Goal

Help merchants manage what they sell and know what is available.

### Product list

Show: - Product name. - Selling price. - Cost price, where the role is
allowed to see it. - Available quantity. - Stock status.

Provide: - Search. - Category filter, if supported. - Stock status
filter. - Add Product. - Existing import options, if available.

### Stock status

Use plain labels: - In Stock. - Low Stock. - Out of Stock.

Do not rely on colour alone.

### Add/Edit Product form

Group fields into:

**Product information** - Product name. - Category. - Description, if
supported.

**Pricing** - Cost price. - Selling price.

**Stock** - Opening quantity or current quantity. - Low-stock alert
level, if supported.

Explain important pricing fields: - Cost price: "What the business pays
to get this product." - Selling price: "What the customer pays."

### Product detail

Show product information, price, stock level and relevant sales/stock
history if the current application supports it.

### Stock update

Make it clear whether the merchant is: - Adding stock. - Removing
damaged or missing stock. - Correcting the stock count.

Require a reason where the existing data model or audit process supports
it.

------------------------------------------------------------------------

## 7.9 Customer Debts

### Goal

Help merchants know who owes the business and how much remains unpaid.

### Main screen

Show: - Total outstanding amount. - Number of customers with unpaid
balances. - Overdue amount, if the system tracks due dates.

List customers with: - Customer name. - Amount owed. - Date or due
date. - Payment status.

### Customer debt detail

Show: - Original amount. - Payments received. - Remaining balance. -
Dates and payment history. - Existing reminder options.

### Record payment

-   Show the amount remaining.
-   Enter payment received.
-   Select payment method.
-   Select date.
-   Confirm the new balance before saving.

Prevent payments from exceeding the remaining balance unless the
existing system explicitly supports overpayments.

### Reminders

Use plain wording, such as "Send payment reminder". If WhatsApp
reminders are supported, make it clear that the merchant is opening or
sending a WhatsApp message.

------------------------------------------------------------------------

## 7.10 Invoices & Quotes

### Goal

Help merchants prepare and track invoices and quotations.

### Main screen

Separate or clearly filter: - Invoices. - Quotes.

Show: - Reference. - Customer. - Date. - Amount. - Status.

Use clear statuses such as: - Draft. - Sent. - Paid. - Partly Paid. -
Overdue. - Accepted or Declined for quotes, if supported.

### Create invoice or quote

Use a guided form: 1. Select customer or enter customer details using
the existing flow. 2. Add items or descriptions. 3. Confirm quantities
and prices. 4. Add supported notes, dates and terms. 5. Preview. 6.
Save, share or send using existing capabilities.

### Design requirements

-   Make the total easy to see.
-   Keep the customer and payment details readable.
-   Provide a clear preview before sending.
-   Do not imply that an invoice has been paid merely because it has
    been sent.

------------------------------------------------------------------------

## 7.11 Customers and Suppliers

### Goal

Keep business contact information organised and easy to find.

If the current app has a combined contacts screen, keep the existing
data and improve the way the user switches between customers and
suppliers.

### Customer list

Show: - Name. - Phone number. - Total purchases or relevant existing
summary. - Outstanding debt, if permitted.

### Supplier list

Show: - Name. - Phone number. - Business or supplied items, if
supported. - Relevant outstanding balance, if supported.

### Contact detail

Show the information already stored by MarketMate and relevant
activity: - Sales. - Invoices. - Payments. - Debts. - Supplier-related
records.

Do not invent new contact fields or history that the application does
not currently store.

------------------------------------------------------------------------

## 7.12 Transactions

### Goal

Give the merchant a clear history of money-related activity.

Use plain labels to distinguish: - Sale. - Expense. - Customer
payment. - Other supported transaction types.

Show: - Date. - Type. - Description. - Amount. - Payment method. -
Status.

Use clear filters and a mobile card layout.

Do not present a transaction as a sale or expense if it represents a
different type of activity. Preserve the current source-of-truth and
transaction relationships.

------------------------------------------------------------------------

## 7.13 Reports

### Goal

Help the merchant understand how the business is performing.

### Report landing screen

Show available reports using plain names and short descriptions.

Examples, only where the existing application supports them: - Sales
Report --- See how much the business sold. - Expense Report --- See
where business money was spent. - Profit Report --- Understand the
profit calculation. - Product Report --- See which products are
selling. - Customer Report --- Review customer activity.

### Report controls

-   Date range.
-   Export or download, if supported.
-   Clear report title.
-   Explanation of the figures.
-   Empty state if there is no data.

### Charts

-   Use clear chart titles.
-   Label axes where necessary.
-   Provide readable tooltips.
-   Do not overload one chart with too many series.
-   Provide a useful empty state.
-   Make charts usable on narrow screens.

Financial totals must come from the existing business calculations. The
redesign must not create new definitions of profit or revenue.

------------------------------------------------------------------------

## 7.14 Business Assistant

### Goal

Help merchants ask questions about their business and understand the
answers.

### Design requirements

-   Use a clear conversation layout.
-   Keep messages easy to read.
-   Make the input area easy to reach on mobile.
-   Provide suggested questions based on the current feature and
    supported data.
-   Show a clear loading state while an answer is being prepared.
-   Make errors understandable and offer a retry option.
-   Distinguish business data from general suggestions.
-   Never make up business figures or claim to have read data that was
    not available.

### Suggested prompts

Examples: - "How much did I sell this week?" - "Which products made the
most sales?" - "What expenses were highest this month?" - "Help me
review my product prices."

Only show prompts the assistant can answer using the current product
capabilities and the user's permissions.

------------------------------------------------------------------------

## 7.15 Product Pricing Calculator

### Goal

Help a merchant understand the cost of a product and choose a selling
price.

### Design requirements

-   Explain each input in plain language.
-   Separate cost inputs from desired profit or margin inputs.
-   Show the recommended selling price clearly.
-   Show expected profit clearly.
-   Explain the calculation in a short, understandable way.
-   Make it clear that the result is an estimate based on the values
    entered.

Do not change the existing calculation formula during a visual redesign
without product approval.

------------------------------------------------------------------------

## 7.16 Profit Planner / Simulator

### Goal

Help merchants explore how sales, costs or prices may affect business
results.

### Design requirements

-   Explain what the merchant is changing.
-   Show the current or starting figures.
-   Show the estimated result.
-   Clearly label simulated figures as estimates.
-   Avoid confusing a projection with actual business performance.
-   Make Reset or Start Again easy to find.

Preserve the existing model and calculation rules.

------------------------------------------------------------------------

## 7.17 Business Goals

If this feature is available to the user: - Show each goal in plain
language. - Show target, current progress and time period. - Use a clear
progress indicator. - Explain what counts towards the goal. - Provide a
clear way to add or update a goal.

Do not display goals as achieved unless the stored progress confirms it.

------------------------------------------------------------------------

## 7.18 Staff & Permissions

### Goal

Help owners control who can use the business account and what each staff
member can do.

### Staff list

Show: - Staff name. - Role. - Access status. - Shift status, if
supported. - Clear action menu.

### Staff setup

Use simple language to explain permissions.

Examples: - "Can this person record sales?" - "Can this person add
expenses?" - "Can this person see business profit?" - "Can this person
manage products?" - "Can this person view reports?" - "Can this person
manage other staff?"

The exact permission options must map to the existing permission system.

### PIN and shift flows

-   Make PIN entry clear and secure.
-   Avoid displaying sensitive PIN information.
-   Explain what happens when a staff member starts or closes a shift.
-   Show confirmation and relevant shift totals according to
    permissions.
-   Preserve manager/owner PIN checks and staff session switching.

------------------------------------------------------------------------

## 7.19 Settings and Business Profile

### Goal

Help the owner manage business information and app preferences without
mixing unrelated settings.

### Suggested sections

-   Business Profile.
-   Account and Security.
-   Staff and Access, if not already managed elsewhere.
-   Notifications.
-   Subscription.
-   Data and Backup, if supported.
-   Help and Support.

### Design requirements

-   Use clear section headings.
-   Explain the effect of important settings.
-   Ask for confirmation before sensitive changes.
-   Keep subscription information separate from ordinary business
    profile information.
-   Do not show settings that the current user is not allowed to change.

------------------------------------------------------------------------

## 7.20 Subscription

### Goal

Explain the user's current access and the steps needed to manage their
plan.

### Design requirements

-   Show current plan and status.
-   Explain what is included.
-   Show renewal or expiry information only when confirmed by the
    subscription data.
-   Clearly explain how to request or complete payment using the
    existing supported process.
-   Show payment request status.
-   Explain what happens after approval or expiry.
-   Avoid misleading success messages before the payment or approval is
    confirmed.

Keep existing subscription rules and access checks intact. Do not
hardcode future prices or dates that have not been confirmed.

------------------------------------------------------------------------

## 7.21 Admin Portal

### Goal

Keep administrator workflows clear while preserving the existing
administration experience.

### Requirements

-   Retain the existing admin dashboard and its current sections.
-   Extend existing sections where required rather than creating a
    second admin dashboard.
-   Improve spacing, tables, filters, status labels and feedback.
-   Keep administrator-only actions protected.
-   Clearly distinguish pending, approved, rejected and failed actions
    where those states exist.
-   Show a clear result when an operation fails.
-   Do not report that an approval or update succeeded unless the
    underlying operation confirms success.

The merchant-facing navigation redesign must not expose administrator
functions to ordinary merchants.

------------------------------------------------------------------------

## 7.22 Help and Support

### Goal

Help merchants understand the app and get help when something goes
wrong.

### Requirements

-   Make support easy to find.
-   Use short, direct help text.
-   Explain common tasks with simple steps.
-   Avoid covering important buttons or content with a floating support
    control.
-   On mobile, place support access where it does not block forms,
    bottom navigation or save buttons.
-   Provide a clear way to close or dismiss help.

------------------------------------------------------------------------

## 8. Responsive Design Rules

### Mobile

Prioritise: - One-column layouts. - Large touch targets. - Full-width
primary actions where appropriate. - Readable financial figures. - Cards
instead of wide tables. - Full-screen or near-full-screen forms when
they improve focus. - Sticky actions only when they do not cover fields
or navigation. - Safe-area spacing around the bottom navigation. - No
horizontal overflow.

### Tablet

-   Use two-column layouts when there is enough space.
-   Keep forms readable.
-   Avoid shrinking desktop tables until text becomes too small.
-   Keep navigation usable.

### Desktop

-   Use the persistent sidebar.
-   Use tables for record-heavy screens.
-   Use multi-column layouts where they improve scanning.
-   Avoid overly wide form fields and long text lines.
-   Keep page actions in predictable locations.

### Breakpoint behaviour

Use the project's existing responsive breakpoints where possible. Do not
introduce conflicting breakpoint systems. Test at narrow Android widths,
common phone widths, tablet widths and desktop widths.

------------------------------------------------------------------------

## 9. Accessibility and Ease of Use

The redesign should support users with different levels of digital
experience.

Requirements: - Good text contrast. - Visible keyboard focus. - Labels
for form inputs. - Buttons with clear accessible names. - Icons with
accessible labels. - Do not rely on colour alone. - Use readable text
sizes. - Keep touch targets comfortably tappable. - Support keyboard
navigation on desktop. - Respect reduced-motion preferences. - Make
validation messages understandable. - Use headings in a logical order.

------------------------------------------------------------------------

## 10. Notifications and System Feedback

Use consistent feedback for: - Successful saves. - Failed saves. -
Network problems. - Permission restrictions. - Subscription
restrictions. - Deleted or updated records. - Payment status changes. -
Background loading.

Messages should tell the user: 1. What happened. 2. What it means. 3.
What the user can do next, if anything.

Examples: - "Sale saved. You can view it in Sales." - "We couldn't save
this expense. Check your connection and try again." - "You don't have
permission to view this report. Contact the business owner if you need
access."

Do not show a success message when a server or database operation has
failed.

------------------------------------------------------------------------

## 11. Important UX Flows

### 11.1 New merchant's first day

Sign up → Business setup → Add first product → Record first sale → Add
first expense → Home.

Allow the merchant to skip optional steps and return later.

### 11.2 Record a manual sale

Home or Sales → Record Sale → Enter sale details → Review total → Save
Sale → Confirmation → View Sale or Record Another.

### 11.3 Complete a checkout sale

Checkout → Search/select product → Add to cart → Review cart → Select
payment method → Enter amount received where applicable → Complete sale
→ Receipt/success.

### 11.4 Record an expense

Home or Expenses → Add Expense → Enter description and amount → Select
category → Enter payment details → Save Expense → Confirmation.

### 11.5 Add a product

Products & Stock → Add Product → Product information → Pricing → Stock →
Save Product → Product detail/list.

### 11.6 Record a customer payment

Customer Debts → Select customer → Open debt → Record Payment → Enter
amount and payment details → Review remaining balance → Save → Updated
debt detail.

### 11.7 Find a transaction

Transactions → Search/filter → Select record → Review details → Use
permitted actions.

### 11.8 Owner reviews business performance

Home → Select date range → Review sales, expenses and profit → Check
alerts → Open relevant report or record.

### 11.9 Staff starts a shift

Staff access → Staff sign-in/session → PIN verification as required →
Start shift → Perform permitted tasks → Close shift → Review permitted
shift information.

### 11.10 Subscription request

Subscription → Review plan and instructions → Submit payment request
using existing flow → View pending status → Admin review → Merchant sees
confirmed result.

The visual flow must not bypass server-side subscription approval or
access rules.

------------------------------------------------------------------------

## 12. Data, Security and Existing Behaviour to Preserve

The redesign must preserve the existing application's working behaviour
unless a separate approved change is made.

### Preserve

-   Firebase Authentication.
-   Firestore data and existing record relationships.
-   Existing sales and expense calculations.
-   Product and stock updates.
-   Checkout and payment records.
-   Customer debts and repayments.
-   Invoices and quotes.
-   Customer and supplier records.
-   Staff sessions, shifts, PIN checks and permissions.
-   Role-based access.
-   Subscription status and feature restrictions.
-   Demo mode behaviour.
-   Admin portal and approval workflows.
-   Existing email, AI and other integrations.
-   Existing routes and deep links where possible.

### Security rules

-   UI hiding is not security. Keep server/database permission checks.
-   Never rely only on a disabled button to protect a restricted action.
-   Do not expose private business data to staff who lack permission.
-   Do not put secrets or privileged credentials in client-side code.
-   Do not weaken Firestore rules to make a redesigned screen work.
-   Validate important operations on the trusted side of the
    application.
-   Do not let a merchant edit their own subscription entitlement or
    approval status unless the existing approved security design
    explicitly allows it.

### Data integrity

-   Avoid duplicate sale or expense submissions.
-   Do not silently change old transaction values.
-   Preserve record identifiers and references.
-   Make destructive actions clear.
-   Use existing service/context methods where possible rather than
    duplicating database logic in UI components.

------------------------------------------------------------------------

## 13. Design System Components to Build or Standardise

Create or standardise reusable components for:

### Layout

-   App shell.
-   Desktop sidebar.
-   Mobile navigation drawer.
-   Mobile bottom navigation.
-   Page header.
-   Section header.
-   Responsive content container.

### Navigation

-   Navigation item.
-   Navigation group.
-   Active state.
-   Permission-aware menu item.
-   Subscription-aware menu item.

### Data display

-   Financial summary card.
-   Status badge.
-   Data table.
-   Mobile record card.
-   Activity list.
-   Empty state.
-   Alert panel.
-   Chart container.

### Forms

-   Text input.
-   Amount input.
-   Number input.
-   Date input.
-   Select/dropdown.
-   Searchable product selector.
-   Category selector.
-   Payment method selector.
-   Form section.
-   Inline validation message.
-   Sticky form action area.

### Actions and feedback

-   Primary, secondary and destructive buttons.
-   Icon button with accessible label.
-   Confirmation dialog.
-   Toast/notification.
-   Loading skeleton.
-   Error panel.
-   Permission notice.
-   Subscription notice.

### Overlays

-   Modal.
-   Drawer.
-   Bottom sheet.
-   Help panel.

Use existing project components and libraries where practical. Do not
create a new component for every screen if a reusable component already
exists.

------------------------------------------------------------------------

## 14. Implementation Strategy

Implement the redesign in controlled phases. Each phase should be
reviewed before moving to the next.

### Phase 0 --- Confirm the current application

-   Review the current routes and screens.
-   Map desktop and mobile navigation.
-   Confirm which features are active and which are gated.
-   Identify existing reusable components.
-   Record current calculations and important interactions.
-   Create a list of visual and usability issues.
-   Do not change production data or business rules.

**Deliverable:** Current-state screen and flow inventory.

### Phase 1 --- Design foundations and application shell

-   Establish colour, typography, spacing and component standards.
-   Improve the desktop sidebar.
-   Improve mobile drawer and bottom navigation.
-   Use one shared navigation configuration.
-   Improve page headers and content layout.
-   Fix overlapping support controls and mobile safe-area issues.

**Acceptance:** Navigation labels are consistent across devices and
existing permissions still work.

### Phase 2 --- Home and daily actions

-   Redesign Home.
-   Improve Record Sale.
-   Improve Record Expense.
-   Improve Checkout.
-   Standardise success, error and loading feedback.

**Acceptance:** A merchant can find and complete common daily tasks
without unclear labels or unnecessary steps. Existing totals and records
remain correct.

### Phase 3 --- Products and records

-   Redesign Products & Stock.
-   Redesign Sales.
-   Redesign Expenses.
-   Improve Transactions.
-   Improve search, filters and mobile record cards.

**Acceptance:** Users can find records and understand their status on
both mobile and desktop.

### Phase 4 --- Customers and money management

-   Redesign Customer Debts.
-   Improve payment recording.
-   Redesign Invoices & Quotes.
-   Improve Customers and Suppliers.

**Acceptance:** Users can follow a customer or supplier record through
the existing supported activities without losing data or permission
checks.

### Phase 5 --- Reports and business tools

-   Redesign Reports.
-   Improve charts and date filters.
-   Improve Business Assistant.
-   Improve Pricing Calculator.
-   Improve Profit Planner and other existing tools.

**Acceptance:** Actual figures and estimates are clearly distinguished.
Existing calculations remain unchanged unless separately approved.

### Phase 6 --- Staff, settings and subscription

-   Redesign Staff & Permissions.
-   Improve Business Profile and Settings.
-   Improve Subscription.
-   Improve Help and Support.

**Acceptance:** Staff restrictions, owner controls, subscription gates
and current payment approval flows still work.

### Phase 7 --- Admin review and quality assurance

-   Improve admin presentation without removing existing functions.
-   Review all roles.
-   Test all important journeys.
-   Check responsive layouts.
-   Fix visual and functional regressions.

**Acceptance:** Admin workflows remain available to authorised
administrators and ordinary merchants cannot access them.

------------------------------------------------------------------------

## 15. Testing and Quality Checklist

### Navigation

-   [ ] Every menu item opens the correct existing screen.
-   [ ] Desktop and mobile labels match.
-   [ ] Active menu state is correct.
-   [ ] Back navigation behaves as expected.
-   [ ] Restricted items remain restricted.

### Sales

-   [ ] Manual sale can be recorded.
-   [ ] Checkout sale can be completed.
-   [ ] Totals match the existing calculation.
-   [ ] Product prices are filled correctly where supported.
-   [ ] Stock updates correctly.
-   [ ] Payment status is correct.
-   [ ] Repeated taps do not create duplicate sales.
-   [ ] Receipt actions still work.

### Expenses

-   [ ] Expense can be recorded.
-   [ ] Required fields are validated.
-   [ ] Category and payment method are saved correctly.
-   [ ] Expense totals match existing calculations.
-   [ ] Repeated taps do not create duplicate expenses.

### Products

-   [ ] Products can be added and edited.
-   [ ] Stock values remain correct.
-   [ ] Low-stock rules still work.
-   [ ] Import features still work where available.
-   [ ] Restricted product data remains hidden.

### Customer and money features

-   [ ] Customer records load correctly.
-   [ ] Debts and repayments remain accurate.
-   [ ] Invoices and quotes retain their existing behaviour.
-   [ ] Transaction history remains complete.

### Reports and tools

-   [ ] Date filters work.
-   [ ] Report totals match source records.
-   [ ] Charts work on mobile.
-   [ ] Estimates are labelled as estimates.
-   [ ] AI tools respect data availability and permissions.

### Staff and subscription

-   [ ] Staff permissions are unchanged.
-   [ ] PIN verification still works.
-   [ ] Shift start and close still work.
-   [ ] Subscription gates remain enforced.
-   [ ] Admin approval flow remains intact.
-   [ ] Failed operations show errors rather than false success.

### Responsive and accessibility

-   [ ] No horizontal overflow on common phone widths.
-   [ ] Buttons are easy to tap.
-   [ ] Forms are usable on mobile.
-   [ ] Bottom navigation does not cover content.
-   [ ] Text contrast is readable.
-   [ ] Keyboard focus is visible.
-   [ ] Screen readers can identify form controls and actions.

------------------------------------------------------------------------

## 16. Performance and Reliability

-   Reuse existing data already loaded where possible.
-   Avoid unnecessary repeated database requests.
-   Use loading skeletons for slow data views.
-   Keep animations short and purposeful.
-   Avoid large motion effects on forms and checkout.
-   Make the app usable on modest Android devices.
-   Handle slow or interrupted connections clearly.
-   Do not clear a form simply because a network request failed.
-   Avoid loading every record at once when pagination or existing query
    patterns are available.

Any offline behaviour must match what the application currently
supports. Do not show that a transaction is safely saved offline unless
the app can reliably store and sync it.

------------------------------------------------------------------------

## 17. UX Writing Guide

Use short, direct sentences.

  Avoid                   Use instead
  ----------------------- ------------------------------------------
  POS Register Terminal   Checkout
  Catalog & Inventory     Products & Stock
  Expenses & Overhead     Expenses
  Contacts & CRM          Customers
  Debt & Credit Book      Customer Debts
  Reports & P&L           Reports
  Ledger                  Transaction history
  SKU                     Product code, if needed
  Submit                  Save Sale / Save Expense / Save Product
  Transaction failed      We couldn't save this record. Try again.
  No records found        No records yet. Add your first record.
  Invalid input           Check this field and try again.

### Writing rules

-   Speak to the user as "you".
-   Use active voice.
-   Keep instructions short.
-   Explain unfamiliar terms.
-   Avoid blame when something goes wrong.
-   Do not use technical error messages as the only explanation.
-   Use consistent names for the same feature across the whole app.

------------------------------------------------------------------------

## 18. What This Redesign Must Not Do

1.  Do not rebuild the application from scratch.
2.  Do not remove existing features because they are not visible in the
    first redesign pass.
3.  Do not invent new functionality and present it as already available.
4.  Do not change financial formulas as part of visual work.
5.  Do not change Firestore record structures without approval and a
    migration plan.
6.  Do not bypass role permissions or subscription restrictions.
7.  Do not weaken security rules.
8.  Do not replace the existing admin dashboard with a separate
    dashboard.
9.  Do not make mobile screens smaller versions of desktop screens.
10. Do not use complicated labels that merchants may not understand.
11. Do not add unnecessary animations, gradients or decorative elements.
12. Do not claim an action succeeded until the underlying operation
    confirms it.

------------------------------------------------------------------------

## 19. Final Product Experience

When the redesign is complete, a merchant should be able to:

-   Open MarketMate and quickly understand the business position.
-   Find Checkout without searching through confusing menu labels.
-   Record a sale or expense with minimal effort.
-   Find products and understand stock levels.
-   Know which customers owe money.
-   Review invoices and transactions.
-   Understand reports without needing accounting knowledge.
-   Use business tools without confusing estimates with actual results.
-   Find help when needed.

The application should feel calm, clear, trustworthy and professional.

**The guiding principle is simple: MarketMate should make managing a
business feel easier, not make the merchant learn complicated
software.**

------------------------------------------------------------------------

## 20. Instructions for the Development Team or AI Coding Agent

Use this document together with the existing MarketMate source code and
current product behaviour.

Before implementing any screen: 1. Inspect the current component and its
route. 2. Understand its data source and existing actions. 3. Identify
permissions and subscription checks. 4. Identify calculations and
validation rules. 5. Reuse existing services, contexts and types. 6.
Plan the UI changes without breaking the existing flow.

During implementation: - Work in small phases. - Keep changes focused. -
Reuse shared components. - Maintain TypeScript types. - Avoid duplicate
business logic. - Do not replace working integrations with mock data. -
Do not hardcode business figures. - Do not silently remove existing
actions. - Test both desktop and mobile layouts.

After each phase: - Run the project's available checks. - Test the
affected user journeys. - Review role-based access. - Confirm that
records are saved and displayed correctly. - Report what changed, what
was tested and what remains incomplete.

If the current code conflicts with this document, do not guess. Explain
the conflict and recommend the safest implementation before changing
business logic or stored data.

**This document defines the target UI/UX experience. The existing
application remains the source of truth for current functionality, data,
calculations, permissions and integrations.**
