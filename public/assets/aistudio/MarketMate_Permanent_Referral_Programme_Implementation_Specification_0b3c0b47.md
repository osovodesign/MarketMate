# MarketMate Permanent Referral Programme

## Google AI Studio Implementation Specification

**Repository reviewed:** `osovodesign/MarketMate`\
**Purpose:** Convert the existing time-limited referral campaign into a
permanent programme.\
**Implementation:** Update the current application. Do not rebuild the
referral system.

------------------------------------------------------------------------

## 1. Objective

Make the MarketMate referral programme permanent. Merchants must be able
to share their existing personal referral link and invite as many people
as they want, whenever they want.

There must be: - No campaign end date. - No expiry date on referral
links or codes. - No limit on the number of people a merchant can
invite. - No requirement to create a new referral link after a date
passes.

**Programme positioning**

**MarketMate Referral Programme**\
**Invite More. Grow Together.**

Suggested description:

> Share your MarketMate referral link with other business owners. When
> someone registers through your link and subscribes to MarketMate, you
> earn the existing referral reward. Your link stays active, so you can
> keep inviting more businesses.

Use simple language that merchants can understand.

## 2. Confirmed Business Rules

These are approved requirements:

1.  The referral programme is permanent.
2.  There is no programme closing date.
3.  Every merchant can invite unlimited people.
4.  Each merchant keeps using the same referral code and link.
5.  New users can register through a referral link at any time.
6.  Existing referral records and earned rewards must be preserved.
7.  Existing reward qualification rules remain unchanged.
8.  Do not introduce new cash rewards, commissions, withdrawals or
    benefits.

### Important: unlimited invitations are not unlimited reward percentage

The current code awards **5% per referred merchant who registers and
subscribes**, with an accumulated discount capped at **50%**:

``` ts
const totalDiscountPercent = Math.min(
  totalSubscribed * REFERRAL_CAMPAIGN.discountPercent,
  50
);
```

For this implementation, preserve: - 5% per qualified referral. - 50%
maximum accumulated discount. - Unlimited invitations, even after the
merchant reaches the 50% reward cap.

Do not remove the 50% reward cap. The user approved unlimited
invitations, not a new reward formula.

## 3. Current Codebase Findings

The GitHub repository `osovodesign/MarketMate` was inspected before
preparing this specification.

### Files involved

  ------------------------------------------------------------------------------------------------------
  File                                          Current role                     Required work
  --------------------------------------------- -------------------------------- -----------------------
  `src/lib/referralService.ts`                  Campaign settings, referral      Remove time-limited
                                                code/link generation, WhatsApp   campaign behaviour and
                                                message, signup recording,       update permanent
                                                qualification and totals         programme copy

  `src/components/referral/ReferralView.tsx`    Full referral page               Remove campaign dates
                                                                                 and show permanent
                                                                                 programme

  `src/components/referral/ReferralModal.tsx`   Referral modal                   Apply same permanent
                                                                                 wording and behaviour

  `src/components/auth/Signup.tsx`              Manual and URL-detected referral Keep attribution
                                                code entry                       available at all times

  `src/context/AuthContext.tsx`                 Records referrals during signup  Preserve and verify
                                                                                 email and Google signup
                                                                                 attribution

  `src/lib/subscriptionService.ts`              Calls                            Preserve qualification
                                                `recordReferralSubscription()`   connection
                                                after subscription approval      

  `src/types/index.ts`                          Defines `ReferralRecord`         Make historical date
                                                                                 fields optional if safe

  `firestore.rules`                             Referral record access           Review and secure
                                                                                 referral ownership and
                                                                                 reward updates
  ------------------------------------------------------------------------------------------------------

### Existing behaviour found

-   `getReferralCodeForUser()` generates a deterministic code from the
    merchant's Firebase user ID.
-   `getReferralShareUrl()` creates a link using
    `https://getmarketmate.online/?ref=CODE`.
-   Referral capture supports `?ref=` and `?r=` and stores the code in
    local storage.
-   The signup form accepts an automatic or manually entered referral
    code.
-   `AuthContext.tsx` calls `recordReferralSignup()` during signup.
-   `subscriptionService.ts` calls `recordReferralSubscription()` after
    an approved subscription.
-   Referral statistics include total registered, subscribed, pending
    and total discount.
