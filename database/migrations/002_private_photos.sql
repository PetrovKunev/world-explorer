-- Частен bucket за снимките: досега всеки с URL-а виждаше снимката.
-- След миграцията четенето става само от собственика, през подписани
-- URL-и (приложението ги генерира само́). Изпълнете в Supabase SQL
-- Editor. Безопасно за повторно изпълнение.

update storage.buckets set public = false where id = 'photos';

drop policy if exists "Public read access for photos" on storage.objects;

drop policy if exists "Users can read own photos" on storage.objects;
create policy "Users can read own photos"
on storage.objects for select
using (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
