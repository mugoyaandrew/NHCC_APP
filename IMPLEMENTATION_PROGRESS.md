# NHCC App Implementation Progress

Last updated: 2026-07-05

This file tracks completed implementation work, current updates, and items not yet done. Update it whenever the app changes.

## Built So Far

- Cleaned non-ASCII UI/server strings that were rendering incorrectly.
- Added backend audit logging for create, update, and delete operations.
- Added an Audit Logs page for CEO and ICT review.
- Added local CEO HTML report generation from current project and approval data.
- Added reusable backend role gates for protected CRUD reads and writes.
- Restricted user management to CEO, HR, and ICT roles.
- Restricted operational NHCC write actions by role while keeping normal read access available.
- Added project detail pages at `/projects/:id` with linked tasks, documents, and site reports.
- Added approval review workflow with approve/reject notes, reviewer tracking, and `reviewed_at`.
- Updated NHCC navigation to hide management/reporting tools from roles that cannot access them.
- Expanded `.gitignore` with safe team-friendly ignores for secrets, generated reports, build output, logs, and editor/OS files.

## In Progress

- Runtime verification after implementation.

## Not Done Yet

- Prisma/database migration conversion from the PDF roadmap.
- Real-time collaboration and notifications.
- File upload/sharing storage.
- ML forecasting or advanced predictive analytics.
- Deployment hardening and production hosting setup.
- Full automated test coverage.
- Fine-grained frontend route guards for direct URL access.
- Team decision on whether `server/db/app.db` should remain tracked or become a generated local database.
