import { useState, useEffect } from 'react';
import { Icon, SearchBox } from '../../common';
import { isApiEnabled, usersApi } from '../../../services/api';

// No local data - all data comes from Supabase

const roleOptions = ['ADMIN_DEV', 'ADMIN', 'USER', 'STORE', 'SALES', 'COST', 'REQUISITOR', 'MANAGEMENT'];

const StaffModule = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Newest first
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Staff] Loading users from Supabase...');
            const usersData = await usersApi.getAll();
            console.log('[Staff] Response:', usersData);
            if (usersData?.length > 0) {
                // Normalize user data
                const normalizedUsers = usersData.map(u => ({
                    id: u.id || u.idUser,
                    username: u.username || u.name || '',
                    email: u.email || '',
                    role: u.role || 'USER',
                    created_at: u.created_at,
                }));
                setUsers(normalizedUsers);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('[Staff] Error loading users:', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort users - default newest first
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortConfig.key) {
            // Default: newest first by created_at
            const aDate = new Date(a.created_at || 0);
            const bDate = new Date(b.created_at || 0);
            return bDate - aDate;
        }
        // Handle date fields
        if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
            const aDate = new Date(a[sortConfig.key] || 0);
            const bDate = new Date(b[sortConfig.key] || 0);
            return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }
        // Handle string fields
        const aVal = String(a[sortConfig.key] || '').toLowerCase();
        const bVal = String(b[sortConfig.key] || '').toLowerCase();
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
            // Build user data for API
            const userToCreate = {
                name: newUser.username,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
                areaId: "1",
                departmentId: "1",
            };

            console.log('[Staff] Creating user:', userToCreate);
            if (isApiEnabled()) {
                const createdUser = await usersApi.create(userToCreate);
                console.log('[Staff] API response:', createdUser);
            }
            setNewUser({ username: '', email: '', password: '', role: '' });
            setShowModal(false);
            await loadData();
        } catch (error) {
            console.error('[Staff] Error creating user:', error);
            alert('Error creating user: ' + error.message);
        }
    };

    const handleDelete = (user) => {
        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            if (isApiEnabled()) {
                await usersApi.delete(userToDelete.id);
            }
            setShowDeleteConfirm(false);
            setUserToDelete(null);
            await loadData();
        } catch (error) {
            console.error('[Staff] Error deleting user:', error);
            alert('Error deleting user: ' + error.message);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) return;
        // Show confirmation for multiple delete
        if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
            return;
        }
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
                                        <button className="btn-action-delete" onClick={() => handleDelete(user)}>
                                            <Icon name="delete" />
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
                                    <button className="btn-action-delete" onClick={() => handleDelete(user)}>
                                        <Icon name="delete" />
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                <Icon name="warning" />
                            </div>
                            <div className="modal-header-text">
                                <h3>Delete User</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-confirm">
                                <p>Are you sure you want to delete <strong>{userToDelete?.username}</strong>?</p>
                                <p className="text-muted">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowDeleteConfirm(false)}>
                                <Icon name="close" />
                                Cancel
                            </button>
                            <button className="btn-modal-danger" onClick={confirmDelete}>
                                <Icon name="delete" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffModule;
