# ECE Careers Website

A modern, responsive ECE company and careers site built with React + Vite, designed for Vercel hosting and Supabase authentication/database.

## Features

- Company overview, BPO service descriptions, differentiators, and branch/location cards
- Dedicated `/why-ece` page with ECE's employee-first approach and service differentiators
- Original illustrative workplace photography in `public/images/`
- Careers section with role listings
- Gmail-only verification link before an application can be submitted
- Supabase-backed application storage protected by row-level security
- Admin inbox for reviewing applications and updating status

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable/anon key.
4. Run the SQL in `supabase/schema.sql` in Supabase SQL Editor.
5. Configure Supabase Auth email confirmation and set the Site URL / redirect URL to your Vercel URL (and local URL while developing).
6. Run `npm run dev`.

For testing locally, add `http://localhost:5173` to Supabase Auth's allowed redirect URLs. Add your production Vercel domain too.

## Set up the admin account

1. Create/sign in to the admin account using the admin sign-in link on `/` → Application inbox.
2. In Supabase Dashboard → Authentication → Users, locate the admin user and set `app_metadata` to `{ "role": "admin" }` using a trusted admin method. Never set admin role from the public client or expose a service-role key in Vite environment variables.
3. Sign out and sign back in so the new role appears in the user's access token.

Admin access is enforced by Supabase row-level security as well as the UI. Applicants can submit only for their own verified Gmail account; admins can review the inbox and update application status.

## Deploy to Vercel

Import this folder's Git repository as a Vercel project. Vercel detects Vite automatically. Add these project environment variables in Vercel and redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the publishable/anon browser key only. Do not add a Supabase service-role key to this frontend project. Add your Vercel production and preview URLs to Supabase Auth's allowed redirect URLs.

## Before public launch

- The three roles are examples for the prototype, not verified current ECE vacancies. Replace them with openings approved by ECE.
- Confirm branch addresses, contact details, claims, and current company information with ECE.
- Configure production email delivery in Supabase Auth (SMTP/custom SMTP) and test Gmail verification end to end.
- Add a privacy notice and retention period suitable for candidate data.
- This is an independently built concept, not an official ECE-owned site unless ECE authorizes its publication.

## Sources used for company background

- ECE official site: https://www.ececonsultinggroup.com/
- ECE official services page: https://www.ececonsultinggroup.com/services.html
- ECE careers and location history: https://www.ececonsultinggroup.com/careers.html
- ECE service approach: https://www.ececonsultinggroup.com/how-were-different.html
