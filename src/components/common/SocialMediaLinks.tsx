import React from 'react';
import {
  Instagram,
  Twitter,
  MessageCircle,
  Facebook,
  Youtube,
  Linkedin,
  Video,
  ExternalLink,
} from 'lucide-react';
import { SOCIAL_LINKS, SocialLink, OFFICIAL_HANDLE } from '../../lib/socialConfig';

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
  const getSocialIcon = (id: SocialLink['id'], iconClass = 'w-4 h-4') => {
    switch (id) {
      case 'instagram':
        return <Instagram className={iconClass} />;
      case 'twitter':
        return <Twitter className={iconClass} />;
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

  if (variant === 'sidebar') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {showTitle && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Official Channels
          </p>
        )}
        <div className="flex items-center justify-between gap-1 px-1">
          {SOCIAL_LINKS.slice(0, 5).map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${social.name} (${social.handle})`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {getSocialIcon(social.id, 'w-3.5 h-3.5')}
            </a>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`space-y-3 ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Official Social Media & Community
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Follow {OFFICIAL_HANDLE} for retail tips, tutorials, and system changelogs.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Verified {OFFICIAL_HANDLE}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-xs transition-all flex flex-col justify-between gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${social.bgLightClass}`}
                  >
                    {getSocialIcon(social.id, 'w-3.5 h-3.5')}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {social.name}
                      </p>
                      {social.badge && (
                        <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                          {social.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {social.handle}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                {social.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Compact row
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.id}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition-all text-xs font-medium cursor-pointer shadow-2xs"
        >
          {getSocialIcon(social.id, 'w-3.5 h-3.5')}
          <span className="text-[11px]">{social.name}</span>
        </a>
      ))}
    </div>
  );
};
