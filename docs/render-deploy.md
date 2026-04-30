# Deploy to Render.com (Web Service + Postgres)

## 1) Create Postgres on Render
- Create a **PostgreSQL** instance in Render.
- Render will provide a `DATABASE_URL` connection string.

## 2) Create Web Service
- **Runtime**: Node
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start`

## 3) Environment variables
Required:
- `DATABASE_URL`: from Render Postgres

Optional:
- `NEXT_PUBLIC_BASE_URL`: your public base URL, e.g. `https://your-service.onrender.com`
  - Used to return a full join URL from `POST /api/events`. If omitted, the API returns a relative path.

## 4) Notes
- This MVP auto-creates tables on first request (see `src/lib/db.ts`).
- If you want explicit migrations later, we can add a migration script and run it as a Render “pre-deploy” command.