-   The service currently contains hardcoded start/end dates, duration
    text and campaign-specific messages.
-   `ReferralView.tsx` and `ReferralModal.tsx` show October 12--30, 2026
    campaign wording.
-   New referral records currently receive `validFrom` and `validUntil`.
-   `ReferralRecord` currently requires both date fields.
-   The service code inspected does not show a referral-count limit.
    Confirm no additional date or invitation limit exists elsewhere
    before implementation.
-   The referral Firestore rule currently permits any signed-in user to
    read/list, create and update referral documents. This is too broad
    for private referral and reward data and must be reviewed carefully.

**Do not assume that deleting the date text is enough.** Search the
whole codebase for campaign dates, expiry checks, referral qualification
and admin filters.

## 4. Required Implementation

### 4.1 Replace time-limited campaign configuration

In `src/lib/referralService.ts`, the current configuration resembles:

``` ts
export const REFERRAL_CAMPAIGN = {
  discountPercent: 5,
  startDate: '2026-10-12',
  endDate: '2026-10-30',
  title: 'MarketMate Pioneer Referral Campaign',
  headline: 'Refer a Business to Register & Subscribe — Earn 5% Off',
  durationText: 'October 12th – October 30th, 2026',
  description: '...',
};
```

Replace it with permanent programme configuration. Suggested direction:

``` ts
export const REFERRAL_PROGRAM = {
  rewardPercent: 5,
  maxDiscountPercent: 50,
  title: 'MarketMate Referral Programme',
  headline: 'Invite More. Grow Together.',
  description:
    'Share your referral link with other business owners. When they register and subscribe to MarketMate, you earn the existing referral reward. Your link stays active, so you can keep inviting more businesses.',
};
```

Adapt the names carefully so all imports are updated and the app
compiles. Do not leave old and new constants in conflicting use.

The new programme configuration must not have an `endDate`,
`durationText` or any value that is used to expire the programme.

### 4.2 Keep referral links and codes permanent

Preserve the current code generation and URL format unless a real
technical issue is found.

-   Do not generate a new code each time the page opens.
-   Do not add an expiry timestamp to a referral link.
-   Do not add an invitation limit.
-   Keep production domain `https://getmarketmate.online/`.
-   Keep localhost support for development.
-   A merchant must be able to use the same link in the future.

Example format:

``` text
https://getmarketmate.online/?ref=MM-A4F79C
```

The code above is illustrative. Use the actual signed-in merchant's
code.

### 4.3 Update WhatsApp invitation text

Update `getWhatsAppShareMessage()` in `src/lib/referralService.ts`.

Remove: - "Special Launch Offer". - October 12--30 dates. - Any message
that says the programme is closing or only valid for a launch window.

Suggested message:

``` text
Hey! This is [Business Name].

I use MarketMate to manage my sales, expenses, products and business performance.

You can join MarketMate using my referral link:

[REFERRAL LINK]

When you register and subscribe, I can earn a 5% referral discount under MarketMate's referral programme.

The referral programme is always open, so you can join whenever you're ready.
```

Keep the merchant name optional and generate the link through the
existing `getReferralShareUrl()` function. Do not promise a reward to
the invited merchant unless the programme actually provides one.

### 4.4 Update the full referral page

File: `src/components/referral/ReferralView.tsx`

Remove all references to: - Early Merchant Referral Offer. - Valid
October 12th--30th, 2026. - Oct 12--Oct 30, 2026. - "starting October
12th". - "for the Oct 12--30 launch". - Campaign end dates or expiry
warnings.

Use:

**Title:** MarketMate Referral Programme\
**Headline:** Invite More. Grow Together.\
**Supporting text:** Invite as many business owners as you want. Your
referral link never expires.

Suggested banner copy:

> Share your link with as many business owners as you want. Your link
> stays active, and you can keep inviting new merchants.

Keep the current reward display, calculated from the existing service.

Update the "How it works" steps:

1.  **Share Your Link** --- Send your personal referral link to other
    business owners.
2.  **They Join MarketMate** --- They register using your link and
    subscribe to MarketMate.
3.  **Earn Your Reward** --- When they meet the existing reward
    requirements, your 5% referral discount is added.

Explain unlimited invitations, but do not imply unlimited reward
percentage.

### 4.5 Update the referral modal

File: `src/components/referral/ReferralModal.tsx`

