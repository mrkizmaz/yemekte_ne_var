const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export function isoDate(value = new Date()) {
  const d = new Date(value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number) {
  const d = parseIso(iso)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

export function weekStart(iso = isoDate()) {
  const d = parseIso(iso)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return isoDate(d)
}

export function weekDates(start: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function weekdayLabel(iso: string) {
  const d = parseIso(iso)
  const i = d.getDay() === 0 ? 6 : d.getDay() - 1
  return WEEKDAYS[i]
}

export function shortDate(iso: string) {
  const d = parseIso(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function dateTimeLabel(ms: number) {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${h}:${min}`
}

export function isPastDate(iso: string, today = isoDate()) {
  return iso < today
}

export function isPublishedDate(iso: string, publishedWeeks: string[] = []) {
  return publishedWeeks.includes(weekStart(iso))
}

export type DayView = 'dun' | 'bugun' | 'yarin' | 'hafta'

export const DAY_VIEWS: { id: DayView; label: string }[] = [
  { id: 'dun', label: 'Dün' },
  { id: 'bugun', label: 'Bugün' },
  { id: 'yarin', label: 'Yarın' },
  { id: 'hafta', label: 'Hafta' },
]
