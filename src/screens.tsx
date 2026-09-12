import { createElement, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  DAY_VIEWS,
  addDays,
  dateTimeLabel,
  isoDate,
  isPastDate,
  isPublishedDate,
  shortDate,
  weekDates,
  weekStart,
  weekdayLabel,
  type DayView,
} from './dates'
import { useStore } from './store'
import { colors, slotBar } from './theme'
import { SLOTS, likesOf, dislikesOf, slotOf, type Meal, type MealSlot } from './types'
import {
  Brand,
  Card,
  DangerButton,
  Field,
  GhostButton,
  Pill,
  PrimaryButton,
  SlotPicker,
  ThumbDown,
  ThumbUp,
  styles as ui,
} from './ui'

function sendVote(action: () => Promise<void>) {
  void action().catch((err) => {
    Alert.alert('Oy kaydedilemedi', err instanceof Error ? err.message : 'Tekrar dene.')
  })
}

function VoteButton({
  label,
  locked,
  active,
  onPress,
  children,
}: {
  label: string
  locked: boolean
  active?: boolean
  onPress: () => void
  children: ReactNode
}) {
  const handle = () => {
    if (locked) {
      Alert.alert('Kilitli', 'Geçmiş menü yalnızca görüntülenir.')
      return
    }
    onPress()
  }

  if (Platform.OS === 'web') {
    return createElement(
      'button',
      {
        type: 'button',
        onClick: handle,
        'aria-label': label,
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '6px',
          background: active ? (label === 'Beğen' ? '#d7ebe2' : '#f3d6d0') : '#fff',
          borderRadius: 14,
          padding: '8px 10px',
          minWidth: 52,
          border: '1px solid #eadfd2',
          cursor: 'pointer',
          font: 'inherit',
        },
      },
      children,
    )
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handle}
      style={[ui.vote, active && (label === 'Beğen' ? ui.voteOnLike : ui.voteOnDislike)]}
    >
      {children}
    </Pressable>
  )
}

export function MealVotes({ mealId, locked }: { mealId: string; locked: boolean }) {
  const { mealVotes, userName, voteMeal } = useStore()
  const mine = mealVotes.find((v) => v.mealId === mealId && v.userName === userName)?.value
  const likes = mealVotes.filter((v) => v.mealId === mealId && v.value === 'like').length
  const dislikes = mealVotes.filter((v) => v.mealId === mealId && v.value === 'dislike').length

  return (
    <View style={local.voteRow}>
      <VoteButton
        label="Beğen"
        locked={locked}
        active={mine === 'like'}
        onPress={() => sendVote(() => voteMeal(mealId, 'like'))}
      >
        <ThumbUp size={16} />
        <Text pointerEvents="none" style={ui.voteCount}>
          {likes}
        </Text>
      </VoteButton>
      <VoteButton
        label="Beğenme"
        locked={locked}
        active={mine === 'dislike'}
        onPress={() => sendVote(() => voteMeal(mealId, 'dislike'))}
      >
        <ThumbDown size={16} />
        <Text pointerEvents="none" style={ui.voteCount}>
          {dislikes}
        </Text>
      </VoteButton>
    </View>
  )
}

