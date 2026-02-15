import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Plus, Edit2, Trash2, Save, X, Calendar, Image as ImageIcon, Loader2, Camera, FileDown } from 'lucide-react';
import Swal from 'sweetalert2';
import type { NotificationType } from './Notification';
import Webcam from 'react-webcam';
import { supabase } from '../../supabase/supabase';
import jsPDF from 'jspdf';

interface Note {
    id: string;
    date: string;
    content: string;
    imageUrls?: string[];
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
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [editNoteDate, setEditNoteDate] = useState('');
    const [editExistingImageUrls, setEditExistingImageUrls] = useState<string[]>([]);
    const [editImages, setEditImages] = useState<File[]>([]);
    const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);

    // Zoom modal state
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Camera states
    const [showCamera, setShowCamera] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const webcamRef = useRef<Webcam>(null);

    // PDF Download state
    const [isExporting, setIsExporting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const parsePhDate = (dateStr: string) => new Date(`${dateStr}T00:00:00+08:00`);
            const formatPh = (d: Date, options: Intl.DateTimeFormatOptions) =>
                new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'Asia/Manila' }).format(d);

            const marginX = 12;
            const marginTop = 14;
            const marginBottom = 14;
            const contentWidth = pageWidth - marginX * 2;

            const headerTitleSize = 16;
            const normalFontSize = 10;

            const tableHeaderBg: [number, number, number] = [243, 244, 246];
            const borderColor: [number, number, number] = [17, 17, 17];

            const colDateW = Math.round(contentWidth * 0.14 * 10) / 10;
            const colProofW = Math.round(contentWidth * 0.34 * 10) / 10;
            const colTextW = contentWidth - colDateW - colProofW;

            const cellPad = 2.5;
            const lineHeightFactor = 1.25;

            const fetchAsDataUrl = async (url: string): Promise<string | null> => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return null;
                    const blob = await res.blob();
                    return await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
                        reader.readAsDataURL(blob);
                    });
                } catch {
                    return null;
                }
            };

            const drawHeader = () => {
                let y = marginTop;

                pdf.setTextColor(0, 0, 0);
                pdf.setFont('times', 'bold');
                pdf.setFontSize(headerTitleSize);
                pdf.text('OJT DAILY ACTIVITY LOG', pageWidth / 2, y, { align: 'center' });
                y += 6;

                pdf.setFont('times', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(68, 68, 68);
                pdf.text(
                    `Generated ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })}`,
                    pageWidth / 2,
                    y,
                    { align: 'center' }
                );
                y += 4;

                pdf.setDrawColor(...borderColor);
                pdf.setLineWidth(0.6);
                pdf.line(marginX, y, pageWidth - marginX, y);
                y += 7;

                // simple info lines
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(normalFontSize);
                pdf.setFont('times', 'bold');
                pdf.text('Student Name:', marginX, y);
                pdf.setFont('times', 'normal');
                pdf.text('_________________________', marginX + 28, y);
                pdf.setFont('times', 'bold');
                pdf.text('Company/HTE:', marginX + contentWidth / 2, y);
                pdf.setFont('times', 'normal');
                pdf.text('_________________________', marginX + contentWidth / 2 + 26, y);
                y += 6;

                pdf.setFont('times', 'bold');
                pdf.text('Degree/Program:', marginX, y);
                pdf.setFont('times', 'normal');
                pdf.text('_________________________', marginX + 32, y);
                pdf.setFont('times', 'bold');
                pdf.text('Total Target Hours:', marginX + contentWidth / 2, y);
                pdf.setFont('times', 'normal');
                pdf.text('_________________________', marginX + contentWidth / 2 + 35, y);
                y += 10;

                return y;
            };

            const drawTableHeader = (y: number) => {
                const h = 10;
                pdf.setDrawColor(...borderColor);
                pdf.setLineWidth(0.4);
                pdf.setFillColor(...tableHeaderBg);
                pdf.rect(marginX, y, contentWidth, h, 'F');
                pdf.rect(marginX, y, contentWidth, h);
                pdf.line(marginX + colDateW, y, marginX + colDateW, y + h);
                pdf.line(marginX + colDateW + colTextW, y, marginX + colDateW + colTextW, y + h);

                pdf.setTextColor(0, 0, 0);
                pdf.setFont('times', 'bold');
                pdf.setFontSize(10);
                pdf.text('Date', marginX + colDateW / 2, y + 6.5, { align: 'center' });
                pdf.text('Detailed Accomplishments & Activities', marginX + colDateW + cellPad, y + 6.5);
                pdf.text('Proof / Photo Evidence', marginX + colDateW + colTextW + colProofW / 2, y + 6.5, { align: 'center' });
                return y + h;
            };

            const footerHeight = 42;
            const drawFooterLastPage = () => {
                const yBase = pageHeight - marginBottom;

                pdf.setDrawColor(...borderColor);
                pdf.setLineWidth(0.4);
                pdf.line(marginX, yBase - footerHeight + 8, pageWidth - marginX, yBase - footerHeight + 8);

                const sigBlockW = 70;
                const sigLineY = yBase - 20;

                // Left signature
                pdf.setDrawColor(...borderColor);
                pdf.setLineWidth(0.35);
                pdf.line(marginX + 5, sigLineY, marginX + 5 + sigBlockW, sigLineY);
                pdf.setFont('times', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                pdf.text('Student Signature', marginX + 5 + sigBlockW / 2, sigLineY + 6, { align: 'center' });
                pdf.setFont('times', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(102, 102, 102);
                pdf.text('Date Signed', marginX + 5 + sigBlockW / 2, sigLineY + 10, { align: 'center' });

                // Right signature
                const rightX = pageWidth - marginX - 5 - sigBlockW;
                pdf.setDrawColor(...borderColor);
                pdf.setLineWidth(0.35);
                pdf.line(rightX, sigLineY, rightX + sigBlockW, sigLineY);
                pdf.setFont('times', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                pdf.text('Company Supervisor', rightX + sigBlockW / 2, sigLineY + 6, { align: 'center' });
                pdf.setFont('times', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(102, 102, 102);
                pdf.text('Signature Over Printed Name', rightX + sigBlockW / 2, sigLineY + 10, { align: 'center' });

                // Footer note
                pdf.setFont('times', 'italic');
                pdf.setFontSize(8);
                pdf.setTextColor(153, 153, 153);
                pdf.text('This is an official OJT daily log report generated via OJT Work Tracker.', pageWidth / 2, yBase - 6, { align: 'center' });
                pdf.setFont('times', 'normal');
                pdf.setFontSize(normalFontSize);
                pdf.setTextColor(0, 0, 0);
            };

            let cursorY = drawHeader();
            cursorY = drawTableHeader(cursorY);

            pdf.setFont('times', 'normal');
            pdf.setFontSize(normalFontSize);

            for (const note of notes) {
                const date = parsePhDate(note.date);
                const dateMain = formatPh(date, { month: 'short', day: 'numeric' });
                const dateSub = formatPh(date, { weekday: 'short' }).toUpperCase();
                const dateYear = formatPh(date, { year: 'numeric' });

                const textLines = pdf.splitTextToSize(note.content || '', colTextW - cellPad * 2);
                const textHeight = Math.max(8, textLines.length * (normalFontSize * 0.3528) * lineHeightFactor);

                const hasImages = !!(note.imageUrls && note.imageUrls.length > 0);
                const imgBlockHeight = hasImages ? 55 : 10;

                const rowHeight = Math.max(24, textHeight + cellPad * 2, imgBlockHeight + cellPad * 2);

                // Page break BEFORE the row if it doesn't fit
                if (cursorY + rowHeight > pageHeight - marginBottom) {
                    pdf.addPage();
                    cursorY = marginTop;
                    cursorY = drawTableHeader(cursorY);
                    pdf.setFont('times', 'normal');
                    pdf.setFontSize(normalFontSize);
                }

                // Row borders
                pdf.setDrawColor(...borderColor);
                pdf.setLineWidth(0.35);
                pdf.rect(marginX, cursorY, contentWidth, rowHeight);
                pdf.line(marginX + colDateW, cursorY, marginX + colDateW, cursorY + rowHeight);
                pdf.line(marginX + colDateW + colTextW, cursorY, marginX + colDateW + colTextW, cursorY + rowHeight);

                // Date cell
                const dateCenterX = marginX + colDateW / 2;
                pdf.setFont('times', 'bold');
                pdf.text(dateMain, dateCenterX, cursorY + 8, { align: 'center' });
                pdf.setFontSize(8);
                pdf.setFont('times', 'normal');
                pdf.setTextColor(102, 102, 102);
                pdf.text(dateSub, dateCenterX, cursorY + 13, { align: 'center' });
                pdf.setFontSize(7);
                pdf.setTextColor(153, 153, 153);
                pdf.text(dateYear, dateCenterX, cursorY + 17, { align: 'center' });

                // Text cell
                pdf.setFontSize(normalFontSize);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('times', 'normal');
                const textX = marginX + colDateW + cellPad;
                const textY = cursorY + 6;
                pdf.text(textLines, textX, textY, { maxWidth: colTextW - cellPad * 2 });

                // Proof cell
                const proofX = marginX + colDateW + colTextW + cellPad;
                const proofW = colProofW - cellPad * 2;

                if (hasImages) {
                    const urls = note.imageUrls!.slice(0, 3);
                    const dataUrls = await Promise.all(urls.map(fetchAsDataUrl));

                    // Main image
                    const main = dataUrls[0];
                    if (main) {
                        const mainH = 36;
                        (pdf as any).addImage(main, 'JPEG', proofX, cursorY + 4, proofW, mainH);
                    }

                    // Thumbs
                    const thumbY = cursorY + 42;
                    const thumbH = 12;
                    const gap = 2;
                    const thumbW = (proofW - gap) / 2;
                    if (dataUrls[1]) (pdf as any).addImage(dataUrls[1], 'JPEG', proofX, thumbY, thumbW, thumbH);
                    if (dataUrls[2]) (pdf as any).addImage(dataUrls[2], 'JPEG', proofX + thumbW + gap, thumbY, thumbW, thumbH);

                    // Badge
                    const badgeY = cursorY + rowHeight - 5;
                    pdf.setFontSize(7);
                    pdf.setTextColor(17, 17, 17);
                    pdf.setFillColor(238, 242, 255);
                    pdf.setDrawColor(199, 210, 254);
                    const badgeText = 'PROOF ATTACHED';
                    const countText = `${Math.min(3, urls.length)} IMAGE${Math.min(3, urls.length) > 1 ? 'S' : ''}`;
                    const badgeW = 28;
                    const badgeH = 4.5;
                    const badgeX = proofX + (proofW - badgeW) / 2;
                    pdf.roundedRect(badgeX, badgeY - badgeH, badgeW, badgeH, 2, 2, 'FD');
                    pdf.text(badgeText, badgeX + badgeW / 2, badgeY - 1.3, { align: 'center' });
                    pdf.setTextColor(107, 114, 128);
                    pdf.text(countText, proofX + proofW - 0.5, badgeY - 1.3, { align: 'right' });
                } else {
                    pdf.setFontSize(8);
                    pdf.setTextColor(160, 160, 160);
                    pdf.setFont('times', 'italic');
                    pdf.text('No image attached', marginX + colDateW + colTextW + colProofW / 2, cursorY + 12, { align: 'center' });
                    pdf.setFont('times', 'normal');
                    pdf.setFontSize(normalFontSize);
                    pdf.setTextColor(0, 0, 0);
                }

                cursorY += rowHeight;
            }

            // Ensure footer doesn't overlap the last rows.
            if (cursorY + footerHeight > pageHeight - marginBottom) {
                pdf.addPage();
            }

            pdf.setPage(pdf.getNumberOfPages());
            drawFooterLastPage();

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

    const parseImageUrls = (raw: string | null): string[] => {
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.filter((u): u is string => typeof u === 'string');
            }
        } catch {
            // Fallback: legacy single URL string
        }
        return [raw];
    };

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
                imageUrls: parseImageUrls(note.image_url),
                createdAt: note.created_at
            })));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const filesArray = Array.from(e.target.files);
        const availableSlots = 3 - newImages.length;

        if (availableSlots <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Image limit reached',
                text: 'You can attach up to 3 images per daily note.',
                confirmButtonColor: '#1a2517'
            });
            return;
        }

        const selected = filesArray.slice(0, availableSlots);

        selected.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        setNewImages(prev => [...prev, ...selected]);
        setShowCamera(false);
        e.target.value = '';
    };

    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const filesArray = Array.from(e.target.files);
        const currentCount = editExistingImageUrls.length + editImages.length;
        const availableSlots = 3 - currentCount;

        if (availableSlots <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Image limit reached',
                text: 'You can attach up to 3 images per daily note.',
                confirmButtonColor: '#1a2517'
            });
            return;
        }

        const selected = filesArray.slice(0, availableSlots);

        selected.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        setEditImages(prev => [...prev, ...selected]);
        e.target.value = '';
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
        if (!imageSrc) return;

        if (newImages.length >= 3) {
            Swal.fire({
                icon: 'warning',
                title: 'Image limit reached',
                text: 'You can attach up to 3 images per daily note.',
                confirmButtonColor: '#1a2517'
            });
            return;
        }

        const file = await urlToFile(imageSrc, 'camera-capture.jpg', 'image/jpeg');
        setNewImagePreviews(prev => [...prev, imageSrc]);
        setNewImages(prev => [...prev, file]);
        setShowCamera(false);
    }, [webcamRef, newImages]);

    const handleRemovePreview = (index: number) => {
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveEditExistingImage = (index: number) => {
        setEditExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveEditNewImage = (index: number) => {
        setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
        setEditImages(prev => prev.filter((_, i) => i !== index));
    };

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
        let imageUrls: string[] = [];

        if (newImages.length > 0) {
            for (const file of newImages) {
                const url = await uploadImage(file);
                if (url) imageUrls.push(url);
            }
        }

        const payload: any = {
            user_id: userId,
            date: currentDate,
            content: newNoteContent.trim(),
        };

        if (imageUrls.length > 0) {
            payload.image_url = JSON.stringify(imageUrls);
        }

        const { data, error } = await supabase
            .from('ojt_daily_notes')
            .insert([payload])
            .select()
            .single();

        if (data && !error) {
            setNotes(prev => [{
                id: data.id,
                date: data.date,
                content: data.content,
                imageUrls,
                createdAt: data.created_at
            }, ...prev]);
            setNewNoteContent('');
            setNewImages([]);
            setNewImagePreviews([]);
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

        if (!editNoteDate) {
            Swal.fire({
                icon: 'warning',
                title: 'Date required',
                text: 'Please select a date for this note.',
                confirmButtonColor: '#1a2517',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
            return;
        }

        const hasDuplicateDate = notes.some(note => note.date === editNoteDate && note.id !== noteId);
        if (hasDuplicateDate) {
            Swal.fire({
                icon: 'warning',
                title: 'Duplicate date',
                text: 'You already have a note for this date. Please choose another date.',
                confirmButtonColor: '#1a2517',
                width: '90%',
                customClass: {
                    popup: 'sm:max-w-md'
                }
            });
            return;
        }

        setUploading(true);

        let uploadedImageUrls: string[] = [];
        if (editImages.length > 0) {
            for (const file of editImages) {
                const url = await uploadImage(file);
                if (url) uploadedImageUrls.push(url);
            }
        }

        const finalImageUrls = [...editExistingImageUrls, ...uploadedImageUrls];

        const payload: any = {
            content: editNoteContent.trim(),
            date: editNoteDate,
        };

        if (finalImageUrls.length > 0) {
            payload.image_url = JSON.stringify(finalImageUrls);
        } else {
            payload.image_url = null;
        }

        const { error } = await supabase
            .from('ojt_daily_notes')
            .update(payload)
            .eq('id', noteId);

        setUploading(false);

        if (!error) {
            setNotes(prev => {
                const updated = prev.map(note =>
                    note.id === noteId
                        ? { ...note, content: editNoteContent.trim(), date: editNoteDate, imageUrls: finalImageUrls }
                        : note
                );
                return [...updated].sort((a, b) => b.date.localeCompare(a.date));
            });
            setEditingNoteId(null);
            setEditNoteContent('');
            setEditNoteDate('');
            setEditExistingImageUrls([]);
            setEditImages([]);
            setEditImagePreviews([]);
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
        setEditNoteDate(note.date);
        setEditExistingImageUrls(note.imageUrls || []);
        setEditImages([]);
        setEditImagePreviews([]);
    };

    const cancelEditing = () => {
        setEditingNoteId(null);
        setEditNoteContent('');
        setEditNoteDate('');
        setEditExistingImageUrls([]);
        setEditImages([]);
        setEditImagePreviews([]);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="card glass-card">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-6 sm:mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5 shrink-0">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight leading-none">
                            Daily Notes
                        </h2>
                        <p className="text-[10px] text-primary/50 font-bold uppercase tracking-wider mt-1">
                            Document your journey
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full xs:w-auto">
                    <button
                        onClick={() => {
                            if (todayHasNote) return;
                            setIsAddingNote(true);
                        }}
                        disabled={todayHasNote}
                        className={`flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm transition-all border ${todayHasNote
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
                            : 'bg-primary text-white border-primary hover:bg-primary-light hover:shadow-md active:scale-95'
                            }`}
                    >
                        <Plus className={`w-3 h-3 ${todayHasNote ? 'text-gray-400' : 'text-white'}`} />
                        Add Note
                    </button>
                    <button
                        onClick={() => setViewingAll(true)}
                        className="flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-primary/10 transition-all border border-primary/20 shadow-sm"
                    >
                        <BookOpen className="w-3 h-3" />
                        View All
                    </button>
                </div>
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
                        ) : newImagePreviews.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {newImagePreviews.map((preview, index) => (
                                    <div key={index} className="relative inline-block">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            onClick={() => handleRemovePreview(index)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-4 gap-3">
                        <div className="flex items-center gap-2">
                            {/* Take Photo Button */}
                            <button
                                onClick={() => setShowCamera(true)}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${showCamera
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white border-gray-200 text-primary/60 hover:border-secondary-sage hover:text-primary hover:bg-gray-50'
                                    }`}
                            >
                                <Camera className="w-4 h-4" />
                                <span className="text-xs font-bold">Take Photo</span>
                            </button>

                            {/* Upload File Button */}
                            <label className="flex-1 sm:flex-none cursor-pointer group flex items-center justify-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-secondary-sage hover:bg-gray-50 transition-all">
                                <ImageIcon className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                                <span className="text-xs font-bold text-primary/60 group-hover:text-primary">
                                    Upload
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNote}
                                disabled={uploading}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-secondary-sage hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                            >
                                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {uploading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingNote(false);
                                    setNewNoteContent('');
                                    setNewImages([]);
                                    setNewImagePreviews([]);
                                    setShowCamera(false);
                                }}
                                disabled={uploading}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 active:scale-95"
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
                            className="p-4 bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-md transition-all duration-300"
                        >
                            {editingNoteId === note.id ? (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="w-3.5 h-3.5 text-[#1a2517]/60" />
                                        <input
                                            type="date"
                                            value={editNoteDate}
                                            onChange={(e) => setEditNoteDate(e.target.value)}
                                            className="text-xs font-bold text-[#1a2517]/80 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-secondary-sage/50"
                                        />
                                    </div>
                                    <textarea
                                        value={editNoteContent}
                                        onChange={(e) => setEditNoteContent(e.target.value)}
                                        className="w-full p-3 text-sm text-primary bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-sage/50 resize-none"
                                        rows={3}
                                        autoFocus
                                    />
                                    {(editExistingImageUrls.length > 0 || editImagePreviews.length > 0) && (
                                        <div className="mt-3">
                                            <p className="text-[10px] font-bold text-[#1a2517]/40 uppercase tracking-widest mb-1.5">
                                                Proof of Work
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {editExistingImageUrls.map((url, index) => (
                                                    <div key={`existing-${index}`} className="relative">
                                                        <img
                                                            src={url}
                                                            alt={`Proof of work ${index + 1}`}
                                                            className="h-24 w-full rounded-lg border border-gray-100 object-cover"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveEditExistingImage(index)}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {editImagePreviews.map((preview, index) => (
                                                    <div key={`new-${index}`} className="relative">
                                                        <img
                                                            src={preview}
                                                            alt={`New proof ${index + 1}`}
                                                            className="h-24 w-full rounded-lg border border-gray-100 object-cover"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveEditNewImage(index)}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-3">
                                        <label className="cursor-pointer group inline-flex items-center justify-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-secondary-sage hover:bg-gray-50 transition-all">
                                            <ImageIcon className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                                            <span className="text-[11px] font-bold text-primary/60 group-hover:text-primary">
                                                Upload Images
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleEditImageChange}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleUpdateNote(note.id)}
                                            disabled={uploading}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-secondary-sage hover:text-primary transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            {uploading ? 'Saving...' : 'Save'}
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
                                    {/* Display uploaded image proofs */}
                                    {note.imageUrls && note.imageUrls.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-[10px] font-bold text-[#1a2517]/40 uppercase tracking-widest mb-1.5">
                                                Proof of Work
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {note.imageUrls.slice(0, 3).map((url, index) => (
                                                    <img
                                                        key={index}
                                                        src={url}
                                                        alt={`Proof of work ${index + 1}`}
                                                        className="h-24 w-full rounded-lg border border-gray-100 object-cover cursor-zoom-in transition-transform hover:scale-105"
                                                        onClick={() => setZoomedImage(url)}
                                                        style={{ cursor: 'zoom-in' }}
                                                    />
                                                ))}
                                            </div>
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
                                            {note.imageUrls && note.imageUrls.length > 0 && (
                                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {note.imageUrls.slice(0, 3).map((url, index) => (
                                                        <img
                                                            key={index}
                                                            src={url}
                                                            alt={`Proof ${index + 1}`}
                                                            className="h-28 w-28 rounded-lg border border-gray-200 object-cover cursor-zoom-in transition-transform hover:scale-105"
                                                            onClick={() => setZoomedImage(url)}
                                                            style={{ cursor: 'zoom-in' }}
                                                        />
                                                    ))}
                                                </div>
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

            {/* Zoomed Image Modal */}
            {zoomedImage && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-2 sm:px-0"
                    onClick={() => setZoomedImage(null)}
                    style={{ cursor: 'zoom-out', touchAction: 'manipulation' }}
                >
                    <div
                        className="relative flex items-center justify-center w-full h-full"
                        style={{ maxWidth: '100vw', maxHeight: '100vh' }}
                    >
                        <img
                            src={zoomedImage}
                            alt="Zoomed Proof"
                            className="w-auto h-auto max-w-[98vw] max-h-[80vh] sm:max-w-[90vw] sm:max-h-[90vh] rounded-xl shadow-2xl border-4 border-white bg-white"
                            style={{ objectFit: 'contain', display: 'block', margin: '0 auto', background: '#fff', maxWidth: '98vw', maxHeight: '80vh' }}
                            onClick={e => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-2 right-2 sm:top-6 sm:right-6 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 z-10 focus:outline-none focus:ring-2 focus:ring-white"
                            style={{ fontSize: '1.5rem', lineHeight: 1, touchAction: 'manipulation' }}
                            aria-label="Close zoomed image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>,
                document.body
            )}

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
                    <div style={{ marginBottom: '18px', paddingBottom: '12px', borderBottom: '2px solid #111111' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>OJT Daily Activity Log</h1>
                            <div style={{ fontSize: '9pt', color: '#444444', textAlign: 'right' }}>
                                <div style={{ fontStyle: 'italic' }}>Generated {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' })}</div>
                            </div>
                        </div>
                    </div>

                    {/* Intern Details Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px', fontSize: '10pt' }}>
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #111111', fontSize: '9.5pt' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                                <th style={{ border: '1px solid #111111', padding: '10px', width: '14%', textAlign: 'center' }}>Date</th>
                                <th style={{ border: '1px solid #111111', padding: '10px', textAlign: 'left' }}>Detailed Accomplishments & Activities</th>
                                <th style={{ border: '1px solid #111111', padding: '10px', width: '34%', textAlign: 'center' }}>Proof / Photo Evidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notes.map((note) => (
                                <tr key={note.id}>
                                    <td style={{ border: '1px solid #111111', padding: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold' }}>{new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                        <div style={{ fontSize: '8pt', color: '#666666', textTransform: 'uppercase' }}>{new Date(note.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div style={{ fontSize: '7pt', color: '#999999', marginTop: '2px' }}>{new Date(note.date).getFullYear()}</div>
                                    </td>
                                    <td style={{ border: '1px solid #111111', padding: '12px', verticalAlign: 'top', lineHeight: '1.55', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        {note.content}
                                    </td>
                                    <td style={{ border: '1px solid #111111', padding: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                                        {note.imageUrls && note.imageUrls.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <img
                                                        src={note.imageUrls[0]}
                                                        alt="Proof 1"
                                                        style={{ width: '100%', height: 'auto', maxHeight: '130px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                                        crossOrigin="anonymous"
                                                    />
                                                    {note.imageUrls.length > 1 && (
                                                        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                                            {note.imageUrls.slice(1, 3).map((url, index) => (
                                                                <img
                                                                    key={index}
                                                                    src={url}
                                                                    alt={`Proof ${index + 2}`}
                                                                    style={{ width: '50%', height: 'auto', maxHeight: '75px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                                                    crossOrigin="anonymous"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '7pt', color: '#111111', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '2px 6px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                                                        Proof Attached
                                                    </span>
                                                    <span style={{ fontSize: '7pt', color: '#6b7280', textTransform: 'uppercase' }}>
                                                        {Math.min(3, note.imageUrls.length)} image{Math.min(3, note.imageUrls.length) > 1 ? 's' : ''}
                                                    </span>
                                                </div>
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
