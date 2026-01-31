import Icon from './Icon';

/**
 * Badge Component
 * Status badges with icons and multiple variants
 * Fully built with Tailwind CSS
 */
const Badge = ({
    children,
    variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'
    size = 'md', // 'sm' | 'md' | 'lg'
    icon,
    dot = false,
    pulse = false,
    className = ''
}) => {
    const baseClasses = `
        inline-flex items-center gap-1.5
        font-semibold rounded-full
        border
    `;

    const variantClasses = {
        default: `
            bg-slate-500/20 text-slate-300
            border-slate-500/30
        `,
        success: `
            bg-green-500/20 text-green-400
            border-green-500/30
        `,
        warning: `
            bg-amber-500/20 text-amber-400
            border-amber-500/30
        `,
        danger: `
            bg-red-500/20 text-red-400
            border-red-500/30
        `,
        info: `
            bg-blue-500/20 text-blue-400
            border-blue-500/30
        `,
        purple: `
            bg-purple-500/20 text-purple-400
            border-purple-500/30
        `,
        orange: `
            bg-orange-500/20 text-orange-400
            border-orange-500/30
        `
    };

    const dotColors = {
        default: 'bg-slate-400',
        success: 'bg-green-400',
        warning: 'bg-amber-400',
        danger: 'bg-red-400',
        info: 'bg-blue-400',
        purple: 'bg-purple-400',
        orange: 'bg-orange-400'
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm'
    };

    const dotSizeClasses = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5'
    };

    return (
        <span
            className={`
                ${baseClasses}
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {dot && (
                <span
                    className={`
                        ${dotSizeClasses[size]}
                        ${dotColors[variant]}
                        rounded-full
                        ${pulse ? 'animate-pulse' : ''}
                    `}
                />
            )}
            {icon && <Icon name={icon} size="xs" />}
            {children}
        </span>
    );
};

export default Badge;