export function Welcome() {
  const { loginUser, registerUser } = useStore()
  const [screen, setScreen] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegister = screen === 'register'

  return (
    <ScrollView contentContainerStyle={local.welcome} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center' }}>
        <View style={local.logoWrap}>
          <Image
            source={require('./assets/seyyid-kamil-logo.jpg')}
            style={local.logo}
            resizeMode="contain"
            accessibilityLabel="Seyyid Kamil Talebe Yurdu"
          />
        </View>
        <Brand size={36}>Bugün ne var?</Brand>
        <Text style={[ui.muted, { marginTop: 10, textAlign: 'center' }]}>
          Seyyid Kamil Talebe Yurdu menüsü. Kullanıcı adı ve şifre yeterli.
        </Text>
      </View>
      <View>
        <Field
          label="Kullanıcı adı"
          value={username}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          onChangeText={(v) => {
            setUsername(v)
            setError('')
          }}
          placeholder="Kullanıcı adı"
        />
        <Field
          label="Şifre"
          value={password}
          secureTextEntry
          autoComplete={isRegister ? 'new-password' : 'password'}
          onChangeText={(v) => {
            setPassword(v)
            setError('')
          }}
          placeholder={isRegister ? 'En az 6 karakter' : 'Şifre'}
        />
        {error ? <Text style={ui.error}>{error}</Text> : null}
        <View style={{ height: 12 }} />
        <PrimaryButton
          title={busy ? 'Bekle...' : isRegister ? 'Kayıt ol' : 'Giriş yap'}
          disabled={busy}
          onPress={() => {
            void (async () => {
              setBusy(true)
              setError('')
              try {
                const err = isRegister
                  ? await registerUser(username, password)
                  : await loginUser(username, password)
                if (err) setError(err)
              } finally {
                setBusy(false)
              }
            })()
          }}
        />
        <Pressable
          onPress={() => {
            setScreen(isRegister ? 'login' : 'register')
            setError('')
          }}
        >
          <Text style={local.authSwitch}>
            {isRegister ? 'Hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

export function Home({
  dayView,
  setDayView,
  onOpen,
}: {
  dayView: DayView
  setDayView: (d: DayView) => void
  onOpen: (id: string) => void
}) {
  const { meals, userName, publishedWeeks } = useStore()
  const today = isoDate()
  const [openDay, setOpenDay] = useState(today)
  const focusDate =
    dayView === 'dun' ? addDays(today, -1) : dayView === 'yarin' ? addDays(today, 1) : today
  const week = weekDates(weekStart(today))
  const locked = dayView === 'dun'
  const hello =
    dayView === 'hafta'
      ? `Merhaba ${userName}, haftalık menü.`
      : dayView === 'dun'
        ? `Merhaba ${userName}, dünün menüsü yalnızca görüntülenir.`
        : dayView === 'yarin'
          ? `Merhaba ${userName}, yarının menüsü hazır.`
          : `Merhaba ${userName}, günün menüsü hazır.`

  return (
    <>
      <View style={ui.topbar}>
        <View style={{ flex: 1 }}>
          <Brand>Ne Var?</Brand>
          <Text style={ui.sub}>{hello}</Text>
        </View>
      </View>
      <View style={local.dayNav}>
        <View style={local.dayNavLeft}>
          {DAY_VIEWS.filter((d) => d.id !== 'hafta').map((d) => (
            <Pill key={d.id} label={d.label} on={dayView === d.id} onPress={() => setDayView(d.id)} />
          ))}
        </View>
        {DAY_VIEWS.filter((d) => d.id === 'hafta').map((d) => (
          <Pill key={d.id} label={d.label} on={dayView === d.id} onPress={() => setDayView(d.id)} />
        ))}
      </View>
      {dayView === 'hafta'
        ? week.map((date) => {
            const dayMeals = meals
              .filter((m) => m.date === date)
              .sort(
                (a, b) =>
                  SLOTS.findIndex((s) => s.id === a.slot) - SLOTS.findIndex((s) => s.id === b.slot),
              )
            const past = isPastDate(date)
            const live = isPublishedDate(date, publishedWeeks)
            const open = openDay === date
            return (
              <Card key={date}>
                <Pressable onPress={() => setOpenDay(open ? '' : date)} style={local.accHead}>
                  <View>
                    <Text style={local.h3}>
                      {weekdayLabel(date)} · {shortDate(date)}
                    </Text>
                    <Text style={ui.muted}>
                      {!live ? 'Henüz yayınlanmadı' : past ? 'Yalnızca görüntüleme' : `${dayMeals.length} yemek`}
                    </Text>
                  </View>
                  <Text style={local.chev}>{open ? '▴' : '▾'}</Text>
                </Pressable>
                {open ? (
                  <View style={local.accBody}>
                    {!live ? <Text style={ui.muted}>Bu hafta henüz yayınlanmadı.</Text> : null}
                    {live && dayMeals.length === 0 ? <Text style={ui.muted}>Bu güne yemek yok.</Text> : null}
                    {live
                      ? dayMeals.map((meal) => (
                          <View key={meal.id} style={local.weekLine}>
                            <View style={{ flex: 1 }}>
                              <Text style={local.h3}>{meal.name}</Text>
                              <Text style={ui.muted}>
                                {slotOf(meal.slot).icon} {slotOf(meal.slot).label}
                              </Text>
                            </View>
                            <MealVotes mealId={meal.id} locked={past} />
                          </View>
                        ))
                      : null}
                  </View>
                ) : null}
              </Card>
            )
          })
        : SLOTS.map((s) => {
            const dayMeals = meals.filter((m) => m.slot === s.id && m.date === focusDate)
            return (
              <Card key={s.id} style={{ padding: 12 }}>
                <View style={[local.slotBar, { backgroundColor: slotBar[s.id] }]}>
                  <Text style={local.slotBarIco}>{s.icon}</Text>
                  <Text style={local.slotBarStrong}>{s.label}</Text>
                  <Text style={local.slotBarSmall}>{s.hint}</Text>
                </View>
                {dayMeals.length === 0 ? (
                  <Text style={[ui.muted, { marginTop: 6 }]}>Bu öğün için yemek yok.</Text>
                ) : (
                  dayMeals.map((meal) => (
                    <View key={meal.id} style={local.mealBlock}>
                      <View style={local.mealItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={local.h3}>{meal.name}</Text>
                          <Text style={ui.muted}>{meal.description}</Text>
                        </View>
                        <Pressable onPress={() => onOpen(meal.id)} style={local.commentOpen}>
                          <Text style={local.commentOpenText}>{locked ? 'Yorumlar' : 'Detay'}</Text>
                        </Pressable>
                      </View>
                      <MealVotes mealId={meal.id} locked={locked} />
                    </View>
                  ))
                )}
              </Card>
            )
          })}
    </>
  )
}

export function MealDetail({ mealId, onBack }: { mealId: string; onBack: () => void }) {
  const { meals, commentsFor, addComment } = useStore()
  const meal = meals.find((m) => m.id === mealId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  if (!meal) {
    return <GhostButton title="Geri" onPress={onBack} />
  }

  const comments = commentsFor(meal.id)
  const slot = slotOf(meal.slot)
  const interactive = !isPastDate(meal.date)

  return (
    <>
      <View style={[ui.topbar, { alignItems: 'center' }]}>
        <Pressable onPress={onBack} style={ui.back}>
          <Text>←</Text>
        </Pressable>
        <Text style={ui.badge}>{slot.label}</Text>
        <Text style={ui.badge}>{shortDate(meal.date)}</Text>
      </View>
      <Brand>{meal.name}</Brand>
      <Text style={[ui.muted, { marginBottom: 14 }]}>{meal.description}</Text>
      <Card>
        <Text style={ui.muted}>
          <Text style={{ fontWeight: '700', color: colors.ink }}>Malzemeler: </Text>
          {meal.ingredients}
        </Text>
      </Card>
      <Card>
        <Text style={local.h3}>Oyunu ver</Text>
        <Text style={ui.muted}>
          {interactive ? 'Bu yemeği beğen veya beğenme.' : 'Geçmiş gün kilitli. Oylar yalnızca görüntülenir.'}
        </Text>
        <View style={{ height: 8 }} />
        <MealVotes mealId={meal.id} locked={!interactive} />
      </Card>
      <Card>
        <Text style={local.h3}>Yorumlar</Text>
        {comments.length === 0 ? (
          <Text style={ui.muted}>{interactive ? 'İlk yorumu sen yaz.' : 'Bu güne yorum yok.'}</Text>
        ) : null}
        {comments.map((c) => (
          <View key={c.id} style={local.comment}>
            <View style={local.commentHead}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>{c.userName}</Text>
              {c.createdAt ? <Text style={ui.muted}>{dateTimeLabel(c.createdAt)}</Text> : null}
            </View>
            <Text style={ui.muted}>{c.text}</Text>
          </View>
        ))}
        {interactive ? (
          <>
            <Field
              label="Yorum ekle"
              value={text}
              multiline
              onChangeText={setText}
              placeholder="Tadı, porsiyon, önerin..."
            />
            <View style={{ height: 10 }} />
            <PrimaryButton
              title={sending ? 'Gönderiliyor...' : 'Gönder'}
              disabled={sending || !text.trim()}
              onPress={() => {
                const trimmed = text.trim()
                if (!trimmed || sending) return
                setSending(true)
                void addComment(meal.id, trimmed)
                  .then(() => setText(''))
                  .catch(() => undefined)
                  .finally(() => setSending(false))
              }}
            />
          </>
        ) : null}
      </Card>
    </>
  )
}

export function AdminMealInfo({ mealId, onBack }: { mealId: string; onBack: () => void }) {
  const { meals } = useStore()
  const meal = meals.find((m) => m.id === mealId)
  if (!meal) return <GhostButton title="Geri" onPress={onBack} />
  const slot = slotOf(meal.slot)

  return (
    <>
      <View style={[ui.topbar, { alignItems: 'center' }]}>
        <Pressable onPress={onBack} style={ui.back}>
          <Text>←</Text>
        </Pressable>
        <Text style={ui.badge}>{slot.label}</Text>
        <Text style={ui.badge}>{shortDate(meal.date)}</Text>
      </View>
      <Brand>{meal.name}</Brand>
      <Text style={[ui.muted, { marginBottom: 14 }]}>{meal.description}</Text>
      <Card>
        <Text style={local.h3}>Malzemeler</Text>
        <Text style={ui.muted}>{meal.ingredients || 'Eklenmemiş.'}</Text>
      </Card>
      <Card>
        <Text style={local.h3}>Yapılışı</Text>
        <Text style={[ui.muted, { lineHeight: 22 }]}>{meal.recipe || 'Yapılış henüz yazılmamış.'}</Text>
      </Card>
    </>
  )
}

export function Suggest() {
  const { addSuggestion, voteSuggestion, suggestions, userName } = useStore()
  const [slot, setSlot] = useState<MealSlot>('ogle')
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const ranked = [...suggestions].sort((a, b) => {
    const likeDiff = likesOf(b) - likesOf(a)
    if (likeDiff !== 0) return likeDiff
    return dislikesOf(a) - dislikesOf(b)
  })

  function closeModal() {
    setOpen(false)
    setText('')
    setSlot('ogle')
  }

  return (
    <>
      <View style={ui.topbar}>
        <View style={{ flex: 1 }}>
          <Brand>Öneriler</Brand>
          <Text style={ui.sub}>Kullanıcıların önerdiği yemekler, beğeni sırasıyla.</Text>
        </View>
        <Pressable onPress={() => setOpen(true)} style={local.addBtn}>
          <Text style={local.addBtnText}>Yemek öner</Text>
        </Pressable>
      </View>
      {ranked.length === 0 ? (
        <Text style={ui.empty}>Henüz önerilen yemek yok. İlkini sen ekle.</Text>
      ) : (
        ranked.map((s) => {
          const mine = s.votes?.[userName]
          return (
            <Card key={s.id}>
              <View style={local.mealRow}>
                <Text style={{ fontSize: 28 }}>{slotOf(s.slot).icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={local.h3}>{s.text}</Text>
                  <Text style={ui.muted}>
                    {slotOf(s.slot).label} · {s.userName}
                  </Text>
                </View>
              </View>
              <View style={local.voteRow}>
                <VoteButton
                  label="Beğen"
                  locked={false}
                  active={mine === 'like'}
                  onPress={() => sendVote(() => voteSuggestion(s.id, 'like'))}
                >
                  <ThumbUp />
                  <Text pointerEvents="none" style={ui.voteCount}>
                    {likesOf(s)}
                  </Text>
                </VoteButton>
                <VoteButton
                  label="Beğenme"
                  locked={false}
                  active={mine === 'dislike'}
                  onPress={() => sendVote(() => voteSuggestion(s.id, 'dislike'))}
                >
                  <ThumbDown />
                  <Text pointerEvents="none" style={ui.voteCount}>
                    {dislikesOf(s)}
                  </Text>
                </VoteButton>
              </View>
            </Card>
          )
        })
      )}
      <Modal visible={open} animationType="slide" onRequestClose={closeModal}>
        <View style={[ui.screen, ui.screenPad, { paddingTop: 56 }]}>
          <View style={[ui.topbar, { alignItems: 'center' }]}>
            <Pressable onPress={closeModal} style={ui.back}>
              <Text>←</Text>
            </Pressable>
            <Brand size={22}>Yemek öner</Brand>
          </View>
          <Text style={ui.muted}>Menüde olmasını istediğin yemeği yaz. Herkes beğenebilir.</Text>
          <Text style={[ui.fieldLabel, { marginTop: 18 }]}>Öğün</Text>
          <View style={{ height: 8 }} />
          <SlotPicker value={slot} onChange={setSlot} />
          <Field label="Yemek adı" value={text} onChangeText={setText} placeholder="Örn. Mantı" />
          <View style={{ height: 16 }} />
          <PrimaryButton
            title="Öneriyi gönder"
            onPress={() => {
              if (!text.trim()) return
              void addSuggestion(slot, text.trim())
                .then(closeModal)
                .catch(() => undefined)
            }}
          />
        </View>
      </Modal>
    </>
  )
}

const emptyForm = {
  name: '',
  description: '',
  ingredients: '',
  emoji: '🍽️',
  recipe: '',
  slot: 'ogle' as MealSlot,
  date: isoDate(),
}

export function AdminSuggestions() {
  const { suggestions, markSuggestion, deleteSuggestion } = useStore()
  const fresh = suggestions.filter((s) => s.status === 'yeni')

  return (
    <>
      <View style={ui.topbar}>
        <View style={{ flex: 1 }}>
          <Brand>Öneriler</Brand>
          <Text style={ui.sub}>Kullanıcıların gönderdiği yemek önerileri.</Text>
        </View>
        {fresh.length > 0 ? <Text style={ui.badge}>{fresh.length} yeni</Text> : null}
      </View>
      {suggestions.length === 0 ? (
        <Text style={ui.empty}>Henüz öneri yok.</Text>
      ) : (
        suggestions.map((s) => (
          <Card key={s.id}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>
              {s.userName} · {SLOTS.find((x) => x.id === s.slot)?.label} · {likesOf(s)} beğeni
            </Text>
            <Text style={ui.muted}>{s.text}</Text>
            <View style={ui.row}>
              {s.status === 'yeni' ? (
                <GhostButton title="İncelendi" onPress={() => void markSuggestion(s.id)} />
              ) : null}
              <DangerButton title="Sil" onPress={() => void deleteSuggestion(s.id)} />
            </View>
          </Card>
        ))
      )}
    </>
  )
}

export function AdminPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const { meals, addMeal, updateMeal, deleteMeal, publishedWeeks, publishWeek } = useStore()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [slotFilter, setSlotFilter] = useState<MealSlot>('kahvalti')
  const [week, setWeek] = useState(() => weekStart())
  const [selectedDate, setSelectedDate] = useState(() => isoDate())
  const days = weekDates(week)
  const live = publishedWeeks.includes(week)
  const today = isoDate()

  function goWeek(delta: number) {
    const next = addDays(week, delta)
    setWeek(next)
    const nextDays = weekDates(next)
    if (!nextDays.includes(selectedDate)) {
      const pick = nextDays.includes(today) ? today : next
      setSelectedDate(pick)
      setForm((f) => ({ ...f, date: pick }))
    }
  }

  function startEdit(meal: Meal) {
    setEditingId(meal.id)
    setForm({
      name: meal.name,
      description: meal.description,
      ingredients: meal.ingredients,
      emoji: meal.emoji,
      recipe: meal.recipe || '',
      slot: meal.slot,
      date: meal.date,
    })
    setSelectedDate(meal.date)
    setWeek(weekStart(meal.date))
  }

  async function submit() {
    if (!form.name.trim()) return
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      ingredients: form.ingredients.trim(),
      recipe: form.recipe.trim(),
      date: form.date || selectedDate,
    }
    try {
      if (editingId) {
        await updateMeal({ ...payload, id: editingId })
      } else {
        await addMeal(payload)
      }
      setSlotFilter(payload.slot)
      setSelectedDate(payload.date)
      setEditingId(null)
      setForm({ ...emptyForm, slot: payload.slot, date: payload.date })
    } catch {
      // Formu koru
    }
  }

  const list = meals.filter((m) => m.slot === slotFilter && m.date === selectedDate)

  return (
    <>
      <View style={ui.topbar}>
        <View>
          <Brand>Haftalık menü</Brand>
          <Text style={ui.sub}>Menüyü hazırla ve yayınla.</Text>
        </View>
      </View>
      <Card>
        <View style={local.weekNav}>
          <GhostButton title="←" onPress={() => goWeek(-7)} />
          <Text style={{ fontWeight: '700', color: colors.ink }}>
            {shortDate(week)} – {shortDate(addDays(week, 6))}
          </Text>
          <GhostButton title="→" onPress={() => goWeek(7)} />
        </View>
        <Text style={ui.muted}>{live ? 'Bu hafta yayınlandı.' : 'Bu hafta henüz yayınlanmadı.'}</Text>
        <View style={{ height: 10 }} />
        {live ? (
          <GhostButton title="Yayından kaldır" onPress={() => void publishWeek(week, false)} />
        ) : (
          <PrimaryButton title="Haftayı yayınla" onPress={() => void publishWeek(week, true)} />
        )}
      </Card>
      <View style={local.seven}>
        {days.map((date) => {
          const on = selectedDate === date
          const tone = isPastDate(date) ? 'past' : date === today ? 'today' : 'future'
          return (
            <Pressable
              key={date}
              onPress={() => {
                setSelectedDate(date)
                setForm((f) => ({ ...f, date }))
              }}
              style={[local.day, local[tone], on && local[`${tone}On` as const]]}
            >
              <Text style={[local.dayText, on && { color: '#fff' }]}>{weekdayLabel(date).slice(0, 3)}</Text>
              <Text style={[local.daySmall, on && { color: '#fff' }]}>{shortDate(date)}</Text>
            </Pressable>
          )
        })}
      </View>
      <Card>
        <Text style={local.h3}>{editingId ? 'Yemeği düzenle' : 'Yeni yemek'}</Text>
        <Text style={[ui.fieldLabel, { marginTop: 12 }]}>Öğün</Text>
        <View style={{ height: 8 }} />
        <SlotPicker value={form.slot} onChange={(slot) => setForm({ ...form, slot })} />
        <Field
          label="Yemek adı"
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
          placeholder="Örn. İçli köfte"
        />
        <Field
          label="Kısa açıklama"
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
        />
        <Field
          label="Malzemeler"
          value={form.ingredients}
          onChangeText={(ingredients) => setForm({ ...form, ingredients })}
        />
        <Field
          label="Yapılışı"
          value={form.recipe}
          multiline
          onChangeText={(recipe) => setForm({ ...form, recipe })}
          placeholder="Adım adım nasıl hazırlanır..."
        />
        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title={editingId ? 'Kaydet' : 'Listeye ekle'} onPress={() => void submit()} />
          </View>
          {editingId ? (
            <View style={{ flex: 1 }}>
              <GhostButton
                title="Vazgeç"
                onPress={() => {
                  setEditingId(null)
                  setForm({ ...emptyForm, date: selectedDate })
                }}
              />
            </View>
          ) : null}
        </View>
      </Card>
      <SlotPicker
        value={slotFilter}
        onChange={setSlotFilter}
        counts={{
          kahvalti: meals.filter((m) => m.slot === 'kahvalti' && m.date === selectedDate).length,
          ogle: meals.filter((m) => m.slot === 'ogle' && m.date === selectedDate).length,
          aksam: meals.filter((m) => m.slot === 'aksam' && m.date === selectedDate).length,
        }}
      />
      {list.map((meal) => (
        <Card key={meal.id}>
          <Pressable onPress={() => onOpen(meal.id)}>
            <Text style={local.h3}>{meal.name}</Text>
            <Text style={ui.muted}>{meal.description}</Text>
          </Pressable>
          <View style={ui.row}>
            <GhostButton title="Düzenle" onPress={() => startEdit(meal)} />
            <DangerButton title="Sil" onPress={() => void deleteMeal(meal.id)} />
          </View>
        </Card>
      ))}
    </>
  )
}

function votedMeals(
  votes: { mealId: string; userName: string; value: string }[],
  meals: Meal[],
  who: string,
  value: 'like' | 'dislike',
) {
  return votes
    .filter((v) => v.userName === who && v.value === value)
    .map((v) => meals.find((m) => m.id === v.mealId))
    .filter((m): m is Meal => Boolean(m))
}

export function Profile() {
  const { username, isAdmin, logout, deleteAccount, resetDemo, meals, ratings, comments, mealVotes, users } =
    useStore()
  const liked = votedMeals(mealVotes, meals, username, 'like')
  const accounts = [...users].sort((a, b) => a.username.localeCompare(b.username, 'tr'))
  const [openUser, setOpenUser] = useState('')
  const [adminView, setAdminView] = useState<'users' | 'meals'>('users')
  const [deleteError, setDeleteError] = useState('')
  const rankedMeals = useMemo(
    () =>
      [...meals]
        .map((meal) => {
          const likes = mealVotes.filter((v) => v.mealId === meal.id && v.value === 'like').length
          const dislikes = mealVotes.filter((v) => v.mealId === meal.id && v.value === 'dislike').length
          return { meal, likes, dislikes, total: likes + dislikes }
        })
        .sort(
          (a, b) =>
            b.total - a.total || b.likes - a.likes || a.meal.name.localeCompare(b.meal.name, 'tr'),
        ),
    [meals, mealVotes],
  )

  return (
    <>
      <View style={ui.topbar}>
        <View style={{ flex: 1 }}>
          <Brand>Profil</Brand>
          <Text style={ui.sub}>
            @{username} · {isAdmin ? 'Yönetici' : 'Kullanıcı'}
          </Text>
        </View>
        <Pressable onPress={() => void logout()} style={local.logout}>
          <Text style={local.logoutText}>Çıkış yap</Text>
        </Pressable>
      </View>
      {isAdmin ? (
        <>
          <View style={[local.dayNav, { justifyContent: 'center' }]}>
            <Pill label="Kullanıcılar" on={adminView === 'users'} onPress={() => setAdminView('users')} />
            <Pill label="Yemekler" on={adminView === 'meals'} onPress={() => setAdminView('meals')} />
          </View>
          {adminView === 'users' ? (
            accounts.length === 0 ? (
              <Text style={ui.muted}>Kayıtlı kullanıcı yok.</Text>
            ) : (
              accounts.map((u) => {
                const likes = votedMeals(mealVotes, meals, u.username, 'like')
                const dislikes = votedMeals(mealVotes, meals, u.username, 'dislike')
                const rows = [
                  ...likes.map((meal) => ({ meal, vote: 'like' as const })),
                  ...dislikes.map((meal) => ({ meal, vote: 'dislike' as const })),
                ]
                const open = openUser === u.id
                return (
                  <Card key={u.id}>
                    <Pressable onPress={() => setOpenUser(open ? '' : u.id)} style={local.accHead}>
                      <Text style={local.h3}>{u.username}</Text>
                      <Text style={local.chev}>{open ? '▴' : '▾'}</Text>
                    </Pressable>
                    {open ? (
                      <View style={local.accBody}>
                        {rows.length === 0 ? (
                          <Text style={ui.muted}>Bu kullanıcının oyu yok.</Text>
                        ) : (
                          rows.map(({ meal, vote }) => (
                            <View key={`${u.id}-${meal.id}-${vote}`} style={local.weekLine}>
                              <View style={{ flex: 1 }}>
                                <Text style={local.h3}>{meal.name}</Text>
                                <Text style={ui.muted}>
                                  {slotOf(meal.slot).label} · {shortDate(meal.date)}
                                </Text>
                              </View>
                              {vote === 'like' ? <ThumbUp /> : <ThumbDown />}
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}
                  </Card>
                )
              })
            )
          ) : meals.length === 0 ? (
            <Text style={ui.muted}>Henüz yemek yok.</Text>
          ) : (
            rankedMeals.map(({ meal, likes, dislikes }) => (
              <Card key={meal.id} style={local.rank}>
                <View style={{ flex: 1 }}>
                  <Text style={local.h3}>{meal.name}</Text>
                  <Text style={ui.muted}>
                    {slotOf(meal.slot).label} · {shortDate(meal.date)}
                  </Text>
                </View>
                <View style={local.rankVotes}>
                  <View style={local.rankVote}>
                    <ThumbUp size={16} />
                    <Text style={{ fontWeight: '700' }}>{likes}</Text>
                  </View>
                  <View style={local.rankVote}>
                    <ThumbDown size={16} />
                    <Text style={{ fontWeight: '700' }}>{dislikes}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
          <Card>
            <Text style={ui.muted}>
              {meals.length} yemek · {ratings.length} puan · {comments.length} yorum
            </Text>
            <View style={{ height: 10 }} />
            <DangerButton title="Demo verisini sıfırla" onPress={() => void resetDemo()} />
          </Card>
        </>
      ) : (
        <>
          <Text style={local.likedTitle}>Beğendiğin yemekler</Text>
          {liked.length === 0 ? (
            <Text style={ui.muted}>Henüz beğendiğin yemek yok. Menüden beğenebilirsin.</Text>
          ) : (
            liked.map((meal) => (
              <Card key={meal.id}>
                <Text style={local.h3}>{meal.name}</Text>
                <Text style={ui.muted}>
                  {slotOf(meal.slot).label} · {shortDate(meal.date)}
                </Text>
              </Card>
            ))
          )}
          <Card>
            <Text style={ui.muted}>Hesabını ve bu uygulamadaki oylarını kalıcı olarak silebilirsin.</Text>
            {deleteError ? <Text style={ui.error}>{deleteError}</Text> : null}
            <View style={{ height: 10 }} />
            <DangerButton
              title="Hesabı sil"
              onPress={() => {
                Alert.alert('Hesabı sil', 'Hesabın silinsin mi? Bu işlem geri alınamaz.', [
                  { text: 'Vazgeç', style: 'cancel' },
                  {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                      void deleteAccount().then((err) => {
                        if (err) setDeleteError(err)
                      })
                    },
                  },
                ])
              }}
            />
          </Card>
        </>
      )}
    </>
  )
}

const local = StyleSheet.create({
  welcome: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 28,
  },
  logoWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 260,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
    shadowColor: '#3d2a1c',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  logo: {
    width: '100%',
    height: 148,
  },
  authSwitch: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
    padding: 8,
  },
  dayNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  dayNavLeft: { flexDirection: 'row', gap: 6 },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  accHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  accBody: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.line },
  chev: { color: colors.muted, fontSize: 18 },
  weekLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  slotBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  slotBarIco: {
    width: 28,
    textAlign: 'center',
    fontSize: 16,
  },
  slotBarStrong: { color: '#fff', fontWeight: '700', fontSize: 14 },
  slotBarSmall: { color: '#fff', opacity: 0.88, fontSize: 12 },
  mealBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  commentOpen: {
    backgroundColor: colors.ghost,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  commentOpenText: { fontWeight: '700', color: colors.ink, fontSize: 12 },
  comment: { marginTop: 12 },
  commentHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  voteRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  seven: { flexDirection: 'row', gap: 4, marginBottom: 14 },
  day: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  past: { backgroundColor: '#e8e0d8' },
  pastOn: { backgroundColor: '#5c534c' },
  today: { backgroundColor: '#f8e0d0' },
  todayOn: { backgroundColor: '#c45c26' },
  future: { backgroundColor: '#d7ebe2' },
  futureOn: { backgroundColor: '#2f6b4f' },
  dayText: { fontSize: 11, fontWeight: '700', color: colors.ink },
  daySmall: { fontSize: 10, color: colors.muted, marginTop: 2 },
  logout: {
    backgroundColor: colors.logoutBg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  logoutText: { color: colors.logout, fontWeight: '700', fontSize: 14 },
  likedTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 14,
  },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankVotes: { flexDirection: 'row', gap: 12 },
  rankVote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
})
