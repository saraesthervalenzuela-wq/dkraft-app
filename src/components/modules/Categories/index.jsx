import { useState } from 'react';
import { Icon, SearchBox } from '../../common';

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
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

    const handleCreateCategory = () => {
        if (!newCategory.name) return;
        const category = {
            id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
            ...newCategory
        };
        setCategories([...categories, category]);
        resetForm();
    };

    const handleUpdateCategory = () => {
        if (!newCategory.name) return;
        setCategories(categories.map(c =>
            c.id === editingCategory.id ? { ...c, ...newCategory } : c
        ));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedCategories.length === 0) return;
        setCategories(categories.filter(c => !selectedCategories.includes(c.id)));
        setSelectedCategories([]);
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
                            <button className="btn-action-menu" onClick={() => handleEditCategory(category)}>
                                <Icon name="more_horiz" />
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

            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
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
