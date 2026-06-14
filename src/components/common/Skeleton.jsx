/**
 * Skeleton Loaders - Sexy shimmer effect
 * Use these instead of spinners for better UX
 */

import './Skeleton.css';

// Basic skeleton shapes
export const Skeleton = ({
    width = '100%',
    height = '1rem',
    radius = '8px',
    className = ''
}) => (
    <div
        className={`skeleton ${className}`}
        style={{ width, height, borderRadius: radius }}
    />
);

// Text line skeleton
export const SkeletonText = ({ lines = 3, className = '' }) => (
    <div className={`skeleton-text ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                width={i === lines - 1 ? '60%' : '100%'}
                height="0.875rem"
                className="skeleton-line"
            />
        ))}
    </div>
);

// Avatar/Circle skeleton
export const SkeletonAvatar = ({ size = '40px', className = '' }) => (
    <Skeleton width={size} height={size} radius="50%" className={className} />
);

// Card skeleton
export const SkeletonCard = ({ className = '' }) => (
    <div className={`skeleton-card ${className}`}>
        <div className="skeleton-card-header">
            <SkeletonAvatar size="48px" />
            <div className="skeleton-card-title">
                <Skeleton width="140px" height="1rem" />
                <Skeleton width="100px" height="0.75rem" />
            </div>
        </div>
        <div className="skeleton-card-body">
            <SkeletonText lines={3} />
        </div>
        <div className="skeleton-card-footer">
            <Skeleton width="80px" height="32px" radius="6px" />
            <Skeleton width="80px" height="32px" radius="6px" />
        </div>
    </div>
);

// Table row skeleton
export const SkeletonTableRow = ({ columns = 5, className = '' }) => (
    <div className={`skeleton-table-row ${className}`}>
        {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
                key={i}
                width={i === 0 ? '40px' : i === columns - 1 ? '100px' : '80%'}
                height="1rem"
            />
        ))}
    </div>
);

// Table skeleton
export const SkeletonTable = ({ rows = 5, columns = 5, className = '' }) => (
    <div className={`skeleton-table ${className}`}>
        <div className="skeleton-table-header">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} width="80%" height="0.75rem" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
        ))}
    </div>
);

// Stats card skeleton
export const SkeletonStat = ({ className = '' }) => (
    <div className={`skeleton-stat ${className}`}>
        <Skeleton width="48px" height="48px" radius="12px" />
        <div className="skeleton-stat-content">
            <Skeleton width="60px" height="1.5rem" />
            <Skeleton width="80px" height="0.75rem" />
        </div>
    </div>
);

// Stats row skeleton
export const SkeletonStatsRow = ({ count = 4, className = '' }) => (
    <div className={`skeleton-stats-row ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonStat key={i} />
        ))}
    </div>
);

// Form skeleton
export const SkeletonForm = ({ fields = 4, className = '' }) => (
    <div className={`skeleton-form ${className}`}>
        {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="skeleton-form-field">
                <Skeleton width="100px" height="0.75rem" />
                <Skeleton width="100%" height="40px" radius="8px" />
            </div>
        ))}
        <div className="skeleton-form-actions">
            <Skeleton width="100px" height="40px" radius="8px" />
            <Skeleton width="120px" height="40px" radius="8px" />
        </div>
    </div>
);

// Chart skeleton
export const SkeletonChart = ({ type = 'bar', className = '' }) => (
    <div className={`skeleton-chart skeleton-chart-${type} ${className}`}>
        {type === 'bar' && (
            <div className="skeleton-chart-bars">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        width="40px"
                        height={`${30 + Math.random() * 70}%`}
                        radius="4px 4px 0 0"
                    />
                ))}
            </div>
        )}
        {type === 'line' && (
            <div className="skeleton-chart-line">
                <svg viewBox="0 0 300 100" preserveAspectRatio="none">
                    <path
                        d="M0,80 Q50,20 100,60 T200,40 T300,70"
                        fill="none"
                        className="skeleton-path"
                    />
                </svg>
            </div>
        )}
        {type === 'donut' && (
            <div className="skeleton-chart-donut">
                <Skeleton width="150px" height="150px" radius="50%" />
                <div className="skeleton-donut-hole" />
            </div>
        )}
    </div>
);

// Page loading skeleton
export const SkeletonPage = ({ className = '' }) => (
    <div className={`skeleton-page ${className}`}>
        {/* Header */}
        <div className="skeleton-page-header">
            <div className="skeleton-page-title">
                <Skeleton width="48px" height="48px" radius="12px" />
                <div>
                    <Skeleton width="200px" height="1.5rem" />
                    <Skeleton width="300px" height="0.875rem" />
                </div>
            </div>
            <Skeleton width="140px" height="44px" radius="8px" />
        </div>

        {/* Stats */}
        <SkeletonStatsRow count={4} />

        {/* Toolbar */}
        <div className="skeleton-toolbar">
            <Skeleton width="300px" height="44px" radius="8px" />
            <Skeleton width="120px" height="44px" radius="8px" />
        </div>

        {/* Table */}
        <SkeletonTable rows={8} columns={6} />
    </div>
);

// Module loading skeleton (for lazy loading)
export const SkeletonModule = ({ type = 'table', className = '' }) => {
    switch (type) {
        case 'cards':
            return (
                <div className={`skeleton-module skeleton-module-cards ${className}`}>
                    <div className="skeleton-page-header">
                        <Skeleton width="200px" height="1.5rem" />
                        <Skeleton width="140px" height="44px" radius="8px" />
                    </div>
                    <div className="skeleton-cards-grid">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            );
        case 'dashboard':
            return (
                <div className={`skeleton-module skeleton-module-dashboard ${className}`}>
                    <SkeletonStatsRow count={4} />
                    <div className="skeleton-dashboard-charts">
                        <SkeletonChart type="bar" />
                        <SkeletonChart type="donut" />
                    </div>
                    <SkeletonTable rows={5} columns={5} />
                </div>
            );
        default:
            return <SkeletonPage className={className} />;
    }
};

export default Skeleton;
