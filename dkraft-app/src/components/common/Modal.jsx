import Icon from './Icon';

/**
 * Modal Component
 * Reusable modal dialog with header, body, and footer
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon = 'add_box',
    children,
    footer,
    className = ''
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()}>
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

                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
