import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Sparkles,
  AlertCircle,
  Mail,
  ExternalLink,
  Clock,
  ShieldCheck,
  Inbox,
  Filter,
  Send,
  Building2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { PlatformAnnouncement, AppView } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: AppView) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { announcements, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user, business } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const currentIdentifier = business?.id || user?.id || '';

  const filteredList = announcements.filter((item) => {
    if (filter === 'unread') {
      return !item.readBy?.includes(currentIdentifier);
    }
    return true;
  });

  const handleActionClick = (item: PlatformAnnouncement) => {
    markAsRead(item.id);
    if (item.actionUrl) {
      if (item.actionUrl.startsWith('http')) {
        window.open(item.actionUrl, '_blank', 'noopener,noreferrer');
      } else if (onNavigate) {
        onNavigate(item.actionUrl as AppView);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Notifications & Messages
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Announcements and direct notices from MarketMate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter and Actions Bar */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              All ({announcements.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {filter === 'unread' ? 'All caught up!' : 'No messages yet'}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {filter === 'unread'
                  ? 'You have read all announcements and notices.'
                  : 'System broadcasts and targeted support messages from the platform team will appear here.'}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isRead = item.readBy?.includes(currentIdentifier);
              const isUrgent = item.priority === 'urgent';
              const isImportant = item.priority === 'important';
              const isDirect = item.type === 'direct';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all text-xs relative ${
                    !isRead
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-2xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* Status Indicator */}
                  {!isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />
                  )}

                  {/* Header badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {isDirect ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Building2 className="w-2.5 h-2.5" />
                        <span>Direct Message</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Send className="w-2.5 h-2.5" />
                        <span>Broadcast</span>
                      </span>
                    )}

                    {isUrgent ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                        Urgent
                      </span>
                    ) : isImportant ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Important
                      </span>
                    ) : null}

                    {item.channel === 'both' || item.channel === 'email' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                        <Mail className="w-2.5 h-2.5" />
                        <span>Email Sent</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Title & Body */}
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                    {item.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-line mb-3">
                    {item.content}
                  </p>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.senderName || 'MarketMate Admin'}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.actionLabel && (
                        <button
                          onClick={() => handleActionClick(item)}
                          className="px-2 py-1 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{item.actionLabel}</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {!isRead && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/40">
          <p className="text-[10px] text-slate-400">
            Powered by MarketMate Multi-Channel Communications Engine
          </p>
        </div>
      </div>
    </div>
  );
};
