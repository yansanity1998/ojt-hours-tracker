import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableCardProps {
    id: string;
    children: React.ReactNode;
}

export const SortableCard: React.FC<SortableCardProps> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute right-2 top-2 z-50 p-2 cursor-grab active:cursor-grabbing text-[#1a2517]/40 hover:text-[#1a2517] hover:bg-[#1a2517]/5 rounded-xl transition-all touch-none"
                aria-label="Drag to reorder"
            >
                <GripVertical className="w-5 h-5" />
            </div>
            {children}
        </div>
    );
};
