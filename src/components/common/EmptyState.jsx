/**
 * Empty State Component
 * Beautiful, animated empty states for all modules
 */

import './EmptyState.css';

// Pre-defined empty state configurations
const emptyStateConfigs = {
    clients: {
        icon: 'group',
        title: 'No clients yet',
        description: 'Start building your client database by adding your first client.',
        actionText: 'Add First Client',
        actionIcon: 'person_add',
    },
    materials: {
        icon: 'inventory_2',
        title: 'No materials in inventory',
        description: 'Add materials to track your inventory and manage stock levels.',
        actionText: 'Add Material',
        actionIcon: 'add_box',
    },
    products: {
        icon: 'chair',
        title: 'No products created',
        description: 'Create your product catalog with detailed specifications and pricing.',
        actionText: 'Create Product',
        actionIcon: 'add_circle',
    },
    projects: {
        icon: 'folder_special',
        title: 'No active projects',
        description: 'Projects will appear here once created from approved quotations.',
        actionText: 'View Quotations',
        actionIcon: 'request_quote',
    },
    operations: {
        icon: 'precision_manufacturing',
        title: 'No operations scheduled',
        description: 'Operations are created automatically from projects and requisitions.',
        actionText: 'View Projects',
        actionIcon: 'folder_special',
    },
    quotations: {
        icon: 'request_quote',
        title: 'No quotations',
        description: 'Create quotations to send estimates to your clients.',
        actionText: 'New Quotation',
        actionIcon: 'add_shopping_cart',
    },
    requisitions: {
        icon: 'shopping_cart',
        title: 'No sales orders',
        description: 'Sales orders are created when quotations are approved.',
        actionText: 'View Quotations',
        actionIcon: 'request_quote',
    },
    suppliers: {
        icon: 'local_shipping',
        title: 'No suppliers added',
        description: 'Add your material suppliers to manage purchases and lead times.',
        actionText: 'Add Supplier',
        actionIcon: 'add_business',
    },
    warehouses: {
        icon: 'warehouse',
        title: 'No warehouses configured',
        description: 'Set up warehouses to organize and track inventory locations.',
        actionText: 'Add Warehouse',
        actionIcon: 'add_location',
    },
    search: {
        icon: 'search_off',
        title: 'No results found',
        description: 'Try adjusting your search terms or filters.',
        actionText: 'Clear Search',
        actionIcon: 'backspace',
    },
    default: {
        icon: 'inbox',
        title: 'Nothing here yet',
        description: 'This section is empty. Start by adding some data.',
        actionText: 'Get Started',
        actionIcon: 'add',
    },
};

const EmptyState = ({
    type = 'default',
    icon,
    title,
    description,
    actionText,
    actionIcon,
    onAction,
    showAction = true,
    size = 'medium', // small, medium, large
    animated = true,
}) => {
    // Get config based on type or use custom props
    const config = emptyStateConfigs[type] || emptyStateConfigs.default;

    const finalIcon = icon || config.icon;
    const finalTitle = title || config.title;
    const finalDescription = description || config.description;
    const finalActionText = actionText || config.actionText;
    const finalActionIcon = actionIcon || config.actionIcon;

    return (
        <div className={`empty-state empty-state-${size} ${animated ? 'animated' : ''}`}>
            <div className="empty-state-content">
                {/* Decorative background circles */}
                <div className="empty-state-decoration">
                    <div className="decoration-circle circle-1"></div>
                    <div className="decoration-circle circle-2"></div>
                    <div className="decoration-circle circle-3"></div>
                </div>

                {/* Icon */}
                <div className="empty-state-icon">
                    <span className="material-symbols-rounded">{finalIcon}</span>
                </div>

                {/* Text */}
                <h3 className="empty-state-title">{finalTitle}</h3>
                <p className="empty-state-description">{finalDescription}</p>

                {/* Action button */}
                {showAction && onAction && (
                    <button className="empty-state-action" onClick={onAction}>
                        <span className="material-symbols-rounded">{finalActionIcon}</span>
                        {finalActionText}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
