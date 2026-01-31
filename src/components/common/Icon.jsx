/**
 * Icon Component
 * Wrapper for Material Symbols Rounded icons
 * Supports size variants and custom className
 */
const Icon = ({
    name,
    className = '',
    size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    style = {}
}) => {
    const sizeClasses = {
        xs: 'text-sm',
        sm: 'text-base',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl',
        '2xl': 'text-4xl'
    };

    return (
        <span
            className={`material-symbols-rounded transition-colors duration-200 ${sizeClasses[size] || ''} ${className}`}
            style={style}
        >
            {name}
        </span>
    );
};

export default Icon;