Apply the same changes as the full referral page: - Same title and
supporting message. - No campaign end date. - No expired launch-offer
wording. - Same reward calculation. - Same permanent referral link. -
Same updated WhatsApp message. - Clear statement that merchants can
invite as many people as they want.

The full page and modal must not show different reward rules.

### 4.6 Preserve signup attribution

Review these functions and files: - `detectAndStoreReferralCode()` -
`getPendingReferralCode()` - `clearPendingReferralCode()` -
`recordReferralSignup()` - `Signup.tsx` - `AuthContext.tsx`

Requirements: - Capture `?ref=CODE`. - Continue supporting `?r=CODE`. -
Keep the code while the visitor moves through signup. - Manual referral
code entry must still work. - Email/password signup must record the
referral. - Google signup must record the referral. - Refreshing or
navigating must not lose the pending code. - Do not overwrite an
existing referral attribution accidentally. - Reject self-referrals. -
Do not attribute the same new merchant twice. - Clear the pending code
only after attribution is safely recorded, or provide a recoverable
failure path. - Do not reject a signup because the old campaign date has
passed.

Keep the existing integration unless a specific bug needs correction.

### 4.7 Stop writing expiry dates on new referral records

`recordReferralSignup()` currently writes fields similar to:

``` ts
validFrom: REFERRAL_CAMPAIGN.startDate,
validUntil: REFERRAL_CAMPAIGN.endDate,
```

New records must not require a referral programme expiry date.

For new records: - Do not write `validUntil`. - Do not reject referrals
because the date is after October 30, 2026. - Keep `createdAt`. - Keep
the existing referral status and qualification fields. - Keep the reward
rate and useful attribution information. - Use a permanent programme
identifier such as `marketmate_permanent_referral` if an identifier is
needed.

### 4.8 Preserve historical referral records

Old records may contain:

``` ts
campaign: 'MarketMate Pioneer Referral Campaign',
validFrom: '2026-10-12',
validUntil: '2026-10-30',
```

Do not delete old referral records or remove historical fields in bulk.

Update `ReferralRecord` in `src/types/index.ts` so legacy date fields
can be optional, if all usages are checked:

``` ts
validFrom?: string;
validUntil?: string;
```

Historical dates can remain as historical information in admin records.
They must not stop an old referral from being counted or qualified.

Do not run an unapproved bulk migration.

### 4.9 Preserve reward qualification

The subscription approval flow currently calls:

``` ts
await recordReferralSubscription(request.userId, request.planName);
```

Keep this connection.

-   A signup remains pending if the existing rules require subscription
    before reward qualification.
-   A confirmed, approved subscription qualifies the referral.
-   A pending or rejected payment must not qualify the referral.
-   Repeated approval must not create duplicate rewards.
-   Preserve the existing status meanings unless a change is essential
    and documented.
-   Preserve 5% per qualified referral and the 50% maximum accumulated
    discount.
-   Clicking a referral link alone must not award a reward.

### 4.10 Unlimited invitations, including after reward cap

Search for and remove any logic that: - Limits the number of referral
records per merchant. - Stops a merchant's link after a certain number
of invites. - Rejects referrals after a campaign closes. - Hides the
referral page after the campaign end date. - Stops recording new
referrals when the merchant reaches 50%.

**The 50% reward cap is not an invitation cap.** A merchant must still
be able to invite more people after reaching 50%. Additional valid
referrals must continue to be recorded and displayed even when the
discount remains capped at 50%.

### 4.11 Referral statistics

Keep and verify: - Total registered referrals. - Total subscribed
referrals. - Pending referrals. - Current referral discount.

Ensure: - Referrals created after October 30, 2026 are counted. -
Historical records remain counted. - A referred merchant is not counted
twice. - New referrals continue to appear after the 50% reward cap. -
The displayed discount matches the current calculation.

Consider changing "Active Discount" to **"Earned Referral Discount"** so
the merchant understands the number. Do not imply a discount has already
been applied to a bill unless the billing logic confirms it.

### 4.12 Admin referral management

Inspect the existing admin referral section and preserve it.

Administrators must still be able to view referral records and the
statuses and dates already supported by the application.

-   Remove expired-campaign filters that hide referrals created after
    October 30.
-   Keep creation date as historical information.
-   Preserve existing authorised manual qualification controls.
-   Do not create a second admin dashboard.
-   Do not remove unrelated admin functions.

