import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error';
    isVisible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', isVisible, onClose }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                // Allow animation to finish before calling onClose
                setTimeout(onClose, 300);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [isVisible, onClose]);

    if (!isVisible && !show) return null;

    return (
        <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out transform ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl min-w-[320px] max-w-sm ${type === 'success'
                ? 'bg-white/90 border-[#1a2517]/20 text-[#1a2517]'
                : 'bg-white/90 border-red-200 text-red-700'
                }`}>
                <div className={`p-2 rounded-full ${type === 'success' ? 'bg-[#1a2517]/10' : 'bg-red-50'}`}>
                    {type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold">{type === 'success' ? 'Success' : 'Error'}</h3>
                    <p className="text-sm opacity-90">{message}</p>
                </div>
                <button
                    onClick={() => { setShow(false); setTimeout(onClose, 300); }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 opacity-40" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
