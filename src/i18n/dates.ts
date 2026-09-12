import type { Lang } from './translations'

const MONTHS = {
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
}

const WEEKDAYS = {
  tr: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
}

const WEEKDAYS_SHORT = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
}

function weekdayIndex(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getDay() === 0 ? 6 : date.getDay() - 1
}

export function weekdayName(iso: string, lang: Lang) {
  return WEEKDAYS[lang][weekdayIndex(iso)]
}

export function weekdayShort(iso: string, lang: Lang) {
  return WEEKDAYS_SHORT[lang][weekdayIndex(iso)]
}

export function shortDateLabel(iso: string, lang: Lang) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${date.getDate()} ${MONTHS[lang][date.getMonth()]}`
}

export function dateTimeName(ms: number, lang: Lang) {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ''
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${MONTHS[lang][date.getMonth()]} ${h}:${min}`
}
