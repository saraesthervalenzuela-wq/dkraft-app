import { createPortal } from 'react-dom';
import { useState } from 'react';
import Icon from './Icon';

/**
 * Modal Component
 * Reusable modal dialog with glassmorphism
 * Fully migrated to Tailwind CSS
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon = 'add_box',
    children,
    footer,
    className = '',
    size = 'default', // 'default' | 'lg' | 'xl' | 'full'
    confirmClose = false
}) => {
    const [showConfirm, setShowConfirm] = useState(false);

    if (!isOpen) return null;

    const handleOverlayClick = () => {
        if (confirmClose) {
            setShowConfirm(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setShowConfirm(false);
        onClose();
    };

    const sizeClasses = {
        default: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw] max-h-[90vh]'
    };

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[500] flex items-center justify-center p-4
                    bg-black/60 backdrop-blur-sm
                    animate-[fadeIn_0.2s_ease-out]"
                onClick={handleOverlayClick}
            >
                {/* Modal Container */}
                <div
                    className={`relative w-full ${sizeClasses[size]}
                        bg-gradient-to-br from-slate-800/95 to-slate-900/95
                        backdrop-blur-xl
                        border border-white/10
                        rounded-2xl shadow-2xl shadow-black/50
                        animate-[modalSlideUp_0.3s_ease-out]
                        overflow-hidden
                        ${className}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Shine effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-1/2 -left-1/2 w-full h-full
                            bg-gradient-to-br from-white/5 to-transparent
                            rotate-12 translate-x-full
                            animate-[modalShine_3s_ease-in-out_infinite]" />
                    </div>

                    {/* Header */}
                    <div className="relative flex items-center gap-4 p-5 border-b border-white/10">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl
                            bg-gradient-to-br from-orange-500 to-orange-600
                            flex items-center justify-center
                            shadow-lg shadow-orange-500/25">
                            <Icon name={icon} className="text-2xl text-white" />
                        </div>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">{title}</h3>
                            {subtitle && (
                                <p className="text-sm text-slate-400 truncate">{subtitle}</p>
                            )}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 w-10 h-10 rounded-xl
                                flex items-center justify-center
                                text-slate-400 hover:text-white
                                bg-transparent hover:bg-white/10
                                transition-all duration-200"
                        >
                            <Icon name="close" className="text-xl" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative p-5 max-h-[60vh] overflow-y-auto">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="relative flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-black/20">
                            {footer}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-[600] flex items-center justify-center p-4
                        bg-black/70 backdrop-blur-sm
                        animate-[fadeIn_0.15s_ease-out]"
                    onClick={() => setShowConfirm(false)}
                >
                    <div
                        className="w-full max-w-sm p-6
                            bg-gradient-to-br from-slate-800/95 to-slate-900/95
                            backdrop-blur-xl
                            border border-white/10
                            rounded-2xl shadow-2xl
                            animate-[modalSlideUp_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-12 h-12 rounded-xl
                                bg-gradient-to-br from-amber-500 to-orange-500
                                flex items-center justify-center
                                shadow-lg shadow-amber-500/25">
                                <Icon name="warning" className="text-2xl text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">Unsaved Changes</h4>
                                <p className="text-sm text-slate-400">Are you sure you want to close?</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded-xl
                                    bg-transparent border-2 border-white/20
                                    text-slate-300 hover:text-white hover:border-white/40
                                    font-medium text-sm
                                    transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmClose}
                                className="px-4 py-2 rounded-xl
                                    bg-gradient-to-r from-red-500 to-red-600
                                    text-white font-medium text-sm
                                    shadow-lg shadow-red-500/25
                                    hover:shadow-red-500/40 hover:scale-[1.02]
                                    transition-all duration-200"
                            >
                                Close Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};

export default Modal;
