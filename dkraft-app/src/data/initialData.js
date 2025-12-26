/**
 * D-KRAFT Initial Data
 * All application data constants
 */

// Navigation items
export const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'staff', label: 'Staff', icon: 'badge' },
    { id: 'staff-duty', label: 'Staff on Duty', icon: 'work_history' },
    { id: 'clients', label: 'Clients', icon: 'group' },
    { id: 'top-clients', label: 'Top Clients', icon: 'star' },
    { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping' },
    { id: 'materials', label: 'Materials', icon: 'inventory_2' },
    { id: 'products', label: 'Products', icon: 'category' },
    { id: 'projects', label: 'Projects', icon: 'assignment' },
    { id: 'operations', label: 'Operations', icon: 'engineering' },
    { id: 'reports', label: 'Reports', icon: 'analytics' },
    { id: 'quality', label: 'Quality', icon: 'verified' },
    { id: 'performance', label: 'Performance', icon: 'trending_up' },
    { id: 'catalogs', label: 'Catalogs', icon: 'widgets', hasSubmenu: true, submenu: [
        { id: 'categories', label: 'Categories', icon: 'label' },
        { id: 'units', label: 'Units', icon: 'straighten' }
    ]},
    { id: 'qb-health', label: 'QB Health', icon: 'favorite' },
    { id: 'activity-log', label: 'Activity Log', icon: 'history' },
    { id: 'project-analysis', label: 'Project Analysis', icon: 'science' },
    { id: 'firebase-test', label: '🔥 Firebase Test', icon: 'bolt' },
];

// Stats data
export const statsData = [
    { label: 'Orders Produced', value: '42,500', icon: 'receipt_long' },
    { label: 'Products Delivered', value: '900', icon: 'local_shipping' },
    { label: 'Materials Cadence', value: '12 Days', icon: 'schedule' },
];

// Chart data
export const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [500, 1200, 800, 1700, 1450, 2100, 1900]
};

// Recent orders
export const recentOrders = [
    { id: 1, orderNumber: 'OP-202504', client: 'Jackson Moore', project: 'Office Renovation', amount: 12500, status: 'completed' },
    { id: 2, orderNumber: 'OP-202505', client: 'Alicia Smithson', project: 'Kitchen Remodel', amount: 8750, status: 'completed' },
    { id: 3, orderNumber: 'OP-202506', client: 'Natalie Johnson', project: 'Custom Closet', amount: 15200, status: 'urgent' },
    { id: 4, orderNumber: 'OP-202507', client: 'Patrick Cooper', project: 'Bookshelf Set', amount: 3400, status: 'paused' },
    { id: 5, orderNumber: 'OP-202503', client: 'MooreTech Inc.', project: 'Cabinet System', amount: 22000, status: 'in_progress' },
];

// Quick actions
export const quickActions = [
    { title: 'Register Product', desc: 'Add a new product and its bill of materials.', progress: 65 },
    { title: 'New Order', desc: 'Create a new order and assign materials and staff.', progress: 40 },
    { title: 'Assign Staff', desc: 'Select and link employees to active orders.', progress: 80 },
];

// Staff on duty (active workers today)
export const staffOnDuty = [
    { id: 1, name: 'Carlos Mendoza', role: 'CNC Operator', avatar: 'CM', status: 'working', currentTask: 'Cabinet doors cutting', since: '8:00 AM' },
    { id: 2, name: 'Ana García', role: 'Finishing Specialist', avatar: 'AG', status: 'working', currentTask: 'Lacquer application', since: '8:30 AM' },
    { id: 3, name: 'Miguel Torres', role: 'Assembly Lead', avatar: 'MT', status: 'break', currentTask: 'Kitchen cabinet assembly', since: '9:00 AM' },
    { id: 4, name: 'Laura Ruiz', role: 'Quality Inspector', avatar: 'LR', status: 'working', currentTask: 'Final inspection WO-003', since: '7:45 AM' },
    { id: 5, name: 'Pedro Sánchez', role: 'Machinist', avatar: 'PS', status: 'working', currentTask: 'Edge banding', since: '8:15 AM' },
];

// Top clients by total orders
export const topClients = [
    { id: 1, name: 'MooreTech Inc.', totalOrders: 45, totalRevenue: 285000, lastOrder: '2025-04-15', trend: 'up' },
    { id: 2, name: 'Smithson & Co.', totalOrders: 38, totalRevenue: 198500, lastOrder: '2025-04-12', trend: 'up' },
    { id: 3, name: 'Cooper Logistics', totalOrders: 32, totalRevenue: 175000, lastOrder: '2025-04-10', trend: 'stable' },
    { id: 4, name: 'Nova Wellness', totalOrders: 28, totalRevenue: 142000, lastOrder: '2025-04-08', trend: 'down' },
    { id: 5, name: 'Garcia Industries', totalOrders: 25, totalRevenue: 128500, lastOrder: '2025-04-05', trend: 'up' },
];

