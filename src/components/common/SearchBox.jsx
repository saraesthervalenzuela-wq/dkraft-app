import Icon from './Icon';

/**
 * SearchBox Component
 * Reusable search input with icon and glass effect
 * Using flexbox layout for reliable icon positioning
 */
const SearchBox = ({
    value,
    onChange,
    placeholder = 'Search...',
    className = ''
}) => {
    return (
        <div
            className={`group flex items-center gap-3 px-4 h-11 rounded-xl
                border border-white/10
                bg-slate-800/50
                backdrop-blur-sm
                transition-all duration-200
                focus-within:border-orange-500/50
                focus-within:bg-slate-800/70
                focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]
                hover:border-white/20 hover:bg-slate-800/60
                ${className}`}
            style={{ width: '300px' }}
        >
            <Icon
                name="search"
                className="text-slate-400 text-xl flex-shrink-0 group-focus-within:text-orange-400 transition-colors duration-200"
            />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 h-full bg-transparent border-none outline-none
                    text-white text-sm font-medium
                    placeholder:text-slate-500"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="flex-shrink-0 p-1
                        text-slate-500 hover:text-orange-400
                        cursor-pointer transition-colors duration-200
                        flex items-center justify-center"
                    aria-label="Clear search"
                    type="button"
                >
                    <Icon name="close" className="text-base" />
                </button>
            )}
        </div>
    );
};

export default SearchBox;
