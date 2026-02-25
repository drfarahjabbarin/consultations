# Dr. Farah Jabbarin – Consultation App (Next.js + Supabase)

A minimalistic, responsive consultation web app:
- Doctor/user page: add 1+ patients, select ward, urgency, add notes, upload attachments, submit.
- Admin page: Supabase Auth login + list consultations ordered newest first, view patients + attachments, update status.

## 1) Install
```bash
npm install
```

## 2) Environment
This project already includes `.env.local` prefilled with your Supabase URL + anon key.
If you prefer, copy `.env.example` to `.env.local` and paste your keys.

## 3) Supabase: DB + RLS
Open Supabase → SQL Editor and run:

1) `supabase/schema.sql`
2) `supabase/policies.sql`

## 4) Supabase: Storage bucket
Create a bucket named `consultation-attachments` (Storage).
For MVP set it to **Public**.
See: `supabase/storage_setup.md`

## 5) Supabase: Create admin user
In Supabase → Authentication → Users:
- Click **Add user**
- Email: **dr.f.jabb@gmail.com**
- Password: **1234** *(recommended: change to a stronger password after testing)*

Then allow this user into the admin dashboard:
- Supabase → Table Editor → `admins` → **Insert row**
  - `user_id` = the UUID of **dr.f.jabb@gmail.com** from the Auth Users list

> Tip: you can also insert via SQL:
> `insert into public.admins (user_id) values ('<AUTH_USER_UUID>');`

## 6) Run
```bash
npm run dev
```

- Doctor/user page: http://localhost:3000
- Admin login: http://localhost:3000/admin/login
- Admin list: http://localhost:3000/admin

## Notes
- Public inserts are allowed by RLS so doctors can submit without login.
- Admin list is protected by Supabase Auth + `admins` allowlist.
