# NHCC Enterprise — Deployment Guide

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.10+ (for ML service)

### Quick Start
```bash
# Backend
cd server
npm install
npx prisma generate
node prisma/bootstrap-sqlite.js
node prisma/seed.js
npm start

# Frontend (new terminal)
cd client
npm install
npm run dev

# ML Service (new terminal)
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Docker Deployment

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

The app will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:3001
- ML Service: http://localhost:8000/docs

## Default Accounts
| Role | Email | Password |
|------|-------|----------|
| CEO | admin@nhcc.go.ug | password123 |
| Finance | finance@nhcc.go.ug | password123 |
| Engineering | eng@nhcc.go.ug | password123 |
| ICT | ict@nhcc.go.ug | password123 |

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Backend port |
| JWT_SECRET | (set in .env) | JWT signing secret |
| DATABASE_URL | file:../db/nhcc.db | SQLite file path |
| NODE_ENV | development | Environment |
