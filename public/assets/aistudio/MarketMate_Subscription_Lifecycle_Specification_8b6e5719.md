# MarketMate Subscription Lifecycle

## Product & Technical Implementation Specification

**Document status:** Implementation specification\
**Product:** MarketMate\
**Primary audience:** Google AI Studio / engineering team\
**Scope:** Merchant subscription experience, payment review,
subscription lifecycle, admin integration, backend security, and
notifications.

------------------------------------------------------------------------

## 1. Objective

Implement a reliable, expiry-aware subscription lifecycle for MarketMate
using the existing subscription and manual bank-transfer workflow.

The implementation must extend the current product. It must **not**
create a separate application, replace the existing admin dashboard, or
disrupt merchant operations.

The system must ensure that: - Merchants can view available plans and
submit payment details. - Subscription requests remain pending until an
authorised admin verifies payment. - Only a trusted server-side process
or authorised admin can grant or revoke paid access. - Active
subscriptions have clear start and expiry dates. - Expired subscriptions
automatically lose paid access. - Merchants and admins can see accurate
subscription status. - All important payment and entitlement changes are
recorded for audit purposes.

## 2. Non-negotiable Existing-System Constraints

Before changing code, inspect the current implementation and reuse it
wherever practical.

Relevant existing areas include: - `src/lib/subscriptionService.ts` -
`src/components/subscription/SubscribeModal.tsx` -
`src/context/AuthContext.tsx` - `src/types/index.ts` -
`src/components/admin/AdminPortalView.tsx` - `src/lib/adminConfig.ts` -
`firestore.rules` - `server.ts`

### Preserve these existing features

-   The current Admin Dashboard and all its tabs and functionality.
-   The existing **Subscription Approvals** section.
-   Existing merchant dashboard and navigation.
-   POS/register, sales, expenses, inventory, invoices, CRM, debt book,
    reports, AI tools, referrals, and other existing features.
-   Firebase Authentication and existing business accounts.
-   Existing manual bank-transfer payment flow, unless a change is
    strictly required for security or lifecycle correctness.

Do not rebuild `AdminPortalView.tsx`. Extend the existing Subscription
Approvals section only where necessary. Do not create a second admin
dashboard or a parallel subscription-management interface.

## 3. Plans and Pricing

Use the following confirmed pricing for the current promotional period:

  ------------------------------------------------------------------------
  Plan                                         Price Access period
  --------------------- ---------------------------- ---------------------
  Monthly                                     ₦1,000 1 calendar month from
                                                     activation

  October--December                           ₦3,000 Promotional Q4
  2026 package                                       package; access
                                                     through 31 December
                                                     2026
  ------------------------------------------------------------------------

Important: - October--December 2026 is **Q4**, not Q3. - Do not label
the ₦3,000 package as an annual plan. - The existing `annualPlanPrice`
field must not be used to represent this three-month promotional
package. Use a clearly named `q4PassPrice` / `q4_pass` plan instead. -
The Q4 package is assumed to expire at the end of **31 December 2026**,
even if purchased later in the quarter. Keep the expiry rule
configurable so the product owner can change it if the commercial policy
changes. - The standard price from January 2027 has not yet been
confirmed. Do not invent or hardcode it. Store future plan prices in
admin-managed configuration. - Prices shown to merchants, saved on a
payment request, and checked during approval must be consistent. The
server must use trusted configured prices, not a client-submitted
amount.

## 4. Payment Method and Verification

### Initial implementation: manual bank transfer

Retain the existing bank-transfer workflow: 1. Merchant opens the
subscription screen. 2. Merchant selects an available plan. 3. The app
displays the configured bank details and exact amount. 4. Merchant
transfers payment using their banking app. 5. Merchant submits the
required transfer details in MarketMate. 6. The request is saved with
`pending` status. 7. An authorised admin reviews the request and
verifies the payment outside the app. 8. The admin approves or rejects
the request in the existing Subscription Approvals section. 9. On
approval, the trusted backend grants the subscription and records the
entitlement period. 10. The merchant receives an in-app notification
and, where configured, an email.

Do not activate a subscription merely because a merchant submits a
payment form or uploads proof.

### Payment request information

