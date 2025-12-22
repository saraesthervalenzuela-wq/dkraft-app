import { useState } from 'react';
import { Icon, SearchBox } from '../../common';
import {
    operationsData,
    operationStages,
    operationStatusOptions,
    priorityOptions,
    stageStatusOptions,
    divisionOptions,
    projectsData,
    materialsData,
    staffData
} from '../../../data/initialData';

const OperationsModule = () => {
    const [operations, setOperations] = useState(operationsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOperations, setSelectedOperations] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalTab, setModalTab] = useState('overview');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingOperation, setEditingOperation] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [newOperation, setNewOperation] = useState({
        projectId: '',
        projectName: '',
        workOrderNumber: '',
        status: 'Pending',
        priority: 'Medium',
        dueDate: '',
        assignedDivisions: [],
        notes: '',
        stages: createDefaultStages(),
        materials: []
    });

    // Helper to create default stages
    function createDefaultStages() {
        const stages = {};
        operationStages.forEach(stage => {
            stages[stage.key] = {
                status: 'pending',
                assignedTo: [],
                startDate: '',
                endDate: '',
                estimatedHours: 0,
                actualHours: 0,
                notes: ''
            };
        });
        return stages;
    }

    // Calculate progress from stages
    const calculateProgress = (stages) => {
        const stageKeys = Object.keys(stages);
        const nonSkippedStages = stageKeys.filter(key => stages[key].status !== 'skipped');
        if (nonSkippedStages.length === 0) return 0;
        const completedStages = nonSkippedStages.filter(key => stages[key].status === 'completed').length;
        return Math.round((completedStages / nonSkippedStages.length) * 100);
    };

    // Get current stage label
    const getCurrentStageLabel = (stages) => {
        const inProgress = Object.entries(stages).find(([_, data]) => data.status === 'in_progress');
        if (inProgress) {
            const stageInfo = operationStages.find(s => s.key === inProgress[0]);
            return stageInfo?.label || inProgress[0];
        }
        const pending = Object.entries(stages).find(([_, data]) => data.status === 'pending');
        if (pending) {
            const stageInfo = operationStages.find(s => s.key === pending[0]);
            return stageInfo?.label || pending[0];
        }
        return 'Completed';
    };

    // Filter by tab
    const getFilteredByTab = (ops) => {
        switch (activeTab) {
            case 'in_progress': return ops.filter(o => o.status === 'In Progress');
            case 'pending': return ops.filter(o => o.status === 'Pending');
            case 'completed': return ops.filter(o => o.status === 'Completed');
            default: return ops;
        }
    };

    // Filter and sort
    const filteredOperations = getFilteredByTab(
        operations.filter(op =>
            op.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.status.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const sortedOperations = [...filteredOperations].sort((a, b) => {
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
            setSelectedOperations(sortedOperations.map(o => o.id));
        } else {
            setSelectedOperations([]);
        }
    };

    const handleSelectOperation = (id) => {
        setSelectedOperations(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleEditOperation = (operation) => {
        setEditingOperation(operation);
        setNewOperation({
            projectId: operation.projectId,
            projectName: operation.projectName,
            workOrderNumber: operation.workOrderNumber,
            status: operation.status,
            priority: operation.priority,
            dueDate: operation.dueDate,
            assignedDivisions: [...operation.assignedDivisions],
            notes: operation.notes,
            stages: JSON.parse(JSON.stringify(operation.stages)),
            materials: [...operation.materials]
        });
        setSelectedStage(null);
        setModalTab('overview');
        setShowModal(true);
    };

    const handleCreateOperation = () => {
        if (!newOperation.projectId) return;
        const selectedProject = projectsData.find(p => p.id === parseInt(newOperation.projectId));
        const operation = {
            id: operations.length > 0 ? Math.max(...operations.map(o => o.id)) + 1 : 1,
            ...newOperation,
            projectName: selectedProject?.name || '',
            workOrderNumber: `OP-${new Date().getFullYear()}-${String(operations.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString().split('T')[0],
            currentStage: 'roughMill',
            progress: 0
        };
        setOperations([...operations, operation]);
        resetForm();
    };

    const handleUpdateOperation = () => {
        if (!newOperation.projectId) return;
        const selectedProject = projectsData.find(p => p.id === parseInt(newOperation.projectId));
        const updatedProgress = calculateProgress(newOperation.stages);
        const currentStageKey = Object.entries(newOperation.stages).find(([_, data]) => data.status === 'in_progress')?.[0]
            || Object.entries(newOperation.stages).find(([_, data]) => data.status === 'pending')?.[0]
            || 'shipping';

        setOperations(operations.map(op =>
            op.id === editingOperation.id ? {
                ...op,
                ...newOperation,
                projectName: selectedProject?.name || op.projectName,
                progress: updatedProgress,
                currentStage: currentStageKey
            } : op
        ));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedOperations.length === 0) return;
        setOperations(operations.filter(op => !selectedOperations.includes(op.id)));
        setSelectedOperations([]);
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingOperation(null);
        setSelectedStage(null);
        setModalTab('overview');
        setNewOperation({
            projectId: '',
            projectName: '',
            workOrderNumber: '',
            status: 'Pending',
            priority: 'Medium',
            dueDate: '',
            assignedDivisions: [],
            notes: '',
            stages: createDefaultStages(),
            materials: []
        });
    };

    const handleDivisionToggle = (division) => {
        setNewOperation(prev => ({
            ...prev,
            assignedDivisions: prev.assignedDivisions.includes(division)
                ? prev.assignedDivisions.filter(d => d !== division)
                : [...prev.assignedDivisions, division]
        }));
    };

    const handleStageUpdate = (stageKey, field, value) => {
        setNewOperation(prev => ({
            ...prev,
            stages: {
                ...prev.stages,
                [stageKey]: {
                    ...prev.stages[stageKey],
                    [field]: value
                }
            }
        }));
    };

    const handleStaffToggle = (stageKey, staffId) => {
        const currentStaff = newOperation.stages[stageKey].assignedTo;
        const newStaff = currentStaff.includes(staffId)
            ? currentStaff.filter(id => id !== staffId)
            : [...currentStaff, staffId];
        handleStageUpdate(stageKey, 'assignedTo', newStaff);
    };

    const handleAddMaterial = () => {
        const availableMaterials = materialsData.filter(m =>
            !newOperation.materials.find(om => om.materialId === m.id)
        );
        if (availableMaterials.length === 0) return;
        const firstAvailable = availableMaterials[0];
        setNewOperation(prev => ({
            ...prev,
            materials: [
                ...prev.materials,
                {
                    materialId: firstAvailable.id,
                    materialName: firstAvailable.name,
                    estimated: 0,
                    distributed: 0,
                    unit: firstAvailable.unit
                }
            ]
        }));
    };

    const handleMaterialUpdate = (index, field, value) => {
        setNewOperation(prev => {
            const updatedMaterials = [...prev.materials];
            if (field === 'materialId') {
                const material = materialsData.find(m => m.id === parseInt(value));
                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    materialId: parseInt(value),
                    materialName: material?.name || '',
                    unit: material?.unit || ''
                };
            } else {
                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    [field]: field === 'estimated' || field === 'distributed' ? parseFloat(value) || 0 : value
                };
            }
            return { ...prev, materials: updatedMaterials };
        });
    };

    const handleRemoveMaterial = (index) => {
        setNewOperation(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index)
        }));
    };

    const getStaffName = (staffId) => {
        const staff = staffData.find(s => s.id === staffId);
        return staff?.name || `Staff #${staffId}`;
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'Urgent': return 'priority-urgent';
            case 'High': return 'priority-high';
            case 'Medium': return 'priority-medium';
            case 'Low': return 'priority-low';
            default: return '';
        }
    };

    const getStageStatusClass = (status) => {
        switch (status) {
            case 'completed': return 'stage-completed';
            case 'in_progress': return 'stage-in-progress';
            case 'skipped': return 'stage-skipped';
            default: return 'stage-pending';
        }
    };

    const tabCounts = {
        all: operations.length,
        in_progress: operations.filter(o => o.status === 'In Progress').length,
        pending: operations.filter(o => o.status === 'Pending').length,
        completed: operations.filter(o => o.status === 'Completed').length
    };

    // Calculate avg progress
    const avgProgress = operations.length > 0
        ? Math.round(operations.reduce((sum, o) => sum + o.progress, 0) / operations.length)
        : 0;

    return (
        <div className="module-page operations-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">engineering</span>
                    </div>
                    <div className="header-text">
                        <h1>Operations</h1>
                        <p>Manage production workflow and track progress</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    New Operation
                </button>
            </div>

            {/* Numeralia Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon cyan">
                        <Icon name="engineering" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{tabCounts.all}</span>
                        <span className="stat-label">Total Operations</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="play_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{tabCounts.in_progress}</span>
                        <span className="stat-label">In Progress</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{tabCounts.completed}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="speed" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{avgProgress}%</span>
                        <span className="stat-label">Avg. Progress</span>
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="operations-tabs-grid">
                {[
                    { key: 'all', label: 'All Operations', icon: 'engineering', desc: 'View all work orders', color: 'cyan', stat: `${tabCounts.all} Total` },
                    { key: 'in_progress', label: 'In Progress', icon: 'play_circle', desc: 'Currently active', color: 'blue', stat: `${tabCounts.in_progress} Active` },
                    { key: 'pending', label: 'Pending', icon: 'schedule', desc: 'Waiting to start', color: 'orange', stat: `${tabCounts.pending} Pending` },
                    { key: 'completed', label: 'Completed', icon: 'check_circle', desc: 'Finished operations', color: 'green', stat: `${tabCounts.completed} Done` }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`operations-tab-card ${activeTab === tab.key ? 'active' : ''} ${tab.color}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <div className="operations-tab-top">
                            <div className={`operations-tab-icon ${tab.color}`}>
                                <Icon name={tab.icon} />
                            </div>
                            <div className={`operations-tab-arrow ${tab.color}`}>
                                <Icon name="arrow_forward" />
                            </div>
                        </div>
                        <div className="operations-tab-content">
                            <span className="operations-tab-label">{tab.label}</span>
                            <span className="operations-tab-desc">{tab.desc}</span>
                        </div>
                        <div className="operations-tab-stat">{tab.stat}</div>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="operations-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search operations..."
                    className="operations-search"
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
                {selectedOperations.length > 0 && (
                    <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                        <Icon name="delete" />
                        Delete ({selectedOperations.length})
                    </button>
                )}
            </div>

            {viewMode === 'grid' ? (
                <div className="operations-cards-grid">
                    {sortedOperations.map((operation) => (
                        <div key={operation.id} className="operation-card">
                            <div className="operation-card-header">
                                <div className="operation-card-icon">
                                    <Icon name="engineering" />
                                </div>
                                <div className="operation-card-badges">
                                    <span className={`priority-badge ${getPriorityClass(operation.priority)}`}>
                                        {operation.priority}
                                    </span>
                                </div>
                            </div>
                            <div className="operation-card-body">
                                <h3 className="operation-card-wo">{operation.workOrderNumber}</h3>
                                <p className="operation-card-project">{operation.projectName}</p>
                                <div className="operation-card-stage">
                                    <span className={`stage-badge ${getStageStatusClass(operation.stages[operation.currentStage]?.status)}`}>
                                        {getCurrentStageLabel(operation.stages)}
                                    </span>
                                </div>
                                <div className="operation-card-progress">
                                    <div className="progress-info">
                                        <span>Progress</span>
                                        <span>{operation.progress}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${operation.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="operation-card-details">
                                    <div className="operation-detail">
                                        <Icon name="event" />
                                        <span>{operation.dueDate || 'No due date'}</span>
                                    </div>
                                    <div className="operation-detail">
                                        <Icon name="domain" />
                                        <span>{operation.assignedDivisions?.length || 0} divisions</span>
                                    </div>
                                </div>
                            </div>
                            <div className="operation-card-footer">
                                <span className={`status-badge ${operation.status.toLowerCase().replace(' ', '-')}`}>
                                    <span className="status-dot"></span>
                                    {operation.status}
                                </span>
                                <button className="btn-action-edit" onClick={() => handleEditOperation(operation)}>
                                    <Icon name="edit" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {sortedOperations.length === 0 && (
                        <div className="operations-empty">
                            <Icon name="engineering" />
                            <p>No operations found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="operations-table-container">
                    <div className="operations-table">
                        <div className="operations-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedOperations.length > 0 && selectedOperations.length === sortedOperations.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-wo sortable" onClick={() => handleSort('workOrderNumber')}>
                                Work Order
                                <Icon name={sortConfig.key === 'workOrderNumber' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-project sortable" onClick={() => handleSort('projectName')}>
                                Project
                                <Icon name={sortConfig.key === 'projectName' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-stage">Current Stage</span>
                            <span className="col-progress">Progress</span>
                            <span className="col-priority sortable" onClick={() => handleSort('priority')}>
                                Priority
                                <Icon name={sortConfig.key === 'priority' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-due sortable" onClick={() => handleSort('dueDate')}>
                                Due Date
                                <Icon name={sortConfig.key === 'dueDate' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        <div className="operations-table-body">
                            {sortedOperations.map((operation) => (
                                <div key={operation.id} className="operations-table-row">
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedOperations.includes(operation.id)}
                                            onChange={() => handleSelectOperation(operation.id)}
                                        />
                                    </span>
                                    <span className="col-wo">
                                        <strong>{operation.workOrderNumber}</strong>
                                    </span>
                                    <span className="col-project">{operation.projectName}</span>
                                    <span className="col-stage">
                                        <span className={`stage-badge ${getStageStatusClass(operation.stages[operation.currentStage]?.status)}`}>
                                            {getCurrentStageLabel(operation.stages)}
                                        </span>
                                    </span>
                                    <span className="col-progress">
                                        <div className="progress-container">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${operation.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">{operation.progress}%</span>
                                        </div>
                                    </span>
                                    <span className="col-priority">
                                        <span className={`priority-badge ${getPriorityClass(operation.priority)}`}>
                                            {operation.priority}
                                        </span>
                                    </span>
                                    <span className="col-due">{operation.dueDate}</span>
                                    <span className="col-actions">
                                        <button className="btn-action-edit" onClick={() => handleEditOperation(operation)}>
                                            <Icon name="edit" />
                                        </button>
                                    </span>
                                </div>
                            ))}

                            {sortedOperations.length === 0 && (
                                <div className="operations-empty">
                                    <Icon name="engineering" />
                                    <p>No operations found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="table-footer-simple">
                <span>{sortedOperations.length} operation{sortedOperations.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-operation" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="engineering" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingOperation ? `Edit ${editingOperation.workOrderNumber}` : 'New Operation'}</h3>
                                <p>{editingOperation ? editingOperation.projectName : 'Create a new work order'}</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="modal-tabs">
                            <button
                                className={`modal-tab ${modalTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setModalTab('overview')}
                            >
                                <Icon name="info" /> Overview
                            </button>
                            <button
                                className={`modal-tab ${modalTab === 'stages' ? 'active' : ''}`}
                                onClick={() => setModalTab('stages')}
                            >
                                <Icon name="account_tree" /> Stages
                            </button>
                            <button
                                className={`modal-tab ${modalTab === 'materials' ? 'active' : ''}`}
                                onClick={() => setModalTab('materials')}
                            >
                                <Icon name="inventory_2" /> Materials
                            </button>
                            <button
                                className={`modal-tab ${modalTab === 'team' ? 'active' : ''}`}
                                onClick={() => setModalTab('team')}
                            >
                                <Icon name="group" /> Team
                            </button>
                        </div>

                        <div className="modal-body modal-body-scroll">
                            {/* Overview Tab */}
                            {modalTab === 'overview' && (
                                <div className="tab-content">
                                    <h4 className="form-section-title">Basic Information</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Project</label>
                                            <select
                                                value={newOperation.projectId}
                                                onChange={(e) => {
                                                    const project = projectsData.find(p => p.id === parseInt(e.target.value));
                                                    setNewOperation({
                                                        ...newOperation,
                                                        projectId: e.target.value,
                                                        projectName: project?.name || ''
                                                    });
                                                }}
                                            >
                                                <option value="">Select a project</option>
                                                {projectsData.filter(p => p.status === 'Active').map(project => (
                                                    <option key={project.id} value={project.id}>{project.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Due Date</label>
                                            <input
                                                type="date"
                                                value={newOperation.dueDate}
                                                onChange={(e) => setNewOperation({ ...newOperation, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select
                                                value={newOperation.status}
                                                onChange={(e) => setNewOperation({ ...newOperation, status: e.target.value })}
                                            >
                                                {operationStatusOptions.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Priority</label>
                                            <select
                                                value={newOperation.priority}
                                                onChange={(e) => setNewOperation({ ...newOperation, priority: e.target.value })}
                                            >
                                                {priorityOptions.map(priority => (
                                                    <option key={priority} value={priority}>{priority}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Assigned Divisions</label>
                                        <div className="division-checkboxes">
                                            {divisionOptions.map(division => (
                                                <label key={division} className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={newOperation.assignedDivisions.includes(division)}
                                                        onChange={() => handleDivisionToggle(division)}
                                                    />
                                                    {division}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Notes</label>
                                        <textarea
                                            value={newOperation.notes}
                                            onChange={(e) => setNewOperation({ ...newOperation, notes: e.target.value })}
                                            placeholder="Operation notes..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Stages Tab */}
                            {modalTab === 'stages' && (
                                <div className="tab-content">
                                    <h4 className="form-section-title">Production Pipeline</h4>
                                    <div className="stage-pipeline">
                                        {operationStages.map((stage) => {
                                            const stageData = newOperation.stages[stage.key];
                                            return (
                                                <div
                                                    key={stage.key}
                                                    className={`stage-node ${getStageStatusClass(stageData.status)} ${selectedStage === stage.key ? 'selected' : ''}`}
                                                    onClick={() => setSelectedStage(stage.key)}
                                                >
                                                    <Icon name={stage.icon} />
                                                    <span className="stage-label">{stage.label}</span>
                                                    <span className="stage-status-text">{stageData.status}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedStage && (
                                        <div className="stage-editor">
                                            <h4 className="form-section-title">
                                                {operationStages.find(s => s.key === selectedStage)?.label} Details
                                            </h4>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Status</label>
                                                    <select
                                                        value={newOperation.stages[selectedStage].status}
                                                        onChange={(e) => handleStageUpdate(selectedStage, 'status', e.target.value)}
                                                    >
                                                        {stageStatusOptions.map(status => (
                                                            <option key={status} value={status}>
                                                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={newOperation.stages[selectedStage].startDate}
                                                        onChange={(e) => handleStageUpdate(selectedStage, 'startDate', e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>End Date</label>
                                                    <input
                                                        type="date"
                                                        value={newOperation.stages[selectedStage].endDate}
                                                        onChange={(e) => handleStageUpdate(selectedStage, 'endDate', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Estimated Hours</label>
                                                    <input
                                                        type="number"
                                                        value={newOperation.stages[selectedStage].estimatedHours}
                                                        onChange={(e) => handleStageUpdate(selectedStage, 'estimatedHours', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="0.5"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Actual Hours</label>
                                                    <input
                                                        type="number"
                                                        value={newOperation.stages[selectedStage].actualHours}
                                                        onChange={(e) => handleStageUpdate(selectedStage, 'actualHours', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="0.5"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Assigned Staff</label>
                                                <div className="staff-checkboxes">
                                                    {staffData.filter(s => s.status === 'Active').map(staff => (
                                                        <label key={staff.id} className="checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={newOperation.stages[selectedStage].assignedTo.includes(staff.id)}
                                                                onChange={() => handleStaffToggle(selectedStage, staff.id)}
                                                            />
                                                            {staff.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Stage Notes</label>
                                                <textarea
                                                    value={newOperation.stages[selectedStage].notes}
                                                    onChange={(e) => handleStageUpdate(selectedStage, 'notes', e.target.value)}
                                                    placeholder="Notes for this stage..."
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {!selectedStage && (
                                        <p className="stage-hint">Click on a stage above to edit its details</p>
                                    )}
                                </div>
                            )}

                            {/* Materials Tab */}
                            {modalTab === 'materials' && (
                                <div className="tab-content">
                                    <div className="materials-header">
                                        <h4 className="form-section-title">Material Estimation</h4>
                                        <button className="btn-add-material" onClick={handleAddMaterial}>
                                            <Icon name="add" /> Add Material
                                        </button>
                                    </div>

                                    {newOperation.materials.length > 0 ? (
                                        <div className="materials-table-mini">
                                            <div className="materials-table-mini-header">
                                                <span>Material</span>
                                                <span>Estimated</span>
                                                <span>Distributed</span>
                                                <span>Unit</span>
                                                <span>Actions</span>
                                            </div>
                                            {newOperation.materials.map((mat, index) => (
                                                <div key={index} className="materials-table-mini-row">
                                                    <span>
                                                        <select
                                                            value={mat.materialId}
                                                            onChange={(e) => handleMaterialUpdate(index, 'materialId', e.target.value)}
                                                        >
                                                            {materialsData.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name}</option>
                                                            ))}
                                                        </select>
                                                    </span>
                                                    <span>
                                                        <input
                                                            type="number"
                                                            value={mat.estimated}
                                                            onChange={(e) => handleMaterialUpdate(index, 'estimated', e.target.value)}
                                                            min="0"
                                                        />
                                                    </span>
                                                    <span>
                                                        <input
                                                            type="number"
                                                            value={mat.distributed}
                                                            onChange={(e) => handleMaterialUpdate(index, 'distributed', e.target.value)}
                                                            min="0"
                                                        />
                                                    </span>
                                                    <span>{mat.unit}</span>
                                                    <span>
                                                        <button className="btn-remove-material" onClick={() => handleRemoveMaterial(index)}>
                                                            <Icon name="delete" />
                                                        </button>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="materials-empty-state">
                                            <Icon name="inventory_2" />
                                            <p>No materials added yet</p>
                                            <button className="btn-add-material" onClick={handleAddMaterial}>
                                                <Icon name="add" /> Add First Material
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Team Tab */}
                            {modalTab === 'team' && (
                                <div className="tab-content">
                                    <h4 className="form-section-title">Team Assignments</h4>
                                    <div className="team-summary">
                                        {operationStages.map(stage => {
                                            const stageData = newOperation.stages[stage.key];
                                            if (stageData.assignedTo.length === 0) return null;
                                            return (
                                                <div key={stage.key} className="team-stage-row">
                                                    <div className="team-stage-name">
                                                        <Icon name={stage.icon} />
                                                        {stage.label}
                                                    </div>
                                                    <div className="team-stage-members">
                                                        {stageData.assignedTo.map(staffId => (
                                                            <span key={staffId} className="team-member-badge">
                                                                {getStaffName(staffId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.values(newOperation.stages).every(s => s.assignedTo.length === 0) && (
                                            <div className="team-empty-state">
                                                <Icon name="group" />
                                                <p>No staff assigned yet</p>
                                                <p className="hint">Assign staff in the Stages tab</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={editingOperation ? handleUpdateOperation : handleCreateOperation}
                                disabled={!newOperation.projectId}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingOperation ? 'Update Operation' : 'Create Operation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperationsModule;
