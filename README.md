# Event Management System (EMS)

## Prerequisites
- Node.js (v18+)
- PostgreSQL (via Supabase)

## Setup Guide

### 1. Database Setup
1. Log in to [Supabase](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy the contents of `database/schema.sql` and run it.

### 2. Backend Setup
1. Open terminal: `cd backend`
2. Install dependencies: `npm install`
3. Configure environment:
   - `cp .env.example .env`
   - Paste your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Run server: `npm start`

### 3. Frontend Setup
1. Open new terminal: `cd frontend`
2. Install dependencies: `npm install`
3. Configure environment:
   - `cp .env.example .env`
   - Paste `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Run app: `npm run dev`

## Default Roles
To test different roles, sign up a user via the frontend, then manually edit their `role` in the `profiles` table in Supabase to 'manager', 'employee', or 'sponsor'.