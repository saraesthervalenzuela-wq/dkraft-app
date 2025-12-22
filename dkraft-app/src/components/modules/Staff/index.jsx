import { useState } from 'react';
import { Icon, SearchBox } from '../../common';

// Staff data
const initialStaffData = [
    { id: 1, username: 'Francisco Antonio Hernandez Gaona', email: 'supervisor.almacen@dovecreekproducts.com', role: 'REQUISITOR' },
    { id: 2, username: 'Irma Gloria Castro Encinas', email: 'icastro@dovecreekproducts.com', role: 'MANAGEMENT' },
    { id: 3, username: 'Samuel Melendres', email: 'almacen@dovecreekproducts.com', role: 'REQUISITOR' },
    { id: 4, username: 'Alba Dinora Valadez Chavez', email: 'avaladez@dovecreekproducts.com', role: 'ADMIN' },
    { id: 5, username: 'Victor Dimas Gutierrez', email: 'vdimas@dovecreekproducts.com', role: 'SALES' },
    { id: 6, username: 'Omar Andres Vasquez', email: 'ovasquez@dovecreekproducts.com', role: 'MANAGEMENT' },
    { id: 7, username: 'admin_user', email: 'mcorl95@gmail.com', role: 'ADMIN_DEV' },
    { id: 8, username: 'Alonso Pacheco Valderrama', email: 'apacheco@dovecreekproducts.com', role: 'REQUISITOR' },
];

const roleOptions = ['ADMIN', 'ADMIN_DEV', 'MANAGEMENT', 'REQUISITOR', 'SALES', 'VIEWER'];

const StaffModule = () => {
    const [users, setUsers] = useState(initialStaffData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [newUser, setNewUser] = useState({ username: '', email: '', role: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'list'

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

    const handleCreateUser = () => {
        if (!newUser.username || !newUser.email || !newUser.role) return;
        const user = {
            id: Math.max(...users.map(u => u.id)) + 1,
            ...newUser
        };
        setUsers([...users, user]);
        setNewUser({ username: '', email: '', role: '' });
        setShowModal(false);
    };

    const handleDeleteSelected = () => {
        if (selectedUsers.length === 0) return;
        setUsers(users.filter(u => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setNewUser({ username: user.username, email: user.email, role: user.role });
        setShowModal(true);
    };

    const handleUpdateUser = () => {
        if (!newUser.username || !newUser.email || !newUser.role) return;
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...newUser } : u));
        setNewUser({ username: '', email: '', role: '' });
        setEditingUser(null);
        setShowModal(false);
    };

    const closeModal = () => {
        setShowModal(false);
        setNewUser({ username: '', email: '', role: '' });
        setEditingUser(null);
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

            {viewMode === 'table' ? (
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
                        {sortedUsers.map((user) => (
                            <div key={user.id} className={`staff-card ${selectedUsers.includes(user.id) ? 'selected' : ''}`}>
                                <div className="staff-card-header">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleSelectUser(user.id)}
                                    />
                                    <div className="staff-avatar">
                                        <Icon name="person" />
                                    </div>
                                    <button className="btn-action-edit" onClick={() => handleEditUser(user)}>
                                        <Icon name="edit" />
                                    </button>
                                </div>
                                <div className="staff-card-body">
                                    <h4 className="staff-card-name">{user.username}</h4>
                                    <span className={`staff-card-role role-${user.role.toLowerCase().replace('_', '-')}`}>
                                        {user.role}
                                    </span>
                                    <div className="staff-card-email">
                                        <Icon name="mail" />
                                        <span>{user.email}</span>
                                    </div>
                                </div>
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
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    placeholder="Enter username"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="Enter email"
                                />
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
                                disabled={!newUser.username || !newUser.email || !newUser.role}
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
