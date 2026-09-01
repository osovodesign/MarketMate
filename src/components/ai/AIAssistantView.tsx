import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Receipt,
  HelpCircle,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { CurrencyCode } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const PROMPT_CHIPS = [
  { label: '💰 Real Profit Audit', prompt: 'Calculate my exact take-home profit this month after subtracting all fuel, delivery, and overhead expenses.' },
  { label: '📦 Restocking Advice', prompt: 'Which of my products generates the highest profit margin and should be prioritized for restocking?' },
  { label: '⚡ Cut Fuel & Transport', prompt: 'Analyze my operating expenses and give me 3 practical ways to cut generator fuel and dispatch delivery costs.' },
  { label: '🏷️ Price Suggestion', prompt: 'How should I price an item that costs ₦15,000 wholesale to make a 40% profit margin after delivery and POS fees?' },
  { label: '💬 WhatsApp Follow-up Message', prompt: 'Draft a polite WhatsApp message to send to a customer who asked for a price quote but has not paid yet.' },
];

// Helper to render bold text and bullet points cleanly
const renderFormattedLine = (line: string, isUser: boolean) => {
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className={isUser ? 'font-bold text-white' : 'font-bold text-slate-900'}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

function generateClientBusinessAdvice(
  query: string,
  businessName: string,
  currency: CurrencyCode,
  metrics: any
): string {
  const lower = query.toLowerCase();
  const revMonth = metrics?.thisMonth?.revenue || 0;
  const expMonth = metrics?.thisMonth?.operatingExpenses || 0;
  const profitMonth = metrics?.thisMonth?.operatingProfit || 0;
  const marginMonth = metrics?.thisMonth?.profitMargin || 0;
  const topProducts = metrics?.topSellingProducts || [];
  const expenseCats = metrics?.expenseCategoryBreakdown || [];

  const numbersInQuery = query.match(/\d+([.,]\d+)?/g)?.map((n) => parseFloat(n.replace(/,/g, ''))) || [];

  // Math & Calculations
  if (lower.includes('calculate') || lower.includes('compute') || lower.includes('math') || lower.includes('%') || lower.includes('multiply') || lower.includes('divide') || lower.includes('+') || lower.includes('-') || lower.includes('*') || lower.includes('/')) {
    if (numbersInQuery.length >= 2) {
      const [n1, n2] = numbersInQuery;
      const sum = n1 + n2;
      const diff = Math.abs(n1 - n2);
      const prod = n1 * n2;
      const ratio = n2 !== 0 ? (n1 / n2).toFixed(2) : 'N/A';
      const pct = n2 !== 0 ? ((n1 / n2) * 100).toFixed(1) : 'N/A';

      return (
        `🧮 **Calculation Breakdown for ${businessName}:**\n\n` +
        `Here is the mathematical analysis for your numbers (**${formatCurrency(n1, currency)}** and **${formatCurrency(n2, currency)}**):\n\n` +
        `• **Sum / Total Combined:** ${formatCurrency(sum, currency)}\n` +
        `• **Difference / Margin Spread:** ${formatCurrency(diff, currency)}\n` +
        `• **Multiplication / Volume Total:** ${formatCurrency(prod, currency)}\n` +
        `• **Unit Ratio:** ${ratio}\n` +
        `• **Percentage Ratio:** ${pct}%\n\n` +
        `💡 **Merchant Advice:** If this is a cost price vs. selling price calculation, your Gross Profit is **${formatCurrency(diff, currency)}** and your Gross Margin is **${Math.max(n1, n2) > 0 ? ((diff / Math.max(n1, n2)) * 100).toFixed(1) : 0}%**.`
      );
    } else if (numbersInQuery.length === 1 && (lower.includes('margin') || lower.includes('%') || lower.includes('markup') || lower.includes('price'))) {
      const cost = numbersInQuery[0];
      const p30 = cost / 0.70;
      const p40 = cost / 0.60;
      const p50 = cost / 0.50;

      return (
        `🏷️ **Pricing & Margin Calculations for Cost ${formatCurrency(cost, currency)}:**\n\n` +
        `To achieve target profit margins on a cost of **${formatCurrency(cost, currency)}**:\n\n` +
        `• **30% Profit Margin:** Sell at **${formatCurrency(Math.round(p30), currency)}** (Profit: ${formatCurrency(Math.round(p30 - cost), currency)})\n` +
        `• **40% Profit Margin (Recommended):** Sell at **${formatCurrency(Math.round(p40), currency)}** (Profit: ${formatCurrency(Math.round(p40 - cost), currency)})\n` +
        `• **50% Profit Margin (Premium/Bespoke):** Sell at **${formatCurrency(Math.round(p50), currency)}** (Profit: ${formatCurrency(Math.round(p50 - cost), currency)})\n\n` +
        `💡 **Formula Used:** \`Selling Price = Cost Price ÷ (1 - Target Margin%)\``
      );
    }
  }

  // Profit & Margin Audit
  if (lower.includes('profit') || lower.includes('margin') || lower.includes('audit') || lower.includes('how much') || lower.includes('take-home')) {
    return (
      `📊 **Financial Audit for ${businessName} (This Month):**\n\n` +
      `Here is your exact financial breakdown based on your recorded ledger:\n` +
      `• **Gross Sales Revenue:** ${formatCurrency(revMonth, currency)}\n` +
      `• **Operating Expenses:** ${formatCurrency(expMonth, currency)}\n` +
      `• **Net Take-Home Profit:** ${formatCurrency(profitMonth, currency)}\n` +
      `• **Operating Profit Margin:** **${marginMonth}%**\n\n` +
      `💡 **Financial Consultant Insights:**\n` +
      `1. **Health Check:** A ${marginMonth}% net margin is ${marginMonth >= 35 ? 'very healthy and above average for retail SMEs! 🎉' : revMonth === 0 ? 'awaiting your first recorded sales for the month.' : 'moderate. Focus on increasing your high-margin catalog lines.'}\n` +
      `2. **Retained Earnings:** Set aside at least 15%–20% of your weekly take-home profit (${formatCurrency(Math.round(profitMonth * 0.2), currency)}) for inventory reinvestment and working capital.\n` +
      `3. **Expense Guardrails:** Ensure monthly overhead expenses stay below 30% of total gross sales.`
    );
  }

  // Restocking & Top Selling Products
  if (lower.includes('restock') || lower.includes('product') || lower.includes('item') || lower.includes('inventory') || lower.includes('catalog')) {
    const topListStr = topProducts.length > 0
      ? topProducts.map((p: any, idx: number) => `${idx + 1}. **${p.name}** — ${p.unitsSold} units sold (${formatCurrency(p.totalRevenue || 0, currency)} revenue)`).join('\n')
      : `No sales recorded yet this period. Record sales in POS or Sales Ledger to activate top sellers rank.`;

    return (
      `📦 **Restocking & Catalog Optimization for ${businessName}:**\n\n` +
      `**Top Revenue-Generating Products:**\n` +
      `${topListStr}\n\n` +
      `💡 **Actionable Restocking Strategy:**\n` +
      `• **Fast Movers First:** Restock your top 20% bestsellers before secondary items.\n` +
      `• **Supplier Volume Discount:** Group your restock orders into bulk purchases with your suppliers in Lagos/Onitsha/Kano/Aba markets to negotiate 5%–10% lower cost-per-unit.\n` +
      `• **Dead Stock Prevention:** Any item that hasn't sold in 30 days should be bundled with high-demand goods or offered at a 10% promo discount to free up tied-down capital.`
    );
  }

  // Expenses, Delivery, Fuel
  if (lower.includes('fuel') || lower.includes('delivery') || lower.includes('dispatch') || lower.includes('transport') || lower.includes('cost') || lower.includes('expense') || lower.includes('generator')) {
    const topExpStr = expenseCats.length > 0
      ? expenseCats.map((c: any) => `• **${c.category}:** ${formatCurrency(c.totalAmount || 0, currency)} (${c.percentage}%)`).join('\n')
      : `• Recorded monthly expenses: ${formatCurrency(expMonth, currency)}`;

    return (
      `⚡ **Expense Reduction & Cost Control Plan for ${businessName}:**\n\n` +
      `**Current Monthly Expense Distribution:**\n` +
      `${topExpStr}\n\n` +
      `💡 **Practical Ways to Cut Operating Overheads:**\n` +
      `1. **Batch Dispatch Runs:** Avoid sending single ad-hoc waybills. Cluster deliveries into two scheduled dispatch pickup windows (11 AM & 4 PM) or use regional aggregate riders.\n` +
      `2. **Power & Generator Efficiency:** Group energy-intensive tasks (ironing, processing, refrigeration, equipment runs) during specific peak hours to minimize generator fuel consumption.\n` +
      `3. **Packaging Procurement:** Source packaging nylon, custom paper bags, and bubble wrap in wholesale cartons directly from packaging distributors rather than buying retail pieces weekly.`
    );
  }

  // Pricing & Markup
  if (lower.includes('price') || lower.includes('pricing') || lower.includes('markup') || lower.includes('cost price') || lower.includes('wholesale')) {
    return (
      `🏷️ **Smart Pricing & Markup Framework for Nigerian Merchants:**\n\n` +
      `To protect your business against inflation and ensure reliable take-home profit, follow this 4-step formula:\n\n` +
      `**The True-Cost Formula:**\n` +
      `1. **Base Cost:** Wholesale Purchase Price + Waybill/Freight Allocation per unit.\n` +
      `2. **Overhead Buffer (10%):** Add 10% for packaging, POS transfer charges (0.5%–1%), and utility.\n` +
      `3. **Target Profit Margin (35%–50%):**\n` +
      `   • For a 40% margin: \`Selling Price = True Cost ÷ 0.60\`\n` +
      `   • *Example:* If wholesale cost is ${formatCurrency(15000, currency)} + ${formatCurrency(1000, currency)} waybill = ${formatCurrency(16000, currency)} True Cost.\n` +
      `   • *Recommended Retail Price:* **${formatCurrency(26500, currency)}** (giving you ~${formatCurrency(10500, currency)} gross profit per piece).\n\n` +
      `💡 **Pro-Tip:** Always test higher price tiers for unique/premium designs and use bundle deals to accelerate cash flow.`
    );
  }

  // WhatsApp Messages
  if (lower.includes('whatsapp') || lower.includes('message') || lower.includes('follow-up') || lower.includes('customer') || lower.includes('draft') || lower.includes('remind')) {
    return (
      `💬 **High-Converting WhatsApp Templates for Your Customers:**\n\n` +
      `**Option 1: Polite Quote Follow-up (Pending Order)**\n` +
      `"Hello [Customer Name] 👋! Trust your day is going smoothly. Just checking in on your order inquiry from earlier today. We currently have your reserved item ready in stock and can dispatch with our morning delivery batch. Kindly let me know if you would like me to process your waybill! ✨"\n\n` +
      `**Option 2: Friendly Payment / Credit Reminder**\n` +
      `"Good day [Customer Name]! Hope you are well. This is a gentle reminder from *${businessName}* regarding the remaining balance of [Amount] for your purchase. Please let us know once convenient for transfer. Thank you so much for your continuous patronage! 🛍️"\n\n` +
      `**Option 3: VIP Customer Restock Alert**\n` +
      `"Hi [Customer Name]! We just received fresh restock of our most requested items at *${businessName}*. Because you love this collection, we wanted to give you first access before we announce on status. Let me know if you'd like photos of the new arrivals! 🔥"`
    );
  }

  return (
    `👋 **MarketMate AI Business Advisor for ${businessName}:**\n\n` +
    `**Month-to-Date Store Summary:**\n` +
    `• **Gross Sales Revenue:** ${formatCurrency(revMonth, currency)}\n` +
    `• **Operating Expenses:** ${formatCurrency(expMonth, currency)}\n` +
    `• **Take-Home Profit:** ${formatCurrency(profitMonth, currency)} (**${marginMonth}%** margin)\n\n` +
    `💡 **Key Recommendations for Your Store:**\n` +
    `1. **Cash Flow & Inventory:** Prioritize quick-turnaround inventory items that sell within 7–14 days to keep working capital liquid.\n` +
    `2. **Protect Against Leakages:** Log all small daily expenses (airtime, ice, dispatch, fuel) immediately into MarketMate to maintain accurate real profit calculations.\n` +
    `3. **Customer Credit Management:** Keep customer receivables below 10% of monthly sales to avoid capital lockups.`
  );
}

export const AIAssistantView: React.FC = () => {
  const { business } = useAuth();
  const { metrics, sales, expenses } = useBusinessData();
  const currency: CurrencyCode = (business?.currency as CurrencyCode) || 'NGN';

  const [input, setInput] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello! I am your **MarketMate AI Business Consultant**. I'm directly connected to your store's live financial records for **${business?.businessName}**.\n\nAsk me about your real profit margins, expense leaks (like dispatch delivery or generator fuel), pricing recommendations, or weekly financial summaries!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Package full business context to ground Gemini accurately
      const businessContext = {
        businessName: business?.businessName,
        businessType: business?.businessType,
        currency,
        metrics: {
          today: metrics.today,
          thisWeek: metrics.thisWeek,
          thisMonth: metrics.thisMonth,
          topSellingProducts: metrics.topSellingProducts,
          expenseCategoryBreakdown: metrics.expenseCategoryBreakdown,
        },
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          businessContext,
        }),
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || data.error || '';
      }
      
      if (!replyText || !res.ok) {
        replyText = generateClientBusinessAdvice(query, business?.businessName || 'your store', currency, metrics);
      }

      const aiMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat network notice, switching to instant offline business engine:', err);
      const smartFallback = generateClientBusinessAdvice(query, business?.businessName || 'your store', currency, metrics);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: smartFallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              MarketMate AI Business Advisor
            </h2>
            <Badge variant="amber" size="sm">
              <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
              Grounded in Your Data
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Instant financial consulting grounded in your real sales, expenses, and margins.
          </p>
        </div>
      </div>

      {/* Main Chat Container */}
      <Card padding="none" className="flex flex-col h-[600px] max-h-[75vh] overflow-hidden bg-white shadow-sm border border-slate-200/80">
        {/* Chat Header Status Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">MarketMate Financial Intelligence</p>
              <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Sync: {metrics.thisMonth.salesCount} sales • {formatCurrency(metrics.thisMonth.revenue, currency)} MTD
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'init-reset',
                  sender: 'ai',
                  text: `Conversation cleared. How can I help you analyze **${business?.businessName}** today?`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className="text-xs text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
            title="Reset Chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-700 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {/* Formatted Text rendering with basic markdown bold & bullet points */}
                  <div className="space-y-2">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph.split('\n').map((line, lIdx) => {
                          const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*') || /^\d+\./.test(line.trim());
                          return (
                            <span key={lIdx} className={isBullet ? 'block pl-2.5 py-0.5' : 'block'}>
                              {renderFormattedLine(line, isUser)}
                            </span>
                          );
                        })}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                    {!isUser ? (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 font-medium transition-colors"
                        title="Copy message text"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Advice</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span />
                    )}

                    <span
                      className={`text-[10px] ${
                        isUser ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[75%] mr-auto">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                <span>MarketMate AI is analyzing your business records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Quick Prompts:
          </span>
          {PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.prompt)}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold whitespace-nowrap border border-slate-200/80 hover:border-emerald-200 transition-all"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask MarketMate AI about your sales, costs, or margins..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
            <Button
              type="submit"
              size="md"
              isLoading={isLoading}
              disabled={!input.trim()}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
