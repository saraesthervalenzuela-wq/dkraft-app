/**
 * Ejecutar SQL en Supabase usando pg directamente
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

// Crear cliente con service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// SQL statements para ejecutar uno por uno
const sqlStatements = [
    {
        name: 'materials_category_id_fkey',
        check: async () => {
            // Verificar si el FK ya existe intentando un join
            const { error } = await supabase
                .from('materials')
                .select('id, categories!category_id(id)')
                .limit(1);
            return !error || !error.message.includes('relationship');
        },
        description: 'materials -> categories'
    },
    {
        name: 'products_category_id_fkey',
        check: async () => {
            const { error } = await supabase
                .from('products')
                .select('id, categories!category_id(id)')
                .limit(1);
            return !error || !error.message.includes('relationship');
        },
        description: 'products -> categories'
    },
    {
        name: 'bom_components_bom_id_fkey',
        check: async () => {
            const { error } = await supabase
                .from('bom_components')
                .select('id, bom!bom_id(id)')
                .limit(1);
            return !error || !error.message.includes('relationship');
        },
        description: 'bom_components -> bom'
    },
    {
        name: 'projects_quotation_id_fkey',
        check: async () => {
            const { error } = await supabase
                .from('projects')
                .select('id, quotations!quotation_id(id)')
                .limit(1);
            return !error || !error.message.includes('relationship');
        },
        description: 'projects -> quotations'
    },
    {
        name: 'operations_product_id_fkey',
        check: async () => {
            const { error } = await supabase
                .from('operations')
                .select('id, products!product_id(id)')
                .limit(1);
            return !error || !error.message.includes('relationship');
        },
        description: 'operations -> products'
    },
    {
        name: 'operations_requisition_id_fkey',
        check: async () => {
            const { error } = await supabase
                .from('operations')
                .select('id, requisitions!requisition_id(id)')
                .limit(1);
            return !error || !error.message.includes('relationship');
        },
        description: 'operations -> requisitions'
    },
    {
        name: 'operations_bom_id_fkey',
        check: async () => {
            const { error } = await supabase
                .from('operations')
                .select('id, bom!bom_id(id)')
                .limit(1);
            return !error || !error.message.includes('relationship');
        },
        description: 'operations -> bom'
    }
];

async function checkRelations() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}  Verificando estado de relaciones${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    const missing = [];

    for (const stmt of sqlStatements) {
        const exists = await stmt.check();
        if (exists) {
            console.log(`${colors.green}[OK]${colors.reset} ${stmt.description}`);
        } else {
            console.log(`${colors.red}[FALTA]${colors.reset} ${stmt.description}`);
            missing.push(stmt);
        }
    }

    if (missing.length > 0) {
        console.log(`\n${colors.yellow}=== ACCION REQUERIDA ===${colors.reset}\n`);
        console.log('Las siguientes relaciones necesitan ser creadas en Supabase:');
        console.log('\n1. Abre: https://supabase.com/dashboard/project/qalqscfrcxzzvrcvqqbp/sql/new');
        console.log('2. Copia y ejecuta el siguiente SQL:\n');

        console.log(`${colors.cyan}-- ====================================`);
        console.log('-- SQL para crear foreign keys faltantes');
        console.log('-- ====================================' + colors.reset);

        const sqlMap = {
            'materials_category_id_fkey': `
-- Materials -> Categories
DO $$ BEGIN
  ALTER TABLE public.materials
  ADD CONSTRAINT materials_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`,

            'products_category_id_fkey': `
-- Products -> Categories
DO $$ BEGIN
  ALTER TABLE public.products
  ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`,

            'bom_components_bom_id_fkey': `
-- BOM Components -> BOM
DO $$ BEGIN
  ALTER TABLE public.bom_components
  ADD CONSTRAINT bom_components_bom_id_fkey
  FOREIGN KEY (bom_id) REFERENCES public.bom(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`,

            'projects_quotation_id_fkey': `
-- Projects -> Quotations
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS quotation_id UUID;
DO $$ BEGIN
  ALTER TABLE public.projects
  ADD CONSTRAINT projects_quotation_id_fkey
  FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`,

            'operations_product_id_fkey': `
-- Operations -> Products
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS product_id UUID;
DO $$ BEGIN
  ALTER TABLE public.operations
  ADD CONSTRAINT operations_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`,

            'operations_requisition_id_fkey': `
-- Operations -> Requisitions
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS requisition_id UUID;
DO $$ BEGIN
  ALTER TABLE public.operations
  ADD CONSTRAINT operations_requisition_id_fkey
  FOREIGN KEY (requisition_id) REFERENCES public.requisitions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`,

            'operations_bom_id_fkey': `
-- Operations -> BOM
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS bom_id UUID;
DO $$ BEGIN
  ALTER TABLE public.operations
  ADD CONSTRAINT operations_bom_id_fkey
  FOREIGN KEY (bom_id) REFERENCES public.bom(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`
        };

        for (const m of missing) {
            console.log(sqlMap[m.name] || `-- ${m.name} (SQL no disponible)`);
        }

        console.log(`\n${colors.cyan}-- Recargar schema cache de PostgREST`);
        console.log('NOTIFY pgrst, \'reload schema\';' + colors.reset);

        console.log(`\n${colors.yellow}Despues de ejecutar el SQL, vuelve a correr este script para verificar.${colors.reset}\n`);
    } else {
        console.log(`\n${colors.green}Todas las relaciones estan configuradas correctamente!${colors.reset}\n`);
    }

    return missing.length === 0;
}

checkRelations().then(allGood => {
    process.exit(allGood ? 0 : 1);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
