import Icon from './Icon';

/**
 * Pagination Component
 * Reusable pagination with rows per page selector
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
        <div className="pagination-container">
            <div className="pagination-count">
                Showing {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} of {totalItems} result{totalItems !== 1 ? 's' : ''}
            </div>
            <div className="pagination-controls">
                <div className="rows-per-page">
                    <span>Rows per page</span>
                    <select
                        value={rowsPerPage}
                        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                    >
                        {rowsOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
                <div className="page-info">
                    Page {currentPage} of {totalPages || 1}
                </div>
                <div className="page-controls">
                    <button onClick={() => onPageChange(1)} disabled={currentPage === 1}>
                        <Icon name="first_page" />
                    </button>
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                        <Icon name="chevron_left" />
                    </button>
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
                        <Icon name="chevron_right" />
                    </button>
                    <button onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages}>
                        <Icon name="last_page" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
