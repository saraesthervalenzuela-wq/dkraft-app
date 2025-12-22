import { useState, useMemo } from 'react';
import {
    staffData,
    attendanceData,
    staffOperationHours,
    staffProductivityData,
    divisionOptions,
    departmentOptions,
    bonusTypes,
    attendanceStatusOptions,
    performanceAlertSeverity
} from '../../../data/initialData';

const PerformanceModule = () => {
    // State management
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [divisionFilter, setDivisionFilter] = useState('all');
    const [dateRange, setDateRange] = useState('week');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showBonusModal, setShowBonusModal] = useState(false);

    // Form state for attendance entry
    const [attendanceForm, setAttendanceForm] = useState({
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        clockIn: '',
        clockOut: '',
        status: 'Present',
        notes: ''
    });

    // Form state for bonus entry
    const [bonusForm, setBonusForm] = useState({
        staffId: '',
        type: 'Performance',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        reason: ''
    });

    // Get active staff with productivity data
    const activeStaff = useMemo(() => {
        return staffData
            .filter(s => s.status === 'Active')
            .map(staff => {
                const productivity = staffProductivityData.find(p => p.staffId === staff.id) || {
                    metrics: {
                        totalHoursWorked: 0,
                        totalOrdersWorked: 0,
                        avgHoursPerOrder: 0,
                        completionRate: 0,
                        qualityScore: 0,
                        onTimeRate: 0,
                        currentMonthHours: 0,
                        lastMonthHours: 0
                    },
                    bonuses: [],
                    alerts: []
                };
                return { ...staff, ...productivity };
            });
    }, []);

    // Filter staff based on search and filters
    const filteredStaff = useMemo(() => {
        return activeStaff.filter(staff => {
            const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                staff.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;
            const matchesDivision = divisionFilter === 'all' || staff.division === divisionFilter;
            return matchesSearch && matchesDepartment && matchesDivision;
        });
    }, [activeStaff, searchTerm, departmentFilter, divisionFilter]);

    // Calculate overall metrics
    const overallMetrics = useMemo(() => {
        const totalHours = staffProductivityData.reduce((sum, s) => sum + s.metrics.currentMonthHours, 0);
        const avgQuality = staffProductivityData.reduce((sum, s) => sum + s.metrics.qualityScore, 0) / staffProductivityData.length;
        const avgOnTime = staffProductivityData.reduce((sum, s) => sum + s.metrics.onTimeRate, 0) / staffProductivityData.length;
        const totalBonuses = staffProductivityData.reduce((sum, s) =>
            sum + s.bonuses.reduce((b, bonus) => b + bonus.amount, 0), 0);
        const totalAlerts = staffProductivityData.reduce((sum, s) => sum + s.alerts.length, 0);
        const presentToday = attendanceData.filter(a =>
            a.date === '2024-12-20' && a.status === 'Present'
        ).length;

        return {
            totalHours,
            avgQuality: avgQuality.toFixed(1),
            avgOnTime: avgOnTime.toFixed(1),
            totalBonuses,
            totalAlerts,
            presentToday,
            totalActive: activeStaff.length
        };
    }, [activeStaff]);

    // Get attendance for selected date range
    const getAttendanceForRange = (staffId) => {
        const dates = [];
        const today = new Date('2024-12-20');
        const daysBack = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;

        for (let i = daysBack - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        return dates.map(date => {
            const record = attendanceData.find(a => a.staffId === staffId && a.date === date);
            return { date, ...record };
        }).filter(r => r.status);
    };

    // Get hours by operation for staff
    const getOperationHours = (staffId) => {
        return staffOperationHours
            .filter(h => h.staffId === staffId)
            .reduce((acc, h) => {
                const key = h.workOrderNumber;
                if (!acc[key]) {
                    acc[key] = { workOrderNumber: key, totalHours: 0, stages: {} };
                }
                acc[key].totalHours += h.hours;
                if (!acc[key].stages[h.stage]) {
                    acc[key].stages[h.stage] = 0;
                }
                acc[key].stages[h.stage] += h.hours;
                return acc;
            }, {});
    };

    // Get hours by division
    const getHoursByDivision = (staffId) => {
        return staffOperationHours
            .filter(h => h.staffId === staffId)
            .reduce((acc, h) => {
                if (!acc[h.division]) acc[h.division] = 0;
                acc[h.division] += h.hours;
                return acc;
            }, {});
    };

    // Handle view staff details
    const handleViewStaff = (staff) => {
        setSelectedStaff(staff);
        setModalMode('view');
        setShowModal(true);
    };

    // Handle attendance form submit
    const handleAttendanceSubmit = () => {
        console.log('Attendance submitted:', attendanceForm);
        setShowAttendanceModal(false);
        setAttendanceForm({
            staffId: '',
            date: new Date().toISOString().split('T')[0],
            clockIn: '',
            clockOut: '',
            status: 'Present',
            notes: ''
        });
    };

    // Handle bonus form submit
    const handleBonusSubmit = () => {
        console.log('Bonus submitted:', bonusForm);
        setShowBonusModal(false);
        setBonusForm({
            staffId: '',
            type: 'Performance',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            reason: ''
        });
    };

    // Render metric card
    const MetricCard = ({ icon, label, value, subValue, color }) => (
        <div className={`perf-metric-card ${color || ''}`}>
            <div className="perf-metric-icon">
                <span className="material-symbols-rounded">{icon}</span>
            </div>
            <div className="perf-metric-content">
                <span className="perf-metric-value">{value}</span>
                <span className="perf-metric-label">{label}</span>
                {subValue && <span className="perf-metric-sub">{subValue}</span>}
            </div>
        </div>
    );

    // Render overview tab
    const renderOverview = () => (
        <div className="perf-overview">
            {/* Overall Metrics */}
            <div className="perf-metrics-grid">
                <MetricCard
                    icon="schedule"
                    label="Hours This Month"
                    value={overallMetrics.totalHours}
                    subValue="All staff combined"
                />
                <MetricCard
                    icon="verified"
                    label="Avg Quality Score"
                    value={`${overallMetrics.avgQuality}%`}
                    color="green"
                />
                <MetricCard
                    icon="timer"
                    label="On-Time Rate"
                    value={`${overallMetrics.avgOnTime}%`}
                    color="blue"
                />
                <MetricCard
                    icon="people"
                    label="Present Today"
                    value={`${overallMetrics.presentToday}/${overallMetrics.totalActive}`}
                    subValue="Active staff"
                />
                <MetricCard
                    icon="payments"
                    label="Total Bonuses"
                    value={`$${overallMetrics.totalBonuses.toLocaleString()}`}
                    subValue="This period"
                    color="purple"
                />
                <MetricCard
                    icon="warning"
                    label="Active Alerts"
                    value={overallMetrics.totalAlerts}
                    color={overallMetrics.totalAlerts > 0 ? 'orange' : ''}
                />
            </div>

            {/* Top Performers */}
            <div className="perf-section">
                <h3 className="perf-section-title">
                    <span className="material-symbols-rounded">emoji_events</span>
                    Top Performers
                </h3>
                <div className="perf-top-performers">
                    {activeStaff
                        .sort((a, b) => b.metrics.qualityScore - a.metrics.qualityScore)
                        .slice(0, 5)
                        .map((staff, index) => (
                            <div key={staff.id} className="perf-performer-card" onClick={() => handleViewStaff(staff)}>
                                <div className="perf-rank">{index + 1}</div>
                                <div className="perf-performer-avatar">
                                    {staff.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="perf-performer-info">
                                    <span className="perf-performer-name">{staff.name}</span>
                                    <span className="perf-performer-dept">{staff.department}</span>
                                </div>
                                <div className="perf-performer-score">
                                    <span className="score-value">{staff.metrics.qualityScore}%</span>
                                    <span className="score-label">Quality</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Recent Alerts */}
            <div className="perf-section">
                <h3 className="perf-section-title">
                    <span className="material-symbols-rounded">notifications</span>
                    Recent Alerts
                </h3>
                <div className="perf-alerts-list">
                    {activeStaff
                        .flatMap(staff => staff.alerts.map(alert => ({ ...alert, staffName: staff.staffName, staffId: staff.staffId })))
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5)
                        .map((alert, index) => (
                            <div key={index} className={`perf-alert-item severity-${alert.severity.toLowerCase()}`}>
                                <span className="material-symbols-rounded">
                                    {alert.type === 'Attendance' ? 'schedule' :
                                     alert.type === 'Quality' ? 'error' : 'warning'}
                                </span>
                                <div className="perf-alert-content">
                                    <span className="perf-alert-message">{alert.message}</span>
                                    <span className="perf-alert-meta">{alert.staffName} • {alert.date}</span>
                                </div>
                                <span className={`perf-alert-severity ${alert.severity.toLowerCase()}`}>
                                    {alert.severity}
                                </span>
                            </div>
                        ))}
                    {activeStaff.flatMap(s => s.alerts).length === 0 && (
                        <div className="perf-empty-state">
                            <span className="material-symbols-rounded">check_circle</span>
                            <span>No active alerts</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Render attendance tab
    const renderAttendance = () => (
        <div className="perf-attendance">
            <div className="perf-toolbar">
                <div className="perf-date-range">
                    <button
                        className={`perf-range-btn ${dateRange === 'week' ? 'active' : ''}`}
                        onClick={() => setDateRange('week')}
                    >
                        Week
                    </button>
                    <button
                        className={`perf-range-btn ${dateRange === 'month' ? 'active' : ''}`}
                        onClick={() => setDateRange('month')}
                    >
                        Month
                    </button>
                    <button
                        className={`perf-range-btn ${dateRange === 'quarter' ? 'active' : ''}`}
                        onClick={() => setDateRange('quarter')}
                    >
                        Quarter
                    </button>
                </div>
                <button className="btn-primary-action" onClick={() => setShowAttendanceModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Record Entry
                </button>
            </div>

            <div className="perf-attendance-grid">
                {filteredStaff.map(staff => {
                    const attendance = getAttendanceForRange(staff.id);
                    const presentDays = attendance.filter(a => a.status === 'Present').length;
                    const lateDays = attendance.filter(a => a.status === 'Late').length;
                    const absentDays = attendance.filter(a => a.status === 'Absent').length;
                    const totalHours = attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);

                    return (
                        <div key={staff.id} className="perf-attendance-card" onClick={() => handleViewStaff(staff)}>
                            <div className="perf-attendance-header">
                                <div className="perf-staff-avatar">
                                    {staff.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="perf-staff-info">
                                    <span className="perf-staff-name">{staff.name}</span>
                                    <span className="perf-staff-dept">{staff.department}</span>
                                </div>
                            </div>
                            <div className="perf-attendance-stats">
                                <div className="perf-stat present">
                                    <span className="stat-value">{presentDays}</span>
                                    <span className="stat-label">Present</span>
                                </div>
                                <div className="perf-stat late">
                                    <span className="stat-value">{lateDays}</span>
                                    <span className="stat-label">Late</span>
                                </div>
                                <div className="perf-stat absent">
                                    <span className="stat-value">{absentDays}</span>
                                    <span className="stat-label">Absent</span>
                                </div>
                            </div>
                            <div className="perf-attendance-hours">
                                <span className="material-symbols-rounded">schedule</span>
                                <span>{totalHours.toFixed(1)} hrs total</span>
                            </div>
                            <div className="perf-attendance-timeline">
                                {attendance.slice(-7).map((a, i) => (
                                    <div
                                        key={i}
                                        className={`timeline-dot ${a.status?.toLowerCase() || 'empty'}`}
                                        title={`${a.date}: ${a.status || 'No record'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Render productivity tab
    const renderProductivity = () => (
        <div className="perf-productivity">
            <div className="perf-toolbar">
                <div className="perf-search">
                    <span className="material-symbols-rounded">search</span>
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={divisionFilter}
                    onChange={(e) => setDivisionFilter(e.target.value)}
                    className="perf-filter-select"
                >
                    <option value="all">All Divisions</option>
                    {divisionOptions.map(div => (
                        <option key={div} value={div}>{div}</option>
                    ))}
                </select>
            </div>

            <div className="perf-productivity-table">
                <table>
                    <thead>
                        <tr>
                            <th>Staff Member</th>
                            <th>Division</th>
                            <th>Hours (Month)</th>
                            <th>Orders</th>
                            <th>Completion</th>
                            <th>Quality</th>
                            <th>On-Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.map(staff => (
                            <tr key={staff.id}>
                                <td>
                                    <div className="perf-staff-cell">
                                        <div className="perf-staff-avatar small">
                                            {staff.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <span className="staff-name">{staff.name}</span>
                                            <span className="staff-code">{staff.code}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="division-badge">{staff.division || staff.department}</span>
                                </td>
                                <td>
                                    <div className="hours-cell">
                                        <span className="current">{staff.metrics.currentMonthHours}</span>
                                        <span className="vs">vs</span>
                                        <span className="last">{staff.metrics.lastMonthHours}</span>
                                    </div>
                                </td>
                                <td>{staff.metrics.totalOrdersWorked}</td>
                                <td>
                                    <div className="progress-cell">
                                        <div className="mini-progress">
                                            <div
                                                className="mini-progress-fill"
                                                style={{ width: `${staff.metrics.completionRate}%` }}
                                            />
                                        </div>
                                        <span>{staff.metrics.completionRate}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`score-badge ${staff.metrics.qualityScore >= 95 ? 'excellent' : staff.metrics.qualityScore >= 85 ? 'good' : 'needs-improvement'}`}>
                                        {staff.metrics.qualityScore}%
                                    </span>
                                </td>
                                <td>
                                    <span className={`score-badge ${staff.metrics.onTimeRate >= 95 ? 'excellent' : staff.metrics.onTimeRate >= 85 ? 'good' : 'needs-improvement'}`}>
                                        {staff.metrics.onTimeRate}%
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleViewStaff(staff)}
                                        title="View Details"
                                    >
                                        <span className="material-symbols-rounded">visibility</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Render bonuses tab
    const renderBonuses = () => {
        const allBonuses = activeStaff.flatMap(staff =>
            staff.bonuses.map(b => ({ ...b, staffName: staff.staffName, staffId: staff.staffId }))
        ).sort((a, b) => new Date(b.date) - new Date(a.date));

        const bonusByType = allBonuses.reduce((acc, b) => {
            if (!acc[b.type]) acc[b.type] = 0;
            acc[b.type] += b.amount;
            return acc;
        }, {});

        return (
            <div className="perf-bonuses">
                <div className="perf-toolbar">
                    <div className="perf-bonus-summary">
                        {Object.entries(bonusByType).map(([type, amount]) => (
                            <div key={type} className="bonus-type-card">
                                <span className="bonus-type">{type}</span>
                                <span className="bonus-amount">${amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary-action" onClick={() => setShowBonusModal(true)}>
                        <span className="material-symbols-rounded">add</span>
                        Add Bonus
                    </button>
                </div>

                <div className="perf-bonuses-list">
                    {allBonuses.map((bonus, index) => (
                        <div key={index} className="perf-bonus-card">
                            <div className="bonus-icon">
                                <span className="material-symbols-rounded">
                                    {bonus.type === 'Performance' ? 'trending_up' :
                                     bonus.type === 'Quality' ? 'verified' :
                                     bonus.type === 'Overtime' ? 'schedule' :
                                     bonus.type === 'Project Completion' ? 'task_alt' : 'payments'}
                                </span>
                            </div>
                            <div className="bonus-info">
                                <span className="bonus-staff">{bonus.staffName}</span>
                                <span className="bonus-reason">{bonus.reason}</span>
                                <span className="bonus-meta">{bonus.type} • {bonus.date}</span>
                            </div>
                            <div className="bonus-amount-large">
                                ${bonus.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {allBonuses.length === 0 && (
                        <div className="perf-empty-state">
                            <span className="material-symbols-rounded">payments</span>
                            <span>No bonuses recorded</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render staff detail modal
    const renderStaffModal = () => {
        if (!selectedStaff) return null;

        const attendance = getAttendanceForRange(selectedStaff.id);
        const operationHours = getOperationHours(selectedStaff.id);
        const divisionHours = getHoursByDivision(selectedStaff.id);

        return (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content perf-modal large" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="modal-title-section">
                            <div className="perf-modal-avatar">
                                {selectedStaff.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <h2>{selectedStaff.name}</h2>
                                <span className="modal-subtitle">{selectedStaff.position} • {selectedStaff.department}</span>
                            </div>
                        </div>
                        <button className="modal-close" onClick={() => setShowModal(false)}>
                            <span className="material-symbols-rounded">close</span>
                        </button>
                    </div>

                    <div className="modal-body perf-detail-body">
                        {/* Performance Metrics */}
                        <div className="perf-detail-section">
                            <h4>Performance Metrics</h4>
                            <div className="perf-detail-metrics">
                                <div className="detail-metric">
                                    <span className="metric-label">Total Hours</span>
                                    <span className="metric-value">{selectedStaff.metrics.totalHoursWorked}</span>
                                </div>
                                <div className="detail-metric">
                                    <span className="metric-label">Orders Worked</span>
                                    <span className="metric-value">{selectedStaff.metrics.totalOrdersWorked}</span>
                                </div>
                                <div className="detail-metric">
                                    <span className="metric-label">Completion Rate</span>
                                    <span className="metric-value">{selectedStaff.metrics.completionRate}%</span>
                                </div>
                                <div className="detail-metric">
                                    <span className="metric-label">Quality Score</span>
                                    <span className="metric-value highlight-green">{selectedStaff.metrics.qualityScore}%</span>
                                </div>
                                <div className="detail-metric">
                                    <span className="metric-label">On-Time Rate</span>
                                    <span className="metric-value highlight-blue">{selectedStaff.metrics.onTimeRate}%</span>
                                </div>
                                <div className="detail-metric">
                                    <span className="metric-label">Avg Hrs/Order</span>
                                    <span className="metric-value">{selectedStaff.metrics.avgHoursPerOrder.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Hours by Division */}
                        <div className="perf-detail-section">
                            <h4>Hours by Division</h4>
                            <div className="perf-division-bars">
                                {Object.entries(divisionHours).map(([division, hours]) => (
                                    <div key={division} className="division-bar-row">
                                        <span className="division-name">{division}</span>
                                        <div className="division-bar">
                                            <div
                                                className="division-bar-fill"
                                                style={{ width: `${(hours / Math.max(...Object.values(divisionHours))) * 100}%` }}
                                            />
                                        </div>
                                        <span className="division-hours">{hours} hrs</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hours by Order */}
                        <div className="perf-detail-section">
                            <h4>Hours by Order</h4>
                            <div className="perf-orders-list">
                                {Object.values(operationHours).map((op) => (
                                    <div key={op.workOrderNumber} className="order-hours-card">
                                        <span className="order-number">{op.workOrderNumber}</span>
                                        <span className="order-hours">{op.totalHours} hrs</span>
                                    </div>
                                ))}
                                {Object.keys(operationHours).length === 0 && (
                                    <span className="no-data">No orders recorded</span>
                                )}
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div className="perf-detail-section">
                            <h4>Recent Attendance</h4>
                            <div className="perf-attendance-list">
                                {attendance.slice(0, 7).map((record, index) => (
                                    <div key={index} className={`attendance-record ${record.status?.toLowerCase()}`}>
                                        <span className="record-date">{record.date}</span>
                                        <span className={`record-status ${record.status?.toLowerCase()}`}>
                                            {record.status}
                                        </span>
                                        <span className="record-time">
                                            {record.clockIn || '--:--'} - {record.clockOut || '--:--'}
                                        </span>
                                        <span className="record-hours">{record.hoursWorked?.toFixed(1) || '0'} hrs</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bonuses & Alerts */}
                        <div className="perf-detail-columns">
                            <div className="perf-detail-section half">
                                <h4>Bonuses</h4>
                                <div className="perf-mini-list">
                                    {selectedStaff.bonuses.map((bonus, index) => (
                                        <div key={index} className="mini-item bonus">
                                            <span className="material-symbols-rounded">payments</span>
                                            <div className="mini-info">
                                                <span className="mini-title">${bonus.amount.toLocaleString()}</span>
                                                <span className="mini-sub">{bonus.type} • {bonus.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedStaff.bonuses.length === 0 && (
                                        <span className="no-data">No bonuses</span>
                                    )}
                                </div>
                            </div>
                            <div className="perf-detail-section half">
                                <h4>Alerts</h4>
                                <div className="perf-mini-list">
                                    {selectedStaff.alerts.map((alert, index) => (
                                        <div key={index} className={`mini-item alert ${alert.severity.toLowerCase()}`}>
                                            <span className="material-symbols-rounded">warning</span>
                                            <div className="mini-info">
                                                <span className="mini-title">{alert.message}</span>
                                                <span className="mini-sub">{alert.type} • {alert.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedStaff.alerts.length === 0 && (
                                        <span className="no-data">No alerts</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render attendance entry modal
    const renderAttendanceModal = () => (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
            <div className="modal-content perf-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <span className="material-symbols-rounded">schedule</span>
                        Record Attendance
                    </h2>
                    <button className="modal-close" onClick={() => setShowAttendanceModal(false)}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Staff Member</label>
                        <select
                            value={attendanceForm.staffId}
                            onChange={(e) => setAttendanceForm({...attendanceForm, staffId: e.target.value})}
                        >
                            <option value="">Select staff...</option>
                            {activeStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={attendanceForm.date}
                                onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={attendanceForm.status}
                                onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                            >
                                {attendanceStatusOptions.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Clock In</label>
                            <input
                                type="time"
                                value={attendanceForm.clockIn}
                                onChange={(e) => setAttendanceForm({...attendanceForm, clockIn: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Clock Out</label>
                            <input
                                type="time"
                                value={attendanceForm.clockOut}
                                onChange={(e) => setAttendanceForm({...attendanceForm, clockOut: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea
                            value={attendanceForm.notes}
                            onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                            placeholder="Optional notes..."
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-modal-cancel" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
                    <button className="btn-modal-save" onClick={handleAttendanceSubmit}>
                        <span className="material-symbols-rounded">save</span>
                        Save Record
                    </button>
                </div>
            </div>
        </div>
    );

    // Render bonus modal
    const renderBonusModal = () => (
        <div className="modal-overlay" onClick={() => setShowBonusModal(false)}>
            <div className="modal-content perf-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <span className="material-symbols-rounded">payments</span>
                        Add Bonus
                    </h2>
                    <button className="modal-close" onClick={() => setShowBonusModal(false)}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Staff Member</label>
                        <select
                            value={bonusForm.staffId}
                            onChange={(e) => setBonusForm({...bonusForm, staffId: e.target.value})}
                        >
                            <option value="">Select staff...</option>
                            {activeStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Bonus Type</label>
                            <select
                                value={bonusForm.type}
                                onChange={(e) => setBonusForm({...bonusForm, type: e.target.value})}
                            >
                                {bonusTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Amount ($)</label>
                            <input
                                type="number"
                                value={bonusForm.amount}
                                onChange={(e) => setBonusForm({...bonusForm, amount: e.target.value})}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={bonusForm.date}
                            onChange={(e) => setBonusForm({...bonusForm, date: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Reason</label>
                        <textarea
                            value={bonusForm.reason}
                            onChange={(e) => setBonusForm({...bonusForm, reason: e.target.value})}
                            placeholder="Reason for bonus..."
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-modal-cancel" onClick={() => setShowBonusModal(false)}>Cancel</button>
                    <button className="btn-modal-save" onClick={handleBonusSubmit}>
                        <span className="material-symbols-rounded">save</span>
                        Add Bonus
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="module-page performance-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">trending_up</span>
                    </div>
                    <div className="header-text">
                        <h1>Staff Performance</h1>
                        <p>Monitor attendance, productivity, and performance metrics</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="perf-tabs-grid">
                {[
                    { key: 'overview', label: 'Overview', icon: 'dashboard', desc: 'General metrics & KPIs', color: 'purple', stat: `${overallMetrics.totalActive} Staff` },
                    { key: 'attendance', label: 'Attendance', icon: 'schedule', desc: 'Clock in/out tracking', color: 'blue', stat: `${overallMetrics.presentToday} Present` },
                    { key: 'productivity', label: 'Productivity', icon: 'assessment', desc: 'Work hours & efficiency', color: 'cyan', stat: `${overallMetrics.avgQuality}% Quality` },
                    { key: 'bonuses', label: 'Bonuses & Alerts', icon: 'payments', desc: 'Rewards & notifications', color: 'green', stat: `$${overallMetrics.totalBonuses.toLocaleString()}` }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`perf-tab-card ${activeTab === tab.key ? 'active' : ''} ${tab.color}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <div className="perf-tab-top">
                            <div className={`perf-tab-icon ${tab.color}`}>
                                <span className="material-symbols-rounded">{tab.icon}</span>
                            </div>
                            <div className={`perf-tab-arrow ${tab.color}`}>
                                <span className="material-symbols-rounded">arrow_forward</span>
                            </div>
                        </div>
                        <div className="perf-tab-content">
                            <span className="perf-tab-label">{tab.label}</span>
                            <span className="perf-tab-desc">{tab.desc}</span>
                        </div>
                        <div className="perf-tab-stat">{tab.stat}</div>
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="perf-filter-bar">
                <div className="perf-search">
                    <span className="material-symbols-rounded">search</span>
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="perf-filter-select"
                >
                    <option value="all">All Departments</option>
                    {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            {/* Content */}
            <div className="perf-content">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'attendance' && renderAttendance()}
                {activeTab === 'productivity' && renderProductivity()}
                {activeTab === 'bonuses' && renderBonuses()}
            </div>

            {/* Modals */}
            {showModal && renderStaffModal()}
            {showAttendanceModal && renderAttendanceModal()}
            {showBonusModal && renderBonusModal()}
        </div>
    );
};

export default PerformanceModule;
