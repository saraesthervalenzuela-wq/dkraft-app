import Icon from './Icon';

/**
 * SearchBox Component
 * Reusable search input with icon and glass effect
 */
const SearchBox = ({
    value,
    onChange,
    placeholder = 'Search...',
    className = ''
}) => {
    return (
        <div className={`search-box glass-input flex items-center gap-3 ${sizeClasses[size]} ${className}`}>
        <div className={`search-box ${className}`}>
            <Icon name="search" className="search-icon" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="search-clear"
                    style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(180, 200, 230, 0.6)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Icon name="close" style={{ fontSize: '18px' }} />
                </button>
            )}
        </div>
    );
};

export default SearchBox;
