/**
 * MarketMate Terms of Service, Legal Disclaimers & Privacy Notice
 * 
 * Comprehensive legal protections for MarketMate Technologies
 * Founder & Executive Operator: Osovoyoron Ogheneovo Daniel
 * Governing Jurisdiction: Warri, Delta State, Federal Republic of Nigeria
 */

export interface LegalSection {
  id: string;
  title: string;
  badge?: string;
  summary: string;
  content: string[];
}

export const LEGAL_CONFIG = {
  appName: 'MarketMate',
  entityName: 'MarketMate Technologies Limited',
  cacRegNo: '9931755',
  cacDisplay: 'CAC Reg No: 9931755',
  founderName: 'Osovoyoron Ogheneovo Daniel',
  location: 'Warri, Delta State, Nigeria',
  country: 'Federal Republic of Nigeria',
  supportEmail: 'getmarketmate@gmail.com',
  officialGmail: 'getmarketmate@gmail.com',
  supportPhone: '+234 708 923 8728',
  supportWhatsApp: 'https://wa.me/2347089238728',
  officialDomain: 'https://getmarketmate.online',
  effectiveDate: 'October 13, 2026',
  version: '2.1.0',
  liabilityCapAmount: '₦1,000 (One Thousand Naira, or the subscription fee paid in the preceding 30 days)',
};

