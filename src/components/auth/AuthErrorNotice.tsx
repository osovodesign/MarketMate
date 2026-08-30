import React, { useState } from 'react';
import { AlertCircle, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';

interface AuthErrorNoticeProps {
  error: string | null;
  onClear?: () => void;
}

export const AuthErrorNotice: React.FC<AuthErrorNoticeProps> = ({ error }) => {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const isUnauthorizedDomain =
    error.includes('auth/unauthorized-domain') ||
    error.toLowerCase().includes('unauthorized domain') ||
    error.toLowerCase().includes('unauthorized-domain');

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.vercel.app';
  const projectId = 'gen-lang-client-0595386295';
  const consoleAuthUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopyHost = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (isUnauthorizedDomain) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950 dark:text-amber-100 text-sm">
              Google Sign-In: Domain Authorization Required
            </h4>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Firebase Authentication protects your app by only allowing Google Sign-In from registered domains. Your deployment domain is currently not on the whitelist.
            </p>
          </div>
        </div>

        {/* Current Domain Box with Copy Button */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
              Domain to authorize
            </span>
            <code className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
              {currentHost}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopyHost}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 font-medium text-xs transition-colors shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-amber-100/60 dark:bg-amber-900/40 p-2.5 rounded-lg space-y-1.5 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
          <p className="font-semibold text-amber-950 dark:text-amber-100">How to fix in 1 minute:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              Go to{' '}
              <a
                href={consoleAuthUrl}
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold hover:text-amber-700 dark:hover:text-amber-300 inline-flex items-center gap-0.5"
              >
                Firebase Authentication Settings <ExternalLink className="w-3 h-3 inline" />
              </a>
            </li>
            <li>Scroll to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.</li>
            <li>Paste <strong className="font-mono">{currentHost}</strong> and save.</li>
          </ol>
        </div>

        <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium pt-0.5">
          💡 <strong>Instant option:</strong> You can sign in or register with <strong>Email & Password</strong> right now without any domain restrictions!
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
      <div className="flex-1 leading-snug">{error}</div>
    </div>
  );
};