// Clients data
export const clientsData = [
    { idClient: '0001', idOrder: '4498576', name: 'Jackson Moore', email: 'jackson.moore@gmail.com', phone: '(664) 315 26 79', company: 'MooreTech', status: 'Inactive', lastOrder: '2025-04-05' },
    { idClient: '0002', idOrder: '8356756', name: 'Alicia Smithson', email: 'alicia.smithson@gmail.com', phone: '(664) 315 26 79', company: 'Smithson & Co.', status: 'Active', lastOrder: '2025-04-03' },
    { idClient: '0003', idOrder: '3065878', name: 'Natalie Johnson', email: 'natalie.johnsonf@gmail.com', phone: '(664) 315 26 79', company: 'Nova Wellness', status: 'Inactive', lastOrder: '2025-04-05' },
    { idClient: '0004', idOrder: '0569873', name: 'Patrick Cooper', email: 'patrick.cooper@hotmail.com', phone: '(664) 315 26 79', company: 'Cooper Logistics', status: 'Active', lastOrder: '2025-04-29' },
    { idClient: '0005', idOrder: '5458976', name: 'Gilda Ramos', email: 'gilda.ramos@gmail.com', phone: '(664) 315 26 79', company: 'Ramos Culinary', status: 'Inactive', lastOrder: '2025-04-03' },
    { idClient: '0006', idOrder: '5790654', name: 'Clara Simmons', email: 'clara.simmons@gmail.com', phone: '(664) 315 26 79', company: 'Simmons', status: 'Inactive', lastOrder: '2025-04-29' },
    { idClient: '0007', idOrder: '8560978', name: 'Daniel White', email: 'daniel.white@gmail.com', phone: '(664) 315 26 79', company: 'WhitePeak', status: 'Active', lastOrder: '2025-04-05' },
    { idClient: '0008', idOrder: '3459867', name: 'Natalie Johnson', email: 'natalie.johnson@gmail.com', phone: '(664) 315 26 79', company: 'Nova Wellness', status: 'Active', lastOrder: '2025-04-05' },
    { idClient: '0009', idOrder: '7823456', name: 'Robert Garcia', email: 'robert.garcia@gmail.com', phone: '(664) 287 43 21', company: 'Garcia Industries', status: 'Active', lastOrder: '2025-04-12' },
    { idClient: '0010', idOrder: '9123847', name: 'Maria Elena Ruiz', email: 'maria.ruiz@outlook.com', phone: '(664) 198 76 54', company: 'Ruiz & Associates', status: 'Active', lastOrder: '2025-04-18' },
    { idClient: '0011', idOrder: '3847561', name: 'Fernando Lopez', email: 'flopez@company.com', phone: '(664) 445 32 18', company: 'Lopez Tech', status: 'Inactive', lastOrder: '2025-03-28' },
    { idClient: '0012', idOrder: '6574839', name: 'Ana Patricia Mendez', email: 'anamendez@gmail.com', phone: '(664) 332 87 65', company: 'Mendez Furniture', status: 'Active', lastOrder: '2025-04-22' },
    { idClient: '0013', idOrder: '1928374', name: 'Carlos Hernandez', email: 'carlos.h@hotmail.com', phone: '(664) 556 43 21', company: 'Hernandez Corp', status: 'Active', lastOrder: '2025-04-25' },
    { idClient: '0014', idOrder: '8475612', name: 'Sofia Vargas', email: 'sofia.vargas@gmail.com', phone: '(664) 223 98 76', company: 'Vargas Design', status: 'Inactive', lastOrder: '2025-04-01' },
    { idClient: '0015', idOrder: '3692581', name: 'Miguel Angel Torres', email: 'matorres@company.mx', phone: '(664) 778 12 34', company: 'Torres Solutions', status: 'Active', lastOrder: '2025-04-27' },
    { idClient: '0016', idOrder: '7418529', name: 'Laura Sanchez', email: 'laura.sanchez@outlook.com', phone: '(664) 445 67 89', company: 'Sanchez & Co.', status: 'Active', lastOrder: '2025-04-30' },
    { idClient: '0017', idOrder: '2583691', name: 'Diego Morales', email: 'dmorales@gmail.com', phone: '(664) 112 34 56', company: 'Morales Studio', status: 'Inactive', lastOrder: '2025-03-15' },
    { idClient: '0018', idOrder: '9638527', name: 'Isabella Reyes', email: 'isabella.r@company.com', phone: '(664) 889 45 67', company: 'Reyes Interiors', status: 'Active', lastOrder: '2025-04-28' },
];

// Staff data
export const staffData = [
    {
        id: 1,
        code: 'EMP001',
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@dovecreek.com',
        department: 'Production',
        position: 'Production Manager',
        status: 'Active',
        phone: '(664) 123-4567',
        hireDate: '2022-03-15',
        avatar: null
    },
    {
        id: 2,
        code: 'EMP002',
        name: 'Ana Garcia',
        email: 'ana.garcia@dovecreek.com',
        department: 'Design',
        position: 'Senior Designer',
        status: 'Active',
        phone: '(664) 234-5678',
        hireDate: '2021-08-20',
        avatar: null
    },
    {
        id: 3,
        code: 'EMP003',
        name: 'Roberto Silva',
        email: 'roberto.silva@dovecreek.com',
        department: 'Sales',
        position: 'Sales Representative',
        status: 'Active',
        phone: '(664) 345-6789',
        hireDate: '2023-01-10',
        avatar: null
    },
    {
        id: 4,
        code: 'EMP004',
        name: 'Maria Lopez',
        email: 'maria.lopez@dovecreek.com',
        department: 'Administration',
        position: 'HR Manager',
        status: 'Inactive',
        phone: '(664) 456-7890',
        hireDate: '2020-06-01',
        avatar: null
    },
    {
        id: 5,
        code: 'EMP005',
        name: 'Juan Hernandez',
        email: 'juan.hernandez@dovecreek.com',
        department: 'Production',
        position: 'CNC Operator',
        status: 'Active',
        phone: '(664) 567-8901',
        hireDate: '2022-11-15',
        avatar: null
    },
    {
        id: 6,
        code: 'EMP006',
        name: 'Patricia Ruiz',
        email: 'patricia.ruiz@dovecreek.com',
        department: 'Quality',
        position: 'Quality Inspector',
        status: 'Active',
        phone: '(664) 678-9012',
        hireDate: '2023-04-20',
        avatar: null
    },
    {
        id: 7,
        code: 'EMP007',
        name: 'Miguel Torres',
        email: 'miguel.torres@dovecreek.com',
        department: 'Warehouse',
        position: 'Warehouse Supervisor',
        status: 'Active',
        phone: '(664) 789-0123',
        hireDate: '2021-02-28',
        avatar: null
    },
    {
        id: 8,
        code: 'EMP008',
        name: 'Laura Sanchez',
        email: 'laura.sanchez@dovecreek.com',
        department: 'Accounting',
        position: 'Accountant',
        status: 'Inactive',
        phone: '(664) 890-1234',
        hireDate: '2022-07-10',
        avatar: null
    }
];

export const departmentOptions = ['Production', 'Design', 'Sales', 'Administration', 'Quality', 'Warehouse', 'Accounting'];
export const statusOptions = ['Active', 'Inactive'];

// Suppliers data
export const suppliersData = [
    {
        id: 1,
        code: 'SUP001',
        name: 'Northern Woods',
        contactName: 'Fernando Vega',
        email: 'sales@northernwoods.com',
        phone: '(664) 111-2233',
        category: 'Wood',
        status: 'Active',
        address: 'Industrial Blvd 1234, Tijuana BC',
        rfc: 'MNO850101ABC',
        paymentTerms: 'Net 30',
        notes: 'Main supplier for fine woods'
    },
    {
        id: 2,
        code: 'SUP002',
        name: 'Industrial Hardware SA',
        contactName: 'Carmen Diaz',
        email: 'contact@industrialhardware.mx',
        phone: '(664) 222-3344',
        category: 'Hardware',
        status: 'Active',
        address: 'Tech Ave 567, Tijuana BC',
        rfc: 'HIS900215DEF',
        paymentTerms: 'Net 15',
        notes: 'Fast deliveries, good service'
    },
    {
        id: 3,
        code: 'SUP003',
        name: 'Premium Paints',
        contactName: 'Ricardo Morales',
        email: 'ricardo@premiumpaints.com',
        phone: '(664) 333-4455',
        category: 'Finishes',
        status: 'Active',
        address: '5th Street 890, Downtown, Tijuana BC',
        rfc: 'PPR880520GHI',
        paymentTerms: 'Net 30',
        notes: ''
    },
    {
        id: 4,
        code: 'SUP004',
        name: 'Modern Textiles',
        contactName: 'Gabriela Fuentes',
        email: 'gfuentes@moderntextiles.com',
        phone: '(664) 444-5566',
        category: 'Textiles',
        status: 'Inactive',
        address: 'El Florido Industrial Park, Tijuana BC',
        rfc: 'TMO920830JKL',
        paymentTerms: 'COD',
        notes: 'Temporarily out of stock'
    },
    {
        id: 5,
        code: 'SUP005',
        name: 'BC Glass & Crystals',
        contactName: 'Alberto Ramos',
        email: 'sales@bcglass.com',
        phone: '(664) 555-6677',
        category: 'Glass',
        status: 'Active',
        address: 'Diaz Ordaz Blvd 2345, Tijuana BC',
        rfc: 'VCB870115MNO',
        paymentTerms: 'Net 45',
        notes: 'Tempered glass specialists'
    },
    {
        id: 6,
        code: 'SUP006',
        name: 'Pacific Steel',
        contactName: 'Oscar Medina',
        email: 'omedina@pacificsteel.mx',
        phone: '(664) 666-7788',
        category: 'Metal',
        status: 'Active',
        address: 'Otay Industrial Zone, Tijuana BC',
        rfc: 'ADP910425PQR',
        paymentTerms: 'Net 30',
        notes: ''
    }
];

