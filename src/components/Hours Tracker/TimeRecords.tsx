import React from 'react';
import { History, Plus, Trash2, FolderOpen, Sun, Sunset, CalendarDays } from 'lucide-react';

interface TimeEntry {
    id: string;
    date: string;
    amIn: string | null;
    amOut: string | null;
    pmIn: string | null;
    pmOut: string | null;
    hours: number;
}

interface TimeRecordsProps {
    entries: TimeEntry[];
    onUpdateEntry: (id: string, field: 'date' | 'amIn' | 'amOut' | 'pmIn' | 'pmOut', value: string | null) => void;
    onDeleteEntry: (id: string) => void;
    onAddEntry: () => void;
}

const TimeRecords: React.FC<TimeRecordsProps> = ({
    entries,
    onUpdateEntry,
    onDeleteEntry,
    onAddEntry,
}) => {
    const handleAddSession = (entryId: string, type: 'am' | 'pm', entryDate: string) => {
        // Check if entry is for today
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = entryDate === todayStr;

        if (isToday) {
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            const isAmTime = currentHour < 12 || (currentHour === 12 && currentMin < 30);
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

            if (type === 'am') {
                if (isAmTime) {
                    onUpdateEntry(entryId, 'amIn', currentTime);
                    onUpdateEntry(entryId, 'amOut', '');
                } else {
                    // Retroactive AM add
                    onUpdateEntry(entryId, 'amIn', '08:00');
                    onUpdateEntry(entryId, 'amOut', '12:00');
                }
            } else {
                if (!isAmTime) {
                    onUpdateEntry(entryId, 'pmIn', currentTime);
                    onUpdateEntry(entryId, 'pmOut', '');
                } else {
                    // Future PM add
                    onUpdateEntry(entryId, 'pmIn', '13:00');
                    onUpdateEntry(entryId, 'pmOut', '17:00');
                }
            }
        } else {
            // Default static values for past dates
            if (type === 'am') {
                onUpdateEntry(entryId, 'amIn', '08:00');
                onUpdateEntry(entryId, 'amOut', '12:00');
            } else {
                onUpdateEntry(entryId, 'pmIn', '13:00');
                onUpdateEntry(entryId, 'pmOut', '17:00');
            }
        }
    };

    const handleRemoveSession = (entryId: string, type: 'am' | 'pm') => {
        if (type === 'am') {
            onUpdateEntry(entryId, 'amIn', null);
            onUpdateEntry(entryId, 'amOut', null);
        } else {
            onUpdateEntry(entryId, 'pmIn', null);
            onUpdateEntry(entryId, 'pmOut', null);
        }
    };

    return (
        <div className="card fade-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a2517]/10 to-[#ACC8A2]/10 flex items-center justify-center text-[#1a2517] shadow-sm">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#1a2517] leading-none">
                            Activity Logs
                        </h2>
                        <p className="text-xs text-[#1a2517]/60 font-medium mt-1">
                            Track your morning and afternoon sessions
                        </p>
                    </div>
                </div>

                <button
                    onClick={onAddEntry}
                    className="btn w-full sm:w-auto justify-center !py-2.5 !px-5"
                >
                    <Plus className="w-4 h-4" />
                    <span className="uppercase tracking-widest text-xs font-bold">New Date</span>
                </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                {entries.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-[#F8F9FA] rounded-2xl border-2 border-dashed border-[#E9ECEF]">
                        <div className="mb-4 opacity-20 text-[#1a2517] flex justify-center">
                            <FolderOpen className="w-12 h-12" strokeWidth={1.5} />
                        </div>
                        <p className="text-[#1a2517] text-base font-bold">No logs detected</p>
                        <p className="text-[#64748B] text-sm mt-1.5">Initialize your tracker by adding your first entry.</p>
                    </div>
                ) : (
                    entries.map((entry) => {
                        const hasAm = entry.amIn !== null;
                        const hasPm = entry.pmIn !== null;

                        // Calculate per-session hours purely for display if needed
                        const getSessionHours = (inTime: string | null, outTime: string | null) => {
                            if (!inTime || !outTime) return 0;
                            const t1 = new Date(`2000-01-01T${inTime}`);
                            const t2 = new Date(`2000-01-01T${outTime}`);
                            return Math.max(0, Math.round(((t2.getTime() - t1.getTime()) / (1000 * 60 * 60)) * 10) / 10);
                        };

                        const amHours = getSessionHours(entry.amIn, entry.amOut);
                        const pmHours = getSessionHours(entry.pmIn, entry.pmOut);

                        return (
                            <div
                                key={entry.id}
                                className="bg-white rounded-2xl p-4 shadow-sm border border-[#E9ECEF] hover:border-[#ACC8A2] transition-colors relative group"
                            >
                                <button
                                    onClick={() => onDeleteEntry(entry.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                    title="Delete entire date"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Date Header */}
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 pr-8">
                                    <div className="flex items-center gap-2.5">
                                        <CalendarDays className="w-4 h-4 text-[#ACC8A2]" />
                                        <input
                                            type="date"
                                            value={entry.date}
                                            onChange={(e) => onUpdateEntry(entry.id, 'date', e.target.value)}
                                            className="text-sm sm:text-base font-bold text-[#1a2517] bg-transparent border-none focus:ring-0 p-0 hover:bg-gray-50 rounded cursor-pointer"
                                        />
                                    </div>
                                    <div className="px-3 py-1 bg-[#1a2517]/5 rounded-full">
                                        <span className="text-xs font-bold text-[#1a2517]">
                                            Total: {entry.hours}h
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Morning Section */}
                                    <div className={`rounded-xl p-3 ${hasAm ? 'bg-[#F8F9FA]' : 'bg-gray-50 border border-dashed border-gray-200'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sun className="w-4 h-4 text-amber-500" />
                                                <span className="text-xs font-bold text-[#1a2517] uppercase tracking-wider">Morning</span>
                                            </div>
                                            {hasAm && (
                                                <div className="px-2 py-0.5 bg-white rounded text-[10px] font-bold shadow-sm text-[#1a2517]">
                                                    {amHours}h
                                                </div>
                                            )}
                                        </div>

                                        {hasAm ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time In</label>
                                                        <input
                                                            type="time"
                                                            value={entry.amIn || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'amIn', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time Out</label>
                                                        <input
                                                            type="time"
                                                            value={entry.amOut || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'amOut', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveSession(entry.id, 'am')}
                                                    className="w-full py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Clear Session
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddSession(entry.id, 'am', entry.date)}
                                                className="w-full h-[100px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#1a2517] hover:bg-white transition-all rounded-lg"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Add Morning</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Afternoon Section */}
                                    <div className={`rounded-xl p-3 ${hasPm ? 'bg-[#F8F9FA]' : 'bg-gray-50 border border-dashed border-gray-200'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sunset className="w-4 h-4 text-orange-500" />
                                                <span className="text-xs font-bold text-[#1a2517] uppercase tracking-wider">Afternoon</span>
                                            </div>
                                            {hasPm && (
                                                <div className="px-2 py-0.5 bg-white rounded text-[10px] font-bold shadow-sm text-[#1a2517]">
                                                    {pmHours}h
                                                </div>
                                            )}
                                        </div>

                                        {hasPm ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time In</label>
                                                        <input
                                                            type="time"
                                                            value={entry.pmIn || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'pmIn', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time Out</label>
                                                        <input
                                                            type="time"
                                                            value={entry.pmOut || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'pmOut', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveSession(entry.id, 'pm')}
                                                    className="w-full py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Clear Session
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddSession(entry.id, 'pm', entry.date)}
                                                className="w-full h-[100px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#1a2517] hover:bg-white transition-all rounded-lg"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Add Afternoon</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TimeRecords;
