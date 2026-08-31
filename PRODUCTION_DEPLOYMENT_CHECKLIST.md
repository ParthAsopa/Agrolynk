# JWT Authentication - Production Deployment Checklist

**Document Version**: 1.0  
**Status**: ✅ Ready for Pre-Deployment Review  
**Target Date**: [To be determined by team]

---

## Pre-Deployment Verification (Week Before Launch)

### Code Quality
- [ ] All TypeScript compilation errors resolved (`npm run build`)
- [ ] No ESLint warnings or errors (`npm run lint`)
- [ ] All unit tests passing (if applicable)
- [ ] Code review completed and approved
- [ ] No console.log() statements left in production code
- [ ] No hardcoded secrets in codebase
- [ ] No TODO/FIXME comments in auth-critical code

### Security Review
- [ ] JWT_SECRET is strong (32+ characters, random)
- [ ] JWT_SECRET stored in environment variables only (NOT in code)
- [ ] CORS configured for production domain only
- [ ] HTTPS enforced (not HTTP)
- [ ] Token expiration is reasonable (7 days default)
- [ ] Password hashing uses bcrypt (salt rounds ≥ 10)
- [ ] No sensitive data logged to console
- [ ] No tokens logged to logs
- [ ] No passwords stored in plain text

### Testing Checklist
- [ ] All 10 end-to-end test scenarios executed and passing
- [ ] Manual browser testing completed
- [ ] DevTools inspection confirms Authorization header present
- [ ] Token persistence verified across page reload
- [ ] Role-based access control verified
- [ ] Invalid token handling tested
- [ ] 401 and 403 errors tested
- [ ] Cross-browser compatibility verified
- [ ] Mobile browser compatibility verified
- [ ] Network tab inspection shows no errors

### Performance Verification
- [ ] Page load time < 3 seconds
- [ ] API requests < 200ms average
- [ ] Token validation < 5ms
- [ ] No memory leaks detected
- [ ] No circular dependencies
- [ ] Bundle size acceptable

---

## Infrastructure Setup (Day Before Launch)

### Environment Variables

Create `.env.production` file with:

```bash
# JWT Configuration
JWT_SECRET=your-very-long-random-secure-secret-here-at-least-32-chars
JWT_EXPIRY=7d

# API Configuration
API_URL=https://api.agrolynk.com
FRONTEND_URL=https://agrolynk.com

# Database
DATABASE_URL=your-production-database-url

# CORS
CORS_ORIGIN=https://agrolynk.com

# Security Headers
SECURE_PROXY_HEADER=X-Forwarded-For
TRUST_PROXY=true

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

**CRITICAL**: Never commit `.env.production` to git. Use secrets management tool instead.

### Database Preparation

```bash
# 1. Create users table with proper schema
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer', 'company') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE
);

# 2. Create indexes for performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
CREATE INDEX idx_active ON users(is_active);

# 3. Verify schema
DESCRIBE users;

# 4. Check for test users
SELECT id, email, role FROM users LIMIT 5;
```

### SSL/HTTPS Configuration

- [ ] SSL certificate obtained (Let's Encrypt or paid CA)
- [ ] Certificate installed on production server
- [ ] HTTPS redirect enabled (HTTP → HTTPS)
- [ ] Certificate auto-renewal configured
- [ ] Certificate expiration monitoring setup

### Server Configuration

```bash
# 1. Install production dependencies
npm ci --production

# 2. Build frontend
npm run build

# 3. Verify built files exist
ls -la dist/

# 4. Set proper permissions
chmod 755 dist/
chmod 755 server/

# 5. Configure firewall
# Allow: HTTPS (443), HTTP (80 for redirect)
# Block: Direct access to backend port

# 6. Configure reverse proxy (nginx/Apache)
# - Redirect HTTP to HTTPS
# - Forward requests to backend
# - Set security headers
# - Set rate limiting
```

### CORS Configuration

Edit `server/index.ts`:

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## Launch Day Procedures (Day Of)

### Pre-Launch (2 hours before)

**Backup Everything**:
```bash
# 1. Database backup
mysqldump -u root -p agrolynk > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Code backup
git tag pre-production-v1.0
git push origin pre-production-v1.0

# 3. Verify backups
ls -lh backup_*.sql
```

**Final Testing**:
- [ ] Test login with production database
- [ ] Test token generation
- [ ] Test protected API endpoints
- [ ] Test logout and re-login
- [ ] Check all error messages
- [ ] Verify email notifications (if applicable)

**Preparation**:
- [ ] Notify team of launch
- [ ] Have rollback plan ready
- [ ] Ensure monitoring is setup
- [ ] Verify on-call engineer availability
- [ ] Prepare status page if applicable

### Launch (10:00 AM)

**Step 1: Deploy Backend** (15 minutes)
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Run database migrations (if any)
npm run migrate

# Build any TypeScript
npm run build

# Start server with process manager
pm2 start ecosystem.config.js

# Verify running
curl -s https://api.agrolynk.com/api/health | jq .
```

