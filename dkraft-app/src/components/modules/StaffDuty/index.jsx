import { useState } from 'react';
import { Icon, SearchBox } from '../../common';
import { staffOnDuty } from '../../../data/initialData';

const StaffDutyModule = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredStaff = staffOnDuty.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.currentTask.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || staff.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const workingCount = staffOnDuty.filter(s => s.status === 'working').length;
    const breakCount = staffOnDuty.filter(s => s.status === 'break').length;

    return (
        <div className="module-page staff-duty-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">work_history</span>
                    </div>
                    <div className="header-text">
                        <h1>Staff on Duty</h1>
                        <p>Monitor active workers and their current tasks</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="duty-stats-grid">
                <div className="duty-stat-card working">
                    <div className="duty-stat-icon">
                        <Icon name="engineering" />
                    </div>
                    <div className="duty-stat-info">
                        <div className="duty-stat-value">{workingCount}</div>
                        <div className="duty-stat-label">Currently Working</div>
                    </div>
                </div>
                <div className="duty-stat-card break">
                    <div className="duty-stat-icon">
                        <Icon name="coffee" />
                    </div>
                    <div className="duty-stat-info">
                        <div className="duty-stat-value">{breakCount}</div>
                        <div className="duty-stat-label">On Break</div>
                    </div>
                </div>
                <div className="duty-stat-card total">
                    <div className="duty-stat-icon">
                        <Icon name="groups" />
                    </div>
                    <div className="duty-stat-info">
                        <div className="duty-stat-value">{staffOnDuty.length}</div>
                        <div className="duty-stat-label">Total on Duty</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="duty-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search staff..."
                />
                <div className="duty-filters">
                    <button
                        className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filterStatus === 'working' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('working')}
                    >
                        Working
                    </button>
                    <button
                        className={`filter-btn ${filterStatus === 'break' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('break')}
                    >
                        On Break
                    </button>
                </div>
            </div>

            {/* Staff Grid */}
            <div className="duty-staff-grid">
                {filteredStaff.map((staff) => (
                    <div key={staff.id} className={`duty-staff-card ${staff.status}`}>
                        <div className="duty-card-header">
                            <div className={`duty-avatar ${staff.status}`}>{staff.avatar}</div>
                            <div className={`duty-status-indicator ${staff.status}`}>
                                <span className="status-dot"></span>
                                {staff.status === 'working' ? 'Working' : 'On Break'}
                            </div>
                        </div>
                        <div className="duty-card-body">
                            <h3 className="duty-staff-name">{staff.name}</h3>
                            <p className="duty-staff-role">{staff.role}</p>
                        </div>
                        <div className="duty-card-task">
                            <div className="task-label">Current Task</div>
                            <div className="task-value">{staff.currentTask}</div>
                        </div>
                        <div className="duty-card-footer">
                            <Icon name="schedule" />
                            <span>Since {staff.since}</span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredStaff.length === 0 && (
                <div className="duty-empty">
                    <Icon name="person_search" />
                    <p>No staff found</p>
                </div>
            )}
        </div>
    );
};

export default StaffDutyModule;