export const supplierCategoryOptions = ['Wood', 'Hardware', 'Finishes', 'Textiles', 'Glass', 'Metal', 'Electronics', 'Packaging'];
export const paymentTermsOptions = ['COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];

// Materials data
export const materialsData = [
    {
        id: 1,
        code: 'MAT-001',
        name: 'MDF 18mm Natural',
        description: 'MDF board 18mm, natural finish',
        category: 'Boards',
        unit: 'Piece',
        stock: 150,
        minStock: 50,
        maxStock: 300,
        cost: 450.00,
        supplier: 'Northern Woods',
        location: 'A-01-01',
        status: 'Active',
        statusQB: 'synced',
        lastSync: '2025-04-28'
    },
    {
        id: 2,
        code: 'MAT-002',
        name: 'White Melamine 16mm',
        description: 'White melamine board 16mm',
        category: 'Boards',
        unit: 'Piece',
        stock: 85,
        minStock: 30,
        maxStock: 200,
        cost: 380.00,
        supplier: 'Northern Woods',
        location: 'A-01-02',
        status: 'Active',
        statusQB: 'synced',
        lastSync: '2025-04-28'
    },
    {
        id: 3,
        code: 'MAT-003',
        name: 'Soft Close Hinge',
        description: 'Soft close hinge 35mm',
        category: 'Hardware',
        unit: 'Piece',
        stock: 500,
        minStock: 100,
        maxStock: 1000,
        cost: 45.00,
        supplier: 'Industrial Hardware SA',
        location: 'B-02-01',
        status: 'Active',
        statusQB: 'pending',
        lastSync: '2025-04-25'
    },
    {
        id: 4,
        code: 'MAT-004',
        name: 'Telescopic Slide 45cm',
        description: 'Full extension telescopic slide 45cm',
        category: 'Hardware',
        unit: 'Pair',
        stock: 12,
        minStock: 50,
        maxStock: 200,
        cost: 120.00,
        supplier: 'Industrial Hardware SA',
        location: 'B-02-02',
        status: 'Low Stock',
        statusQB: 'synced',
        lastSync: '2025-04-28'
    },
    {
        id: 5,
        code: 'MAT-005',
        name: 'White Matte Lacquer',
        description: 'Polyurethane white matte lacquer, gallon',
        category: 'Finishes',
        unit: 'Gallon',
        stock: 25,
        minStock: 10,
        maxStock: 50,
        cost: 650.00,
        supplier: 'Premium Paints',
        location: 'C-03-01',
        status: 'Active',
        statusQB: 'error',
        lastSync: '2025-04-20'
    },
    {
        id: 6,
        code: 'MAT-006',
        name: 'Screw 4x40mm',
        description: 'Particle board screw 4x40mm, box of 500',
        category: 'Fasteners',
        unit: 'Box',
        stock: 45,
        minStock: 20,
        maxStock: 100,
        cost: 180.00,
        supplier: 'Industrial Hardware SA',
        location: 'B-03-01',
        status: 'Active',
        statusQB: 'synced',
        lastSync: '2025-04-28'
    },
    {
        id: 7,
        code: 'MAT-007',
        name: 'Tempered Glass 6mm',
        description: 'Clear tempered glass 6mm, per sqm',
        category: 'Glass',
        unit: 'sqm',
        stock: 30,
        minStock: 15,
        maxStock: 60,
        cost: 850.00,
        supplier: 'BC Glass & Crystals',
        location: 'D-01-01',
        status: 'Active',
        statusQB: 'synced',
        lastSync: '2025-04-27'
    },
    {
        id: 8,
        code: 'MAT-008',
        name: 'Gray Linen Fabric',
        description: 'Linen-type fabric gray color, linear meter',
        category: 'Textiles',
        unit: 'Meter',
        stock: 0,
        minStock: 20,
        maxStock: 100,
        cost: 220.00,
        supplier: 'Modern Textiles',
        location: 'E-01-01',
        status: 'Out of Stock',
        statusQB: 'pending',
        lastSync: '2025-04-15'
    }
];

export const materialCategoryOptions = ['Boards', 'Hardware', 'Finishes', 'Fasteners', 'Glass', 'Textiles', 'Metals', 'Electronics'];
export const materialUnitOptions = ['Piece', 'Pair', 'Box', 'Gallon', 'sqm', 'Meter', 'Kg', 'Liter'];
export const materialStatusOptions = ['Active', 'Low Stock', 'Out of Stock', 'Discontinued'];

// Products data
export const productsData = [
    {
        id: 1,
        name: 'Executive Desk',
        description: 'Executive desk in walnut wood with matte finish',
        status: 'Active',
        statusQB: 'synced',
        costPrice: 4500.00,
        price: 8500.00,
        account: 'Sales - Furniture',
        currency: 'MXN'
    },
    {
        id: 2,
        name: 'Premium Ergonomic Chair',
        description: 'Ergonomic chair with lumbar support and adjustable armrests',
        status: 'Active',
        statusQB: 'synced',
        costPrice: 2800.00,
        price: 5200.00,
        account: 'Sales - Furniture',
        currency: 'MXN'
    },
    {
        id: 3,
        name: '5-Tier Modular Bookshelf',
        description: '5-tier modular bookshelf in white melamine',
        status: 'Active',
        statusQB: 'pending',
        costPrice: 1800.00,
        price: 3400.00,
        account: 'Sales - Furniture',
        currency: 'MXN'
    },
    {
        id: 4,
        name: '8-Person Conference Table',
        description: 'Conference table for 8 people with metal base',
        status: 'Active',
        statusQB: 'synced',
        costPrice: 8500.00,
        price: 15000.00,
        account: 'Sales - Furniture',
        currency: 'MXN'
    },
    {
        id: 5,
        name: '4-Drawer File Cabinet',
        description: 'Metal 4-drawer file cabinet with lock',
        status: 'Inactive',
        statusQB: 'error',
        costPrice: 2200.00,
        price: 4100.00,
        account: 'Sales - Furniture',
        currency: 'MXN'
    },
    {
        id: 6,
        name: 'Executive Credenza',
        description: 'Executive credenza with sliding doors and drawers',
        status: 'Active',
        statusQB: 'synced',
        costPrice: 5500.00,
        price: 9800.00,
        account: 'Sales - Furniture',
        currency: 'MXN'
    }
];

export const productStatusOptions = ['Active', 'Inactive', 'Discontinued'];
export const currencyOptions = ['MXN', 'USD'];
export const accountOptions = ['Sales - Furniture', 'Sales - Accessories', 'Sales - Services'];

// Projects data
export const projectsData = [
    {
        id: 1,
        name: 'ABC Corporate Office',
        description: 'Corporate office furniture project',
        status: 'Active',
        poNumber: 'PO-2024-001',
        workOrder: 'WO-001',
        estimateNumber: 'EST-001',
        terms: 'Net 30',
        nameAddress: 'ABC Corporation, Main Ave 123',
        shipTo: 'North Industrial Zone',
        contact: 'John Smith - 664 123 4567',
        salesRep: 'Carlos Mendoza',
        csr: 'Ana Garcia',
        subtotal: 45000,
        tax: 7200,
        total: 52200
    },
    {
        id: 2,
        name: 'Los Pinos Residential',
        description: 'Full kitchen and closets for residential home',
        status: 'Active',
        poNumber: 'PO-2024-002',
        workOrder: 'WO-002',
        estimateNumber: 'EST-002',
        terms: 'Net 15',
        nameAddress: 'Rodriguez Family, Los Pinos 456',
        shipTo: 'Los Pinos Neighborhood',
        contact: 'Maria Rodriguez - 664 234 5678',
        salesRep: 'Roberto Silva',
        csr: 'Patricia Ruiz',
        subtotal: 128000,
        tax: 20480,
        total: 148480
    },
    {
        id: 3,
        name: 'The Terrace Restaurant',
        description: 'Bar and furniture for restaurant',
        status: 'Completed',
        poNumber: 'PO-2024-003',
        workOrder: 'WO-003',
        estimateNumber: 'EST-003',
        terms: 'COD',
        nameAddress: 'Gastro Group SA, Coastal Blvd 789',
        shipTo: 'The Terrace Restaurant, Playas',
        contact: 'Chef Antonio - 664 345 6789',
        salesRep: 'Carlos Mendoza',
        csr: 'Ana Garcia',
        subtotal: 85000,
        tax: 13600,
        total: 98600
    },
    {
        id: 4,
        name: 'Health+ Medical Office',
        description: 'Reception and equipped medical offices',
        status: 'On Hold',
        poNumber: 'PO-2024-004',
        workOrder: 'WO-004',
        estimateNumber: 'EST-004',
        terms: 'Net 45',
        nameAddress: 'Dr. Ramirez, Medical Tower Floor 5',
        shipTo: 'Medical Tower, Rio Zone',
        contact: 'Dr. Ramirez - 664 456 7890',
        salesRep: 'Roberto Silva',
        csr: 'Laura Sanchez',
        subtotal: 65000,
        tax: 10400,
        total: 75400
    },
    {
        id: 5,
        name: 'Eleganza Boutique Store',
        description: 'Display cases and fitting rooms for boutique',
        status: 'Active',
        poNumber: 'PO-2024-005',
        workOrder: 'WO-005',
        estimateNumber: 'EST-005',
        terms: 'Net 30',
        nameAddress: 'Eleganza SA de CV, Commercial Plaza',
        shipTo: 'Unit 45, Galerias Plaza',
        contact: 'Ms. Fernanda - 664 567 8901',
        salesRep: 'Carlos Mendoza',
        csr: 'Patricia Ruiz',
        subtotal: 92000,
        tax: 14720,
        total: 106720
    }
];

export const projectStatusOptions = ['Active', 'Inactive', 'Completed', 'On Hold'];
export const termsOptions = ['Net 15', 'Net 30', 'Net 45', 'Due on Receipt', 'COD'];

// Helper functions
export const getStatusClass = (status) => {
    const statusMap = {
        'completed': 'status-completed',
        'urgent': 'status-urgent',
        'paused': 'status-paused',
        'in_progress': 'status-in-progress'
    };
    return statusMap[status] || '';
};

export const getStatusLabel = (status) => {
    const labelMap = {
        'completed': 'Completed',
        'urgent': 'Urgent',
        'paused': 'Paused',
        'in_progress': 'In Progress'
    };
    return labelMap[status] || status;
};

// Operations - Stage definitions
export const operationStages = [
    { key: 'roughMill', label: 'Rough Mill', icon: 'precision_manufacturing' },
    { key: 'fineMill', label: 'Fine Mill', icon: 'carpenter' },
    { key: 'metal', label: 'Metal', icon: 'hardware' },
    { key: 'assembly', label: 'Assembly', icon: 'construction' },
    { key: 'preHanging', label: 'Pre-hanging', icon: 'door_sliding' },
    { key: 'sanding', label: 'Sanding', icon: 'texture' },
    { key: 'glazing', label: 'Glazing', icon: 'window' },
    { key: 'filling', label: 'Filling', icon: 'format_paint' },
    { key: 'painting', label: 'Painting', icon: 'brush' },
    { key: 'qc', label: 'Quality Control', icon: 'verified' },
    { key: 'shipping', label: 'Shipping', icon: 'local_shipping' }
];

export const divisionOptions = ['Carpentry', 'Assembly', 'Painting', 'Metal', 'Glazing'];
export const operationStatusOptions = ['Pending', 'In Progress', 'Completed', 'On Hold'];
export const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
export const stageStatusOptions = ['pending', 'in_progress', 'completed', 'skipped'];

// Helper to create default stages
const createDefaultStages = () => {
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
};

// Operations data
export const operationsData = [
    {
        id: 1,
        projectId: 1,
        projectName: 'ABC Corporate Office',
        workOrderNumber: 'OP-2024-001',
        status: 'In Progress',
        priority: 'High',
        createdAt: '2024-12-01',
        dueDate: '2025-01-15',
        assignedDivisions: ['Carpentry', 'Assembly', 'Painting'],
        currentStage: 'assembly',
        progress: 36,
        stages: {
            roughMill: { status: 'completed', assignedTo: [5], startDate: '2024-12-02', endDate: '2024-12-04', estimatedHours: 16, actualHours: 18, notes: '' },
            fineMill: { status: 'completed', assignedTo: [5], startDate: '2024-12-05', endDate: '2024-12-07', estimatedHours: 12, actualHours: 10, notes: '' },
            metal: { status: 'skipped', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: 'No metal work required' },
            assembly: { status: 'in_progress', assignedTo: [1, 5], startDate: '2024-12-08', endDate: '', estimatedHours: 24, actualHours: 12, notes: 'In progress - desks assembly' },
            preHanging: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 8, actualHours: 0, notes: '' },
            sanding: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 6, actualHours: 0, notes: '' },
            glazing: { status: 'skipped', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: 'No glass work' },
            filling: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 4, actualHours: 0, notes: '' },
            painting: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 16, actualHours: 0, notes: '' },
            qc: { status: 'pending', assignedTo: [6], startDate: '', endDate: '', estimatedHours: 4, actualHours: 0, notes: '' },
            shipping: { status: 'pending', assignedTo: [7], startDate: '', endDate: '', estimatedHours: 4, actualHours: 0, notes: '' }
        },
        materials: [
            { materialId: 1, materialName: 'MDF 18mm Natural', estimated: 20, distributed: 15, unit: 'Piece' },
            { materialId: 3, materialName: 'Soft Close Hinge', estimated: 48, distributed: 48, unit: 'Piece' },
            { materialId: 6, materialName: 'Screw 4x40mm', estimated: 4, distributed: 2, unit: 'Box' }
        ],
        notes: 'Executive office furniture set - 4 desks with storage'
    },
    {
        id: 2,
        projectId: 2,
        projectName: 'Los Pinos Residential',
        workOrderNumber: 'OP-2024-002',
        status: 'In Progress',
        priority: 'Medium',
        createdAt: '2024-12-05',
        dueDate: '2025-01-30',
        assignedDivisions: ['Carpentry', 'Assembly', 'Painting', 'Glazing'],
        currentStage: 'painting',
        progress: 73,
        stages: {
            roughMill: { status: 'completed', assignedTo: [5], startDate: '2024-12-06', endDate: '2024-12-08', estimatedHours: 20, actualHours: 22, notes: '' },
            fineMill: { status: 'completed', assignedTo: [5], startDate: '2024-12-09', endDate: '2024-12-11', estimatedHours: 16, actualHours: 15, notes: '' },
            metal: { status: 'completed', assignedTo: [1], startDate: '2024-12-10', endDate: '2024-12-11', estimatedHours: 8, actualHours: 8, notes: 'Kitchen hardware' },
            assembly: { status: 'completed', assignedTo: [1, 5], startDate: '2024-12-12', endDate: '2024-12-15', estimatedHours: 32, actualHours: 30, notes: '' },
            preHanging: { status: 'completed', assignedTo: [1], startDate: '2024-12-16', endDate: '2024-12-16', estimatedHours: 8, actualHours: 6, notes: '' },
            sanding: { status: 'completed', assignedTo: [5], startDate: '2024-12-17', endDate: '2024-12-17', estimatedHours: 4, actualHours: 4, notes: '' },
            glazing: { status: 'completed', assignedTo: [1], startDate: '2024-12-18', endDate: '2024-12-18', estimatedHours: 6, actualHours: 5, notes: 'Cabinet doors glass' },
            filling: { status: 'completed', assignedTo: [5], startDate: '2024-12-19', endDate: '2024-12-19', estimatedHours: 3, actualHours: 3, notes: '' },
            painting: { status: 'in_progress', assignedTo: [1, 5], startDate: '2024-12-20', endDate: '', estimatedHours: 20, actualHours: 8, notes: 'White matte finish' },
            qc: { status: 'pending', assignedTo: [6], startDate: '', endDate: '', estimatedHours: 6, actualHours: 0, notes: '' },
            shipping: { status: 'pending', assignedTo: [7], startDate: '', endDate: '', estimatedHours: 8, actualHours: 0, notes: '' }
        },
        materials: [
            { materialId: 2, materialName: 'White Melamine 16mm', estimated: 30, distributed: 30, unit: 'Piece' },
            { materialId: 3, materialName: 'Soft Close Hinge', estimated: 64, distributed: 64, unit: 'Piece' },
            { materialId: 4, materialName: 'Telescopic Slide 45cm', estimated: 12, distributed: 12, unit: 'Pair' },
            { materialId: 5, materialName: 'White Matte Lacquer', estimated: 8, distributed: 6, unit: 'Gallon' },
            { materialId: 7, materialName: 'Tempered Glass 6mm', estimated: 4, distributed: 4, unit: 'sqm' }
        ],
        notes: 'Full kitchen and master closet'
    },
    {
        id: 3,
        projectId: 5,
        projectName: 'Eleganza Boutique Store',
        workOrderNumber: 'OP-2024-003',
        status: 'Pending',
        priority: 'Low',
        createdAt: '2024-12-15',
        dueDate: '2025-02-28',
        assignedDivisions: ['Carpentry', 'Metal', 'Glazing', 'Painting'],
        currentStage: 'roughMill',
        progress: 0,
        stages: {
            roughMill: { status: 'pending', assignedTo: [5], startDate: '', endDate: '', estimatedHours: 24, actualHours: 0, notes: '' },
            fineMill: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 20, actualHours: 0, notes: '' },
            metal: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 16, actualHours: 0, notes: 'Display fixtures' },
            assembly: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 32, actualHours: 0, notes: '' },
            preHanging: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 8, actualHours: 0, notes: '' },
            sanding: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 8, actualHours: 0, notes: '' },
            glazing: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 12, actualHours: 0, notes: 'Display cases glass' },
            filling: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 4, actualHours: 0, notes: '' },
            painting: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 16, actualHours: 0, notes: '' },
            qc: { status: 'pending', assignedTo: [6], startDate: '', endDate: '', estimatedHours: 8, actualHours: 0, notes: '' },
            shipping: { status: 'pending', assignedTo: [7], startDate: '', endDate: '', estimatedHours: 6, actualHours: 0, notes: '' }
        },
        materials: [
            { materialId: 1, materialName: 'MDF 18mm Natural', estimated: 40, distributed: 0, unit: 'Piece' },
            { materialId: 7, materialName: 'Tempered Glass 6mm', estimated: 15, distributed: 0, unit: 'sqm' }
        ],
        notes: 'Display cases and fitting rooms'
    },
    {
        id: 4,
        projectId: 3,
        projectName: 'The Terrace Restaurant',
        workOrderNumber: 'OP-2024-004',
        status: 'Completed',
        priority: 'High',
        createdAt: '2024-10-01',
        dueDate: '2024-11-15',
        assignedDivisions: ['Carpentry', 'Metal', 'Assembly', 'Painting'],
        currentStage: 'shipping',
        progress: 100,
        stages: {
            roughMill: { status: 'completed', assignedTo: [5], startDate: '2024-10-02', endDate: '2024-10-05', estimatedHours: 24, actualHours: 26, notes: '' },
            fineMill: { status: 'completed', assignedTo: [5], startDate: '2024-10-06', endDate: '2024-10-09', estimatedHours: 20, actualHours: 18, notes: '' },
            metal: { status: 'completed', assignedTo: [1], startDate: '2024-10-08', endDate: '2024-10-12', estimatedHours: 16, actualHours: 20, notes: 'Bar footrail and supports' },
            assembly: { status: 'completed', assignedTo: [1, 5], startDate: '2024-10-13', endDate: '2024-10-20', estimatedHours: 40, actualHours: 38, notes: '' },
            preHanging: { status: 'skipped', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: 'N/A' },
            sanding: { status: 'completed', assignedTo: [5], startDate: '2024-10-21', endDate: '2024-10-22', estimatedHours: 8, actualHours: 8, notes: '' },
            glazing: { status: 'skipped', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: 'N/A' },
            filling: { status: 'completed', assignedTo: [5], startDate: '2024-10-23', endDate: '2024-10-23', estimatedHours: 4, actualHours: 3, notes: '' },
            painting: { status: 'completed', assignedTo: [1, 5], startDate: '2024-10-24', endDate: '2024-10-30', estimatedHours: 24, actualHours: 28, notes: 'Special dark walnut stain' },
            qc: { status: 'completed', assignedTo: [6], startDate: '2024-10-31', endDate: '2024-11-01', estimatedHours: 6, actualHours: 6, notes: 'Passed all inspections' },
            shipping: { status: 'completed', assignedTo: [7], startDate: '2024-11-02', endDate: '2024-11-02', estimatedHours: 8, actualHours: 10, notes: 'Delivered and installed' }
        },
        materials: [
            { materialId: 1, materialName: 'MDF 18mm Natural', estimated: 35, distributed: 35, unit: 'Piece' },
            { materialId: 3, materialName: 'Soft Close Hinge', estimated: 24, distributed: 24, unit: 'Piece' },
            { materialId: 5, materialName: 'White Matte Lacquer', estimated: 10, distributed: 10, unit: 'Gallon' },
            { materialId: 6, materialName: 'Screw 4x40mm', estimated: 6, distributed: 6, unit: 'Box' }
        ],
        notes: 'Bar counter, hostess station, and dining furniture - COMPLETED'
    }
];