Capture and retain, where available: - Request ID - Business ID -
Merchant user ID - Plan ID and plan name - Configured price and currency
(`NGN`) - Amount expected - Sender bank - Sender account name - Transfer
reference / narration - Optional payment note or proof reference -
Submission timestamp - Review status - Reviewer admin ID - Review
timestamp - Rejection reason, if rejected

Do not store card details, bank login credentials, PINs, OTPs, or other
banking secrets.

### Future payment provider support

Keep payment handling modular so Paystack or another approved provider
can be added later. Do not implement or imply automatic Paystack payment
verification in this phase. If a provider is added later, payment
confirmation must be validated server-side using verified provider
callbacks/webhooks and/or a server-to-server transaction verification
request. A browser redirect alone must never grant access.

## 5. Subscription Status Model

Use a consistent status model across the UI, database, and service
layer.

  -----------------------------------------------------------------------
  Status                  Meaning                 Paid access
  ----------------------- ----------------------- -----------------------
  `free`                  No active paid          No
                          subscription            

  `pending`               Payment request         No
                          submitted and awaiting  
                          review                  

  `active`                Subscription is         Yes
                          approved and within its 
                          validity period         

  `expiring_soon`         Active subscription is  Yes
                          within the configured   
                          reminder window         

  `expired`               Subscription validity   No
                          period has ended        

  `rejected`              Payment request was     No, unless another
                          rejected                valid subscription
                                                  exists

  `cancelled`             Subscription was        No, from cancellation
                          cancelled by an         effective time
                          authorised action       
  -----------------------------------------------------------------------

`expiring_soon` may be derived from an active subscription's expiry date
rather than stored as a separate entitlement state. Avoid inconsistent
duplicate status fields.

A pending or rejected payment request must not overwrite or terminate a
separate, still-valid subscription.

## 6. Subscription Period Rules

Use server timestamps and the `Africa/Lagos` business timezone for
date-based display and policy calculations.

### Monthly plan

-   Start: timestamp at which an authorised approval successfully grants
    the subscription.
-   Expiry: one calendar month after the activation date, using a
    consistent date calculation.
-   If the activation day does not exist in the following month, use the
    last valid day of that month.
-   Store timestamps in UTC; display dates in the Africa/Lagos timezone.

### Q4 promotional package

-   Start: timestamp at which an authorised approval successfully grants
    the subscription.
-   Expiry: end of 31 December 2026 in the Africa/Lagos timezone,
    represented as an unambiguous stored timestamp.
-   If the Q4 package is no longer available, prevent new purchases
    unless an authorised admin re-enables it.

### Renewal

-   A renewal request must not extend access until payment is approved.
-   If the merchant renews before expiry, the new period should begin
    immediately after the current expiry, avoiding loss of already-paid
    time.
-   If the merchant renews after expiry, the new period begins at the
    new approval time.
-   Apply the selected plan's configured period rules. Do not allow the
    client to submit arbitrary start or expiry dates.

## 7. Merchant Subscription Experience

Extend the existing subscription modal/page rather than creating a
disconnected subscription experience.

The merchant should be able to:

### View plan information

-   Plan name
-   Price in naira
-   What the plan covers
-   Start and expiry policy
-   Promotional availability and end date, where applicable

### View current subscription

Show: - Current status - Current plan - Activation date - Expiry date -
Days remaining, where relevant - Renewal action

### Submit manual payment

-   Select an available plan.
-   View bank name, account name, account number, and exact amount.
-   Enter sender bank and sender account name.
-   Enter transfer reference or narration.
-   Add optional note / proof reference.
-   Review the information before submission.
-   Submit the request.

### View request status

Show clear states: - Awaiting payment review - Payment approved -
Payment rejected, including the reason where supplied - Subscription
active - Subscription expiring soon - Subscription expired

Prevent accidental duplicate submissions where an equivalent unresolved
request already exists. Provide a clear explanation and allow a retry if
the prior request was rejected or legitimately withdrawn.

Do not present a payment request as successful if the database write
fails. Show an error and allow the merchant to retry safely.

## 8. Existing Admin Dashboard Integration

Extend the existing **Subscription Approvals** area inside
`AdminPortalView.tsx`.

Do not replace or redesign the entire admin dashboard.

### Admin capabilities