**Step 2: Deploy Frontend** (5 minutes)
```bash
# Build optimized production bundle
npm run build

# Verify build succeeded
ls -la dist/

# Deploy to CDN or web server
# This depends on your hosting setup
```

**Step 3: Verify Deployment** (10 minutes)
```bash
# Test login endpoint
curl -X POST https://api.agrolynk.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@agrolynk.com","password":"test123"}'

# Should return: {"token":"eyJ..."}

# Test protected endpoint
TOKEN="eyJ..."
curl -H "Authorization: Bearer $TOKEN" \
  https://api.agrolynk.com/api/user/me

# Should return: {"message":"Authenticated...","user":{...}}

# Test frontend loads
curl -s https://agrolynk.com | grep -q "AgroLynk" && echo "✅ Frontend OK"

# Check HTTPS redirect
curl -sI http://agrolynk.com | grep -q "301\|302" && echo "✅ HTTPS Redirect OK"
```

**Step 4: Announcement** (Immediate)
- Announce to team: "Production deployment complete ✅"
- Update status page
- Notify users if applicable

---

## Post-Launch Monitoring (First 24 hours)

### Automated Monitoring

Setup monitoring for these metrics:

```javascript
// Prometheus metrics to track:
- http_requests_total (by endpoint)
- http_request_duration_seconds (latency)
- jwt_validations_total (success/failure)
- authentication_failures_total
- authorization_failures_total (403 errors)
- token_refresh_total
- users_active (concurrent sessions)
- database_connection_pool (utilization)
- cpu_usage_percent
- memory_usage_bytes
- disk_usage_bytes
```

### Log Aggregation

Setup centralized logging for:

```bash
# All authentication attempts
app.log('AUTH_ATTEMPT', { email, timestamp, ip })

# All API requests
app.log('API_REQUEST', { method, path, userId, duration })

# All errors
app.log('ERROR', { error, stack, context })

# All JWT validations
app.log('JWT_VALIDATION', { valid, expired, invalid_sig })

# All role access denials
app.log('ACCESS_DENIED', { userId, role, required_role, path })
```

### Alert Thresholds

Setup alerts for:

| Metric | Warning | Critical |
|--------|---------|----------|
| 401 Errors/min | > 10 | > 50 |
| 403 Errors/min | > 5 | > 20 |
| API Latency (p95) | > 500ms | > 2s |
| Auth Failures/min | > 5 | > 20 |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 80% | > 95% |
| DB Connections | > 90% | > 95% |
| Error Rate | > 1% | > 5% |

### Manual Checks (Every 2 hours)

**Checklist**:
- [ ] No unusual error spike
- [ ] Average API response time < 200ms
- [ ] No database connection issues
- [ ] No memory leaks or gradual slowdown
- [ ] All HTTPS certificates valid
- [ ] All environment variables set correctly
- [ ] No pending deployments or rollbacks
- [ ] User feedback indicates normal operation
- [ ] Backup jobs completed successfully
- [ ] Log files not growing excessively

### Common Issues & Quick Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Token not stored | Login but no redirect | Check localStorage in DevTools, verify token in response |
| Missing auth header | 401 on every request | Verify queryClient.ts includes header, restart browser |
| Invalid secret | All tokens rejected | Verify JWT_SECRET matches between frontend and backend |
| CORS error | Requests blocked | Check CORS configuration, verify origin matches |
| Expired token | 401 after valid login | Check token expiration, verify server time is correct |
| Database down | All logins fail | Check database connection string, verify database is running |
| Rate limiting | Too many 429 errors | Check rate limit configuration, verify user behavior is normal |

---

## Post-Launch Maintenance (Week 1+)

### Scheduled Tasks

**Daily**:
- [ ] Review error logs
- [ ] Check monitoring dashboards
- [ ] Verify backup completion
- [ ] Monitor resource usage

**Weekly**:
- [ ] Review user feedback
- [ ] Check security notifications
- [ ] Verify all features working
- [ ] Review performance trends
- [ ] Update documentation with learnings

**Monthly**:
- [ ] Run security audit
- [ ] Review dependency updates
- [ ] Performance optimization review
- [ ] Capacity planning review

### Bug Tracking

Create tickets for:
- Any errors in production logs
- Any user-reported issues
- Any performance degradation
- Any security concerns

**Priority Matrix**:
- P1 (Critical): Service down, data loss, security breach
- P2 (High): Feature not working, performance issue
- P3 (Medium): Minor bugs, edge cases
- P4 (Low): UI improvements, documentation

---

## Rollback Procedure (If Needed)

### Decision Criteria for Rollback

Rollback immediately if:
- ❌ 404 errors > 20% of requests
- ❌ Login success rate < 50%
- ❌ API latency > 5s
- ❌ Database not responding
- ❌ HTTPS certificate expired
- ❌ Memory continuously increasing
- ❌ Critical security vulnerability discovered

### Rollback Steps