// Quality Assurance (QA) Data
export const qaChecklistTemplates = [
    {
        id: 1,
        name: 'Rough Mill Inspection',
        stage: 'roughMill',
        items: [
            { id: 1, text: 'Material dimensions match specifications', required: true },
            { id: 2, text: 'No visible defects or cracks', required: true },
            { id: 3, text: 'Grain direction correct', required: false },
            { id: 4, text: 'Moisture content within acceptable range', required: true },
            { id: 5, text: 'Pieces properly labeled', required: true }
        ]
    },
    {
        id: 2,
        name: 'Assembly Inspection',
        stage: 'assembly',
        items: [
            { id: 1, text: 'All joints properly aligned', required: true },
            { id: 2, text: 'Fasteners properly installed', required: true },
            { id: 3, text: 'Hardware functions correctly', required: true },
            { id: 4, text: 'No gaps or misalignments', required: true },
            { id: 5, text: 'Structural integrity verified', required: true },
            { id: 6, text: 'Dimensions match drawings', required: true }
        ]
    },
    {
        id: 3,
        name: 'Sanding Inspection',
        stage: 'sanding',
        items: [
            { id: 1, text: 'Surface smooth to touch (150+ grit)', required: true },
            { id: 2, text: 'No visible scratches or marks', required: true },
            { id: 3, text: 'Edges properly rounded', required: false },
            { id: 4, text: 'Dust removed from surface', required: true }
        ]
    },
    {
        id: 4,
        name: 'Painting/Finishing Inspection',
        stage: 'painting',
        items: [
            { id: 1, text: 'Color matches specification', required: true },
            { id: 2, text: 'No drips or runs', required: true },
            { id: 3, text: 'No dust inclusions', required: true },
            { id: 4, text: 'Coverage is uniform', required: true },
            { id: 5, text: 'Finish cured properly', required: true },
            { id: 6, text: 'Sheen level correct', required: false }
        ]
    },
    {
        id: 5,
        name: 'Final QC Inspection',
        stage: 'qc',
        items: [
            { id: 1, text: 'Overall appearance acceptable', required: true },
            { id: 2, text: 'All hardware functional', required: true },
            { id: 3, text: 'Dimensions verified', required: true },
            { id: 4, text: 'Finish quality approved', required: true },
            { id: 5, text: 'No defects or damage', required: true },
            { id: 6, text: 'Packaging requirements met', required: true },
            { id: 7, text: 'Documentation complete', required: true }
        ]
    }
];

