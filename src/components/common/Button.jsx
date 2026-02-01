import Icon from './Icon';

/**
 * Button Component
 * Reusable button with multiple variants
 * Fully built with Tailwind CSS
 */
const Button = ({
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger' | 'success' | 'orange'
    size = 'md', // 'sm' | 'md' | 'lg'
    icon,
    iconPosition = 'left',
    disabled = false,
    loading = false,
    fullWidth = false,
    className = '',
    onClick,
    type = 'button',
    ...props
}) => {
    // Check if this button should have split-icon style (all variants except ghost)
    const isSplitIcon = icon && iconPosition === 'left' && variant !== 'ghost';

    const baseClasses = `
        inline-flex items-center justify-center
        font-semibold
        transition-all duration-200
        outline-none focus:outline-none
        cursor-pointer whitespace-nowrap
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isSplitIcon ? 'gap-0 rounded-full' : 'gap-3 rounded-xl'}
    `;

    const variantClasses = {
        primary: `
            bg-gradient-to-r from-blue-600 to-blue-700
            text-white border-0
            shadow-lg shadow-blue-500/25
            hover:shadow-blue-500/40 hover:scale-[1.02]
            active:scale-[0.98]
        `,
        secondary: `
            bg-white/5
            border border-white/20
            text-slate-300
            backdrop-blur-sm
            hover:bg-white/10 hover:border-white/30 hover:text-white
        `,
        glass: `
            bg-gradient-to-br from-white/10 to-white/5
            border border-white/20
            border-t-white/30 border-l-white/25
            text-white
            backdrop-blur-md
            shadow-lg shadow-black/20
            hover:bg-white/15 hover:border-white/30 hover:shadow-xl
            hover:scale-[1.02]
            active:scale-[0.98]
        `,
        ghost: `
            bg-transparent border-0
            text-slate-400
            hover:bg-white/10 hover:text-white
        `,
        danger: `
            bg-gradient-to-r from-red-500 to-red-600
            text-white border-0
            shadow-lg shadow-red-500/25
            hover:shadow-red-500/40 hover:scale-[1.02]
            active:scale-[0.98]
        `,
        success: `
            bg-gradient-to-r from-green-500 to-green-600
            text-white border-0
            shadow-lg shadow-green-500/25
            hover:shadow-green-500/40 hover:scale-[1.02]
            active:scale-[0.98]
        `,
        orange: `
            bg-gradient-to-r from-orange-500 to-orange-600
            text-white font-bold
            shadow-lg shadow-orange-500/30
            hover:shadow-orange-500/50 hover:scale-[1.02]
            active:scale-[0.98]
            border border-orange-400/30
        `
    };

    const sizeClasses = {
        sm: isSplitIcon ? 'pl-0 pr-5 py-2 text-xs' : 'px-4 py-2 text-xs',
        md: isSplitIcon ? 'pl-0 pr-6 py-3 text-sm' : 'px-6 py-3 text-sm',
        lg: isSplitIcon ? 'pl-0 pr-8 py-4 text-base' : 'px-8 py-4 text-base'
    };

    const splitIconSizes = {
        sm: 'px-3 py-2 -my-2 mr-4',
        md: 'px-4 py-3 -my-3 mr-5',
        lg: 'px-5 py-4 -my-4 mr-6'
    };

    // Background colors for split-icon compartment by variant
    const splitIconBg = {
        primary: 'bg-blue-700/50 border-r border-blue-400/30',
        secondary: 'bg-white/10 border-r border-white/20',
        glass: 'bg-white/15 border-r border-white/25',
        ghost: '',
        danger: 'bg-red-700/50 border-r border-red-400/30',
        success: 'bg-green-700/50 border-r border-green-400/30',
        orange: 'bg-orange-600/50 border-r border-orange-400/30'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`
                ${baseClasses}
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${widthClass}
                ${className}
            `}
            {...props}
        >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </>
            ) : isSplitIcon ? (
                <>
                    <span className={`flex items-center justify-center rounded-l-full ${splitIconBg[variant]} ${splitIconSizes[size]}`}>
                        <Icon name={icon} size={size === 'lg' ? 'md' : 'sm'} />
                    </span>
                    {children}
                </>
            ) : (
                <>
                    {icon && iconPosition === 'left' && <Icon name={icon} size="sm" />}
                    {children}
                    {icon && iconPosition === 'right' && <Icon name={icon} size="sm" />}
                </>
            )}
        </button>
    );
};

export default Button;
