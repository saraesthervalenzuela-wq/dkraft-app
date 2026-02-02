/**
 * D-KRAFT ERP - Database Connection & Relations Test
 * Ejecutar con: node tests/database-test.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qalqscfrcxzzvrcvqqbp.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('\n[ERROR] VITE_SUPABASE_ANON_KEY no encontrada en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.bold}${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

// Tablas principales a probar
const TABLES = [
    'profiles',
    'categories',
    'units',
    'warehouses',
    'clients',
    'suppliers',
    'materials',
    'products',
    'bom',
    'bom_components',
    'quotations',
    'quotation_items',
    'requisitions',
    'requisition_items',
    'projects',
    'operations',
    'operation_stages',
    'operation_materials',
    'attendance',
    'activity_log',
    'qa_inspections'
];

// Relaciones a verificar (tabla_origen -> tabla_destino via campo)
const RELATIONS = [
    { from: 'materials', to: 'categories', via: 'category_id' },
    { from: 'materials', to: 'units', via: 'unit_id' },
    { from: 'materials', to: 'suppliers', via: 'supplier_id' },
    { from: 'materials', to: 'warehouses', via: 'warehouse_id' },
    { from: 'products', to: 'categories', via: 'category_id' },
    { from: 'bom', to: 'products', via: 'product_id' },
    { from: 'bom_components', to: 'bom', via: 'bom_id' },
    { from: 'bom_components', to: 'materials', via: 'material_id' },
    { from: 'quotations', to: 'clients', via: 'client_id' },
    { from: 'quotation_items', to: 'quotations', via: 'quotation_id' },
    { from: 'quotation_items', to: 'products', via: 'product_id' },
    { from: 'requisitions', to: 'clients', via: 'client_id' },
    { from: 'requisitions', to: 'quotations', via: 'quotation_id' },
    { from: 'requisitions', to: 'projects', via: 'project_id' },
    { from: 'requisition_items', to: 'requisitions', via: 'requisition_id' },
    { from: 'requisition_items', to: 'products', via: 'product_id' },
    { from: 'requisition_items', to: 'materials', via: 'material_id' },
    { from: 'projects', to: 'clients', via: 'client_id' },
    { from: 'projects', to: 'quotations', via: 'quotation_id' },
    { from: 'operations', to: 'projects', via: 'project_id' },
    { from: 'operations', to: 'products', via: 'product_id' },
    { from: 'operations', to: 'requisitions', via: 'requisition_id' },
    { from: 'operations', to: 'bom', via: 'bom_id' },
    { from: 'operation_stages', to: 'operations', via: 'operation_id' },
    { from: 'operation_materials', to: 'operations', via: 'operation_id' },
    { from: 'operation_materials', to: 'materials', via: 'material_id' },
    { from: 'attendance', to: 'profiles', via: 'staff_id' },
    { from: 'qa_inspections', to: 'operations', via: 'operation_id' }
];

// Resultados
const results = {
    connection: false,
    tables: { passed: 0, failed: 0, details: [] },
    relations: { passed: 0, failed: 0, details: [] },
    data: { counts: {} }
};

// Test 1: Conexion a Supabase
async function testConnection() {
    log.title('TEST 1: Conexion a Supabase');
    try {
        const { data, error } = await supabase.from('categories').select('count').limit(1);
        if (error) throw error;
        log.success(`Conectado a Supabase: ${supabaseUrl}`);
        results.connection = true;
        return true;
    } catch (err) {
        log.error(`No se pudo conectar: ${err.message}`);
        results.connection = false;
        return false;
    }
}

// Test 2: Verificar existencia de tablas
async function testTables() {
    log.title('TEST 2: Existencia de Tablas');

    for (const table of TABLES) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                // Si el error es de permisos RLS, la tabla existe
                if (error.code === 'PGRST301' || error.message.includes('permission')) {
                    log.warn(`${table}: Existe (sin permisos de lectura sin auth)`);
                    results.tables.passed++;
                    results.tables.details.push({ table, status: 'exists_no_auth' });
                } else {
                    throw error;
                }
            } else {
                log.success(`${table}: OK (${count ?? 0} registros)`);
                results.tables.passed++;
                results.tables.details.push({ table, status: 'ok', count: count ?? 0 });
                results.data.counts[table] = count ?? 0;
            }
        } catch (err) {
            log.error(`${table}: ${err.message}`);
            results.tables.failed++;
            results.tables.details.push({ table, status: 'error', error: err.message });
        }
    }
}

// Test 3: Verificar relaciones (foreign keys)
async function testRelations() {
    log.title('TEST 3: Relaciones entre Tablas (Foreign Keys)');

    for (const rel of RELATIONS) {
        try {
            // Intentar hacer un join para verificar la relacion
            const { data, error } = await supabase
                .from(rel.from)
                .select(`id, ${rel.via}, ${rel.to}(id)`)
                .limit(1);

            if (error) {
                // Verificar si es error de relacion o de permisos
                if (error.message.includes('relationship') || error.code === '42703') {
                    log.error(`${rel.from} -> ${rel.to} (${rel.via}): Relacion no existe`);
                    results.relations.failed++;
                    results.relations.details.push({ ...rel, status: 'no_relation' });
                } else if (error.code === 'PGRST301') {
                    log.warn(`${rel.from} -> ${rel.to} (${rel.via}): Sin permisos para verificar`);
                    results.relations.passed++;
                    results.relations.details.push({ ...rel, status: 'no_auth' });
                } else {
                    throw error;
                }
            } else {
                log.success(`${rel.from} -> ${rel.to} (${rel.via}): OK`);
                results.relations.passed++;
                results.relations.details.push({ ...rel, status: 'ok' });
            }
        } catch (err) {
            log.error(`${rel.from} -> ${rel.to} (${rel.via}): ${err.message}`);
            results.relations.failed++;
            results.relations.details.push({ ...rel, status: 'error', error: err.message });
        }
    }
}

// Test 4: Verificar datos de ejemplo
async function testSampleData() {
    log.title('TEST 4: Datos de Ejemplo');

    const queries = [
        { name: 'Clientes activos', query: supabase.from('clients').select('*').eq('status', 'Active').limit(5) },
        { name: 'Productos con precio', query: supabase.from('products').select('*').gt('price', 0).limit(5) },
        { name: 'Materiales con stock', query: supabase.from('materials').select('*').gt('stock', 0).limit(5) },
        { name: 'Cotizaciones recientes', query: supabase.from('quotations').select('*').order('created_at', { ascending: false }).limit(5) },
        { name: 'Operaciones en progreso', query: supabase.from('operations').select('*').eq('status', 'in_progress').limit(5) }
    ];

    for (const q of queries) {
        try {
            const { data, error } = await q.query;
            if (error) throw error;
            log.info(`${q.name}: ${data.length} encontrados`);
        } catch (err) {
            log.warn(`${q.name}: ${err.message}`);
        }
    }
}

// Test 5: Verificar joins complejos
async function testComplexQueries() {
    log.title('TEST 5: Queries Complejos (Joins)');

    const complexQueries = [
        {
            name: 'Cotizaciones con cliente e items',
            query: supabase
                .from('quotations')
                .select(`
                    id, number, status, total,
                    clients(id, name),
                    quotation_items(id, quantity, unit_price, total)
                `)
                .limit(3)
        },
        {
            name: 'Materiales con categoria, unidad y proveedor',
            query: supabase
                .from('materials')
                .select(`
                    id, name, stock, cost,
                    categories(id, name),
                    units(id, name, abbreviation),
                    suppliers(id, name)
                `)
                .limit(3)
        },
        {
            name: 'BOM con componentes y materiales',
            query: supabase
                .from('bom')
                .select(`
                    id, name, total_cost,
                    products(id, name),
                    bom_components(
                        id, quantity,
                        materials(id, name, cost)
                    )
                `)
                .limit(3)
        },
        {
            name: 'Operaciones con proyecto y etapas',
            query: supabase
                .from('operations')
                .select(`
                    id, work_order_number, status, progress,
                    projects(id, name),
                    operation_stages(id, stage_key, status)
                `)
                .limit(3)
        }
    ];

    for (const q of complexQueries) {
        try {
            const { data, error } = await q.query;
            if (error) throw error;
            log.success(`${q.name}: OK (${data.length} registros)`);
        } catch (err) {
            log.error(`${q.name}: ${err.message}`);
        }
    }
}

// Generar reporte final
function generateReport() {
    log.title('REPORTE FINAL');

    console.log('\n--- RESUMEN ---\n');
    console.log(`Conexion: ${results.connection ? colors.green + 'OK' : colors.red + 'FALLO'}${colors.reset}`);
    console.log(`Tablas: ${colors.green}${results.tables.passed} OK${colors.reset}, ${colors.red}${results.tables.failed} fallidas${colors.reset}`);
    console.log(`Relaciones: ${colors.green}${results.relations.passed} OK${colors.reset}, ${colors.red}${results.relations.failed} fallidas${colors.reset}`);

    console.log('\n--- CONTEO DE REGISTROS ---\n');
    const sortedCounts = Object.entries(results.data.counts)
        .sort((a, b) => b[1] - a[1]);

    for (const [table, count] of sortedCounts) {
        const bar = '='.repeat(Math.min(count, 50));
        console.log(`${table.padEnd(20)} ${String(count).padStart(5)} ${colors.cyan}${bar}${colors.reset}`);
    }

    if (results.tables.failed > 0 || results.relations.failed > 0) {
        console.log(`\n${colors.yellow}--- PROBLEMAS DETECTADOS ---${colors.reset}\n`);

        const failedTables = results.tables.details.filter(t => t.status === 'error');
        if (failedTables.length > 0) {
            console.log('Tablas con error:');
            failedTables.forEach(t => console.log(`  - ${t.table}: ${t.error}`));
        }

        const failedRelations = results.relations.details.filter(r => r.status === 'error' || r.status === 'no_relation');
        if (failedRelations.length > 0) {
            console.log('\nRelaciones con error:');
            failedRelations.forEach(r => console.log(`  - ${r.from} -> ${r.to} (${r.via})`));
        }
    }

    console.log('\n');
}

// Ejecutar todas las pruebas
async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}  D-KRAFT ERP - Pruebas de Base de Datos${colors.reset}`);
    console.log(`  Fecha: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

    const connected = await testConnection();
    if (!connected) {
        console.log('\n[ABORTADO] No se pudo conectar a la base de datos\n');
        process.exit(1);
    }

    await testTables();
    await testRelations();
    await testSampleData();
    await testComplexQueries();

    generateReport();

    // Exit code basado en resultados
    const hasErrors = results.tables.failed > 0 || results.relations.failed > 0;
    process.exit(hasErrors ? 1 : 0);
}

runTests().catch(err => {
    console.error('\n[FATAL]', err);
    process.exit(1);
});
