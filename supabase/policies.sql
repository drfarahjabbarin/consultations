-- Run this after schema.sql

-- consultations: anyone can insert; only admins can read/update
drop policy if exists "consultations_insert_public" on public.consultations;
create policy "consultations_insert_public"
on public.consultations
for insert
to anon, authenticated
with check (true);

drop policy if exists "consultations_select_admin" on public.consultations;
create policy "consultations_select_admin"
on public.consultations
for select
to authenticated
using (public.is_admin());

drop policy if exists "consultations_update_admin" on public.consultations;
create policy "consultations_update_admin"
on public.consultations
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- patients: anyone can insert; only admins can read
drop policy if exists "patients_insert_public" on public.patients;
create policy "patients_insert_public"
on public.patients
for insert
to anon, authenticated
with check (true);

drop policy if exists "patients_select_admin" on public.patients;
create policy "patients_select_admin"
on public.patients
for select
to authenticated
using (public.is_admin());

-- attachments: anyone can insert metadata; only admins can read
drop policy if exists "attachments_insert_public" on public.attachments;
create policy "attachments_insert_public"
on public.attachments
for insert
to anon, authenticated
with check (true);

drop policy if exists "attachments_select_admin" on public.attachments;
create policy "attachments_select_admin"
on public.attachments
for select
to authenticated
using (public.is_admin());

-- admins table: only admins can read it; only admins can manage
drop policy if exists "admins_select_admin" on public.admins;
create policy "admins_select_admin"
on public.admins
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins_insert_admin" on public.admins;
create policy "admins_insert_admin"
on public.admins
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins_delete_admin" on public.admins;
create policy "admins_delete_admin"
on public.admins
for delete
to authenticated
using (public.is_admin());

