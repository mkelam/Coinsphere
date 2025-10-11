#!/bin/bash

###############################################################################
# Coinsphere Database Backup Script
# Automated PostgreSQL backup with retention policy and S3 upload
###############################################################################

set -e  # Exit on error

# Load environment variables
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="coinsphere_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Coinsphere Database Backup ===${NC}"
echo "Timestamp: $(date)"
echo "Backup file: ${BACKUP_FILENAME}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not set${NC}"
    exit 1
fi

# Parse DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's|postgresql://\([^:]*\):.*|\1|p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's|postgresql://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|postgresql://[^@]*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|postgresql://[^@]*@[^:]*:\([^/]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|postgresql://[^/]*/\(.*\)|\1|p')

echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Set PostgreSQL password
export PGPASSWORD="${DB_PASS}"

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_PATH}"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Upload to S3 if configured
if [ ! -z "$BACKUP_S3_BUCKET" ] && [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    echo -e "${YELLOW}Uploading to S3...${NC}"

    aws s3 cp "${BACKUP_PATH}" "s3://${BACKUP_S3_BUCKET}/backups/${BACKUP_FILENAME}" \
        --region "${BACKUP_S3_REGION:-us-east-1}"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup uploaded to S3${NC}"
    else
        echo -e "${RED}✗ S3 upload failed${NC}"
    fi
fi

# Clean up old local backups
echo -e "${YELLOW}Cleaning up old backups (retention: ${BACKUP_RETENTION_DAYS} days)...${NC}"
find "${BACKUP_DIR}" -name "coinsphere_backup_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -delete

REMAINING_BACKUPS=$(find "${BACKUP_DIR}" -name "coinsphere_backup_*.sql.gz" | wc -l)
echo -e "${GREEN}✓ Cleanup complete (${REMAINING_BACKUPS} backups retained)${NC}"

# Verify backup integrity
echo -e "${YELLOW}Verifying backup integrity...${NC}"
gunzip -t "${BACKUP_PATH}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup verification passed${NC}"
else
    echo -e "${RED}✗ Backup verification failed - backup may be corrupted${NC}"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "Backup file: ${BACKUP_PATH}"
echo "Size: ${BACKUP_SIZE}"
echo "Status: Success"
echo "Timestamp: $(date)"

# Unset password
unset PGPASSWORD

exit 0
