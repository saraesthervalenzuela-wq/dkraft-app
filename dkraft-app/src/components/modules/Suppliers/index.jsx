import { useState } from 'react';
import { Icon, SearchBox } from '../../common';

const initialSuppliersData = [
    {
        id: 1,
        name: 'Calidevs',
        email: 'biz@calidevs.com',
        status: 'Active',
        phone: '664 354 1662',
        address: '941 Francisco I. Madero Ave, Downtown, 22000 Tijuana, B.C.',
        website: 'https://calidevs.com',
        contact: 'John Smith',
        company: 'Calidevs S.A.',
        zipCode: '22000',
        rfc: 'CAL123456ABC',
        notes: ''
    },
];

const statusOptions = ['Active', 'Inactive', 'Pending'];

const SuppliersModule = () => {
    const [suppliers, setSuppliers] = useState(initialSuppliersData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [newSupplier, setNewSupplier] = useState({
        name: '', email: '', status: 'Active', phone: '', address: '',
        website: '', contact: '', company: '', zipCode: '', rfc: '', notes: ''
    });

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = (a[sortConfig.key] || '').toLowerCase();
        const bVal = (b[sortConfig.key] || '').toLowerCase();
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
            setSelectedSuppliers(sortedSuppliers.map(s => s.id));
        } else {
            setSelectedSuppliers([]);
        }
    };

    const handleSelectSupplier = (id) => {
        setSelectedSuppliers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateSupplier = () => {
        if (!newSupplier.name || !newSupplier.email) return;
        const supplier = {
            id: suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1,
            ...newSupplier
        };
        setSuppliers([...suppliers, supplier]);
        resetForm();
    };

    const handleUpdateSupplier = () => {
        if (!newSupplier.name || !newSupplier.email) return;
        setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...newSupplier } : s));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedSuppliers.length === 0) return;
        setSuppliers(suppliers.filter(s => !selectedSuppliers.includes(s.id)));
        setSelectedSuppliers([]);
    };

    const handleEditSupplier = (supplier) => {
        setEditingSupplier(supplier);
        setNewSupplier({ ...supplier });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewSupplier({
            name: '', email: '', status: 'Active', phone: '', address: '',
            website: '', contact: '', company: '', zipCode: '', rfc: '', notes: ''
        });
        setEditingSupplier(null);
    };

    // Calculate stats
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;
    const pendingSuppliers = suppliers.filter(s => s.status === 'Pending').length;
    const inactiveSuppliers = suppliers.filter(s => s.status === 'Inactive').length;

    return (
        <div className="module-page suppliers-module">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">local_shipping</span>
                    </div>
                    <div className="header-text">
                        <h1>Suppliers</h1>
                        <p>Manage your supplier database</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add new supplier
                </button>
            </div>

            {/* Numeralia Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="local_shipping" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalSuppliers}</span>
                        <span className="stat-label">Total Suppliers</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeSuppliers}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="pending" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{pendingSuppliers}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon red">
                        <Icon name="cancel" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{inactiveSuppliers}</span>
                        <span className="stat-label">Inactive</span>
                    </div>
                </div>
            </div>

            <div className="suppliers-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search..."
                    className="suppliers-search"
                />
                {selectedSuppliers.length > 0 && (
                    <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                        <Icon name="delete" />
                        Delete ({selectedSuppliers.length})
                    </button>
                )}
                <div className="view-toggle-buttons">
                    <button
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                    >
                        <Icon name="grid_view" />
                    </button>
                    <button
                        className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Table view"
                    >
                        <Icon name="view_list" />
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="suppliers-cards-grid">
                    {sortedSuppliers.map((supplier) => (
                        <div key={supplier.id} className="supplier-card">
                            <div className="supplier-card-header">
                                <div className="supplier-avatar">
                                    {supplier.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className={`supplier-status-badge ${supplier.status.toLowerCase()}`}>
                                    {supplier.status}
                                </div>
                            </div>
                            <div className="supplier-card-body">
                                <h3 className="supplier-name">{supplier.name}</h3>
                                <p className="supplier-company">{supplier.company || supplier.name}</p>
                                <div className="supplier-details">
                                    <div className="supplier-detail">
                                        <Icon name="mail" />
                                        <span>{supplier.email}</span>
                                    </div>
                                    <div className="supplier-detail">
                                        <Icon name="phone" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                    <div className="supplier-detail">
                                        <Icon name="location_on" />
                                        <span>{supplier.address}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="supplier-card-footer">
                                <button className="btn-card-action" onClick={() => handleEditSupplier(supplier)}>
                                    <Icon name="edit" />
                                    Edit
                                </button>
                                <button className="btn-card-action secondary">
                                    <Icon name="visibility" />
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                    {sortedSuppliers.length === 0 && (
                        <div className="suppliers-empty-grid">
                            <Icon name="local_shipping" />
                            <p>No suppliers found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="suppliers-table-container">
                    <div className="suppliers-table">
                        <div className="suppliers-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedSuppliers.length > 0 && selectedSuppliers.length === sortedSuppliers.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-email sortable" onClick={() => handleSort('email')}>
                                Email
                                <Icon name={sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-phone sortable" onClick={() => handleSort('phone')}>
                                Phone
                                <Icon name={sortConfig.key === 'phone' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-address sortable" onClick={() => handleSort('address')}>
                                Address
                                <Icon name={sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        <div className="suppliers-table-body">
                            {sortedSuppliers.map((supplier) => (
                                <div key={supplier.id} className="suppliers-table-row">
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedSuppliers.includes(supplier.id)}
                                            onChange={() => handleSelectSupplier(supplier.id)}
                                        />
                                    </span>
                                    <span className="col-name">{supplier.name}</span>
                                    <span className="col-email">{supplier.email}</span>
                                    <span className={`col-status status-badge ${supplier.status.toLowerCase()}`}>
                                        {supplier.status}
                                    </span>
                                    <span className="col-phone">{supplier.phone}</span>
                                    <span className="col-address">{supplier.address}</span>
                                    <span className="col-actions">
                                        <button className="btn-action-edit" onClick={() => handleEditSupplier(supplier)}>
                                            <Icon name="edit" />
                                        </button>
                                    </span>
                                </div>
                            ))}

                            {sortedSuppliers.length === 0 && (
                                <div className="suppliers-empty">
                                    <Icon name="inventory_2" />
                                    <p>No suppliers found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="table-footer-simple">
                <span>{sortedSuppliers.length} supplier{sortedSuppliers.length !== 1 ? 's' : ''}</span>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-supplier" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="inventory_2" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
                                <p>Add a new supplier to your database</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="modal-body modal-body-scroll">
                            <div className="form-section">
                                <h4 className="form-section-title">Basic information</h4>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={newSupplier.name}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                        placeholder="Supplier name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={newSupplier.email}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={newSupplier.phone}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                        placeholder="(555) 555-5555"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Website</label>
                                    <input
                                        type="url"
                                        value={newSupplier.website}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, website: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="form-section-title">Contact information</h4>
                                <div className="form-group">
                                    <label>Contact</label>
                                    <input
                                        type="text"
                                        value={newSupplier.contact}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                                        placeholder="Contact name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        value={newSupplier.address}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                                        placeholder="Address"
                                        rows={3}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Zip code</label>
                                        <input
                                            type="text"
                                            value={newSupplier.zipCode}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, zipCode: e.target.value })}
                                            placeholder="00000"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>RFC</label>
                                        <input
                                            type="text"
                                            value={newSupplier.rfc}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, rfc: e.target.value })}
                                            placeholder="RFC"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="form-section-title">Additional information</h4>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={newSupplier.status}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, status: e.target.value })}
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea
                                        value={newSupplier.notes}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
                                disabled={!newSupplier.name || !newSupplier.email}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingSupplier ? 'Update supplier' : 'Create supplier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersModule;
