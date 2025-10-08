# Secrets Management Guide - Coinsphere

## Overview
This document outlines best practices for managing secrets and sensitive configuration in Coinsphere.

## Development Environment

### Local Development

1. **Never commit secrets to Git**
   ```bash
   # .gitignore already includes:
   .env
   .env.local
   .env.*.local
   ```

2. **Use .env.example as template**
   ```bash
   cp .env.example .env
   # Edit .env with your local credentials
   ```

3. **Generate secure secrets**
   ```bash
   # Generate 32-byte hex secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate base64 secret
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Required secrets for local development**
   - `JWT_SECRET` - Min 32 characters
   - `JWT_REFRESH_SECRET` - Min 32 characters (different from JWT_SECRET)
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string

## Production Environment

### AWS Secrets Manager (Recommended)

1. **Store secrets in AWS Secrets Manager**
   ```bash
   # Create secret
   aws secretsmanager create-secret \
     --name coinsphere/prod/jwt-secret \
     --secret-string "$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')"
   ```

2. **Retrieve secrets at runtime**
   ```typescript
   // backend/src/lib/secrets.ts
   import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

   const client = new SecretsManagerClient({ region: 'us-east-1' });

   export async function getSecret(secretName: string): Promise<string> {
     try {
       const response = await client.send(
         new GetSecretValueCommand({ SecretId: secretName })
       );
       return response.SecretString || '';
     } catch (error) {
       console.error(`Failed to retrieve secret ${secretName}:`, error);
       throw error;
     }
   }
   ```

3. **Use in config**
   ```typescript
   // backend/src/config/index.ts
   import { getSecret } from '../lib/secrets.js';

   export const config = {
     jwt: {
       secret: process.env.NODE_ENV === 'production'
         ? await getSecret('coinsphere/prod/jwt-secret')
         : process.env.JWT_SECRET,
     },
   };
   ```

### Environment Variables (Alternative)

For platforms like Heroku, Vercel, or Railway:

```bash
# Set environment variables
heroku config:set JWT_SECRET="$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')"
heroku config:set DATABASE_URL="postgresql://..."
```

### HashiCorp Vault (Enterprise)

1. **Initialize Vault**
   ```bash
   vault secrets enable -path=coinsphere kv-v2
   ```

2. **Store secrets**
   ```bash
   vault kv put coinsphere/prod/db \
     username=coinsphere_prod \
     password="$(openssl rand -base64 32)"
   ```

3. **Retrieve in app**
   ```typescript
   import vault from 'node-vault';

   const vaultClient = vault({
     endpoint: process.env.VAULT_ADDR,
     token: process.env.VAULT_TOKEN,
   });

   const secret = await vaultClient.read('coinsphere/prod/db');
   const dbPassword = secret.data.data.password;
   ```

## Secret Rotation Strategy

### Rotation Schedule
- **JWT Secrets**: Every 90 days
- **API Keys**: Every 180 days or on suspected compromise
- **Database Passwords**: Every 90 days
- **Encryption Keys**: Every 365 days

### Rotation Process

1. **Generate new secret**
   ```bash
   NEW_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
   ```

2. **Add new secret alongside old (zero-downtime)**
   ```typescript
   // Support both old and new secrets during transition
   const secrets = {
     current: process.env.JWT_SECRET_NEW || process.env.JWT_SECRET,
     fallback: process.env.JWT_SECRET,
   };

   // Try verifying with current, fallback to old
   try {
     return jwt.verify(token, secrets.current);
   } catch (error) {
     return jwt.verify(token, secrets.fallback);
   }
   ```

3. **Deploy with dual-secret support**
4. **Wait for all active tokens to expire**
5. **Remove old secret**

## Secrets Checklist

### ✅ Required Secrets

- [ ] `JWT_SECRET` (32+ chars, random hex)
- [ ] `JWT_REFRESH_SECRET` (32+ chars, different from JWT_SECRET)
- [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] `REDIS_URL` (Redis connection string)
- [ ] `CSRF_SECRET` (32+ chars, random hex)

### ✅ Optional Secrets (feature-dependent)

- [ ] `COINGECKO_API_KEY` (CoinGecko API key)
- [ ] `STRIPE_SECRET_KEY` (Stripe payments)
- [ ] `SENTRY_DSN` (Error monitoring)
- [ ] `SMTP_USER` / `SMTP_PASS` (Email sending)
- [ ] `SENDGRID_API_KEY` (Alternative to SMTP)

## Security Best Practices

### 1. **Secret Strength Requirements**

```typescript
// Validate secret strength on startup
function validateSecret(secret: string, name: string) {
  if (!secret || secret.includes('change-this') || secret.includes('example')) {
    throw new Error(`${name} must be changed from default value`);
  }
  if (secret.length < 32) {
    throw new Error(`${name} must be at least 32 characters`);
  }
}