export const qaFindingTypes = ['Defect', 'Rework Required', 'Scrap', 'Minor Issue', 'Observation'];
export const qaSeverityLevels = ['Critical', 'Major', 'Minor', 'Cosmetic'];
export const qaStatusOptions = ['Open', 'In Progress', 'Resolved', 'Closed', 'Deferred'];

export const qaInspectionsData = [
    {
        id: 1,
        operationId: 1,
        workOrderNumber: 'OP-2024-001',
        projectName: 'ABC Corporate Office',
        stage: 'assembly',
        templateId: 2,
        inspectorId: 6,
        inspectorName: 'Patricia Ruiz',
        inspectionDate: '2024-12-10',
        status: 'Completed',
        result: 'Passed',
        checklist: [
            { itemId: 1, checked: true, notes: '' },
            { itemId: 2, checked: true, notes: '' },
            { itemId: 3, checked: true, notes: '' },
            { itemId: 4, checked: true, notes: 'Minor gap on drawer front - acceptable' },
            { itemId: 5, checked: true, notes: '' },
            { itemId: 6, checked: true, notes: '' }
        ],
        findings: [],
        notes: 'All items passed inspection'
    },
    {
        id: 2,
        operationId: 2,
        workOrderNumber: 'OP-2024-002',
        projectName: 'Los Pinos Residential',
        stage: 'painting',
        templateId: 4,
        inspectorId: 6,
        inspectorName: 'Patricia Ruiz',
        inspectionDate: '2024-12-18',
        status: 'Completed',
        result: 'Failed',
        checklist: [
            { itemId: 1, checked: true, notes: '' },
            { itemId: 2, checked: false, notes: 'Drip found on cabinet door #3' },
            { itemId: 3, checked: true, notes: '' },
            { itemId: 4, checked: false, notes: 'Uneven coverage on drawer front' },
            { itemId: 5, checked: true, notes: '' },
            { itemId: 6, checked: true, notes: '' }
        ],
        findings: [
            {
                id: 1,
                type: 'Rework Required',
                severity: 'Major',
                description: 'Paint drip on cabinet door #3 requires sanding and repainting',
                location: 'Cabinet door #3, right side',
                photos: ['drip_photo_1.jpg'],
                status: 'In Progress',
                assignedTo: 5,
                createdAt: '2024-12-18',
                resolvedAt: null
            },
            {
                id: 2,
                type: 'Minor Issue',
                severity: 'Minor',
                description: 'Uneven coverage on drawer front - needs touch-up',
                location: 'Top drawer, front panel',
                photos: [],
                status: 'Resolved',
                assignedTo: 5,
                createdAt: '2024-12-18',
                resolvedAt: '2024-12-19'
            }
        ],
        notes: 'Rework required before re-inspection'
    },
    {
        id: 3,
        operationId: 4,
        workOrderNumber: 'OP-2024-004',
        projectName: 'The Terrace Restaurant',
        stage: 'qc',
        templateId: 5,
        inspectorId: 6,
        inspectorName: 'Patricia Ruiz',
        inspectionDate: '2024-11-01',
        status: 'Completed',
        result: 'Passed',
        checklist: [
            { itemId: 1, checked: true, notes: 'Excellent finish quality' },
            { itemId: 2, checked: true, notes: '' },
            { itemId: 3, checked: true, notes: '' },
            { itemId: 4, checked: true, notes: '' },
            { itemId: 5, checked: true, notes: '' },
            { itemId: 6, checked: true, notes: '' },
            { itemId: 7, checked: true, notes: '' }
        ],
        findings: [],
        notes: 'Final QC passed. Ready for shipping.'
    },
    {
        id: 4,
        operationId: 1,
        workOrderNumber: 'OP-2024-001',
        projectName: 'ABC Corporate Office',
        stage: 'roughMill',
        templateId: 1,
        inspectorId: 6,
        inspectorName: 'Patricia Ruiz',
        inspectionDate: '2024-12-04',
        status: 'Completed',
        result: 'Passed with Observations',
        checklist: [
            { itemId: 1, checked: true, notes: '' },
            { itemId: 2, checked: true, notes: '' },
            { itemId: 3, checked: true, notes: '' },
            { itemId: 4, checked: true, notes: 'Moisture at 8%, acceptable' },
            { itemId: 5, checked: true, notes: '' }
        ],
        findings: [
            {
                id: 1,
                type: 'Observation',
                severity: 'Cosmetic',
                description: 'Minor knot visible on panel #7, may need filler during finishing',
                location: 'Panel #7, top left corner',
                photos: ['knot_observation.jpg'],
                status: 'Closed',
                assignedTo: null,
                createdAt: '2024-12-04',
                resolvedAt: '2024-12-04'
            }
        ],
        notes: 'Material quality good overall'
    }
];

