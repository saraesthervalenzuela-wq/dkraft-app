import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';

const WorkCentersModule = () => {
    // Tab state: 'departments' or 'operations'
    const [activeTab, setActiveTab] = useState('departments');

    // Data states
    const [departments, setDepartments] = useState([]);
    const [operations, setOperations] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Selection states
    const [selectedItems, setSelectedItems] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Form states
    const [newDepartment, setNewDepartment] = useState({ name: '', description: '', status: 'ACTIVE' });
    const [newOperation, setNewOperation] = useState({
        name: '',
        department_id: '',
        cost_per_hour: 0,
        standard_time_minutes: 0,
        description: '',
        status: 'ACTIVE'
    });

    // Load from Supabase
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[WorkCenters] Loading from Supabase...');

            // Load both in parallel
            const [deptRes, opsRes] = await Promise.all([
                supabase.from('departments').select('*').order('name'),
                supabase.from('operations').select('*, departments(name)').order('name'),
            ]);

            if (deptRes.error) throw deptRes.error;
            console.log('[WorkCenters] Loaded:', deptRes.data?.length, 'departments');
            setDepartments(deptRes.data || []);

            if (opsRes.error) throw opsRes.error;
            console.log('[WorkCenters] Loaded:', opsRes.data?.length, 'operations');
            setOperations(opsRes.data || []);
        } catch (error) {
            console.error('[WorkCenters] Error loading:', error);
            setToast({ message: 'Error loading data: ' + error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // Filtered and sorted data
    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredOperations = operations.filter(op =>
        op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.departments?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedDepartments = [...filteredDepartments].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key] || '').toLowerCase();
        const bVal = String(b[sortConfig.key] || '').toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const sortedOperations = [...filteredOperations].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aVal, bVal;
        if (sortConfig.key === 'department') {
            aVal = (a.departments?.name || '').toLowerCase();
            bVal = (b.departments?.name || '').toLowerCase();
        } else {
            aVal = String(a[sortConfig.key] || '').toLowerCase();
            bVal = String(b[sortConfig.key] || '').toLowerCase();
        }
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
        const items = activeTab === 'departments' ? sortedDepartments : sortedOperations;
        if (e.target.checked) {
            setSelectedItems(items.map(i => i.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // CRUD Operations for Departments
    const handleCreateDepartment = async () => {
        if (!newDepartment.name) return;

        try {
            const { data: saved, error } = await supabase
                .from('departments')
                .insert({
                    name: newDepartment.name,
                    description: newDepartment.description || '',
                    status: newDepartment.status || 'ACTIVE'
                })
                .select()
                .single();

            if (error) throw error;

            setDepartments(prev => [...prev, saved]);
            console.log('[WorkCenters] Department created:', saved.id);
            setToast({ message: 'Department created successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[WorkCenters] Error creating department:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleUpdateDepartment = async () => {
        if (!newDepartment.name) return;

        try {
            const { error } = await supabase
                .from('departments')
                .update({
                    name: newDepartment.name,
                    description: newDepartment.description || '',
                    status: newDepartment.status || 'ACTIVE',
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingItem.id);

            if (error) throw error;

            setDepartments(prev => prev.map(d =>
                d.id === editingItem.id ? { ...d, ...newDepartment } : d
            ));
            console.log('[WorkCenters] Department updated:', editingItem.id);
            setToast({ message: 'Department updated successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[WorkCenters] Error updating department:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    // CRUD Operations for Operations
    const handleCreateOperation = async () => {
        if (!newOperation.name) return;

        try {
            const { data: saved, error } = await supabase
                .from('operations')
                .insert({
                    name: newOperation.name,
                    department_id: newOperation.department_id || null,
                    cost_per_hour: parseFloat(newOperation.cost_per_hour) || 0,
                    standard_time_minutes: parseInt(newOperation.standard_time_minutes) || 0,
                    description: newOperation.description || '',
                    status: newOperation.status || 'ACTIVE'
                })
                .select('*, departments(name)')
                .single();

            if (error) throw error;

            setOperations(prev => [...prev, saved]);
            console.log('[WorkCenters] Operation created:', saved.id);
            setToast({ message: 'Operation created successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[WorkCenters] Error creating operation:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleUpdateOperation = async () => {
        if (!newOperation.name) return;

        try {
            const { error } = await supabase
                .from('operations')
                .update({
                    name: newOperation.name,
                    department_id: newOperation.department_id || null,
                    cost_per_hour: parseFloat(newOperation.cost_per_hour) || 0,
                    standard_time_minutes: parseInt(newOperation.standard_time_minutes) || 0,
                    description: newOperation.description || '',
                    status: newOperation.status || 'ACTIVE',
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingItem.id);

            if (error) throw error;

            // Reload to get updated department relation
            const { data: updated } = await supabase
                .from('operations')
                .select('*, departments(name)')
                .eq('id', editingItem.id)
                .single();

            setOperations(prev => prev.map(op =>
                op.id === editingItem.id ? updated : op
            ));
            console.log('[WorkCenters] Operation updated:', editingItem.id);
            setToast({ message: 'Operation updated successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[WorkCenters] Error updating operation:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    // Delete operations
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;

        const tableName = activeTab === 'departments' ? 'departments' : 'operations';

        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .in('id', selectedItems);

            if (error) throw error;

            if (activeTab === 'departments') {
                setDepartments(prev => prev.filter(d => !selectedItems.includes(d.id)));
            } else {
                setOperations(prev => prev.filter(op => !selectedItems.includes(op.id)));
            }
            setSelectedItems([]);
            console.log('[WorkCenters] Deleted:', selectedItems.length, activeTab);
            setToast({ message: `${selectedItems.length} item(s) deleted!`, type: 'success' });
        } catch (error) {
            console.error('[WorkCenters] Error deleting:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleDeleteSingle = async () => {
        if (!itemToDelete) return;

        const tableName = activeTab === 'departments' ? 'departments' : 'operations';

        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', itemToDelete.id);

            if (error) throw error;

            if (activeTab === 'departments') {
                setDepartments(prev => prev.filter(d => d.id !== itemToDelete.id));
            } else {
                setOperations(prev => prev.filter(op => op.id !== itemToDelete.id));
            }
            console.log('[WorkCenters] Deleted:', itemToDelete.id);
            setToast({ message: 'Item deleted successfully!', type: 'success' });
        } catch (error) {
            console.error('[WorkCenters] Error deleting:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        if (activeTab === 'departments') {
            setNewDepartment({
                name: item.name,
                description: item.description || '',
                status: item.status || 'ACTIVE'
            });
        } else {
            setNewOperation({
                name: item.name,
                department_id: item.department_id || '',
                cost_per_hour: item.cost_per_hour || 0,
                standard_time_minutes: item.standard_time_minutes || 0,
                description: item.description || '',
                status: item.status || 'ACTIVE'
            });
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingItem(null);
        setNewDepartment({ name: '', description: '', status: 'ACTIVE' });
        setNewOperation({
            name: '',
            department_id: '',
            cost_per_hour: 0,
            standard_time_minutes: 0,
            description: '',
            status: 'ACTIVE'
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };

    const formatMinutes = (minutes) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div className="module-page workcenters-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">precision_manufacturing</span>
                    </div>
                    <div className="header-text">
                        <h1>Work Centers</h1>
                        <p>{activeTab === 'departments' ? 'Manage production departments' : 'Configure manufacturing operations and labor costs'}</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    {activeTab === 'departments' ? 'Add Department' : 'Add Operation'}
                </button>
            </div>

            {/* Tabs */}
            <div className="billing-entity-tabs">
                <button
                    className={`entity-tab ${activeTab === 'departments' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('departments');
                        setSelectedItems([]);
                        setSearchTerm('');
                        setSortConfig({ key: null, direction: 'asc' });
                    }}
                >
                    <Icon name="domain" />
                    Departments
                    <span className="tab-count">{departments.length}</span>
                </button>
                <button
                    className={`entity-tab ${activeTab === 'operations' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('operations');
                        setSelectedItems([]);
                        setSearchTerm('');
                        setSortConfig({ key: null, direction: 'asc' });
                    }}
                >
                    <Icon name="build" />
                    Operations
                    <span className="tab-count">{operations.length}</span>
                </button>
            </div>

            <div className="catalog-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={activeTab === 'departments' ? 'Search departments...' : 'Search operations...'}
                    className="catalog-search"
                />
                {selectedItems.length > 0 && (
                    <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                        <Icon name="delete" />
                        Delete ({selectedItems.length})
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            ) : activeTab === 'departments' ? (
                <>
                    <div className="catalog-table">
                        <div className="catalog-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedDepartments.length > 0 && selectedItems.length === sortedDepartments.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-description sortable" onClick={() => handleSort('description')}>
                                Description
                                <Icon name={sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        {sortedDepartments.map((dept) => (
                            <div key={dept.id} className="catalog-table-row">
                                <span className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(dept.id)}
                                        onChange={() => handleSelectItem(dept.id)}
                                    />
                                </span>
                                <span className="col-name">{dept.name}</span>
                                <span className="col-description">{dept.description || '-'}</span>
                                <span className="col-status">
                                    <span className={`status-badge ${dept.status?.toLowerCase()}`}>
                                        {dept.status || 'ACTIVE'}
                                    </span>
                                </span>
                                <span className="col-actions">
                                    <button className="btn-action-edit" onClick={() => handleEditItem(dept)} title="Edit">
                                        <Icon name="edit" />
                                    </button>
                                    <button className="btn-action-delete" onClick={() => {
                                        setItemToDelete(dept);
                                        setShowDeleteConfirm(true);
                                    }} title="Delete">
                                        <Icon name="delete" />
                                    </button>
                                </span>
                            </div>
                        ))}

                        {sortedDepartments.length === 0 && (
                            <div className="catalog-empty">
                                <Icon name="domain_disabled" />
                                <p>No departments found</p>
                            </div>
                        )}
                    </div>

                    <div className="table-footer-simple">
                        <span>{sortedDepartments.length} department{sortedDepartments.length !== 1 ? 's' : ''}</span>
                    </div>
                </>
            ) : (
                <>
                    <div className="catalog-table operations-catalog-table">
                        <div className="catalog-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedOperations.length > 0 && selectedItems.length === sortedOperations.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Operation
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-department sortable" onClick={() => handleSort('department')}>
                                Department
                                <Icon name={sortConfig.key === 'department' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-cost sortable" onClick={() => handleSort('cost_per_hour')}>
                                Cost/Hour
                                <Icon name={sortConfig.key === 'cost_per_hour' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-time sortable" onClick={() => handleSort('standard_time_minutes')}>
                                Std. Time
                                <Icon name={sortConfig.key === 'standard_time_minutes' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        {sortedOperations.map((op) => (
                            <div key={op.id} className="catalog-table-row">
                                <span className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(op.id)}
                                        onChange={() => handleSelectItem(op.id)}
                                    />
                                </span>
                                <span className="col-name">{op.name}</span>
                                <span className="col-department">
                                    {op.departments?.name || <span className="text-muted">No department</span>}
                                </span>
                                <span className="col-cost">{formatCurrency(op.cost_per_hour)}</span>
                                <span className="col-time">{formatMinutes(op.standard_time_minutes)}</span>
                                <span className="col-status">
                                    <span className={`status-badge ${op.status?.toLowerCase()}`}>
                                        {op.status || 'ACTIVE'}
                                    </span>
                                </span>
                                <span className="col-actions">
                                    <button className="btn-action-edit" onClick={() => handleEditItem(op)} title="Edit">
                                        <Icon name="edit" />
                                    </button>
                                    <button className="btn-action-delete" onClick={() => {
                                        setItemToDelete(op);
                                        setShowDeleteConfirm(true);
                                    }} title="Delete">
                                        <Icon name="delete" />
                                    </button>
                                </span>
                            </div>
                        ))}

                        {sortedOperations.length === 0 && (
                            <div className="catalog-empty">
                                <Icon name="build_circle" />
                                <p>No operations found</p>
                            </div>
                        )}
                    </div>

                    <div className="table-footer-simple">
                        <span>{sortedOperations.length} operation{sortedOperations.length !== 1 ? 's' : ''}</span>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && itemToDelete && (
                <Modal
                    isOpen={showDeleteConfirm}
                    onClose={() => {
                        setShowDeleteConfirm(false);
                        setItemToDelete(null);
                    }}
                    title="Confirm Delete"
                    size="small"
                >
                    <div className="delete-confirmation">
                        <div className="delete-icon">
                            <Icon name="warning" />
                        </div>
                        <p>Are you sure you want to delete <strong>{itemToDelete.name}</strong>?</p>
                        <p className="warning-text">This action cannot be undone.</p>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => {
                                setShowDeleteConfirm(false);
                                setItemToDelete(null);
                            }}>
                                Cancel
                            </button>
                            <button className="btn-modal-delete" onClick={handleDeleteSingle}>
                                <Icon name="delete" />
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-catalog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name={activeTab === 'departments' ? 'domain' : 'build'} />
                            </div>
                            <div className="modal-header-text">
                                <h3>
                                    {editingItem
                                        ? `Edit ${activeTab === 'departments' ? 'Department' : 'Operation'}`
                                        : `New ${activeTab === 'departments' ? 'Department' : 'Operation'}`
                                    }
                                </h3>
                                <p>
                                    {editingItem
                                        ? `Update ${activeTab === 'departments' ? 'department' : 'operation'} details`
                                        : `Add a new ${activeTab === 'departments' ? 'department' : 'operation'}`
                                    }
                                </p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="modal-body">
                            {activeTab === 'departments' ? (
                                <>
                                    <div className="form-group">
                                        <label>Name *</label>
                                        <input
                                            type="text"
                                            value={newDepartment.name}
                                            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                                            placeholder="Department name"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={newDepartment.description}
                                            onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                                            placeholder="Department description..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={newDepartment.status}
                                            onChange={(e) => setNewDepartment({ ...newDepartment, status: e.target.value })}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Operation Name *</label>
                                        <input
                                            type="text"
                                            value={newOperation.name}
                                            onChange={(e) => setNewOperation({ ...newOperation, name: e.target.value })}
                                            placeholder="Operation name"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <select
                                            value={newOperation.department_id}
                                            onChange={(e) => setNewOperation({ ...newOperation, department_id: e.target.value })}
                                        >
                                            <option value="">Select department...</option>
                                            {departments.filter(d => d.status === 'ACTIVE').map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Cost per Hour (USD)</label>
                                            <input
                                                type="number"
                                                value={newOperation.cost_per_hour}
                                                onChange={(e) => setNewOperation({ ...newOperation, cost_per_hour: e.target.value })}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Standard Time (minutes)</label>
                                            <input
                                                type="number"
                                                value={newOperation.standard_time_minutes}
                                                onChange={(e) => setNewOperation({ ...newOperation, standard_time_minutes: e.target.value })}
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={newOperation.description}
                                            onChange={(e) => setNewOperation({ ...newOperation, description: e.target.value })}
                                            placeholder="Operation description..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={newOperation.status}
                                            onChange={(e) => setNewOperation({ ...newOperation, status: e.target.value })}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={
                                    activeTab === 'departments'
                                        ? (editingItem ? handleUpdateDepartment : handleCreateDepartment)
                                        : (editingItem ? handleUpdateOperation : handleCreateOperation)
                                }
                                disabled={activeTab === 'departments' ? !newDepartment.name : !newOperation.name}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingItem ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default WorkCentersModule;
