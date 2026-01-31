import Icon from './Icon';

/**
 * Pagination Component
 * Reusable pagination with rows per page selector
 * Now with Tailwind CSS styling
 */
const Pagination = ({
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange,
    rowsOptions = [5, 8, 10, 20]
}) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

    return (
        <div className="pagination-container flex items-center justify-between flex-wrap gap-4 py-4 px-5 border-t border-border-subtle">
            <div className="text-sm text-text-muted">
                Showing <span className="text-text-primary font-medium">{totalItems > 0 ? startIndex + 1 : 0} - {endIndex}</span> of <span className="text-text-primary font-medium">{totalItems}</span> result{totalItems !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Rows per page</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                        className="form-input form-select py-2 px-3 text-sm min-w-[70px]"
                    >
                        {rowsOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
                <div className="text-sm text-text-secondary">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages || 1}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="btn btn-ghost btn-icon"
                        title="First page"
                    >
                        <Icon name="first_page" />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="btn btn-ghost btn-icon"
                        title="Previous page"
                    >
                        <Icon name="chevron_left" />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="btn btn-ghost btn-icon"
                        title="Next page"
                    >
                        <Icon name="chevron_right" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        className="btn btn-ghost btn-icon"
                        title="Last page"
                    >
                        <Icon name="last_page" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