export const LEGAL_DISCLAIMERS: LegalSection[] = [
  {
    id: 'financial-disclaimer',
    title: '1. Financial, Accounting & Tax Disclaimer',
    badge: 'Crucial Notice',
    summary: 'MarketMate calculates estimates for operational management only; it is not certified accounting or tax advice.',
    content: [
      'MarketMate provides real-time sales tallies, profit margin estimations, and expense auditing purely as an operational software aid for retail business owners.',
      'MarketMate is NOT a certified public accounting firm, financial advisory service, auditor, or registered tax consultant.',
      'All calculations—including Gross Margin, Net Profit, and COGS (Cost of Goods Sold)—are derived strictly from data entered by the merchant and their staff.',
      'The merchant bears sole, independent responsibility for statutory tax compliance, including filings with the Federal Inland Revenue Service (FIRS) and State Internal Revenue Services (SIRS), Value Added Tax (VAT), and corporate withholding taxes.',
    ],
  },
  {
    id: 'bank-transfer-disclaimer',
    title: '2. Bank Transfer Verification & Fraud Responsibility',
    badge: 'Retail Safeguard',
    summary: 'Merchants must verify real bank alerts in their commercial banking app before releasing goods.',
    content: [
      'MarketMate enables merchants to categorize retail sales as "Cash", "Bank Transfer", or "POS Card". This is an internal ledger recording function only.',
      'MarketMate does NOT process, route, hold, escrow, or guarantee bank transfer funds between retail customers and the merchant.',
      'MarketMate is not integrated as a commercial payment gateway and does NOT confirm whether a customer\'s transfer has actually cleared.',
      'Store owners and cashiers bear 100% sole liability for verifying real incoming credit alerts directly inside their official commercial bank mobile app or USSD portal before handing over goods or issuing inventory.',
      'MarketMate Technologies and its founder assume zero liability for fake bank transfer alerts, reversible transactions, fraudulent payment screenshots, or dishonored customer payments.',
    ],
  },
  {
    id: 'debt-ledger-disclaimer',
    title: '3. Customer Debt Recovery & Credit Ledger Disclaimer',
    badge: 'Credit Tool',
    summary: 'The Debt Ledger and WhatsApp templates are courtesy aids; MarketMate is not a debt collection agency.',
    content: [
      'The Customer Debt Book and automated WhatsApp reminder generators are courtesy communications tools designed to help merchants keep organized records of customer credit.',
      'MarketMate is NOT a licensed debt collection agency, financial guarantor, credit bureau, or enforcement agency.',
      'MarketMate does not guarantee that customers will settle outstanding balances, honor repayment schedules, or respond to reminders.',
      'The decision to extend credit or lend merchandise to any customer is solely at the merchant\'s own risk and discretion. MarketMate assumes no liability for uncollectible, disputed, or defaulted customer debts.',
    ],
  },
  {
    id: 'hardware-network-disclaimer',
    title: '4. Hardware, Barcode Scanning & Telecom Connectivity',
    badge: 'Technical Notice',
    summary: 'Barcode camera scanning and cloud sync depend on merchant hardware and network conditions.',
    content: [
      'Camera-based barcode scanning performance depends upon ambient lighting, camera resolution, lens focus, and barcode condition.',
      'While MarketMate is engineered with offline-first local storage, real-time cloud backup requires active telecommunication data services (e.g., MTN, Airtel, Glo, Starlink).',
      'MarketMate Technologies is not responsible for transaction recording delays or synchronization lag resulting from telecom downtime, server maintenance, power grid outages, or faulty merchant hardware.',
    ],
  },
  {
    id: 'inventory-cashier-disclaimer',
    title: '5. Inventory Reconciliation & Staff PIN Permissions',
    badge: 'Staff Management',
    summary: 'Merchants are responsible for staff oversight, PIN secrecy, and physical stock reconciliation.',
    content: [
      'MarketMate allows store owners to assign Cashier PINs and mask profit margins. However, physical inventory auditing, drawer cash counts, and staff integrity remain the sole duty of the store owner.',
      'MarketMate assumes no liability for internal staff theft, stock leakages, unauthorized drawer opening, or data inaccuracies caused by human entry error.',
    ],
  },
];

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms & Eligibility',
    summary: 'By registering, accessing, or using MarketMate, you enter a legally binding contract.',
    content: [
      'These Terms of Service ("Terms") constitute a legally binding agreement between you (the "Merchant", "User", or "Business Owner") and MarketMate Technologies (CAC Reg. No: 9931755), founded and operated by Osovoyoron Ogheneovo Daniel in Warri, Delta State, Nigeria ("MarketMate", "we", "us", or "our").',
      'By clicking "Get Started", registering an account, subscribing, or using the MarketMate POS register, you agree to comply with and be bound by these Terms and all incorporated Disclaimers.',
      'If you do not agree to these Terms, you must immediately cease accessing and using the software.',
    ],
  },
  {
    id: 'nature-of-service',
    title: '2. Nature of the Software (SaaS Operations)',
    summary: 'MarketMate is a business management software platform, not a financial institution.',
    content: [
      'MarketMate is a software-as-a-service (SaaS) application providing cloud point-of-sale registers, barcode product management, digital receipt generation, expense ledgers, and profit analytics.',
      'MarketMate is NOT a deposit-taking bank, money transmitter, escrow provider, credit bureau, or financial intermediary.',
      'MarketMate does not hold customer funds or operate customer bank accounts.',
    ],
  },
  {
    id: 'prohibited-uses',
    title: '3. Prohibited Goods, Contraband & Fraud',
    summary: 'Strict prohibition against using MarketMate for unlawful merchandise or illicit schemes.',
    content: [
      'You agree NOT to use MarketMate to catalog, sell, or manage any of the following:',
      '• Stolen property, counterfeit goods, or unregistered controlled substances / illicit narcotics.',
      '• Illegal weapons, explosives, or hazardous contraband.',
      '• Ponzi schemes, fraudulent investment products, pyramid scams, or advance-fee fraud.',
      '• Merchandise that infringes upon third-party intellectual property or violates the laws of the Federal Republic of Nigeria.',
      'MarketMate Technologies reserves the unconditional right to suspend or permanently terminate any merchant account immediately upon discovery of unlawful activity without refund.',
    ],
  },
  {
    id: 'subscriptions-refunds',
    title: '4. Subscriptions, Fees & Payment Reconciliation',
    summary: 'Pioneer Pro subscription terms, bank transfer verification, and non-refundable service fees.',
    content: [
      'MarketMate provides a Free Pioneer Tier (core POS, barcode register, offline storage) and Pioneer Pro Tiers (promotional launch rate of ₦1,000/month or ₦3,000 for the full 3-Month Q4 Pass covering October, November, and December 2026).',
      'Subscription payments made via manual bank transfer are activated upon admin statement reconciliation. Merchants must provide accurate bank transaction references.',
      'Once a subscription tier is activated, subscription fees are non-refundable, as server resources, cloud databases, and software capabilities are provisioned immediately.',
    ],
  },
  {
    id: 'limitation-of-liability',
    title: '5. Strict Limitation of Liability (Founder Shield)',
    badge: 'Legal Protection',
    summary: 'Founder and platform liability is strictly capped to the maximum extent permitted by Nigerian law.',
    content: [
      'TO THE MAXIMUM EXTENT PERMITTED BY THE LAWS OF THE FEDERAL REPUBLIC OF NIGERIA, IN NO EVENT SHALL MARKETMATE TECHNOLOGIES, ITS FOUNDER (OSOVOYORON OGHENEOVO DANIEL), DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES.',
      'THIS INCLUDES, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF GOODWILL, LOSS OF INVENTORY, BUSINESS INTERRUPTION, DATA CORRUPTION, OR THE INABILITY TO USE THE PLATFORM.',
      `IN ALL CIRCUMSTANCES, THE MAXIMUM AGGREGATE LIABILITY OF MARKETMATE TECHNOLOGIES FOR ANY AND ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS SHALL BE STRICTLY LIMITED TO ${LEGAL_CONFIG.liabilityCapAmount}.`,
    ],
  },
  {
    id: 'indemnification',
    title: '6. Indemnification',
    summary: 'Merchants agree to protect MarketMate from customer disputes or regulatory penalties.',
    content: [
      'You agree to defend, indemnify, and hold harmless MarketMate Technologies, its founder (Osovoyoron Ogheneovo Daniel), and affiliates from and against any third-party claims, liabilities, damages, losses, or legal expenses (including reasonable attorneys\' fees) arising from:',
      '• Your retail merchandise, products sold, customer relations, or uncollected credit debts.',
      '• Your breach of these Terms, Nigerian consumer protection laws, or tax regulations.',
      '• Any fraudulent transactions or unauthorized cashier actions conducted within your store account.',
    ],
  },
  {
    id: 'ndpr-privacy',
    title: '7. Data Privacy & Nigeria Data Protection Act (NDPA)',
    summary: 'Compliance with Nigerian data privacy standards; your business data is never sold.',
    content: [
      'MarketMate complies with the Nigeria Data Protection Act (NDPA) and NDPR standards.',
      'We process merchant store data and customer records solely for the functional operation of your store (e.g., printing receipts, calculating profits, backing up inventory).',
      'We do NOT sell, rent, or trade your store data, sales history, or customer phone numbers to third-party marketing companies or competitors.',
      'You warrant that you have obtained lawful consent from your customers prior to sending them automated digital receipts or WhatsApp debt reminders.',
    ],
  },
  {
    id: 'governing-law',
    title: '8. Governing Law & Dispute Resolution',
    summary: 'Governed by Nigerian law with dispute resolution seated in Delta State, Nigeria.',
    content: [
      'These Terms shall be governed by, construed, and enforced in accordance with the Laws of the Federal Republic of Nigeria.',
      'Any dispute, controversy, or claim arising out of or relating to these Terms shall first be submitted to good-faith mutual mediation for a period of thirty (30) business days.',
      'If unresolved, the dispute shall be resolved through binding arbitration or submitted to the exclusive jurisdiction of the competent courts located in Warri, Delta State, Nigeria.',
    ],
  },
];
