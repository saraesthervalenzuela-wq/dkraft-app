import { useState } from 'react';
import { Icon, SearchBox } from '../../common';

const initialProjectsData = [
    { id: 1, name: 'ABC Corporate Office', description: 'Corporate office furniture project', status: 'Active', client: 'ABC Corporation', poNumber: 'PO-2024-001', workOrder: 'WO-001', estimateNumber: 'EST-001', terms: 'Net 30', nameAddress: 'ABC Corporation, 123 Main Ave', shipTo: 'North Industrial Zone', contact: 'John Smith - 664 123 4567', salesRep: 'Carlos Mendoza', csr: 'Ana Garcia', subtotal: 45000, tax: 7200, total: 52200 },
    { id: 2, name: 'Pine Grove Residential', description: 'Closets and full kitchen', status: 'Active', client: 'Rodriguez Family', poNumber: 'PO-2024-002', workOrder: 'WO-002', estimateNumber: 'EST-002', terms: 'Net 15', nameAddress: 'Rodriguez Family, 456 Pine St', shipTo: 'Pine Grove Subdivision', contact: 'Maria Rodriguez - 664 987 6543', salesRep: 'Peter Lopez', csr: 'Laura Torres', subtotal: 125000, tax: 20000, total: 145000 },
    { id: 3, name: 'The Terrace Restaurant', description: 'Bar counters and restaurant furniture', status: 'Inactive', client: 'The Terrace SA', poNumber: 'PO-2024-003', workOrder: 'WO-003', estimateNumber: 'EST-003', terms: 'Net 45', nameAddress: 'The Terrace SA, 789 Coastal Blvd', shipTo: 'Downtown Commercial Plaza', contact: 'Robert Fernandez - 664 555 1234', salesRep: 'Carlos Mendoza', csr: 'Ana Garcia', subtotal: 78000, tax: 12480, total: 90480 },
];

const projectStatusOptions = ['Active', 'Inactive', 'Completed', 'On Hold'];
const termsOptions = ['Net 15', 'Net 30', 'Net 45', 'Due on Receipt', 'COD'];

