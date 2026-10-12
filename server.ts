import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

// Lazy initialization for Resend email client
let resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Generate branded responsive HTML email template for getmarketmate.online
function buildMarketMateEmailHtml(params: {
  title: string;
  content: string;
  recipientName?: string;
  businessName?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority?: string;
}): string {
  const { title, content, recipientName, businessName, actionLabel, actionUrl, priority } = params;
  const formattedContent = content
    .split('\n\n')
    .map((p) => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #334155;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const priorityBadge =
    priority === 'urgent'
      ? `<span style="display:inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #fee2e2; color: #991b1b; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 14px; letter-spacing: 0.5px;">🚨 High Priority Notice</span>`
      : priority === 'important'
      ? `<span style="display:inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 14px; letter-spacing: 0.5px;">⚡ Platform Announcement</span>`
      : '';

  const actionButton =
    actionLabel && actionUrl
      ? `
      <div style="margin: 28px 0; text-align: center;">
        <a href="${actionUrl.startsWith('http') ? actionUrl : 'https://getmarketmate.online/' + actionUrl}"
           style="background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          ${actionLabel} →
        </a>
      </div>`
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px;">
        MarketMate 🛍️
      </div>
      <div style="font-size: 13px; color: #a7f3d0; font-weight: 500;">
        Smart Retail Operating System for Nigerian Merchants
      </div>
    </div>

    <!-- Email Body -->
    <div style="padding: 32px 28px;">
      ${priorityBadge}
      
      <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.35;">
        ${title}
      </h1>

      <div style="font-size: 14px; color: #64748b; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
        Hello <strong>${recipientName || businessName || 'Valued Business Owner'}</strong>,
      </div>

      <div style="color: #334155;">
        ${formattedContent}
      </div>

      ${actionButton}

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;"><strong>Need support with your store?</strong></p>
        <p style="margin: 0;">Reply directly to this email or chat with our founder support desk on WhatsApp: <a href="https://wa.me/2347089238728" style="color: #059669; font-weight: bold; text-decoration: underline;">Direct Founder Support Desk (+234 708 923 8728)</a></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; line-height: 1.5;">
      <p style="margin: 0 0 4px 0;"><strong>MarketMate Technologies</strong> • Warri, Nigeria</p>
      <p style="margin: 0;">Dispatched from verified domain <strong>getmarketmate.online</strong>. Protected under NDPR standards.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Lazy initialization for Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Generate grounded fallback advice for Nigerian SMEs when Gemini API is under heavy traffic or offline
function generateGroundedFallbackAdvice(message: string, businessContext: any): string {
  const name = businessContext?.businessName || 'your business';
  const currencySymbol = businessContext?.currency === 'USD' ? '$' : '₦';
  const revMonth = businessContext?.metrics?.thisMonth?.revenue || 0;
  const expMonth = businessContext?.metrics?.thisMonth?.operatingExpenses || 0;
  const profitMonth = businessContext?.metrics?.thisMonth?.operatingProfit || 0;
  const marginMonth = businessContext?.metrics?.thisMonth?.profitMargin || 0;
  const topProducts = businessContext?.metrics?.topSellingProducts || [];
  const expenseCats = businessContext?.metrics?.expenseCategoryBreakdown || [];

  const lowerMsg = message.toLowerCase();

  // 1. Math / Calculation queries (e.g. "calculate 5000 + 2000", "what is 20% of 50000", "15000 * 4", markup calculations)
  const numbersInPrompt = message.match(/\d+([.,]\d+)?/g)?.map((n) => parseFloat(n.replace(/,/g, ''))) || [];
  
  if (lowerMsg.includes('calculate') || lowerMsg.includes('compute') || lowerMsg.includes('math') || lowerMsg.includes('%') || lowerMsg.includes('multiply') || lowerMsg.includes('divide') || lowerMsg.includes('+') || lowerMsg.includes('-') || lowerMsg.includes('*') || lowerMsg.includes('/')) {
    if (numbersInPrompt.length >= 2) {
      const [num1, num2] = numbersInPrompt;
      const sum = num1 + num2;
      const diff = Math.abs(num1 - num2);
      const prod = num1 * num2;
      const div = num2 !== 0 ? (num1 / num2).toFixed(2) : 'undefined';
      const pct = ((num1 / num2) * 100).toFixed(1);

      return (
        `🧮 **Calculation Breakdown for ${name}:**\n\n` +
        `Here is the mathematical analysis for your numbers (**${currencySymbol}${num1.toLocaleString()}** and **${currencySymbol}${num2.toLocaleString()}**):\n\n` +
        `• **Sum / Total Combined:** ${currencySymbol}${sum.toLocaleString()}\n` +
        `• **Difference / Spread:** ${currencySymbol}${diff.toLocaleString()}\n` +
        `• **Multiplication / Volume Total:** ${currencySymbol}${prod.toLocaleString()}\n` +
        `• **Division / Unit Cost Ratio:** ${div}\n` +
        `• **Percentage Ratio:** ${pct}%\n\n` +
        `💡 **Merchant Advice:** If this is a cost price vs. selling price calculation, your Gross Profit is **${currencySymbol}${diff.toLocaleString()}** and your Gross Margin is **${num2 > 0 ? ((diff / Math.max(num1, num2)) * 100).toFixed(1) : 0}%**.`
      );
    } else if (numbersInPrompt.length === 1 && (lowerMsg.includes('%') || lowerMsg.includes('margin') || lowerMsg.includes('percent'))) {
      const baseNum = numbersInPrompt[0];
      const margin30 = baseNum / 0.70;
      const margin40 = baseNum / 0.60;
      const margin50 = baseNum / 0.50;

      return (
        `🏷️ **Pricing & Margin Calculations for ${currencySymbol}${baseNum.toLocaleString()}:**\n\n` +
        `To achieve target profit margins on a cost of **${currencySymbol}${baseNum.toLocaleString()}**:\n\n` +
        `• **30% Profit Margin:** Sell at **${currencySymbol}${Math.round(margin30).toLocaleString()}** (Profit: ${currencySymbol}${Math.round(margin30 - baseNum).toLocaleString()})\n` +
        `• **40% Profit Margin (Recommended):** Sell at **${currencySymbol}${Math.round(margin40).toLocaleString()}** (Profit: ${currencySymbol}${Math.round(margin40 - baseNum).toLocaleString()})\n` +
        `• **50% Profit Margin (Premium/Bespoke):** Sell at **${currencySymbol}${Math.round(margin50).toLocaleString()}** (Profit: ${currencySymbol}${Math.round(margin50 - baseNum).toLocaleString()})\n\n` +
        `💡 **Formula Used:** \`Selling Price = Cost Price ÷ (1 - Margin%)\``
      );
    }
  }

  // 2. Profit & Margin Audit
  if (lowerMsg.includes('profit') || lowerMsg.includes('margin') || lowerMsg.includes('audit') || lowerMsg.includes('how much') || lowerMsg.includes('take-home')) {
    return (
      `📊 **Financial Audit for ${name} (This Month):**\n\n` +
      `Here is your exact financial breakdown based on your recorded ledger:\n` +
      `• **Gross Sales Revenue:** ${currencySymbol}${revMonth.toLocaleString()}\n` +
      `• **Operating Expenses:** ${currencySymbol}${expMonth.toLocaleString()}\n` +
      `• **Net Take-Home Profit:** ${currencySymbol}${profitMonth.toLocaleString()}\n` +
      `• **Operating Profit Margin:** **${marginMonth}%**\n\n` +
      `💡 **Financial Consultant Insights:**\n` +
      `1. **Health Check:** A ${marginMonth}% net margin is ${marginMonth >= 35 ? 'very healthy and above average for retail SMEs! 🎉' : revMonth === 0 ? 'awaiting your first recorded sales for the month.' : 'moderate. Focus on increasing your high-margin catalog lines.'}\n` +
      `2. **Retained Earnings:** Set aside at least 15%–20% of your weekly take-home profit (${currencySymbol}${Math.round(profitMonth * 0.2).toLocaleString()}) for inventory reinvestment and working capital.\n` +
      `3. **Expense Guardrails:** Ensure monthly overhead expenses stay below 30% of total gross sales.`
    );
  }

  // 3. Restocking & Top Selling Products
  if (lowerMsg.includes('restock') || lowerMsg.includes('product') || lowerMsg.includes('item') || lowerMsg.includes('inventory') || lowerMsg.includes('catalog')) {
    const topListStr = topProducts.length > 0
      ? topProducts.map((p: any, idx: number) => `${idx + 1}. **${p.name}** — ${p.unitsSold} units sold (${currencySymbol}${(p.totalRevenue || 0).toLocaleString()} revenue)`).join('\n')
      : `No sales recorded yet this period. Record sales in POS or Sales Ledger to activate top sellers rank.`;

    return (
      `📦 **Restocking & Catalog Optimization for ${name}:**\n\n` +
      `**Top Revenue-Generating Products:**\n` +
      `${topListStr}\n\n` +
      `💡 **Actionable Restocking Strategy:**\n` +
      `• **Fast Movers First:** Restock your top 20% bestsellers before secondary items.\n` +
      `• **Supplier Volume Discount:** Group your restock orders into bulk purchases with your suppliers in Lagos/Onitsha/Kano/Aba markets to negotiate 5%–10% lower cost-per-unit.\n` +
      `• **Dead Stock Prevention:** Any item that hasn't sold in 30 days should be bundled with high-demand goods or offered at a 10% promo discount to free up tied-down capital.`
    );
  }

  // 4. Fuel, Dispatch, Delivery, Logistics & Expense Reduction
  if (lowerMsg.includes('fuel') || lowerMsg.includes('delivery') || lowerMsg.includes('dispatch') || lowerMsg.includes('transport') || lowerMsg.includes('cost') || lowerMsg.includes('expense') || lowerMsg.includes('generator')) {
    const topExpStr = expenseCats.length > 0
      ? expenseCats.map((c: any) => `• **${c.category}:** ${currencySymbol}${(c.totalAmount || 0).toLocaleString()} (${c.percentage}%)`).join('\n')
      : `• Recorded monthly expenses: ${currencySymbol}${expMonth.toLocaleString()}`;

    return (
      `⚡ **Expense Reduction & Cost Control Plan for ${name}:**\n\n` +
      `**Current Monthly Expense Distribution:**\n` +
      `${topExpStr}\n\n` +
      `💡 **Practical Ways to Cut Operating Overheads:**\n` +
      `1. **Batch Dispatch Runs:** Avoid sending single ad-hoc waybills. Cluster deliveries into two scheduled dispatch pickup windows (11 AM & 4 PM) or use regional aggregate riders.\n` +
      `2. **Power & Generator Efficiency:** Group energy-intensive tasks (ironing, processing, refrigeration, equipment runs) during specific peak hours to minimize generator fuel consumption.\n` +
      `3. **Packaging Procurement:** Source packaging nylon, custom paper bags, and bubble wrap in wholesale cartons directly from packaging distributors rather than buying retail pieces weekly.`
    );
  }

  // 5. Pricing Suggestion & Markup
  if (lowerMsg.includes('price') || lowerMsg.includes('pricing') || lowerMsg.includes('markup') || lowerMsg.includes('cost price') || lowerMsg.includes('wholesale')) {
    return (
      `🏷️ **Smart Pricing & Markup Framework for Nigerian Merchants:**\n\n` +
      `To protect your business against inflation and ensure reliable take-home profit, follow this 4-step formula:\n\n` +
      `**The True-Cost Formula:**\n` +
      `1. **Base Cost:** Wholesale Purchase Price + Waybill/Freight Allocation per unit.\n` +
      `2. **Overhead Buffer (10%):** Add 10% for packaging, POS transfer charges (0.5%–1%), and utility.\n` +
      `3. **Target Profit Margin (35%–50%):**\n` +
      `   • For a 40% margin: \`Selling Price = True Cost ÷ 0.60\`\n` +
      `   • *Example:* If wholesale cost is ${currencySymbol}15,000 + ${currencySymbol}1,000 waybill = ${currencySymbol}16,000 True Cost.\n` +
      `   • *Recommended Retail Price:* **${currencySymbol}26,500** (giving you ~${currencySymbol}10,500 gross profit per piece).\n\n` +
      `💡 **Pro-Tip:** Always test higher price tiers for unique/premium designs and use bundle deals (e.g. *Buy 2 for ${currencySymbol}50,000*) to accelerate cash flow.`
    );
  }

  // 6. WhatsApp Follow-up & Customer Messages
  if (lowerMsg.includes('whatsapp') || lowerMsg.includes('message') || lowerMsg.includes('follow-up') || lowerMsg.includes('customer') || lowerMsg.includes('draft') || lowerMsg.includes('remind')) {
    return (
      `💬 **High-Converting WhatsApp Templates for Your Customers:**\n\n` +
      `**Option 1: Polite Quote Follow-up (Pending Order)**\n` +
      `"Hello [Customer Name] 👋! Trust your day is going smoothly. Just checking in on your order inquiry from earlier today. We currently have your reserved item ready in stock and can dispatch with our morning delivery batch. Kindly let me know if you would like me to process your waybill! ✨"\n\n` +
      `**Option 2: Friendly Payment / Credit Reminder**\n` +
      `"Good day [Customer Name]! Hope you are well. This is a gentle reminder from *${name}* regarding the remaining balance of [Amount] for your purchase. Please let us know once convenient for transfer. Thank you so much for your continuous patronage! 🛍️"\n\n` +
      `**Option 3: VIP Customer Restock Alert**\n` +
      `"Hi [Customer Name]! We just received fresh restock of our most requested items at *${name}*. Because you love this collection, we wanted to give you first access before we announce on status. Let me know if you'd like photos of the new arrivals! 🔥"`
    );
  }

  // General Comprehensive Business Overview
  return (
    `👋 **MarketMate AI Business Advisor for ${name}:**\n\n` +
    `**Month-to-Date Store Summary:**\n` +
    `• **Gross Sales Revenue:** ${currencySymbol}${revMonth.toLocaleString()}\n` +
    `• **Operating Expenses:** ${currencySymbol}${expMonth.toLocaleString()}\n` +
    `• **Take-Home Profit:** ${currencySymbol}${profitMonth.toLocaleString()} (**${marginMonth}%** margin)\n\n` +
    `💡 **Key Recommendations for Your Store:**\n` +
    `1. **Cash Flow & Inventory:** Prioritize quick-turnaround inventory items that sell within 7–14 days to keep working capital liquid.\n` +
    `2. **Protect Against Leakages:** Log all small daily expenses (airtime, ice, dispatch, fuel) immediately into MarketMate to maintain accurate real profit calculations.\n` +
    `3. **Customer Credit Management:** Keep customer receivables below 10% of monthly sales to avoid capital lockups.`
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // In-memory cache for live real-time FX exchange rates (15-minute TTL)
  interface FxCacheState {
    ratesOfficial: Record<string, number>;
    ratesParallel: Record<string, number>;
    lastUpdated: string;
    timestamp: number;
    source: string;
  }
  let fxCache: FxCacheState | null = null;

  app.get('/api/fx/live-rates', async (req, res) => {
    const force = req.query.force === 'true';
    const now = Date.now();
    const TTL_MS = 15 * 60 * 1000; // 15 minutes

    if (!force && fxCache && now - fxCache.timestamp < TTL_MS) {
      return res.json({
        success: true,
        cached: true,
        source: fxCache.source,
        lastUpdated: fxCache.lastUpdated,
        ratesOfficial: fxCache.ratesOfficial,
        ratesParallel: fxCache.ratesParallel,
      });
    }

    try {
      // Primary: Open.er-api.com (Keyless, Real-time)
      let usdNgn = 0;
      let rawRates: Record<string, number> = {};
      let sourceName = 'Open Exchange Rates (Live Global Market Feed)';

      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD', {
          signal: AbortSignal.timeout(6000),
        });
        if (response.ok) {
          const data = (await response.json()) as any;
          if (data && data.rates && data.rates.NGN) {
            usdNgn = Number(data.rates.NGN);
            rawRates = data.rates;
          }
        }
      } catch (err) {
        console.warn('Primary FX fetch notice, trying backup CDN feed:', err);
      }

      // Secondary backup: Fawaz Ahmed Currency API
      if (!usdNgn || usdNgn <= 0) {
        try {
          const bResp = await fetch(
            'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
            { signal: AbortSignal.timeout(6000) }
          );
          if (bResp.ok) {
            const bData = (await bResp.json()) as any;
            if (bData?.usd?.ngn) {
              usdNgn = Number(bData.usd.ngn);
              rawRates = {
                USD: 1,
                NGN: bData.usd.ngn,
                GBP: bData.usd.gbp ? 1 / bData.usd.gbp : 0.76,
                EUR: bData.usd.eur ? 1 / bData.usd.eur : 0.91,
                CNY: bData.usd.cny || 7.12,
                GHS: bData.usd.ghs || 15.6,
                XOF: bData.usd.xof || 603,
                KES: bData.usd.kes || 129,
                CAD: bData.usd.cad || 1.36,
              };
              sourceName = 'Global Currency CDN Backup Feed';
            }
          }
        } catch (bErr) {
          console.warn('Backup FX fetch notice:', bErr);
        }
      }

      // Fallback baseline if network call fails
      if (!usdNgn || usdNgn <= 0) {
        usdNgn = 1620;
        rawRates = {
          USD: 1,
          NGN: 1620,
          GBP: 0.76,
          EUR: 0.91,
          CNY: 7.12,
          GHS: 15.5,
          XOF: 602,
          KES: 129,
          CAD: 1.36,
        };
        sourceName = 'MarketMate Calibrated Fallback Feed';
      }

      // Triangulate all currencies relative to NGN (Value of 1 Foreign Unit in NGN)
      const calcRate = (code: string, fallbackRatio: number) => {
        if (code === 'NGN') return 1;
        if (code === 'USD') return Math.round(usdNgn * 100) / 100;
        const perUsd = rawRates[code] ? Number(rawRates[code]) : fallbackRatio;
        if (perUsd > 0) {
          return Math.round((usdNgn / perUsd) * 100) / 100;
        }
        return Math.round(usdNgn * fallbackRatio * 100) / 100;
      };

      const ratesOfficial: Record<string, number> = {
        NGN: 1,
        USD: calcRate('USD', 1),
        GBP: calcRate('GBP', 0.76),
        EUR: calcRate('EUR', 0.91),
        CNY: calcRate('CNY', 7.12),
        GHS: calcRate('GHS', 15.5),
        XOF: calcRate('XOF', 602),
        KES: calcRate('KES', 129),
        CAD: calcRate('CAD', 1.36),
      };

      // In Nigeria, parallel street/BDC/P2P benchmark is typically 4.5% spread
      const ratesParallel: Record<string, number> = {
        NGN: 1,
        USD: Math.round(ratesOfficial.USD * 1.045),
        GBP: Math.round(ratesOfficial.GBP * 1.045),
        EUR: Math.round(ratesOfficial.EUR * 1.045),
        CNY: Math.round(ratesOfficial.CNY * 1.045 * 10) / 10,
        GHS: Math.round(ratesOfficial.GHS * 1.045 * 10) / 10,
        XOF: Math.round(ratesOfficial.XOF * 1.045 * 100) / 100,
        KES: Math.round(ratesOfficial.KES * 1.045 * 10) / 10,
        CAD: Math.round(ratesOfficial.CAD * 1.045),
      };

      const lastUpdated = new Date().toISOString();
      fxCache = {
        ratesOfficial,
        ratesParallel,
        lastUpdated,
        timestamp: now,
        source: sourceName,
      };

      res.json({
        success: true,
        cached: false,
        source: sourceName,
        lastUpdated,
        ratesOfficial,
        ratesParallel,
      });
    } catch (err: any) {
      console.error('Error computing FX live rates:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live FX rates.',
        fallbackRates: fxCache ? fxCache.ratesParallel : null,
      });
    }
  });

  // Server-side Gemini API endpoint for MarketMate Business Financial Assistant
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history, businessContext } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message prompt is required.' });
        return;
      }

      const ai = getGeminiClient();

      // If no API key configured, provide structured grounded fallback directly
      if (!ai) {
        const fallbackText = generateGroundedFallbackAdvice(message, businessContext);
        res.json({ reply: fallbackText });
        return;
      }

      const systemInstruction = `
You are MarketMate AI — a friendly, deeply knowledgeable Nigerian business consultant and financial advisor designed specifically for micro, small, and medium business owners in Nigeria (e.g. fashion designers, boutique owners, caterers, gadget vendors, hair stylists, mini-supermarket retailers).

Your core guidelines:
1. Speak in warm, respectful, practical Nigerian business language (you can use natural business terminology like POS, bank transfer, dispatch delivery, generator fuel, waybill, markup, margin).
2. The user has provided their real, deterministic financial records below in JSON format.
3. GROUND ALL YOUR CALCULATIONS AND ADVICE IN THEIR ACTUAL NUMBERS. Never fabricate random statistics when real ones are provided.
4. If asked about pricing or markups, calculate exact profit = selling price - cost price, and margin = (profit / selling price) * 100.
5. Provide actionable, concise advice: highlight high-performing products, cost reduction tips (especially around fuel/logistics/packaging), and cash flow management.
6. Keep answers structured with bold bullet points, clear Naira (₦) formatting, and no unnecessary jargon.

Current Business Profile & Grounded Financial Summary:
- Business Name: ${businessContext?.businessName || 'Merchant'}
- Category: ${businessContext?.businessType || 'General Merchant'}
- Currency: ${businessContext?.currency || 'NGN'} (₦)
- Today Revenue: ₦${businessContext?.metrics?.today?.revenue || 0}
- Today Profit: ₦${businessContext?.metrics?.today?.operatingProfit || 0}
- This Week Revenue: ₦${businessContext?.metrics?.thisWeek?.revenue || 0}
- This Week Profit: ₦${businessContext?.metrics?.thisWeek?.operatingProfit || 0}
- This Month Revenue: ₦${businessContext?.metrics?.thisMonth?.revenue || 0}
- This Month Operating Expenses: ₦${businessContext?.metrics?.thisMonth?.operatingExpenses || 0}
- This Month Net Profit: ₦${businessContext?.metrics?.thisMonth?.operatingProfit || 0} (Margin: ${businessContext?.metrics?.thisMonth?.profitMargin || 0}%)
- Top Products: ${JSON.stringify(businessContext?.metrics?.topSellingProducts || [])}
- Operating Expense Categories: ${JSON.stringify(businessContext?.metrics?.expenseCategoryBreakdown || [])}
`;

      let historyContext = '';
      if (Array.isArray(history) && history.length > 0) {
        historyContext = 'Recent conversation context:\n' +
          history.slice(-4).map((h: any) => `${h.sender === 'user' ? 'Merchant' : 'MarketMate AI'}: ${h.text}`).join('\n') + '\n\n';
      }

      const promptContent = `${historyContext}User query: ${message}\n\nPlease respond based on my actual store metrics and guidelines above.`;

      // Resilient model cascade using supported Gemini models:
      // 1. gemini-3.7-flash (with ThinkingLevel.LOW for optimal speed and depth)
      // 2. gemini-3.1-flash-lite (high efficiency, fast response)
      // 3. gemini-flash-latest
      // 4. Grounded fallback advisor
      let generatedText: string | undefined;

      // Tier 1: gemini-3.7-flash
      try {
        const response37 = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: promptContent,
          config: {
            systemInstruction,
            temperature: 0.7,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        generatedText = response37.text;
      } catch (err37: any) {
        console.warn('Gemini 3.7 Flash temporary issue, falling back to gemini-3.1-flash-lite:', err37?.message || err37);
        // Tier 2: gemini-3.1-flash-lite
        try {
          const responseLite = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: promptContent,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          generatedText = responseLite.text;
        } catch (errLite: any) {
          console.warn('Gemini 3.1 Flash Lite temporary issue, falling back to gemini-flash-latest:', errLite?.message || errLite);
          // Tier 3: gemini-flash-latest
          try {
            const responseLatest = await ai.models.generateContent({
              model: 'gemini-flash-latest',
              contents: promptContent,
              config: {
                systemInstruction,
                temperature: 0.7,
              },
            });
            generatedText = responseLatest.text;
          } catch (errLatest: any) {
            console.warn('All Gemini models encountered high demand. Using grounded business intelligence response:', errLatest?.message || errLatest);
            generatedText = generateGroundedFallbackAdvice(message, businessContext);
          }
        }
      }

      if (!generatedText) {
        generatedText = generateGroundedFallbackAdvice(message, businessContext);
      }

      res.json({ reply: generatedText });
    } catch (err: any) {
      console.error('Unhandled AI chat route error:', err);
      const fallback = generateGroundedFallbackAdvice(req.body?.message || '', req.body?.businessContext);
      res.json({ reply: fallback });
    }
  });

  // =========================================================================
  // RESEND CUSTOM DOMAIN EMAIL BROADCAST ROUTES (getmarketmate.online)
  // =========================================================================

  // Check Resend Configuration & Custom Domain Status
  app.get('/api/admin/resend-status', (req, res) => {
    const hasKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().startsWith('re_'));
    res.json({
      configured: hasKey,
      domain: 'getmarketmate.online',
      fromEmail: 'MarketMate <notifications@getmarketmate.online>',
      replyTo: 'getmarketmate@gmail.com',
    });
  });

  // Send a test email to verify domain & API key delivery
  app.post('/api/admin/test-email', async (req, res) => {
    try {
      const { targetEmail, adminEmail } = req.body;
      const resend = getResendClient();

      if (!resend) {
        res.status(400).json({
          success: false,
          error: 'RESEND_API_KEY is not configured in server environment variables. Please add your Resend API Key in .env.',
        });
        return;
      }

      const recipient = targetEmail || adminEmail || 'osovoyoronogheneovo@gmail.com';
      const html = buildMarketMateEmailHtml({
        title: '🎉 getmarketmate.online Domain Verification & Delivery Test',
        content: `Hello Super Admin!\n\nThis is a verified test email sent directly from your newly verified domain: **getmarketmate.online**.\n\nYour DNS records (DKIM, SPF, DMARC) and the Resend API integration are working seamlessly. When you send announcements from the Admin Portal, merchants will receive branded emails directly in their Primary Inbox.\n\nHappy scaling with MarketMate! 🚀`,
        recipientName: 'Super Admin',
        businessName: 'MarketMate HQ',
        actionLabel: 'Open Super Admin Portal',
        actionUrl: 'admin',
        priority: 'important',
      });

      const response = await resend.emails.send({
        from: 'MarketMate <notifications@getmarketmate.online>',
        to: recipient,
        replyTo: 'getmarketmate@gmail.com',
        subject: '[MarketMate] Domain Verification & Email Delivery Successful! 🇳🇬',
        html,
      });

      if (response.error) {
        res.status(400).json({
          success: false,
          error: response.error.message || 'Resend API returned an error.',
        });
        return;
      }

      res.json({
        success: true,
        message: `Verified test email successfully delivered to ${recipient} via notifications@getmarketmate.online!`,
        id: response.data?.id,
      });
    } catch (err: any) {
      console.error('Test email dispatch error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to dispatch test email.',
      });
    }
  });

  // Broadcast branded emails to store owners
  app.post('/api/admin/broadcast-email', async (req, res) => {
    try {
      const { recipients, title, content, actionLabel, actionUrl, priority } = req.body;
      const resend = getResendClient();

      if (!resend) {
        res.status(400).json({
          success: false,
          error: 'RESEND_API_KEY is not configured in server environment variables. Add RESEND_API_KEY=re_... in .env to send live emails.',
        });
        return;
      }

      if (!Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({ success: false, error: 'Recipient list cannot be empty.' });
        return;
      }

      // Filter and deduplicate recipient emails
      const emailMap = new Map<string, { email: string; name?: string; businessName?: string }>();
      for (const r of recipients) {
        if (typeof r === 'string' && r.includes('@')) {
          const clean = r.trim().toLowerCase();
          if (!emailMap.has(clean)) {
            emailMap.set(clean, { email: clean });
          }
        } else if (r && typeof r === 'object' && r.email && r.email.includes('@')) {
          const clean = r.email.trim().toLowerCase();
          if (!emailMap.has(clean)) {
            emailMap.set(clean, {
              email: clean,
              name: r.name,
              businessName: r.businessName,
            });
          }
        }
      }

      const uniqueRecipients = Array.from(emailMap.values());
      if (uniqueRecipients.length === 0) {
        res.status(400).json({ success: false, error: 'No valid recipient email addresses found.' });
        return;
      }

      let successCount = 0;
      const errors: string[] = [];

      // Send in batches of 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < uniqueRecipients.length; i += BATCH_SIZE) {
        const chunk = uniqueRecipients.slice(i, i + BATCH_SIZE);
        const emailPayloads = chunk.map((rec) => ({
          from: 'MarketMate <notifications@getmarketmate.online>',
          to: rec.email,
          replyTo: 'getmarketmate@gmail.com',
          subject: `[MarketMate] ${title}`,
          html: buildMarketMateEmailHtml({
            title,
            content,
            recipientName: rec.name,
            businessName: rec.businessName,
            actionLabel,
            actionUrl,
            priority,
          }),
        }));

        try {
          const batchRes = await resend.batch.send(emailPayloads);
          if (batchRes.error) {
            errors.push(batchRes.error.message || 'Batch send failed');
          } else {
            successCount += chunk.length;
          }
        } catch (chunkErr: any) {
          errors.push(chunkErr.message || 'Batch delivery error');
        }
      }

      res.json({
        success: successCount > 0,
        sentCount: successCount,
        totalCount: uniqueRecipients.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully delivered ${successCount} of ${uniqueRecipients.length} emails from notifications@getmarketmate.online`,
      });
    } catch (err: any) {
      console.error('Broadcast email error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to dispatch broadcast emails.',
      });
    }
  });

  // Automated Welcome Email on New Store Setup
  app.post('/api/email/welcome', async (req, res) => {
    try {
      const { email, ownerName, businessName, businessType } = req.body;
      const resend = getResendClient();
      if (!resend || !email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ success: false, error: 'Resend not configured or invalid recipient email' });
        return;
      }

      const html = buildMarketMateEmailHtml({
        title: '🎉 Welcome to MarketMate! Your Retail Operating System is Ready',
        content: `Welcome to the MarketMate merchant community! 🛍️✨\n\nWe are thrilled to partner with you in powering **${businessName || 'your business'}** (${businessType || 'Retail Store'}). MarketMate is built specifically for Nigerian merchants to streamline inventory, speed up POS checkouts, eliminate stock leakages, and track real-time profit.\n\n💡 3 Quick Steps to Set Up Your Store Today:\n1. 📦 **Add Your Top Products:** Navigate to the Products tab to add your fast-moving items or scan barcodes to create items in seconds.\n2. 🧾 **Try the POS Register:** Launch your POS register and test issuing instant receipts (Cash, Transfer, or POS card).\n3. 💸 **Recover Customer Debts:** Use your Debt Ledger to record customer credit and send 1-click WhatsApp payment reminders.\n\nNeed personalized setup assistance or help configuring cashier PINs? Simply reply directly to this email or message our founder support desk on WhatsApp.\n\nHere's to massive retail growth!\n\nThe MarketMate Team`,
        recipientName: ownerName,
        businessName,
        actionLabel: 'Launch MarketMate Register',
        actionUrl: 'pos',
        priority: 'important',
      });

      const response = await resend.emails.send({
        from: 'MarketMate <notifications@getmarketmate.online>',
        to: email.trim().toLowerCase(),
        replyTo: 'getmarketmate@gmail.com',
        subject: `Welcome to MarketMate! 🛍️ Let's get ${businessName || 'your store'} started`,
        html,
      });

      if (response.error) {
        res.status(400).json({ success: false, error: response.error.message });
        return;
      }

      res.json({ success: true, id: response.data?.id, message: `Welcome email delivered to ${email}` });
    } catch (err: any) {
      console.error('Welcome email error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Automated Subscription Approval Confirmation Email
  app.post('/api/email/subscription-approval', async (req, res) => {
    try {
      const { email, ownerName, businessName, planName, amount, discountPercent } = req.body;
      const resend = getResendClient();
      if (!resend || !email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ success: false, error: 'Resend not configured or invalid recipient email' });
        return;
      }

      const discountNotice = discountPercent ? ` (Includes your ${discountPercent}% discount reward)` : '';

      const html = buildMarketMateEmailHtml({
        title: '🎉 Payment Confirmed: Your MarketMate Pro Subscription is Active!',
        content: `Great news! 🚀\n\nYour bank transfer of **₦${Number(amount || 0).toLocaleString()}**${discountNotice} for the **"${planName || 'Pioneer Pro'}"** plan has been verified and approved by MarketMate Admin.\n\nYour store **${businessName || ''}** now has full access to all unlocked Pro capabilities:\n• 🛡️ **Staff, Roles & Cashier PINs:** Restrict cashier view from profit margins and store accounting.\n• 📊 **Advanced P&L Reports & CSV Ledgers:** Download itemized sales and expense exports.\n• 💵 **Multi-Currency POS:** Track foreign currencies (USD, EUR, GBP, CFA) with real-time margins.\n• ⚡ **Priority Cloud Synchronization:** Instant real-time multi-device sync.\n\nThank you for choosing MarketMate to take your retail operations to the next level!`,
        recipientName: ownerName,
        businessName,
        actionLabel: 'Explore Pro Features',
        actionUrl: 'settings',
        priority: 'important',
      });

      const response = await resend.emails.send({
        from: 'MarketMate Billing <notifications@getmarketmate.online>',
        to: email.trim().toLowerCase(),
        replyTo: 'getmarketmate@gmail.com',
        subject: `[MarketMate] Payment Confirmed: Your "${planName}" Subscription is Active! 🚀`,
        html,
      });

      if (response.error) {
        res.status(400).json({ success: false, error: response.error.message });
        return;
      }

      res.json({ success: true, id: response.data?.id, message: `Subscription approval email sent to ${email}` });
    } catch (err: any) {
      console.error('Subscription approval email error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Automated Subscription Rejection Notice Email
  app.post('/api/email/subscription-rejection', async (req, res) => {
    try {
      const { email, ownerName, businessName, planName, reason } = req.body;
      const resend = getResendClient();
      if (!resend || !email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ success: false, error: 'Resend not configured or invalid recipient email' });
        return;
      }

      const html = buildMarketMateEmailHtml({
        title: 'Notice regarding your MarketMate Subscription Payment',
        content: `Hello ${ownerName || businessName},\n\nWe are reviewing your recent subscription request for the **"${planName || 'Pro'}"** plan on MarketMate.\n\nOur billing team was unable to confirm the bank transfer with the account statement for the following reason:\n\n> *"${reason || 'Bank transfer alert could not be matched with account statement.'}"*\n\n**Next Steps:**\nIf you have already debited your account, please reply directly to this email with your transfer receipt or bank alert screenshot, or message our founder support desk on WhatsApp so we can manually reconcile and activate your account immediately.\n\nWe apologize for any inconvenience!`,
        recipientName: ownerName,
        businessName,
        actionLabel: 'Contact Support on WhatsApp',
        actionUrl: 'https://wa.me/2347089238728',
        priority: 'urgent',
      });

      const response = await resend.emails.send({
        from: 'MarketMate Billing <notifications@getmarketmate.online>',
        to: email.trim().toLowerCase(),
        replyTo: 'getmarketmate@gmail.com',
        subject: `[Action Required] Update on your MarketMate Subscription for ${businessName || 'your store'}`,
        html,
      });

      if (response.error) {
        res.status(400).json({ success: false, error: response.error.message });
        return;
      }

      res.json({ success: true, id: response.data?.id, message: `Subscription rejection email sent to ${email}` });
    } catch (err: any) {
      console.error('Subscription rejection email error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve favicon
  app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(process.cwd(), process.env.NODE_ENV === 'production' ? 'dist' : 'public', 'favicon.svg');
    res.type('image/svg+xml');
    res.sendFile(faviconPath);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MarketMate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

