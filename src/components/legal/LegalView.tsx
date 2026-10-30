import React, { useState } from 'react';
import {
  ShieldAlert,
  FileText,
  Lock,
  Search,
  Scale,
  CheckCircle2,
  Printer,
  ChevronDown,
  Building2,
  MapPin,
  Phone,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import {
  LEGAL_CONFIG,
  LEGAL_DISCLAIMERS,
  TERMS_OF_SERVICE,
  LegalSection,
} from '../../lib/legalConfig';
import { Card } from '../ui/Card';

interface LegalViewProps {
  onBack: () => void;
  defaultTab?: 'disclaimers' | 'terms' | 'privacy';
}

export const LegalView: React.FC<LegalViewProps> = ({
  onBack,
  defaultTab = 'disclaimers',
}) => {
  const [activeTab, setActiveTab] = useState<'disclaimers' | 'terms' | 'privacy'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  const currentSections: LegalSection[] =
    activeTab === 'disclaimers'
      ? LEGAL_DISCLAIMERS
      : activeTab === 'terms'
      ? TERMS_OF_SERVICE
      : [
          ...TERMS_OF_SERVICE.filter((s) => s.id === 'ndpr-privacy'),
          ...LEGAL_DISCLAIMERS.filter((s) => s.id === 'inventory-cashier-disclaimer'),
        ];

  const filteredSections = currentSections.filter((section) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(query) ||
      section.summary.toLowerCase().includes(query) ||
      section.content.some((c) => c.toLowerCase().includes(query))
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                MarketMate Legal &amp; Compliance Center
              </h1>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                · v{LEGAL_CONFIG.version}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Official Terms of Service, Legal Disclaimers &amp; NDPA Privacy Notices
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print Documentation</span>
        </button>
      </div>

      {/* Founder, Entity & CAC Registration Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {LEGAL_CONFIG.entityName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {LEGAL_CONFIG.cacDisplay}
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {LEGAL_CONFIG.location}
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Effective: {LEGAL_CONFIG.effectiveDate}
          </span>
        </div>
        <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
          Founder: {LEGAL_CONFIG.founderName}
        </span>
      </div>

      {/* Tab Navigation & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('disclaimers');
              setSearchQuery('');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'disclaimers'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Legal Disclaimers</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('terms');
              setSearchQuery('');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('privacy');
              setSearchQuery('');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-teal-500" />
            <span>Privacy &amp; NDPA</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clause (e.g. taxes, debt, liability)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <Card padding="lg" className="space-y-4">
        {/* Executive Summary Callout */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
            <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Key Founder &amp; Platform Safeguards at a Glance</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">·</span>
              <span>
                <strong>No Tax/Accounting Advice:</strong> Calculations are operational management
                estimates only.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">·</span>
              <span>
                <strong>Bank Alerts:</strong> Merchants must confirm real bank credit inflow before
                releasing stock.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">·</span>
              <span>
                <strong>Customer Credit:</strong> Debt ledger is a record aid; MarketMate is not a
                collection guarantor.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">·</span>
              <span>
                <strong>Liability Cap:</strong> Strictly limited to{' '}
                {LEGAL_CONFIG.liabilityCapAmount}.
              </span>
            </li>
          </ul>
        </div>

        {/* Section Clauses */}
        {filteredSections.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No legal clauses matched "{searchQuery}". Try searching for "bank", "liability", or
            "debts".
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSections.map((section) => {
              const isExpanded = expandedSectionId === section.id || Boolean(searchQuery.trim());
              return (
                <div
                  key={section.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {section.title}
                        </span>
                        {section.badge && (
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                            · {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {section.summary}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {section.content.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className={
                            paragraph.startsWith('TO THE MAXIMUM')
                              ? 'font-bold uppercase text-slate-900 dark:text-white'
                              : ''
                          }
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Official Contact Footer for Legal Queries */}
        <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Questions or Legal Inquiries?
            </p>
            <p>
              Contact our official compliance desk at{' '}
              <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-emerald-600 underline">
                {LEGAL_CONFIG.supportEmail}
              </a>{' '}
              or WhatsApp support.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={LEGAL_CONFIG.supportWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Desk</span>
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};