// In config/index.ts
if (process.env.NODE_ENV === 'production') {
  validateSecret(process.env.JWT_SECRET!, 'JWT_SECRET');
  validateSecret(process.env.JWT_REFRESH_SECRET!, 'JWT_REFRESH_SECRET');
}
```

### 2. **Prevent Secret Leakage**

```typescript
// NEVER log secrets
logger.info('Config loaded', {
  jwtSecret: '***REDACTED***',  // Good
  // jwtSecret: config.jwt.secret  // BAD!
});

// Sanitize error messages
try {
  await db.connect(DATABASE_URL);
} catch (error) {
  // Don't include DATABASE_URL in error message
  logger.error('Database connection failed', {
    error: error.message,
    // NOT: connectionString: DATABASE_URL
  });
}
```

### 3. **Secret Scope Limitation**

```bash
# Use different secrets per environment
coinsphere/dev/jwt-secret
coinsphere/staging/jwt-secret
coinsphere/prod/jwt-secret

# Use different secrets per service
coinsphere/prod/api/jwt-secret
coinsphere/prod/worker/api-key
```

### 4. **Access Control**

```bash
# AWS Secrets Manager - IAM Policy
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:coinsphere/prod/*"
    }
  ]
}
```

### 5. **Audit Logging**

```typescript
// Log secret access (but not values!)
logger.info('Secret accessed', {
  secretName: 'jwt-secret',
  userId: requestUserId,
  timestamp: new Date().toISOString(),
});
```

## Emergency Procedures

### Suspected Secret Compromise

1. **Immediate Actions**
   ```bash
   # Revoke compromised secret immediately
   aws secretsmanager put-secret-value \
     --secret-id coinsphere/prod/jwt-secret \
     --secret-string "$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')"
   ```

2. **Revoke all active sessions**
   ```bash
   # Flush all Redis sessions
   redis-cli FLUSHDB
   ```

3. **Force user re-authentication**
4. **Review audit logs for unauthorized access**
5. **Document incident in security log**

### Secret Recovery

```bash
# AWS Secrets Manager versioning
aws secretsmanager list-secret-version-ids \
  --secret-id coinsphere/prod/jwt-secret

# Restore previous version if needed
aws secretsmanager update-secret-version-stage \
  --secret-id coinsphere/prod/jwt-secret \
  --version-stage AWSCURRENT \
  --move-to-version-id <previous-version-id>
```

## Testing

### Unit Tests

```typescript
// Use fake secrets in tests
process.env.JWT_SECRET = 'test-secret-' + '0'.repeat(32);
process.env.JWT_REFRESH_SECRET = 'test-refresh-' + '0'.repeat(32);
```

### Integration Tests

```bash
# Use separate test database and Redis
DATABASE_URL=postgresql://test:test@localhost:5432/coinsphere_test
REDIS_URL=redis://localhost:6379/1
```

## Compliance

### GDPR / CCPA
- Secrets containing PII must be encrypted at rest
- Access logs retained for 90 days
- Right to deletion applies to user-specific secrets

### PCI DSS (if handling payments)
- Secrets must be encrypted in transit and at rest
- Access requires two-factor authentication
- Quarterly secret rotation required

## Monitoring

### Alerts

```typescript
// Alert on secret access failures
if (secretFetchAttempts > 3) {
  await alerting.send({
    severity: 'high',
    message: 'Multiple failed secret fetch attempts',
    service: 'secrets-manager',
  });
}
```

### Metrics

```typescript
// Track secret age
const secretAge = Date.now() - secretCreatedAt;
if (secretAge > 90 * 24 * 60 * 60 * 1000) {
  logger.warn('Secret is older than 90 days', {
    secretName,
    ageInDays: secretAge / (24 * 60 * 60 * 1000),
  });
}
```

## Resources

- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
