import React, { useState } from 'react';
import {
  ShieldAlert,
  FileText,
  Lock,
  X,
  Search,
  Scale,
  CheckCircle2,
  Printer,
  ChevronDown,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import {
  LEGAL_CONFIG,
  LEGAL_DISCLAIMERS,
  TERMS_OF_SERVICE,
  LegalSection,
} from '../../lib/legalConfig';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  defaultTab?: 'disclaimers' | 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  defaultTab = 'disclaimers',
}) => {
  const [activeTab, setActiveTab] = useState<'disclaimers' | 'terms' | 'privacy'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  MarketMate Legal & Compliance Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  v{LEGAL_CONFIG.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Terms of Service, Legal Disclaimers & NDPA Privacy Notices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs font-semibold"
              title="Print legal documentation"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Founder, Entity & CAC Registration Banner */}
        <div className="px-5 py-3 bg-emerald-50/60 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-700 dark:text-slate-300 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-emerald-900 dark:text-emerald-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              {LEGAL_CONFIG.entityName}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {LEGAL_CONFIG.cacDisplay}
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {LEGAL_CONFIG.location}
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Effective: {LEGAL_CONFIG.effectiveDate}
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            Founder: {LEGAL_CONFIG.founderName}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('disclaimers');
                setSearchQuery('');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-teal-500" />
              <span>Privacy & NDPA</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clause (e.g. taxes, debt, liability)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          
          {/* Executive Summary Callout */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Key Founder & Platform Safeguards at a Glance</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>No Tax/Accounting Advice:</strong> Calculations are operational management estimates only.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Bank Alerts:</strong> Merchants must confirm real bank credit inflow before releasing stock.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Customer Credit:</strong> Debt ledger is a record aid; MarketMate is not a collection guarantor.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Liability Cap:</strong> Strictly limited to {LEGAL_CONFIG.liabilityCapAmount}.</span>
              </li>
            </ul>
          </div>

          {/* Section Clauses */}
          {filteredSections.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No legal clauses matched "{searchQuery}". Try searching for "bank", "liability", or "debts".
            </div>
          ) : (
            filteredSections.map((section) => {
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
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {section.title}
                        </span>
                        {section.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 space-y-2.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {section.content.map((paragraph, idx) => (
                        <p key={idx} className={paragraph.startsWith('TO THE MAXIMUM') ? 'font-bold uppercase text-slate-900 dark:text-white' : ''}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Official Contact Footer for Legal Queries */}
          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Questions or Legal Inquiries?</p>
              <p>Contact our official compliance desk at <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-emerald-600 underline">{LEGAL_CONFIG.supportEmail}</a> or WhatsApp support.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={LEGAL_CONFIG.supportWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            Governed by the Laws of the Federal Republic of Nigeria
          </span>

          <button
            type="button"
            onClick={() => {
              if (onAccept) onAccept();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
