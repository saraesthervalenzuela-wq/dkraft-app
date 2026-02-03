import { useState } from 'react';
import Icon from './Icon';

/**
 * Modal Component
 * Reusable modal dialog with header, body, and footer
 * Shows confirmation when clicking outside ONLY if there are unsaved changes
 *
 * Props:
 * - isOpen: boolean - controls visibility
 * - onClose: function - called when modal closes
 * - title: string - modal title
 * - subtitle: string - optional subtitle
 * - icon: string - Material icon name for header
 * - children: ReactNode - modal body content
 * - footer: ReactNode - custom footer (overrides default buttons)
 * - className: string - additional CSS classes
 * - size: 'small' | 'medium' | 'large' | 'xlarge' - modal width
 * - confirmOnClose: boolean - enable confirm dialog feature (default: true)
 * - isDirty: boolean - indicates if form has unsaved changes (required for confirm to show)
 * - confirmMessage: string - message in confirm dialog
 *
 * Action Props (for default footer):
 * - onSave: function - save button handler (shows default footer if provided)
 * - onCancel: function - cancel button handler (defaults to onClose)
 * - saveText: string - save button text (default: 'Save')
 * - cancelText: string - cancel button text (default: 'Cancel')
 * - saveDisabled: boolean - disable save button
 * - saveIcon: string - icon for save button (default: 'check')
 * - cancelIcon: string - icon for cancel button (default: 'close')
 * - showFooter: boolean - force show/hide footer
 * - isViewMode: boolean - hide save button in view mode
 * - variant: 'default' | 'danger' - changes save button style for delete confirmations
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
    size = 'medium',
    confirmOnClose = true,
    isDirty = false,
    confirmMessage = 'Are you sure you want to close? Unsaved changes will be lost.',
    // Action props for default footer
    onSave,
    onCancel,
    saveText = 'Save',
    cancelText = 'Cancel',
    saveDisabled = false,
    saveIcon = 'check',
    cancelIcon = 'close',
    showFooter = true,
    isViewMode = false,
    variant = 'default'
}) => {
    const [showConfirm, setShowConfirm] = useState(false);

    if (!isOpen) return null;

    const handleOverlayClick = () => {
        // Only show confirm dialog if confirmOnClose is enabled AND form has changes (isDirty)
        if (confirmOnClose && isDirty && !isViewMode) {
            setShowConfirm(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setShowConfirm(false);
        onClose();
    };

    const handleCancelClose = () => {
        setShowConfirm(false);
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    };

    // Determine if we should show default footer
    const shouldShowDefaultFooter = showFooter && !footer && (onSave || isViewMode);

    // Get size class
    const sizeClass = {
        small: 'modal-small',
        medium: 'modal-medium',
        large: 'modal-large',
        xlarge: 'modal-xlarge'
    }[size] || 'modal-medium';

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${sizeClass} ${className}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-icon">
                        <Icon name={icon} />
                    </div>
                    <div className="modal-header-text">
                        <h3>{title}</h3>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <Icon name="close" />
                    </button>
                </div>

                <div className="modal-body">
                    {children}
                </div>

                {/* Custom footer or default footer */}
                {footer ? (
                    <div className="modal-footer">
                        {footer}
                    </div>
                ) : shouldShowDefaultFooter ? (
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-modal-cancel"
                            onClick={handleCancel}
                        >
                            <Icon name={cancelIcon} />
                            {cancelText}
                        </button>
                        {!isViewMode && onSave && (
                            <button
                                type="button"
                                className={variant === 'danger' ? 'btn-modal-danger' : 'btn-modal-save'}
                                onClick={onSave}
                                disabled={saveDisabled}
                            >
                                <Icon name={variant === 'danger' ? 'delete' : saveIcon} />
                                {saveText}
                            </button>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="modal-confirm-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-confirm-dialog">
                        <div className="modal-confirm-icon">
                            <Icon name="warning" />
                        </div>
                        <h4>Confirm Exit</h4>
                        <p>{confirmMessage}</p>
                        <div className="modal-confirm-actions">
                            <button className="btn-modal-cancel" onClick={handleCancelClose}>
                                <Icon name="arrow_back" />
                                Go Back
                            </button>
                            <button className="btn-confirm-exit" onClick={handleConfirmClose}>
                                <Icon name="exit_to_app" />
                                Exit Without Saving
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Modal;
