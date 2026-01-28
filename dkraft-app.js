/**
 * D-KRAFT Dashboard Application
 * Dovecreek Knowledge-based Resource Assignment & Flow Tracking
 */

const { useState, useEffect, useRef } = React;

// ============================================
// ICONS COMPONENT
// ============================================
const Icon = ({ name, className = '', style = {} }) => (
    <span className={`material-symbols-rounded nav-icon ${className}`} style={style}>
        {name}
    </span>
);

// ============================================
// DATA CONSTANTS
// ============================================

// Navigation items
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'staff', label: 'Staff', icon: 'badge' },
    { id: 'clients', label: 'Clients', icon: 'group' },
    { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping' },
    { id: 'materials', label: 'Materials', icon: 'inventory_2' },
    { id: 'products', label: 'Products', icon: 'category' },
    { id: 'projects', label: 'Projects', icon: 'assignment' },
    { id: 'catalogs', label: 'Catalogs', icon: 'menu_book', hasSubmenu: true },
    { id: 'qb-health', label: 'QB Health', icon: 'favorite' },
    { id: 'app-history', label: 'App History', icon: 'history' },
];

// Stats data
const statsData = [
    { label: 'Órdenes Producidas', value: '42,500', icon: 'receipt_long' },
    { label: 'Productos Entregados', value: '900', icon: 'local_shipping' },
    { label: 'Cadencia de Materiales', value: '12 Días', icon: 'schedule' },
];

// Chart data
const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [500, 1200, 800, 1700, 1450, 2100, 1900]
};

// Recent orders
const recentOrders = [
    { id: 'OP-202504', product: 'Cajonera', date: 'Hace 2 hrs', status: 'finalizado' },
    { id: 'OP-202505', product: 'Escritorio', date: 'Hace 4 hrs', status: 'finalizado' },
    { id: 'OP-202506', product: 'Closet', date: 'Hace 6 hrs', status: 'urgente' },
    { id: 'OP-202507', product: 'Librero', date: 'Hace 8 hrs', status: 'pausa' },
    { id: 'OP-202503', product: 'Mueble', date: 'Ayer', status: 'proceso' },
];

// Quick actions
const quickActions = [
    { title: 'Registrar Producto', desc: 'Da de alta un nuevo producto y su lista de materiales.', progress: 65 },
    { title: 'Nueva Orden', desc: 'Genera una nueva orden y asigna materiales y personal.', progress: 40 },
    { title: 'Asignar Personal', desc: 'Selecciona y vincula empleados a órdenes activas.', progress: 80 },
];

// Clients data
const clientsData = [
    { idClient: '0001', idOrder: '4498576', name: 'Jackson Moore', email: 'jackson.moore@gmail.com', phone: '(664) 315 26 79', company: 'MooreTech', status: 'Inactive', lastOrder: '2025-04-05' },
    { idClient: '0002', idOrder: '8356756', name: 'Alicia Smithson', email: 'alicia.smithson@gmail.com', phone: '(664) 315 26 79', company: 'Smithson & Co.', status: 'Active', lastOrder: '2025-04-03' },
    { idClient: '0003', idOrder: '3065878', name: 'Natalie Johnson', email: 'natalie.johnsonf@gmail.com', phone: '(664) 315 26 79', company: 'Nova Wellness', status: 'Inactive', lastOrder: '2025-04-05' },
    { idClient: '0004', idOrder: '0569873', name: 'Patrick Cooper', email: 'patrick.cooper@hotmail.com', phone: '(664) 315 26 79', company: 'Cooper Logistics', status: 'Active', lastOrder: '2025-04-29' },
    { idClient: '0005', idOrder: '5458976', name: 'Gilda Ramos', email: 'gilda.ramos@gmail.com', phone: '(664) 315 26 79', company: 'Ramos Culinary', status: 'Inactive', lastOrder: '2025-04-03' },
    { idClient: '0006', idOrder: '5790654', name: 'Clara Simmons', email: 'clara.simmons@gmail.com', phone: '(664) 315 26 79', company: 'Simmons', status: 'Inactive', lastOrder: '2025-04-29' },
    { idClient: '0007', idOrder: '8560978', name: 'Daniel White', email: 'daniel.white@gmail.com', phone: '(664) 315 26 79', company: 'WhitePeak', status: 'Active', lastOrder: '2025-04-05' },
    { idClient: '0008', idOrder: '3459867', name: 'Natalie Johnson', email: 'natalie.johnson@gmail.com', phone: '(664) 315 26 79', company: 'Nova Wellness', status: 'Active', lastOrder: '2025-04-05' },
    { idClient: '0009', idOrder: '7823456', name: 'Roberto García', email: 'roberto.garcia@gmail.com', phone: '(664) 287 43 21', company: 'García Industries', status: 'Active', lastOrder: '2025-04-12' },
    { idClient: '0010', idOrder: '9123847', name: 'Maria Elena Ruiz', email: 'maria.ruiz@outlook.com', phone: '(664) 198 76 54', company: 'Ruiz & Asociados', status: 'Active', lastOrder: '2025-04-18' },
    { idClient: '0011', idOrder: '3847561', name: 'Fernando López', email: 'flopez@empresa.com', phone: '(664) 445 32 18', company: 'López Tech', status: 'Inactive', lastOrder: '2025-03-28' },
    { idClient: '0012', idOrder: '6574839', name: 'Ana Patricia Mendez', email: 'anamendez@gmail.com', phone: '(664) 332 87 65', company: 'Mendez Furniture', status: 'Active', lastOrder: '2025-04-22' },
    { idClient: '0013', idOrder: '1928374', name: 'Carlos Hernández', email: 'carlos.h@hotmail.com', phone: '(664) 556 43 21', company: 'Hernández Corp', status: 'Active', lastOrder: '2025-04-25' },
    { idClient: '0014', idOrder: '8475612', name: 'Sofia Vargas', email: 'sofia.vargas@gmail.com', phone: '(664) 223 98 76', company: 'Vargas Design', status: 'Inactive', lastOrder: '2025-04-01' },
    { idClient: '0015', idOrder: '3692581', name: 'Miguel Ángel Torres', email: 'matorres@empresa.mx', phone: '(664) 778 12 34', company: 'Torres Solutions', status: 'Active', lastOrder: '2025-04-27' },
    { idClient: '0016', idOrder: '7418529', name: 'Laura Sánchez', email: 'laura.sanchez@outlook.com', phone: '(664) 445 67 89', company: 'Sánchez & Co.', status: 'Active', lastOrder: '2025-04-30' },
    { idClient: '0017', idOrder: '2583691', name: 'Diego Morales', email: 'dmorales@gmail.com', phone: '(664) 112 34 56', company: 'Morales Studio', status: 'Inactive', lastOrder: '2025-03-15' },
    { idClient: '0018', idOrder: '9638527', name: 'Isabella Reyes', email: 'isabella.r@empresa.com', phone: '(664) 889 45 67', company: 'Reyes Interiors', status: 'Active', lastOrder: '2025-04-28' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Status badge helper
const getStatusClass = (status) => {
    const statusMap = {
        'finalizado': 'status-finalizado',
        'urgente': 'status-urgente',
        'pausa': 'status-pausa',
        'proceso': 'status-proceso'
    };
    return statusMap[status] || '';
};

const getStatusLabel = (status) => {
    const labelMap = {
        'finalizado': 'Finalizado',
        'urgente': 'Urgente',
        'pausa': 'Pausa',
        'proceso': 'En Proceso'
    };
    return labelMap[status] || status;
};

// ============================================
// SIDEBAR COMPONENT
// ============================================
const Sidebar = ({ activeNav, setActiveNav, theme, setTheme }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dkraft-theme', newTheme);
    };

    return (
        <aside className="sidebar">
            <div className="logo-section">
                <div className="logo-container">
                    <div className="logo-icon">DC</div>
                    <div className="logo-text">
                        <span className="logo-title">DOVECREEK</span>
                        <span className="logo-subtitle">Lifetime Masterpieces</span>
                    </div>
                </div>
            </div>

            <nav className="nav-section">
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                        onClick={() => setActiveNav(item.id)}
                    >
                        <Icon name={item.icon} />
                        <span className="nav-label">{item.label}</span>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                        {item.hasSubmenu && <Icon name="chevron_right" className="submenu-arrow" />}
                    </a>
                ))}
            </nav>

            <div className="themes-section">
                <div className="themes-toggle" onClick={toggleTheme}>
                    <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
                    <span className="nav-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
            </div>

            <div className="user-section">
                <div className={`user-dropdown ${showDropdown ? 'show' : ''}`}>
                    <div className="dropdown-item">
                        <Icon name="person" />
                        <span>Profile</span>
                    </div>
                    <div className="dropdown-item">
                        <Icon name="settings" />
                        <span>Settings</span>
                    </div>
                    <div className="dropdown-item danger">
                        <Icon name="logout" />
                        <span>Log Out</span>
                    </div>
                </div>
                <div className="user-menu-trigger" onClick={() => setShowDropdown(!showDropdown)}>
                    <div className="user-avatar">CA</div>
                    <div className="user-info">
                        <div className="user-name">Carlos Admin</div>
                        <div className="user-role">Administrator</div>
                    </div>
                    <Icon name="expand_more" />
                </div>
            </div>
        </aside>
    );
};

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatCard = ({ label, value, icon, delay }) => (
    <div className={`stat-card animate-in delay-${delay}`}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-footer">
            <div className="stat-icon">
                <Icon name={icon} />
            </div>
            <span className="stat-link">
                Ver detalles <Icon name="arrow_forward" />
            </span>
        </div>
    </div>
);

