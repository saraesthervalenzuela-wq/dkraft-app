/**
 * Global Search - Command Palette (Cmd+K)
 * Quick access to navigation, actions, and search
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './GlobalSearch.css';

// Navigation items
const navigationItems = [
    { type: 'nav', id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', keywords: ['home', 'main'] },
    { type: 'nav', id: 'clients', label: 'Clients', icon: 'group', keywords: ['customers', 'accounts'] },
    { type: 'nav', id: 'suppliers', label: 'Suppliers', icon: 'local_shipping', keywords: ['vendors', 'providers'] },
    { type: 'nav', id: 'materials', label: 'Materials', icon: 'inventory_2', keywords: ['inventory', 'stock', 'items'] },
    { type: 'nav', id: 'products', label: 'Products', icon: 'chair', keywords: ['furniture', 'catalog'] },
    { type: 'nav', id: 'projects', label: 'Projects', icon: 'folder_special', keywords: ['jobs', 'work'] },
    { type: 'nav', id: 'operations', label: 'Operations', icon: 'precision_manufacturing', keywords: ['production', 'manufacturing'] },
    { type: 'nav', id: 'quotations', label: 'Quotations', icon: 'request_quote', keywords: ['quotes', 'estimates', 'proposals'] },
    { type: 'nav', id: 'requisitions', label: 'Sales Orders', icon: 'shopping_cart', keywords: ['orders', 'purchases'] },
    { type: 'nav', id: 'bom', label: 'Bill of Materials', icon: 'schema', keywords: ['bom', 'components', 'recipe'] },
    { type: 'nav', id: 'warehouses', label: 'Warehouses', icon: 'warehouse', keywords: ['storage', 'locations'] },
    { type: 'nav', id: 'staff', label: 'Staff', icon: 'badge', keywords: ['employees', 'team', 'workers'] },
    { type: 'nav', id: 'quality', label: 'Quality', icon: 'verified', keywords: ['qa', 'inspection', 'testing'] },
    { type: 'nav', id: 'reports', label: 'Reports', icon: 'analytics', keywords: ['data', 'statistics', 'charts'] },
];

// Quick actions
const actionItems = [
    { type: 'action', id: 'new-client', label: 'New Client', icon: 'person_add', nav: 'clients' },
    { type: 'action', id: 'new-quotation', label: 'New Quotation', icon: 'add_shopping_cart', nav: 'quotations' },
    { type: 'action', id: 'new-project', label: 'New Project', icon: 'create_new_folder', nav: 'projects' },
    { type: 'action', id: 'new-material', label: 'New Material', icon: 'add_box', nav: 'materials' },
    { type: 'action', id: 'new-operation', label: 'New Operation', icon: 'add_task', nav: 'operations' },
];

const GlobalSearch = ({ isOpen, onClose, setActiveNav }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Filter items based on query
    const filteredItems = useCallback(() => {
        if (!query.trim()) {
            // Show recent/suggested items
            return [
                { type: 'section', label: 'Quick Actions' },
                ...actionItems.slice(0, 4),
                { type: 'section', label: 'Navigate To' },
                ...navigationItems.slice(0, 6),
            ];
        }

        const q = query.toLowerCase();
        const results = [];

        // Search navigation items
        const navMatches = navigationItems.filter(item =>
            item.label.toLowerCase().includes(q) ||
            item.keywords?.some(k => k.includes(q))
        );

        // Search action items
        const actionMatches = actionItems.filter(item =>
            item.label.toLowerCase().includes(q)
        );

        if (actionMatches.length > 0) {
            results.push({ type: 'section', label: 'Actions' });
            results.push(...actionMatches);
        }

        if (navMatches.length > 0) {
            results.push({ type: 'section', label: 'Navigation' });
            results.push(...navMatches);
        }

        if (results.length === 0) {
            results.push({ type: 'empty', label: `No results for "${query}"` });
        }

        return results;
    }, [query]);

    const items = filteredItems();
    const selectableItems = items.filter(i => i.type !== 'section' && i.type !== 'empty');

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < selectableItems.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : selectableItems.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectableItems[selectedIndex]) {
                        handleSelect(selectableItems[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, selectableItems, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && selectableItems.length > 0) {
            const selectedEl = listRef.current.querySelector('.search-item.selected');
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, selectableItems.length]);

    // Handle item selection
    const handleSelect = (item) => {
        if (item.type === 'nav') {
            setActiveNav(item.id);
            onClose();
        } else if (item.type === 'action') {
            // Navigate and trigger action
            setActiveNav(item.nav);
            onClose();
            // Could dispatch an event to trigger the "new" action
        }
    };

    if (!isOpen) return null;

    // Track index for selectable items
    let selectableIndex = -1;

    return (
        <div className="global-search-overlay" onClick={onClose}>
            <div className="global-search-modal" onClick={e => e.stopPropagation()}>
                {/* Search input */}
                <div className="search-input-container">
                    <span className="material-symbols-rounded search-icon">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Search or type a command..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="search-shortcut">
                        <span className="key-badge">esc</span>
                    </div>
                </div>

                {/* Results list */}
                <div className="search-results" ref={listRef}>
                    {items.map((item, idx) => {
                        if (item.type === 'section') {
                            return (
                                <div key={`section-${idx}`} className="search-section">
                                    {item.label}
                                </div>
                            );
                        }

                        if (item.type === 'empty') {
                            return (
                                <div key="empty" className="search-empty">
                                    <span className="material-symbols-rounded">search_off</span>
                                    <span>{item.label}</span>
                                </div>
                            );
                        }

                        // Increment selectable index
                        selectableIndex++;
                        const isSelected = selectableIndex === selectedIndex;

                        return (
                            <div
                                key={item.id}
                                className={`search-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(selectableIndex)}
                            >
                                <span className="material-symbols-rounded item-icon">
                                    {item.icon}
                                </span>
                                <span className="item-label">{item.label}</span>
                                {item.type === 'nav' && (
                                    <span className="item-type">Navigate</span>
                                )}
                                {item.type === 'action' && (
                                    <span className="item-type action">Action</span>
                                )}
                                {isSelected && (
                                    <span className="item-enter">
                                        <span className="key-badge small">&#8629;</span>
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer hints */}
                <div className="search-footer">
                    <div className="search-hint">
                        <span className="key-badge small">&#8593;</span>
                        <span className="key-badge small">&#8595;</span>
                        <span>to navigate</span>
                    </div>
                    <div className="search-hint">
                        <span className="key-badge small">&#8629;</span>
                        <span>to select</span>
                    </div>
                    <div className="search-hint">
                        <span className="key-badge small">esc</span>
                        <span>to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