const ProjectsModule = () => {
    const [projects, setProjects] = useState(initialProjectsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingProject, setEditingProject] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [newProject, setNewProject] = useState({
        name: '', description: '', status: 'Active', client: '',
        poNumber: '', workOrder: '', estimateNumber: '', terms: '',
        nameAddress: '', shipTo: '', contact: '',
        salesRep: '', csr: '',
        subtotal: 0, tax: 0, total: 0
    });

    const filteredProjects = projects.filter(proj =>
        proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proj.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedProjects = [...filteredProjects].sort((a, b) => {
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
            setSelectedProjects(sortedProjects.map(p => p.id));
        } else {
            setSelectedProjects([]);
        }
    };

    const handleSelectProject = (id) => {
        setSelectedProjects(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const calculateTotal = (subtotal, tax) => {
        return (parseFloat(subtotal) || 0) + (parseFloat(tax) || 0);
    };

    const handleCreateProject = () => {
        if (!newProject.name) return;
        const project = {
            id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
            ...newProject,
            subtotal: parseFloat(newProject.subtotal) || 0,
            tax: parseFloat(newProject.tax) || 0,
            total: calculateTotal(newProject.subtotal, newProject.tax)
        };
        setProjects([...projects, project]);
        resetForm();
    };

    const handleUpdateProject = () => {
        if (!newProject.name) return;
        setProjects(projects.map(p => p.id === editingProject.id ? {
            ...p,
            ...newProject,
            subtotal: parseFloat(newProject.subtotal) || 0,
            tax: parseFloat(newProject.tax) || 0,
            total: calculateTotal(newProject.subtotal, newProject.tax)
        } : p));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedProjects.length === 0) return;
        setProjects(projects.filter(p => !selectedProjects.includes(p.id)));
        setSelectedProjects([]);
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setNewProject({
            name: project.name,
            description: project.description || '',
            status: project.status,
            client: project.client || '',
            poNumber: project.poNumber || '',
            workOrder: project.workOrder || '',
            estimateNumber: project.estimateNumber || '',
            terms: project.terms || '',
            nameAddress: project.nameAddress || '',
            shipTo: project.shipTo || '',
            contact: project.contact || '',
            salesRep: project.salesRep || '',
            csr: project.csr || '',
            subtotal: project.subtotal?.toString() || '0',
            tax: project.tax?.toString() || '0',
            total: project.total?.toString() || '0'
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewProject({
            name: '', description: '', status: 'Active', client: '',
            poNumber: '', workOrder: '', estimateNumber: '', terms: '',
            nameAddress: '', shipTo: '', contact: '',
            salesRep: '', csr: '',
            subtotal: 0, tax: 0, total: 0
        });
        setEditingProject(null);
    };

    // Calculate stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const totalRevenue = projects.reduce((sum, p) => sum + (p.total || 0), 0);
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    return (
        <div className="module-page projects-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">assignment</span>
                    </div>
                    <div className="header-text">
                        <h1>Projects</h1>
                        <p>Manage your projects</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add new project
                </button>
            </div>

            {/* Numeralia Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon indigo">
                        <Icon name="assignment" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalProjects}</span>
                        <span className="stat-label">Total Projects</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="play_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeProjects}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{completedProjects}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="payments" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${totalRevenue.toLocaleString()}</span>
                        <span className="stat-label">Total Value</span>
                    </div>
                </div>
            </div>

            <div className="projects-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search..."
                    className="projects-search"
                />
                <div className="view-toggle">
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
                {selectedProjects.length > 0 && (
                    <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                        <Icon name="delete" />
                        Delete ({selectedProjects.length})
                    </button>
                )}
            </div>

            {viewMode === 'grid' ? (
                <div className="projects-cards-grid">
                    {sortedProjects.map((project) => (
                        <div key={project.id} className="project-card">
                            <div className="project-card-header">
                                <div className="project-card-icon">
                                    <Icon name="assignment" />
                                </div>
                                <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                                    <span className="status-dot"></span>
                                    {project.status}
                                </span>
                            </div>
                            <div className="project-card-body">
                                <h3 className="project-card-name">{project.name}</h3>
                                <p className="project-card-description">{project.description}</p>
                                <div className="project-card-client">
                                    <Icon name="group" />
                                    <span>{project.client || 'No client assigned'}</span>
                                </div>
                                <div className="project-card-details">
                                    <div className="project-detail">
                                        <Icon name="receipt" />
                                        <span>{project.poNumber}</span>
                                    </div>
                                    <div className="project-detail">
                                        <Icon name="work" />
                                        <span>{project.workOrder}</span>
                                    </div>
                                    <div className="project-detail">
                                        <Icon name="person" />
                                        <span>{project.salesRep}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="project-card-footer">
                                <div className="project-total">
                                    <span className="total-label">Total</span>
                                    <span className="total-value">${project.total?.toLocaleString()}</span>
                                </div>
                                <button className="btn-action-edit" onClick={() => handleEditProject(project)}>
                                    <Icon name="edit" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {sortedProjects.length === 0 && (
                        <div className="projects-empty">
                            <Icon name="assignment" />
                            <p>No projects found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="projects-table-container">
                    <div className="projects-table">
                        <div className="projects-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedProjects.length > 0 && selectedProjects.length === sortedProjects.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                <Icon name="folder" />
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-client sortable" onClick={() => handleSort('client')}>
                                <Icon name="group" />
                                Client
                                <Icon name={sortConfig.key === 'client' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-description sortable" onClick={() => handleSort('description')}>
                                Description
                                <Icon name={sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                <Icon name="schedule" />
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        <div className="projects-table-body">
                            {sortedProjects.map((project) => (
                                <div key={project.id} className="projects-table-row">
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedProjects.includes(project.id)}
                                            onChange={() => handleSelectProject(project.id)}
                                        />
                                    </span>
                                    <span className="col-name">
                                        <div className="name-icon">
                                            <Icon name="folder" />
                                        </div>
                                        {project.name}
                                    </span>
                                    <span className="col-client">{project.client || '-'}</span>
                                    <span className="col-description">{project.description}</span>
                                    <span className="col-status">
                                        <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                                            <span className="status-dot"></span>
                                            {project.status}
                                        </span>
                                    </span>
                                    <span className="col-actions">
                                        <button className="btn-action-edit" onClick={() => handleEditProject(project)}>
                                            <Icon name="edit" />
                                        </button>
                                    </span>
                                </div>
                            ))}

                            {sortedProjects.length === 0 && (
                                <div className="projects-empty">
                                    <Icon name="assignment" />
                                    <p>No projects found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="table-footer-simple">
                <span>{sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-project" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="assignment" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingProject ? 'Edit Project' : 'New Project'}</h3>
                                <p>Create a new project</p>
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
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        placeholder="Project name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <div className="status-select">
                                        <select
                                            value={newProject.status}
                                            onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                                        >
                                            {projectStatusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Client</label>
                                    <input
                                        type="text"
                                        value={newProject.client}
                                        onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                                        placeholder="Client name"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Project description..."
                                    rows={2}
                                />
                            </div>

                            <h4 className="form-section-title">Order information</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>PO Number</label>
                                    <input
                                        type="text"
                                        value={newProject.poNumber}
                                        onChange={(e) => setNewProject({ ...newProject, poNumber: e.target.value })}
                                        placeholder="PO-2024-XXX"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Work Order</label>
                                    <input
                                        type="text"
                                        value={newProject.workOrder}
                                        onChange={(e) => setNewProject({ ...newProject, workOrder: e.target.value })}
                                        placeholder="WO-XXX"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Estimate Number</label>
                                    <input
                                        type="text"
                                        value={newProject.estimateNumber}
                                        onChange={(e) => setNewProject({ ...newProject, estimateNumber: e.target.value })}
                                        placeholder="EST-XXX"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Terms</label>
                                    <select
                                        value={newProject.terms}
                                        onChange={(e) => setNewProject({ ...newProject, terms: e.target.value })}
                                    >
                                        <option value="">Select terms</option>
                                        {termsOptions.map(term => (
                                            <option key={term} value={term}>{term}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <h4 className="form-section-title">Contact and shipping</h4>
                            <div className="form-group">
                                <label>Name/Address</label>
                                <input
                                    type="text"
                                    value={newProject.nameAddress}
                                    onChange={(e) => setNewProject({ ...newProject, nameAddress: e.target.value })}
                                    placeholder="Company name and address"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ship To</label>
                                    <input
                                        type="text"
                                        value={newProject.shipTo}
                                        onChange={(e) => setNewProject({ ...newProject, shipTo: e.target.value })}
                                        placeholder="Shipping address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact</label>
                                    <input
                                        type="text"
                                        value={newProject.contact}
                                        onChange={(e) => setNewProject({ ...newProject, contact: e.target.value })}
                                        placeholder="Contact name and phone"
                                    />
                                </div>
                            </div>

                            <h4 className="form-section-title">Work team</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sales Representative</label>
                                    <input
                                        type="text"
                                        value={newProject.salesRep}
                                        onChange={(e) => setNewProject({ ...newProject, salesRep: e.target.value })}
                                        placeholder="Sales rep name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CSR</label>
                                    <input
                                        type="text"
                                        value={newProject.csr}
                                        onChange={(e) => setNewProject({ ...newProject, csr: e.target.value })}
                                        placeholder="CSR name"
                                    />
                                </div>
                            </div>

                            <h4 className="form-section-title">Financial information</h4>
                            <div className="form-row-3">
                                <div className="form-group">
                                    <label>Subtotal</label>
                                    <div className="price-input">
                                        <span className="price-prefix">$</span>
                                        <input
                                            type="number"
                                            value={newProject.subtotal}
                                            onChange={(e) => setNewProject({ ...newProject, subtotal: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Tax</label>
                                    <div className="price-input">
                                        <span className="price-prefix">$</span>
                                        <input
                                            type="number"
                                            value={newProject.tax}
                                            onChange={(e) => setNewProject({ ...newProject, tax: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Total</label>
                                    <div className="price-input">
                                        <span className="price-prefix">$</span>
                                        <input
                                            type="number"
                                            value={calculateTotal(newProject.subtotal, newProject.tax)}
                                            readOnly
                                            className="input-readonly"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={editingProject ? handleUpdateProject : handleCreateProject}
                                disabled={!newProject.name}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingProject ? 'Update project' : 'Create project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsModule;