// ============================================
// PRODUCTION CHART COMPONENT
// ============================================
const ProductionChart = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const gradient = ctx.createLinearGradient(0, 0, 0, 280);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        data: chartData.values,
                        borderColor: '#8b5cf6',
                        borderWidth: 3,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1a1a25',
                            titleColor: '#f8fafc',
                            bodyColor: '#94a3b8',
                            borderColor: 'rgba(139, 92, 246, 0.3)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => `Proyectos: ${context.raw}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { family: 'Plus Jakarta Sans' }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { family: 'Plus Jakarta Sans' }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []);

    return (
        <div className="chart-container">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

// ============================================
// ACTION CARD COMPONENT
// ============================================
const ActionCard = ({ title, desc, progress }) => (
    <div className="action-card">
        <div className="action-title">{title}</div>
        <div className="action-desc">{desc}</div>
        <div className="action-progress">
            <div className="action-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <button className="action-btn">
            <Icon name="arrow_forward" />
        </button>
    </div>
);

// ============================================
// DASHBOARD COMPONENT
// ============================================
const Dashboard = () => {
    return (
        <div className="dashboard-content">
            {/* Progreso Operativo Card */}
            <div className="card animate-in delay-1">
                <div className="card-header">
                    <div>
                        <div className="card-title">Progreso Operativo</div>
                        <div className="card-subtitle">Haz seguimiento a tus operaciones y mejora la eficiencia del taller.</div>
                    </div>
                    <div className="card-menu">
                        <Icon name="more_horiz" />
                    </div>
                </div>

                <div className="stats-grid">
                    {statsData.map((stat, index) => (
                        <StatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            delay={index + 1}
                        />
                    ))}
                </div>

                <div className="chart-header">
                    <div className="chart-title">Producción Semanal</div>
                    <button className="chart-filter">
                        Esta Semana <Icon name="expand_more" />
                    </button>
                </div>

                <ProductionChart />
            </div>

            {/* Quick Actions */}
            <div className="quick-actions animate-in delay-3">
                {quickActions.map((action, index) => (
                    <ActionCard
                        key={index}
                        title={action.title}
                        desc={action.desc}
                        progress={action.progress}
                    />
                ))}
            </div>
        </div>
    );
};

// ============================================
// COMMUNICATION CARD COMPONENT
// ============================================
const CommunicationCard = () => (
    <div className="comm-card animate-in delay-2">
        <div className="comm-header">
            <div>
                <div className="card-title">Comunicación Interna</div>
                <div className="card-subtitle">Novedades de Dovecreek</div>
            </div>
            <div className="card-menu">
                <Icon name="more_horiz" />
            </div>
        </div>
        <div className="comm-content">
            <div className="comm-item">
                <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&h=200&fit=crop"
                    alt="Meeting"
                    className="comm-image"
                />
                <div className="comm-details">
                    <div className="comm-date">
                        <Icon name="schedule" style={{ fontSize: '14px' }} />
                        27 Mar 2025
                    </div>
                    <div className="comm-title-text">Nueva Cuenta Corporativa</div>
                    <div className="comm-text">
                        Nos complace anunciar la apertura de una nueva cuenta corporativa para facilitar la gestión de compras y pagos de proyectos...
                    </div>
                    <div className="comm-actions">
                        <button className="comm-btn primary">Comentar</button>
                        <button className="comm-btn secondary">Ver Más</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ============================================
// STAFF DATA
// ============================================
const staffData = [
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

// ============================================
// STAFF MODULE COMPONENT
// ============================================
const StaffModule = () => {
    const [users, setUsers] = useState(staffData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [newUser, setNewUser] = useState({ username: '', email: '', role: '' });
    const [editingUser, setEditingUser] = useState(null);

    // Filtrar usuarios
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar usuarios
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key].toLowerCase();
        const bVal = b[sortConfig.key].toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginación
    const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(paginatedUsers.map(u => u.id));
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

    return (
        <div className="staff-module">
            <div className="staff-card">
                <div className="staff-header">
                    <h2 className="staff-title">Users</h2>
                    <button className="btn-add-user" onClick={() => setShowModal(true)}>
                        <Icon name="add" />
                        Add new user
                    </button>
                </div>

                <div className="staff-toolbar">
                    <div className="search-box staff-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon name="search" className="search-icon" />
                    </div>
                    {selectedUsers.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedUsers.length})
                        </button>
                    )}
                </div>

                <div className="staff-table">
                    <div className="staff-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
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

                    {paginatedUsers.map((user) => (
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
                                <button className="btn-action-menu" onClick={() => handleEditUser(user)}>
                                    <Icon name="more_horiz" />
                                </button>
                            </span>
                        </div>
                    ))}

                    {paginatedUsers.length === 0 && (
                        <div className="staff-empty">
                            <Icon name="person_off" />
                            <p>No users found</p>
                        </div>
                    )}
                </div>

                <div className="staff-footer">
                    <div className="staff-count">
                        Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, sortedUsers.length)} of {sortedUsers.length} results
                    </div>
                    <div className="staff-pagination">
                        <div className="rows-per-page">
                            <span>Rows per page</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={8}>8</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        <div className="page-info">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <div className="page-controls">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                <Icon name="first_page" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <Icon name="chevron_left" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                                <Icon name="chevron_right" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>
                                <Icon name="last_page" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
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
                            <button
                                className="btn-create-user"
                                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                disabled={!newUser.username || !newUser.email || !newUser.role}
                            >
                                <Icon name="save" />
                                {editingUser ? 'Update user' : 'Create user'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// SUPPLIERS DATA
// ============================================
const suppliersData = [
    {
        id: 1,
        name: 'Calidevs',
        email: 'biz@calidevs.com',
        status: 'Active',
        phone: '664 354 1662',
        address: 'Av. Francisco I. Madero 941, Zona Centro, 22000 Tijuana, B.C.',
        website: 'https://calidevs.com',
        contact: 'Juan Pérez',
        company: 'Calidevs S.A.',
        zipCode: '22000',
        rfc: 'CAL123456ABC',
        notes: ''
    },
];

const statusOptions = ['Active', 'Inactive', 'Pending'];

// ============================================
// MATERIALS DATA
// ============================================
const materialsData = [
    {
        id: 1,
        codeQB: 'MAT-001',
        statusQB: 'synced',
        material: 'Triplay de Pino 18mm',
        category: 'Maderas',
        unit: 'Hoja',
        supplier: 'Maderas del Norte',
        status: 'Active',
        stockTotal: 150,
        stockByWarehouse: { 'Almacen Principal': 100, 'Almacen Secundario': 50 }
    },
    {
        id: 2,
        codeQB: 'MAT-002',
        statusQB: 'pending',
        material: 'MDF 15mm',
        category: 'Maderas',
        unit: 'Hoja',
        supplier: 'Proveedora de Tableros',
        status: 'Active',
        stockTotal: 80,
        stockByWarehouse: { 'Almacen Principal': 80 }
    },
    {
        id: 3,
        codeQB: 'MAT-003',
        statusQB: 'synced',
        material: 'Tornillo 2"',
        category: 'Herrajes',
        unit: 'Caja',
        supplier: 'Ferreteria Industrial',
        status: 'Active',
        stockTotal: 500,
        stockByWarehouse: { 'Almacen Principal': 300, 'Almacen Secundario': 200 }
    },
    {
        id: 4,
        codeQB: 'MAT-004',
        statusQB: 'error',
        material: 'Bisagra de Cierre Suave',
        category: 'Herrajes',
        unit: 'Par',
        supplier: 'Blum Mexico',
        status: 'Low Stock',
        stockTotal: 25,
        stockByWarehouse: { 'Almacen Principal': 25 }
    },
    {
        id: 5,
        codeQB: 'MAT-005',
        statusQB: 'synced',
        material: 'Pegamento Blanco PVA',
        category: 'Adhesivos',
        unit: 'Galon',
        supplier: 'Resistol Industrial',
        status: 'Active',
        stockTotal: 45,
        stockByWarehouse: { 'Almacen Principal': 30, 'Almacen Secundario': 15 }
    },
    {
        id: 6,
        codeQB: 'MAT-006',
        statusQB: 'synced',
        material: 'Laca Brillante',
        category: 'Acabados',
        unit: 'Litro',
        supplier: 'Comex Industrial',
        status: 'Active',
        stockTotal: 60,
        stockByWarehouse: { 'Almacen Principal': 60 }
    },
    {
        id: 7,
        codeQB: 'MAT-007',
        statusQB: 'pending',
        material: 'Corredera Telescopica 18"',
        category: 'Herrajes',
        unit: 'Par',
        supplier: 'Blum Mexico',
        status: 'Inactive',
        stockTotal: 0,
        stockByWarehouse: {}
    },
];

const materialCategoryOptions = ['Maderas', 'Herrajes', 'Adhesivos', 'Acabados', 'Tornilleria', 'Accesorios'];
const materialUnitOptions = ['Hoja', 'Pieza', 'Caja', 'Par', 'Metro', 'Litro', 'Galon', 'Kg'];
const materialStatusOptions = ['Active', 'Inactive', 'Low Stock'];
const currencyOptions = ['USD', 'MXN'];
const accountOptions = ['Inventory Asset', 'Cost of Goods Sold', 'Supplies Expense'];

// ============================================
// PRODUCTS DATA
// ============================================
const productsData = [
    {
        id: 1,
        statusQB: 'synced',
        name: 'Escritorio Ejecutivo',
        description: 'Escritorio de madera con acabado nogal',
        status: 'Active',
        costPrice: 2500.00,
        price: 4500.00,
        account: 'Inventory Asset',
        currency: 'MXN'
    },
    {
        id: 2,
        statusQB: 'synced',
        name: 'Librero Modular',
        description: 'Librero de 5 niveles con puertas',
        status: 'Active',
        costPrice: 1800.00,
        price: 3200.00,
        account: 'Inventory Asset',
        currency: 'MXN'
    },
    {
        id: 3,
        statusQB: 'pending',
        name: 'Mesa de Centro',
        description: 'Mesa rectangular con base met谩lica',
        status: 'Active',
        costPrice: 950.00,
        price: 1750.00,
        account: 'Inventory Asset',
        currency: 'MXN'
    },
    {
        id: 4,
        statusQB: 'error',
        name: 'Closet Empotrado',
        description: 'Closet con puertas corredizas',
        status: 'Inactive',
        costPrice: 8500.00,
        price: 15000.00,
        account: 'Inventory Asset',
        currency: 'MXN'
    },
    {
        id: 5,
        statusQB: 'synced',
        name: 'Cajonera M贸vil',
        description: 'Cajonera de 3 cajones con ruedas',
        status: 'Active',
        costPrice: 650.00,
        price: 1200.00,
        account: 'Inventory Asset',
        currency: 'MXN'
    },
];

const productStatusOptions = ['Active', 'Inactive'];

// ============================================
// PROJECTS DATA
// ============================================
const projectsData = [
    {
        id: 1,
        name: 'Oficina Corporativa ABC',
        description: 'Proyecto de mobiliario para oficina corporativa',
        status: 'Active',
        poNumber: 'PO-2024-001',
        workOrder: 'WO-001',
        estimateNumber: 'EST-001',
        terms: 'Net 30',
        nameAddress: 'ABC Corporation, Av. Principal 123',
        shipTo: 'Zona Industrial Norte',
        contact: 'Juan P茅rez - 664 123 4567',
        salesRep: 'Carlos Mendoza',
        csr: 'Ana Garc铆a',
        subtotal: 45000,
        tax: 7200,
        total: 52200
    },
    {
        id: 2,
        name: 'Residencial Los Pinos',
        description: 'Closets y cocina integral',
        status: 'Active',
        poNumber: 'PO-2024-002',
        workOrder: 'WO-002',
        estimateNumber: 'EST-002',
        terms: 'Net 15',
        nameAddress: 'Familia Rodr铆guez, Calle Los Pinos 456',
        shipTo: 'Fracc. Los Pinos',
        contact: 'Mar铆a Rodr铆guez - 664 987 6543',
        salesRep: 'Pedro L贸pez',
        csr: 'Laura Torres',
        subtotal: 125000,
        tax: 20000,
        total: 145000
    },
    {
        id: 3,
        name: 'Restaurant La Terraza',
        description: 'Barras y mobiliario para restaurante',
        status: 'Inactive',
        poNumber: 'PO-2024-003',
        workOrder: 'WO-003',
        estimateNumber: 'EST-003',
        terms: 'Net 45',
        nameAddress: 'La Terraza SA, Blvd. Costero 789',
        shipTo: 'Plaza Comercial Centro',
        contact: 'Roberto Fern谩ndez - 664 555 1234',
        salesRep: 'Carlos Mendoza',
        csr: 'Ana Garc铆a',
        subtotal: 78000,
        tax: 12480,
        total: 90480
    },
];

const projectStatusOptions = ['Active', 'Inactive', 'Completed', 'On Hold'];
const termsOptions = ['Net 15', 'Net 30', 'Net 45', 'Due on Receipt', 'COD'];

// ============================================
// SUPPLIERS MODULE COMPONENT
// ============================================
const SuppliersModule = () => {
    const [suppliers, setSuppliers] = useState(suppliersData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [newSupplier, setNewSupplier] = useState({
        name: '', email: '', status: 'Active', phone: '', address: '',
        website: '', contact: '', company: '', zipCode: '', rfc: '', notes: ''
    });

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = (a[sortConfig.key] || '').toLowerCase();
        const bVal = (b[sortConfig.key] || '').toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedSuppliers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedSuppliers = sortedSuppliers.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedSuppliers(paginatedSuppliers.map(s => s.id));
        } else {
            setSelectedSuppliers([]);
        }
    };

    const handleSelectSupplier = (id) => {
        setSelectedSuppliers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateSupplier = () => {
        if (!newSupplier.name || !newSupplier.email) return;
        const supplier = {
            id: suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1,
            ...newSupplier
        };
        setSuppliers([...suppliers, supplier]);
        resetForm();
    };

    const handleUpdateSupplier = () => {
        if (!newSupplier.name || !newSupplier.email) return;
        setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...newSupplier } : s));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedSuppliers.length === 0) return;
        setSuppliers(suppliers.filter(s => !selectedSuppliers.includes(s.id)));
        setSelectedSuppliers([]);
    };

    const handleEditSupplier = (supplier) => {
        setEditingSupplier(supplier);
        setNewSupplier({ ...supplier });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewSupplier({
            name: '', email: '', status: 'Active', phone: '', address: '',
            website: '', contact: '', company: '', zipCode: '', rfc: '', notes: ''
        });
        setEditingSupplier(null);
    };

    return (
        <div className="suppliers-module">
            <div className="suppliers-card">
                <div className="suppliers-header">
                    <h2 className="suppliers-title">Suppliers</h2>
                    <button className="btn-add-supplier" onClick={() => setShowModal(true)}>
                        <Icon name="add" />
                        Add new supplier
                    </button>
                </div>

                <div className="suppliers-toolbar">
                    <div className="search-box suppliers-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon name="search" className="search-icon" />
                    </div>
                    {selectedSuppliers.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedSuppliers.length})
                        </button>
                    )}
                </div>

                <div className="suppliers-table">
                    <div className="suppliers-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedSuppliers.length > 0 && selectedSuppliers.length === paginatedSuppliers.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-name sortable" onClick={() => handleSort('name')}>
                            Name
                            <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-email sortable" onClick={() => handleSort('email')}>
                            Email
                            <Icon name={sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-status sortable" onClick={() => handleSort('status')}>
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-phone sortable" onClick={() => handleSort('phone')}>
                            Phone
                            <Icon name={sortConfig.key === 'phone' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-address sortable" onClick={() => handleSort('address')}>
                            Address
                            <Icon name={sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-actions">Actions</span>
                    </div>

                    {paginatedSuppliers.map((supplier) => (
                        <div key={supplier.id} className="suppliers-table-row">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedSuppliers.includes(supplier.id)}
                                    onChange={() => handleSelectSupplier(supplier.id)}
                                />
                            </span>
                            <span className="col-name">{supplier.name}</span>
                            <span className="col-email">{supplier.email}</span>
                            <span className={`col-status status-badge ${supplier.status.toLowerCase()}`}>
                                {supplier.status}
                            </span>
                            <span className="col-phone">{supplier.phone}</span>
                            <span className="col-address">{supplier.address}</span>
                            <span className="col-actions">
                                <button className="btn-action-menu" onClick={() => handleEditSupplier(supplier)}>
                                    <Icon name="more_horiz" />
                                </button>
                            </span>
                        </div>
                    ))}

                    {paginatedSuppliers.length === 0 && (
                        <div className="suppliers-empty">
                            <Icon name="inventory_2" />
                            <p>No suppliers found</p>
                        </div>
                    )}
                </div>

                <div className="suppliers-footer">
                    <div className="suppliers-count">
                        Showing {sortedSuppliers.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedSuppliers.length)} of {sortedSuppliers.length} result{sortedSuppliers.length !== 1 ? 's' : ''}
                    </div>
                    <div className="suppliers-pagination">
                        <div className="rows-per-page">
                            <span>Rows per page</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={8}>8</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        <div className="page-info">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <div className="page-controls">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                <Icon name="first_page" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <Icon name="chevron_left" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                                <Icon name="chevron_right" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>
                                <Icon name="last_page" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-supplier" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="inventory_2" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
                                <p>Add a new supplier to your database</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="modal-body modal-body-scroll">
                            <div className="form-section">
                                <h4 className="form-section-title">Basic information</h4>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={newSupplier.name}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                        placeholder="Supplier name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={newSupplier.email}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <div className="input-with-prefix">
                                        <span className="input-prefix">
                                            <span className="flag-mx">🇲🇽</span>
                                        </span>
                                        <input
                                            type="tel"
                                            value={newSupplier.phone}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                            placeholder="(555) 555-5555"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Website</label>
                                    <input
                                        type="url"
                                        value={newSupplier.website}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, website: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="form-section-title">Contact information</h4>
                                <div className="form-group">
                                    <label>Contact</label>
                                    <input
                                        type="text"
                                        value={newSupplier.contact}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                                        placeholder="Company"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea
                                        value={newSupplier.address}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                                        placeholder="Address"
                                        rows={3}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Zip code</label>
                                        <input
                                            type="text"
                                            value={newSupplier.zipCode}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, zipCode: e.target.value })}
                                            placeholder="00000"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>RFC</label>
                                        <input
                                            type="text"
                                            value={newSupplier.rfc}
                                            onChange={(e) => setNewSupplier({ ...newSupplier, rfc: e.target.value })}
                                            placeholder="RFC"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4 className="form-section-title">Additional information</h4>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={newSupplier.status}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, status: e.target.value })}
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea
                                        value={newSupplier.notes}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-create-user"
                                onClick={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
                                disabled={!newSupplier.name || !newSupplier.email}
                            >
                                <Icon name="save" />
                                {editingSupplier ? 'Update supplier' : 'Create supplier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// PROJECTS MODULE COMPONENT
// ============================================
const ProjectsModule = () => {
    const [projects, setProjects] = useState(projectsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingProject, setEditingProject] = useState(null);
    const [newProject, setNewProject] = useState({
        name: '', description: '', status: 'Active',
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

    const totalPages = Math.ceil(sortedProjects.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedProjects = sortedProjects.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProjects(paginatedProjects.map(p => p.id));
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
            name: '', description: '', status: 'Active',
            poNumber: '', workOrder: '', estimateNumber: '', terms: '',
            nameAddress: '', shipTo: '', contact: '',
            salesRep: '', csr: '',
            subtotal: 0, tax: 0, total: 0
        });
        setEditingProject(null);
    };

    return (
        <div className="projects-module">
            <div className="projects-card">
                <div className="projects-header">
                    <h2 className="projects-title">Projects</h2>
                    <button className="btn-add-project" onClick={() => setShowModal(true)}>
                        <Icon name="add" />
                        Add new project
                    </button>
                </div>

                <div className="projects-toolbar">
                    <div className="search-box projects-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon name="search" className="search-icon" />
                    </div>
                    {selectedProjects.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedProjects.length})
                        </button>
                    )}
                </div>

                <div className="projects-table">
                    <div className="projects-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedProjects.length > 0 && selectedProjects.length === paginatedProjects.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-name sortable" onClick={() => handleSort('name')}>
                            <Icon name="inventory_2" />
                            Name
                            <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-description sortable" onClick={() => handleSort('description')}>
                            Description
                            <Icon name={sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-proj-status sortable" onClick={() => handleSort('status')}>
                            <Icon name="schedule" />
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-actions">Actions</span>
                    </div>

                    {paginatedProjects.map((project) => (
                        <div key={project.id} className="projects-table-row">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedProjects.includes(project.id)}
                                    onChange={() => handleSelectProject(project.id)}
                                />
                            </span>
                            <span className="col-name">{project.name}</span>
                            <span className="col-description">{project.description}</span>
                            <span className={`col-proj-status status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                                <span className="status-dot"></span>
                                {project.status}
                            </span>
                            <span className="col-actions">
                                <button className="btn-action-menu" onClick={() => handleEditProject(project)}>
                                    <Icon name="more_horiz" />
                                </button>
                            </span>
                        </div>
                    ))}

                    {paginatedProjects.length === 0 && (
                        <div className="projects-empty">
                            <Icon name="folder_off" />
                            <p>No results.</p>
                        </div>
                    )}
                </div>

                <div className="projects-footer">
                    <div className="projects-count">
                        Showing {sortedProjects.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedProjects.length)} of {sortedProjects.length} result{sortedProjects.length !== 1 ? 's' : ''}
                    </div>
                    <div className="projects-pagination">
                        <div className="rows-per-page">
                            <span>Rows per page</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={8}>8</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        <div className="page-info">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <div className="page-controls">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                <Icon name="first_page" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <Icon name="chevron_left" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                                <Icon name="chevron_right" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>
                                <Icon name="last_page" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-project" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="add_box" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingProject ? 'Edit Project' : 'New Project'}</h3>
                                <p>Create a new project</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="modal-body modal-body-scroll">
                            {/* Basic Information */}
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
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Project description..."
                                    rows={3}
                                />
                            </div>

                            {/* Order Information */}
                            <h4 className="form-section-title">Order information</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>PO number</label>
                                    <input
                                        type="text"
                                        value={newProject.poNumber}
                                        onChange={(e) => setNewProject({ ...newProject, poNumber: e.target.value })}
                                        placeholder="PO-XXXX-XXX"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Work order</label>
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
                                    <label>Estimate number</label>
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

                            {/* Contact and Shipping */}
                            <h4 className="form-section-title">Contact and shipping</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name/Address</label>
                                    <input
                                        type="text"
                                        value={newProject.nameAddress}
                                        onChange={(e) => setNewProject({ ...newProject, nameAddress: e.target.value })}
                                        placeholder="Client name and address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ship to</label>
                                    <input
                                        type="text"
                                        value={newProject.shipTo}
                                        onChange={(e) => setNewProject({ ...newProject, shipTo: e.target.value })}
                                        placeholder="Shipping address"
                                    />
                                </div>
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

                            {/* Work Team */}
                            <h4 className="form-section-title">Work team</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sales representative</label>
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

                            {/* Financial Information */}
                            <h4 className="form-section-title">Financial information</h4>
                            <div className="form-row form-row-3">
                                <div className="form-group">
                                    <label>Subtotal</label>
                                    <input
                                        type="number"
                                        value={newProject.subtotal}
                                        onChange={(e) => setNewProject({
                                            ...newProject,
                                            subtotal: e.target.value,
                                            total: calculateTotal(e.target.value, newProject.tax)
                                        })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tax</label>
                                    <input
                                        type="number"
                                        value={newProject.tax}
                                        onChange={(e) => setNewProject({
                                            ...newProject,
                                            tax: e.target.value,
                                            total: calculateTotal(newProject.subtotal, e.target.value)
                                        })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Total</label>
                                    <input
                                        type="number"
                                        value={calculateTotal(newProject.subtotal, newProject.tax)}
                                        readOnly
                                        className="input-readonly"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-create-project"
                                onClick={editingProject ? handleUpdateProject : handleCreateProject}
                                disabled={!newProject.name}
                            >
                                <Icon name="save" />
                                {editingProject ? 'Update project' : 'Create project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// PRODUCTS MODULE COMPONENT
// ============================================
const ProductsModule = () => {
    const [products, setProducts] = useState(productsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', status: 'Active', costPrice: '',
        price: '', account: '', currency: 'USD'
    });

    const filteredProducts = products.filter(prod =>
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key]).toLowerCase();
        const bVal = String(b[sortConfig.key]).toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(paginatedProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateProduct = () => {
        if (!newProduct.name) return;
        const product = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            statusQB: 'pending',
            ...newProduct,
            costPrice: parseFloat(newProduct.costPrice) || 0,
            price: parseFloat(newProduct.price) || 0
        };
        setProducts([...products, product]);
        resetForm();
    };

    const handleUpdateProduct = () => {
        if (!newProduct.name) return;
        setProducts(products.map(p => p.id === editingProduct.id ? {
            ...p,
            ...newProduct,
            costPrice: parseFloat(newProduct.costPrice) || 0,
            price: parseFloat(newProduct.price) || 0
        } : p));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedProducts.length === 0) return;
        setProducts(products.filter(p => !selectedProducts.includes(p.id)));
        setSelectedProducts([]);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setNewProduct({
            name: product.name,
            description: product.description || '',
            status: product.status,
            costPrice: product.costPrice?.toString() || '',
            price: product.price?.toString() || '',
            account: product.account || '',
            currency: product.currency || 'USD'
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewProduct({
            name: '', description: '', status: 'Active', costPrice: '',
            price: '', account: '', currency: 'USD'
        });
        setEditingProduct(null);
    };

    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: 'var(--success)' };
            case 'pending': return { icon: 'schedule', color: 'var(--warning)' };
            case 'error': return { icon: 'error', color: 'var(--danger)' };
            default: return { icon: 'help', color: 'var(--text-muted)' };
        }
    };

    return (
        <div className="products-module">
            <div className="products-card">
                <div className="products-header">
                    <h2 className="products-title">Product</h2>
                    <button className="btn-add-product" onClick={() => setShowModal(true)}>
                        <Icon name="add" />
                        Add new product
                    </button>
                </div>

                <div className="products-toolbar">
                    <div className="search-box products-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon name="search" className="search-icon" />
                    </div>
                    {selectedProducts.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedProducts.length})
                        </button>
                    )}
                </div>

                <div className="products-table">
                    <div className="products-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedProducts.length > 0 && selectedProducts.length === paginatedProducts.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-status-qb">
                            <Icon name="schedule" />
                            Status QB
                            <Icon name="unfold_more" />
                        </span>
                        <span className="col-name sortable" onClick={() => handleSort('name')}>
                            <Icon name="inventory_2" />
                            Name
                            <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-description sortable" onClick={() => handleSort('description')}>
                            Description
                            <Icon name={sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-prod-status sortable" onClick={() => handleSort('status')}>
                            <Icon name="schedule" />
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-actions">Actions</span>
                    </div>

                    {paginatedProducts.map((product) => {
                        const qbStatus = getQBStatusIcon(product.statusQB);
                        return (
                            <div key={product.id} className="products-table-row">
                                <span className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => handleSelectProduct(product.id)}
                                    />
                                </span>
                                <span className="col-status-qb">
                                    <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                </span>
                                <span className="col-name">{product.name}</span>
                                <span className="col-description">{product.description}</span>
                                <span className={`col-prod-status status-badge ${product.status.toLowerCase()}`}>
                                    <span className="status-dot"></span>
                                    {product.status}
                                </span>
                                <span className="col-actions">
                                    <button className="btn-action-menu" onClick={() => handleEditProduct(product)}>
                                        <Icon name="more_horiz" />
                                    </button>
                                </span>
                            </div>
                        );
                    })}

                    {paginatedProducts.length === 0 && (
                        <div className="products-empty">
                            <Icon name="inventory_2" />
                            <p>No results.</p>
                        </div>
                    )}
                </div>

                <div className="products-footer">
                    <div className="products-count">
                        Showing {sortedProducts.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedProducts.length)} of {sortedProducts.length} result{sortedProducts.length !== 1 ? 's' : ''}
                    </div>
                    <div className="products-pagination">
                        <div className="rows-per-page">
                            <span>Rows per page</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={8}>8</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        <div className="page-info">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <div className="page-controls">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                <Icon name="first_page" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <Icon name="chevron_left" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                                <Icon name="chevron_right" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>
                                <Icon name="last_page" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-product" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="add_box" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                                <p>Create a new product</p>
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
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="Product name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <div className="status-select">
                                        <select
                                            value={newProduct.status}
                                            onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                                        >
                                            {productStatusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Product description..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Cost Price</label>
                                    <div className="price-input">
                                        <span className="price-prefix">$</span>
                                        <input
                                            type="number"
                                            value={newProduct.costPrice}
                                            onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Price</label>
                                    <div className="price-input">
                                        <span className="price-prefix">$</span>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Account</label>
                                <select
                                    value={newProduct.account}
                                    onChange={(e) => setNewProduct({ ...newProduct, account: e.target.value })}
                                >
                                    <option value="">Select Account</option>
                                    {accountOptions.map(acc => (
                                        <option key={acc} value={acc}>{acc}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Currency</label>
                                <select
                                    value={newProduct.currency}
                                    onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                                >
                                    {currencyOptions.map(curr => (
                                        <option key={curr} value={curr}>{curr}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-create-product"
                                onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                                disabled={!newProduct.name}
                            >
                                <Icon name="save" />
                                {editingProduct ? 'Update product' : 'Create product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// MATERIALS MODULE COMPONENT
// ============================================
const MaterialsModule = () => {
    const [activeTab, setActiveTab] = useState('materials');
    const [materials, setMaterials] = useState(materialsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        material: '', description: '', unitPrice: '', currency: 'MXN',
        category: '', account: '', unit: '', supplier: '', status: 'Active', notes: ''
    });

    const filteredMaterials = materials.filter(mat =>
        mat.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mat.codeQB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mat.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedMaterials = [...filteredMaterials].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key]).toLowerCase();
        const bVal = String(b[sortConfig.key]).toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedMaterials.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedMaterials = sortedMaterials.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedMaterials(paginatedMaterials.map(m => m.id));
        } else {
            setSelectedMaterials([]);
        }
    };

    const handleSelectMaterial = (id) => {
        setSelectedMaterials(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSync = () => {
        setSyncing(true);
        setTimeout(() => {
            setMaterials(materials.map(m => ({ ...m, statusQB: 'synced' })));
            setSyncing(false);
        }, 2000);
    };

    const handleCreateMaterial = () => {
        if (!newMaterial.material || !newMaterial.category) return;
        const material = {
            id: materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1,
            codeQB: `MAT-${String(materials.length + 1).padStart(3, '0')}`,
            statusQB: 'pending',
            material: newMaterial.material,
            category: newMaterial.category,
            unit: newMaterial.unit,
            supplier: newMaterial.supplier,
            status: newMaterial.status,
            stockTotal: 0,
            stockByWarehouse: {},
            ...newMaterial
        };
        setMaterials([...materials, material]);
        resetForm();
    };

    const handleUpdateMaterial = () => {
        if (!newMaterial.material || !newMaterial.category) return;
        setMaterials(materials.map(m => m.id === editingMaterial.id ? { ...m, ...newMaterial } : m));
        resetForm();
    };

    const handleDeleteSelected = () => {
        if (selectedMaterials.length === 0) return;
        setMaterials(materials.filter(m => !selectedMaterials.includes(m.id)));
        setSelectedMaterials([]);
    };

    const handleEditMaterial = (material) => {
        setEditingMaterial(material);
        setNewMaterial({
            material: material.material,
            description: material.description || '',
            unitPrice: material.unitPrice || '',
            currency: material.currency || 'MXN',
            category: material.category,
            account: material.account || '',
            unit: material.unit,
            supplier: material.supplier,
            status: material.status,
            notes: material.notes || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setShowModal(false);
        setNewMaterial({
            material: '', description: '', unitPrice: '', currency: 'MXN',
            category: '', account: '', unit: '', supplier: '', status: 'Active', notes: ''
        });
        setEditingMaterial(null);
    };

    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: 'var(--success)' };
            case 'pending': return { icon: 'schedule', color: 'var(--warning)' };
            case 'error': return { icon: 'error', color: 'var(--danger)' };
            default: return { icon: 'help', color: 'var(--text-muted)' };
        }
    };

    const getStockDisplay = (stockByWarehouse) => {
        const entries = Object.entries(stockByWarehouse);
        if (entries.length === 0) return '-';
        return entries.map(([wh, qty]) => `${wh}: ${qty}`).join(', ');
    };

    return (
        <div className="materials-module">
            {/* Page Header */}
            <div className="materials-page-header">
                <div className="materials-page-icon">
                    <Icon name="inventory_2" />
                </div>
                <div className="materials-page-info">
                    <h1 className="materials-page-title">Materials Management</h1>
                    <p className="materials-page-subtitle">Streamline your inventory and requisition workflows</p>
                </div>
            </div>

            <div className="materials-card">
                <div className="materials-header">
                    <div className="materials-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                            onClick={() => setActiveTab('materials')}
                        >
                            <Icon name="inventory_2" />
                            Materials
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'requisitions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('requisitions')}
                        >
                            <Icon name="request_quote" />
                            Requisitions
                        </button>
                    </div>
                    <div className="materials-header-actions">
                        <button className="btn-sync" onClick={handleSync} disabled={syncing}>
                            <Icon name={syncing ? 'sync' : 'sync'} className={syncing ? 'spinning' : ''} />
                            {syncing ? 'Syncing...' : 'Sync materials and items'}
                        </button>
                        <button className="btn-add-material" onClick={() => setShowModal(true)}>
                            <Icon name="add" />
                            Add new material
                        </button>
                    </div>
                </div>

                <div className="materials-toolbar">
                    <div className="search-box materials-search">
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Icon name="search" className="search-icon" />
                    </div>
                    {selectedMaterials.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedMaterials.length})
                        </button>
                    )}
                </div>

                <div className="materials-table">
                    <div className="materials-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedMaterials.length > 0 && selectedMaterials.length === paginatedMaterials.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-code sortable" onClick={() => handleSort('codeQB')}>
                            Code QB
                            <Icon name={sortConfig.key === 'codeQB' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-status-qb">Status QB</span>
                        <span className="col-material sortable" onClick={() => handleSort('material')}>
                            Material
                            <Icon name={sortConfig.key === 'material' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-category sortable" onClick={() => handleSort('category')}>
                            Category
                            <Icon name={sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-unit">Unit</span>
                        <span className="col-supplier sortable" onClick={() => handleSort('supplier')}>
                            Supplier
                            <Icon name={sortConfig.key === 'supplier' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-mat-status sortable" onClick={() => handleSort('status')}>
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-stock">Stock Total</span>
                        <span className="col-warehouse">Stock by Warehouse</span>
                        <span className="col-actions">Actions</span>
                    </div>

                    {paginatedMaterials.map((material) => {
                        const qbStatus = getQBStatusIcon(material.statusQB);
                        return (
                            <div key={material.id} className="materials-table-row">
                                <span className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedMaterials.includes(material.id)}
                                        onChange={() => handleSelectMaterial(material.id)}
                                    />
                                </span>
                                <span className="col-code">{material.codeQB}</span>
                                <span className="col-status-qb">
                                    <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                </span>
                                <span className="col-material">{material.material}</span>
                                <span className="col-category">
                                    <span className="category-badge">{material.category}</span>
                                </span>
                                <span className="col-unit">{material.unit}</span>
                                <span className="col-supplier">{material.supplier}</span>
                                <span className={`col-mat-status status-badge ${material.status.toLowerCase().replace(' ', '-')}`}>
                                    {material.status}
                                </span>
                                <span className="col-stock">
                                    <span className={`stock-value ${material.stockTotal <= 25 ? 'low' : ''}`}>
                                        {material.stockTotal}
                                    </span>
                                </span>
                                <span className="col-warehouse" title={getStockDisplay(material.stockByWarehouse)}>
                                    {getStockDisplay(material.stockByWarehouse)}
                                </span>
                                <span className="col-actions">
                                    <button className="btn-action-menu" onClick={() => handleEditMaterial(material)}>
                                        <Icon name="more_horiz" />
                                    </button>
                                </span>
                            </div>
                        );
                    })}

                    {paginatedMaterials.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="inventory_2" />
                            <p>No materials found</p>
                        </div>
                    )}
                </div>

                <div className="materials-footer">
                    <div className="materials-count">
                        Showing {sortedMaterials.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedMaterials.length)} of {sortedMaterials.length} result{sortedMaterials.length !== 1 ? 's' : ''}
                    </div>
                    <div className="materials-pagination">
                        <div className="rows-per-page">
                            <span>Rows per page</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={8}>8</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        <div className="page-info">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <div className="page-controls">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                <Icon name="first_page" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <Icon name="chevron_left" />
                            </button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                                <Icon name="chevron_right" />
                            </button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>
                                <Icon name="last_page" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content modal-material" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="inventory_2" />
                            </div>
                            <div className="modal-header-text">
                                <h3>{editingMaterial ? 'Edit Material' : 'New Material'}</h3>
                                <p>Add a new material to your inventory</p>
                            </div>
                            <button className="modal-close" onClick={resetForm}>
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="modal-body modal-body-scroll">
                            <div className="form-card">
                                <h4 className="form-card-title">
                                    <Icon name="info" />
                                    Basic Information
                                </h4>
                                <div className="form-group">
                                    <label>Material Name</label>
                                    <input
                                        type="text"
                                        value={newMaterial.material}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, material: e.target.value })}
                                        placeholder="Enter material name"
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={newMaterial.description}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                                        placeholder="Enter material description..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="form-card">
                                <h4 className="form-card-title">
                                    <Icon name="payments" />
                                    Price Information
                                </h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Unit Price</label>
                                        <input
                                            type="number"
                                            value={newMaterial.unitPrice}
                                            onChange={(e) => setNewMaterial({ ...newMaterial, unitPrice: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Currency</label>
                                        <select
                                            value={newMaterial.currency}
                                            onChange={(e) => setNewMaterial({ ...newMaterial, currency: e.target.value })}
                                        >
                                            {currencyOptions.map(curr => (
                                                <option key={curr} value={curr}>{curr}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-card">
                                <h4 className="form-card-title">
                                    <Icon name="category" />
                                    Classification
                                </h4>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={newMaterial.category}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                                    >
                                        <option value="">Select a category</option>
                                        {materialCategoryOptions.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Account</label>
                                    <select
                                        value={newMaterial.account}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, account: e.target.value })}
                                    >
                                        <option value="">Select an account</option>
                                        {accountOptions.map(acc => (
                                            <option key={acc} value={acc}>{acc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit of Measure</label>
                                    <select
                                        value={newMaterial.unit}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                                    >
                                        <option value="">Select a unit</option>
                                        {materialUnitOptions.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-card">
                                <h4 className="form-card-title">
                                    <Icon name="local_shipping" />
                                    Supplier and Status
                                </h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Supplier</label>
                                        <input
                                            type="text"
                                            value={newMaterial.supplier}
                                            onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                                            placeholder="Enter supplier name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={newMaterial.status}
                                            onChange={(e) => setNewMaterial({ ...newMaterial, status: e.target.value })}
                                        >
                                            {materialStatusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-card">
                                <h4 className="form-card-title">
                                    <Icon name="note" />
                                    Additional Notes
                                </h4>
                                <div className="form-group">
                                    <textarea
                                        value={newMaterial.notes}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                                        placeholder="Enter any additional notes..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                            <button
                                className="btn-create-user"
                                onClick={editingMaterial ? handleUpdateMaterial : handleCreateMaterial}
                                disabled={!newMaterial.material || !newMaterial.category}
                            >
                                <Icon name="save" />
                                {editingMaterial ? 'Update material' : 'Create material'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// CLIENTS MODULE COMPONENT
// ============================================
const ClientsModule = () => {
    const [activeTab, setActiveTab] = useState('clients');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState('0005');

    const filteredClients = clientsData.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="clients-module">
            <div className="clients-card">
                <div className="clients-header">
                    <div>
                        <div className="clients-title">Clients List</div>
                        <div className="clients-subtitle">Quick customer query with filters by name, project, or status.</div>
                    </div>
                    <div className="card-menu">
                        <Icon name="more_horiz" />
                    </div>
                </div>

                <div className="clients-toolbar">
                    <div className="clients-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clients')}
                        >
                            Clients
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            Orders
                        </button>
                    </div>

                    <div className="clients-actions">
                        <button className="action-btn-round add">
                            <Icon name="add" />
                        </button>
                        <button className="action-btn-round edit">
                            <Icon name="edit" />
                        </button>
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search Client, Order, etc"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Icon name="search" className="search-icon" />
                        </div>
                        <div className="filter-dropdown">
                            <span>ID Client</span>
                            <Icon name="expand_more" />
                        </div>
                        <div className="filter-dropdown">
                            <span>This Month</span>
                            <Icon name="expand_more" />
                        </div>
                    </div>
                </div>

                <div className="clients-table">
                    <div className="clients-table-header">
                        <span className="sortable">ID Client <Icon name="unfold_more" /></span>
                        <span className="sortable">ID Order <Icon name="unfold_more" /></span>
                        <span className="sortable">Client Name <Icon name="unfold_more" /></span>
                        <span className="sortable">Email <Icon name="unfold_more" /></span>
                        <span className="sortable">Phone <Icon name="unfold_more" /></span>
                        <span>Company</span>
                        <span className="sortable">Status <Icon name="unfold_more" /></span>
                        <span className="sortable">Last Order <Icon name="unfold_more" /></span>
                    </div>
                    {filteredClients.map((client) => (
                        <div
                            key={client.idClient}
                            className={`clients-table-row ${selectedRow === client.idClient ? 'selected' : ''}`}
                            onClick={() => setSelectedRow(client.idClient)}
                        >
                            <span className="client-id">{client.idClient}</span>
                            <span className="client-order">{client.idOrder}</span>
                            <span className="client-name">{client.name}</span>
                            <span className="client-email">{client.email}</span>
                            <span className="client-phone">{client.phone}</span>
                            <span className="client-company">{client.company}</span>
                            <span className={`client-status ${client.status.toLowerCase()}`}>
                                {client.status}
                            </span>
                            <span className="client-date">{client.lastOrder}</span>
                        </div>
                    ))}
                </div>

                <div className="clients-footer">
                    <div className="clients-count">
                        Showing <strong>{filteredClients.length}</strong> clients
                    </div>
                    <div className="clients-scroll-hint">
                        <Icon name="mouse" />
                        <span>Scroll para ver más</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// ORDERS CARD COMPONENT
// ============================================
const OrdersCard = () => (
    <div className="orders-card animate-in delay-3">
        <div className="orders-header">
            <div>
                <div className="card-title">Órdenes y Proyectos Recientes</div>
                <div className="orders-subtitle">La producción más reciente en un solo lugar</div>
            </div>
            <div className="card-menu">
                <Icon name="more_horiz" />
            </div>
        </div>
        <div className="orders-table">
            <div className="orders-table-header">
                <span>Proyecto / Orden</span>
                <span>Producto</span>
                <span>Última Actualización</span>
                <span>Estado</span>
            </div>
            {recentOrders.map((order) => (
                <div key={order.id} className="orders-table-row">
                    <span className="order-id">{order.id}</span>
                    <span className="order-product">{order.product}</span>
                    <span className="order-date">{order.date}</span>
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                    </span>
                </div>
            ))}
        </div>
        <div className="orders-footer">
            <button className="orders-btn primary">Ver Todas...</button>
            <button className="orders-btn secondary">Revisar & Editar</button>
        </div>
    </div>
);

// ============================================
// MAIN APP COMPONENT
// ============================================
const App = () => {
    const [activeNav, setActiveNav] = useState('dashboard');
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('dkraft-theme');
        return savedTheme || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    const renderContent = () => {
        switch (activeNav) {
            case 'staff':
                return <StaffModule />;
            case 'suppliers':
                return <SuppliersModule />;
            case 'materials':
                return <MaterialsModule />;
            case 'products':
                return <ProductsModule />;
            case 'projects':
                return <ProjectsModule />;
            case 'clients':
                return <ClientsModule />;
            case 'dashboard':
            default:
                return (
                    <div className="dashboard-grid">
                        <div className="main-column">
                            <Dashboard />
                        </div>
                        <div className="side-column">
                            <CommunicationCard />
                            <OrdersCard />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="app-container">
            <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} theme={theme} setTheme={setTheme} />

            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">D-KRAFT</h1>
                    <p className="page-subtitle">Dovecreek Knowledge-based Resource Assignment & Flow Tracking</p>
                </header>

                {renderContent()}
            </main>
        </div>
    );
};

// ============================================
// RENDER APPLICATION
// ============================================
ReactDOM.render(<App />, document.getElementById('root'));
