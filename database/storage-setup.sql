-- Настройка на Supabase Storage за снимки на дестинации
-- Изпълнете този скрипт в Supabase Dashboard → SQL Editor

-- 1. Частен bucket "photos" — четене само от собственика (приложението
--    показва снимките през подписани URL-и)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do update set public = false;

-- 2. Политики: всеки файл стои в папка с id-то на потребителя (<user_id>/<файл>)
-- Старата публична политика (от инсталации преди частния bucket) се маха —
-- иначе снимките остават четими за всички въпреки private=false
drop policy if exists "Public read access for photos" on storage.objects;

drop policy if exists "Users can read own photos" on storage.objects;
create policy "Users can read own photos"
on storage.objects for select
using (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can upload photos in own folder" on storage.objects;
create policy "Users can upload photos in own folder"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own photos" on storage.objects;
create policy "Users can delete own photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
