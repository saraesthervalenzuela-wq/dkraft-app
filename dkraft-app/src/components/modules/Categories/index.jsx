import { useState, useEffect, useRef } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
import { isApiEnabled, categoriesApi } from '../../../services/api';
import { categoriesService } from '../../../lib/supabase';

const initialCategories = [
    { id: 1, name: 'Woods', description: 'All types of wood and plywood materials' },
    { id: 2, name: 'Hardware', description: 'Screws, hinges, slides and other hardware' },
    { id: 3, name: 'Adhesives', description: 'Glues, sealants and bonding materials' },
    { id: 4, name: 'Finishes', description: 'Paints, lacquers and stains' },
    { id: 5, name: 'Panels', description: 'MDF, particle board and composite panels' },
];

const CategoriesModule = () => {
    const [categories, setCategories] = useState(initialCategories);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load from API
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (isApiEnabled()) {
                    const data = await categoriesApi.getAll();
                    if (data?.length > 0) setCategories(data);
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Action menu and delete confirmation states
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const actionMenuRef = useRef(null);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setOpenActionMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedCategories = [...filteredCategories].sort((a, b) => {
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
            setSelectedCategories(sortedCategories.map(c => c.id));
        } else {
            setSelectedCategories([]);
        }
    };

    const handleSelectCategory = (id) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name) return;

        try {
            const categoryData = {
                name: newCategory.name,
                description: newCategory.description || '',
            };

            const saved = await categoriesService.create(categoryData);

            if (!saved || !saved.id) {
                throw new Error('Failed to create category');
            }

            setCategories([...categories, saved]);
            console.log('[Categories] Created:', saved.id);
            resetForm();
        } catch (error) {
            console.error('[Categories] Error creating:', error);
            alert('Error creating category: ' + error.message);
        }
    };

    const handleUpdateCategory = async () => {
        if (!newCategory.name) return;

        try {
            const categoryData = {
                name: newCategory.name,
                description: newCategory.description || '',
            };

            await categoriesService.update(editingCategory.id, categoryData);

            setCategories(categories.map(c =>
                c.id === editingCategory.id ? { ...c, ...categoryData } : c
            ));
            console.log('[Categories] Updated:', editingCategory.id);
            resetForm();
        } catch (error) {
            console.error('[Categories] Error updating:', error);
            alert('Error updating category: ' + error.message);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedCategories.length === 0) return;

        try {
            for (const catId of selectedCategories) {
                await categoriesService.delete(catId);
            }
            setCategories(categories.filter(c => !selectedCategories.includes(c.id)));
            setSelectedCategories([]);
            console.log('[Categories] Deleted:', selectedCategories.length);
        } catch (error) {
            console.error('[Categories] Error deleting:', error);
            alert('Error deleting categories: ' + error.message);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setNewCategory({ name: category.name, description: category.description || '' });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewCategory({ name: '', description: '' });
        setEditingCategory(null);
    };

    return (
        <div className="module-page categories-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">label</span>
                    </div>
                    <div className="header-text">
                        <h1>Categories</h1>
                        <p>Organize your materials into categories</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add new category
                </button>
            </div>

            <div className="catalog-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search categories..."
                    className="catalog-search"
                />
                {selectedCategories.length > 0 && (
                    <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                        <Icon name="delete" />
                        Delete ({selectedCategories.length})
                    </button>
                )}
            </div>

            <div className="catalog-table">
                <div className="catalog-table-header">
                    <span className="col-checkbox">
                        <input
                            type="checkbox"
                            checked={sortedCategories.length > 0 && selectedCategories.length === sortedCategories.length}
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

                {sortedCategories.map((category) => (
                    <div key={category.id} className="catalog-table-row">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(category.id)}
                                onChange={() => handleSelectCategory(category.id)}
                            />
                        </span>
                        <span className="col-name">{category.name}</span>
                        <span className="col-description">{category.description}</span>
                        <span className="col-actions">
                            <button className="btn-action-edit" onClick={() => handleEditCategory(category)} title="Edit">
                                <Icon name="edit" />
                            </button>
                            <button className="btn-action-delete" onClick={() => {
                                setCategoryToDelete(category);
                                setShowDeleteConfirm(true);
                            }} title="Delete">
                                <Icon name="delete" />
                            </button>
                        </span>
                    </div>
                ))}

                {sortedCategories.length === 0 && (
                    <div className="catalog-empty">
                        <Icon name="label_off" />
                        <p>No categories found</p>
                    </div>
                )}
            </div>

            <div className="table-footer-simple">
                <span>{sortedCategories.length} categor{sortedCategories.length !== 1 ? 'ies' : 'y'}</span>
            </div>

            {showDeleteConfirm && categoryToDelete && (
                <Modal
                    isOpen={showDeleteConfirm}
                    onClose={() => {
                        setShowDeleteConfirm(false);
                        setCategoryToDelete(null);
                    }}
                    title="Confirm Delete"
                    size="small"
                >
                    <div className="delete-confirmation">
                        <div className="delete-icon">
                            <Icon name="warning" />
                        </div>
                        <p>Are you sure you want to delete <strong>{categoryToDelete.name}</strong>?</p>
                        <p className="warning-text">This action cannot be undone.</p>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => {
                                setShowDeleteConfirm(false);
                                setCategoryToDelete(null);
                            }}>
                                Cancel
                            </button>
                            <button className="btn-modal-delete" onClick={async () => {
                                try {
                                    await categoriesService.delete(categoryToDelete.id);
                                    setCategories(categories.filter(c => c.id !== categoryToDelete.id));
                                    console.log('[Categories] Deleted:', categoryToDelete.id);
                                } catch (error) {
                                    console.error('[Categories] Error deleting:', error);
                                    alert('Error deleting category: ' + error.message);
                                }
                                setShowDeleteConfirm(false);
                                setCategoryToDelete(null);
                            }}>
                                <Icon name="delete" />
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-catalog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="label" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                                <p>{editingCategory ? 'Update category details' : 'Add a new category to organize your materials'}</p>
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
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    placeholder="Category name"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                    placeholder="Category description..."
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
                                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                disabled={!newCategory.name}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingCategory ? 'Update category' : 'Create category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesModule;
