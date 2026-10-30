# PeopleDesk — HR employee management

Laravel API (PostgreSQL) + Next.js frontend.

```
peopledesk/
├── backend-src/        Laravel app code (models, controllers, migrations, routes, seeder)
├── frontend/           Next.js 14 (App Router, TypeScript, Tailwind, SWR)
├── docker-compose.yml  PostgreSQL 16
└── setup-backend.sh    Creates a fresh Laravel app in ./backend and applies backend-src to it
```

## 1. Run it

Prerequisites: PHP 8.2+ (with `pdo_pgsql`), Composer, Node 18.18+, Docker (or your own PostgreSQL).

```bash
# database
docker compose up -d

# backend  (creates ./backend, installs Sanctum, migrates, seeds)
./setup-backend.sh
cd backend && php artisan serve          # http://localhost:8000

# frontend  (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                              # http://localhost:3000
```

Using your own PostgreSQL? Pass the details to the setup script:
`DB_HOST=... DB_DATABASE=... DB_USERNAME=... DB_PASSWORD=... ./setup-backend.sh`

## 2. Demo accounts (password: `password`)

| Email | Role | Can do |
|---|---|---|
| admin@example.com | admin | everything; no employee record, so no clock-in |
| hr@example.com | hr | manage employees, departments; review leave |
| employee@example.com | employee | directory, own clock-in, own leave |

## 3. What's included

- **Auth**: Laravel Sanctum tokens. The Next.js server stores the token in an **httpOnly cookie** and forwards
  API calls through `/api/proxy/*`, so the token never reaches browser JavaScript and no CORS setup is needed.
- **Employees**: search, department/status filters, pagination, create, edit, remove; optional sign-in account on creation.
  Salary, birth date, address and emergency contact are only returned to HR and to the employee themself.
- **Departments**: CRUD (HR); deleting a department that still has employees is refused.
- **Leave**: employees request leave (weekends not counted, overlaps rejected); HR approves/rejects with a note;
  HR cannot review their own request; employees can cancel pending requests.
- **Attendance**: clock in / clock out, daily view for HR, history for employees.
- **Dashboard**: headcount, clocked in, on leave, new hires, department split, pending approvals.

## 4. API summary (all under `/api`, bearer token except login)

```
POST   auth/login | auth/logout        GET auth/me
GET    dashboard
GET    employees?search=&department_id=&status=&page=     POST employees
GET    employees/{id}    PUT employees/{id}    DELETE employees/{id}
GET    departments       POST/PUT/DELETE departments[/{id}]
GET    positions         GET leave-types
GET    leave-requests?status=    POST leave-requests
PATCH  leave-requests/{id}/approve | reject     DELETE leave-requests/{id}  (cancel)
GET    attendance?date=  GET attendance/today
POST   attendance/clock-in | clock-out
```

## 5. Notes

- Timezone is set to `Africa/Addis_Ababa` in `.env` (`APP_TIMEZONE`); change it if needed.
- Currency for salaries: `NEXT_PUBLIC_CURRENCY` in `frontend/.env.local`.
- Production: set `API_URL` to your API's internal URL, serve both behind HTTPS (the cookie is `secure` in production),
  and change the seeded passwords or remove the seeder.
- Not built yet: payroll, leave balances, documents/uploads, password reset, audit log.
