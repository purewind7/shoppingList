
  # Shopping Notes

  Shopping Notes is a grocery list and recipe organizer built with Next.js. It supports
  email/password sign-in via Supabase and persists lists and recipes in Postgres so your
  data stays in sync across devices.

  ## Features

  - Email/password authentication with Supabase
  - Grocery items grouped by store
  - Recipe management with ingredient import

  ## Project setup

  1. Install dependencies:
     `npm install`

  2. Configure environment variables:
     Copy `.env.example` to `.env.local` and set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

  3. Create the database schema:
     Run the database/schema.sql from your Supabase setup (tables and RLS policies).

  4. Start the dev server:
     `npm run dev`

  
