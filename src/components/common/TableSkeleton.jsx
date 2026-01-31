/**
 * TableSkeleton Component
 * Animated loading skeleton for table views
 * Fully built with Tailwind CSS
 */
const TableSkeleton = ({
    rows = 5,
    columns = 5,
    showHeader = true,
    className = ''
}) => {
    return (
        <div className={`w-full ${className}`}>
            {/* Header Skeleton */}
            {showHeader && (
                <div className="flex gap-4 px-4 py-3 mb-2 bg-slate-800/50 rounded-xl border border-white/5">
                    {Array.from({ length: columns }).map((_, i) => (
                        <div
                            key={`header-${i}`}
                            className="h-4 bg-slate-700/50 rounded animate-pulse"
                            style={{ width: `${Math.random() * 60 + 60}px` }}
                        />
                    ))}
                </div>
            )}

            {/* Rows Skeleton */}
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="flex items-center gap-4 px-4 py-4 bg-slate-800/30 rounded-xl border border-white/5"
                        style={{ animationDelay: `${rowIndex * 100}ms` }}
                    >
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="h-4 bg-slate-700/40 rounded animate-pulse"
                                style={{
                                    width: colIndex === 0 ? '80px' :
                                           colIndex === 1 ? '150px' :
                                           `${Math.random() * 80 + 60}px`,
                                    animationDelay: `${(rowIndex * 100) + (colIndex * 50)}ms`
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * CardSkeleton Component
 * Animated loading skeleton for card/grid views
 */
export const CardSkeleton = ({
    count = 6,
    className = ''
}) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={`card-${i}`}
                    className="bg-slate-800/40 rounded-2xl border border-white/5 p-5 space-y-4"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-slate-700/50 rounded-xl animate-pulse" />
                        <div className="w-16 h-5 bg-slate-700/40 rounded-full animate-pulse" />
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <div className="h-5 w-3/4 bg-slate-700/50 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-slate-700/30 rounded animate-pulse" />
                    </div>

                    {/* Details */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-700/40 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-slate-700/30 rounded animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-700/40 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-slate-700/30 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="h-4 w-20 bg-slate-700/30 rounded animate-pulse" />
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-slate-700/40 rounded-lg animate-pulse" />
                            <div className="w-8 h-8 bg-slate-700/40 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * StatsSkeleton Component
 * Animated loading skeleton for stats row
 */
export const StatsSkeleton = ({
    count = 4,
    className = ''
}) => {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={`stat-${i}`}
                    className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 flex items-center gap-4"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    <div className="w-12 h-12 bg-slate-700/50 rounded-xl animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-6 w-16 bg-slate-700/50 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-slate-700/30 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TableSkeleton;
