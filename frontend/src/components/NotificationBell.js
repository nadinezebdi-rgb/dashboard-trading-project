'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Trophy, Zap, Medal, Gift, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

const NOTIF_ICONS = {
  level_up: <Zap className="w-5 h-5 text-yellow-500" />,
  achievement: <Medal className="w-5 h-5 text-purple-500" />,
  reward: <Gift className="w-5 h-5 text-green-500" />,
  season: <Trophy className="w-5 h-5 text-orange-500" />,
  default: <Bell className="w-5 h-5 text-blue-500" />
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications(10);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-sm hover:bg-secondary transition-colors"
        data-testid="notification-bell"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-sm shadow-xl z-50"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-bold text-sm uppercase">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
                data-testid="mark-all-read"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 flex gap-3 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {NOTIF_ICONS[notif.type] || NOTIF_ICONS.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                      {notif.message}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {formatTime(notif.created_at)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="w-full text-center text-xs text-primary hover:underline py-1">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
