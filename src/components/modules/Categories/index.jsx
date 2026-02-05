import { useState, useEffect, useRef } from 'react';
import { Icon, SearchBox, Modal, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';

const CategoriesModule = () => {
    // Tab state: 'materials' or 'products'
    const [activeTab, setActiveTab] = useState('materials');

    // Material categories
    const [materialCategories, setMaterialCategories] = useState([]);
    // Product categories
    const [productCategories, setProductCategories] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Load from Supabase
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Categories] Loading from Supabase...');

            // Load both category types in parallel
            const [materialRes, productRes] = await Promise.all([
                supabase.from('categories').select('*').order('name'),
                supabase.from('product_categories').select('*').order('name'),
            ]);

            if (materialRes.error) throw materialRes.error;
            console.log('[Categories] Loaded:', materialRes.data?.length, 'material categories');
            setMaterialCategories(materialRes.data || []);

            // Product categories table might not exist yet
            if (productRes.error) {
                console.warn('[Categories] Product categories table might not exist:', productRes.error.message);
                setProductCategories([]);
            } else {
                console.log('[Categories] Loaded:', productRes.data?.length, 'product categories');
                setProductCategories(productRes.data || []);
            }
        } catch (error) {
            console.error('[Categories] Error loading:', error);
            setMaterialCategories([]);
            setProductCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Get current categories based on active tab
    const categories = activeTab === 'materials' ? materialCategories : productCategories;
    const setCategories = activeTab === 'materials' ? setMaterialCategories : setProductCategories;
    const tableName = activeTab === 'materials' ? 'categories' : 'product_categories';

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

            console.log('[Categories] Creating in Supabase table:', tableName);
            const { data: saved, error } = await supabase
                .from(tableName)
                .insert(categoryData)
                .select()
                .single();

            if (error) throw error;

            // Update the correct state based on active tab
            if (activeTab === 'materials') {
                setMaterialCategories(prev => [...prev, saved]);
            } else {
                setProductCategories(prev => [...prev, saved]);
            }
            console.log('[Categories] Created:', saved.id);
            setToast({ message: 'Category created successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[Categories] Error creating:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleUpdateCategory = async () => {
        if (!newCategory.name) return;

        try {
            const categoryData = {
                name: newCategory.name,
                description: newCategory.description || '',
            };

            console.log('[Categories] Updating in Supabase table:', tableName);
            const { error } = await supabase
                .from(tableName)
                .update({ ...categoryData, updated_at: new Date().toISOString() })
                .eq('id', editingCategory.id);

            if (error) throw error;

            // Update the correct state based on active tab
            if (activeTab === 'materials') {
                setMaterialCategories(prev => prev.map(c =>
                    c.id === editingCategory.id ? { ...c, ...categoryData } : c
                ));
            } else {
                setProductCategories(prev => prev.map(c =>
                    c.id === editingCategory.id ? { ...c, ...categoryData } : c
                ));
            }
            console.log('[Categories] Updated:', editingCategory.id);
            setToast({ message: 'Category updated successfully!', type: 'success' });
            resetForm();
        } catch (error) {
            console.error('[Categories] Error updating:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedCategories.length === 0) return;

        try {
            const { error } = await supabase
                .from(tableName)
                .delete()
                .in('id', selectedCategories);

            if (error) throw error;

            // Update the correct state based on active tab
            if (activeTab === 'materials') {
                setMaterialCategories(prev => prev.filter(c => !selectedCategories.includes(c.id)));
            } else {
                setProductCategories(prev => prev.filter(c => !selectedCategories.includes(c.id)));
            }
            setSelectedCategories([]);
            console.log('[Categories] Deleted:', selectedCategories.length);
            setToast({ message: `${selectedCategories.length} category(ies) deleted!`, type: 'success' });
        } catch (error) {
            console.error('[Categories] Error deleting:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
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
                        <p>{activeTab === 'materials' ? 'Organize your materials into categories' : 'Organize your products into categories'}</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add new category
                </button>
            </div>

            {/* Category Type Tabs */}
            <div className="billing-entity-tabs">
                <button
                    className={`entity-tab ${activeTab === 'materials' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('materials');
                        setSelectedCategories([]);
                        setSearchTerm('');
                    }}
                >
                    <Icon name="inventory_2" />
                    Material Categories
                    <span className="tab-count">{materialCategories.length}</span>
                </button>
                <button
                    className={`entity-tab ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('products');
                        setSelectedCategories([]);
                        setSearchTerm('');
                    }}
                >
                    <Icon name="category" />
                    Product Categories
                    <span className="tab-count">{productCategories.length}</span>
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

            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading categories...</p>
                </div>
            ) : (
            <>
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
            </>
            )}

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
                                    const { error } = await supabase
                                        .from(tableName)
                                        .delete()
                                        .eq('id', categoryToDelete.id);

                                    if (error) throw error;

                                    // Update the correct state based on active tab
                                    if (activeTab === 'materials') {
                                        setMaterialCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
                                    } else {
                                        setProductCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
                                    }
                                    console.log('[Categories] Deleted:', categoryToDelete.id);
                                    setToast({ message: 'Category deleted successfully!', type: 'success' });
                                } catch (error) {
                                    console.error('[Categories] Error deleting:', error);
                                    setToast({ message: 'Error: ' + error.message, type: 'error' });
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
                                <h3>{editingCategory ? 'Edit Category' : `New ${activeTab === 'materials' ? 'Material' : 'Product'} Category`}</h3>
                                <p>{editingCategory ? 'Update category details' : `Add a new category to organize your ${activeTab}`}</p>
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

export default CategoriesModule;
