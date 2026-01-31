import { useState, useEffect } from 'react';
import Icon from './Icon';

/**
 * ThemeToggle Component
 * Animated toggle switch for dark/light theme
 * Persists preference to localStorage
 */
const ThemeToggle = ({ className = '' }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('dkraft-theme');
        if (saved) return saved;

        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dkraft-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative flex items-center gap-2
                w-full px-4 py-3 rounded-xl
                transition-all duration-300 ease-out
                ${isDark
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                    : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500'
                }
                border border-white/10 hover:border-white/20
                group cursor-pointer
                ${className}
            `}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* Icon container with animation */}
            <div className="relative w-5 h-5">
                {/* Sun icon */}
                <div className={`
                    absolute inset-0 flex items-center justify-center
                    transition-all duration-300
                    ${isDark
                        ? 'opacity-0 rotate-90 scale-0'
                        : 'opacity-100 rotate-0 scale-100'
                    }
                `}>
                    <Icon name="light_mode" size="sm" />
                </div>

                {/* Moon icon */}
                <div className={`
                    absolute inset-0 flex items-center justify-center
                    transition-all duration-300
                    ${isDark
                        ? 'opacity-100 rotate-0 scale-100'
                        : 'opacity-0 -rotate-90 scale-0'
                    }
                `}>
                    <Icon name="dark_mode" size="sm" />
                </div>
            </div>

            {/* Label */}
            <span className="text-sm font-medium">
                {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>

            {/* Toggle indicator */}
            <div className={`
                ml-auto w-10 h-5 rounded-full
                transition-colors duration-300
                flex items-center px-0.5
                ${isDark ? 'bg-slate-700' : 'bg-orange-500'}
            `}>
                <div className={`
                    w-4 h-4 rounded-full bg-white
                    transition-transform duration-300 ease-out
                    shadow-sm
                    ${isDark ? 'translate-x-0' : 'translate-x-5'}
                `} />
            </div>
        </button>
    );
};

export default ThemeToggle;
