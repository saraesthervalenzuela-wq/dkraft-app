/**
 * Card Component
 * Reusable card container for modules
 * Now with Tailwind CSS support
 */

const Card = ({
    children,
    className = '',
    variant = 'default',
    glass = false,
    onClick,
    ...props
}) => {
    const baseClasses = glass
        ? 'glass-card'
        : variant === 'premium'
            ? 'glass-premium rounded-xl p-6'
            : 'tw-card';

    const clickableClasses = onClick ? 'cursor-pointer hover:-translate-y-1' : '';

    return (
        <div
            className={`${baseClasses} ${clickableClasses} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
