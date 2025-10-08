# Data Privacy Policy - Coinsphere

**Effective Date**: October 6, 2025
**Last Updated**: October 6, 2025
**Version**: 1.0
**Jurisdiction**: Global (GDPR & CCPA Compliant)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Information We Collect](#information-we-collect)
3. [How We Use Your Information](#how-we-use-your-information)
4. [How We Share Your Information](#how-we-share-your-information)
5. [Data Storage & Security](#data-storage--security)
6. [Your Privacy Rights](#your-privacy-rights)
7. [Cookie Policy](#cookie-policy)
8. [Data Retention](#data-retention)
9. [International Data Transfers](#international-data-transfers)
10. [Children's Privacy](#childrens-privacy)
11. [Changes to This Policy](#changes-to-this-policy)
12. [Contact Us](#contact-us)

---

## 1. Introduction

### Who We Are

**Coinsphere** ("Coinsphere", "we", "us", "our") provides AI-powered cryptocurrency portfolio tracking and market prediction services.

**Contact Information:**
- **Email**: privacy@coinsphere.app
- **Address**: [To be added upon incorporation]
- **Data Protection Officer**: dpo@coinsphere.app (for EU/UK users)

### Our Commitment to Privacy

Your privacy and trust are fundamental to our business. We:

- **Minimize Data Collection** - We only collect data necessary to provide our services
- **Maximize Transparency** - We explain exactly what data we collect and why
- **Protect Your Data** - We use industry-leading security practices (AES-256 encryption, TLS 1.3)
- **Respect Your Rights** - You can access, export, or delete your data at any time
- **Never Sell Your Data** - We will never sell your personal information to third parties

### Scope

This policy applies to:
- ✅ Coinsphere web application (app.coinsphere.app)
- ✅ Coinsphere mobile apps (iOS and Android)
- ✅ Coinsphere API
- ✅ Marketing website (coinsphere.app)
- ✅ Email communications

This policy does NOT apply to:
- ❌ Third-party websites linked from our services
- ❌ Exchange platforms you connect (Binance, Coinbase, etc.) - see their privacy policies

### Legal Basis for Processing (GDPR)

We process your data based on:
- **Consent** - You explicitly agree to data collection (account creation, newsletter signup)
- **Contractual Necessity** - Processing is necessary to provide our services
- **Legitimate Interest** - Analytics to improve our services, fraud prevention
- **Legal Obligation** - Compliance with tax laws, data breach notifications

---

## 2. Information We Collect

### 2.1 Information You Provide Directly

#### Account Registration
When you create an account, we collect:

| Data Type | Required? | Purpose | Retention |
|-----------|-----------|---------|-----------|
| **Email Address** | ✅ Required | Account login, notifications, support | Until account deletion |
| **Password** | ✅ Required (if not OAuth) | Account security | Hashed, never stored in plain text |
| **Display Name** | ✅ Required | Personalization | Until account deletion |
| **Country/Timezone** | ❌ Optional | Localized experience | Until account deletion |
| **Referral Code** | ❌ Optional | Track referrals, apply discounts | 90 days or until used |

**Note:** We do NOT collect:
- ❌ Full name (unless you choose to add it)
- ❌ Phone number
- ❌ Home address
- ❌ Government ID or SSN
- ❌ Date of birth

#### Portfolio & Holdings Data
When you connect exchanges or add portfolios manually:

| Data Type | Required? | Purpose | Retention |
|-----------|-----------|---------|-----------|
| **Exchange API Keys** | ✅ Required (for auto-sync) | Fetch portfolio balances | Encrypted, until you disconnect |
| **Portfolio Holdings** | ✅ Required | Display balances, calculate risk | Until portfolio deleted |
| **Transaction History** | ❌ Optional | Performance tracking, tax estimates | Until account deletion |
| **Custom Asset Notes** | ❌ Optional | Personal organization | Until you delete them |

**Security Note:**
- ⚠️ **We ONLY accept READ-ONLY API keys** (no withdrawal permissions)
- 🔒 API keys are encrypted at rest using AES-256 encryption
- 🔑 Encryption keys are managed via AWS KMS
- 👀 We display only the last 4 characters of API keys to you

#### Payment Information
When you subscribe to a paid plan:

| Data Type | How We Handle It | Who Stores It |
|-----------|------------------|---------------|
| **Credit Card** | We DO NOT store card numbers | Stripe (PCI DSS Level 1 compliant) |
| **Billing Email** | Stored by us (may differ from account email) | Coinsphere database |
| **Billing Country** | Stored by us (for tax compliance) | Coinsphere database |
| **Invoice History** | Stored by us | Coinsphere database (7 years for tax) |

**Payment Processor:** Stripe Inc. ([Stripe Privacy Policy](https://stripe.com/privacy))

#### Support & Communications
When you contact support:

- **Email Address** - To respond to your inquiry
- **Support Ticket Content** - Your messages, screenshots you send
- **Device/Browser Info** - To troubleshoot technical issues
- **Conversation History** - Stored for 2 years

### 2.2 Information Collected Automatically

#### Usage Data
When you use our services, we automatically collect:

| Data Type | Examples | Purpose | Retention |
|-----------|----------|---------|-----------|
| **Device Information** | Browser type, OS, screen resolution | Optimize UI, troubleshoot bugs | 90 days |
| **IP Address** | 192.0.2.1 | Security (detect fraud), localization | 30 days (anonymized after) |
| **Session Data** | Login time, session duration | Security, analytics | 90 days |
| **Feature Usage** | Screens viewed, buttons clicked | Product improvements | 90 days (aggregated) |
| **API Requests** | Endpoint, timestamp, response time | Performance monitoring, rate limiting | 7 days |
| **Error Logs** | Stack traces, error messages | Bug fixing | 30 days |

**Analytics Tools We Use:**
- Google Analytics 4 (anonymized IP addresses) - [GA4 Privacy](https://support.google.com/analytics/answer/6004245)
- Sentry (error tracking) - [Sentry Privacy](https://sentry.io/privacy/)
- Datadog (infrastructure monitoring) - [Datadog Privacy](https://www.datadoghq.com/legal/privacy/)

#### Cookies & Tracking Technologies
See [Section 7: Cookie Policy](#7-cookie-policy) for details.

### 2.3 Information from Third Parties

#### OAuth Authentication (Google Sign-In)
If you sign in with Google:

| Data from Google | How We Use It | Can You Opt Out? |
|------------------|---------------|------------------|
| Email address | Account identifier | ❌ No (required) |
| Profile name | Display name (pre-fill) | ✅ Yes (you can change it) |
| Profile picture | Avatar (optional) | ✅ Yes (you can remove it) |

**Google Privacy Policy:** [https://policies.google.com/privacy](https://policies.google.com/privacy)

#### Exchange APIs (Read-Only Data)
When you connect exchanges (Binance, Coinbase, etc.):

| Data from Exchange | How We Use It | How Often We Fetch It |
|--------------------|---------------|-----------------------|
| Portfolio balances | Display holdings, calculate risk | Every 5 minutes (real-time) |
| Asset prices | Market data | Every 1 minute |
| Transaction history | Performance tracking (if enabled) | Once per day |

**We DO NOT:**
- ❌ Execute trades on your behalf
- ❌ Withdraw funds
- ❌ Access 2FA codes
- ❌ Access your exchange passwords

#### Market Data Providers
We fetch public market data from:
- **CoinGecko** - Cryptocurrency prices, market cap ([Privacy Policy](https://www.coingecko.com/en/privacy))
- **The Graph** - On-chain data (decentralized, no user data shared)
- **LunarCrush** - Social sentiment data ([Privacy Policy](https://lunarcrush.com/privacy))

**Note:** These providers do NOT receive any of your personal information.

---

## 3. How We Use Your Information

### 3.1 Core Service Delivery

**Account Management:**
- Create and manage your account
- Authenticate you securely (JWT tokens)
- Provide customer support
- Send critical account notifications (security alerts, password resets)

**Portfolio Tracking:**
- Sync balances from connected exchanges
- Display portfolio performance and charts
- Calculate total value and asset allocation
- Send price alerts (if you enable them)

**AI Predictions & Risk Scoring:**
- Generate market predictions using our LSTM models
- Calculate risk scores for assets and portfolios
- Display prediction accuracy history
- Provide personalized insights

### 3.2 Product Improvement

**Analytics & Research:**
- Understand which features are most used
- Identify bugs and performance issues
- Test new features with A/B testing
- Improve prediction model accuracy

**Examples:**
- "85% of users check the Dashboard daily" → Optimize dashboard load time
- "Risk score feature has 40% adoption" → Improve visibility of risk scores
- "Mobile app crashes on iOS 15" → Fix compatibility bug

**Data Used:** Aggregated, anonymized usage data (NOT personally identifiable)

### 3.3 Communication

**Transactional Emails (you CANNOT opt out):**
- Account verification
- Password reset requests
- Security alerts (suspicious login attempts)
- Billing receipts and invoices
- Critical service updates (downtime, security patches)

**Marketing Emails (you CAN opt out):**
- Product updates and new features
- Educational content (e.g., "How to reduce portfolio risk")
- Special offers and discounts
- Monthly newsletters

**How to Opt Out:** Click "Unsubscribe" in any marketing email, or go to Settings → Notifications

### 3.4 Security & Fraud Prevention

We use your data to:
- Detect and prevent unauthorized access (unusual login locations)
- Prevent API abuse and scraping (rate limiting)
- Comply with legal obligations (subpoenas, law enforcement requests)
- Investigate violations of our Terms of Service

### 3.5 Legal Compliance

We may use or disclose data to:
- Comply with tax laws (billing records retained 7 years)
- Respond to legal requests (subpoenas, court orders)
- Enforce our Terms of Service
- Protect our rights, property, or safety

---

## 4. How We Share Your Information

### 4.1 We DO NOT Sell Your Data

**We will NEVER sell, rent, or trade your personal information to third parties for marketing purposes.**

### 4.2 Service Providers (Data Processors)

We share data with trusted service providers who help us operate our business:

| Service Provider | Data Shared | Purpose | Privacy Policy |
|------------------|-------------|---------|----------------|
| **AWS (Amazon Web Services)** | All user data (encrypted) | Cloud hosting, database | [AWS Privacy](https://aws.amazon.com/privacy/) |
| **Vercel** | Web app frontend (no user data) | Frontend hosting | [Vercel Privacy](https://vercel.com/legal/privacy-policy) |
| **Stripe** | Email, billing country | Payment processing | [Stripe Privacy](https://stripe.com/privacy) |
| **Google Analytics** | Anonymized usage data | Analytics | [GA Privacy](https://support.google.com/analytics/answer/6004245) |
| **Sentry** | Error logs (sanitized) | Error tracking | [Sentry Privacy](https://sentry.io/privacy/) |
| **SendGrid** | Email address | Email delivery | [SendGrid Privacy](https://www.twilio.com/legal/privacy) |

**Contractual Safeguards:**
- All processors sign Data Processing Agreements (DPAs)
- GDPR Standard Contractual Clauses for EU data
- Processors are prohibited from using data for their own purposes

### 4.3 Legal Requirements

We may disclose data if required by law:
- Subpoenas, court orders, or legal processes
- National security or law enforcement requests
- Fraud investigations
- Protection of our legal rights

**Transparency:** We will notify you of legal requests unless prohibited by law (e.g., gag orders).

### 4.4 Business Transfers

If Coinsphere is acquired, merges, or sells assets:
- Your data may be transferred to the new entity
- You will be notified via email 30 days before the transfer
- The new entity must honor this Privacy Policy
- You can delete your account before the transfer

### 4.5 Aggregated Data (Non-Personal)

We may publicly share aggregated, anonymized data:
- "70% of users hold Bitcoin in their portfolios"
- "Average portfolio size is $12,000"
- "Prediction accuracy for BTC is 72%"

**This data CANNOT be used to identify you.**

---

## 5. Data Storage & Security

### 5.1 Where We Store Data

**Primary Region:** United States (AWS us-east-1)

**Backups:** Multi-region (AWS us-west-2, eu-central-1)

**CDN:** Global (Cloudflare - static assets only, no user data)

### 5.2 How We Protect Data

#### Encryption

**In Transit:**
- All communication uses TLS 1.3 (HTTPS)
- Certificate pinning for mobile apps
- No plain HTTP allowed

**At Rest:**
- Database: AES-256 encryption (AWS RDS encryption)
- API Keys: AES-256 + AWS KMS
- Backups: Encrypted with separate keys

**Hashing:**
- Passwords: bcrypt (12 rounds, salted)
- NEVER stored in plain text

#### Access Controls

**Principle of Least Privilege:**
- Developers can access staging data only
- Only 2 senior engineers have production database access (audited)
- Admin actions logged and reviewed monthly

**Authentication:**
- Two-factor authentication (2FA) required for all staff
- Hardware security keys (YubiKeys) for admin access
- SSH keys rotated every 90 days

#### Network Security

- Private subnets for databases (not publicly accessible)
- Web Application Firewall (WAF) blocks SQL injection, XSS
- DDoS protection (Cloudflare)
- Security groups restrict traffic by IP and port

#### Monitoring & Incident Response

- 24/7 automated security monitoring (Datadog)
- Alerts for suspicious activity (e.g., 100+ failed logins)
- Incident response plan (see [Security & Compliance Plan](SECURITY_COMPLIANCE_PLAN.md))
- Annual penetration testing

### 5.3 Data Security Limitations

**No System is 100% Secure:**
While we use industry best practices, no method of transmission or storage is completely secure. You acknowledge the inherent risks of transmitting data over the internet.

**Your Responsibilities:**
- Use a strong, unique password (password manager recommended)
- Enable two-factor authentication (2FA)
- Do NOT share your password or API keys
- Keep your email account secure (password reset target)
- Disconnect exchange APIs if you no longer use Coinsphere

---

## 6. Your Privacy Rights

### 6.1 Rights for All Users

**Access Your Data:**
- Download a copy of your data in JSON format
- Go to: Settings → Privacy → Export Data

**Update Your Data:**
- Edit your profile, email, and preferences anytime
- Go to: Settings → Account

**Delete Your Account:**
- Request deletion anytime (processed within 30 days)
- Go to: Settings → Privacy → Delete Account
- 7-day grace period to cancel deletion

**Opt Out of Marketing Emails:**
- Click "Unsubscribe" in any email
- Or go to: Settings → Notifications

### 6.2 Additional Rights (GDPR - EU/UK Users)

If you are located in the European Union or United Kingdom, you have additional rights under GDPR:

**Right to Access (Article 15):**
- Request confirmation of what data we hold
- Receive a copy in a structured, machine-readable format

**Right to Rectification (Article 16):**
- Correct inaccurate or incomplete data

**Right to Erasure / "Right to be Forgotten" (Article 17):**
- Request deletion of your data (subject to legal exceptions)

**Right to Restrict Processing (Article 18):**
- Request we limit how we use your data (e.g., storage only)

**Right to Data Portability (Article 20):**
- Receive your data in a portable format (JSON)
- Transfer data to another service

**Right to Object (Article 21):**
- Object to processing based on legitimate interests
- Object to direct marketing (opt out anytime)

**Right to Not Be Subject to Automated Decision-Making (Article 22):**
- Our AI predictions are advisory only (you make the final decision)
- No automated decisions with legal or significant effects

**How to Exercise Your Rights:**
- Email: privacy@coinsphere.app
- Subject: "GDPR Request - [Your Request Type]"
- We will respond within 30 days (may extend to 60 days for complex requests)

### 6.3 Additional Rights (CCPA - California Users)

If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):

**Right to Know:**
- What personal information we collect
- How we use it
- Who we share it with

**Right to Delete:**
- Request deletion of your personal information

**Right to Opt-Out of Sale:**
- We do NOT sell your data, so this does NOT apply

**Right to Non-Discrimination:**
- We will NOT discriminate against you for exercising your privacy rights

**How to Exercise Your Rights:**
- Email: privacy@coinsphere.app
- Subject: "CCPA Request - [Your Request Type]"
- We will verify your identity and respond within 45 days

**Authorized Agent:**
You may designate an authorized agent to submit requests on your behalf. We will require written proof of authorization.

### 6.4 Complaints & Supervisory Authorities

**EU/UK Users:**
You have the right to lodge a complaint with your local data protection authority:
- **UK:** Information Commissioner's Office (ICO) - [https://ico.org.uk/](https://ico.org.uk/)
- **EU:** Find your authority - [https://edpb.europa.eu/about-edpb/board/members_en](https://edpb.europa.eu/about-edpb/board/members_en)

**California Users:**
You may file a complaint with the California Attorney General's Office:
- [https://oag.ca.gov/contact/consumer-complaint-against-business-or-company](https://oag.ca.gov/contact/consumer-complaint-against-business-or-company)

---

## 7. Cookie Policy

### 7.1 What Are Cookies?

Cookies are small text files stored on your device by your web browser. They help us remember your preferences and analyze usage.

### 7.2 Types of Cookies We Use

#### Strictly Necessary Cookies (Cannot Opt Out)

| Cookie Name | Purpose | Expiration | Type |
|-------------|---------|------------|------|
| `session_token` | Maintain login session | 7 days | First-party |
| `csrf_token` | Prevent cross-site request forgery | Session | First-party |

#### Functional Cookies (Can Opt Out)

| Cookie Name | Purpose | Expiration | Type |
|-------------|---------|------------|------|
| `theme_preference` | Remember dark/light mode | 1 year | First-party |
| `language` | Remember language preference | 1 year | First-party |

#### Analytics Cookies (Can Opt Out)

| Cookie Name | Purpose | Expiration | Type | Provider |
|-------------|---------|------------|------|----------|
| `_ga` | Google Analytics user ID | 2 years | Third-party | Google |
| `_ga_*` | Google Analytics session data | 2 years | Third-party | Google |

#### Marketing Cookies (Can Opt Out)

We DO NOT currently use marketing/advertising cookies. If we do in the future, you will be notified.

### 7.3 How to Manage Cookies

**In-App Settings:**
- Go to: Settings → Privacy → Cookie Preferences
- Toggle analytics and functional cookies on/off

**Browser Settings:**
- Most browsers allow you to block or delete cookies
- [How to manage cookies in Chrome](https://support.google.com/chrome/answer/95647)
- [How to manage cookies in Firefox](https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer)
- [How to manage cookies in Safari](https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac)

**Opt-Out Tools:**
- Google Analytics Opt-Out: [https://tools.google.com/dlpage/gaoptout](https://tools.google.com/dlpage/gaoptout)

**Note:** Blocking strictly necessary cookies may prevent you from logging in or using core features.

### 7.4 Do Not Track (DNT)

We respect Do Not Track (DNT) browser signals:
- If DNT is enabled, we disable analytics cookies
- Strictly necessary cookies remain active (required for functionality)

---

## 8. Data Retention

### 8.1 How Long We Keep Data

**Active Account Data:**
- Retained as long as your account is active
- Updated in real-time as you use the service

**Deleted Account Data:**
- **User Profile:** Deleted within 30 days
- **Portfolio Data:** Deleted within 30 days
- **API Keys:** Immediately revoked and deleted
- **Audit Logs:** Anonymized (user IDs removed), retained 1 year
- **Billing Records:** Retained 7 years (tax compliance requirement)

**Backups:**
- Automated backups are deleted after 6 months
- Deleted account data is purged from backups within 6 months

**Support Tickets:**
- Retained 2 years after resolution
- Can be deleted upon request (email privacy@coinsphere.app)

### 8.2 Why We Retain Data

**Legal Requirements:**
- Billing records: 7 years (IRS, tax authorities)
- Audit logs: 1 year (security investigations, fraud prevention)

**Business Purposes:**
- Analytics: Improve product (aggregated data only)
- Support: Provide better assistance (conversation history)

### 8.3 Data Minimization

We regularly review and delete data that is:
- No longer necessary for service delivery
- Older than our retention policies
- No longer legally required

---

## 9. International Data Transfers

### 9.1 Where Your Data May Be Transferred

**Primary Storage:** United States (AWS us-east-1)

**Your data may be transferred to:**
- United States (cloud hosting - AWS)
- European Union (backup servers - AWS eu-central-1)
- Other countries where our service providers operate

### 9.2 Safeguards for EU/UK Users

**Legal Mechanisms:**
- **Standard Contractual Clauses (SCCs)** - EU-approved contracts for data transfers
- **Adequacy Decisions** - Countries deemed adequate by the EU Commission

**Service Provider Compliance:**
- AWS has implemented SCCs for EU data transfers
- All processors sign Data Processing Agreements (DPAs)

**Your Rights:**
- You can request a copy of SCCs by emailing privacy@coinsphere.app

### 9.3 Data Localization (Future Plans)

**Year 2+ Goal:**
- EU users: Data stored in eu-central-1 (Frankfurt)
- Asia-Pacific users: Data stored in ap-southeast-1 (Singapore)

---

## 10. Children's Privacy

### 10.1 Age Restrictions

**Coinsphere is NOT intended for children under 18 years old.**

**We do NOT knowingly collect data from children under 18.**

**We do NOT knowingly collect data from children under 13 (COPPA compliance).**

### 10.2 If We Discover Child Data

If we learn that we have collected data from a child under 18:
1. We will delete the account immediately
2. We will delete all associated data within 30 days
3. We will notify the user (if contact info is available)

### 10.3 Parental Rights

If you believe your child has created an account:
- Email: privacy@coinsphere.app
- Subject: "Child Account Deletion Request"
- Include: Child's email address, your relationship to the child
- We will delete the account within 7 days

---

## 11. Changes to This Policy

### 11.1 How We Notify You

**Material Changes:**
- Email notification 30 days before the change takes effect
- Prominent notice on the website and app
- You can object by deleting your account

**Non-Material Changes (e.g., typos, clarifications):**
- Updated policy posted on website
- "Last Updated" date changed at the top

### 11.2 Your Consent

**By continuing to use Coinsphere after the effective date, you accept the updated Privacy Policy.**

If you do NOT agree:
- Stop using the service
- Delete your account before the effective date
- Email privacy@coinsphere.app with concerns

### 11.3 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | October 6, 2025 | Initial version |

---

## 12. Contact Us

### General Privacy Questions
**Email:** privacy@coinsphere.app
**Response Time:** 3-5 business days

### Data Protection Officer (DPO) - EU/UK Users
**Email:** dpo@coinsphere.app
**Response Time:** 5-10 business days (30 days for formal requests)

### GDPR/CCPA Requests
**Email:** privacy@coinsphere.app
**Subject:** "GDPR Request - [Access/Deletion/Portability]"
**Response Time:** 30 days (may extend to 60 days for complex requests)

### Security Incidents
**Email:** security@coinsphere.app
**Response Time:** Immediate (monitored 24/7)

### Mailing Address
[To be added upon incorporation]

---

## Acknowledgments

This Privacy Policy was drafted with reference to:
- General Data Protection Regulation (GDPR) - EU Regulation 2016/679
- California Consumer Privacy Act (CCPA) - Cal. Civ. Code § 1798.100 et seq.
- OWASP Privacy Best Practices
- Stripe, GitHub, and Notion privacy policies (industry benchmarks)

---

**Thank you for trusting Coinsphere with your data. Your privacy is our priority.**

---

**Document Maintained By:** Legal & Product Team
**Last Reviewed:** October 6, 2025
**Next Review:** Quarterly (January 2026)

---

**END OF DOCUMENT**
