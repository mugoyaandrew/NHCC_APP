# NHCC Portal + Finara Finance Manager

## Overview

This application is a full-stack web app that combines two experiences in one product:

- NHCC Portal: a management dashboard for construction and operations workflows
- Finara: a personal finance management workspace with budgeting, planning, and insights

The app is designed as a modern internal dashboard experience with authentication, role-based navigation, AI-assisted features, and a local database-backed backend.

---

## Purpose

The application was built to provide a unified platform for:

- managing infrastructure and project-related operations through NHCC
- tracking personal and household financial activity through Finara
- offering a seamless user experience with AI-powered guidance and voice interaction

---

## Main Features

### 1. NHCC Portal
The NHCC side provides operational tools for project and team management:

- Dashboard
- Projects
- Tasks
- Documents
- Messages
- Calendar
- Announcements
- Approvals
- Site Reports
- Reports
- User Management

This section is intended for teams managing construction or project activities and tracking progress across departments.

### 2. Finara Finance Module
The Finara side provides financial planning and tracking features:

- Dashboard
- Income tracking
- Expense tracking
- Analytics
- Savings goals
- Accounts
- Investments
- Settings

This section helps users monitor spending patterns, plan savings goals, and understand their financial health.

### 3. AI and Voice Features
The app includes built-in AI features that run locally in the browser:

- AI Financial Advisor for insights and guidance
- Voice navigation for hands-free command execution
- Expense auto-classification
- Anomaly detection for unusual expenses
- Goal forecasting based on current savings behavior

These features are designed to make the app more interactive and helpful without relying on external AI services.

---

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- TanStack Query
- Recharts
- Lucide Icons

### Backend
- Node.js
- Express.js

### Authentication
- JWT
- bcryptjs

### Database
- SQL-based local database using sql.js

### Other Tools
- CORS
- dotenv

---

## Project Structure

```text
client/
  src/
    App.jsx
    components/
    contexts/
    layouts/
    lib/
    pages/

server/
  db/
  middleware/
  routes/
  index.js
```

### Client
The client folder contains the React frontend, including:
- routing and app layout
- authentication context
- settings context
- page components for NHCC and Finara
- AI assistant and voice components

### Server
The server folder contains the Express API and database setup, including:
- authentication endpoints
- CRUD-style resource endpoints
- middleware for protected routes
- database initialization and schema

---

## Authentication

The app supports user login, registration, and session persistence.

### Authentication Flow
1. User logs in or registers
2. Server validates credentials
3. JSON Web Token is issued
4. Token is stored locally in the browser
5. Protected routes use the token for authorized access

### Demo Accounts
The app includes demo credentials for quick testing:

- NHCC Admin
  - Email: admin@nhcc.go.ug
  - Password: password123

- Finara Demo
  - Email: demo@finara.app
  - Password: password123

---

## Database Design

The backend uses a local SQL database with tables for:

- users
- income
- expenses
- goals
- accounts
- investments
- projects
- tasks
- documents
- approvals
- site_reports
- announcements
- messages

These tables support both personal finance and organizational operations.

---

## API Overview

The server exposes routes under the /api namespace, including:

- /api/auth/login
- /api/auth/register
- /api/auth/me
- /api/users
- /api/income
- /api/expenses
- /api/goals
- /api/accounts
- /api/investments
- /api/projects
- /api/tasks
- /api/documents
- /api/approvals
- /api/site-reports
- /api/announcements
- /api/messages
- /api/health

---

## Running the App Locally

### Prerequisites
- Node.js
- npm

### Install dependencies
```bash
npm run install:all
```

### Start the app
```bash
npm run dev
```

This will start:
- the backend server
- the Vite frontend client

### Default local development ports
- Frontend: Vite dev server
- Backend: port 3001

---

## Deployment Notes

The project appears to be set up for local or self-hosted development rather than a specific cloud deployment platform.

There is no explicit deployment configuration found for services such as:

- Vercel
- Netlify
- Render
- Heroku
- AWS
- Azure

For production hosting, the app would need additional deployment configuration and environment setup.

---

## Notes on the Current Implementation

This project is a polished demo-style application with:
- modern UI components
- responsive layouts
- protected routing
- local persistence
- AI-based user assistance

It is well-suited for demonstration, prototyping, internal tooling, or further feature expansion.

---

## Summary

NHCC Portal + Finara Finance Manager is a multi-purpose web application that combines project operations management and personal finance management in one experience. It includes modern UI design, secure authentication, local database support, and AI-enhanced features such as financial analysis, voice commands, and forecasting.
