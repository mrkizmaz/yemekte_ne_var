const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export function isoDate(value = new Date()) {
  const d = new Date(value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso, days) {
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

export function weekDates(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function weekdayLabel(iso) {
  const d = parseIso(iso)
  const i = d.getDay() === 0 ? 6 : d.getDay() - 1
  return WEEKDAYS[i]
}

export function shortDate(iso) {
  const d = parseIso(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function isPastDate(iso, today = isoDate()) {
  return iso < today
}

export function isPublishedDate(iso, publishedWeeks = []) {
  return publishedWeeks.includes(weekStart(iso))
}
