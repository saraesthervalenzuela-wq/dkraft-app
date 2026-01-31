import Icon from './Icon';

/**
 * SearchBox Component
 * Reusable search input with icon and glass effect
 */
const SearchBox = ({
    value,
    onChange,
    placeholder = 'Search...',
    className = '',
    size = 'default' // 'sm' | 'default' | 'lg'
}) => {
    const sizeClasses = {
        sm: 'py-2 px-3 text-xs',
        default: 'py-3 px-4 text-sm',
        lg: 'py-4 px-5 text-base'
    };

    return (
        <div className={`search-box glass-input flex items-center gap-3 ${sizeClasses[size]} ${className}`}>
            <Icon name="search" className="text-text-muted" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-text-primary placeholder:text-text-muted"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="btn btn-ghost btn-icon w-6 h-6 text-text-muted hover:text-text-primary"
                >
                    <Icon name="close" style={{ fontSize: '16px' }} />
                </button>
            )}
        </div>
    );
};

export default SearchBox;
