# Database Migration Strategy - Coinsphere

## Overview
This document outlines the database migration strategy for Coinsphere, ensuring zero-downtime deployments and data integrity.

## Technology Stack
- **ORM**: Prisma
- **Database**: PostgreSQL 15 + TimescaleDB
- **Migration Tool**: Prisma Migrate

## Migration Workflow

### Development Environment
```bash
# Create a new migration
npm run migrate

# Generate Prisma client after schema changes
npx prisma generate

# Apply pending migrations
npx prisma migrate dev

# Reset database (destructive - dev only!)
npx prisma migrate reset
```

### Production Environment
```bash
# Apply migrations in production
npx prisma migrate deploy

# No interactive prompts - safe for CI/CD
```

## Migration Best Practices

### 1. **Backward Compatible Changes**
Always ensure migrations are backward compatible to support zero-downtime deployments.

**Safe Changes:**
- Adding new tables
- Adding nullable columns
- Adding indexes (use `CONCURRENTLY` in PostgreSQL)
- Adding new enum values at the end

**Unsafe Changes (require downtime or multi-step migrations):**
- Renaming columns
- Changing column types
- Making columns non-nullable
- Removing columns

### 2. **Multi-Step Migrations for Breaking Changes**

**Example: Renaming a column**

Step 1 - Add new column:
```sql
ALTER TABLE users ADD COLUMN new_name TEXT;
UPDATE users SET new_name = old_name;
```
Deploy application code that writes to both columns.

Step 2 - Remove old column (next release):
```sql
ALTER TABLE users DROP COLUMN old_name;
```
Deploy application code that only uses new_name.

### 3. **Index Creation**

Always create indexes concurrently to avoid table locks:

```sql
-- Good (non-blocking)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Bad (blocks table)
CREATE INDEX idx_users_email ON users(email);
```

### 4. **Data Migrations**

For data transformations, use separate migration scripts:

```sql
-- migrations/20250108_transform_data.sql
BEGIN;

-- Backup table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Transform data
UPDATE users SET email = LOWER(email) WHERE email IS NOT NULL;

-- Verify transformation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email ~ '[A-Z]') THEN
    RAISE EXCEPTION 'Data migration failed: uppercase emails still exist';
  END IF;
END $$;

COMMIT;
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Database Migration

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npx prisma migrate deploy
          npx prisma generate

      - name: Verify migration
        run: npx prisma migrate status
```

## Rollback Strategy

### Automatic Rollbacks
Prisma Migrate tracks applied migrations in the `_prisma_migrations` table.

```sql
-- Check migration status
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;
```

### Manual Rollback

```bash
# 1. Identify the bad migration
npx prisma migrate status

# 2. Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# 3. Apply corrective migration
npx prisma migrate dev --name fix_migration
```

### Emergency Rollback

```sql
-- Restore from backup
pg_restore -d coinsphere_prod backup.dump

-- Or restore specific table
pg_restore -d coinsphere_prod -t users backup.dump
```

## Pre-Deployment Checklist

- [ ] Run migrations locally first
- [ ] Test with production-like data volume
- [ ] Verify backward compatibility
- [ ] Create database backup
- [ ] Plan rollback procedure
- [ ] Review migration script for blocking operations
- [ ] Test migration in staging environment
- [ ] Estimate migration duration
- [ ] Schedule deployment during low-traffic period
- [ ] Monitor database performance during migration

## Monitoring

### Migration Metrics
```sql
-- Check migration duration
SELECT
  migration_name,
  started_at,
  finished_at,
  finished_at - started_at AS duration
FROM _prisma_migrations
ORDER BY started_at DESC
LIMIT 10;
```

### Health Checks

```typescript
// backend/src/middleware/health.ts
export async function checkMigrationStatus() {
  const result = await prisma.$queryRaw`
    SELECT migration_name, applied_steps_count
    FROM _prisma_migrations
    WHERE finished_at IS NULL
  `;

  if (result.length > 0) {
    throw new Error('Pending migrations detected');
  }
}
```

## TimescaleDB Considerations

### Hypertable Migrations

```sql
-- Create hypertable (must be done after table creation)
SELECT create_hypertable('price_data', 'time', migrate_data => TRUE);

-- Add compression
ALTER TABLE price_data SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'token_id'
);

-- Add compression policy
SELECT add_compression_policy('price_data', INTERVAL '14 days');
```

### Continuous Aggregates

```sql
-- Refresh continuous aggregate after data migration
CALL refresh_continuous_aggregate('price_data_1h', NULL, NULL);
```

## Disaster Recovery

### Backup Strategy
- **Frequency**: Every 6 hours
- **Retention**: 7 days of point-in-time recovery
- **Location**: AWS S3 encrypted bucket

```bash
# Create backup
pg_dump -Fc coinsphere_prod > backup_$(date +%Y%m%d_%H%M%S).dump

# Restore backup
pg_restore -d coinsphere_prod backup_20250108.dump
```

### Point-in-Time Recovery

```bash
# Restore to specific timestamp
pg_restore -d coinsphere_prod -T users backup.dump
psql -d coinsphere_prod -c "
  CREATE TABLE users AS
  SELECT * FROM users_backup
  WHERE created_at <= '2025-01-08 12:00:00'
"
```

## Common Issues & Solutions

### Issue: Migration timeout
**Solution**: Increase statement timeout
```sql
SET statement_timeout = '60min';
```

### Issue: Lock conflicts
**Solution**: Use `CONCURRENTLY` for index creation and `LOCK TABLE` explicitly

### Issue: Out of disk space
**Solution**: Use `VACUUM FULL` to reclaim space or add storage before migration

### Issue: Migration drift
**Solution**: Use `npx prisma migrate resolve` to mark migrations as applied

## Security

- Never commit sensitive data in migrations
- Use environment variables for credentials
- Audit migration scripts for SQL injection vulnerabilities
- Review all raw SQL migrations manually
- Restrict migration execution to CI/CD pipeline

## References

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Zero-Downtime Migrations](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)
- [TimescaleDB Best Practices](https://docs.timescale.com/timescaledb/latest/how-to-guides/schema-management/)