Authorised admins should be able to: - View pending, approved, rejected,
and all payment requests. - Search by business name, merchant, request
ID, or transfer reference. - Filter by status, plan, and date. - Inspect
payment details before taking action. - Approve a verified payment. -
Reject a payment with a required reason. - View active and expired
subscriptions. - View subscription start and expiry dates. - View plan
and amount paid. - Manually extend, cancel, or revoke a subscription
when authorised. - See who performed each administrative action and
when. - View summary metrics such as pending requests, active
subscriptions, expired subscriptions, and collected subscription
revenue.

### Admin configuration

Where the existing configuration UI supports it, allow authorised admins
to manage: - Bank transfer details. - Monthly plan price. - Q4
promotional package price and availability. - Future plan prices and
availability. - Expiry reminder window. - Renewal/expiry policy
settings, where appropriate.

Do not expose admin configuration or privileged actions to ordinary
merchants.

### Approval behaviour

On approval: 1. Re-check that the request exists and is still pending.
2. Verify that the acting user is authorised. 3. Validate the plan and
amount against trusted configuration. 4. Calculate the correct start and
expiry dates on the trusted server. 5. Update the payment request and
business entitlement atomically where supported. 6. Record the reviewer,
approval time, and resulting subscription period. 7. Write an audit
event. 8. Trigger notifications only after the database operation
succeeds.

Approval must be idempotent: repeated clicks or retries must not grant
duplicate subscription periods or duplicate revenue entries.

On rejection: 1. Confirm the request is pending. 2. Require a rejection
reason. 3. Update the request and record reviewer and review time. 4.
Write an audit event. 5. Notify the merchant after the update succeeds.
6. Do not change a separate active subscription.

## 9. Backend, Entitlement, and Security Requirements

Subscription entitlement is a security-sensitive operation.

### Trusted authority

-   The client must never be trusted to grant paid access.
-   Do not rely on a client-callable `activateSubscription()` method to
    grant paid entitlements.
-   Move approval and entitlement-changing operations to a trusted
    server-side path using verified Firebase identity and admin
    authorisation.
-   Reuse the existing Express backend where appropriate, after
    inspecting its setup and dependencies.
-   If a Firebase Admin SDK or equivalent trusted server environment is
    not configured, document and configure the required secure backend
    capability before implementing privileged writes. Do not simulate
    server security with client-side checks.

### Firestore rules

Review and update `firestore.rules` carefully.

For `subscription_requests`: - Merchants may create requests only for
their own authenticated business/account. - Merchants may read only
their own requests. - Merchants must not change review status, reviewer,
approval time, granted period, or other privileged fields. - Only
authorised admins or trusted backend operations may approve or reject. -
Do not allow broad listing of all merchants' requests by any signed-in
user.

For business subscription fields: - A merchant may update ordinary
business profile fields as permitted by existing rules. - A merchant
must not write or modify privileged subscription fields, including
`isSubscribed`, `subscriptionStatus`, `subscriptionPlan`,
`subscribedAt`, `subscriptionStartsAt`, `subscriptionExpiresAt`, payment
approval metadata, or entitlement overrides. - Admin/trusted backend
authority may update those fields. - Preserve legitimate existing
business updates and avoid breaking unrelated merchant functionality.

Retain existing super-admin access controls and validate authorisation
server-side. Do not rely only on hidden UI buttons or frontend role
checks.

### Data integrity

Use Firestore transactions or another atomic strategy for approval and
entitlement changes where possible.

Do not report success if a database write fails. Do not swallow write
errors and return `true`.

Avoid trusting localStorage as the source of truth for paid access. It
may be used for non-authoritative caching only. The server/database
entitlement must be checked and enforced.

## 10. Expiry Enforcement and Access Control

Paid access must be determined from trusted subscription data and the
current time.

A subscription is active only when: - Its status is valid, and - Its
start time has been reached, and - Its expiry time has not been reached,
unless an explicitly authorised admin override applies.

When a subscription expires: - Set or derive the status as `expired`. -
Remove paid entitlement. - Keep the merchant's account and business data
intact. - Do not delete sales, expenses, inventory, customers, invoices,
reports, or transaction history. - Show a clear renewal message. -
Preserve access to account login and the minimum screens/actions
required to view subscription information and renew.

