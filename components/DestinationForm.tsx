'use client'

import { useState } from 'react'
import { X, Star, Tag } from 'lucide-react'
import {
  Destination,
  DestinationInput,
  DestinationType,
  DESTINATION_TYPES,
  DESTINATION_TYPE_KEYS,
} from '@/types/destination'

interface DestinationFormProps {
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

export default function DestinationForm({ initialData, onSubmit, onCancel }: DestinationFormProps) {
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

  const [newTag, setNewTag] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const latitude = parseFloat(form.latitude)
    const longitude = parseFloat(form.longitude)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return
    }

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
      photos: initialData?.photos ?? [],
    })
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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Име <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
            placeholder="Въведете име на дестинацията"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Географска ширина <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={form.latitude}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
              placeholder="42.6977"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Географска дължина <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
              placeholder="23.3219"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Тип</label>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, type: e.target.value as DestinationType }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
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
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Посетена</span>
          </label>
        </div>

        {form.visited && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Дата на посещение
            </label>
            <input
              type="date"
              value={form.visit_date}
              onChange={(e) => setForm((prev) => ({ ...prev, visit_date: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Оценка (1–5)</label>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                aria-label={`Оценка ${star} от 5`}
                className={`rounded p-1.5 sm:p-1 ${
                  form.rating && form.rating >= star ? 'text-yellow-500' : 'text-gray-300'
                } transition-colors hover:text-yellow-500`}
              >
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
            {form.rating && (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, rating: null }))}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Изчисти
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Бележки</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
            placeholder="Добавете бележки за тази дестинация…"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Тагове</label>
          <div className="mb-2 flex flex-col items-stretch space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
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
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-700"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 p-0.5 text-gray-500 hover:text-gray-700"
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

      <div className="flex flex-col items-stretch justify-end space-y-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
        >
          Отказ
        </button>
        <button
          type="submit"
          className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700 sm:w-auto"
        >
          {initialData ? 'Запази' : 'Добави'}
        </button>
      </div>
    </form>
  )
}
