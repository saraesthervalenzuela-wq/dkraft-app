/**
 * Card Component
 * Reusable card container for modules
 */

import './Card.css';

const Card = ({ children, className = '', onClick, ...props }) => {
    return (
        <div
            className={`card ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
