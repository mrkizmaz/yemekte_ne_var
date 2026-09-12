import { addDays, isoDate, weekDates, weekStart } from './dates.mjs'

export const mealTemplates = [
  {
    id: 'm1',
    slot: 'kahvalti',
    name: 'Menemen',
    description: 'Domates, biber ve yumurtanın sıcacık buluşması.',
    ingredients: 'Yumurta, domates, yeşil biber, soğan, zeytinyağı',
    emoji: '🍳',
    recipe:
      'Soğan ve biberi yağda yumuşat. Domatesleri ekle, suyunu çekene kadar pişir. Yumurtaları kır, karıştırarak pişir, tuzla servis et.',
  },
  {
    id: 'm2',
    slot: 'kahvalti',
    name: 'Simit & Peynir',
    description: 'Klasik Türk kahvaltısı: çıtır simit, beyaz peynir.',
    ingredients: 'Simit, beyaz peynir, çay, zeytin',
    emoji: '🥯',
    recipe: 'Simiti ısıt. Peynir ve zeytinle tabağa diz, yanında demli çayla servis et.',
  },
  {
    id: 'm3',
    slot: 'kahvalti',
    name: 'Yulaf Kasesi',
    description: 'Hafif ve tok tutan meyveli yulaf.',
    ingredients: 'Yulaf, süt, muz, bal, ceviz',
    emoji: '🥣',
    recipe: 'Yulafı sütle 5–6 dakika pişir veya bir gece beklet. Muz, bal ve cevizle tamamla.',
  },
  {
    id: 'm4',
    slot: 'ogle',
    name: 'Mercimek Çorbası',
    description: 'Limonlu, nane yağlı ev usulü çorba.',
    ingredients: 'Kırmızı mercimek, soğan, havuç, nane, limon',
    emoji: '🍲',
    recipe:
      'Soğan ve havucu kavur, mercimeği ekle, suyla yumuşayana kadar pişir. Blenderdan geçir, nane yağı ve limonla servis et.',
  },
  {
    id: 'm5',
    slot: 'ogle',
    name: 'Izgara Tavuk Salata',
    description: 'Protein dolu, ferah öğle tabağı.',
    ingredients: 'Tavuk göğsü, marul, salatalık, cherry, zeytinyağı',
    emoji: '🥗',
    recipe: 'Tavuğu ızgara et. Yeşillik, salatalık ve cherryle karıştır, zeytinyağı ve limon gezdir.',
  },
  {
    id: 'm6',
    slot: 'ogle',
    name: 'Kıymalı Pide',
    description: 'Fırından taze, doyurucu öğle arası.',
    ingredients: 'Hamur, kıyma, soğan, biber, kaşar',
    emoji: '🍕',
    recipe: 'Kıymayı soğan ve biberle harçla. Hamura yay, kaşar serp, fırında kızarana kadar pişir.',
  },
  {
    id: 'm7',
    slot: 'aksam',
    name: 'Fırın Somon',
    description: 'Limon ve dereotlu fırın somon, sebzelerle.',
    ingredients: 'Somon, brokoli, limon, dereotu, zeytinyağı',
    emoji: '🐟',
    recipe: 'Somona tuz, limon ve zeytinyağı sür. Brokoliyle 180°C fırında 15–18 dakika pişir, dereotu serp.',
  },
  {
    id: 'm8',
    slot: 'aksam',
    name: 'Karnıyarık',
    description: 'Ev yemeği sevenlere: kıymalı patlıcan.',
    ingredients: 'Patlıcan, kıyma, domates, soğan, sarımsak',
    emoji: '🍆',
    recipe:
      'Patlıcanları közle veya kızart. Kıymalı harcı içine doldur, domates sosu gezdir, fırında 20 dakika pişir.',
  },
  {
    id: 'm9',
    slot: 'aksam',
    name: 'Sebzeli Makarna',
    description: 'Hafif akşam için zeytinyağlı makarna.',
    ingredients: 'Makarna, kabak, biber, sarımsak, parmesan',
    emoji: '🍝',
    recipe: 'Makarnayı haşla. Kabak ve biberi sarımsakla sotele, makarnayla karıştır, parmesanla servis et.',
  },
]