Do not unexpectedly delete or lock merchant data.

### Feature gating

First identify which existing features are currently intended to be paid
features. Apply subscription gating only to those agreed features.

Do not arbitrarily block core account access or expose data loss. Keep
feature access decisions centralised in one entitlement/feature-access
service rather than scattering hardcoded checks throughout components.

Admin, super-admin, and existing demo-mode access must continue to work
according to current product rules.

## 11. Notifications and Reminders

Provide in-app notifications and use the existing email service where
configured.

Suggested notification events: - Payment request submitted. - Payment
approved. - Payment rejected, including reason. - Subscription expiring
soon. - Subscription expired. - Renewal approved.

Recommended reminder schedule: - 7 days before expiry. - 3 days before
expiry. - 1 day before expiry. - On expiry.

Make the reminder window configurable. Prevent duplicate reminders for
the same subscription and reminder milestone. Notifications must be
generated from trusted server-side scheduled processing, not from a
merchant's browser being open.

If scheduled jobs are not currently configured, identify the required
deployment mechanism and document it. Do not claim reminders are
automated until the scheduled process is deployed and verified.

## 12. Suggested Data Model

Adapt the existing schema rather than duplicating collections
unnecessarily.

### Business subscription fields

A business record may contain fields equivalent to:

``` ts
interface BusinessSubscription {
  subscriptionStatus: 'free' | 'active' | 'expired' | 'cancelled';
  subscriptionPlan?: 'monthly' | 'q4_pass' | string;
  subscriptionStartsAt?: Timestamp;
  subscriptionExpiresAt?: Timestamp;
  subscribedAt?: Timestamp;
  lastSubscriptionRequestId?: string;
  subscriptionUpdatedAt?: Timestamp;
  subscriptionUpdatedBy?: string;
}
```

Keep compatibility with existing fields such as `isSubscribed` while
migrating. If `isSubscribed` remains, derive/update it from the
authoritative entitlement state and never allow the merchant client to
set it.

### Payment request

Adapt the existing `SubscriptionRequest` type. A request should include
fields equivalent to:

``` ts
interface SubscriptionRequest {
  id: string;
  businessId: string;
  userId: string;
  planId: 'monthly' | 'q4_pass';
  planName: string;
  currency: 'NGN';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  senderBank?: string;
  senderAccountName?: string;
  transferReference?: string;
  paymentNote?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
  grantedStartsAt?: Timestamp;
  grantedExpiresAt?: Timestamp;
}
```

The exact shape must be reconciled with existing types and stored
documents before migration. Do not blindly rename or remove existing
fields in a way that breaks old records.

### Audit events

Create or reuse a protected audit collection for events such as: -
`subscription_request_submitted` - `subscription_payment_approved` -
`subscription_payment_rejected` - `subscription_renewed` -
`subscription_extended` - `subscription_cancelled` -
`subscription_expired`

Each event should record relevant business ID, request/subscription ID,
actor ID, timestamp, action, and safe metadata. Never store banking
secrets.

## 13. Error Handling and Edge Cases

Handle these cases explicitly: - Firestore unavailable during payment
submission. - Duplicate payment submission. - Admin approves a request
that was already reviewed. - Two admins attempt to review the same
request. - Admin approval succeeds but notification delivery fails. -
Merchant has an active subscription and submits another request. -
Merchant submits a renewal before expiry. - Merchant renews after
expiry. - Q4 package is purchased close to 31 December. - Plan is
disabled or its price changes after a request was submitted. - Merchant
account or business ownership changes. - Subscription expiry occurs
while the merchant is using the app. - Client has stale cached
subscription data. - Admin manually extends or revokes access.

For a submitted request, preserve the quoted amount and plan terms as a
snapshot. If configuration changes before approval, flag the mismatch
for admin review rather than silently changing what the merchant agreed
to pay.

## 14. Implementation Sequence

Implement in controlled phases. After each phase, run type checks,
lint/build checks available in the repository, and relevant tests.

### Phase 1 --- Repository audit and compatibility

-   Inspect current subscription service, modal, auth context, types,
    Firestore rules, admin section, Express server, Firebase setup, and
    package dependencies.
-   Document existing behaviour and migration risks.
-   Confirm the actual source of truth for business ownership and admin
    roles.

