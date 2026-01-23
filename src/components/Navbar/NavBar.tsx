import React from 'react';
import { Home, Clock, BarChart3, User } from 'lucide-react';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
}

interface NavBarProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    isTimedIn?: boolean;
    onTimeToggle?: () => void;
    avatarUrl?: string | null;
}

const NavBar: React.FC<NavBarProps> = ({
    activeTab = 'home',
    onTabChange,
    isTimedIn = false,
    onTimeToggle,
    avatarUrl = null
}) => {
    const navItems: NavItem[] = [
        {
            icon: <Home className="w-5 h-5" />,
            label: 'Home',
            href: 'home',
            active: activeTab === 'home'
        },
        {
            icon: <Clock className="w-5 h-5" />,
            label: 'Logs',
            href: 'logs',
            active: activeTab === 'logs'
        },
        {
            icon: <BarChart3 className="w-5 h-5" />,
            label: 'Stats',
            href: 'stats',
            active: activeTab === 'stats'
        },
        {
            icon: avatarUrl ? (
                <div className={`w-5 h-5 rounded-full overflow-hidden border-2 transition-all duration-300 ${activeTab === 'profile' ? 'border-primary' : 'border-gray-200 group-hover:border-accent'}`}>
                    <img src={avatarUrl} alt="P" className="w-full h-full object-cover" />
                </div>
            ) : <User className="w-5 h-5" />,
            label: 'Profile',
            href: 'profile',
            active: activeTab === 'profile'
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-md mx-auto relative">
                {/* FAB Button - centered above navbar */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
                    <button
                        onClick={onTimeToggle}
                        className="group relative flex flex-col items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95 focus:outline-none"
                    >
                        {/* Icon with transparent background and colored border */}
                        <div className={`
                            w-16 h-16 rounded-full flex items-center justify-center
                            bg-white border-[3px]
                            transition-all duration-300
                            ${isTimedIn
                                ? 'border-[#EF4444] shadow-lg shadow-red-500/10'
                                : 'border-primary shadow-lg shadow-primary/20'
                            }
                        `}>
                            <Clock
                                className={`w-7 h-7 ${isTimedIn ? 'text-[#EF4444] animate-spin' : 'text-primary'}`}
                                strokeWidth={2.5}
                            />
                        </div>

                        {/* Text Label - positioned to align with navbar text */}
                        <span className={`
                            text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
                            transition-colors duration-300 mt-3
                            ${isTimedIn ? 'text-[#EF4444]' : 'text-primary'}
                        `}>
                            {isTimedIn ? 'Time Out' : 'Time In'}
                        </span>
                    </button>
                </div>

                {/* Navbar */}
                <div className="bg-white border-t border-gray-200/80 backdrop-blur-lg shadow-2xl rounded-t-2xl">
                    <div className="px-4 py-2">
                        <div className="flex items-center justify-around max-w-sm mx-auto">
                            {/* All nav items with even spacing, spacer in middle for FAB */}
                            {navItems.map((item, index) => (
                                <React.Fragment key={item.href}>
                                    {/* Insert spacer after 2nd item (Logs) for center button */}
                                    {index === 2 && <div className="w-16" />}

                                    <button
                                        onClick={() => onTabChange?.(item.href)}
                                        className={`
                                            group relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl
                                            transition-all duration-300 ease-out min-w-[64px]
                                            ${item.active
                                                ? 'text-primary'
                                                : 'text-gray-400 hover:text-accent'
                                            }
                                        `}
                                    >
                                        {item.active && (
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/20 rounded-2xl" />
                                        )}

                                        <div className={`
                                            relative z-10 flex items-center justify-center
                                            transition-all duration-300
                                            ${item.active ? 'scale-110' : 'group-hover:scale-105'}
                                        `}>
                                            {item.icon}
                                        </div>

                                        <span className={`
                                            relative z-10 text-[9px] font-bold uppercase tracking-wider
                                            transition-all duration-300
                                            ${item.active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}
                                        `}>
                                            {item.label}
                                        </span>
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="h-safe-bottom bg-white" />
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
