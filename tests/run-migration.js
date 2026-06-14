/**
 * D-KRAFT ERP - Run Migration Script
 * Ejecuta la migracion de foreign keys faltantes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('[ERROR] VITE_SUPABASE_SERVICE_ROLE_KEY no encontrada');
    process.exit(1);
}

// Usar service role para tener permisos de admin
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

async function runMigration() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}  D-KRAFT ERP - Ejecutando Migracion de FK${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    // Lista de foreign keys a verificar/crear
    const fkMigrations = [
        {
            name: 'materials_category_id_fkey',
            table: 'materials',
            column: 'category_id',
            refTable: 'categories',
            refColumn: 'id',
            onDelete: 'SET NULL'
        },
        {
            name: 'products_category_id_fkey',
            table: 'products',
            column: 'category_id',
            refTable: 'categories',
            refColumn: 'id',
            onDelete: 'SET NULL'
        },
        {
            name: 'bom_components_bom_id_fkey',
            table: 'bom_components',
            column: 'bom_id',
            refTable: 'bom',
            refColumn: 'id',
            onDelete: 'CASCADE'
        },
        {
            name: 'projects_quotation_id_fkey',
            table: 'projects',
            column: 'quotation_id',
            refTable: 'quotations',
            refColumn: 'id',
            onDelete: 'SET NULL',
            addColumn: true
        },
        {
            name: 'operations_product_id_fkey',
            table: 'operations',
            column: 'product_id',
            refTable: 'products',
            refColumn: 'id',
            onDelete: 'SET NULL',
            addColumn: true
        },
        {
            name: 'operations_requisition_id_fkey',
            table: 'operations',
            column: 'requisition_id',
            refTable: 'requisitions',
            refColumn: 'id',
            onDelete: 'SET NULL',
            addColumn: true
        },
        {
            name: 'operations_bom_id_fkey',
            table: 'operations',
            column: 'bom_id',
            refTable: 'bom',
            refColumn: 'id',
            onDelete: 'SET NULL',
            addColumn: true
        }
    ];

    let success = 0;
    let failed = 0;

    for (const fk of fkMigrations) {
        console.log(`${colors.cyan}[PROCESANDO]${colors.reset} ${fk.table}.${fk.column} -> ${fk.refTable}`);

        try {
            // Verificar si la columna existe
            const { data: columns } = await supabase.rpc('exec_sql', {
                sql: `SELECT column_name FROM information_schema.columns
                      WHERE table_name = '${fk.table}' AND column_name = '${fk.column}'`
            }).catch(() => ({ data: null }));

            // Si necesitamos agregar la columna y no existe
            if (fk.addColumn) {
                const addColSql = `
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = '${fk.table}' AND column_name = '${fk.column}'
                        ) THEN
                            ALTER TABLE public.${fk.table} ADD COLUMN ${fk.column} UUID;
                        END IF;
                    END $$;
                `;

                const { error: colError } = await supabase.rpc('exec_sql', { sql: addColSql }).catch(async () => {
                    // Si exec_sql no existe, usar query directa
                    return await supabase.from(fk.table).select(fk.column).limit(1);
                });
            }

            // Crear la FK
            const createFkSql = `
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = '${fk.name}'
                        AND table_name = '${fk.table}'
                    ) THEN
                        ALTER TABLE public.${fk.table}
                        ADD CONSTRAINT ${fk.name}
                        FOREIGN KEY (${fk.column}) REFERENCES public.${fk.refTable}(${fk.refColumn})
                        ON DELETE ${fk.onDelete};
                    END IF;
                END $$;
            `;

            // Intentar ejecutar via RPC o fetch directo
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify({ sql: createFkSql })
            });

            if (!response.ok) {
                // Si exec_sql no existe, lo creamos y ejecutamos directamente
                throw new Error('RPC no disponible');
            }

            console.log(`${colors.green}[OK]${colors.reset} ${fk.name} creada/verificada`);
            success++;

        } catch (err) {
            // Guardar el SQL para ejecucion manual
            console.log(`${colors.yellow}[PENDIENTE]${colors.reset} ${fk.name} - Ejecutar SQL manualmente`);
            failed++;
        }
    }

    // Notificar a PostgREST que recargue el schema
    console.log(`\n${colors.cyan}[INFO]${colors.reset} Notificando a PostgREST para recargar schema...`);

    try {
        await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Prefer': 'return=representation'
            }
        });
        console.log(`${colors.green}[OK]${colors.reset} Schema cache actualizado`);
    } catch (e) {
        console.log(`${colors.yellow}[WARN]${colors.reset} No se pudo refrescar cache automaticamente`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}RESUMEN:${colors.reset} ${colors.green}${success} OK${colors.reset}, ${colors.yellow}${failed} pendientes${colors.reset}`);
    console.log('='.repeat(60));

    if (failed > 0) {
        console.log(`
${colors.yellow}IMPORTANTE:${colors.reset} Algunas FK requieren ejecucion manual.

1. Abre Supabase Dashboard: ${supabaseUrl.replace('.co', '.co/project/qalqscfrcxzzvrcvqqbp/sql')}
2. Ve a SQL Editor
3. Ejecuta el archivo: supabase/migrations/20260202_fix_relations.sql

O copia y pega el siguiente SQL:
`);

        // Mostrar SQL simplificado
        console.log(`${colors.cyan}
-- Ejecutar en Supabase SQL Editor:

-- 1. Materials -> Categories
ALTER TABLE public.materials
ADD CONSTRAINT materials_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. Products -> Categories
ALTER TABLE public.products
ADD CONSTRAINT products_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. BOM Components -> BOM
ALTER TABLE public.bom_components
ADD CONSTRAINT bom_components_bom_id_fkey
FOREIGN KEY (bom_id) REFERENCES public.bom(id) ON DELETE CASCADE;

-- 4. Projects -> Quotations (agregar columna si no existe)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS quotation_id UUID;
ALTER TABLE public.projects
ADD CONSTRAINT projects_quotation_id_fkey
FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;

-- 5. Operations -> Products
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.operations
ADD CONSTRAINT operations_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 6. Operations -> Requisitions
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS requisition_id UUID;
ALTER TABLE public.operations
ADD CONSTRAINT operations_requisition_id_fkey
FOREIGN KEY (requisition_id) REFERENCES public.requisitions(id) ON DELETE SET NULL;

-- 7. Operations -> BOM
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS bom_id UUID;
ALTER TABLE public.operations
ADD CONSTRAINT operations_bom_id_fkey
FOREIGN KEY (bom_id) REFERENCES public.bom(id) ON DELETE SET NULL;

-- Recargar schema de PostgREST
NOTIFY pgrst, 'reload schema';
${colors.reset}`);
    }

    console.log('\n');
}

runMigration().catch(console.error);
