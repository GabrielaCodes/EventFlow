# Event Management System (EMS)

A comprehensive role-based event management platform built for academic evaluation.

## 🏗 Tech Stack
- **Database:** PostgreSQL (Supabase)
- **Backend:** Node.js, Express.js
- **Frontend:** React, TailwindCSS
- **Auth:** Supabase Auth with JWT verification

## 🚀 Features
- **Client:** Event booking & status tracking.
- **Employee:** Shift management, attendance logging, modification requests.
- **Manager:** Full admin control, staff assignment, analytics, venue management.
- **Sponsor:** Sponsorship approvals & payment processing.

## 🛠 Setup & Installation

1. **Database:**
   - Create a Supabase project.
   - Run the SQL scripts in `database/schema.sql` in the Supabase SQL Editor.

2. **Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env # Fill in credentials
   npm start