// QA Metrics helpers
export const qaResultOptions = ['Passed', 'Failed', 'Passed with Observations', 'Pending'];

// ============================================
// Staff Performance & Attendance Data
// ============================================

// Attendance records
export const attendanceData = [
    // Carlos Mendoza - Production Manager
    { id: 1, staffId: 1, date: '2024-12-16', clockIn: '07:55', clockOut: '17:05', hoursWorked: 9.17, status: 'Present', notes: '' },
    { id: 2, staffId: 1, date: '2024-12-17', clockIn: '08:02', clockOut: '17:30', hoursWorked: 9.47, status: 'Present', notes: 'Overtime - project deadline' },
    { id: 3, staffId: 1, date: '2024-12-18', clockIn: '07:58', clockOut: '17:00', hoursWorked: 9.03, status: 'Present', notes: '' },
    { id: 4, staffId: 1, date: '2024-12-19', clockIn: '08:00', clockOut: '17:15', hoursWorked: 9.25, status: 'Present', notes: '' },
    { id: 5, staffId: 1, date: '2024-12-20', clockIn: '07:50', clockOut: '17:00', hoursWorked: 9.17, status: 'Present', notes: '' },

    // Ana Garcia - Senior Designer
    { id: 6, staffId: 2, date: '2024-12-16', clockIn: '08:30', clockOut: '17:30', hoursWorked: 9.0, status: 'Present', notes: '' },
    { id: 7, staffId: 2, date: '2024-12-17', clockIn: '08:25', clockOut: '17:30', hoursWorked: 9.08, status: 'Present', notes: '' },
    { id: 8, staffId: 2, date: '2024-12-18', clockIn: null, clockOut: null, hoursWorked: 0, status: 'Absent', notes: 'Sick leave' },
    { id: 9, staffId: 2, date: '2024-12-19', clockIn: '08:30', clockOut: '17:30', hoursWorked: 9.0, status: 'Present', notes: '' },
    { id: 10, staffId: 2, date: '2024-12-20', clockIn: '08:35', clockOut: '17:30', hoursWorked: 8.92, status: 'Late', notes: 'Traffic' },

    // Juan Hernandez - CNC Operator
    { id: 11, staffId: 5, date: '2024-12-16', clockIn: '06:55', clockOut: '15:00', hoursWorked: 8.08, status: 'Present', notes: '' },
    { id: 12, staffId: 5, date: '2024-12-17', clockIn: '06:58', clockOut: '15:30', hoursWorked: 8.53, status: 'Present', notes: '' },
    { id: 13, staffId: 5, date: '2024-12-18', clockIn: '07:00', clockOut: '16:00', hoursWorked: 9.0, status: 'Present', notes: 'Extra shift' },
    { id: 14, staffId: 5, date: '2024-12-19', clockIn: '06:50', clockOut: '15:00', hoursWorked: 8.17, status: 'Present', notes: '' },
    { id: 15, staffId: 5, date: '2024-12-20', clockIn: '07:00', clockOut: '15:00', hoursWorked: 8.0, status: 'Present', notes: '' },

    // Patricia Ruiz - Quality Inspector
    { id: 16, staffId: 6, date: '2024-12-16', clockIn: '08:00', clockOut: '17:00', hoursWorked: 9.0, status: 'Present', notes: '' },
    { id: 17, staffId: 6, date: '2024-12-17', clockIn: '08:05', clockOut: '17:00', hoursWorked: 8.92, status: 'Present', notes: '' },
    { id: 18, staffId: 6, date: '2024-12-18', clockIn: '08:00', clockOut: '18:00', hoursWorked: 10.0, status: 'Present', notes: 'Overtime - QC inspections' },
    { id: 19, staffId: 6, date: '2024-12-19', clockIn: '08:00', clockOut: '17:00', hoursWorked: 9.0, status: 'Present', notes: '' },
    { id: 20, staffId: 6, date: '2024-12-20', clockIn: '07:55', clockOut: '17:00', hoursWorked: 9.08, status: 'Present', notes: '' },

    // Miguel Torres - Warehouse Supervisor
    { id: 21, staffId: 7, date: '2024-12-16', clockIn: '07:00', clockOut: '16:00', hoursWorked: 9.0, status: 'Present', notes: '' },
    { id: 22, staffId: 7, date: '2024-12-17', clockIn: '07:30', clockOut: '16:00', hoursWorked: 8.5, status: 'Late', notes: 'Personal appointment' },
    { id: 23, staffId: 7, date: '2024-12-18', clockIn: '07:00', clockOut: '16:30', hoursWorked: 9.5, status: 'Present', notes: '' },
    { id: 24, staffId: 7, date: '2024-12-19', clockIn: '07:00', clockOut: '16:00', hoursWorked: 9.0, status: 'Present', notes: '' },
    { id: 25, staffId: 7, date: '2024-12-20', clockIn: '07:00', clockOut: '16:00', hoursWorked: 9.0, status: 'Present', notes: '' }
];

