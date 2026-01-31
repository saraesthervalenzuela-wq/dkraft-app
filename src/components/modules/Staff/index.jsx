import { useState, useEffect } from 'react';
import { Icon, SearchBox } from '../../common';
import { isApiEnabled, usersApi, registerToBackend } from '../../../services/api';

// Role colors for avatars and badges
const ROLE_COLORS = {
    'ADMIN_DEV': { bg: '#8b5cf6', text: '#ffffff', label: 'Dev Admin' },
    'ADMIN': { bg: '#3b82f6', text: '#ffffff', label: 'Admin' },
    'MANAGEMENT': { bg: '#10b981', text: '#ffffff', label: 'Management' },
    'SALES': { bg: '#f59e0b', text: '#ffffff', label: 'Sales' },
    'COST': { bg: '#06b6d4', text: '#ffffff', label: 'Cost' },
    'STORE': { bg: '#ec4899', text: '#ffffff', label: 'Store' },
    'REQUISITOR': { bg: '#6366f1', text: '#ffffff', label: 'Requisitor' },
    'USER': { bg: '#64748b', text: '#ffffff', label: 'User' },
    'VIEWER': { bg: '#94a3b8', text: '#ffffff', label: 'Viewer' },
};

const getRoleStyle = (role) => ROLE_COLORS[role] || ROLE_COLORS['USER'];

// Demo data for showcase when API is empty
const demoStaffData = [
    { id: 1, username: 'Carlos Martinez', email: 'carlos.martinez@dkraft.com', role: 'ADMIN_DEV', status: 'active' },
    { id: 2, username: 'Maria Garcia', email: 'maria.garcia@dkraft.com', role: 'ADMIN', status: 'active' },
    { id: 3, username: 'Roberto Sanchez', email: 'roberto.sanchez@dkraft.com', role: 'MANAGEMENT', status: 'active' },
    { id: 4, username: 'Ana Lopez', email: 'ana.lopez@dkraft.com', role: 'SALES', status: 'active' },
    { id: 5, username: 'Pedro Ramirez', email: 'pedro.ramirez@dkraft.com', role: 'USER', status: 'active' },
    { id: 6, username: 'Sofia Torres', email: 'sofia.torres@dkraft.com', role: 'COST', status: 'active' },
    { id: 7, username: 'Miguel Hernandez', email: 'miguel.hernandez@dkraft.com', role: 'STORE', status: 'inactive' },
    { id: 8, username: 'Laura Diaz', email: 'laura.diaz@dkraft.com', role: 'REQUISITOR', status: 'active' },
    { id: 9, username: 'Juan Morales', email: 'juan.morales@dkraft.com', role: 'USER', status: 'active' },
    { id: 10, username: 'Elena Ruiz', email: 'elena.ruiz@dkraft.com', role: 'MANAGEMENT', status: 'active' },
];

// Empty initial data - will be loaded from API
const initialStaffData = [];

const roleOptions = ['ADMIN_DEV', 'ADMIN', 'USER', 'STORE', 'SALES', 'COST', 'REQUISITOR', 'MANAGEMENT'];

