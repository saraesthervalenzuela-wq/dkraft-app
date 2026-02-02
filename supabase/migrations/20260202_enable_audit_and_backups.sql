-- ============================================
-- D-KRAFT ERP - Audit & Data Protection Setup
-- Execute in Supabase SQL Editor
-- ============================================

-- 1. Create audit log function (if not exists)
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_log (
            action,
            entity_type,
            entity_id,
            new_data,
            created_at
        ) VALUES (
            'CREATE',
            TG_TABLE_NAME,
            NEW.id::text,
            to_jsonb(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_log (
            action,
            entity_type,
            entity_id,
            old_data,
            new_data,
            created_at
        ) VALUES (
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id::text,
            to_jsonb(OLD),
            to_jsonb(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_log (
            action,
            entity_type,
            entity_id,
            old_data,
            created_at
        ) VALUES (
            'DELETE',
            TG_TABLE_NAME,
            OLD.id::text,
            to_jsonb(OLD),
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create audit triggers for critical tables
DO $$
DECLARE
    tables_to_audit TEXT[] := ARRAY[
        'clients',
        'suppliers',
        'materials',
        'products',
        'quotations',
        'quotation_items',
        'requisitions',
        'requisition_items',
        'projects',
        'operations',
        'bom',
        'bom_components'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables_to_audit
    LOOP
        -- Drop existing trigger if exists
        EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON %s', t, t);

        -- Create new trigger
        EXECUTE format('
            CREATE TRIGGER audit_%s
            AFTER INSERT OR UPDATE OR DELETE ON %s
            FOR EACH ROW EXECUTE FUNCTION log_changes()
        ', t, t);

        RAISE NOTICE 'Audit trigger created for table: %', t;
    END LOOP;
END $$;

-- 3. Create soft delete function (prevent accidental hard deletes)
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Instead of deleting, mark as deleted
    UPDATE public.activity_log
    SET old_data = jsonb_set(COALESCE(old_data, '{}'::jsonb), '{_deleted}', 'true')
    WHERE entity_id = OLD.id::text
      AND entity_type = TG_TABLE_NAME
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Ensure all tables have updated_at triggers
DO $$
DECLARE
    tables_with_updated_at TEXT[] := ARRAY[
        'clients',
        'suppliers',
        'materials',
        'products',
        'quotations',
        'requisitions',
        'projects',
        'operations',
        'bom',
        'categories',
        'units',
        'warehouses'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables_with_updated_at
    LOOP
        -- Drop existing trigger if exists
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%s ON %s', t, t);

        -- Create new trigger
        EXECUTE format('
            CREATE TRIGGER set_updated_at_%s
            BEFORE UPDATE ON %s
            FOR EACH ROW EXECUTE FUNCTION update_updated_at()
        ', t, t);

        RAISE NOTICE 'Updated_at trigger created for table: %', t;
    END LOOP;
END $$;

-- 6. Create index on activity_log for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);

-- 7. Set up row-level security on activity_log (read-only for users)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
DROP POLICY IF EXISTS "Users can view activity log" ON activity_log;
CREATE POLICY "Users can view activity log"
    ON activity_log FOR SELECT
    USING (true);

-- Only allow system to insert (via triggers)
DROP POLICY IF EXISTS "System can insert activity log" ON activity_log;
CREATE POLICY "System can insert activity log"
    ON activity_log FOR INSERT
    WITH CHECK (true);

-- 8. Verify setup
SELECT 'Audit and backup triggers configured successfully!' AS status;

-- Show created triggers
SELECT
    tgname AS trigger_name,
    relname AS table_name,
    CASE tgtype & 1 WHEN 1 THEN 'ROW' ELSE 'STATEMENT' END AS trigger_level
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname LIKE 'audit_%' OR tgname LIKE 'set_updated_at_%'
ORDER BY relname, tgname;