// Hours worked per operation (links staff to operations)
export const staffOperationHours = [
    // OP-2024-001 - ABC Corporate Office
    { id: 1, staffId: 1, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'assembly', date: '2024-12-08', hours: 6, division: 'Assembly' },
    { id: 2, staffId: 1, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'assembly', date: '2024-12-09', hours: 6, division: 'Assembly' },
    { id: 3, staffId: 5, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'roughMill', date: '2024-12-02', hours: 8, division: 'Carpentry' },
    { id: 4, staffId: 5, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'roughMill', date: '2024-12-03', hours: 8, division: 'Carpentry' },
    { id: 5, staffId: 5, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'fineMill', date: '2024-12-05', hours: 5, division: 'Carpentry' },
    { id: 6, staffId: 5, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'fineMill', date: '2024-12-06', hours: 5, division: 'Carpentry' },
    { id: 7, staffId: 5, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'assembly', date: '2024-12-08', hours: 4, division: 'Assembly' },
    { id: 8, staffId: 6, operationId: 1, workOrderNumber: 'OP-2024-001', stage: 'qc', date: '2024-12-10', hours: 2, division: 'Quality' },

    // OP-2024-002 - Los Pinos Residential
    { id: 9, staffId: 5, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'roughMill', date: '2024-12-06', hours: 8, division: 'Carpentry' },
    { id: 10, staffId: 5, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'roughMill', date: '2024-12-07', hours: 8, division: 'Carpentry' },
    { id: 11, staffId: 5, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'fineMill', date: '2024-12-09', hours: 8, division: 'Carpentry' },
    { id: 12, staffId: 5, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'fineMill', date: '2024-12-10', hours: 7, division: 'Carpentry' },
    { id: 13, staffId: 1, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'metal', date: '2024-12-10', hours: 4, division: 'Metal' },
    { id: 14, staffId: 1, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'metal', date: '2024-12-11', hours: 4, division: 'Metal' },
    { id: 15, staffId: 1, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'assembly', date: '2024-12-12', hours: 8, division: 'Assembly' },
    { id: 16, staffId: 5, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'assembly', date: '2024-12-12', hours: 8, division: 'Assembly' },
    { id: 17, staffId: 1, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'assembly', date: '2024-12-13', hours: 8, division: 'Assembly' },
    { id: 18, staffId: 5, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'assembly', date: '2024-12-13', hours: 8, division: 'Assembly' },
    { id: 19, staffId: 1, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'painting', date: '2024-12-20', hours: 4, division: 'Painting' },
    { id: 20, staffId: 5, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'painting', date: '2024-12-20', hours: 4, division: 'Painting' },
    { id: 21, staffId: 6, operationId: 2, workOrderNumber: 'OP-2024-002', stage: 'qc', date: '2024-12-18', hours: 3, division: 'Quality' },

    // OP-2024-004 - The Terrace Restaurant (Completed)
    { id: 22, staffId: 5, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'roughMill', date: '2024-10-02', hours: 8, division: 'Carpentry' },
    { id: 23, staffId: 5, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'roughMill', date: '2024-10-03', hours: 8, division: 'Carpentry' },
    { id: 24, staffId: 5, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'roughMill', date: '2024-10-04', hours: 10, division: 'Carpentry' },
    { id: 25, staffId: 1, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'metal', date: '2024-10-08', hours: 8, division: 'Metal' },
    { id: 26, staffId: 1, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'metal', date: '2024-10-09', hours: 8, division: 'Metal' },
    { id: 27, staffId: 1, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'assembly', date: '2024-10-13', hours: 8, division: 'Assembly' },
    { id: 28, staffId: 5, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'assembly', date: '2024-10-13', hours: 8, division: 'Assembly' },
    { id: 29, staffId: 1, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'painting', date: '2024-10-24', hours: 8, division: 'Painting' },
    { id: 30, staffId: 5, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'painting', date: '2024-10-24', hours: 8, division: 'Painting' },
    { id: 31, staffId: 6, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'qc', date: '2024-10-31', hours: 6, division: 'Quality' },
    { id: 32, staffId: 7, operationId: 4, workOrderNumber: 'OP-2024-004', stage: 'shipping', date: '2024-11-02', hours: 10, division: 'Warehouse' }
];

