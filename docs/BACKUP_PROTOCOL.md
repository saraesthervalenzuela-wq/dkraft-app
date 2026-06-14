# D-KRAFT ERP - Backup Protocol

## Supabase Pro Backup Configuration

### Automatic Features (Included with Pro)

| Feature | Description | Retention |
|---------|-------------|-----------|
| **Daily Backups** | Automatic daily snapshots | 7 days |
| **Point-in-Time Recovery (PITR)** | Granular recovery to any point | Up to 7 days |
| **WAL Archiving** | Write-Ahead Logging for durability | Continuous |

---

## Step 1: Enable PITR (Point-in-Time Recovery)

1. Go to: https://supabase.com/dashboard/project/qalqscfrcxzzvrcvqqbp/settings/database
2. Scroll to **Point in Time Recovery**
3. Click **Enable PITR**
4. Select retention period (7 days recommended)

---

## Step 2: Configure Backup Settings

1. Go to: https://supabase.com/dashboard/project/qalqscfrcxzzvrcvqqbp/settings/database
2. Under **Database Backups**:
   - Daily backups: **Enabled** (automatic with Pro)
   - Backup time: **04:00 UTC** (recommended - low traffic)

---

## Step 3: Verify Backups

Check backup status at:
https://supabase.com/dashboard/project/qalqscfrcxzzvrcvqqbp/database/backups

You should see:
- List of daily backups
- Backup completion status
- Restore options

---

## Manual Backup (SQL Dump)

For additional safety, run monthly manual backups:

```bash
# Using Supabase CLI
supabase db dump -p qalqscfrcxzzvrcvqqbp > backup_$(date +%Y%m%d).sql

# Or using pg_dump directly
pg_dump "postgresql://postgres:[PASSWORD]@db.qalqscfrcxzzvrcvqqbp.supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql
```

---

## Recovery Procedures

### Restore from Daily Backup

1. Go to Dashboard > Database > Backups
2. Select the backup date
3. Click **Restore**
4. Confirm restoration

### Point-in-Time Recovery

1. Go to Dashboard > Database > PITR
2. Select exact date and time
3. Click **Restore to this point**
4. Confirm restoration

---

## Recommended Backup Schedule

| Type | Frequency | Retention | Responsibility |
|------|-----------|-----------|----------------|
| Daily Automatic | Every day 04:00 UTC | 7 days | Supabase (automatic) |
| PITR | Continuous | 7 days | Supabase (automatic) |
| Manual SQL Dump | Monthly | 1 year | DevOps team |
| Storage Backup | Weekly | 30 days | DevOps team |

---

## Emergency Contacts

- **Supabase Support**: https://supabase.com/support
- **Status Page**: https://status.supabase.com
- **Project URL**: https://supabase.com/dashboard/project/qalqscfrcxzzvrcvqqbp

---

## Monitoring Alerts

Set up alerts in Supabase Dashboard:

1. Go to: Settings > Notifications
2. Enable:
   - Database health alerts
   - Backup failure notifications
   - Storage usage warnings

---

## Data Integrity Checks

Run weekly:

```sql
-- Check table row counts
SELECT
    schemaname,
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check for orphaned records
SELECT 'materials' as table_name, COUNT(*) as orphaned
FROM materials m
WHERE m.category_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = m.category_id)
UNION ALL
SELECT 'quotation_items', COUNT(*)
FROM quotation_items qi
WHERE NOT EXISTS (SELECT 1 FROM quotations q WHERE q.id = qi.quotation_id);
```

---

---

## QuickBooks Sync Protection

### Critical QB Tables
| Table | QB Fields | Purpose |
|-------|-----------|---------|
| `clients` | `qb_customer_id`, `sync_status` | Customer sync |
| `materials` | `qb_item_id`, `sync_status` | Item sync |
| `quotations` | `qb_estimate_id`, `sync_status` | Estimate sync |
| `requisitions` | `qb_sales_order_id`, `sync_status` | Sales Order sync |
| `qb_sync_queue` | All fields | Sync queue management |

### Billing Entity Rules
- **DOVECREEK**: Syncs with QuickBooks (USA billing)
- **INNOVATIVE**: NO QuickBooks sync (Mexico billing)

### QB Sync Status Values
```
PENDING → SYNCING → SYNCED → FAILED
```

### QB Sync Recovery Procedure

1. **Check Failed Syncs:**
```sql
SELECT * FROM qb_sync_queue
WHERE status = 'FAILED'
ORDER BY created_at DESC;
```

2. **Retry Failed Syncs:**
```sql
UPDATE qb_sync_queue
SET status = 'PENDING', retry_count = retry_count + 1
WHERE status = 'FAILED' AND retry_count < 3;
```

3. **View QB Sync History:**
```sql
SELECT
    entity_type,
    entity_id,
    status,
    error_message,
    created_at
FROM qb_sync_queue
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### QB Data Integrity Check (Weekly)
```sql
-- Find records that should sync but haven't
SELECT 'clients' as entity, COUNT(*) as missing_sync
FROM clients
WHERE billing_entity = 'DOVECREEK'
  AND qb_customer_id IS NULL
  AND status = 'active'
UNION ALL
SELECT 'quotations', COUNT(*)
FROM quotations
WHERE billing_entity = 'DOVECREEK'
  AND qb_estimate_id IS NULL
  AND status IN ('SENT', 'APPROVED', 'CONVERTED')
UNION ALL
SELECT 'requisitions', COUNT(*)
FROM requisitions
WHERE billing_entity = 'DOVECREEK'
  AND qb_sales_order_id IS NULL
  AND status IN ('APPROVED', 'ORDERED', 'FULFILLED');
```

### QB Backup Considerations
- QB sync queue is included in daily Supabase backups
- After PITR restore, check for duplicate syncs in QB
- Always verify `sync_status` after restoration

---

## Last Updated
2026-02-02

## Configured By
D-KRAFT DevOps Team
