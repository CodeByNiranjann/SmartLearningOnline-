# Deployment & Operations Guide

> **Important Deployment Policy:**  
> In accordance with project governance, do **not** trigger live production deployment or push to production hosting environments without explicit customer/owner authorization.

---

## 1. Architecture & Hosting Topology

The Smart Learning Platform is architected for containerized or PaaS cloud deployment:

```
[ Client Browser ]
        │ (HTTPS)
        ▼
[ Reverse Proxy / Nginx / CDN ]  ── Port 80/443
        │
        ├── Static Assets (React 19 / Vite SPA)
        └── /api/* Proxy
                 │
                 ▼
        [ Express API Cluster ]  ── Port 5000 (Node.js 20 ES Modules)
                 │
                 ▼
        [ MongoDB Replica Set ]  ── Port 27017 (Mongoose 8)
```

---

## 2. Environment Configuration & Externalized Secrets

### 2.1 Backend Server (`server/.env`)
| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | HTTP port for Express server. |
| `NODE_ENV` | Yes | `production` | Enables production optimizations, logging, and error masking. |
| `MONGO_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/online-learning` | Connection string to MongoDB cluster. |
| `JWT_SECRET` | Yes | Cryptographic string (32+ chars) | Key for signing/verifying session JWTs. |
| `CLIENT_URL` | Yes | `https://learnhub.yourdomain.com` | Allowed CORS origin for browser requests. |

### 2.2 Frontend Client (`.env` or Build Args)
| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `https://api.learnhub.yourdomain.com/api` | Base URL prefix for API requests. |

---

## 3. Health Checks & Monitoring

The platform provides automated health endpoints for load balancers, orchestrators, and uptime monitors:

### 3.1 Backend Healthcheck
- **Endpoint:** `GET /health`
- **Port:** `5000`
- **Response Format:**
  ```json
  {
    "status": "healthy",
    "uptime": 1248.5,
    "timestamp": "2026-10-14T21:00:00.000Z",
    "environment": "production"
  }
  ```
- **HTTP Status Code:** `200 OK` (unhealthy if non-200 or connection times out).

### 3.2 Frontend Healthcheck
- **Endpoint:** `GET /health`
- **Port:** `80`
- **Response Format:** Plain text `healthy` with `200 OK`.

---

## 4. Containerized Deployment (Docker Compose)

The repository provides production-ready Docker configurations:

1. Copy and populate production secrets:
   ```bash
   cp server/.env.example server/.env
   cp .env.example .env
   ```
2. Build and run containers:
   ```bash
   docker-compose up -d --build
   ```
3. Verify running containers and health status:
   ```bash
   docker-compose ps
   ```
4. Access platform:
   - Frontend: `http://localhost`
   - API Health: `http://localhost:5000/health`

---

## 5. Continuous Integration & Deployment (CI/CD)

The GitHub Actions workflow [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) executes on every push and pull request to `main` and `balee`:

1. Boots up isolated MongoDB container service (`mongo:7.0`).
2. Installs dependencies using `npm ci`.
3. Executes automated integration and ownership security test suites (`npm --prefix server test`).
4. Executes production client compilation (`npm run build`).

---

## 6. Rollback Procedures & Disaster Recovery

If any deployment check fails or critical defects are reported post-deployment:

### Immediate Rollback Steps
1. **Container / Orchestrator Rollback:**
   ```bash
   # Revert to previous image tag or Git commit SHA
   docker-compose down
   git checkout <PREVIOUS_STABLE_COMMIT_OR_TAG>
   docker-compose up -d --build
   ```
2. **Database Rollback:**
   - Database schema changes in Mongoose are additive. If rollback requires data restoration:
   ```bash
   mongorestore --uri="$MONGO_URI" --drop /backups/pre-deployment-backup/
   ```
3. **Session Invalidation Guard:**
   - If an authorization or security breach is suspected, run remote session revocation:
   ```bash
   # Invalidate all active sessions across users
   node -e "import('./server/models/Session.js').then(s => s.default.updateMany({}, { isValid: false })).then(() => process.exit(0))"
   ```

---

## 7. Operational Checklist Before Authorization

- [ ] All 37 integration tests pass cleanly (`npm run test:server`).
- [ ] Production build passes with zero compiler/bundler errors (`npm run build`).
- [ ] Database backup taken prior to any production migration.
- [ ] Environment secrets (`JWT_SECRET`, `MONGO_URI`) populated via cloud secrets manager (e.g., AWS Secrets Manager, Vault, or Cloud Run Environment Variables), never committed to Git.
- [ ] Owner/Stakeholder deployment sign-off recorded.
