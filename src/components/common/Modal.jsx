import { createPortal } from 'react-dom';
import { useState } from 'react';
import Icon from './Icon';

/**
 * Modal Component
 * Reusable modal dialog with glassmorphism
 * Now with Tailwind CSS and close confirmation
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
    size = 'default', // 'default' | 'lg' | 'xl'
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
        xl: 'max-w-6xl'
    };

    return createPortal(
        <>
            <div className="modal-overlay" onClick={handleOverlayClick}>
                <div
                    className={`modal-content glass-modal ${sizeClasses[size]} ${className}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <div className="modal-header-icon icon-box icon-box-md icon-box-orange">
                            <Icon name={icon} />
                        </div>
                        <div className="modal-header-text">
                            <h3>{title}</h3>
                            {subtitle && <p>{subtitle}</p>}
                        </div>
                        <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}>
                            <Icon name="close" />
                        </button>
                    </div>

                    <div className="modal-body">
                        {children}
                    </div>

                    {footer && (
                        <div className="modal-footer">
                            {footer}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="modal-overlay" style={{ zIndex: 600 }} onClick={() => setShowConfirm(false)}>
                    <div
                        className="glass-modal p-6 max-w-sm animate-modal-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="icon-box icon-box-md icon-box-warning">
                                <Icon name="warning" />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold">Unsaved Changes</h4>
                                <p className="text-sm text-text-muted">Are you sure you want to close?</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleConfirmClose}
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
