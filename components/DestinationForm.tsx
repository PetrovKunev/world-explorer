'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Star, Tag, ImagePlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toaster'
import { PHOTOS_BUCKET, MAX_PHOTOS, MAX_PHOTO_SIZE_MB, photoStoragePath } from '@/lib/photos'
import {
  Destination,
  DestinationInput,
  DestinationType,
  DESTINATION_TYPES,
  DESTINATION_TYPE_KEYS,
} from '@/types/destination'

interface DestinationFormProps {
  userId: string
  initialData?: Destination
  onSubmit: (data: DestinationInput) => void
  onCancel: () => void
}

interface FormState {
  name: string
  latitude: string
  longitude: string
  type: DestinationType
  visited: boolean
  visit_date: string
  notes: string
  rating: number | null
  tags: string[]
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400'

const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export default function DestinationForm({
  userId,
  initialData,
  onSubmit,
  onCancel,
}: DestinationFormProps) {
  const supabase = useMemo(() => createClient(), [])
  const showToast = useToast()

  const [form, setForm] = useState<FormState>({
    name: initialData?.name ?? '',
    latitude: initialData ? String(initialData.latitude) : '',
    longitude: initialData ? String(initialData.longitude) : '',
    type: initialData?.type ?? 'other',
    visited: initialData?.visited ?? false,
    visit_date: initialData?.visit_date ?? '',
    notes: initialData?.notes ?? '',
    rating: initialData?.rating ?? null,
    tags: initialData?.tags ?? [],
  })

  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [newTag, setNewTag] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Качени в тази сесия на формата — трият се от Storage при отказ
  const uploadedThisSessionRef = useRef<string[]>([])

  const removeFromStorage = (urls: string[]) => {
    const paths = urls
      .map(photoStoragePath)
      .filter((path): path is string => path !== null)
    if (paths.length > 0) {
      void supabase.storage.from(PHOTOS_BUCKET).remove(paths)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    let count = photos.length

    for (const file of Array.from(files)) {
      if (count >= MAX_PHOTOS) {
        showToast('error', `Най-много ${MAX_PHOTOS} снимки на дестинация`)
        break
      }
      if (!file.type.startsWith('image/')) {
        showToast('error', `„${file.name}“ не е изображение`)
        continue
      }
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        showToast('error', `„${file.name}“ е над ${MAX_PHOTO_SIZE_MB} MB`)
        continue
      }

      const ext =
        (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file, { cacheControl: '3600' })

      if (error) {
        showToast('error', `„${file.name}“ не можа да бъде качена`)
        continue
      }

      const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)
      uploadedThisSessionRef.current.push(data.publicUrl)
      setPhotos((prev) => [...prev, data.publicUrl])
      count += 1
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (url: string) => {
    setPhotos((prev) => prev.filter((photo) => photo !== url))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const latitude = parseFloat(form.latitude)
    const longitude = parseFloat(form.longitude)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return
    }

    // Премахнати снимки (спрямо началното състояние) се изтриват от Storage
    const removed = (initialData?.photos ?? [])
      .concat(uploadedThisSessionRef.current)
      .filter((url) => !photos.includes(url))
    removeFromStorage(removed)

    onSubmit({
      name: form.name.trim(),
      latitude,
      longitude,
      type: form.type,
      visited: form.visited,
      // Ако дестинацията не е посетена, датата се изчиства
      visit_date: form.visited && form.visit_date ? form.visit_date : null,
      notes: form.notes.trim() || null,
      rating: form.rating,
      tags: form.tags,
      photos,
    })
  }

  const handleCancel = () => {
    // При отказ новокачените снимки се изтриват от Storage
    removeFromStorage(uploadedThisSessionRef.current)
    uploadedThisSessionRef.current = []
    onCancel()
  }

  const addTag = () => {
    const tag = newTag.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className={labelClass}>
            Име <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            placeholder="Въведете име на дестинацията"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Географска ширина <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={form.latitude}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
              className={inputClass}
              placeholder="42.6977"
            />
          </div>
          <div>
            <label className={labelClass}>
              Географска дължина <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              className={inputClass}
              placeholder="23.3219"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Тип</label>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, type: e.target.value as DestinationType }))
            }
            className={inputClass}
          >
            {DESTINATION_TYPE_KEYS.map((type) => (
              <option key={type} value={type}>
                {DESTINATION_TYPES[type].emoji} {DESTINATION_TYPES[type].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.visited}
              onChange={(e) => setForm((prev) => ({ ...prev, visited: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Посетена</span>
          </label>
        </div>

        {form.visited && (
          <div>
            <label className={labelClass}>Дата на посещение</label>
            <input
              type="date"
              value={form.visit_date}
              onChange={(e) => setForm((prev) => ({ ...prev, visit_date: e.target.value }))}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>Оценка (1–5)</label>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                aria-label={`Оценка ${star} от 5`}
                className={`rounded p-1.5 sm:p-1 ${
                  form.rating && form.rating >= star
                    ? 'text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                } transition-colors hover:text-yellow-500`}
              >
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
            {form.rating && (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, rating: null }))}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Изчисти
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Снимки</label>
          <div className="flex flex-wrap gap-2">
            {photos.map((url) => (
              <div key={url} className="group relative h-16 w-24 overflow-hidden rounded-lg">
                <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  aria-label="Премахни снимката"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-16 w-24 flex-col items-center justify-center space-y-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-primary-500 hover:text-primary-500 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-500"
                aria-label="Добави снимка"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px]">Добави</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            До {MAX_PHOTOS} снимки, максимум {MAX_PHOTO_SIZE_MB} MB всяка
          </p>
        </div>

        <div>
          <label className={labelClass}>Бележки</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className={inputClass}
            placeholder="Добавете бележки за тази дестинация…"
          />
        </div>

        <div>
          <label className={labelClass}>Тагове</label>
          <div className="mb-2 flex flex-col items-stretch space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className={`flex-1 ${inputClass}`}
              placeholder="Добавете таг…"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white transition-colors hover:bg-primary-700"
            >
              Добави
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 p-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={`Премахни тага ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-end space-y-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0 dark:border-gray-700">
        <button
          type="button"
          onClick={handleCancel}
          className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Отказ
        </button>
        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {initialData ? 'Запази' : 'Добави'}
        </button>
      </div>
    </form>
  )
}
