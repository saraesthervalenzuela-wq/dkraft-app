import { useState, useEffect } from 'react';
import { Icon, SearchBox, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';

const UnitsModule = () => {
    const [units, setUnits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from Supabase
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Units] Loading from Supabase...');
            const { data, error } = await supabase
                .from('units')
                .select('*')
                .order('name');

            if (error) throw error;
            console.log('[Units] Loaded:', data?.length, 'units');
            setUnits(data || []);
        } catch (error) {
            console.error('[Units] Error loading:', error);
            setUnits([]);
        } finally {
            setIsLoading(false);
        }
    };
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [newUnit, setNewUnit] = useState({ name: '', description: '' });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState(null);

    const filteredUnits = units.filter(unit =>
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUnits = [...filteredUnits].sort((a, b) => {
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
            setSelectedUnits(sortedUnits.map(u => u.id));
        } else {
            setSelectedUnits([]);
        }
    };

    const handleSelectUnit = (id) => {
        setSelectedUnits(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateUnit = async () => {
        if (!newUnit.name) return;

        try {
            const unitData = {
                name: newUnit.name,
                description: newUnit.description || '',
            };

            console.log('[Units] Creating in Supabase...');
            const { data: saved, error } = await supabase
                .from('units')
                .insert(unitData)
                .select()
                .single();

            if (error) throw error;

            setUnits([...units, saved]);
            console.log('[Units] Created:', saved.id);
            setToast({ message: 'Unit created successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[Units] Error creating:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleUpdateUnit = async () => {
        if (!newUnit.name) return;

        try {
            const unitData = {
                name: newUnit.name,
                description: newUnit.description || '',
            };

            console.log('[Units] Updating in Supabase...');
            const { error } = await supabase
                .from('units')
                .update({ ...unitData, updated_at: new Date().toISOString() })
                .eq('id', editingUnit.id);

            if (error) throw error;

            setUnits(units.map(u =>
                u.id === editingUnit.id ? { ...u, ...unitData } : u
            ));
            console.log('[Units] Updated:', editingUnit.id);
            setToast({ message: 'Unit updated successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[Units] Error updating:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedUnits.length === 0) return;

        try {
            const { error } = await supabase
                .from('units')
                .delete()
                .in('id', selectedUnits);

            if (error) throw error;

            setUnits(units.filter(u => !selectedUnits.includes(u.id)));
            setSelectedUnits([]);
            console.log('[Units] Deleted:', selectedUnits.length);
            setToast({ message: `${selectedUnits.length} unit(s) deleted!`, type: 'success' });
        } catch (error) {
            console.error('[Units] Error deleting:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleEditUnit = (unit) => {
        setEditingUnit(unit);
        setNewUnit({ name: unit.name, description: unit.description || '' });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewUnit({ name: '', description: '' });
        setEditingUnit(null);
    };

    return (
        <div className="module-page units-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">straighten</span>
                    </div>
                    <div className="header-text">
                        <h1>Units</h1>
                        <p>Manage units of measurement for materials</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add new unit
                </button>
            </div>

            <div className="catalog-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search units..."
                    className="catalog-search"
                />
                {selectedUnits.length > 0 && (
                    <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                        <Icon name="delete" />
                        Delete ({selectedUnits.length})
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading units...</p>
                </div>
            ) : (
            <>
            <div className="catalog-table">
                <div className="catalog-table-header">
                    <span className="col-checkbox">
                        <input
                            type="checkbox"
                            checked={sortedUnits.length > 0 && selectedUnits.length === sortedUnits.length}
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
                    <span className="col-actions">Actions</span>
                </div>

                {sortedUnits.map((unit) => (
                    <div key={unit.id} className="catalog-table-row">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedUnits.includes(unit.id)}
                                onChange={() => handleSelectUnit(unit.id)}
                            />
                        </span>
                        <span className="col-name">{unit.name}</span>
                        <span className="col-description">{unit.description}</span>
                        <span className="col-actions">
                            <button className="btn-action-edit" onClick={() => handleEditUnit(unit)} title="Edit">
                                <Icon name="edit" />
                            </button>
                            <button className="btn-action-delete" onClick={() => {
                                setUnitToDelete(unit);
                                setShowDeleteConfirm(true);
                            }} title="Delete">
                                <Icon name="delete" />
                            </button>
                        </span>
                    </div>
                ))}

                {sortedUnits.length === 0 && (
                    <div className="catalog-empty">
                        <Icon name="straighten" />
                        <p>No units found</p>
                    </div>
                )}
            </div>

            <div className="table-footer-simple">
                <span>{sortedUnits.length} unit{sortedUnits.length !== 1 ? 's' : ''}</span>
            </div>
            </>
            )}

            {showDeleteConfirm && unitToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon warning">
                                <Icon name="warning" />
                            </div>
                            <div className="modal-header-text">
                                <h3>Confirm Delete</h3>
                                <p>This action cannot be undone</p>
                            </div>
                            <button className="modal-close" onClick={() => {
                                setShowDeleteConfirm(false);
                                setUnitToDelete(null);
                            }}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{unitToDelete.name}</strong>?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => {
                                setShowDeleteConfirm(false);
                                setUnitToDelete(null);
                            }}>
                                Cancel
                            </button>
                            <button className="btn-modal-delete" onClick={async () => {
                                try {
                                    const { error } = await supabase
                                        .from('units')
                                        .delete()
                                        .eq('id', unitToDelete.id);

                                    if (error) throw error;

                                    setUnits(units.filter(u => u.id !== unitToDelete.id));
                                    console.log('[Units] Deleted:', unitToDelete.id);
                                    setToast({ message: 'Unit deleted successfully!', type: 'success' });
                                } catch (error) {
                                    console.error('[Units] Error deleting:', error);
                                    setToast({ message: 'Error: ' + error.message, type: 'error' });
                                }
                                setShowDeleteConfirm(false);
                                setUnitToDelete(null);
                            }}>
                                <Icon name="delete" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-catalog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="straighten" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingUnit ? 'Edit Unit' : 'New Unit'}</h3>
                                <p>{editingUnit ? 'Update unit details' : 'Add a new unit of measurement'}</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={newUnit.name}
                                    onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                                    placeholder="Unit name"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newUnit.description}
                                    onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                                    placeholder="Unit description..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={editingUnit ? handleUpdateUnit : handleCreateUnit}
                                disabled={!newUnit.name}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingUnit ? 'Update unit' : 'Create unit'}
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

export default UnitsModule;
