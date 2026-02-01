import Icon from './Icon';

/**
 * IconButton Component
 * Compact icon-only button for table actions (view, edit, delete)
 * Fully built with Tailwind CSS
 */
const IconButton = ({
    icon,
    variant = 'default', // 'default' | 'primary' | 'danger' | 'success' | 'warning'
    size = 'md', // 'sm' | 'md' | 'lg'
    disabled = false,
    className = '',
    onClick,
    title,
    ...props
}) => {
    const baseClasses = `
        inline-flex items-center justify-center
        rounded-lg
        transition-all duration-200
        outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
    `;

    const variantClasses = {
        default: `
            bg-white/5
            text-slate-400
            hover:bg-white/10 hover:text-slate-200
            border border-white/10
        `,
        primary: `
            bg-blue-500/10
            text-blue-400
            hover:bg-blue-500/20 hover:text-blue-300
            border border-blue-500/20
        `,
        danger: `
            bg-red-500/10
            text-red-400
            hover:bg-red-500/20 hover:text-red-300
            border border-red-500/20
        `,
        success: `
            bg-green-500/10
            text-green-400
            hover:bg-green-500/20 hover:text-green-300
            border border-green-500/20
        `,
        warning: `
            bg-amber-500/10
            text-amber-400
            hover:bg-amber-500/20 hover:text-amber-300
            border border-amber-500/20
        `
    };

    const sizeClasses = {
        sm: 'w-7 h-7',
        md: 'w-9 h-9',
        lg: 'w-11 h-11'
    };

    const iconSizes = {
        sm: 'sm',
        md: 'sm',
        lg: 'md'
    };

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={`
                ${baseClasses}
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${className}
            `}
            {...props}
        >
            <Icon name={icon} size={iconSizes[size]} />
        </button>
    );
};

export default IconButton;