export const ratings = [
  { id: 'r1', mealId: 'm1', userName: 'Ayşe', stars: 5 },
  { id: 'r2', mealId: 'm1', userName: 'Can', stars: 4 },
  { id: 'r3', mealId: 'm4', userName: 'Ayşe', stars: 5 },
  { id: 'r4', mealId: 'm7', userName: 'Mert', stars: 5 },
  { id: 'r5', mealId: 'm8', userName: 'Elif', stars: 4 },
]

export const mealVotes = [
  { id: 'mv1', mealId: 'm1', userName: 'ayse', value: 'like' },
  { id: 'mv2', mealId: 'm1', userName: 'can', value: 'like' },
  { id: 'mv3', mealId: 'm4', userName: 'can', value: 'dislike' },
  { id: 'mv4', mealId: 'm2', userName: 'elif', value: 'like' },
  { id: 'mv5', mealId: 'm5', userName: 'ayse', value: 'like' },
]

export const comments = [
  {
    id: 'c1',
    mealId: 'm1',
    userName: 'Ayşe',
    text: 'Tam kıvamında, biraz acı olsaydı 10/10.',
    createdAt: Date.now() - 86_400_000,
  },
  {
    id: 'c2',
    mealId: 'm4',
    userName: 'Can',
    text: 'Limonu bol olunca harika.',
    createdAt: Date.now() - 43_200_000,
  },
]

export const suggestions = [
  {
    id: 's1',
    userName: 'elif',
    slot: 'ogle',
    text: 'Ev yapımı lahmacun',
    createdAt: Date.now() - 20_000_000,
    status: 'yeni',
    votes: { ayse: 'like', can: 'like', mert: 'dislike' },
  },
  {
    id: 's2',
    userName: 'can',
    slot: 'aksam',
    text: 'Mantı',
    createdAt: Date.now() - 12_000_000,
    status: 'yeni',
    votes: { elif: 'like', ayse: 'like', mert: 'like' },
  },
  {
    id: 's3',
    userName: 'ayse',
    slot: 'kahvalti',
    text: 'Sucuklu yumurta',
    createdAt: Date.now() - 8_000_000,
    status: 'yeni',
    votes: { can: 'like' },
  },
]

export function buildMeals() {
  const today = isoDate()
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)
  const dated = [
    { ...mealTemplates[0], date: yesterday },
    { ...mealTemplates[3], date: yesterday },
    { ...mealTemplates[6], date: yesterday },
    { ...mealTemplates[1], date: today },
    { ...mealTemplates[4], date: today },
    { ...mealTemplates[7], date: today },
    { ...mealTemplates[2], date: tomorrow },
    { ...mealTemplates[5], date: tomorrow },
    { ...mealTemplates[8], date: tomorrow },
  ]
  const extras = []
  for (const date of weekDates(weekStart(today))) {
    if (date === today || date === yesterday || date === tomorrow) continue
    const shift = parseInt(date.slice(-2), 10) % 3
    extras.push({
      ...mealTemplates[shift],
      id: `${mealTemplates[shift].id}-${date}-k`,
      date,
    })
    extras.push({
      ...mealTemplates[3 + shift],
      id: `${mealTemplates[3 + shift].id}-${date}-o`,
      date,
    })
    extras.push({
      ...mealTemplates[6 + shift],
      id: `${mealTemplates[6 + shift].id}-${date}-a`,
      date,
    })
  }
  return [...dated, ...extras]
}

export function publishedWeeksForSeed() {
  const today = isoDate()
  return [...new Set([weekStart(addDays(today, -1)), weekStart(today), weekStart(addDays(today, 1))])]
}
