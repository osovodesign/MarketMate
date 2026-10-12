import React, { useState } from 'react';
import {
  Instagram,
  MessageCircle,
  Facebook,
  Youtube,
  Linkedin,
  Video,
  ExternalLink,
  Sparkles,
  Clock,
  X as CloseIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  SOCIAL_LINKS,
  SocialLink,
  OFFICIAL_HANDLE,
  WHATSAPP_COMMUNITY_URL,
  INSTAGRAM_URL,
} from '../../lib/socialConfig';
import { motion, AnimatePresence } from 'motion/react';

interface SocialMediaLinksProps {
  variant?: 'compact' | 'cards' | 'inline' | 'sidebar';
  className?: string;
  showTitle?: boolean;
}

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  variant = 'compact',
  className = '',
  showTitle = false,
}) => {
  const [comingSoonTarget, setComingSoonTarget] = useState<SocialLink | null>(null);

  const getSocialIcon = (id: SocialLink['id'], iconClass = 'w-4 h-4') => {
    switch (id) {
      case 'instagram':
        return <Instagram className={iconClass} />;
      case 'twitter':
        // Custom X logo path for accuracy
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'whatsapp':
        return <MessageCircle className={iconClass} />;
      case 'facebook':
        return <Facebook className={iconClass} />;
      case 'youtube':
        return <Youtube className={iconClass} />;
      case 'linkedin':
        return <Linkedin className={iconClass} />;
      case 'tiktok':
        return <Video className={iconClass} />;
      default:
        return <ExternalLink className={iconClass} />;
    }
  };

  const handleLinkClick = (e: React.MouseEvent, social: SocialLink) => {
    if (social.isComingSoon) {
      e.preventDefault();
      e.stopPropagation();
      setComingSoonTarget(social);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <div className={`space-y-1.5 ${className}`}>
          {showTitle && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Official Channels
            </p>
          )}
          <div className="flex items-center justify-between gap-1 px-1">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target={social.isComingSoon ? undefined : '_blank'}
                rel={social.isComingSoon ? undefined : 'noopener noreferrer'}
                onClick={(e) => handleLinkClick(e, social)}
                title={
                  social.isComingSoon
                    ? `${social.name}: Coming Soon! No official channel yet`
                    : `${social.name} (${social.handle})`
                }
                className={`p-1.5 rounded-lg transition-colors relative group ${
                  social.isComingSoon
                    ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {getSocialIcon(social.id, 'w-3.5 h-3.5')}
                {social.isComingSoon && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {variant === 'cards' && (
        <div className={`space-y-3 ${className}`}>
          {showTitle && (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Official Social Media & Community</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Connect with the verified MarketMate community for retail tips, tutorials, and support.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                Verified {OFFICIAL_HANDLE}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target={social.isComingSoon ? undefined : '_blank'}
                rel={social.isComingSoon ? undefined : 'noopener noreferrer'}
                onClick={(e) => handleLinkClick(e, social)}
                className={`group p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 relative ${
                  social.isComingSoon
                    ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${social.bgLightClass}`}
                    >
                      {getSocialIcon(social.id, 'w-4 h-4')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {social.name}
                        </p>
                        {social.isComingSoon ? (
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            Coming Soon
                          </span>
                        ) : (
                          social.badge && (
                            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                              {social.badge}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {social.handle}
                      </p>
                    </div>
                  </div>
                  {social.isComingSoon ? (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {social.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {variant === 'compact' && (
        <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target={social.isComingSoon ? undefined : '_blank'}
              rel={social.isComingSoon ? undefined : 'noopener noreferrer'}
              onClick={(e) => handleLinkClick(e, social)}
              title={
                social.isComingSoon
                  ? `${social.name}: Coming Soon! No official channel yet`
                  : `${social.name} (${social.handle})`
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-2xs ${
                social.isComingSoon
                  ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 hover:text-amber-600 hover:border-amber-300'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300'
              }`}
            >
              {getSocialIcon(social.id, 'w-3.5 h-3.5')}
              <span className="text-[11px]">{social.name}</span>
              {social.isComingSoon && (
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 ml-0.5">
                  (Soon)
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Coming Soon Interactive Notification Modal */}
      <AnimatePresence>
        {comingSoonTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setComingSoonTarget(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setComingSoonTarget(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1.5">
                  Channel In Progress
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {comingSoonTarget.name}: Coming Soon!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  No official channel yet. Our verified {comingSoonTarget.name} channel is currently in preparation and will be unveiled following our launch.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  Connect with us right now on active channels:
                </p>
                <div className="flex flex-col gap-1.5">
                  <a
                    href={WHATSAPP_COMMUNITY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setComingSoonTarget(null)}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Join WhatsApp Community
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setComingSoonTarget(null)}
                    className="flex items-center justify-between p-2 rounded-lg bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300 text-xs font-semibold hover:bg-pink-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      Follow @marketmateapp on Instagram
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setComingSoonTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
