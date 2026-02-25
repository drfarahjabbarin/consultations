# Storage setup (Supabase)

1) In Supabase Dashboard → Storage → Create bucket:
   - Name: consultation-attachments
   - Public bucket: ✅ (recommended for quick MVP)

2) If you want it PRIVATE:
   - Keep bucket private and create policies to allow:
     - anon insert (upload) for doctor page
     - authenticated admin select/read
   - Then change Admin page to use signed URLs instead of public URLs.

For MVP, public is simplest (admin can open attachments immediately).
