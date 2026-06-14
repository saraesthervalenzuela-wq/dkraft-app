import { createContext, useContext, useState, useCallback } from 'react';

const NavigationGuardContext = createContext(null);

export const NavigationGuardProvider = ({ children }) => {
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('You have unsaved changes. Are you sure you want to leave?');

    // Call this when form has unsaved changes
    const setUnsavedChanges = useCallback((dirty, message = null) => {
        setIsDirty(dirty);
        if (message) setConfirmMessage(message);
    }, []);

    // Try to navigate - will show confirm if dirty
    const tryNavigate = useCallback((navigateFn) => {
        if (isDirty) {
            setPendingNavigation(() => navigateFn);
            setShowConfirm(true);
            return false; // Navigation blocked
        }
        navigateFn();
        return true; // Navigation allowed
    }, [isDirty]);

    // User confirmed they want to leave
    const confirmNavigation = useCallback(() => {
        setShowConfirm(false);
        setIsDirty(false);
        if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
        }
    }, [pendingNavigation]);

    // User cancelled - stay on page
    const cancelNavigation = useCallback(() => {
        setShowConfirm(false);
        setPendingNavigation(null);
    }, []);

    // Reset dirty state (call after successful save)
    const clearUnsavedChanges = useCallback(() => {
        setIsDirty(false);
    }, []);

    return (
        <NavigationGuardContext.Provider value={{
            isDirty,
            setUnsavedChanges,
            clearUnsavedChanges,
            tryNavigate,
            showConfirm,
            confirmMessage,
            confirmNavigation,
            cancelNavigation
        }}>
            {children}
        </NavigationGuardContext.Provider>
    );
};

export const useNavigationGuard = () => {
    const context = useContext(NavigationGuardContext);
    if (!context) {
        throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
    }
    return context;
};

export default NavigationGuardContext;
