/**
 * Icon Component
 * Wrapper for Material Symbols Rounded icons
 */
const Icon = ({ name, className = '', style = {} }) => (
    <span className={`material-symbols-rounded nav-icon ${className}`} style={style}>
        {name}
    </span>
);

export default Icon;
