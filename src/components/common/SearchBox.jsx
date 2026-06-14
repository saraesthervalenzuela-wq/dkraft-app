import Icon from './Icon';

/**
 * SearchBox Component
 * Reusable search input with icon
 */
const SearchBox = ({
    value,
    onChange,
    placeholder = 'Search...',
    className = ''
}) => {
    return (
        <div className={`search-box ${className}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <Icon name="search" className="search-icon" />
        </div>
    );
};

export default SearchBox;