// Staff productivity metrics (aggregated)
export const staffProductivityData = [
    {
        staffId: 1,
        staffName: 'Carlos Mendoza',
        department: 'Production',
        division: 'Assembly',
        metrics: {
            totalHoursWorked: 186,
            totalOrdersWorked: 8,
            avgHoursPerOrder: 23.25,
            completionRate: 92,
            qualityScore: 95,
            onTimeRate: 88,
            currentMonthHours: 46,
            lastMonthHours: 52
        },
        bonuses: [
            { id: 1, type: 'Performance', amount: 2500, date: '2024-11-30', reason: 'Exceeded monthly targets' },
            { id: 2, type: 'Project Completion', amount: 1500, date: '2024-11-02', reason: 'Restaurant project completed ahead of schedule' }
        ],
        alerts: []
    },
    {
        staffId: 2,
        staffName: 'Ana Garcia',
        department: 'Design',
        division: 'Design',
        metrics: {
            totalHoursWorked: 160,
            totalOrdersWorked: 12,
            avgHoursPerOrder: 13.33,
            completionRate: 98,
            qualityScore: 99,
            onTimeRate: 95,
            currentMonthHours: 35,
            lastMonthHours: 40
        },
        bonuses: [
            { id: 1, type: 'Quality', amount: 3000, date: '2024-12-15', reason: 'Zero design revisions for 3 months' }
        ],
        alerts: [
            { id: 1, type: 'Attendance', severity: 'Low', message: 'Sick leave taken on Dec 18', date: '2024-12-18' }
        ]
    },
    {
        staffId: 5,
        staffName: 'Juan Hernandez',
        department: 'Production',
        division: 'Carpentry',
        metrics: {
            totalHoursWorked: 245,
            totalOrdersWorked: 15,
            avgHoursPerOrder: 16.33,
            completionRate: 94,
            qualityScore: 91,
            onTimeRate: 90,
            currentMonthHours: 58,
            lastMonthHours: 62
        },
        bonuses: [
            { id: 1, type: 'Overtime', amount: 1800, date: '2024-12-20', reason: 'Extra shifts during holiday rush' }
        ],
        alerts: []
    },
    {
        staffId: 6,
        staffName: 'Patricia Ruiz',
        department: 'Quality',
        division: 'Quality',
        metrics: {
            totalHoursWorked: 178,
            totalOrdersWorked: 22,
            avgHoursPerOrder: 8.09,
            completionRate: 100,
            qualityScore: 98,
            onTimeRate: 97,
            currentMonthHours: 45,
            lastMonthHours: 44
        },
        bonuses: [
            { id: 1, type: 'Performance', amount: 2000, date: '2024-12-01', reason: 'Perfect inspection record' }
        ],
        alerts: []
    },
    {
        staffId: 7,
        staffName: 'Miguel Torres',
        department: 'Warehouse',
        division: 'Warehouse',
        metrics: {
            totalHoursWorked: 195,
            totalOrdersWorked: 18,
            avgHoursPerOrder: 10.83,
            completionRate: 96,
            qualityScore: 94,
            onTimeRate: 92,
            currentMonthHours: 44,
            lastMonthHours: 48
        },
        bonuses: [],
        alerts: [
            { id: 1, type: 'Attendance', severity: 'Medium', message: 'Late arrival on Dec 17', date: '2024-12-17' }
        ]
    }
];

// Performance alert types and bonus types
export const performanceAlertTypes = ['Attendance', 'Quality', 'Productivity', 'Safety'];
export const performanceAlertSeverity = ['Low', 'Medium', 'High', 'Critical'];
export const bonusTypes = ['Performance', 'Quality', 'Overtime', 'Project Completion', 'Attendance', 'Safety'];
export const attendanceStatusOptions = ['Present', 'Absent', 'Late', 'Half Day', 'Remote'];