### 4.13 Firestore ownership and security

The current referral rule in `firestore.rules` was observed as:

``` text
match /referrals/{referralId} {
  allow get, list: if isSignedIn();
  allow create: if isSignedIn();
  allow update: if isSignedIn() || isSuperAdmin();
  allow delete: if isSuperAdmin();
}
```

This allows any signed-in user to read/list and update referral
documents. Review and correct this.

Requirements: - Merchants may only read referral information they are
entitled to see. - Merchants must not change referral qualification or
reward fields. - Merchants must not mark a referral as subscribed. -
Only a trusted authorised process or authorised super admin may update
qualification and reward fields. - Only authorised administrators may
access all referral records. - Keep signup attribution working after
access is tightened. - Do not rely on `referrerCode` alone as proof of
ownership. - `ReferralRecord` has an optional `referrerUserId`, but the
current `recordReferralSignup()` implementation does not populate it.
Investigate how codes map to their owners before implementing ownership
checks. - If secure server-side attribution is needed, inspect and use
the existing backend architecture. Do not simulate server security with
frontend checks. - Do not weaken Firestore rules to make the new flow
work.

If a safe security update requires backend work or a data migration,
explain the exact requirement and implement it carefully without
breaking existing records.

## 5. Final UI Wording

Use consistent language in the full referral page, modal, signup form
and share message.

  -----------------------------------------------------------------------
  Area                                Wording
  ----------------------------------- -----------------------------------
  Main title                          MarketMate Referral Programme

  Main headline                       Invite More. Grow Together.

  Supporting text                     Invite as many business owners as
                                      you want. Your referral link never
                                      expires.

  Referral code                       Your Referral Code

  Referral link                       Your Personal Referral Link

  Reward metric                       Earned Referral Discount

  Qualification note                  You earn the 5% referral discount
                                      when someone registers through your
                                      link and subscribes to MarketMate.

  Pending status                      Awaiting Subscription

  Qualified status                    Reward Earned

  Share action                        Share on WhatsApp

  Copy action                         Copy Referral Link
  -----------------------------------------------------------------------

Avoid "Early Merchant Referral Offer", "Pioneer Referral Campaign" as
the current programme name, "launch window", "campaign closes",
"expiring soon" and all October 12--30 dates in active programme UI.

Signup helper text when a code is present:

> Referral code applied. Your account will be linked to the person who
> invited you.

Do not promise a discount to the new merchant unless that benefit
exists.

## 6. Google AI Studio Instructions

Before editing:

1.  Inspect the latest versions of all files listed in this document.
2.  Search the entire codebase for `REFERRAL_CAMPAIGN`, `validUntil`,
    `validFrom`, `October 12`, `October 30`, `Pioneer Referral`,
    `Early Merchant Referral`, `referral`, and expiry checks.
3.  Find all components, services, signup paths and admin views that use
    referral data.
4.  Confirm the current referral code generation and signup attribution
    flow.
5.  Confirm the subscription approval path that calls
    `recordReferralSubscription()`.
6.  Confirm the Firestore rules and any server-side referral operations.
7.  List the files you intend to change before editing.

Implement in this order:

**Step 1 --- Service** - Introduce permanent programme configuration. -
Remove date-based campaign behaviour. - Update WhatsApp message. - Stop
requiring expiry dates on new records. - Preserve code/link generation,
signup attribution, qualification and reward calculation.

**Step 2 --- Types and compatibility** - Make legacy date fields
optional. - Check every `ReferralRecord` usage. - Preserve historical
data.

**Step 3 --- Referral page and modal** - Update `ReferralView.tsx`. -
Update `ReferralModal.tsx`. - Keep both consistent and responsive.

**Step 4 --- Signup attribution** - Test URL capture, manual code, email
signup and Google signup. - Verify persistence through
refresh/navigation. - Reject self-referrals and duplicate attribution.

**Step 5 --- Subscription qualification** - Confirm approved
subscriptions qualify referrals. - Confirm pending/rejected requests do
not qualify. - Confirm repeated approval does not duplicate rewards.

**Step 6 --- Admin and Firestore** - Preserve existing admin
management. - Remove campaign expiry filters. - Secure referral
ownership and reward updates. - Test merchant and super-admin access.

