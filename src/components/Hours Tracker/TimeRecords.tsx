import React from 'react';
import { History, Plus, Trash2, FolderOpen } from 'lucide-react';

interface TimeEntry {
    id: string;
    date: string;
    timeIn: string;
    timeOut: string;
    hours: number;
}

interface TimeRecordsProps {
    entries: TimeEntry[];
    onUpdateEntry: (id: string, field: 'timeIn' | 'timeOut', value: string) => void;
    onDeleteEntry: (id: string) => void;
    onAddEntry: () => void;
}

const TimeRecords: React.FC<TimeRecordsProps> = ({
    entries,
    onUpdateEntry,
    onDeleteEntry,
    onAddEntry,
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="card fade-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1a2517]/10 to-[#ACC8A2]/10 flex items-center justify-center text-[#1a2517] shadow-sm">
                        <History className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1a2517]">
                        Activity Logs
                    </h2>
                </div>

                <button
                    onClick={onAddEntry}
                    className="btn w-full sm:w-auto justify-center !py-2 !px-4"
                >
                    <Plus className="w-4 h-4" />
                    <span className="uppercase tracking-widest text-xs font-bold">Add Entry</span>
                </button>
            </div>

            <div className="space-y-2.5 sm:space-y-3 max-h-[500px] sm:max-h-[700px] overflow-y-auto no-scrollbar pr-0 sm:pr-1">
                {entries.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 px-4 bg-[#F8F9FA] rounded-2xl border-2 border-dashed border-[#E9ECEF]">
                        <div className="mb-3 sm:mb-4 opacity-20 text-[#1a2517] flex justify-center">
                            <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.5} />
                        </div>
                        <p className="text-[#1a2517] text-sm sm:text-base font-bold">No logs detected</p>
                        <p className="text-[#64748B] text-xs sm:text-sm mt-1.5">Initialize your tracker by adding your first entry.</p>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <div
                            key={entry.id}
                            className="record-card border-[#E9ECEF] hover:border-[#ACC8A2] bg-[#FFFFFF] shadow-sm fade-slide-up !p-3 sm:!p-4"
                            style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                        >
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-4">
                                <div className="flex-1 w-full sm:w-auto min-w-0">
                                    <div className="text-[9px] font-black text-[#1a2517]/70 uppercase tracking-[0.2em] mb-1">Session Date</div>
                                    <div className="text-base sm:text-lg font-bold text-[#1a2517]">
                                        {formatDate(entry.date)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-start w-full sm:w-auto justify-between sm:justify-start">
                                    <div className="hours-badge flex-1 sm:flex-none text-center !py-1.5 !px-3 text-sm">
                                        {entry.hours}h
                                    </div>
                                    <button
                                        onClick={() => onDeleteEntry(entry.id)}
                                        className="btn-delete w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0"
                                        title="Remove entry"
                                        aria-label="Delete entry"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-[#F8F9FA] p-3 sm:p-3.5 rounded-xl">
                                <div>
                                    <label className="block text-[9px] font-black text-[#1a2517]/70 mb-1.5 sm:mb-2 uppercase tracking-[0.2em]">
                                        Punch In
                                    </label>
                                    <input
                                        type="time"
                                        value={entry.timeIn}
                                        onChange={(e) => onUpdateEntry(entry.id, 'timeIn', e.target.value)}
                                        className="input-field !py-2 sm:!py-2.5 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-[#1a2517]/70 mb-1.5 sm:mb-2 uppercase tracking-[0.2em]">
                                        Punch Out
                                    </label>
                                    <input
                                        type="time"
                                        value={entry.timeOut}
                                        onChange={(e) => onUpdateEntry(entry.id, 'timeOut', e.target.value)}
                                        className="input-field !py-2 sm:!py-2.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TimeRecords;
