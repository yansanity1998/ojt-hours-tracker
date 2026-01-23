import React from 'react';
import { Bell, Clock, StickyNote } from 'lucide-react';

export type NotificationType =
    | 'time-in'
    | 'time-out'
    | 'entry-added'
    | 'note-added'
    | 'note-updated'
    | 'note-deleted';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    message: string;
    createdAt: string; // ISO string
}

interface NotificationProps {
    notifications: NotificationItem[];
    onClear?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notifications, onClear }) => {
    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'time-in':
            case 'time-out':
                return <Clock className="w-3.5 h-3.5 text-[#1a2517]" />;
            default:
                return <StickyNote className="w-3.5 h-3.5 text-[#1a2517]" />;
        }
    };

    const getBadgeColor = (type: NotificationType) => {
        switch (type) {
            case 'time-in':
                return 'bg-emerald-100 text-emerald-700';
            case 'time-out':
                return 'bg-amber-100 text-amber-700';
            case 'entry-added':
                return 'bg-lime-100 text-lime-700';
            case 'note-added':
                return 'bg-sky-100 text-sky-700';
            case 'note-updated':
                return 'bg-indigo-100 text-indigo-700';
            case 'note-deleted':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a2517]/10 to-[#ACC8A2]/10 flex items-center justify-center text-[#1a2517] shadow-sm">
                        <Bell className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#1a2517]">Notifications</p>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#1a2517]/50">
                            {notifications.length > 0
                                ? `${notifications.length} notification${notifications.length > 1 ? 's' : ''}`
                                : 'Recent activity'}
                        </p>
                    </div>
                </div>
                {notifications.length > 0 && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#1a2517]/50 hover:text-[#1a2517]"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-[#1a2517]/50 font-semibold">
                    No notifications yet.
                </div>
            ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pb-1">
                    {notifications.slice(0, 10).map((item) => (
                        <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all duration-150"
                        >
                            <div className="flex items-start gap-2">
                                <div className="mt-0.5 flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
                                    {getIcon(item.type)}
                                </div>
                                <div>
                                    <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${getBadgeColor(
                                            item.type
                                        )}`}
                                    >
                                        {item.type.replace('-', ' ')}
                                    </span>
                                    <p className="mt-1 text-[11px] text-[#1a2517] leading-snug">
                                        {item.message}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] text-[#1a2517]/40 font-semibold mt-1 whitespace-nowrap">
                                {formatTime(item.createdAt)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notification;