const StaffModule = () => {
    const [users, setUsers] = useState(initialStaffData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (isApiEnabled()) {
                console.log('[Staff] Loading users from API...');
                const usersData = await usersApi.getAll();
                console.log('[Staff] API response:', usersData);
                if (usersData?.length > 0) {
                    // Normalize user data
                    const normalizedUsers = usersData.map(u => ({
                        id: u.id || u.idUser,
                        username: u.username || u.name || '',
                        email: u.email || '',
                        role: u.role || 'VIEWER',
                    }));
                    setUsers(normalizedUsers);
                } else {
                    // Use demo data when API returns empty
                    console.log('[Staff] API returned empty, using demo data');
                    setUsers(demoStaffData);
                }
            } else {
                // Use demo data when API is not enabled
                console.log('[Staff] API not enabled, using demo data');
                setUsers(demoStaffData);
            }
        } catch (error) {
            console.error('[Staff] Error loading users:', error);
            // Use demo data on error
            setUsers(demoStaffData);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key].toLowerCase();
        const bVal = b[sortConfig.key].toLowerCase();
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
            setSelectedUsers(sortedUsers.map(u => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateUser = async () => {
        if (!newUser.username || !newUser.email || !newUser.role || !newUser.password) return;
        try {
            console.log('[Staff] Creating user via /api/auth/register...');
            if (isApiEnabled()) {
                const createdUser = await usersApi.create(newUser);
            }
            setNewUser({ username: '', email: '', password: '', role: '' });
            setShowModal(false);
            await loadData();
        } catch (error) {
            console.error('[Staff] Error creating user:', error);
            alert('Error creating user: ' + error.message);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) return;
        try {
            if (isApiEnabled()) {
                for (const id of selectedUsers) {
                    await usersApi.delete(id);
                }
            }
            setSelectedUsers([]);
            await loadData();
        } catch (error) {
            console.error('[Staff] Error deleting users:', error);
            alert('Error deleting users: ' + error.message);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setNewUser({ username: user.username, email: user.email, password: '', role: user.role });
        setShowModal(true);
    };

    const handleUpdateUser = async () => {
        if (!newUser.username || !newUser.email || !newUser.role) return;
        try {
            // Build user data for API
            const userToUpdate = {
                name: newUser.username,
                email: newUser.email,
                role: newUser.role,
                areaId: "1",
                departmentId: "1",
            };
            // Add password only if changed
            if (newUser.password?.trim()) {
                userToUpdate.password = newUser.password;
            }

            console.log('[Staff] Updating user:', editingUser.id, userToUpdate);
            if (isApiEnabled()) {
                await usersApi.update(editingUser.id, userToUpdate);
            }
            setNewUser({ username: '', email: '', password: '', role: '' });
            setEditingUser(null);
            setShowModal(false);
            await loadData();
        } catch (error) {
            console.error('[Staff] Error updating user:', error);
            alert('Error updating user: ' + error.message);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setNewUser({ username: '', email: '', password: '', role: '' });
        setEditingUser(null);
        setShowPassword(false);
    };

    // Calculate stats
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'ADMIN' || u.role === 'ADMIN_DEV').length;
    const managementCount = users.filter(u => u.role === 'MANAGEMENT').length;
    const activeRoles = [...new Set(users.map(u => u.role))].length;

    return (
        <div className="module-page staff-module">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">badge</span>
                    </div>
                    <div className="header-text">
                        <h1>Staff</h1>
                        <p>Manage your team members</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => setShowModal(true)}>
                    <span className="material-symbols-rounded">add</span>
                    Add new user
                </button>
            </div>

            {/* Numeralia Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="group" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalUsers}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="admin_panel_settings" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{adminCount}</span>
                        <span className="stat-label">Administrators</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="supervisor_account" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{managementCount}</span>
                        <span className="stat-label">Management</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="work" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeRoles}</span>
                        <span className="stat-label">Active Roles</span>
                    </div>
                </div>
            </div>

            <div className="staff-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search..."
                    className="staff-search"
                />
                <div className="toolbar-right">
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Table view"
                        >
                            <Icon name="table_rows" />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <Icon name="grid_view" />
                        </button>
                    </div>
                    {selectedUsers.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedUsers.length})
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading users...</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className="staff-table-container">
                    <div className="staff-table">
                        <div className="staff-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-username sortable" onClick={() => handleSort('username')}>
                                Username
                                <Icon name={sortConfig.key === 'username' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-email sortable" onClick={() => handleSort('email')}>
                                Email
                                <Icon name={sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-role sortable" onClick={() => handleSort('role')}>
                                Role
                                <Icon name={sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        <div className="staff-table-body">
                            {sortedUsers.map((user) => (
                                <div key={user.id} className="staff-table-row">
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleSelectUser(user.id)}
                                        />
                                    </span>
                                    <span className="col-username">{user.username}</span>
                                    <span className="col-email">{user.email}</span>
                                    <span className="col-role">{user.role}</span>
                                    <span className="col-actions">
                                        <button className="btn-action-edit" onClick={() => handleEditUser(user)}>
                                            <Icon name="edit" />
                                        </button>
                                    </span>
                                </div>
                            ))}

                            {sortedUsers.length === 0 && (
                                <div className="staff-empty">
                                    <Icon name="person_off" />
                                    <p>No users found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="staff-list-container">
                    <div className="staff-cards-grid">
                        {sortedUsers.map((user) => {
                            const roleStyle = getRoleStyle(user.role);
                            const initials = user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                            return (
                                <div key={user.id} className={`staff-card ${selectedUsers.includes(user.id) ? 'selected' : ''}`}>
                                    <div className="staff-card-header">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => handleSelectUser(user.id)}
                                        />
                                        <div className="staff-avatar" style={{ background: roleStyle.bg, color: roleStyle.text }}>
                                            {initials}
                                        </div>
                                        <button className="btn-action-edit" onClick={() => handleEditUser(user)}>
                                            <Icon name="edit" />
                                        </button>
                                    </div>
                                    <div className="staff-card-body">
                                        <h4 className="staff-card-name">{user.username}</h4>
                                        <span
                                            className="staff-card-role"
                                            style={{
                                                background: `${roleStyle.bg}20`,
                                                color: roleStyle.bg,
                                                border: `1px solid ${roleStyle.bg}40`
                                            }}
                                        >
                                            {roleStyle.label}
                                        </span>
                                        <div className="staff-card-email">
                                            <Icon name="mail" />
                                            <span>{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {sortedUsers.length === 0 && (
                            <div className="staff-empty">
                                <Icon name="person_off" />
                                <p>No users found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="table-footer-simple">
                <span>{sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''}</span>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingUser ? 'Edit User' : 'New User'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    placeholder="Enter name"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="Enter email"
                                />
                            </div>
                            <div className="form-group">
                                <label>{editingUser ? 'Password (leave empty to keep current)' : 'Password *'}</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder={editingUser ? 'Leave empty to keep current' : 'Enter password'}
                                        style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#888',
                                            zIndex: 1
                                        }}
                                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="">Select a role</option>
                                    {roleOptions.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={closeModal}>
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                disabled={!newUser.username || !newUser.email || !newUser.role || (!editingUser && !newUser.password)}
                            >
                                <span className="material-symbols-rounded">save</span>
                                {editingUser ? 'Update user' : 'Create user'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffModule;