**Step 7 --- Cleanup** - Search the whole project for old campaign dates
and temporary wording. - Remove obsolete active UI copy. - Keep old
dates only as historical metadata where appropriate.

### Development rules

-   Modify the existing feature; do not rebuild it.
-   Do not create a second referral collection.
-   Do not change the referral URL format.
-   Do not change code generation without a proven reason.
-   Do not change the 5% reward or 50% cap.
-   Do not change subscription prices or payment approval behaviour.
-   Do not change unrelated MarketMate features.
-   Do not use mock referral data in the live application.
-   Do not report success if database writes fail.
-   Keep TypeScript types correct.
-   Remove obsolete imports.
-   Test desktop and mobile.

## 7. Acceptance Tests

### Permanent programme

-   [ ] Referral page has no end date.
-   [ ] Referral modal has no end date.
-   [ ] No active UI says the programme is closing.
-   [ ] A referral after October 30, 2026 is accepted.
-   [ ] The same referral link works in the future.
-   [ ] A merchant can invite more than one person without an invitation
    limit.

### Link and signup

-   [ ] `?ref=` attribution works.
-   [ ] `?r=` attribution works.
-   [ ] Manual referral code entry works.
-   [ ] Email/password signup records the referral.
-   [ ] Google signup records the referral.
-   [ ] Refresh/navigation does not lose a pending code.
-   [ ] Self-referrals are rejected.
-   [ ] A new merchant is not attributed twice.

### Rewards

-   [ ] Registration creates a pending referral where subscription is
    still required.
-   [ ] Approved subscription qualifies the referral.
-   [ ] Pending/rejected subscription does not qualify it.
-   [ ] Reward remains 5% per qualified referral.
-   [ ] Maximum accumulated discount remains 50%.
-   [ ] Merchant can continue inviting after reaching 50%.
-   [ ] Additional referrals are still recorded after reaching the cap.
-   [ ] Repeated approval does not duplicate rewards.

### Historical data and admin

-   [ ] Existing referral records are preserved.
-   [ ] Records with `validUntil: 2026-10-30` remain visible.
-   [ ] Historical dates do not block qualification.
-   [ ] Old and new referrals appear in statistics.
-   [ ] Authorised admins retain referral history access.
-   [ ] No expired-campaign filter hides new referrals.

### Security and quality

-   [ ] A merchant cannot read another merchant's private referral
    records.
-   [ ] A merchant cannot change qualification status or grant
    themselves a reward.
-   [ ] Only authorised admins/trusted backend operations can update
    protected reward fields.
-   [ ] Signup attribution still works after Firestore rules are
    tightened.
-   [ ] `npm run build` passes.
-   [ ] TypeScript checks pass.
-   [ ] No broken imports remain.
-   [ ] Page, modal and WhatsApp sharing work on mobile and desktop.
-   [ ] No unrelated MarketMate feature is broken.

## 8. Scope Boundaries

This task is only to make the existing referral programme permanent.

Do not: - Redesign all of MarketMate. - Change subscription plans or
prices. - Change subscription approval. - Introduce Paystack or another
payment provider. - Add cash rewards or withdrawals. - Remove the 5%
reward or 50% cap. - Limit invitations. - Delete historical referral
records. - Create a second referral system. - Change unrelated business
logic.

If a bug directly prevents permanent referrals from working, explain it
and fix it only if it is within scope and can be fixed safely.

## 9. Required Completion Report

When finished, AI Studio must report:

1.  Files changed and what changed in each.
2.  Confirmation that the programme has no expiry date.
3.  Confirmation that invitations are unlimited.
4.  Confirmation that codes and links remain stable.
5.  Confirmation that the 5% reward and 50% cap remain unchanged.
6.  Confirmation that old referral records were preserved.
7.  Firestore/backend security changes made.
8.  Tests run and their results.
9.  Any remaining issue requiring the product owner's decision.

Do not claim completion if build checks, signup attribution, reward
qualification or security tests have not been verified.

------------------------------------------------------------------------

## Final Instruction

**Make MarketMate's existing referral programme permanent. Merchants
must be able to keep sharing their personal referral link and invite as
many businesses as they want, without a campaign end date or
referral-link expiry. Preserve the existing 5% reward per qualified
referral and the current 50% maximum discount. Preserve historical
referral records, keep signup and subscription qualification working,
and secure referral ownership and reward updates.**
