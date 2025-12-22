import { useState } from 'react';
import { Icon, SearchBox } from '../../common';

const initialProductsData = [
    { id: 1, statusQB: 'synced', name: 'Executive Desk', description: 'Wooden desk with walnut finish', status: 'Active', costPrice: 2500.00, price: 4500.00, account: 'Inventory Asset', currency: 'MXN' },
    { id: 2, statusQB: 'synced', name: 'Modular Bookshelf', description: '5-tier bookshelf with doors', status: 'Active', costPrice: 1800.00, price: 3200.00, account: 'Inventory Asset', currency: 'MXN' },
    { id: 3, statusQB: 'pending', name: 'Coffee Table', description: 'Rectangular table with metal base', status: 'Active', costPrice: 950.00, price: 1750.00, account: 'Inventory Asset', currency: 'MXN' },
    { id: 4, statusQB: 'error', name: 'Built-in Closet', description: 'Closet with sliding doors', status: 'Inactive', costPrice: 8500.00, price: 15000.00, account: 'Inventory Asset', currency: 'MXN' },
    { id: 5, statusQB: 'synced', name: 'Mobile Drawer Unit', description: '3-drawer unit with wheels', status: 'Active', costPrice: 650.00, price: 1200.00, account: 'Inventory Asset', currency: 'MXN' },
];

const productStatusOptions = ['Active', 'Inactive'];
const currencyOptions = ['USD', 'MXN'];
const accountOptions = ['Inventory Asset', 'Cost of Goods Sold', 'Supplies Expense'];

const ProductsModule = () => {
    const [products, setProducts] = useState(initialProductsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', status: 'Active', costPrice: '', price: '', account: 'Inventory Asset', currency: 'MXN'
    });

    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: '#10b981' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b' };
            case 'error': return { icon: 'error', color: '#ef4444' };
            default: return { icon: 'help', color: '#64748b' };
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key]).toLowerCase();
        const bVal = String(b[sortConfig.key]).toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(sortedProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateProduct = () => {
        if (!newProduct.name) return;
        const product = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...newProduct,
            statusQB: 'pending',
            costPrice: parseFloat(newProduct.costPrice) || 0,
            price: parseFloat(newProduct.price) || 0
        };
        setProducts([...products, product]);
        resetForm();
    };

    const handleUpdateProduct = () => {
        if (!newProduct.name) return;
        setProducts(products.map(p => p.id === editingProduct.id ? {
            ...p,
            ...newProduct,
            costPrice: parseFloat(newProduct.costPrice) || 0,
            price: parseFloat(newProduct.price) || 0
        } : p));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedProducts.length === 0) return;
        setProducts(products.filter(p => !selectedProducts.includes(p.id)));
        setSelectedProducts([]);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setNewProduct({
            name: product.name,
            description: product.description || '',
            status: product.status,
            costPrice: product.costPrice?.toString() || '',
            price: product.price?.toString() || '',
            account: product.account || 'Inventory Asset',
            currency: product.currency || 'MXN'
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewProduct({ name: '', description: '', status: 'Active', costPrice: '', price: '', account: 'Inventory Asset', currency: 'MXN' });
        setEditingProduct(null);
    };

    // Calculate stats
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'Active').length;
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const avgPrice = totalProducts > 0 ? Math.round(totalValue / totalProducts) : 0;

    return (
        <div className="module-page products-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">category</span>
                    </div>
                    <div className="header-text">
                        <h1>Products</h1>
                        <p>Manage your product catalog</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add new product
                </button>
            </div>

            {/* Numeralia Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon pink">
                        <Icon name="category" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalProducts}</span>
                        <span className="stat-label">Total Products</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeProducts}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="payments" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${totalValue.toLocaleString()}</span>
                        <span className="stat-label">Total Value</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="calculate" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${avgPrice.toLocaleString()}</span>
                        <span className="stat-label">Avg. Price</span>
                    </div>
                </div>
            </div>

            <div className="products-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search..."
                    className="products-search"
                />
                {selectedProducts.length > 0 && (
                    <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                        <Icon name="delete" />
                        Delete ({selectedProducts.length})
                    </button>
                )}
            </div>

            <div className="products-table-container">
                <div className="products-table">
                    <div className="products-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={sortedProducts.length > 0 && selectedProducts.length === sortedProducts.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-status-qb">
                            <Icon name="schedule" />
                            Status QB
                        </span>
                        <span className="col-name sortable" onClick={() => handleSort('name')}>
                            <Icon name="inventory_2" />
                            Name
                            <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-description sortable" onClick={() => handleSort('description')}>
                            Description
                            <Icon name={sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-prod-status sortable" onClick={() => handleSort('status')}>
                            <Icon name="schedule" />
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-actions">Actions</span>
                    </div>

                    <div className="products-table-body">
                        {sortedProducts.map((product) => {
                            const qbStatus = getQBStatusIcon(product.statusQB);
                            return (
                                <div key={product.id} className="products-table-row">
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.id)}
                                            onChange={() => handleSelectProduct(product.id)}
                                        />
                                    </span>
                                    <span className="col-status-qb">
                                        <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                    </span>
                                    <span className="col-name">{product.name}</span>
                                    <span className="col-description">{product.description}</span>
                                    <span className={`col-prod-status status-badge ${product.status.toLowerCase()}`}>
                                        <span className="status-dot"></span>
                                        {product.status}
                                    </span>
                                    <span className="col-actions">
                                        <button className="btn-action-edit" onClick={() => handleEditProduct(product)}>
                                            <Icon name="edit" />
                                        </button>
                                    </span>
                                </div>
                            );
                        })}

                        {sortedProducts.length === 0 && (
                            <div className="products-empty">
                                <Icon name="inventory_2" />
                                <p>No products found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="table-footer-simple">
                <span>{sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-product" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="add_box" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                                <p>Create a new product</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="modal-body">
                            <h4 className="form-section-title">Basic information</h4>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="Product name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <div className="status-select">
                                        <select
                                            value={newProduct.status}
                                            onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                                        >
                                            {productStatusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Product description..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cost Price</label>
                                    <div className="price-input">
                                        <span className="price-prefix">$</span>
                                        <input
                                            type="number"
                                            value={newProduct.costPrice}
                                            onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Price</label>
                                    <div className="price-input">
                                        <span className="price-prefix">$</span>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Account</label>
                                    <select
                                        value={newProduct.account}
                                        onChange={(e) => setNewProduct({ ...newProduct, account: e.target.value })}
                                    >
                                        {accountOptions.map(acc => (
                                            <option key={acc} value={acc}>{acc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select
                                        value={newProduct.currency}
                                        onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                                    >
                                        {currencyOptions.map(curr => (
                                            <option key={curr} value={curr}>{curr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                                disabled={!newProduct.name}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingProduct ? 'Update product' : 'Create product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsModule;
