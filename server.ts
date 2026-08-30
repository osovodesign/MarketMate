import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

// Generate grounded fallback advice for Nigerian SMEs when Gemini API is under heavy traffic (503/429)
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

  // 1. Profit & Margin Audit
  if (lowerMsg.includes('profit') || lowerMsg.includes('margin') || lowerMsg.includes('audit') || lowerMsg.includes('how much') || lowerMsg.includes('take-home')) {
    return (
      `📊 **Financial Audit for ${name} (This Month):**\n\n` +
      `Here is your exact financial breakdown based on your recorded ledger:\n` +
      `• **Gross Sales Revenue:** ${currencySymbol}${revMonth.toLocaleString()}\n` +
      `• **Operating Expenses:** ${currencySymbol}${expMonth.toLocaleString()}\n` +
      `• **Net Take-Home Profit:** ${currencySymbol}${profitMonth.toLocaleString()}\n` +
      `• **Operating Profit Margin:** **${marginMonth}%**\n\n` +
      `💡 **Financial Consultant Insights:**\n` +
      `1. **Health Check:** A ${marginMonth}% net margin is ${marginMonth >= 35 ? 'very healthy and above average for retail SMEs! 🎉' : 'moderate. Focus on increasing your high-margin catalog lines.'}\n` +
      `2. **Retained Earnings:** Set aside at least 15%–20% of your weekly take-home profit (${currencySymbol}${Math.round(profitMonth * 0.2).toLocaleString()}) for inventory reinvestment and working capital.\n` +
      `3. **Expense Guardrails:** Ensure monthly overhead expenses stay below 30% of total gross sales.`
    );
  }

  // 2. Restocking & Top Selling Products
  if (lowerMsg.includes('restock') || lowerMsg.includes('product') || lowerMsg.includes('item') || lowerMsg.includes('inventory') || lowerMsg.includes('catalog')) {
    const topListStr = topProducts.length > 0
      ? topProducts.map((p: any, idx: number) => `${idx + 1}. **${p.name}** — ${p.unitsSold} units sold (${currencySymbol}${(p.totalRevenue || 0).toLocaleString()} revenue)`).join('\n')
      : `No sales recorded yet this period.`;

    return (
      `📦 **Restocking & Catalog Optimization for ${name}:**\n\n` +
      `**Top Revenue-Generating Products:**\n` +
      `${topListStr}\n\n` +
      `💡 **Actionable Restocking Strategy:**\n` +
      `• **Fast Movers First:** Restock your top 20% bestsellers before secondary items.\n` +
      `• **Supplier Volume Discount:** Group your restock orders into bulk purchases with your suppliers in Lagos/Onitsha/Kano markets to negotiate 5%–10% lower cost-per-unit.\n` +
      `• **Dead Stock Prevention:** Any item that hasn't sold in 30 days should be bundled with high-demand goods or offered at a 10% promo discount to free up tied-down capital.`
    );
  }

  // 3. Fuel, Dispatch, Delivery, Logistics & Expense Reduction
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

  // 4. Pricing Suggestion & Markup
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

  // 5. WhatsApp Follow-up & Customer Messages
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

      // Resilient model cascade:
      // 1. gemini-2.5-flash (ultra-fast, highly responsive, ~1s latency)
      // 2. gemini-3.7-flash (with ThinkingLevel.LOW)
      // 3. gemini-3.1-flash-lite
      // 4. Grounded fallback advisor
      let generatedText: string | undefined;

      // Tier 1: gemini-2.5-flash
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptContent,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        generatedText = response.text;
      } catch (err25: any) {
        console.warn('Gemini 2.5 Flash temporary issue, falling back to gemini-3.7-flash:', err25?.message || err25);
        // Tier 2: gemini-3.7-flash
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
          // Tier 3: gemini-3.1-flash-lite
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
            console.warn('All Gemini models encountered high demand. Using grounded business intelligence response:', errLite?.message || errLite);
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

