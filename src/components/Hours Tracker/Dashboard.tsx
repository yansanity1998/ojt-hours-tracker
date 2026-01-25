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
import { Bell, MapPin } from 'lucide-react';
import logo from '../../assets/image/calendar.jpg';
import intern2 from '../../assets/image/intern2.jpg';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface TimeEntry {
    id: string;
    date: string;
    amIn: string | null;
    amOut: string | null;
    pmIn: string | null;
    pmOut: string | null;
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
    const [animationClass, setAnimationClass] = useState('fade-slide-up');
    const prevTabRef = React.useRef(activeTab);

    const TAB_ORDER = ['home', 'logs', 'stats', 'profile'];
    const [companyName, setCompanyName] = useState('');
    const [companyLocation, setCompanyLocation] = useState('');
    const [totalRequiredHours, setTotalRequiredHours] = useState(0);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
    const [isTimedIn, setIsTimedIn] = useState(false);
    const [currentSession, setCurrentSession] = useState<'AM' | 'PM' | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [cardOrder, setCardOrder] = useState(['company-input', 'hours-progress', 'daily-notes']);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [activationEffect, setActivationEffect] = useState<'in' | 'out' | null>(null);

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
        const newTab = getTabFromPath(location.pathname);
        if (newTab !== activeTab) {
            const prevIndex = TAB_ORDER.indexOf(prevTabRef.current);
            const newIndex = TAB_ORDER.indexOf(newTab);

            // Determine Animation
            let newAnimation = 'fade-slide-up'; // Default

            if (newTab === 'home') {
                // Return to home: Slide Left if coming from right, or Fade Up if direct
                if (prevIndex > newIndex) newAnimation = 'animate-slide-in-left';
                else newAnimation = 'fade-slide-up';
            } else {
                // Subpages
                if (prevIndex !== -1 && newIndex !== -1) {
                    newAnimation = newIndex > prevIndex ? 'animate-slide-in-right' : 'animate-slide-in-left';
                } else {
                    newAnimation = 'animate-slide-in-right';
                }
            }

            setAnimationClass(newAnimation);
            setActiveTab(newTab);
            prevTabRef.current = newTab;
        }
    }, [location.pathname]);

    // Load notifications from localStorage
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

    // Persist notifications
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
            const metaAvatar = (user.user_metadata as { avatar_url?: string } | null)?.avatar_url;
            if (metaAvatar) setUserAvatar(metaAvatar);

            // Fetch profile for avatar and full name
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, full_name')
                .eq('id', user.id)
                .single();

            if (profile?.avatar_url) {
                setUserAvatar(profile.avatar_url);
            } else {
                const metaAvatar = (user.user_metadata as { avatar_url?: string } | null)?.avatar_url;
                if (metaAvatar) setUserAvatar(metaAvatar);
            }

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
                    if (!savedOrder.includes('daily-notes')) {
                        savedOrder.push('daily-notes');
                    }
                    setCardOrder(savedOrder);
                }
            } else {
                setCompanyName('My Company');
                setCompanyLocation('');
                setTotalRequiredHours(500);
            }

            // Fetch Time Entries
            const { data: entries } = await supabase
                .from('ojt_time_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (entries) {
                const formattedEntries: TimeEntry[] = entries.map(e => ({
                    id: e.id,
                    date: e.date,
                    amIn: e.am_in ? e.am_in.substring(0, 5) : null,
                    amOut: e.am_out ? e.am_out.substring(0, 5) : null,
                    pmIn: e.pm_in ? e.pm_in.substring(0, 5) : null,
                    pmOut: e.pm_out ? e.pm_out.substring(0, 5) : null,
                    hours: parseFloat(e.hours) || 0
                }));
                setTimeEntries(formattedEntries);

                // Check for current active status
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                const todayEntry = formattedEntries.find(e => e.date === today);

                if (todayEntry) {
                    if (todayEntry.amIn && !todayEntry.amOut) {
                        setIsTimedIn(true);
                        setCurrentSession('AM');
                        setActiveEntryId(todayEntry.id);
                    } else if (todayEntry.pmIn && !todayEntry.pmOut) {
                        setIsTimedIn(true);
                        setCurrentSession('PM');
                        setActiveEntryId(todayEntry.id);
                    } else {
                        setIsTimedIn(false);
                        setCurrentSession(null);
                        setActiveEntryId(null);
                    }
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
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

    const calculateTotalHours = (amIn: string | null, amOut: string | null, pmIn: string | null, pmOut: string | null) => {
        let total = 0;

        if (amIn && amOut) {
            const t1 = new Date(`2000-01-01T${amIn}`);
            const t2 = new Date(`2000-01-01T${amOut}`);
            total += Math.max(0, (t2.getTime() - t1.getTime()) / (1000 * 60 * 60));
        }

        if (pmIn && pmOut) {
            const t1 = new Date(`2000-01-01T${pmIn}`);
            const t2 = new Date(`2000-01-01T${pmOut}`);
            total += Math.max(0, (t2.getTime() - t1.getTime()) / (1000 * 60 * 60));
        }

        return Math.round(total * 10) / 10;
    };

    // Time In/Out Handler with AM/PM Logic
    const handleTimeToggle = async () => {
        if (!userId) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Find today's entry locally
        let todayEntry = timeEntries.find(e => e.date === currentDate);

        // If not timed in, we are attempting to Time In
        if (!isTimedIn) {
            // Check if we can time in for AM or PM
            // Heuristic: If it's before 12:30, prefer AM. Else PM.
            const isAmTime = now.getHours() < 12 || (now.getHours() === 12 && now.getMinutes() < 30);

            if (todayEntry) {
                // Determine slot to use
                let targetSlot: 'AM' | 'PM' | null = null;

                if (isAmTime) {
                    if (!todayEntry.amIn) targetSlot = 'AM';
                } else {
                    if (!todayEntry.pmIn) targetSlot = 'PM';
                }

                if (!targetSlot) {
                    pushNotification('time-out', 'No available session slot for the current time.');
                    return;
                }

                const updates: any = {};
                if (targetSlot === 'AM') updates.am_in = currentTime;
                else updates.pm_in = currentTime;

                const { error } = await supabase
                    .from('ojt_time_entries')
                    .update(updates)
                    .eq('id', todayEntry.id);

                if (!error) {
                    // Update Local State
                    setTimeEntries(prev => prev.map(e => {
                        if (e.id === todayEntry!.id) {
                            return {
                                ...e,
                                amIn: targetSlot === 'AM' ? currentTime : e.amIn,
                                pmIn: targetSlot === 'PM' ? currentTime : e.pmIn
                            };
                        }
                        return e;
                    }));
                    setIsTimedIn(true);
                    setCurrentSession(targetSlot);
                    setActiveEntryId(todayEntry.id);
                    handleTabChange('logs');
                    pushNotification('time-in', `You timed in for the ${targetSlot} session.`);

                    // Trigger cool green effect
                    setActivationEffect('in');
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.8 },
                        colors: ['#ACC8A2', '#1a2517', '#ffffff']
                    });
                    setTimeout(() => setActivationEffect(null), 1500);
                }
            } else {
                // Create New Entry
                const targetSlot = isAmTime ? 'AM' : 'PM';
                const newEntryData = {
                    user_id: userId,
                    date: currentDate,
                    am_in: targetSlot === 'AM' ? currentTime : null,
                    pm_in: targetSlot === 'PM' ? currentTime : null,
                    hours: 0
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
                        amIn: data.am_in ? data.am_in.substring(0, 5) : null,
                        amOut: null,
                        pmIn: data.pm_in ? data.pm_in.substring(0, 5) : null,
                        pmOut: null,
                        hours: 0
                    };
                    setTimeEntries(prev => [formatted, ...prev]);
                    setIsTimedIn(true);
                    setCurrentSession(targetSlot);
                    setActiveEntryId(data.id);
                    handleTabChange('logs');
                    pushNotification('time-in', `You timed in for the ${targetSlot} session.`);

                    // Trigger cool green effect
                    setActivationEffect('in');
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.8 },
                        colors: ['#ACC8A2', '#1a2517', '#ffffff']
                    });
                    setTimeout(() => setActivationEffect(null), 1500);
                }
            }
        } else {
            // TIME OUT
            if (!activeEntryId || !currentSession) return;

            todayEntry = timeEntries.find(e => e.id === activeEntryId);
            if (!todayEntry) return;

            const updates: any = {};
            let newHours = todayEntry.hours;

            // Update the correct OUT slot
            if (currentSession === 'AM') {
                updates.am_out = currentTime;
                newHours = calculateTotalHours(todayEntry.amIn, currentTime, todayEntry.pmIn, todayEntry.pmOut);
            } else {
                updates.pm_out = currentTime;
                newHours = calculateTotalHours(todayEntry.amIn, todayEntry.amOut, todayEntry.pmIn, currentTime);
            }
            updates.hours = newHours;

            await supabase
                .from('ojt_time_entries')
                .update(updates)
                .eq('id', activeEntryId);

            setTimeEntries(prev => prev.map(e =>
                e.id === activeEntryId ? {
                    ...e,
                    amOut: currentSession === 'AM' ? currentTime : e.amOut,
                    pmOut: currentSession === 'PM' ? currentTime : e.pmOut,
                    hours: newHours
                } : e
            ));

            setIsTimedIn(false);
            setCurrentSession(null);
            handleTabChange('logs');
            pushNotification('time-out', `You timed out. Total hours today: ${newHours}`);

            // Trigger cool red effect
            setActivationEffect('out');
            setTimeout(() => setActivationEffect(null), 1500);
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
    const handleUpdateEntry = async (id: string, field: 'date' | 'amIn' | 'amOut' | 'pmIn' | 'pmOut', value: string | null) => {
        const entryToUpdate = timeEntries.find(e => e.id === id);
        if (!entryToUpdate) return;

        const updatedEntry = { ...entryToUpdate, [field]: value };
        if (field !== 'date') {
            updatedEntry.hours = calculateTotalHours(updatedEntry.amIn, updatedEntry.amOut, updatedEntry.pmIn, updatedEntry.pmOut);
        }

        const newEntries = timeEntries.map(e => (e.id === id ? updatedEntry : e));
        setTimeEntries(newEntries);

        // Recalculate Active Status if we modified Today's entry
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Check if the modified entry matches today's date (either original or new date)
        if (entryToUpdate.date === today || (field === 'date' && value === today)) {
            const todayEntry = field === 'date' && value === today ? updatedEntry : (entryToUpdate.date === today ? updatedEntry : newEntries.find(e => e.date === today));

            if (todayEntry) {
                if (todayEntry.amIn && !todayEntry.amOut) {
                    setIsTimedIn(true);
                    setCurrentSession('AM');
                    setActiveEntryId(todayEntry.id);
                } else if (todayEntry.pmIn && !todayEntry.pmOut) {
                    setIsTimedIn(true);
                    setCurrentSession('PM');
                    setActiveEntryId(todayEntry.id);
                } else {
                    setIsTimedIn(false);
                    setCurrentSession(null);
                    setActiveEntryId(null);
                }
            } else {
                setIsTimedIn(false);
                setCurrentSession(null);
                setActiveEntryId(null);
            }
        }

        // Update Supabase
        let dbField;
        if (field === 'date') dbField = 'date';
        else if (field === 'amIn') dbField = 'am_in';
        else if (field === 'amOut') dbField = 'am_out';
        else if (field === 'pmIn') dbField = 'pm_in';
        else dbField = 'pm_out';

        await supabase
            .from('ojt_time_entries')
            .update({
                [dbField]: value === "" ? null : value,
                ...(field !== 'date' ? { hours: updatedEntry.hours } : {})
            })
            .eq('id', id);
    };

    const handleDeleteEntry = async (id: string) => {
        setTimeEntries(prev => prev.filter(entry => entry.id !== id));
        await supabase.from('ojt_time_entries').delete().eq('id', id);
    };

    const handleAddEntry = async (initialValues?: { timeIn?: string; timeOut?: string; date?: string }) => {
        if (!userId) return;

        const now = new Date();
        const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentDate = initialValues?.date || defaultDate;

        // Default to a vacant day. UI will provide "Add Session" buttons for manual entry.
        const newEntryData = {
            user_id: userId,
            date: currentDate,
            am_in: null,
            am_out: null,
            pm_in: null,
            pm_out: null,
            hours: 0
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
                // Use empty strings locally so inputs show up immediately for manual editing
                amIn: '',
                amOut: '',  
                pmIn: '',
                pmOut: '',
                hours: parseFloat(data.hours)
            };
            setTimeEntries(prev => [formatted, ...prev]);
            pushNotification('entry-added', `New entry prepared for ${formatted.date}.`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-gray-50 to-[#F8F9FA] pb-24">
                <div className="relative px-4 pt-6 pb-8 sm:pb-10 rounded-b-[2rem] shadow-xl selection:bg-white/30 overflow-hidden">
                    <div className="absolute inset-0 rounded-b-[2rem] overflow-hidden z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${intern2})`,
                                filter: 'blur(2px) brightness(0.8)',
                                transform: 'scale(1.1)',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2517]/70 to-[#4A5D44]/70" />
                    </div>

                    <div className="max-w-md mx-auto relative z-30">
                        <div className="flex items-center justify-between mb-6 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/40" />
                                <div className="space-y-2">
                                    <div className="h-4 w-28 sm:w-32 bg-white/40 rounded-full" />
                                    <div className="h-3 w-40 sm:w-48 bg-white/25 rounded-full" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="h-3 w-24 bg-white/40 rounded-full" />
                                    <div className="h-2.5 w-20 bg-white/25 rounded-full" />
                                </div>
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/30" />
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20 overflow-hidden mt-2 animate-pulse">
                            <div className="grid grid-cols-3 divide-x divide-white/10">
                                <div className="px-2 space-y-3 flex flex-col items-center">
                                    <div className="h-6 w-10 bg-white/70 rounded-md" />
                                    <div className="h-3 w-16 bg-white/30 rounded-full" />
                                </div>
                                <div className="px-2 space-y-3 flex flex-col items-center">
                                    <div className="h-6 w-10 bg-white/60 rounded-md" />
                                    <div className="h-3 w-16 bg-white/25 rounded-full" />
                                </div>
                                <div className="px-2 space-y-3 flex flex-col items-center">
                                    <div className="h-6 w-10 bg-white/70 rounded-md" />
                                    <div className="h-3 w-16 bg-white/30 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-md mx-auto px-4 -mt-4 pb-12 overflow-hidden relative z-20">
                    <div className="space-y-4">
                        <div className="h-32 sm:h-36 rounded-2xl bg-white shadow-sm border border-gray-100 animate-pulse" />
                        <div className="h-32 sm:h-36 rounded-2xl bg-white shadow-sm border border-gray-100 animate-pulse" />
                        <div className="h-32 sm:h-36 rounded-2xl bg-white shadow-sm border border-gray-100 animate-pulse" />
                    </div>
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
            <div className="relative px-4 pt-6 pb-8 sm:pb-10 rounded-b-[2rem] shadow-xl selection:bg-white/30">
                {/* Background Mask Wrapper */}
                <div className="absolute inset-0 rounded-b-[2rem] overflow-hidden z-0">
                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${intern2})`,
                            filter: 'blur(2px) brightness(0.8)',
                            transform: 'scale(1.1)', // To avoid blurred edges
                        }}
                    />
                    {/* Dark Green Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a2517]/70 to-[#4A5D44]/70" />
                </div>

                <div className="max-w-md mx-auto relative z-30">
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
                            <div className="relative z-[100]">
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
                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute top-full right-0 mt-3 w-72 sm:w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/40 z-[9999] overflow-hidden origin-top-right"
                                        >
                                            <Notification
                                                notifications={notifications}
                                                onClear={handleClearNotifications}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Card - Glassmorphism Effect */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20 overflow-hidden mt-2">
                        <div className="grid grid-cols-3 divide-x divide-white/10">
                            <div className="text-center px-1">
                                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none tracking-tight">
                                    {Math.round(totalHoursCompleted)}
                                </p>
                                <p className="text-[8px] sm:text-[9px] font-black text-white/50 uppercase tracking-[0.15em] mt-2 flex flex-col items-center">
                                    <span className="leading-none">Hours</span>
                                    <span className="leading-none mt-0.5">Logged</span>
                                </p>
                            </div>
                            <div className="text-center px-1">
                                <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none tracking-tight" style={{ color: '#FFB88C' }}>
                                    {Math.round(hoursLeft)}
                                </p>
                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] mt-2 flex flex-col items-center" style={{ color: 'rgba(255, 184, 140, 0.6)' }}>
                                    <span className="leading-none">Hours</span>
                                    <span className="leading-none mt-0.5">Left</span>
                                </p>
                            </div>
                            <div className="text-center px-1">
                                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none tracking-tight">
                                    {Math.round(totalRequiredHours)}
                                </p>
                                <p className="text-[8px] sm:text-[9px] font-black text-white/50 uppercase tracking-[0.15em] mt-2 flex flex-col items-center">
                                    <span className="leading-none">Hours</span>
                                    <span className="leading-none mt-0.5">Target</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-md mx-auto px-4 -mt-4 pb-12 overflow-hidden relative z-20">
                <div
                    key={activeTab}
                    className={animationClass}
                >
                    {renderContent()}
                </div>
            </div>

            {/* activation effects */}
            <AnimatePresence>
                {activationEffect && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center`}
                        style={{
                            background: activationEffect === 'in'
                                ? 'radial-gradient(circle, rgba(172, 200, 162, 0.4) 0%, rgba(172, 200, 162, 0) 70%)'
                                : 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0) 70%)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.1, opacity: 0, y: -20 }}
                            className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl border-4 flex flex-col items-center gap-2"
                            style={{ borderColor: activationEffect === 'in' ? '#ACC8A2' : '#EF4444' }}
                        >
                            <div className="text-4xl">
                                {activationEffect === 'in' ? '🎯' : '🛑'}
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-widest text-primary">
                                {activationEffect === 'in' ? 'Timed In!' : 'Timed Out!'}
                            </h3>
                            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <NavBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isTimedIn={isTimedIn}
                onTimeToggle={handleTimeToggle}
                avatarUrl={userAvatar}
            />
        </div>
    );
};

export default Dashboard;
