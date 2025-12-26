import { useState } from 'react';
import { Icon } from '../common';
import { navItems } from '../../data/initialData';

/**
 * Sidebar Component
 * Main navigation sidebar with theme toggle and user menu
 */
const Sidebar = ({ activeNav, setActiveNav, theme, setTheme, user, onLogout }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});

    // Get user initials from display name or email
    const getUserInitials = () => {
        if (user?.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (user?.email) {
            return user.email.slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Get display name
    const getDisplayName = () => {
        return user?.displayName || user?.email?.split('@')[0] || 'Usuario';
    };

    // Handle logout
    const handleLogout = async () => {
        setShowDropdown(false);
        if (onLogout) {
            await onLogout();
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dkraft-theme', newTheme);
    };

    const toggleSubmenu = (itemId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleNavClick = (item) => {
        if (item.hasSubmenu && item.submenu) {
            toggleSubmenu(item.id);
        } else {
            setActiveNav(item.id);
        }
    };

    const isSubmenuActive = (item) => {
        if (!item.submenu) return false;
        return item.submenu.some(sub => sub.id === activeNav);
    };

    return (
        <aside className="sidebar">
            <div className="logo-section">
                <div className="logo-container">
                    <div className="logo-icon">DC</div>
                    <div className="logo-text">
                        <span className="logo-title">DOVECREEK</span>
                        <span className="logo-subtitle">Lifetime Masterpieces</span>
                    </div>
                </div>
            </div>

            <nav className="nav-section">
                {navItems.map((item) => (
                    <div key={item.id} className="nav-item-container">
                        <a
                            className={`nav-item ${activeNav === item.id ? 'active' : ''} ${isSubmenuActive(item) ? 'has-active-child' : ''}`}
                            onClick={() => handleNavClick(item)}
                        >
                            <Icon name={item.icon} />
                            <span className="nav-label">{item.label}</span>
                            {item.badge && <span className="nav-badge">{item.badge}</span>}
                            {item.hasSubmenu && (
                                <Icon
                                    name={expandedMenus[item.id] ? 'expand_more' : 'chevron_right'}
                                    className="submenu-arrow"
                                />
                            )}
                        </a>
                        {item.hasSubmenu && item.submenu && expandedMenus[item.id] && (
                            <div className="nav-submenu">
                                {item.submenu.map((subItem) => (
                                    <a
                                        key={subItem.id}
                                        className={`nav-subitem ${activeNav === subItem.id ? 'active' : ''}`}
                                        onClick={() => setActiveNav(subItem.id)}
                                    >
                                        <Icon name={subItem.icon} />
                                        <span className="nav-label">{subItem.label}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="themes-section">
                <div className="themes-toggle" onClick={toggleTheme}>
                    <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
                    <span className="nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
            </div>

            <div className="user-section">
                <div className={`user-dropdown ${showDropdown ? 'show' : ''}`}>
                    <div className="dropdown-item">
                        <Icon name="person" />
                        <span>Profile</span>
                    </div>
                    <div className="dropdown-item">
                        <Icon name="settings" />
                        <span>Settings</span>
                    </div>
                    <div className="dropdown-item danger" onClick={handleLogout}>
                        <Icon name="logout" />
                        <span>Log Out</span>
                    </div>
                </div>
                <div className="user-menu-trigger" onClick={() => setShowDropdown(!showDropdown)}>
                    <div className="user-avatar">{getUserInitials()}</div>
                    <div className="user-info">
                        <div className="user-name">{getDisplayName()}</div>
                        <div className="user-role">{user?.email || 'Usuario'}</div>
                    </div>
                    <Icon name="expand_more" />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
