-- Настройка на Supabase Storage за снимки на дестинации
-- Изпълнете този скрипт в Supabase Dashboard → SQL Editor

-- 1. Публичен bucket "photos" (публично четене, качване само в собствената папка)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- 2. Политики: всеки файл стои в папка с id-то на потребителя (<user_id>/<файл>)
create policy "Public read access for photos"
on storage.objects for select
using (bucket_id = 'photos');

create policy "Users can upload photos in own folder"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
