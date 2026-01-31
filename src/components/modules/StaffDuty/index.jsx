import { useState, useEffect } from 'react';
import { Icon, SearchBox } from '../../common';
import { isApiEnabled, usersApi } from '../../../services/api';

const StaffDutyModule = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [staffList, setStaffList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load users from API on mount
    useEffect(() => {
        loadStaff();
    }, []);

    // Demo data for offline/demo mode
    const demoStaff = [
        { id: 1, name: 'Carlos Martinez', role: 'CNC Operator', avatar: 'CM', status: 'working', currentTask: 'Cabinet doors production', since: '8:00 AM' },
        { id: 2, name: 'Maria Garcia', role: 'Assembly Lead', avatar: 'MG', status: 'working', currentTask: 'Kitchen island assembly', since: '8:15 AM' },
        { id: 3, name: 'Roberto Sanchez', role: 'Finishing Tech', avatar: 'RS', status: 'working', currentTask: 'Lacquer application', since: '7:45 AM' },
        { id: 4, name: 'Ana Lopez', role: 'Quality Inspector', avatar: 'AL', status: 'break', currentTask: 'Final inspection batch #127', since: '9:00 AM' },
        { id: 5, name: 'Pedro Ramirez', role: 'CNC Operator', avatar: 'PR', status: 'working', currentTask: 'Drawer fronts cutting', since: '8:30 AM' },
        { id: 6, name: 'Sofia Torres', role: 'Designer', avatar: 'ST', status: 'working', currentTask: 'Client revision meeting', since: '9:15 AM' },
        { id: 7, name: 'Miguel Hernandez', role: 'Warehouse', avatar: 'MH', status: 'break', currentTask: 'Material receiving', since: '8:00 AM' },
        { id: 8, name: 'Laura Diaz', role: 'Admin', avatar: 'LD', status: 'offline', currentTask: 'Purchase orders', since: '-' },
        { id: 9, name: 'Juan Morales', role: 'Assembly Tech', avatar: 'JM', status: 'working', currentTask: 'Vanity installation prep', since: '7:30 AM' },
        { id: 10, name: 'Elena Ruiz', role: 'Supervisor', avatar: 'ER', status: 'working', currentTask: 'Production oversight', since: '7:00 AM' },
    ];

    const loadStaff = async () => {
        setIsLoading(true);
        try {
            if (isApiEnabled()) {
                console.log('[StaffDuty] Loading users from API...');
                const usersData = await usersApi.getAll();
                console.log('[StaffDuty] API response:', usersData);
                if (usersData?.length > 0) {
                    const staffDuty = usersData.map((user, index) => {
                        const name = user.name || user.username || 'Unknown';
                        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        const statuses = ['working', 'break', 'offline'];
                        const status = statuses[index % 3];
                        const tasks = ['General duties', 'Project work', 'Administrative tasks', 'Client support', 'Inventory check'];
                        const times = ['8:00 AM', '8:30 AM', '9:00 AM', '9:15 AM', '7:45 AM'];

                        return {
                            id: user.id || user.idUser,
                            name: name,
                            role: user.role || 'USER',
                            avatar: initials,
                            status: status,
                            currentTask: tasks[index % tasks.length],
                            since: times[index % times.length],
                            email: user.email || ''
                        };
                    });
                    setStaffList(staffDuty);
                } else {
                    // Use demo data if API returns empty
                    setStaffList(demoStaff);
                }
            } else {
                // Use demo data when API is not enabled
                setStaffList(demoStaff);
            }
        } catch (error) {
            console.error('[StaffDuty] Error loading users:', error);
            // Use demo data on error
            setStaffList(demoStaff);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (staffId, newStatus) => {
        setStaffList(prev => prev.map(staff =>
            staff.id === staffId ? { ...staff, status: newStatus } : staff
        ));
    };

    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.currentTask.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || staff.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const workingCount = staffList.filter(s => s.status === 'working').length;
    const breakCount = staffList.filter(s => s.status === 'break').length;
    const offlineCount = staffList.filter(s => s.status === 'offline').length;

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
                <div className="duty-stat-card offline">
                    <div className="duty-stat-icon">
                        <Icon name="person_off" />
                    </div>
                    <div className="duty-stat-info">
                        <div className="duty-stat-value">{offlineCount}</div>
                        <div className="duty-stat-label">Offline</div>
                    </div>
                </div>
                <div className="duty-stat-card total">
                    <div className="duty-stat-icon">
                        <Icon name="groups" />
                    </div>
                    <div className="duty-stat-info">
                        <div className="duty-stat-value">{staffList.length}</div>
                        <div className="duty-stat-label">Total Staff</div>
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
                    <button
                        className={`filter-btn ${filterStatus === 'offline' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('offline')}
                    >
                        Offline
                    </button>
                </div>
            </div>

            {/* Staff Grid */}
            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading staff...</p>
                </div>
            ) : (
                <div className="duty-staff-grid">
                    {filteredStaff.map((staff) => (
                        <div key={staff.id} className={`duty-staff-card ${staff.status}`}>
                            <div className="duty-card-header">
                                <div className={`duty-avatar ${staff.status}`}>{staff.avatar}</div>
                                <div className={`duty-status-indicator ${staff.status}`}>
                                    <span className="status-dot"></span>
                                    {staff.status === 'working' ? 'Working' : staff.status === 'break' ? 'On Break' : 'Offline'}
                                </div>
                            </div>
                            <div className="duty-card-body">
                                <h3 className="duty-staff-name">{staff.name}</h3>
                                <p className="duty-staff-role">{staff.role}</p>
                                <p className="duty-staff-email" style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{staff.email}</p>
                            </div>
                            <div className="duty-card-task">
                                <div className="task-label">Current Task</div>
                                <div className="task-value">{staff.currentTask}</div>
                            </div>
                            <div className="duty-card-actions" style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <select
                                    value={staff.status}
                                    onChange={(e) => handleStatusChange(staff.id, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'inherit',
                                        fontSize: '13px'
                                    }}
                                >
                                    <option value="working">Working</option>
                                    <option value="break">On Break</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                            <div className="duty-card-footer">
                                <Icon name="schedule" />
                                <span>Since {staff.since}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && filteredStaff.length === 0 && (
                <div className="duty-empty">
                    <Icon name="person_search" />
                    <p>No staff found</p>
                </div>
            )}
        </div>
    );
};

export default StaffDutyModule;