**Step 1: Notify** (Immediately)
```bash
# Announce to team
echo "🚨 ROLLBACK IN PROGRESS - $REASON"

# Pause new deployments
# Stop automated tasks
```

**Step 2: Restore** (< 2 minutes)
```bash
# Git rollback
git checkout pre-production-v1.0
git pull origin pre-production-v1.0

# Rebuild and restart
npm ci
npm run build
pm2 restart ecosystem.config.js

# Verify
curl -s https://api.agrolynk.com/api/health
```

**Step 3: Database** (If needed)
```bash
# Restore from backup
mysql -u root -p agrolynk < backup_2026-08-31_100000.sql

# Verify data
SELECT COUNT(*) FROM users;
```

**Step 4: Verify** (5 minutes)
```bash
# Test all critical flows
# Login, fetch data, logout

# Check no errors
curl -s https://api.agrolynk.com/api/health | jq .status

# Announce resolution
echo "✅ ROLLBACK COMPLETE - Previous version running"
```

**Step 5: Post-Mortem** (Within 24 hours)
- Identify root cause
- Document what went wrong
- Implement preventive measures
- Review with team
- Update processes

---

## Security Hardening (Post-Launch)

### Immediate (Week 1)
- [ ] Enable HTTPS only (remove HTTP)
- [ ] Configure security headers
- [ ] Setup rate limiting
- [ ] Setup request validation
- [ ] Enable CSRF protection (if not SPA)

### Short-term (Week 2-3)
- [ ] Implement refresh token endpoint
- [ ] Setup audit logging
- [ ] Configure password complexity requirements
- [ ] Setup email verification
- [ ] Setup account lockout on failed attempts

### Medium-term (Month 1-2)
- [ ] Implement two-factor authentication
- [ ] Setup penetration testing
- [ ] Implement WAF (Web Application Firewall)
- [ ] Setup intrusion detection
- [ ] Regular security audits

### Long-term (Month 3+)
- [ ] Implement security policy
- [ ] Staff security training
- [ ] Regular penetration testing
- [ ] Bug bounty program
- [ ] Compliance certifications

---

## Success Criteria

### Technical Success
✅ 99.9% uptime (max 8.6 hours downtime/month)  
✅ Login success rate > 99%  
✅ API response time < 200ms (p95)  
✅ Zero data loss  
✅ All security tests passing  

### User Success
✅ Users can login  
✅ Users can access appropriate dashboards  
✅ Users receive error messages on failures  
✅ Users can logout and re-login  
✅ Zero unintended access to restricted data  

### Operational Success
✅ Team alerted on any issues within 5 minutes  
✅ Team can identify root cause within 30 minutes  
✅ Team can rollback within 2 minutes if needed  
✅ All logs captured and searchable  
✅ All metrics visible and actionable  

---

## Sign-Off Template

```
PRODUCTION DEPLOYMENT - JWT AUTHENTICATION

Date: ________________
Deployed by: ________________
Reviewed by: ________________

Pre-Deployment:
  ☐ Code quality verified
  ☐ Security review passed
  ☐ All tests passing
  ☐ Backups created
  ☐ Team notified

Launch:
  ☐ Backend deployed
  ☐ Frontend deployed
  ☐ Verification successful
  ☐ No errors in logs

Post-Launch Monitoring (24 hours):
  ☐ Login working correctly
  ☐ APIs responding correctly
  ☐ No unusual errors
  ☐ Performance acceptable
  ☐ User feedback positive

Overall Status: ☐ SUCCESS  ☐ ISSUES  ☐ ROLLBACK

Issues Found:
_________________________________________________
_________________________________________________

Follow-up Actions:
_________________________________________________
_________________________________________________

Approval Sign-Off:
  Product Owner: ________________ Date: ________
  Tech Lead: ________________ Date: ________
  DevOps: ________________ Date: ________
```

---

## Contact Information for Launch

| Role | Name | Phone | Email | Notes |
|------|------|-------|-------|-------|
| On-Call Lead | | | | |
| Tech Lead | | | | |
| DevOps | | | | |
| Security | | | | |
| Product Manager | | | | |
| QA Lead | | | | |

---

## Knowledge Transfer

### Documentation Links
- [JWT Authentication Trace](./JWT_AUTHENTICATION_TRACE.md)
- [Implementation Summary](./JWT_IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](./JWT_TESTING_GUIDE.md)
- [Architecture Diagrams](./JWT_ARCHITECTURE_DIAGRAMS.md)
- [Quick Reference](./JWT_QUICK_REFERENCE.md)
- [End-to-End Tests](./JWT_END_TO_END_TESTS.md)
- [Change Summary](./CHANGE_SUMMARY.md)

### Training Sessions
- [ ] Schedule backend team training (1 hour)
- [ ] Schedule frontend team training (1 hour)
- [ ] Schedule QA team training (1 hour)
- [ ] Schedule DevOps team training (1 hour)

---

**Document Status**: Ready for Production Deployment  
**Last Updated**: August 31, 2026  
**Next Review Date**: [To be scheduled]
