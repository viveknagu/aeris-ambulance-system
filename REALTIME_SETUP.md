# Arogya Kavacha 108 — SOS → Control Room Realtime

This upgrade uses Supabase Postgres + Realtime. Supabase's current client-side key is the **publishable key** (`sb_publishable_...`). Never put a secret/service-role key in the browser.

## 1. Create/connect Supabase

Create a Supabase project, then open the project's **Connect** dialog or **Settings → API Keys** and copy:

- Project URL
- Publishable key

## 2. Create the database table

Open **SQL Editor**, paste the contents of `supabase_schema.sql`, and run it. The SQL enables RLS, creates prototype policies, and adds `emergency_requests` to `supabase_realtime`.

## 3. Add environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

## 4. Install and run

```bash
npm install
npm run dev
```

## 5. Test the realtime flow

1. Open the patient app in one browser tab.
2. Open `/control-room` in another tab.
3. Lock GPS and raise SOS.
4. The emergency row is inserted into Supabase.
5. The control-room tab receives the request through Supabase Realtime.
6. Changing a dispatch status in the control room writes the row back to Supabase, and the patient tab receives the update.

### Important

The current policies are intentionally permissive for prototype testing. Before public deployment, connect Supabase Auth and replace the prototype RLS policies with user/dispatcher-specific policies.
