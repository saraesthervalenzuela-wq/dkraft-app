import { useState, useMemo } from 'react';
import { Icon } from '../../common';
import {
    qaInspectionsData,
    qaChecklistTemplates,
    qaFindingTypes,
    qaSeverityLevels,
    qaStatusOptions,
    qaResultOptions,
    operationsData,
    operationStages,
    staffData
} from '../../../data/initialData';

/**
 * Quality Assurance Module
 * Manage QA inspections, checklists, findings, and quality metrics
 */
const QualityModule = () => {
    const [inspections, setInspections] = useState(qaInspectionsData);
    const [activeTab, setActiveTab] = useState('inspections');
    const [activeStatusFilter, setActiveStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // view, create, edit
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [showFindingModal, setShowFindingModal] = useState(false);
    const [selectedFinding, setSelectedFinding] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);

    // New inspection form state
    const [newInspection, setNewInspection] = useState({
        operationId: '',
        stage: '',
        templateId: '',
        inspectorId: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        checklist: [],
        findings: [],
        notes: '',
        status: 'Pending',
        result: 'Pending'
    });

    // Calculate QA metrics
    const metrics = useMemo(() => {
        const total = inspections.length;
        const passed = inspections.filter(i => i.result === 'Passed').length;
        const failed = inspections.filter(i => i.result === 'Failed').length;
        const passedWithObs = inspections.filter(i => i.result === 'Passed with Observations').length;
        const pending = inspections.filter(i => i.result === 'Pending').length;

        const allFindings = inspections.flatMap(i => i.findings);
        const openFindings = allFindings.filter(f => f.status === 'Open' || f.status === 'In Progress').length;
        const reworkRequired = allFindings.filter(f => f.type === 'Rework Required').length;
        const scrapCount = allFindings.filter(f => f.type === 'Scrap').length;

        const passRate = total > 0 ? Math.round(((passed + passedWithObs) / total) * 100) : 0;

        return {
            total,
            passed,
            failed,
            passedWithObs,
            pending,
            passRate,
            openFindings,
            reworkRequired,
            scrapCount,
            totalFindings: allFindings.length
        };
    }, [inspections]);

    // Filter inspections
    const filteredInspections = useMemo(() => {
        return inspections.filter(inspection => {
            const matchesSearch =
                inspection.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inspection.projectName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = activeStatusFilter === 'all' ||
                (activeStatusFilter === 'passed' && inspection.result === 'Passed') ||
                (activeStatusFilter === 'failed' && inspection.result === 'Failed') ||
                (activeStatusFilter === 'observations' && inspection.result === 'Passed with Observations') ||
                (activeStatusFilter === 'pending' && inspection.result === 'Pending');

            return matchesSearch && matchesStatus;
        });
    }, [inspections, searchTerm, activeStatusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredInspections.length / rowsPerPage);
    const paginatedInspections = filteredInspections.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Get all findings across inspections
    const allFindings = useMemo(() => {
        return inspections.flatMap(inspection =>
            inspection.findings.map(finding => ({
                ...finding,
                workOrderNumber: inspection.workOrderNumber,
                projectName: inspection.projectName,
                inspectionId: inspection.id,
                stage: inspection.stage
            }))
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [inspections]);

    const getStageLabel = (stageKey) => {
        const stage = operationStages.find(s => s.key === stageKey);
        return stage ? stage.label : stageKey;
    };

    const getStageIcon = (stageKey) => {
        const stage = operationStages.find(s => s.key === stageKey);
        return stage ? stage.icon : 'help';
    };

    const getResultClass = (result) => {
        switch(result) {
            case 'Passed': return 'passed';
            case 'Failed': return 'failed';
            case 'Passed with Observations': return 'observations';
            default: return 'pending';
        }
    };

    const getSeverityClass = (severity) => {
        switch(severity) {
            case 'Critical': return 'critical';
            case 'Major': return 'major';
            case 'Minor': return 'minor';
            default: return 'cosmetic';
        }
    };

    const getFindingStatusClass = (status) => {
        switch(status) {
            case 'Open': return 'open';
            case 'In Progress': return 'in-progress';
            case 'Resolved': return 'resolved';
            case 'Closed': return 'closed';
            default: return 'deferred';
        }
    };

    const handleViewInspection = (inspection) => {
        setSelectedInspection(inspection);
        setModalMode('view');
        setShowModal(true);
    };

    const handleEditInspection = (inspection) => {
        setSelectedInspection(inspection);
        setNewInspection({
            ...inspection,
            operationId: inspection.operationId || '',
            inspectorId: staffData.find(s => s.name === inspection.inspectorName)?.id || ''
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleUpdateInspection = () => {
        const result = calculateResult(newInspection.checklist, newInspection.templateId);
        const inspector = staffData.find(s => s.id === parseInt(newInspection.inspectorId));

        setInspections(prev => prev.map(insp =>
            insp.id === selectedInspection.id
                ? {
                    ...insp,
                    ...newInspection,
                    inspectorName: inspector?.name || insp.inspectorName,
                    result
                }
                : insp
        ));
        setShowModal(false);
        setSelectedInspection(null);
    };

    const handleNewInspection = () => {
        setNewInspection({
            operationId: '',
            stage: '',
            templateId: '',
            inspectorId: '',
            inspectionDate: new Date().toISOString().split('T')[0],
            checklist: [],
            findings: [],
            notes: '',
            status: 'Pending',
            result: 'Pending'
        });
        setModalMode('create');
        setShowModal(true);
    };

    const handleOperationChange = (operationId) => {
        const operation = operationsData.find(op => op.id === parseInt(operationId));
        setNewInspection(prev => ({
            ...prev,
            operationId: parseInt(operationId),
            workOrderNumber: operation?.workOrderNumber || '',
            projectName: operation?.projectName || '',
            stage: '',
            templateId: '',
            checklist: []
        }));
    };

    const handleStageChange = (stageKey) => {
        const template = qaChecklistTemplates.find(t => t.stage === stageKey);
        const checklist = template ? template.items.map(item => ({
            itemId: item.id,
            checked: false,
            notes: ''
        })) : [];

        setNewInspection(prev => ({
            ...prev,
            stage: stageKey,
            templateId: template?.id || '',
            checklist
        }));
    };

    const handleChecklistChange = (itemId, field, value) => {
        setNewInspection(prev => ({
            ...prev,
            checklist: prev.checklist.map(item =>
                item.itemId === itemId ? { ...item, [field]: value } : item
            )
        }));
    };

    const calculateResult = (checklist, templateId) => {
        const template = qaChecklistTemplates.find(t => t.id === templateId);
        if (!template) return 'Pending';

        const requiredItems = template.items.filter(i => i.required);
        const checkedRequired = checklist.filter(c => {
            const item = requiredItems.find(i => i.id === c.itemId);
            return item && c.checked;
        });

        const hasNotes = checklist.some(c => c.notes && c.notes.trim() !== '');

        if (checkedRequired.length === requiredItems.length) {
            return hasNotes ? 'Passed with Observations' : 'Passed';
        }
        return 'Failed';
    };

    const handleSaveInspection = () => {
        const result = calculateResult(newInspection.checklist, newInspection.templateId);
        const inspector = staffData.find(s => s.id === parseInt(newInspection.inspectorId));

        const inspection = {
            id: Math.max(...inspections.map(i => i.id), 0) + 1,
            ...newInspection,
            inspectorName: inspector?.name || '',
            status: 'Completed',
            result,
            findings: newInspection.findings || []
        };

        setInspections(prev => [...prev, inspection]);
        setShowModal(false);
    };

    const handleAddFinding = () => {
        setSelectedFinding({
            id: Date.now(),
            type: '',
            severity: '',
            description: '',
            location: '',
            photos: [],
            status: 'Open',
            assignedTo: '',
            createdAt: new Date().toISOString().split('T')[0],
            resolvedAt: null
        });
        setShowFindingModal(true);
    };

    const handleSaveFinding = () => {
        if (modalMode === 'create') {
            setNewInspection(prev => ({
                ...prev,
                findings: [...prev.findings, selectedFinding]
            }));
        } else {
            // Update existing finding
            setInspections(prev => prev.map(inspection => ({
                ...inspection,
                findings: inspection.findings.map(f =>
                    f.id === selectedFinding.id ? selectedFinding : f
                )
            })));
        }
        setShowFindingModal(false);
        setSelectedFinding(null);
    };

    const handleUpdateFindingStatus = (inspectionId, findingId, newStatus) => {
        setInspections(prev => prev.map(inspection => {
            if (inspection.id === inspectionId) {
                return {
                    ...inspection,
                    findings: inspection.findings.map(f => {
                        if (f.id === findingId) {
                            return {
                                ...f,
                                status: newStatus,
                                resolvedAt: (newStatus === 'Resolved' || newStatus === 'Closed')
                                    ? new Date().toISOString().split('T')[0]
                                    : f.resolvedAt
                            };
                        }
                        return f;
                    })
                };
            }
            return inspection;
        }));
    };

    // Render Metrics Dashboard
    const renderMetrics = () => (
        <div className="qa-metrics-grid">
            <div className="qa-metric-card primary">
                <div className="metric-icon">
                    <Icon name="verified" />
                </div>
                <div className="metric-content">
                    <div className="metric-value">{metrics.passRate}%</div>
                    <div className="metric-label">Pass Rate</div>
                </div>
            </div>
            <div className="qa-metric-card success">
                <div className="metric-icon">
                    <Icon name="check_circle" />
                </div>
                <div className="metric-content">
                    <div className="metric-value">{metrics.passed}</div>
                    <div className="metric-label">Passed</div>
                </div>
            </div>
            <div className="qa-metric-card danger">
                <div className="metric-icon">
                    <Icon name="cancel" />
                </div>
                <div className="metric-content">
                    <div className="metric-value">{metrics.failed}</div>
                    <div className="metric-label">Failed</div>
                </div>
            </div>
            <div className="qa-metric-card warning">
                <div className="metric-icon">
                    <Icon name="report_problem" />
                </div>
                <div className="metric-content">
                    <div className="metric-value">{metrics.openFindings}</div>
                    <div className="metric-label">Open Findings</div>
                </div>
            </div>
            <div className="qa-metric-card info">
                <div className="metric-icon">
                    <Icon name="build" />
                </div>
                <div className="metric-content">
                    <div className="metric-value">{metrics.reworkRequired}</div>
                    <div className="metric-label">Rework Items</div>
                </div>
            </div>
            <div className="qa-metric-card neutral">
                <div className="metric-icon">
                    <Icon name="assignment" />
                </div>
                <div className="metric-content">
                    <div className="metric-value">{metrics.total}</div>
                    <div className="metric-label">Total Inspections</div>
                </div>
            </div>
        </div>
    );

    // Render Inspections Tab
    const renderInspectionsTab = () => (
        <div className="qa-inspections">
            <div className="qa-status-filters">
                {[
                    { key: 'all', label: 'All', count: inspections.length },
                    { key: 'passed', label: 'Passed', count: metrics.passed },
                    { key: 'failed', label: 'Failed', count: metrics.failed },
                    { key: 'observations', label: 'Observations', count: metrics.passedWithObs },
                    { key: 'pending', label: 'Pending', count: metrics.pending }
                ].map(filter => (
                    <button
                        key={filter.key}
                        className={`status-filter-btn ${activeStatusFilter === filter.key ? 'active' : ''}`}
                        onClick={() => { setActiveStatusFilter(filter.key); setCurrentPage(1); }}
                    >
                        {filter.label}
                        <span className="filter-count">{filter.count}</span>
                    </button>
                ))}
            </div>

            <div className="qa-toolbar">
                <div className="search-box">
                    <Icon name="search" />
                    <input
                        type="text"
                        placeholder="Search by work order or project..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            </div>

            <div className="qa-table">
                <div className="qa-table-header">
                    <span>Work Order</span>
                    <span>Project</span>
                    <span>Stage</span>
                    <span>Inspector</span>
                    <span>Date</span>
                    <span>Result</span>
                    <span>Findings</span>
                    <span>Actions</span>
                </div>
                {paginatedInspections.length > 0 ? (
                    paginatedInspections.map(inspection => (
                        <div key={inspection.id} className="qa-table-row">
                            <span className="col-wo">
                                <strong>{inspection.workOrderNumber}</strong>
                            </span>
                            <span className="col-project">{inspection.projectName}</span>
                            <span className="col-stage">
                                <div className="stage-badge-sm">
                                    <Icon name={getStageIcon(inspection.stage)} />
                                    {getStageLabel(inspection.stage)}
                                </div>
                            </span>
                            <span className="col-inspector">{inspection.inspectorName}</span>
                            <span className="col-date">{inspection.inspectionDate}</span>
                            <span className="col-result">
                                <span className={`result-badge ${getResultClass(inspection.result)}`}>
                                    {inspection.result}
                                </span>
                            </span>
                            <span className="col-findings">
                                {inspection.findings.length > 0 ? (
                                    <span className="findings-count">
                                        <Icon name="flag" />
                                        {inspection.findings.length}
                                    </span>
                                ) : '-'}
                            </span>
                            <span className="col-actions">
                                <button
                                    className="btn-action"
                                    onClick={() => handleViewInspection(inspection)}
                                    title="View Details"
                                >
                                    <Icon name="visibility" />
                                </button>
                                <button
                                    className="btn-action"
                                    onClick={() => handleEditInspection(inspection)}
                                    title="Edit Inspection"
                                >
                                    <Icon name="edit" />
                                </button>
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="qa-empty">
                        <Icon name="search_off" />
                        <p>No inspections found</p>
                    </div>
                )}
            </div>

            {filteredInspections.length > rowsPerPage && (
                <div className="qa-footer">
                    <span className="qa-count">
                        Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredInspections.length)} of {filteredInspections.length}
                    </span>
                    <div className="qa-pagination">
                        <div className="rows-per-page">
                            <span>Rows:</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={8}>8</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        <div className="page-controls">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                <Icon name="chevron_left" />
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                <Icon name="chevron_right" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Render Findings Tab
    const renderFindingsTab = () => (
        <div className="qa-findings">
            <div className="qa-findings-summary">
                <div className="summary-card">
                    <Icon name="error" />
                    <div>
                        <span className="summary-value">{allFindings.filter(f => f.status === 'Open').length}</span>
                        <span className="summary-label">Open</span>
                    </div>
                </div>
                <div className="summary-card">
                    <Icon name="autorenew" />
                    <div>
                        <span className="summary-value">{allFindings.filter(f => f.status === 'In Progress').length}</span>
                        <span className="summary-label">In Progress</span>
                    </div>
                </div>
                <div className="summary-card">
                    <Icon name="check_circle" />
                    <div>
                        <span className="summary-value">{allFindings.filter(f => f.status === 'Resolved' || f.status === 'Closed').length}</span>
                        <span className="summary-label">Resolved</span>
                    </div>
                </div>
            </div>

            <div className="findings-list">
                {allFindings.length > 0 ? (
                    allFindings.map(finding => (
                        <div key={`${finding.inspectionId}-${finding.id}`} className="finding-card">
                            <div className="finding-header">
                                <div className="finding-meta">
                                    <span className={`severity-badge ${getSeverityClass(finding.severity)}`}>
                                        {finding.severity}
                                    </span>
                                    <span className="finding-type">{finding.type}</span>
                                </div>
                                <span className={`finding-status ${getFindingStatusClass(finding.status)}`}>
                                    {finding.status}
                                </span>
                            </div>
                            <div className="finding-body">
                                <p className="finding-description">{finding.description}</p>
                                <div className="finding-details">
                                    <span>
                                        <Icon name="work" />
                                        {finding.workOrderNumber}
                                    </span>
                                    <span>
                                        <Icon name="location_on" />
                                        {finding.location}
                                    </span>
                                    <span>
                                        <Icon name="event" />
                                        {finding.createdAt}
                                    </span>
                                </div>
                            </div>
                            <div className="finding-actions">
                                {finding.status !== 'Closed' && (
                                    <select
                                        value={finding.status}
                                        onChange={(e) => handleUpdateFindingStatus(finding.inspectionId, finding.id, e.target.value)}
                                        className="status-select"
                                    >
                                        {qaStatusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                )}
                                {finding.photos && finding.photos.length > 0 && (
                                    <span className="photo-indicator">
                                        <Icon name="photo_camera" />
                                        {finding.photos.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="qa-empty">
                        <Icon name="thumb_up" />
                        <p>No findings recorded</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Render Checklists Tab
    const renderChecklistsTab = () => (
        <div className="qa-checklists">
            <div className="checklists-grid">
                {qaChecklistTemplates.map(template => (
                    <div key={template.id} className="checklist-card">
                        <div className="checklist-header">
                            <div className="checklist-icon">
                                <Icon name={getStageIcon(template.stage)} />
                            </div>
                            <div className="checklist-info">
                                <h4>{template.name}</h4>
                                <span className="checklist-stage">{getStageLabel(template.stage)}</span>
                            </div>
                        </div>
                        <div className="checklist-items">
                            {template.items.map(item => (
                                <div key={item.id} className="checklist-item-preview">
                                    <Icon name={item.required ? 'check_box' : 'check_box_outline_blank'} />
                                    <span className={item.required ? 'required' : ''}>
                                        {item.text}
                                    </span>
                                    {item.required && <span className="required-tag">Required</span>}
                                </div>
                            ))}
                        </div>
                        <div className="checklist-footer">
                            <span>{template.items.length} items</span>
                            <span>{template.items.filter(i => i.required).length} required</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Render History Tab
    const renderHistoryTab = () => {
        // Group inspections by operation
        const byOperation = inspections.reduce((acc, inspection) => {
            if (!acc[inspection.workOrderNumber]) {
                acc[inspection.workOrderNumber] = {
                    workOrderNumber: inspection.workOrderNumber,
                    projectName: inspection.projectName,
                    inspections: []
                };
            }
            acc[inspection.workOrderNumber].inspections.push(inspection);
            return acc;
        }, {});

        return (
            <div className="qa-history">
                {Object.values(byOperation).map(group => (
                    <div key={group.workOrderNumber} className="history-group">
                        <div className="history-group-header">
                            <div className="group-info">
                                <strong>{group.workOrderNumber}</strong>
                                <span>{group.projectName}</span>
                            </div>
                            <span className="inspection-count">
                                {group.inspections.length} inspection{group.inspections.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="history-timeline">
                            {group.inspections
                                .sort((a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate))
                                .map((inspection, idx) => (
                                    <div key={inspection.id} className="timeline-item">
                                        <div className={`timeline-dot ${getResultClass(inspection.result)}`}></div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-stage">
                                                    <Icon name={getStageIcon(inspection.stage)} />
                                                    {getStageLabel(inspection.stage)}
                                                </span>
                                                <span className={`result-badge-sm ${getResultClass(inspection.result)}`}>
                                                    {inspection.result}
                                                </span>
                                            </div>
                                            <div className="timeline-meta">
                                                <span>{inspection.inspectionDate}</span>
                                                <span>by {inspection.inspectorName}</span>
                                            </div>
                                            {inspection.findings.length > 0 && (
                                                <div className="timeline-findings">
                                                    <Icon name="flag" />
                                                    {inspection.findings.length} finding{inspection.findings.length !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render Inspection Modal
    const renderInspectionModal = () => {
        if (!showModal) return null;

        const inspection = modalMode === 'view' ? selectedInspection : newInspection;
        const template = qaChecklistTemplates.find(t => t.id === inspection?.templateId);

        return (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content modal-qa" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="modal-header-icon">
                            <Icon name="verified" />
                        </div>
                        <div className="modal-header-text">
                            <h3>{modalMode === 'create' ? 'New Inspection' : modalMode === 'edit' ? 'Edit Inspection' : `Inspection - ${inspection?.workOrderNumber}`}</h3>
                            <p>{modalMode === 'create' ? 'Create a new quality inspection' : modalMode === 'edit' ? `Editing ${inspection?.workOrderNumber}` : inspection?.projectName}</p>
                        </div>
                        <button className="modal-close" onClick={() => setShowModal(false)}>
                            <Icon name="close" />
                        </button>
                    </div>

                    <div className="modal-body-scroll">
                        {(modalMode === 'create' || modalMode === 'edit') ? (
                            <div className="inspection-form">
                                <div className="form-section">
                                    <h4>Inspection Details</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Operation *</label>
                                            <select
                                                value={newInspection.operationId}
                                                onChange={(e) => handleOperationChange(e.target.value)}
                                            >
                                                <option value="">Select operation...</option>
                                                {operationsData.filter(op => op.status !== 'Completed').map(op => (
                                                    <option key={op.id} value={op.id}>
                                                        {op.workOrderNumber} - {op.projectName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Stage *</label>
                                            <select
                                                value={newInspection.stage}
                                                onChange={(e) => handleStageChange(e.target.value)}
                                                disabled={!newInspection.operationId}
                                            >
                                                <option value="">Select stage...</option>
                                                {operationStages.map(stage => (
                                                    <option key={stage.key} value={stage.key}>{stage.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Inspector *</label>
                                            <select
                                                value={newInspection.inspectorId}
                                                onChange={(e) => setNewInspection(prev => ({ ...prev, inspectorId: e.target.value }))}
                                            >
                                                <option value="">Select inspector...</option>
                                                {staffData.filter(s => s.department === 'Quality' && s.status === 'Active').map(staff => (
                                                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Inspection Date *</label>
                                            <input
                                                type="date"
                                                value={newInspection.inspectionDate}
                                                onChange={(e) => setNewInspection(prev => ({ ...prev, inspectionDate: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {newInspection.stage && template && (
                                    <div className="form-section">
                                        <h4>Checklist: {template.name}</h4>
                                        <div className="checklist-form">
                                            {template.items.map(item => {
                                                const checklistItem = newInspection.checklist.find(c => c.itemId === item.id) || { checked: false, notes: '' };
                                                return (
                                                    <div key={item.id} className="checklist-form-item">
                                                        <div className="checklist-check">
                                                            <input
                                                                type="checkbox"
                                                                id={`check-${item.id}`}
                                                                checked={checklistItem.checked}
                                                                onChange={(e) => handleChecklistChange(item.id, 'checked', e.target.checked)}
                                                            />
                                                            <label htmlFor={`check-${item.id}`}>
                                                                {item.text}
                                                                {item.required && <span className="required-asterisk">*</span>}
                                                            </label>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Notes (optional)"
                                                            value={checklistItem.notes}
                                                            onChange={(e) => handleChecklistChange(item.id, 'notes', e.target.value)}
                                                            className="checklist-notes"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="form-section">
                                    <div className="section-header">
                                        <h4>Findings</h4>
                                        <button className="btn-add-finding" onClick={handleAddFinding}>
                                            <Icon name="add" /> Add Finding
                                        </button>
                                    </div>
                                    {newInspection.findings.length > 0 ? (
                                        <div className="findings-preview">
                                            {newInspection.findings.map(finding => (
                                                <div key={finding.id} className="finding-preview-item">
                                                    <span className={`severity-dot ${getSeverityClass(finding.severity)}`}></span>
                                                    <span className="finding-type-sm">{finding.type}</span>
                                                    <span className="finding-desc-sm">{finding.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-findings-text">No findings added</p>
                                    )}
                                </div>

                                <div className="form-section">
                                    <h4>Notes</h4>
                                    <textarea
                                        placeholder="Additional inspection notes..."
                                        value={newInspection.notes}
                                        onChange={(e) => setNewInspection(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="inspection-view">
                                <div className="view-section">
                                    <div className="view-header">
                                        <div className="view-result">
                                            <span className={`result-badge large ${getResultClass(inspection.result)}`}>
                                                <Icon name={inspection.result === 'Passed' ? 'check_circle' : inspection.result === 'Failed' ? 'cancel' : 'info'} />
                                                {inspection.result}
                                            </span>
                                        </div>
                                        <div className="view-meta">
                                            <div className="meta-item">
                                                <Icon name={getStageIcon(inspection.stage)} />
                                                <span>{getStageLabel(inspection.stage)}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Icon name="person" />
                                                <span>{inspection.inspectorName}</span>
                                            </div>
                                            <div className="meta-item">
                                                <Icon name="event" />
                                                <span>{inspection.inspectionDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="view-section">
                                    <h4>Checklist Results</h4>
                                    <div className="checklist-results">
                                        {template?.items.map(item => {
                                            const result = inspection.checklist.find(c => c.itemId === item.id);
                                            return (
                                                <div key={item.id} className={`checklist-result-item ${result?.checked ? 'passed' : 'failed'}`}>
                                                    <Icon name={result?.checked ? 'check_circle' : 'cancel'} />
                                                    <div className="result-text">
                                                        <span>{item.text}</span>
                                                        {result?.notes && <span className="result-notes">{result.notes}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {inspection.findings.length > 0 && (
                                    <div className="view-section">
                                        <h4>Findings ({inspection.findings.length})</h4>
                                        <div className="findings-view-list">
                                            {inspection.findings.map(finding => (
                                                <div key={finding.id} className="finding-view-item">
                                                    <div className="finding-view-header">
                                                        <span className={`severity-badge ${getSeverityClass(finding.severity)}`}>
                                                            {finding.severity}
                                                        </span>
                                                        <span className="finding-type">{finding.type}</span>
                                                        <span className={`finding-status ${getFindingStatusClass(finding.status)}`}>
                                                            {finding.status}
                                                        </span>
                                                    </div>
                                                    <p>{finding.description}</p>
                                                    <div className="finding-location">
                                                        <Icon name="location_on" />
                                                        {finding.location}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {inspection.notes && (
                                    <div className="view-section">
                                        <h4>Notes</h4>
                                        <p className="inspection-notes">{inspection.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn-modal-cancel" onClick={() => setShowModal(false)}>
                            {modalMode === 'view' ? 'Close' : 'Cancel'}
                        </button>
                        {modalMode === 'view' && (
                            <button
                                className="btn-modal-save"
                                onClick={() => handleEditInspection(selectedInspection)}
                            >
                                <span className="material-symbols-rounded">edit</span>
                                Edit Inspection
                            </button>
                        )}
                        {modalMode === 'create' && (
                            <button
                                className="btn-modal-save"
                                onClick={handleSaveInspection}
                                disabled={!newInspection.operationId || !newInspection.stage || !newInspection.inspectorId}
                            >
                                <span className="material-symbols-rounded">save</span>
                                Complete Inspection
                            </button>
                        )}
                        {modalMode === 'edit' && (
                            <button
                                className="btn-modal-save"
                                onClick={handleUpdateInspection}
                                disabled={!newInspection.inspectorId}
                            >
                                <span className="material-symbols-rounded">save</span>
                                Update Inspection
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render Finding Modal
    const renderFindingModal = () => {
        if (!showFindingModal || !selectedFinding) return null;

        return (
            <div className="modal-overlay" onClick={() => setShowFindingModal(false)}>
                <div className="modal-content modal-finding" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="modal-header-icon warning">
                            <Icon name="flag" />
                        </div>
                        <div className="modal-header-text">
                            <h3>Add Finding</h3>
                            <p>Document a quality issue</p>
                        </div>
                        <button className="modal-close" onClick={() => setShowFindingModal(false)}>
                            <Icon name="close" />
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Finding Type *</label>
                                <select
                                    value={selectedFinding.type}
                                    onChange={(e) => setSelectedFinding(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="">Select type...</option>
                                    {qaFindingTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Severity *</label>
                                <select
                                    value={selectedFinding.severity}
                                    onChange={(e) => setSelectedFinding(prev => ({ ...prev, severity: e.target.value }))}
                                >
                                    <option value="">Select severity...</option>
                                    {qaSeverityLevels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description *</label>
                            <textarea
                                placeholder="Describe the finding in detail..."
                                value={selectedFinding.description}
                                onChange={(e) => setSelectedFinding(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                placeholder="Where was this issue found? (e.g., Panel #3, left side)"
                                value={selectedFinding.location}
                                onChange={(e) => setSelectedFinding(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Assign To</label>
                            <select
                                value={selectedFinding.assignedTo}
                                onChange={(e) => setSelectedFinding(prev => ({ ...prev, assignedTo: parseInt(e.target.value) || '' }))}
                            >
                                <option value="">Unassigned</option>
                                {staffData.filter(s => s.status === 'Active').map(staff => (
                                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Photos</label>
                            <div className="photo-upload-area">
                                <Icon name="add_photo_alternate" />
                                <span>Click to upload photos (optional)</span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-modal-cancel" onClick={() => setShowFindingModal(false)}>
                            Cancel
                        </button>
                        <button
                            className="btn-modal-save"
                            onClick={handleSaveFinding}
                            disabled={!selectedFinding.type || !selectedFinding.severity || !selectedFinding.description}
                        >
                            <span className="material-symbols-rounded">add</span>
                            Add Finding
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="module-page quality-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">verified</span>
                    </div>
                    <div className="header-text">
                        <h1>Quality Assurance</h1>
                        <p>Manage inspections, checklists, and quality control</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={handleNewInspection}>
                    <span className="material-symbols-rounded">add</span>
                    New Inspection
                </button>
            </div>

            {renderMetrics()}

            <div className="qa-tabs-grid">
                {[
                    { key: 'inspections', label: 'Inspections', icon: 'fact_check', desc: 'Quality checks & reviews', color: 'purple', stat: `${metrics.total} Total` },
                    { key: 'findings', label: 'Findings', icon: 'flag', desc: 'Issues & observations', color: 'orange', stat: `${metrics.openFindings} Open` },
                    { key: 'checklists', label: 'Checklists', icon: 'checklist', desc: 'Templates & standards', color: 'blue', stat: `${qaChecklistTemplates.length} Templates` },
                    { key: 'history', label: 'History', icon: 'history', desc: 'Past inspections', color: 'green', stat: `${metrics.passRate}% Pass Rate` }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`qa-tab-card ${activeTab === tab.key ? 'active' : ''} ${tab.color}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <div className="qa-tab-top">
                            <div className={`qa-tab-icon ${tab.color}`}>
                                <Icon name={tab.icon} />
                            </div>
                            <div className={`qa-tab-arrow ${tab.color}`}>
                                <Icon name="arrow_forward" />
                            </div>
                        </div>
                        <div className="qa-tab-content">
                            <span className="qa-tab-label">{tab.label}</span>
                            <span className="qa-tab-desc">{tab.desc}</span>
                        </div>
                        <div className="qa-tab-stat">{tab.stat}</div>
                    </button>
                ))}
            </div>

            <div className="qa-content">
                {activeTab === 'inspections' && renderInspectionsTab()}
                {activeTab === 'findings' && renderFindingsTab()}
                {activeTab === 'checklists' && renderChecklistsTab()}
                {activeTab === 'history' && renderHistoryTab()}
            </div>

            {renderInspectionModal()}
            {renderFindingModal()}
        </div>
    );
};

export default QualityModule;
