import Icon from './Icon';

/**
 * SearchBox Component
 * Reusable search input with icon and glass effect
 * Migrated to Tailwind CSS utilities
 */
const SearchBox = ({
    value,
    onChange,
    placeholder = 'Search...',
    className = ''
}) => {
    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <Icon
                name="search"
                className="absolute left-3.5 z-10 text-slate-400 text-xl transition-colors duration-200 peer-focus:text-orange-500"
            />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="peer w-[280px] py-3 px-4 pl-11 rounded-3xl
                    border-2 border-slate-500/30
                    bg-gradient-to-br from-slate-800/60 to-slate-900/50
                    text-white text-sm
                    placeholder:text-slate-400/70
                    backdrop-blur-xl
                    transition-all duration-200
                    focus:outline-none focus:border-orange-500/60
                    focus:shadow-[0_0_0_3px_rgba(211,84,0,0.2),0_4px_20px_rgba(0,0,0,0.2)]
                    focus:bg-gradient-to-br focus:from-slate-700/70 focus:to-slate-800/60
                    dark:border-slate-500/30 dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/50
                    [data-theme='light']:bg-blue-50 [data-theme='light']:border-blue-200"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 p-1
                        bg-transparent border-none
                        text-slate-400/60 hover:text-orange-400
                        cursor-pointer transition-colors duration-200
                        flex items-center justify-center"
                    aria-label="Clear search"
                >
                    <Icon name="close" className="text-lg" />
                </button>
            )}
        </div>
    );
};

export default SearchBox;
