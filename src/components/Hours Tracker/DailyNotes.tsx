import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Plus, Edit2, Trash2, Save, X, Calendar, Image as ImageIcon, Loader2, Camera, FileDown } from 'lucide-react';
import Swal from 'sweetalert2';
import type { NotificationType } from './Notification';
import Webcam from 'react-webcam';
import { supabase } from '../../supabase/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Note {
    id: string;
    date: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
}

interface DailyNotesProps {
    userId: string | null;
    onNotify?: (type: NotificationType, message: string) => void;
}

const DailyNotes: React.FC<DailyNotesProps> = ({ userId, onNotify }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editNoteContent, setEditNoteContent] = useState('');
    const [uploading, setUploading] = useState(false);
    const [viewingAll, setViewingAll] = useState(false);
    const [newImage, setNewImage] = useState<File | null>(null);
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

    // Camera states
    const [showCamera, setShowCamera] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const webcamRef = useRef<Webcam>(null);

    // PDF Download state
    const [isExporting, setIsExporting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;

        setIsExporting(true);
        try {
            // Wait a bit for any images to be fully rendered
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true, // Allow cross-origin images (Supabase)
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`OJT_Daily_Report_${new Date().toLocaleDateString('en-CA')}.pdf`);

            onNotify?.('note-updated', 'PDF downloaded successfully.');
        } catch (error) {
            console.error('PDF Export Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export failed',
                text: 'Could not generate PDF. Please try again.',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setIsExporting(false);
        }
    };

    // Fetch notes on component mount
    useEffect(() => {
        if (userId) {
            fetchNotes();
        }
    }, [userId]);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;

        if (viewingAll) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = originalOverflow;
        }

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [viewingAll]);

    const fetchNotes = async () => {
        if (!userId) return;

        const { data, error } = await supabase
            .from('ojt_daily_notes')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (data && !error) {
            setNotes(data.map(note => ({
                id: note.id,
                date: note.date,
                content: note.content,
                imageUrl: note.image_url,
                createdAt: note.created_at
            })));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setShowCamera(false);
        }
    };

    // Helper to convert dataURL to File
    const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        return new File([buf], filename, { type: mimeType });
    };

    const toggleCamera = () => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    const capturePhoto = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setNewImagePreview(imageSrc);
            const file = await urlToFile(imageSrc, 'camera-capture.jpg', 'image/jpeg');
            setNewImage(file);
            setShowCamera(false);
        }
    }, [webcamRef]);

    const uploadImage = async (file: File): Promise<string | null> => {
        if (!userId) return null;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('daily_proofs')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return null;
            }

            const { data } = supabase.storage
                .from('daily_proofs')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const getCurrentDateString = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const handleAddNote = async () => {
        if (!userId || !newNoteContent.trim()) return;

        const currentDate = getCurrentDateString();

        if (notes.some(note => note.date === currentDate)) {
            return;
        }

        setUploading(true);
        let imageUrl = null;

        if (newImage) {
            imageUrl = await uploadImage(newImage);
        }

        const { data, error } = await supabase
            .from('ojt_daily_notes')
            .insert([{
                user_id: userId,
                date: currentDate,
                content: newNoteContent.trim(),
                image_url: imageUrl
            }])
            .select()
            .single();

        if (data && !error) {
            setNotes(prev => [{
                id: data.id,
                date: data.date,
                content: data.content,
                imageUrl: data.image_url,
                createdAt: data.created_at
            }, ...prev]);
            setNewNoteContent('');
            setNewImage(null);
            setNewImagePreview(null);
            setShowCamera(false);
            setIsAddingNote(false);
            Swal.fire({
                icon: 'success',
                title: 'Note added',
                text: 'Your daily note has been saved.',
                confirmButtonColor: '#1a2517',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
            onNotify?.('note-added', 'Daily note added.');
        } else if (error) {
            Swal.fire({
                icon: 'error',
                title: 'Add failed',
                text: 'Failed to add note. Please try again.',
                confirmButtonColor: '#dc2626',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
        }
        setUploading(false);
    };

    const todayHasNote = notes.some(note => note.date === getCurrentDateString());

    const handleUpdateNote = async (noteId: string) => {
        if (!editNoteContent.trim()) return;

        const { error } = await supabase
            .from('ojt_daily_notes')
            .update({ content: editNoteContent.trim() })
            .eq('id', noteId);

        if (!error) {
            setNotes(prev => prev.map(note =>
                note.id === noteId ? { ...note, content: editNoteContent.trim() } : note
            ));
            setEditingNoteId(null);
            setEditNoteContent('');
            Swal.fire({
                icon: 'success',
                title: 'Note updated',
                text: 'Your daily note has been updated.',
                confirmButtonColor: '#1a2517',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
            onNotify?.('note-updated', 'Daily note updated.');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Update failed',
                text: 'Failed to update note. Please try again.',
                confirmButtonColor: '#dc2626',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        const { error } = await supabase
            .from('ojt_daily_notes')
            .delete()
            .eq('id', noteId);

        if (!error) {
            setNotes(prev => prev.filter(note => note.id !== noteId));
            Swal.fire({
                icon: 'success',
                title: 'Note deleted',
                text: 'The daily note has been removed.',
                confirmButtonColor: '#1a2517',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
            onNotify?.('note-deleted', 'Daily note deleted.');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Delete failed',
                text: 'Failed to delete note. Please try again.',
                confirmButtonColor: '#dc2626',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
        }
    };

    const startEditing = (note: Note) => {
        setEditingNoteId(note.id);
        setEditNoteContent(note.content);
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditNoteContent('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                            Daily Notes
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <button
                                onClick={() => {
                                    if (todayHasNote) return;
                                    setIsAddingNote(true);
                                }}
                                disabled={todayHasNote}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm transition-all border ${todayHasNote
                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'bg-primary text-white border-primary hover:bg-primary-light hover:shadow-md active:scale-95'
                                    }`}
                            >
                                <Plus className={`w-3 h-3 ${todayHasNote ? 'text-gray-400' : 'text-white'}`} />
                                Add Note
                            </button>
                            <button
                                onClick={() => setViewingAll(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-primary/10 transition-all border border-primary/20 shadow-sm"
                            >
                                <BookOpen className="w-3 h-3" />
                                View All
                            </button>
                        </div>
                    </div>
                </div>
                {/* Spacer to push content to left if needed, or remove completely */}
                <div className="w-8"></div>
            </div>

            {/* Add Note Form */}
            {isAddingNote && (
                <div className="mb-4 p-4 bg-gradient-to-br from-secondary-peach/10 to-transparent rounded-xl border-2 border-secondary-peach/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-primary/60" />
                        <span className="text-xs font-bold text-primary/60 uppercase tracking-wide">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="What did you work on today?"
                        className="w-full p-3 text-sm text-primary bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-sage/50 resize-none shadow-inner"
                        rows={3}
                        autoFocus
                    />

                    {/* Camera / Image Preview Area */}
                    <div className="mt-3">
                        {showCamera ? (
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    screenshotQuality={1}
                                    minScreenshotWidth={1280}
                                    minScreenshotHeight={720}
                                    mirrored={true}
                                    className="w-full h-full object-cover"
                                    videoConstraints={{
                                        facingMode: facingMode,
                                        width: { ideal: 1280 },
                                        height: { ideal: 720 }
                                    }}
                                />
                                <div className="absolute top-2 left-2 flex gap-2 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleCamera();
                                        }}
                                        className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 flex items-center gap-2"
                                        title="Switch Camera"
                                    >
                                        <Camera className="w-4 h-4 rotate-180" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Rotate</span>
                                    </button>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        capturePhoto();
                                    }}
                                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-[#ACC8A2] flex items-center justify-center hover:scale-105 transition-all shadow-lg z-10"
                                >
                                    <div className="w-10 h-10 bg-[#1a2517] rounded-full border-2 border-white"></div>
                                </button>
                                <button
                                    onClick={() => setShowCamera(false)}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : newImagePreview ? (
                            <div className="relative inline-block">
                                <img
                                    src={newImagePreview}
                                    alt="Preview"
                                    className="h-32 w-full object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    onClick={() => {
                                        setNewImage(null);
                                        setNewImagePreview(null);
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
                        <div className="flex items-center gap-2">
                            {/* Take Photo Button */}
                            <button
                                onClick={() => setShowCamera(true)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${showCamera
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white border-gray-200 text-primary/60 hover:border-secondary-sage hover:text-primary hover:bg-gray-50'
                                    }`}
                            >
                                <Camera className="w-4 h-4" />
                                <span className="text-xs font-bold">Take Photo</span>
                            </button>

                            {/* Upload File Button */}
                            <label className="cursor-pointer group flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-secondary-sage hover:bg-gray-50 transition-all">
                                <ImageIcon className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                                <span className="text-xs font-bold text-primary/60 group-hover:text-primary">
                                    Upload
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNote}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-secondary-sage hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                            >
                                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {uploading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingNote(false);
                                    setNewNoteContent('');
                                    setNewImage(null);
                                    setNewImagePreview(null);
                                    setShowCamera(false);
                                }}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 active:scale-95"
                            >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Notes List (Limit to 3) */}
            <div className="space-y-3">
                {notes.length === 0 ? (
                    <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-[#1a2517]/20 mx-auto mb-3" />
                        <p className="text-sm text-[#1a2517]/50 font-semibold">No notes yet</p>
                        <p className="text-xs text-[#1a2517]/40 mt-1">Start documenting your OJT journey!</p>
                    </div>
                ) : (
                    notes.slice(0, 3).map((note) => (
                        <div
                            key={note.id}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300"
                        >
                            {editingNoteId === note.id ? (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="w-3.5 h-3.5 text-[#1a2517]/60" />
                                        <span className="text-xs font-bold text-[#1a2517]/60 uppercase tracking-wide">
                                            {formatDate(note.date)}
                                        </span>
                                    </div>
                                    <textarea
                                        value={editNoteContent}
                                        onChange={(e) => setEditNoteContent(e.target.value)}
                                        className="w-full p-3 text-sm text-primary bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-sage/50 resize-none"
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleUpdateNote(note.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-secondary-sage hover:text-primary transition-all shadow-sm active:scale-95"
                                        >
                                            <Save className="w-3 h-3" />
                                            Save
                                        </button>
                                        <button
                                            onClick={cancelEditing}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all active:scale-95"
                                        >
                                            <X className="w-3 h-3" />
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-[#1a2517]/60" />
                                            <span className="text-xs font-bold text-[#1a2517]/60 uppercase tracking-wide">
                                                {formatDate(note.date)}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEditing(note)}
                                                className="p-1.5 rounded-full bg-secondary-sage/10 text-secondary-sage hover:bg-secondary-sage hover:text-white border border-secondary-sage/10 transition-all shadow-sm"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border border-red-100 transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-primary/80 leading-relaxed whitespace-pre-wrap">
                                        {note.content}
                                    </p>
                                    {/* Display uploaded image proof */}
                                    {note.imageUrl && (
                                        <div className="mt-3">
                                            <p className="text-[10px] font-bold text-[#1a2517]/40 uppercase tracking-widest mb-1.5">
                                                Proof of Work
                                            </p>
                                            <img
                                                src={note.imageUrl}
                                                alt="Proof of work"
                                                className="h-32 rounded-lg border border-gray-100 object-cover hover:h-auto hover:w-full transition-all duration-300 cursor-zoom-in"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* View All Button */}
            {notes.length > 3 && (
                <button
                    onClick={() => setViewingAll(true)}
                    className="w-full mt-4 py-2 text-xs font-bold text-[#1a2517]/60 hover:text-[#1a2517] bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
                >
                    View All {notes.length} Notes
                </button>
            )}

            {/* View All Modal */}
            {viewingAll && typeof document !== 'undefined'
                ? createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl">
                        <div className="bg-white w-full max-w-2xl sm:max-w-3xl max-h-[80vh] h-auto rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-gray-100 gap-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-primary">Daily Notes History</h2>
                                    <p className="text-xs sm:text-sm text-primary/60">Total {notes.length} entries</p>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl hover:shadow-lg hover:bg-secondary-sage hover:text-primary transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                        {isExporting ? 'Generating...' : 'Download PDF'}
                                    </button>
                                    <button
                                        onClick={() => setViewingAll(false)}
                                        className="p-2 text-[#1a2517]/40 hover:text-[#1a2517] hover:bg-gray-100 rounded-full transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                <div className="grid gap-4">
                                    {notes.map((note) => (
                                        <div key={note.id} className="p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-[#1a2517]/60" />
                                                    <span className="font-bold text-[#1a2517]/60 text-xs sm:text-sm">
                                                        {new Date(note.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[#1a2517] whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{note.content}</p>
                                            {note.imageUrl && (
                                                <img
                                                    src={note.imageUrl}
                                                    alt="Proof"
                                                    className="mt-3 h-40 rounded-lg border border-gray-200 object-cover"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null}

            {/* Hidden Export Layout (Positioned off-screen so html2canvas can see it) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div
                    ref={printRef}
                    className="font-serif"
                    style={{
                        width: '210mm',
                        padding: '20mm',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        minHeight: '297mm'
                    }}
                >
                    {/* Professional Header */}
                    <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000000', paddingBottom: '15px' }}>
                        <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase' }}>OJT Daily Activity Log</h1>
                        <p style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666666', margin: 0 }}>Generated on {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })}</p>
                    </div>

                    {/* Intern Details Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', fontSize: '10pt' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #cccccc', paddingBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold' }}>Student Name:</span>
                                <span style={{ flex: 1 }}>_________________________</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #cccccc', paddingBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold' }}>Degree/Program:</span>
                                <span style={{ flex: 1 }}>_________________________</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #cccccc', paddingBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold' }}>Company/HTE:</span>
                                <span style={{ flex: 1 }}>_________________________</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #cccccc', paddingBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold' }}>Total Target Hours:</span>
                                <span style={{ flex: 1 }}>_________________________</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '9.5pt' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9f9f9' }}>
                                <th style={{ border: '1px solid #000000', padding: '10px', width: '15%', textAlign: 'center' }}>Date</th>
                                <th style={{ border: '1px solid #000000', padding: '10px', textAlign: 'left' }}>Detailed Accomplishments & Activities</th>
                                <th style={{ border: '1px solid #000000', padding: '10px', width: '30%', textAlign: 'center' }}>Photo Evidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notes.map((note) => (
                                <tr key={note.id}>
                                    <td style={{ border: '1px solid #000000', padding: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold' }}>{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                        <div style={{ fontSize: '8pt', color: '#666666', textTransform: 'uppercase' }}>{new Date(note.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div style={{ fontSize: '7pt', color: '#999999', marginTop: '2px' }}>{new Date(note.date).getFullYear()}</div>
                                    </td>
                                    <td style={{ border: '1px solid #000000', padding: '12px', verticalAlign: 'top', lineHeight: '1.5', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
                                        {note.content}
                                    </td>
                                    <td style={{ border: '1px solid #000000', padding: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                                        {note.imageUrl ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <img
                                                    src={note.imageUrl}
                                                    alt="Proof"
                                                    style={{ width: '100%', height: 'auto', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eeeeee' }}
                                                    crossOrigin="anonymous"
                                                />
                                                <span style={{ fontSize: '7pt', color: '#999999', marginTop: '5px', textTransform: 'uppercase' }}>Verified Proof</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#cccccc', fontStyle: 'italic', fontSize: '8pt' }}>No image attached</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Report Summary/Footer */}
                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10pt', paddingTop: '50px' }}>
                        <div style={{ textAlign: 'center', width: '250px', borderTop: '1px solid #000000', paddingTop: '8px' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 2px 0' }}>Student Signature</p>
                            <p style={{ fontSize: '8pt', color: '#666666', margin: 0 }}>Date Signed</p>
                        </div>
                        <div style={{ textAlign: 'center', width: '250px', borderTop: '1px solid #000000', paddingTop: '8px' }}>
                            <p style={{ fontWeight: 'bold', margin: '0 0 2px 0' }}>Company Supervisor</p>
                            <p style={{ fontSize: '8pt', color: '#666666', margin: 0 }}>Signature Over Printed Name</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '60px', textAlign: 'center' }}>
                        <p style={{ fontSize: '8pt', color: '#999999', fontStyle: 'italic', margin: 0 }}>This is an official OJT daily log report generated via OJT Work Tracker.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyNotes;
