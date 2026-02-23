import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationBell({ user }) {
  const [open, setOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['app-notifications', user?.id],
    queryFn: async () => {
      const query = {
        recipient_role: user?.app_role,
        read: false,
      };
      if (user?.id) {
        query.recipient_user_id = user.id;
      }
      const res = await base44.entities.AppNotification.filter(query, '-created_date', 20);
      return res || [];
    },
    enabled: !!user?.id && !!user?.app_role,
    staleTime: 30 * 1000,
  });

  const unreadCount = notifications.length;

  const handleMarkAsRead = async (notificationId) => {
    await base44.entities.AppNotification.update(notificationId, { read: true });
    refetch();
  };

  const handleMarkAllAsRead = async () => {
    await Promise.all(
      notifications.map(n => base44.entities.AppNotification.update(n.id, { read: true }))
    );
    refetch();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-slate-900 border-slate-700">
        <div className="flex flex-col max-h-96">
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-slate-400 hover:text-[#D6FF03] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No unread notifications
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800 transition-colors"
                >
                  <p className="font-medium text-white text-sm">{notif.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {formatRelativeTime(notif.created_date)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}