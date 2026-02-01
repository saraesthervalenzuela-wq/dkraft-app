import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

// Toast types with their icons
const TOAST_ICONS = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
};

// Default duration in ms
const DEFAULT_DURATION = 5000;

// Individual Toast Component
const Toast = ({ id, type, title, message, duration, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300); // Match animation duration
    }, [id, onClose]);

    // Auto-dismiss
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(handleClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, handleClose]);

    return (
        <div className={`toast toast-${type} ${isExiting ? 'exiting' : ''}`}>
            <span className="toast-icon material-symbols-rounded">
                {TOAST_ICONS[type]}
            </span>
            <div className="toast-content">
                {title && <div className="toast-title">{title}</div>}
                {message && <div className="toast-message">{message}</div>}
            </div>
            <button className="toast-close" onClick={handleClose}>
                <span className="material-symbols-rounded">close</span>
            </button>
            {duration > 0 && (
                <div className="toast-progress">
                    <div
                        className="toast-progress-bar"
                        style={{ animationDuration: `${duration}ms` }}
                    />
                </div>
            )}
        </div>
    );
};

// Toast Container Component
const ToastContainer = ({ toasts, position, onClose }) => {
    if (toasts.length === 0) return null;

    return createPortal(
        <div className={`toast-container ${position}`}>
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>,
        document.body
    );
};

// Toast Provider
export const ToastProvider = ({ children, position = 'top-right' }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((options) => {
        const id = Date.now() + Math.random();
        const toast = {
            id,
            type: options.type || 'info',
            title: options.title,
            message: options.message,
            duration: options.duration ?? DEFAULT_DURATION
        };

        setToasts(prev => [...prev, toast]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Convenience methods
    const success = useCallback((message, options = {}) => {
        return addToast({ ...options, type: 'success', message, title: options.title || 'Success' });
    }, [addToast]);

    const error = useCallback((message, options = {}) => {
        return addToast({ ...options, type: 'error', message, title: options.title || 'Error' });
    }, [addToast]);

    const warning = useCallback((message, options = {}) => {
        return addToast({ ...options, type: 'warning', message, title: options.title || 'Warning' });
    }, [addToast]);

    const info = useCallback((message, options = {}) => {
        return addToast({ ...options, type: 'info', message, title: options.title || 'Info' });
    }, [addToast]);

    const value = {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} position={position} onClose={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast - exported as part of ToastProvider module
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastContext;
