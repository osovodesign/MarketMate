/**
 * MarketMate Official Social Media Handles & Community Channels
 * Brand Identity & Community Hub
 */

export interface SocialLink {
  id: 'instagram' | 'tiktok' | 'whatsapp' | 'facebook' | 'linkedin' | 'twitter' | 'youtube';
  name: string;
  handle: string;
  url: string;
  description: string;
  badge?: string;
  colorClass: string;
  bgLightClass: string;
  isComingSoon?: boolean;
}

export const OFFICIAL_HANDLE = '@marketmateapp';
export const OFFICIAL_WEBSITE = 'https://getmarketmate.online';
export const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/Jy4sdsOqxCf9YMnFsdn1Wm?s=cl&p=a&mlu=4&ilr=4';
export const INSTAGRAM_URL = 'https://www.instagram.com/marketmateapp?mdxt=d3MwbW5nOXp5ZHVr';
export const TIKTOK_URL = 'https://www.tiktok.com/@marketmate.app';
export const LINKEDIN_URL = 'https://www.linkedin.com/company/marketmateapp/';
export const FACEBOOK_URL = 'https://www.facebook.com/share/1BkBkK4Bxy/';

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Community',
    handle: 'MarketMate Community',
    url: WHATSAPP_COMMUNITY_URL,
    description: 'Join verified merchants, retail networking & launch updates',
    badge: 'Official Group',
    colorClass: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700',
    bgLightClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    isComingSoon: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@marketmateapp',
    url: INSTAGRAM_URL,
    description: 'Retail growth tips, daily store hacks & merchant stories',
    badge: 'Popular',
    colorClass: 'text-pink-600 dark:text-pink-400 hover:text-pink-700',
    bgLightClass: 'hover:bg-pink-50 dark:hover:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50',
    isComingSoon: false,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@marketmate.app',
    url: TIKTOK_URL,
    description: 'Quick retail tutorials, barcode scanner hacks & features',
    badge: 'Video Guides',
    colorClass: 'text-neutral-900 dark:text-neutral-100 hover:text-black',
    bgLightClass: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800',
    isComingSoon: false,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'MarketMate Page',
    url: FACEBOOK_URL,
    description: 'Community groups, business management tips & discussions',
    badge: 'Official Page',
    colorClass: 'text-blue-600 dark:text-blue-400 hover:text-blue-700',
    bgLightClass: 'hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    isComingSoon: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'MarketMate App',
    url: LINKEDIN_URL,
    description: 'Corporate news, retail tech insights & partnerships',
    badge: 'Company Page',
    colorClass: 'text-sky-700 dark:text-sky-400 hover:text-sky-800',
    bgLightClass: 'hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50',
    isComingSoon: false,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    handle: '@marketmateapp',
    url: '#',
    description: 'Product changelogs, retail announcements & direct support',
    badge: 'Coming Soon',
    colorClass: 'text-slate-900 dark:text-slate-100 hover:text-black',
    bgLightClass: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800',
    isComingSoon: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@marketmateapp',
    url: '#',
    description: 'Full video walkthroughs, store onboarding & masterclasses',
    badge: 'Coming Soon',
    colorClass: 'text-red-600 dark:text-red-400 hover:text-red-700',
    bgLightClass: 'hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50',
    isComingSoon: true,
  },
];
