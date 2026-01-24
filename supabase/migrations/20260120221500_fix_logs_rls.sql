
-- Allow authenticated users to insert generation logs
alter table "public"."generation_logs" enable row level security;

create policy "Enable insert for authenticated users only"
on "public"."generation_logs"
as permissive
for insert
to authenticated
with check (true);

create policy "Enable select for users based on book ownership"
on "public"."generation_logs"
as permissive
for select
to authenticated
using (
  exists (
    select 1 from books
    where books.id = generation_logs.book_id
    and books.user_id = auth.uid()
  )
);
