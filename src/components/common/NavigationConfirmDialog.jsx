import { useNavigationGuard } from '../../context/NavigationGuardContext';
import Icon from './Icon';

const NavigationConfirmDialog = () => {
    const { showConfirm, confirmMessage, confirmNavigation, cancelNavigation } = useNavigationGuard();

    if (!showConfirm) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-icon warning">
                        <Icon name="warning" />
                    </div>
                    <div className="modal-header-text">
                        <h3>Unsaved Changes</h3>
                        <p>Your changes will be lost</p>
                    </div>
                </div>
                <div className="modal-body">
                    <p style={{ textAlign: 'center', margin: '1rem 0' }}>{confirmMessage}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-modal-cancel" onClick={cancelNavigation}>
                        <Icon name="arrow_back" />
                        Go Back
                    </button>
                    <button className="btn-modal-delete" onClick={confirmNavigation}>
                        <Icon name="exit_to_app" />
                        Leave Without Saving
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NavigationConfirmDialog;