### Phase 2 --- Data model and subscription service

-   Introduce clear plan IDs and expiry fields.
-   Remove the misleading use of `annualPlanPrice` for the Q4 pass.
-   Implement trusted date/period calculation.
-   Fix false-success handling for failed Firestore writes.
-   Add idempotent approval and renewal operations.

### Phase 3 --- Trusted backend and security

-   Implement secure admin approval/rejection endpoints or callable
    trusted functions.
-   Verify Firebase identity and admin authorisation on every privileged
    action.
-   Update Firestore rules to prevent merchant entitlement manipulation.
-   Add audit logging.

### Phase 4 --- Merchant experience

-   Extend the existing subscription modal/page.
-   Display current status, plan, start/expiry dates, and renewal state.
-   Improve pending, approved, rejected, and error feedback.
-   Prevent duplicate pending requests.

### Phase 5 --- Existing admin integration

-   Extend the current Subscription Approvals section.
-   Add expiry visibility, search/filter improvements, safe manual
    extension/cancellation, and audit history.
-   Preserve every other admin dashboard feature.

### Phase 6 --- Expiry and reminders

-   Implement expiry-aware entitlement checks.
-   Add scheduled reminder and expiry processing.
-   Ensure reminders are idempotent.
-   Preserve merchant data after expiry.

### Phase 7 --- Testing and release readiness

-   Run TypeScript checks and production build.
-   Test security rules with merchant, admin, and unauthorised users.
-   Test payment submission, approval, rejection, renewal, expiry, and
    edge cases.
-   Verify existing merchant and admin workflows still work.
-   Provide a summary of changed files, configuration/deployment
    requirements, test results, and any remaining limitations.

## 15. Acceptance Criteria

The work is complete only when all of the following are true:

1.  A merchant can view the configured ₦1,000 monthly plan and ₦3,000 Q4
    package while each is available.
2.  The Q4 package is clearly identified as October--December 2026, not
    annual.
3.  A merchant can submit a manual transfer request and see a genuine
    pending state only after the database write succeeds.
4.  A merchant cannot approve their own request or alter its review
    status.
5.  An unauthorised user cannot access other merchants' payment
    requests.
6.  Only an authorised admin/trusted backend can grant paid entitlement.
7.  Approval records a correct start date, expiry date, reviewer, and
    audit event.
8.  Duplicate approval cannot grant duplicate time or duplicate revenue.
9.  Renewal before expiry extends from the existing expiry; renewal
    after expiry starts from the new approval time.
10. Expired subscriptions lose paid access without deleting merchant
    data.
11. Expiry reminders are generated by a deployed scheduled process and
    are not duplicated.
12. The existing Admin Dashboard and all unrelated features remain
    functional.
13. Existing subscription requests and business records remain
    compatible or are migrated safely.
14. Failed writes and failed operations are reported honestly; the UI
    never displays false success.
15. The application passes its available type-check, lint, build, and
    relevant tests.

## 16. Instructions to the AI Implementer

You are modifying an existing production-oriented application, not
starting a new project.

Before coding: 1. Read the relevant files and understand the current
implementation. 2. Identify existing functions and components that
should be extended. 3. Check the package dependencies and
Firebase/server configuration before selecting a backend approach. 4.
Prepare a concise implementation plan and identify any required
migration or environment configuration.

During implementation: - Make the smallest safe changes that achieve the
requirements. - Reuse existing components, styles, services, and
conventions. - Preserve existing functionality and backward
compatibility. - Do not create a new admin dashboard. - Do not replace
the existing Subscription Approvals section. - Do not hardcode the
January 2027 price. - Do not implement Paystack in this phase. - Do not
trust client-side subscription state for paid access. - Do not claim a
feature is complete unless it is implemented, configured, and tested.

At completion, report: - Files created or modified. - What was
implemented in each phase. - Any Firestore rules or data migration
changes. - Required environment variables, backend deployment, and
scheduled-job setup. - Tests run and their actual results. - Known
limitations or decisions requiring product-owner approval.

**Primary product principle:** A subscription is not active because a
merchant says they paid. It becomes active only after trusted
verification and an authorised approval, and it remains active only for
its valid subscription period.
