/**
 * Card Component
 * Reusable card container with glassmorphism
 * Fully migrated to Tailwind CSS
 */

const Card = ({
    children,
    className = '',
    variant = 'default', // 'default' | 'glass' | 'premium' | 'solid'
    hover = true,
    onClick,
    padding = 'default', // 'none' | 'sm' | 'default' | 'lg'
    ...props
}) => {
    const variantClasses = {
        default: `
            bg-slate-800/60 backdrop-blur-lg
            border border-white/10
            shadow-lg shadow-black/20
        `,
        glass: `
            bg-gradient-to-br from-slate-800/40 to-slate-900/40
            backdrop-blur-xl
            border border-white/10
            shadow-xl shadow-black/30
        `,
        premium: `
            bg-gradient-to-br from-slate-800/70 to-slate-900/60
            backdrop-blur-xl
            border border-white/15
            shadow-2xl shadow-black/40
            relative overflow-hidden
        `,
        solid: `
            bg-slate-800
            border border-slate-700
            shadow-lg shadow-black/30
        `
    };

    const paddingClasses = {
        none: '',
        sm: 'p-3',
        default: 'p-5',
        lg: 'p-6'
    };

    const hoverClasses = hover
        ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/20'
        : '';

    const clickableClasses = onClick ? 'cursor-pointer' : '';

    return (
        <div
            className={`
                rounded-xl
                ${variantClasses[variant]}
                ${paddingClasses[padding]}
                ${hoverClasses}
                ${clickableClasses}
                ${className}
            `}
            onClick={onClick}
            {...props}
        >
            {/* Premium shine effect */}
            {variant === 'premium' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full
                        bg-gradient-to-br from-white/5 to-transparent
                        rotate-12 animate-[cardShine_6s_ease-in-out_infinite]" />
                </div>
            )}
            <div className={variant === 'premium' ? 'relative z-10' : ''}>
                {children}
            </div>
        </div>
    );
};

export default Card;
