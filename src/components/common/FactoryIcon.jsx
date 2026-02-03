/**
 * FactoryIcon Component
 * Displays custom factory-themed SVG icons
 */
const FactoryIcon = ({ name, size = 24, className = '', style = {} }) => {
    const iconPath = `/icons/factory/${name}.svg`;

    return (
        <img
            src={iconPath}
            alt={name}
            width={size}
            height={size}
            className={`factory-icon ${className}`}
            style={{
                objectFit: 'contain',
                ...style
            }}
        />
    );
};

/**
 * Available factory icons:
 * - storage: Warehouse storage shelves
 * - conveyor: Factory conveyor belt
 * - worker: Factory worker
 * - foreman: Supervisor/foreman
 * - delivery-truck: Delivery truck
 * - delivery-box: Package/box
 * - silo: Storage silo
 * - report: Document/report
 * - plan: Blueprint/plan
 * - robot-arm: Industrial robot arm
 * - oil-barrel: Oil/liquid barrel
 * - smart-factory: Smart factory building
 */

export default FactoryIcon;
