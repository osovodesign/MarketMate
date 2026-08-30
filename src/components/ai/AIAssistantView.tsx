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

export const AIAssistantView: React.FC = () => {
  const { business } = useAuth();
  const { metrics, sales, expenses } = useBusinessData();
  const currency = business?.currency || 'NGN';

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

      const data = await res.json();

      const aiMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || data.error || 'Sorry, I could not generate a response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Offline Note:** Could not reach the AI server. However, based on your local metrics: your current month revenue is ${formatCurrency(metrics.thisMonth.revenue, currency)} with a net profit of ${formatCurrency(metrics.thisMonth.operatingProfit, currency)}.`,
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
