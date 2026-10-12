/**
 * MarketMate Official Social Media Handles & Community Channels
 * Brand Identity & Community Hub
 */

export interface SocialLink {
  id: 'instagram' | 'twitter' | 'whatsapp' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin';
  name: string;
  handle: string;
  url: string;
  description: string;
  badge?: string;
  colorClass: string;
  bgLightClass: string;
}

export const OFFICIAL_HANDLE = '@getmarketmate';
export const OFFICIAL_WEBSITE = 'https://getmarketmate.online';

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@getmarketmate',
    url: 'https://instagram.com/getmarketmate',
    description: 'Retail growth tips, daily store hacks & merchant stories',
    badge: 'Popular',
    colorClass: 'text-pink-600 dark:text-pink-400 hover:text-pink-700',
    bgLightClass: 'hover:bg-pink-50 dark:hover:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    handle: '@getmarketmate',
    url: 'https://x.com/getmarketmate',
    description: 'Product changelogs, retail intelligence & direct support',
    badge: 'Fast Updates',
    colorClass: 'text-slate-900 dark:text-slate-100 hover:text-black',
    bgLightClass: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Community',
    handle: 'MarketMate Community',
    url: 'https://wa.me/2347089238728?text=Hello%20MarketMate%20Team%2C%20I%20would%20like%20to%20connect%20with%20the%20official%20community.',
    description: 'Direct owner line, support updates & merchant VIP lounge',
    badge: 'Active Hotline',
    colorClass: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700',
    bgLightClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@getmarketmate',
    url: 'https://tiktok.com/@getmarketmate',
    description: '60-second retail tutorials, barcode scanner hacks & features',
    badge: 'Video Guides',
    colorClass: 'text-neutral-900 dark:text-neutral-100 hover:text-black',
    bgLightClass: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'MarketMate',
    url: 'https://facebook.com/getmarketmate',
    description: 'Community groups, business management tips & discussions',
    colorClass: 'text-blue-600 dark:text-blue-400 hover:text-blue-700',
    bgLightClass: 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@getmarketmate',
    url: 'https://youtube.com/@getmarketmate',
    description: 'Full video walkthroughs, store onboarding & masterclasses',
    colorClass: 'text-red-600 dark:text-red-400 hover:text-red-700',
    bgLightClass: 'hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'MarketMate Technologies',
    url: 'https://linkedin.com/company/getmarketmate',
    description: 'Corporate news, retail tech insights & partnerships',
    colorClass: 'text-sky-700 dark:text-sky-400 hover:text-sky-800',
    bgLightClass: 'hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50',
  },
];
