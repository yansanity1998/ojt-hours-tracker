import React, { useState, useEffect } from 'react';
import CompanyInput from './CompanyInput';
import TimeRecords from './TimeRecords';
import HoursProgress from './HoursProgress';
import DailyNotes from './DailyNotes';
import { SortableCard } from './SortableCard';
import NavBar from '../Navbar/NavBar';
import Profile from './Profile';
import Notification, { type NotificationItem, type NotificationType } from './Notification';
import '../../App.css';
import { supabase } from '../../supabase/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Loader2, MapPin } from 'lucide-react';
import logo from '../../assets/image/calendar.jpg';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

interface TimeEntry {
    id: string;
    date: string;
    timeIn: string;
    timeOut: string;
    hours: number;
}

const Dashboard: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getTabFromPath = (path: string) => {
        if (path.startsWith('/dashboard/logs')) return 'logs';
        if (path.startsWith('/dashboard/stats')) return 'stats';
        if (path.startsWith('/dashboard/profile')) return 'profile';
        return 'home';
    };

    const [activeTab, setActiveTab] = useState<string>(() => getTabFromPath(location.pathname));
    const [companyName, setCompanyName] = useState('');
    const [companyLocation, setCompanyLocation] = useState('');
    const [totalRequiredHours, setTotalRequiredHours] = useState(0);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
    const [isTimedIn, setIsTimedIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [cardOrder, setCardOrder] = useState(['company-input', 'hours-progress', 'daily-notes']);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement to start drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms hold to start drag on touch
                tolerance: 5,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = cardOrder.indexOf(active.id as string);
            const newIndex = cardOrder.indexOf(over.id as string);
            const newOrder = arrayMove(cardOrder, oldIndex, newIndex);

            setCardOrder(newOrder);
            updateSettings({ card_order: newOrder });
        }
    };

    useEffect(() => {
        setActiveTab(getTabFromPath(location.pathname));
    }, [location.pathname]);

    // Load notifications from localStorage when userId is available
    useEffect(() => {
        if (!userId) return;
        try {
            const stored = localStorage.getItem(`ojt_notifications_${userId}`);
            if (stored) {
                const parsed = JSON.parse(stored) as NotificationItem[];
                if (Array.isArray(parsed)) {
                    setNotifications(parsed);
                }
            }
        } catch (error) {
            console.error('Failed to load notifications from storage', error);
        }
    }, [userId]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const basePath = '/dashboard';
        const targetPath = tab === 'home' ? basePath : `${basePath}/${tab}`;
        if (location.pathname !== targetPath) {
            navigate(targetPath);
        }
    };

    // Live Clock Update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Persist notifications to localStorage per user
    useEffect(() => {
        if (!userId) return;
        try {
            localStorage.setItem(`ojt_notifications_${userId}`, JSON.stringify(notifications));
        } catch (error) {
            console.error('Failed to save notifications to storage', error);
        }
    }, [notifications, userId]);

    // 1. Fetch User Session and Data
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            setUserId(user.id);

            // Fetch OJT Settings
            const { data: settings } = await supabase
                .from('ojt_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (settings) {
                setCompanyName(settings.company_name);
                setCompanyLocation(settings.company_location || '');
                setTotalRequiredHours(settings.total_required_hours);
                if (settings.card_order && Array.isArray(settings.card_order)) {
                    const savedOrder = settings.card_order;
                    // Ensure daily-notes is added if not present
                    if (!savedOrder.includes('daily-notes')) {
                        savedOrder.push('daily-notes');
                    }
                    setCardOrder(savedOrder);
                }
            } else {
                // Initialize default values if not exists
                setCompanyName('My Company');
                setCompanyLocation('');
                setTotalRequiredHours(500);
            }

            // Fetch Time Entries
            const { data: entries } = await supabase
                .from('ojt_time_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('time_in', { ascending: false });

            if (entries) {
                const formattedEntries = entries.map(e => ({
                    id: e.id,
                    date: e.date,
                    timeIn: e.time_in.substring(0, 5),
                    timeOut: e.time_out.substring(0, 5),
                    hours: parseFloat(e.hours)
                }));
                setTimeEntries(formattedEntries);

                // Check for current active entry using local date
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                // An active entry is one for today where time_out is the sentinel value '23:59'
                const activeEntry = entries.find(e =>
                    e.date === today &&
                    (e.time_out === '23:59' || e.time_out === '23:59:00')
                );

                if (activeEntry) {
                    setActiveEntryId(activeEntry.id);
                    setIsTimedIn(true);
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const totalHoursCompleted = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const hoursLeft = Math.max(0, totalRequiredHours - totalHoursCompleted);

    const pushNotification = (type: NotificationType, message: string) => {
        const item: NotificationItem = {
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            type,
            message,
            createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [item, ...prev]);
    };

    const handleNotify = (type: NotificationType, message: string) => {
        pushNotification(type, message);
    };

    const handleBellClick = () => {
        setShowNotifications(prev => !prev);
    };

    const handleClearNotifications = () => {
        setNotifications([]);
        if (userId) {
            try {
                localStorage.removeItem(`ojt_notifications_${userId}`);
            } catch (error) {
                console.error('Failed to clear notifications from storage', error);
            }
        }
    };

    // Time In/Out Handler
    const handleTimeToggle = async () => {
        if (!userId) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (!isTimedIn) {
            // TIME IN: Check if there's an entry for today already to "replace/resume" it
            const todayEntry = timeEntries.find(e => e.date === currentDate);

            if (todayEntry) {
                // Update existing today's entry
                const { error } = await supabase
                    .from('ojt_time_entries')
                    .update({
                        time_out: '23:59',
                        hours: 0
                    })
                    .eq('id', todayEntry.id);

                if (!error) {
                    setActiveEntryId(todayEntry.id);
                    setIsTimedIn(true);
                    setTimeEntries(prev => prev.map(e =>
                        e.id === todayEntry.id
                            ? { ...e, timeOut: '23:59', hours: 0 }
                            : e
                    ));
                    handleTabChange('logs');
                    pushNotification('time-in', 'You timed in for today.');
                }
            } else {
                // Create new entry
                const newEntryData = {
                    user_id: userId,
                    date: currentDate,
                    time_in: currentTime,
                    time_out: '23:59',
                    hours: 0
                };

                const { data } = await supabase
                    .from('ojt_time_entries')
                    .insert([newEntryData])
                    .select()
                    .single();

                if (data) {
                    setActiveEntryId(data.id);
                    setIsTimedIn(true);

                    const formatted: TimeEntry = {
                        id: data.id,
                        date: data.date,
                        timeIn: data.time_in.substring(0, 5),
                        timeOut: data.time_out.substring(0, 5),
                        hours: 0
                    };
                    setTimeEntries(prev => [formatted, ...prev]);
                    handleTabChange('logs');
                    pushNotification('time-in', 'You timed in for today.');
                }
            }
        } else {
            // TIME OUT: Update the active entry
            if (!activeEntryId) return;

            const entry = timeEntries.find(e => e.id === activeEntryId);
            if (!entry) return;

            const timeIn = new Date(`2000-01-01T${entry.timeIn}`);
            const timeOut = new Date(`2000-01-01T${currentTime}`);
            const diffMs = timeOut.getTime() - timeIn.getTime();
            const calculatedHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);

            await supabase
                .from('ojt_time_entries')
                .update({
                    time_out: currentTime,
                    hours: calculatedHours
                })
                .eq('id', activeEntryId);

            setTimeEntries(prev => prev.map(e =>
                e.id === activeEntryId
                    ? { ...e, timeOut: currentTime, hours: calculatedHours }
                    : e
            ));

            setIsTimedIn(false);
            setActiveEntryId(null);
            handleTabChange('logs'); // Switch to logs tab
            pushNotification('time-out', `You timed out and logged ${calculatedHours} hours.`);
        }
    };

    // 2. Sync Settings Changes
    const updateSettings = async (updates: {
        company_name?: string;
        company_location?: string;
        total_required_hours?: number;
        card_order?: string[];
    }) => {
        if (!userId) return;
        await supabase
            .from('ojt_settings')
            .upsert({
                user_id: userId,
                ...updates,
                updated_at: new Date().toISOString()
            });
    };

    const handleCompanyNameChange = (val: string) => {
        setCompanyName(val);
        updateSettings({ company_name: val });
    };

    const handleCompanyLocationChange = (val: string) => {
        setCompanyLocation(val);
        updateSettings({ company_location: val });
    };

    const handleTotalHoursChange = (val: number) => {
        setTotalRequiredHours(val);
        updateSettings({ total_required_hours: val });
    };

    // 3. Time Entry Logic
    const handleUpdateEntry = async (id: string, field: 'timeIn' | 'timeOut', value: string) => {
        const entryToUpdate = timeEntries.find(e => e.id === id);
        if (!entryToUpdate) return;

        const updatedEntry = { ...entryToUpdate, [field]: value };

        // Recalculate hours
        const timeIn = new Date(`2000-01-01T${updatedEntry.timeIn}`);
        const timeOut = new Date(`2000-01-01T${updatedEntry.timeOut}`);
        const diffMs = timeOut.getTime() - timeIn.getTime();
        updatedEntry.hours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);

        setTimeEntries(prev => prev.map(e => (e.id === id ? updatedEntry : e)));

        // Update Supabase
        await supabase
            .from('ojt_time_entries')
            .update({
                time_in: updatedEntry.timeIn,
                time_out: updatedEntry.timeOut,
                hours: updatedEntry.hours
            })
            .eq('id', id);
    };

    const handleDeleteEntry = async (id: string) => {
        setTimeEntries(prev => prev.filter(entry => entry.id !== id));
        await supabase.from('ojt_time_entries').delete().eq('id', id);
    };

    const handleAddEntry = async () => {
        if (!userId) return;

        const now = new Date();
        const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const newEntryData = {
            user_id: userId,
            date: currentDate,
            time_in: '08:00',
            time_out: '17:00',
            hours: 9
        };

        const { data } = await supabase
            .from('ojt_time_entries')
            .insert([newEntryData])
            .select()
            .single();

        if (data) {
            const formatted: TimeEntry = {
                id: data.id,
                date: data.date,
                timeIn: data.time_in.substring(0, 5),
                timeOut: data.time_out.substring(0, 5),
                hours: parseFloat(data.hours)
            };
            setTimeEntries(prev => [formatted, ...prev]);
            pushNotification('entry-added', `Manual entry added for ${formatted.date}.`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#1a2517] animate-spin" />
                    <p className="text-[#1a2517] font-bold animate-pulse">Syncing Tracker...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'home': {
                const cardComponents: Record<string, React.ReactNode> = {
                    'company-input': (
                        <CompanyInput
                            companyName={companyName}
                            companyLocation={companyLocation}
                            totalRequiredHours={totalRequiredHours}
                            onCompanyNameChange={handleCompanyNameChange}
                            onCompanyLocationChange={handleCompanyLocationChange}
                            onTotalHoursChange={handleTotalHoursChange}
                        />
                    ),
                    'hours-progress': (
                        <HoursProgress
                            totalRequired={totalRequiredHours}
                            completed={totalHoursCompleted}
                            left={hoursLeft}
                        />
                    ),
                    'daily-notes': (
                        <DailyNotes userId={userId} onNotify={handleNotify} />
                    ),
                };

                return (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={cardOrder}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {cardOrder.map((cardId) => (
                                    <SortableCard key={cardId} id={cardId}>
                                        {cardComponents[cardId]}
                                    </SortableCard>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                );
            }
            case 'logs':
                return (
                    <TimeRecords
                        entries={timeEntries}
                        onUpdateEntry={handleUpdateEntry}
                        onDeleteEntry={handleDeleteEntry}
                        onAddEntry={handleAddEntry}
                    />
                );
            case 'stats':
                return (
                    <HoursProgress
                        totalRequired={totalRequiredHours}
                        completed={totalHoursCompleted}
                        left={hoursLeft}
                    />
                );
            case 'profile':
                return (
                    <Profile
                        companyName={companyName}
                        companyLocation={companyLocation}
                        totalRequiredHours={totalRequiredHours}
                        onLogout={handleLogout}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-gray-50 to-[#F8F9FA] pb-24">
            {/* Mobile App Header */}
            <div className="bg-gradient-to-br from-[#1a2517] to-[#4A5D44] px-4 pt-6 pb-8 sm:pb-10 rounded-b-[2rem] shadow-xl">
                <div className="max-w-md mx-auto">
                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <img
                                src={logo}
                                alt="OJT Hours logo"
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-md bg-white/90"
                            />
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    OJT Hours
                                </h1>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {companyLocation ? (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyLocation)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] sm:text-xs text-white/90 font-bold hover:text-white transition-colors group"
                                        >
                                            <MapPin className="w-3 h-3 text-white/60 group-hover:text-white" />
                                            <span className="underline underline-offset-2 decoration-white/30 group-hover:decoration-white/60">{companyName}</span>
                                        </a>
                                    ) : (
                                        <p className="text-xs sm:text-sm text-white/80 font-medium">
                                            {companyName || 'Track your progress'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right flex flex-col items-end">
                                <p className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                                <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider mt-1 leading-none">
                                    {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={handleBellClick}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
                                >
                                    <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                </button>
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md">
                                        {notifications.length > 9 ? '9+' : notifications.length}
                                    </span>
                                )}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
                                        <Notification
                                            notifications={notifications}
                                            onClear={handleClearNotifications}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden">
                        <div className="grid grid-cols-3 divide-x divide-gray-100/50">
                            <div className="text-center px-1">
                                <p className="text-2xl sm:text-3xl font-black text-primary tabular-nums leading-none tracking-tight">
                                    {Math.round(totalHoursCompleted)}
                                </p>
                                <p className="text-[8px] sm:text-[9px] font-black text-primary/40 uppercase tracking-[0.15em] mt-2 flex flex-col items-center">
                                    <span className="leading-none">Hours</span>
                                    <span className="leading-none mt-0.5">Logged</span>
                                </p>
                            </div>
                            <div className="text-center px-1">
                                <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none tracking-tight" style={{ color: '#FF743D' }}>
                                    {Math.round(hoursLeft)}
                                </p>
                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] mt-2 flex flex-col items-center" style={{ color: 'rgba(255, 116, 61, 0.5)' }}>
                                    <span className="leading-none">Hours</span>
                                    <span className="leading-none mt-0.5">Left</span>
                                </p>
                            </div>
                            <div className="text-center px-1">
                                <p className="text-2xl sm:text-3xl font-black text-[#475569] tabular-nums leading-none tracking-tight">
                                    {Math.round(totalRequiredHours)}
                                </p>
                                <p className="text-[8px] sm:text-[9px] font-black text-[#475569]/50 uppercase tracking-[0.15em] mt-2 flex flex-col items-center">
                                    <span className="leading-none">Hours</span>
                                    <span className="leading-none mt-0.5">Target</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-md mx-auto px-4 -mt-4 pb-12">
                <div className="fade-slide-up">
                    {renderContent()}
                </div>
            </div>

            {/* Bottom Navigation */}
            <NavBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isTimedIn={isTimedIn}
                onTimeToggle={handleTimeToggle}
            />
        </div>
    );
};

export default Dashboard;
