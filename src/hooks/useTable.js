import { useState, useMemo } from 'react';

/**
 * useTable Hook
 * Reusable hook for table logic: pagination, sorting, filtering, selection
 */
const useTable = (initialData, options = {}) => {
    const {
        defaultRowsPerPage = 8,
        searchKeys = ['name'],
        defaultSortKey = null,
        defaultSortDirection = 'asc'
    } = options;

    const [data, setData] = useState(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
    const [selectedItems, setSelectedItems] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        key: defaultSortKey,
        direction: defaultSortDirection
    });

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowerSearch = searchTerm.toLowerCase();
        return data.filter(item =>
            searchKeys.some(key => {
                const value = item[key];
                return value && value.toString().toLowerCase().includes(lowerSearch);
            })
        );
    }, [data, searchTerm, searchKeys]);

    // Sort filtered data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Paginate sorted data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return sortedData.slice(startIndex, startIndex + rowsPerPage);
    }, [sortedData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);

    // Handlers
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === paginatedData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedData.map(item => item.id));
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleRowsPerPageChange = (rows) => {
        setRowsPerPage(rows);
        setCurrentPage(1);
    };

    // CRUD operations
    const addItem = (item) => {
        const newItem = { ...item, id: Math.max(...data.map(d => d.id), 0) + 1 };
        setData(prev => [...prev, newItem]);
        return newItem;
    };

    const updateItem = (id, updates) => {
        setData(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    const deleteItem = (id) => {
        setData(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => prev.filter(i => i !== id));
    };

    const deleteSelected = () => {
        setData(prev => prev.filter(item => !selectedItems.includes(item.id)));
        setSelectedItems([]);
    };

    return {
        // Data
        data,
        filteredData,
        sortedData,
        paginatedData,

        // Pagination
        currentPage,
        totalPages,
        rowsPerPage,

        // Selection
        selectedItems,

        // Search & Sort
        searchTerm,
        sortConfig,

        // Setters
        setSearchTerm,
        setCurrentPage: handlePageChange,
        setRowsPerPage: handleRowsPerPageChange,

        // Handlers
        handleSort,
        handleSelectItem,
        handleSelectAll,

        // CRUD
        addItem,
        updateItem,
        deleteItem,
        deleteSelected,
        setData
    };
};

export default useTable;
