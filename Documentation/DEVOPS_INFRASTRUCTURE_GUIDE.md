# DevOps & Infrastructure Guide - CryptoSense Analytics Platform

**Document Version**: 1.0
**Date**: October 6, 2025
**Status**: Active

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Environment Strategy](#environment-strategy)
3. [Cloud Architecture](#cloud-architecture)
4. [Deployment Pipeline](#deployment-pipeline)
5. [Container Strategy](#container-strategy)
6. [Database Management](#database-management)
7. [Monitoring & Observability](#monitoring--observability)
8. [Scaling Strategy](#scaling-strategy)
9. [Disaster Recovery](#disaster-recovery)
10. [Cost Optimization](#cost-optimization)
11. [Infrastructure as Code](#infrastructure-as-code)
12. [Runbooks](#runbooks)

---

## 1. Infrastructure Overview

### Architecture Principles

1. **Infrastructure as Code** - All infrastructure defined in version control
2. **Immutable Infrastructure** - Replace servers, don't patch them
3. **Automation First** - Automate everything that can be automated
4. **Observability** - Monitor everything, alert on anomalies
5. **Cost-Conscious** - Optimize for performance AND cost

### Technology Stack

**MVP Phase (Months 1-6):**
- **Hosting:** Railway or Render (simple, affordable)
- **Database:** Managed PostgreSQL (Railway/Render)
- **Cache:** Redis (managed)
- **Frontend:** Vercel (automatic deployments)
- **Estimated Cost:** $70-120/month

**Growth Phase (Months 6-12):**
- **Hosting:** AWS (ECS or EC2)
- **Database:** AWS RDS PostgreSQL
- **Cache:** AWS ElastiCache Redis
- **CDN:** Cloudflare
- **Frontend:** Vercel or AWS S3 + CloudFront
- **Estimated Cost:** $330-660/month

**Scale Phase (Year 2+):**
- Full AWS infrastructure
- Multi-region deployment
- Advanced monitoring (Datadog)
- **Estimated Cost:** $2,000-5,000/month

---

## 2. Environment Strategy

### Environments

| Environment | Purpose | Deploy Trigger | Access |
|-------------|---------|----------------|--------|
| **Local** | Development | Manual | All developers |
| **Development** | Feature testing | Push to `develop` branch | All developers |
| **Staging** | Pre-production testing | Merge to `main` | QA team, developers |
| **Production** | Live users | Git tag (e.g., `v1.0.0`) | Limited (DevOps, tech lead) |

### Environment Configuration

**Environment Variables by Environment:**

```bash
# .env.local (development)
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/cryptosense_dev
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:3000
LOG_LEVEL=debug

# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db.aws.com:5432/cryptosense
REDIS_URL=redis://staging-redis.aws.com:6379
API_BASE_URL=https://staging-api.cryptosense.com
LOG_LEVEL=info

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://prod-db.aws.com:5432/cryptosense
REDIS_URL=redis://prod-redis.aws.com:6379
API_BASE_URL=https://api.cryptosense.com
LOG_LEVEL=warn
```

### Branching Strategy (Git Flow)

```
main (production)
  │
  ├─> develop (staging)
  │     │
  │     ├─> feature/predictions-ui
  │     ├─> feature/risk-scoring
  │     └─> bugfix/login-error
  │
  └─> hotfix/critical-security-patch
```

**Rules:**
- `main` = production-ready code only
- `develop` = integration branch for features
- Feature branches created from `develop`
- Hotfixes branch from `main`, merge back to `main` and `develop`
- Use semantic versioning tags (`v1.0.0`, `v1.0.1`, `v1.1.0`)

---

## 3. Cloud Architecture

### MVP Architecture (Railway/Render)

```
┌──────────────────────────────────────────┐
│         Frontend (Vercel)                │
│  React App - Automatic deployments       │
└───────────────┬──────────────────────────┘
                │
┌───────────────▼──────────────────────────┐
│     API Service (Railway/Render)         │
│  Node.js + Express                       │
│  Auto-scaling: 1-3 instances             │
└───────────────┬──────────────────────────┘
                │
    ┌───────────┼──────────┐
    │           │          │
┌───▼──────┐ ┌──▼──────┐ ┌▼─────────────┐
│PostgreSQL│ │  Redis  │ │ ML Service   │
│ (Managed)│ │(Managed)│ │ (FastAPI)    │
└──────────┘ └─────────┘ └──────────────┘
```

**Pros:**
- Simple setup (< 1 hour)
- Automatic SSL certificates
- Built-in CI/CD
- Low cost ($70-120/mo)

**Cons:**
- Limited scalability
- Less control over infrastructure
- Vendor lock-in

---

### Growth Phase Architecture (AWS)

```
                    Internet
                       │
┌──────────────────────▼───────────────────────┐
│           Cloudflare CDN + WAF               │
│  DDoS Protection, Caching, SSL               │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│     AWS Route 53 (DNS) + ALB (Load Balancer)│
└──────────────────────┬───────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
┌───────────▼──────────┐ ┌────────▼───────────┐
│  ECS Cluster         │ │  S3 + CloudFront   │
│  (API Services)      │ │  (Static Assets)   │
│  Auto-scaling: 2-10  │ └────────────────────┘
└───────────┬──────────┘
            │
    ┌───────┴────────────┐
    │                    │
┌───▼──────────┐  ┌──────▼────────┐
│ RDS PostgreSQL│  │ElastiCache    │
│ Multi-AZ      │  │Redis Cluster  │
│ Auto-backup   │  │Replication    │
└───────────────┘  └───────────────┘
```

**Components:**

1. **Cloudflare:** CDN, DDoS protection, Web Application Firewall
2. **Route 53:** DNS management
3. **Application Load Balancer (ALB):** Distribute traffic, SSL termination
4. **ECS (Elastic Container Service):** Run Docker containers
5. **RDS (Relational Database Service):** Managed PostgreSQL
6. **ElastiCache:** Managed Redis
7. **S3 + CloudFront:** Static asset hosting and CDN

---

## 4. Deployment Pipeline

### CI/CD Pipeline (GitHub Actions)

**Pipeline Stages:**

```
┌────────────┐
│ Git Push   │
└─────┬──────┘
      │
┌─────▼──────┐
│  Lint      │ (ESLint, Prettier, Black)
└─────┬──────┘
      │
┌─────▼──────┐
│  Test      │ (Unit, Integration, Security)
└─────┬──────┘
      │
┌─────▼──────┐
│  Build     │ (Docker image)
└─────┬──────┘
      │
┌─────▼──────┐
│  Push      │ (Docker registry)
└─────┬──────┘
      │
┌─────▼──────┐
│  Deploy    │ (Staging or Production)
└─────┬──────┘
      │
┌─────▼──────┐
│  Smoke Test│ (Health checks)
└────────────┘
```

### GitHub Actions Workflow

**.github/workflows/deploy.yml:**

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: cryptosense-api
  ECS_SERVICE: cryptosense-api-service
  ECS_CLUSTER: cryptosense-prod-cluster

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.ref_name }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services $ECS_SERVICE

      - name: Smoke test
        run: |
          curl -f https://api.cryptosense.com/health || exit 1

      - name: Notify team
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Strategies

**Blue-Green Deployment:**
- Two identical environments (blue = current, green = new)
- Deploy to green, test, then switch traffic
- Instant rollback if issues

**Rolling Deployment:**
- Gradually replace old instances with new ones
- Zero downtime
- Slower rollback

**Canary Deployment:**
- Deploy to 10% of servers first
- Monitor metrics for 15-30 minutes
- If healthy, deploy to remaining 90%
- Automatic rollback on errors

**Recommendation:** Start with Rolling (simpler), move to Canary in Year 2

---

## 5. Container Strategy

### Docker Images

**Multi-Stage Build for Optimization:**

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy only necessary files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
```

**Image Optimization:**
- Use Alpine Linux (smaller base image)
- Multi-stage builds (remove build dependencies)
- .dockerignore file (exclude unnecessary files)
- Layer caching (order commands from least to most frequently changed)

**Example .dockerignore:**

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
.vscode
.idea
*.test.ts
*.spec.ts
coverage
dist
build
```

### Container Orchestration

**ECS Task Definition:**

```json
{
  "family": "cryptosense-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/cryptosense-api:v1.0.0",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "LOG_LEVEL", "value": "info" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:prod/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cryptosense-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

## 6. Database Management

### Database Architecture

**PostgreSQL Configuration:**

```sql
-- Production database settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET random_page_cost = 1.1;  -- SSD optimized

-- Enable TimescaleDB for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for price data
SELECT create_hypertable('price_history', 'timestamp');

-- Add compression policy (keep 7 days uncompressed, compress older data)
SELECT add_compression_policy('price_history', INTERVAL '7 days');
```

### Migration Strategy

**Database Migrations with Prisma:**

```typescript
// prisma/migrations/20251006_initial_schema/migration.sql
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "total_value" DECIMAL(20,2),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "portfolios_user_id_idx" ON "portfolios"("user_id");
```

**Migration Workflow:**

1. **Development:**
   ```bash
   npx prisma migrate dev --name add_predictions_table
   ```

2. **Staging:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Production:**
   ```bash
   # Run in maintenance window
   # Backup first!
   pg_dump production_db > backup_$(date +%Y%m%d).sql
   npx prisma migrate deploy
   ```

### Backup Strategy

**Automated Backups:**
- **Daily Backups:** Full database backup at 2 AM UTC
- **Retention:** 7 daily, 4 weekly, 6 monthly
- **Storage:** AWS S3 with versioning enabled
- **Encryption:** AES-256 at rest

**Backup Script:**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cryptosense_backup_$DATE.sql.gz"
S3_BUCKET="s3://cryptosense-backups/daily"

# Dump database and compress
pg_dump $DATABASE_URL | gzip > /tmp/$BACKUP_FILE

# Upload to S3
aws s3 cp /tmp/$BACKUP_FILE $S3_BUCKET/

# Cleanup local file
rm /tmp/$BACKUP_FILE

# Delete backups older than 30 days
aws s3 ls $S3_BUCKET/ | awk '{print $4}' | \
  grep -E 'cryptosense_backup_.*\.sql\.gz' | \
  head -n -30 | \
  xargs -I {} aws s3 rm $S3_BUCKET/{}

echo "Backup completed: $BACKUP_FILE"
```

### Database Monitoring

**Key Metrics:**
- Connection count (alert if >80% of max_connections)
- Query performance (slow queries >1 second)
- Replication lag (if using read replicas)
- Disk usage (alert at 80% capacity)
- Cache hit ratio (should be >90%)

**Slow Query Monitoring:**

```sql
-- Enable slow query logging
ALTER DATABASE cryptosense SET log_min_duration_statement = 1000; -- 1 second

-- Find slow queries
SELECT
  query,
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time / 1000 as avg_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 7. Monitoring & Observability

### Monitoring Stack

**Tools:**
- **Application Monitoring:** Sentry (errors), Datadog (APM)
- **Infrastructure Monitoring:** AWS CloudWatch, Prometheus
- **Log Aggregation:** AWS CloudWatch Logs or Datadog
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Real User Monitoring:** Google Analytics, Mixpanel

### Key Metrics (Golden Signals)

**1. Latency** - How long does it take to serve a request?
- API p50/p95/p99 response times
- Database query times
- External API call latency

**2. Traffic** - How much demand is placed on the system?
- Requests per second (RPS)
- Concurrent users
- Database connections

**3. Errors** - What is the rate of failed requests?
- 4xx error rate (client errors)
- 5xx error rate (server errors)
- Failed API calls to external services

**4. Saturation** - How "full" is the service?
- CPU utilization (alert at 80%)
- Memory utilization (alert at 85%)
- Disk usage (alert at 80%)
- Database connections (alert at 80% of max)

### Alerting Rules

**Critical Alerts (Immediate Response):**

| Alert | Condition | Action |
|-------|-----------|--------|
| API Down | Health check fails 3 times in 5 min | Page on-call engineer |
| Database Down | Connection failures >90% for 2 min | Page on-call + CEO |
| 5xx Error Spike | >100 errors/min sustained for 5 min | Page on-call engineer |
| Disk Full | >95% disk usage | Immediate intervention |

**Warning Alerts (Investigate Within Hours):**

| Alert | Condition | Action |
|-------|-----------|--------|
| High Latency | p95 response time >1s for 10 min | Investigate |
| Error Rate Increase | 5xx rate >5% for 15 min | Review logs |
| High CPU | >80% CPU for 20 min | Check scaling |
| Memory Leak | Memory growing >10% per hour | Investigate |

### Health Check Endpoints

```typescript
// /health - Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// /health/detailed - Comprehensive health check
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {},
  };

  try {
    // Check database
    await db.raw('SELECT 1');
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Redis
    await redis.ping();
    health.services.redis = 'ok';
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  // Check external APIs
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/ping');
    health.services.coingecko = response.ok ? 'ok' : 'error';
  } catch (error) {
    health.services.coingecko = 'error';
    // External API failures are not critical
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Distributed Tracing

**OpenTelemetry Setup:**

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: 'cryptosense-api',
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

---

## 8. Scaling Strategy

### Horizontal Scaling

**Auto-Scaling Configuration (AWS ECS):**

```json
{
  "scalingPolicies": [
    {
      "policyName": "cpu-scaling",
      "targetTrackingScalingPolicyConfiguration": {
        "targetValue": 70.0,
        "predefinedMetricSpecification": {
          "predefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "scaleInCooldown": 300,
        "scaleOutCooldown": 60
      }
    },
    {
      "policyName": "request-scaling",
      "targetTrackingScalingPolicyConfiguration": {
        "targetValue": 1000.0,
        "predefinedMetricSpecification": {
          "predefinedMetricType": "ALBRequestCountPerTarget"
        }
      }
    }
  ],
  "minCapacity": 2,
  "maxCapacity": 10
}
```

**Scaling Triggers:**
- CPU >70% sustained for 2 minutes → Add instance
- Requests/target >1000 → Add instance
- CPU <30% for 5 minutes → Remove instance (min 2)

### Database Scaling

**Read Replicas:**
```
          ┌─────────────┐
          │   Primary   │  (Writes)
          │  PostgreSQL │
          └──────┬──────┘
                 │
         ┌───────┴───────┐
         │               │
    ┌────▼───┐      ┌────▼───┐
    │ Replica│      │ Replica│  (Reads)
    │   1    │      │   2    │
    └────────┘      └────────┘
```

**When to Add Read Replicas:**
- Read queries >70% of total queries
- Primary database CPU >60%
- Query response times >500ms

**Connection Pooling (PgBouncer):**

```ini
[databases]
cryptosense = host=db.example.com port=5432 dbname=cryptosense

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
```

### Caching Strategy

**Redis Caching Layers:**

1. **API Response Caching** (30-60 seconds)
   ```typescript
   app.get('/api/prices/:symbol', async (req, res) => {
     const cacheKey = `price:${req.params.symbol}`;
     const cached = await redis.get(cacheKey);

     if (cached) {
       return res.json(JSON.parse(cached));
     }

     const price = await fetchPrice(req.params.symbol);
     await redis.setex(cacheKey, 60, JSON.stringify(price)); // 60 sec TTL
     res.json(price);
   });
   ```

2. **Database Query Caching** (5-15 minutes)
   ```typescript
   async function getPortfolio(userId: string) {
     const cacheKey = `portfolio:${userId}`;
     const cached = await redis.get(cacheKey);

     if (cached) {
       return JSON.parse(cached);
     }

     const portfolio = await db.portfolio.findMany({ where: { userId } });
     await redis.setex(cacheKey, 300, JSON.stringify(portfolio)); // 5 min TTL
     return portfolio;
   }
   ```

3. **Session Storage** (7 days)
   ```typescript
   await redis.setex(`session:${sessionId}`, 604800, JSON.stringify(sessionData));
   ```

---

## 9. Disaster Recovery

### Recovery Objectives

- **RTO (Recovery Time Objective):** 4 hours (time to restore service)
- **RPO (Recovery Point Objective):** 1 hour (max acceptable data loss)

### Disaster Scenarios

**Scenario 1: Database Failure**

1. **Detection:** Automated alerts, health check failures
2. **Response:**
   - Switch to read replica (promoted to primary)
   - Restore from latest backup if replicas unavailable
   - Estimated downtime: 15-30 minutes
3. **Recovery:**
   - Provision new RDS instance
   - Restore from backup
   - Verify data integrity
   - Update DNS/connection strings

**Scenario 2: Region Outage (AWS US-East-1)**

1. **Detection:** Multiple service failures
2. **Response:**
   - Failover to secondary region (if configured)
   - Restore from cross-region backup
   - Estimated downtime: 2-4 hours
3. **Recovery:**
   - Provision infrastructure in alternate region
   - Restore database from S3 backup
   - Update DNS to point to new region

**Scenario 3: Data Corruption**

1. **Detection:** User reports, data integrity checks
2. **Response:**
   - Identify scope of corruption
   - Restore affected tables from backup
   - Replay transaction logs if available
3. **Recovery:**
   - Point-in-time recovery from backup
   - Verify data consistency
   - Notify affected users

### Disaster Recovery Drills

**Quarterly DR Test:**
- Simulate database failure
- Restore from backup to staging
- Verify data integrity
- Measure recovery time
- Document lessons learned

---

## 10. Cost Optimization

### Cost Breakdown (Projected)

**MVP Phase ($70-120/month):**
- Railway/Render API: $30-50
- PostgreSQL: $15-30
- Redis: $10-20
- Vercel (frontend): $0-20
- Domain & SSL: $15

**Growth Phase ($330-660/month):**
- AWS ECS (2-4 instances): $100-200
- RDS PostgreSQL (db.t3.medium): $60-120
- ElastiCache Redis: $50-100
- CloudFront CDN: $20-50
- Data transfer: $50-100
- Monitoring (Datadog): $50-90

### Cost Optimization Strategies

**1. Reserved Instances (Save 30-50%)**
- Commit to 1-year or 3-year terms
- Apply when usage patterns are predictable (Year 2+)

**2. Spot Instances (Save 70-90%)**
- Use for non-critical workloads (ML training, batch jobs)
- Not suitable for API servers (unreliable)

**3. Auto-Scaling**
- Scale down during low-traffic hours (e.g., 2-6 AM UTC)
- Minimum 2 instances (high availability)

**4. Data Transfer Optimization**
- Use CloudFront CDN (cache static assets)
- Compress API responses (gzip)
- Optimize image sizes (WebP format)

**5. Database Optimization**
- Use connection pooling (reduce connections)
- Archive old data to S3 (cheaper storage)
- Use TimescaleDB compression (50-90% space savings)

**6. Monitoring Costs**
- Start with CloudWatch (free tier)
- Add Datadog only when needed (>10K users)
- Sample logs (don't log every request)

---

## 11. Infrastructure as Code

### Terraform Configuration

**main.tf:**

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "cryptosense-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = {
    Name        = "cryptosense-vpc"
    Environment = var.environment
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier        = "cryptosense-${var.environment}"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_encrypted = true

  db_name  = "cryptosense"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "02:00-03:00"
  maintenance_window      = "sun:03:00-sun:04:00"

  multi_az               = var.environment == "production"
  skip_final_snapshot    = var.environment != "production"
  final_snapshot_identifier = "${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name        = "cryptosense-db"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "cryptosense-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "cryptosense-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "LOG_LEVEL", value = "info" }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.db_url.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/cryptosense-api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "cryptosense-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"

  tags = {
    Name        = "cryptosense-alb"
    Environment = var.environment
  }
}
```

**variables.tf:**

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}
```

**Usage:**

```bash
# Initialize Terraform
terraform init

# Plan changes
terraform plan -var-file="environments/production.tfvars"

# Apply changes
terraform apply -var-file="environments/production.tfvars"
```

---

## 12. Runbooks

### Runbook: API is Down

**Symptoms:**
- Health check failing
- Users reporting errors
- 5xx error rate spiking

**Investigation:**
1. Check ECS service status:
   ```bash
   aws ecs describe-services --cluster cryptosense-prod --services cryptosense-api
   ```

2. Check recent deployments:
   ```bash
   aws ecs describe-task-definition --task-definition cryptosense-api
   ```

3. Check application logs:
   ```bash
   aws logs tail /ecs/cryptosense-api --follow
   ```

4. Check database connectivity:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

**Resolution:**
- If deployment issue: Rollback to previous version
  ```bash
  aws ecs update-service --cluster cryptosense-prod --service cryptosense-api --task-definition cryptosense-api:PREVIOUS_REVISION
  ```

- If database issue: Check connection pool, restart if needed
- If resource exhaustion: Scale up immediately
  ```bash
  aws ecs update-service --cluster cryptosense-prod --service cryptosense-api --desired-count 10
  ```

---

### Runbook: Database Performance Degradation

**Symptoms:**
- Slow API response times
- High database CPU usage
- Increasing connection count

**Investigation:**
1. Check current connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. Find slow queries:
   ```sql
   SELECT pid, now() - query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC;
   ```

3. Check table bloat:
   ```sql
   SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
   LIMIT 10;
   ```

**Resolution:**
- Kill long-running queries:
  ```sql
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <PID>;
  ```

- Add missing indexes:
  ```sql
  CREATE INDEX CONCURRENTLY idx_portfolios_user_id ON portfolios(user_id);
  ```

- Scale up database instance (if needed):
  ```bash
  aws rds modify-db-instance --db-instance-identifier cryptosense-prod --db-instance-class db.t3.large --apply-immediately
  ```

---

### Runbook: High Memory Usage

**Symptoms:**
- Increasing memory utilization
- OOM (Out of Memory) errors
- Container restarts

**Investigation:**
1. Check memory usage:
   ```bash
   aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name MemoryUtilization --dimensions Name=ServiceName,Value=cryptosense-api --statistics Average --start-time 2025-10-06T00:00:00Z --end-time 2025-10-06T23:59:59Z --period 300
   ```

2. Check for memory leaks (heap dump):
   ```bash
   node --expose-gc --inspect dist/server.js
   ```

**Resolution:**
- Restart service (temporary fix):
  ```bash
  aws ecs update-service --cluster cryptosense-prod --service cryptosense-api --force-new-deployment
  ```

- Increase memory allocation:
  ```bash
  # Update task definition with more memory (2048 MB)
  aws ecs register-task-definition --cli-input-json file://task-definition-2gb.json
  aws ecs update-service --cluster cryptosense-prod --service cryptosense-api --task-definition cryptosense-api:NEW_REVISION
  ```

- Investigate and fix memory leak in code

---

## Checklist

### Pre-Launch
- [ ] All environments configured (dev, staging, prod)
- [ ] CI/CD pipeline functional
- [ ] Database backups automated
- [ ] Monitoring and alerting configured
- [ ] Health check endpoints implemented
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Secrets stored securely (AWS Secrets Manager)
- [ ] Auto-scaling configured
- [ ] Disaster recovery plan documented

### Post-Launch
- [ ] Monitor dashboards daily
- [ ] Review logs weekly
- [ ] Test backups monthly
- [ ] Run DR drill quarterly
- [ ] Review and optimize costs monthly
- [ ] Update runbooks as needed
- [ ] Scale infrastructure as user base grows

---

## Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Site Reliability Engineering Book](https://sre.google/books/)

---

**Document Maintained By:** DevOps Team
**Last Updated:** October 6, 2025
**Next Review:** Quarterly (January 2026)

---

**END OF DOCUMENT**
