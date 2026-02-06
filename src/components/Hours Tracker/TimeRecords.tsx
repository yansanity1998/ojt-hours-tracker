import React, { useState, useRef } from 'react';
import { History, Plus, Trash2, FolderOpen, Sun, Sunset, CalendarDays, FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

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
    const [isExporting, setIsExporting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        setIsExporting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`OJT_DTR_${new Date().toLocaleDateString('en-CA')}.pdf`);
        } catch (error) {
            console.error('PDF Export Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export failed',
                text: 'Could not generate DTR PDF.',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setIsExporting(false);
        }
    };
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
        <div className="card glass-card">
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

                <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting || entries.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-white text-primary text-[10px] sm:text-xs font-bold rounded-xl border border-primary/10 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        <span className="uppercase tracking-wider sm:tracking-widest leading-none">Export PDF</span>
                    </button>
                    <button
                        onClick={onAddEntry}
                        className="flex-1 sm:flex-none btn justify-center !py-2.5 !px-4 sm:!px-5 !text-[10px] sm:!text-xs"
                    >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="uppercase tracking-wider sm:tracking-widest font-bold">New Date</span>
                    </button>
                </div>
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

                        let cardColorClasses = '';
                        if (hasAm && hasPm) {
                            cardColorClasses = 'bg-[#F3F7EF] border-[#C5D8BB]'; // soft green tint for full day
                        } else if (hasAm) {
                            cardColorClasses = 'bg-amber-50/60 border-amber-100'; // light warm tint for morning
                        } else if (hasPm) {
                            cardColorClasses = 'bg-orange-50/60 border-orange-100'; // light orange tint for afternoon
                        } else {
                            cardColorClasses = 'bg-white/40 border-white/20'; // default subtle card
                        }

                        return (
                            <div
                                key={entry.id}
                                className={`backdrop-blur-sm rounded-2xl p-4 shadow-sm border hover:border-[#ACC8A2] transition-colors relative group ${cardColorClasses}`}
                            >
                                <button
                                    onClick={() => onDeleteEntry(entry.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                    title="Delete entire date"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Date Header */}
                                <div className="flex flex-wrap items-center justify-between mb-4 pb-3 border-b border-gray-100 pr-8 gap-y-2">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-[#ACC8A2] shrink-0" />
                                        <input
                                            type="date"
                                            value={entry.date}
                                            onChange={(e) => onUpdateEntry(entry.id, 'date', e.target.value)}
                                            className="text-sm sm:text-base font-bold text-[#1a2517] bg-transparent border-none focus:ring-0 p-0 hover:bg-gray-50 rounded cursor-pointer min-w-[120px]"
                                        />
                                    </div>
                                    <div className="px-2.5 py-1 bg-[#1a2517]/5 rounded-lg sm:rounded-full">
                                        <span className="text-[10px] sm:text-xs font-bold text-[#1a2517] whitespace-nowrap">
                                            Total: {entry.hours} h
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
                                                    {amHours} h
                                                </div>
                                            )}
                                        </div>

                                        {hasAm ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                    <div>
                                                        <label className="block text-[8px] sm:text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time In</label>
                                                        <input
                                                            type="time"
                                                            value={entry.amIn || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'amIn', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-1.5 sm:px-2 py-1.5 text-[10px] sm:text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] sm:text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time Out</label>
                                                        <input
                                                            type="time"
                                                            value={entry.amOut || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'amOut', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-1.5 sm:px-2 py-1.5 text-[10px] sm:text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
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
                                                    {pmHours} h
                                                </div>
                                            )}
                                        </div>

                                        {hasPm ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                    <div>
                                                        <label className="block text-[8px] sm:text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time In</label>
                                                        <input
                                                            type="time"
                                                            value={entry.pmIn || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'pmIn', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-1.5 sm:px-2 py-1.5 text-[10px] sm:text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] sm:text-[9px] font-black text-[#1a2517]/50 mb-1 uppercase tracking-wider">Time Out</label>
                                                        <input
                                                            type="time"
                                                            value={entry.pmOut || ''}
                                                            onChange={(e) => onUpdateEntry(entry.id, 'pmOut', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-1.5 sm:px-2 py-1.5 text-[10px] sm:text-xs font-medium focus:ring-1 focus:ring-[#1a2517] outline-none"
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
            {/* Hidden DTR Export Layout */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div
                    ref={printRef}
                    className="font-serif"
                    style={{
                        width: '210mm',
                        padding: '20mm',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        minHeight: '297mm',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Professional Header */}
                    <div style={{ textAlign: 'center', marginBottom: '35px', borderBottom: '2.5px solid #000000', paddingBottom: '20px' }}>
                        <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Time Record (DTR)</h1>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '11pt', color: '#444444', fontStyle: 'italic' }}>
                            <span>On-the-Job Training Program</span>
                            <span>•</span>
                            <span>Generated: {new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' })}</span>
                        </div>
                    </div>

                    {/* Intern Details Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', marginBottom: '35px', fontSize: '11pt' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #bbbbbb', paddingBottom: '5px', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Intern Name:</span>
                                <span style={{ flex: 1, color: '#000000' }}>_______________________________</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #bbbbbb', paddingBottom: '5px', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>ID Number:</span>
                                <span style={{ flex: 1, color: '#000000' }}>_______________________________</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #bbbbbb', paddingBottom: '5px', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Company:</span>
                                <span style={{ flex: 1, color: '#000000' }}>_______________________________</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #bbbbbb', paddingBottom: '5px', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Month/Year:</span>
                                <span style={{ flex: 1, color: '#000000' }}>{new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* DTR Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000000', fontSize: '10pt', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                <th rowSpan={2} style={{ border: '1px solid #000000', padding: '12px 5px', width: '60px', verticalAlign: 'middle' }}>Date</th>
                                <th colSpan={2} style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center' }}>Morning (AM) Session</th>
                                <th colSpan={2} style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center' }}>Afternoon (PM) Session</th>
                                <th rowSpan={2} style={{ border: '1px solid #000000', padding: '12px 5px', width: '70px', verticalAlign: 'middle' }}>Daily Total</th>
                            </tr>
                            <tr style={{ backgroundColor: '#fafafa' }}>
                                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center' }}>Arrival</th>
                                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center' }}>Departure</th>
                                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center' }}>Arrival</th>
                                <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center' }}>Departure</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry) => (
                                <tr key={entry.id}>
                                    <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{new Date(entry.date).getDate()}</div>
                                        <div style={{ fontSize: '7.5pt', color: '#666666', textTransform: 'uppercase', fontWeight: 'bold' }}>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    </td>
                                    <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center' }}>{entry.amIn || '-- : --'}</td>
                                    <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center' }}>{entry.amOut || '-- : --'}</td>
                                    <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center' }}>{entry.pmIn || '-- : --'}</td>
                                    <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center' }}>{entry.pmOut || '-- : --'}</td>
                                    <td style={{ border: '1px solid #000000', padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fcfcfc' }}>{entry.hours} h</td>
                                </tr>
                            ))}
                            {/* Grand Total Row */}
                            <tr style={{ backgroundColor: '#eeeeee' }}>
                                <td colSpan={5} style={{ border: '1px solid #000000', padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt' }}>Grand Total Hours:</td>
                                <td style={{ border: '1px solid #000000', padding: '15px 10px', textAlign: 'center', fontWeight: '900', fontSize: '13pt' }}>
                                    {entries.reduce((sum, e) => sum + e.hours, 0)} h
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Certification Statement */}
                    <div style={{ marginTop: '40px', fontSize: '10.5pt', textAlign: 'justify', lineHeight: '1.6', color: '#333333' }}>
                        <p>I hereby certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from the office/place of work.</p>
                    </div>

                    {/* Footer / Signatures */}
                    <div style={{ marginTop: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11pt' }}>
                        <div style={{ textAlign: 'center', width: '280px' }}>
                            <div style={{ borderBottom: '1.5px solid #000000', marginBottom: '8px', minHeight: '20px' }}></div>
                            <p style={{ fontWeight: 'bold', margin: '0' }}>Signature of Trainee</p>
                            <p style={{ fontSize: '9pt', color: '#666666', margin: 0 }}>Date Signed</p>
                        </div>
                        <div style={{ textAlign: 'center', width: '310px' }}>
                            <div style={{ borderBottom: '1.5px solid #000000', marginBottom: '8px', minHeight: '20px' }}></div>
                            <p style={{ fontWeight: 'bold', margin: '0' }}>Supervisor Name & Signature</p>
                            <p style={{ fontSize: '9pt', color: '#666666', margin: 0 }}>Host Training Establishment (HTE)</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '80px', textAlign: 'center' }}>
                        <p style={{ fontSize: '9pt', color: '#999999', fontStyle: 'italic', margin: 0, borderTop: '1px solid #eeeeee', paddingTop: '15px' }}>This is an official document generated via OJT Hours Tracker</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeRecords;
