/**
 * Keyboard Shortcuts - Global shortcuts with help modal
 * Press ? or Cmd+/ to see all shortcuts
 */

import { useState, useEffect, useCallback } from 'react';
import './KeyboardShortcuts.css';

// Define all keyboard shortcuts
const shortcuts = [
    { category: 'Navigation', items: [
        { keys: ['g', 'd'], description: 'Go to Dashboard' },
        { keys: ['g', 'c'], description: 'Go to Clients' },
        { keys: ['g', 'm'], description: 'Go to Materials' },
        { keys: ['g', 'p'], description: 'Go to Projects' },
        { keys: ['g', 'o'], description: 'Go to Operations' },
        { keys: ['g', 'q'], description: 'Go to Quotations' },
        { keys: ['g', 'r'], description: 'Go to Sales Orders' },
    ]},
    { category: 'Actions', items: [
        { keys: ['n'], description: 'New item (context aware)' },
        { keys: ['/', 'Cmd+K'], description: 'Open search' },
        { keys: ['Esc'], description: 'Close modal / Cancel' },
        { keys: ['Enter'], description: 'Submit / Confirm' },
    ]},
    { category: 'View', items: [
        { keys: ['v', 'g'], description: 'Grid view' },
        { keys: ['v', 't'], description: 'Table view' },
        { keys: ['?', 'Cmd+/'], description: 'Show shortcuts' },
    ]},
];

// Key display helper
const KeyBadge = ({ keyName }) => (
    <span className="key-badge">
        {keyName === 'Cmd' ? (
            <span className="key-cmd">&#8984;</span>
        ) : keyName === 'Shift' ? (
            <span className="key-shift">&#8679;</span>
        ) : keyName === 'Alt' ? (
            <span className="key-alt">&#8997;</span>
        ) : keyName === 'Esc' ? (
            <span>esc</span>
        ) : keyName === 'Enter' ? (
            <span>&#8629;</span>
        ) : (
            keyName
        )}
    </span>
);

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="shortcuts-overlay" onClick={onClose}>
            <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
                <div className="shortcuts-header">
                    <div className="shortcuts-title">
                        <span className="material-symbols-rounded">keyboard</span>
                        Keyboard Shortcuts
                    </div>
                    <button className="shortcuts-close" onClick={onClose}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="shortcuts-content">
                    {shortcuts.map((section) => (
                        <div key={section.category} className="shortcuts-section">
                            <h3 className="shortcuts-category">{section.category}</h3>
                            <div className="shortcuts-list">
                                {section.items.map((shortcut, idx) => (
                                    <div key={idx} className="shortcut-item">
                                        <span className="shortcut-description">{shortcut.description}</span>
                                        <div className="shortcut-keys">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <span key={keyIdx} className="key-group">
                                                    {key.includes('+') ? (
                                                        key.split('+').map((k, i) => (
                                                            <span key={i}>
                                                                <KeyBadge keyName={k} />
                                                                {i < key.split('+').length - 1 && <span className="key-plus">+</span>}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <KeyBadge keyName={key} />
                                                    )}
                                                    {keyIdx < shortcut.keys.length - 1 && (
                                                        <span className="key-or">or</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="shortcuts-footer">
                    <span className="shortcuts-hint">
                        Press <KeyBadge keyName="Esc" /> to close
                    </span>
                </div>
            </div>
        </div>
    );
};

const KeyboardShortcuts = ({ setActiveNav, onOpenSearch }) => {
    const [showModal, setShowModal] = useState(false);
    const [, setKeySequence] = useState([]);
    const sequenceTimeoutRef = useState(null);

    // Navigation map
    const navMap = {
        'd': 'dashboard',
        'c': 'clients',
        'm': 'materials',
        'p': 'projects',
        'o': 'operations',
        'q': 'quotations',
        'r': 'requisitions',
        's': 'suppliers',
    };

    // Handle key sequence
    const handleKeySequence = useCallback((keys) => {
        const sequence = keys.join('');

        // Check for navigation: g + letter
        if (sequence.startsWith('g') && sequence.length === 2) {
            const target = navMap[sequence[1]];
            if (target && setActiveNav) {
                setActiveNav(target);
            }
        }

        // Check for view toggle: v + g/t
        if (sequence === 'vg' || sequence === 'vt') {
            // View toggle would need to be passed as prop
            console.log('View toggle:', sequence[1] === 'g' ? 'grid' : 'table');
        }
    }, [setActiveNav]);

    // Global keyboard listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            // Show shortcuts modal: ? or Cmd+/
            if (e.key === '?' || (e.metaKey && e.key === '/')) {
                e.preventDefault();
                setShowModal(prev => !prev);
                return;
            }

            // Open search: / or Cmd+K
            if ((e.key === '/' && !e.metaKey) || (e.metaKey && e.key === 'k')) {
                e.preventDefault();
                if (onOpenSearch) onOpenSearch();
                return;
            }

            // Close modal on Escape
            if (e.key === 'Escape') {
                setShowModal(false);
                return;
            }

            // New item shortcut
            if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
                // Trigger new item based on current module
                console.log('New item shortcut triggered');
                return;
            }

            // Handle key sequences (g+letter, v+letter)
            if (/^[a-z]$/.test(e.key)) {
                setKeySequence(prev => {
                    const newSequence = [...prev, e.key].slice(-2);

                    // Clear sequence after timeout
                    if (sequenceTimeoutRef.current) {
                        clearTimeout(sequenceTimeoutRef.current);
                    }
                    sequenceTimeoutRef.current = setTimeout(() => {
                        setKeySequence([]);
                    }, 500);

                    // Process sequence if 2 keys
                    if (newSequence.length === 2) {
                        handleKeySequence(newSequence);
                        return [];
                    }

                    return newSequence;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeySequence, onOpenSearch]);

    return (
        <>
            <KeyboardShortcutsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />

            {/* Floating shortcut indicator */}
            <button
                className="shortcuts-indicator"
                onClick={() => setShowModal(true)}
                title="Keyboard shortcuts (?)"
            >
                <span className="material-symbols-rounded">keyboard</span>
            </button>
        </>
    );
};

export default KeyboardShortcuts;
