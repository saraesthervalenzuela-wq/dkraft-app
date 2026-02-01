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
    const baseClasses = `
        inline-flex items-center justify-center gap-3
        font-semibold rounded-xl
        transition-all duration-200
        outline-none focus:outline-none
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
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
            text-white
            shadow-lg shadow-orange-500/25
            hover:shadow-orange-500/40 hover:scale-[1.02]
            active:scale-[0.98]
            border-0 outline-0
        `
    };

    const sizeClasses = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base'
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
