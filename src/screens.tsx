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
import { DAY_VIEWS, addDays, isoDate, isPastDate, isPublishedDate, weekDates, weekStart, type DayView } from './dates'
import { slotHint, slotLabel, useI18n } from './i18n'
import { dateTimeName, shortDateLabel, weekdayName, weekdayShort } from './i18n/dates'
import { msg } from './i18n/translations'
import { useStore } from './store'
import { colors, slotBar } from './theme'
import { SLOTS, likesOf, dislikesOf, slotOf, type Meal, type MealSlot } from './types'
import {
  Brand,
  Card,
  DangerButton,
  Field,
  GhostButton,
  Hit,
  Pill,
  PrimaryButton,
  SlotPicker,
  ThumbDown,
  ThumbUp,
  styles as ui,
} from './ui'

function notify(title: string, message?: string) {
  const text = message ? `${title}\n${message}` : title
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(text)
    return
  }
  Alert.alert(title, message)
}

function sendVote(action: () => Promise<void>) {
  void action().catch((err) => {
    notify(msg('voteFailed'), err instanceof Error ? err.message : msg('tryAgain'))
  })
}

function VoteButton({
  label,
  kind,
  locked,
  active,
  onPress,
  children,
}: {
  label: string
  kind: 'like' | 'dislike'
  locked: boolean
  active?: boolean
  onPress: () => void
  children: ReactNode
}) {
  const handle = () => {
    if (locked) {
      notify(msg('locked'), msg('lockedPast'))
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
          background: active ? (kind === 'like' ? '#d7ebe2' : '#f3d6d0') : '#fff',
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
      style={[ui.vote, active && (kind === 'like' ? ui.voteOnLike : ui.voteOnDislike)]}
    >
      {children}
    </Pressable>
  )
}

export function MealVotes({ mealId, locked }: { mealId: string; locked: boolean }) {
  const { t } = useI18n()
  const { mealVotes, userName, voteMeal } = useStore()
  const mine = mealVotes.find((v) => v.mealId === mealId && v.userName === userName)?.value
  const likes = mealVotes.filter((v) => v.mealId === mealId && v.value === 'like').length
  const dislikes = mealVotes.filter((v) => v.mealId === mealId && v.value === 'dislike').length

  return (
    <View style={local.voteRow}>
      <VoteButton
        label={t('like')}
        kind="like"
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
        label={t('dislike')}
        kind="dislike"
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
  const { t } = useI18n()
  const { loginUser, registerUser } = useStore()
  const [screen, setScreen] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegister = screen === 'register'

  return (
    <ScrollView contentContainerStyle={local.welcome} keyboardShouldPersistTaps="handled">
      <View style={local.welcomeBrand}>
        <View style={local.logoWrap}>
          <Image
            source={require('./assets/seyyid-kamil-logo.jpg')}
            style={local.logo}
            resizeMode="contain"
            accessibilityLabel={t('dormName')}
          />
        </View>
        <View style={local.welcomeHead}>
          <View style={local.welcomeTitle}>
            <Brand size={36}>{t('welcomeTitle')}</Brand>
          </View>
          <Text style={local.welcomeLead} numberOfLines={3}>
            {t('welcomeLead')}
          </Text>
        </View>
      </View>
      <View style={local.welcomeForm}>
        <Field
          label={t('username')}
          value={username}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          onChangeText={(v) => {
            setUsername(v)
            setError('')
          }}
          placeholder={t('username')}
        />
        <Field
          label={t('password')}
          value={password}
          secureTextEntry
          autoComplete={isRegister ? 'new-password' : 'password'}
          onChangeText={(v) => {
            setPassword(v)
            setError('')
          }}
          placeholder={isRegister ? t('passwordHint') : t('password')}
        />
        {error ? <Text style={ui.error}>{error}</Text> : null}
        <View style={{ height: 12 }} />
        <PrimaryButton
          title={busy ? t('wait') : isRegister ? t('register') : t('login')}
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
        <Hit
          onPress={() => {
            setScreen(isRegister ? 'login' : 'register')
            setError('')
          }}
        >
          <Text style={local.authSwitch} numberOfLines={2}>
            {isRegister ? t('haveAccount') : t('noAccount')}
          </Text>
        </Hit>
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
  const { t, lang } = useI18n()
  const { meals, userName, publishedWeeks } = useStore()
  const today = isoDate()
  const [openDay, setOpenDay] = useState(today)
  const focusDate =
    dayView === 'dun' ? addDays(today, -1) : dayView === 'yarin' ? addDays(today, 1) : today
  const week = weekDates(weekStart(today))
  const locked = dayView === 'dun'
  const hello =
    dayView === 'hafta'
      ? t('helloWeek', { name: userName })
      : dayView === 'dun'
        ? t('helloYesterday', { name: userName })
        : dayView === 'yarin'
          ? t('helloTomorrow', { name: userName })
          : t('helloToday', { name: userName })
  const dayViewLabel = { dun: t('yesterday'), bugun: t('today'), yarin: t('tomorrow'), hafta: t('week') }

  return (
    <>
      <View style={ui.topbar}>
        <View style={{ flex: 1 }}>
          <Brand>{t('brand')}</Brand>
          <Text style={[ui.sub, { minHeight: 40 }]}>{hello}</Text>
        </View>
      </View>
      <View style={local.dayNav}>
        <View style={local.dayNavLeft}>
          {DAY_VIEWS.filter((d) => d.id !== 'hafta').map((d) => (
            <Pill key={d.id} label={dayViewLabel[d.id]} on={dayView === d.id} onPress={() => setDayView(d.id)} />
          ))}
        </View>
        {DAY_VIEWS.filter((d) => d.id === 'hafta').map((d) => (
          <Pill key={d.id} label={dayViewLabel[d.id]} on={dayView === d.id} onPress={() => setDayView(d.id)} />
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
                <Hit onPress={() => setOpenDay(open ? '' : date)} style={local.accHead}>
                  <View>
                    <Text style={local.h3}>
                      {weekdayName(date, lang)} · {shortDateLabel(date, lang)}
                    </Text>
                    <Text style={ui.muted}>
                      {!live
                        ? t('notPublished')
                        : past
                          ? t('viewOnly')
                          : t('mealCount', { n: dayMeals.length })}
                    </Text>
                  </View>
                  <Text style={local.chev}>{open ? '▴' : '▾'}</Text>
                </Hit>
                {open ? (
                  <View style={local.accBody}>
                    {!live ? <Text style={ui.muted}>{t('weekNotPublished')}</Text> : null}
                    {live && dayMeals.length === 0 ? <Text style={ui.muted}>{t('noMealsDay')}</Text> : null}
                    {live
                      ? dayMeals.map((meal) => (
                          <View key={meal.id} style={local.weekLine}>
                            <View style={{ flex: 1 }}>
                              <Text style={local.h3}>{meal.name}</Text>
                              <Text style={ui.muted}>
                                {slotOf(meal.slot).icon} {slotLabel(meal.slot, t)}
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
                  <Text style={local.slotBarStrong}>{slotLabel(s.id, t)}</Text>
                  <Text style={local.slotBarSmall}>{slotHint(s.id, t)}</Text>
                </View>
                {dayMeals.length === 0 ? (
                  <Text style={[ui.muted, { marginTop: 6 }]}>{t('noMealsSlot')}</Text>
                ) : (
                  dayMeals.map((meal) => (
                    <View key={meal.id} style={local.mealBlock}>
                      <View style={local.mealItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={local.h3}>{meal.name}</Text>
                          <Text style={ui.muted}>{meal.description}</Text>
                        </View>
                        <Hit onPress={() => onOpen(meal.id)} style={local.commentOpen}>
                          <Text style={local.commentOpenText}>{locked ? t('comments') : t('details')}</Text>
                        </Hit>
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
  const { t, lang } = useI18n()
  const { meals, commentsFor, addComment } = useStore()
  const meal = meals.find((m) => m.id === mealId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  if (!meal) {
    return <GhostButton title={t('back')} onPress={onBack} />
  }

  const comments = commentsFor(meal.id)
  const interactive = !isPastDate(meal.date)

  return (
    <>
      <View style={[ui.topbar, { alignItems: 'center' }]}>
        <Hit onPress={onBack} style={ui.back}>
          <Text>←</Text>
        </Hit>
        <Text style={ui.badge}>{slotLabel(meal.slot, t)}</Text>
        <Text style={ui.badge}>{shortDateLabel(meal.date, lang)}</Text>
      </View>
      <Brand>{meal.name}</Brand>
      <Text style={[ui.muted, { marginBottom: 14 }]}>{meal.description}</Text>
      <Card>
        <Text style={ui.muted}>
          <Text style={{ fontWeight: '700', color: colors.ink }}>{t('ingredients')}: </Text>
          {meal.ingredients}
        </Text>
      </Card>
      <Card>
        <Text style={local.h3}>{t('giveVote')}</Text>
        <Text style={ui.muted}>{interactive ? t('voteHint') : t('voteLocked')}</Text>
        <View style={{ height: 8 }} />
        <MealVotes mealId={meal.id} locked={!interactive} />
      </Card>
      <Card>
        <Text style={local.h3}>{t('comments')}</Text>
        {comments.length === 0 ? (
          <Text style={ui.muted}>{interactive ? t('firstComment') : t('noComments')}</Text>
        ) : null}
        {comments.map((c) => (
          <View key={c.id} style={local.comment}>
            <View style={local.commentHead}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>{c.userName}</Text>
              {c.createdAt ? <Text style={ui.muted}>{dateTimeName(c.createdAt, lang)}</Text> : null}
            </View>
            <Text style={ui.muted}>{c.text}</Text>
          </View>
        ))}
        {interactive ? (
          <>
            <Field
              label={t('addComment')}
              value={text}
              multiline
              onChangeText={setText}
              placeholder={t('commentPlaceholder')}
            />
            <View style={{ height: 10 }} />
            <PrimaryButton
              title={sending ? t('sending') : t('send')}
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
  const { t, lang } = useI18n()
  const { meals } = useStore()
  const meal = meals.find((m) => m.id === mealId)
  if (!meal) return <GhostButton title={t('back')} onPress={onBack} />

  return (
    <>
      <View style={[ui.topbar, { alignItems: 'center' }]}>
        <Hit onPress={onBack} style={ui.back}>
          <Text>←</Text>
        </Hit>
        <Text style={ui.badge}>{slotLabel(meal.slot, t)}</Text>
        <Text style={ui.badge}>{shortDateLabel(meal.date, lang)}</Text>
      </View>
      <Brand>{meal.name}</Brand>
      <Text style={[ui.muted, { marginBottom: 14 }]}>{meal.description}</Text>
      <Card>
        <Text style={local.h3}>{t('ingredients')}</Text>
        <Text style={ui.muted}>{meal.ingredients || t('notAdded')}</Text>
      </Card>
      <Card>
        <Text style={local.h3}>{t('recipe')}</Text>
        <Text style={[ui.muted, { lineHeight: 22 }]}>{meal.recipe || t('noRecipe')}</Text>
      </Card>
    </>
  )
}

export function Suggest() {
  const { t } = useI18n()
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
          <Brand>{t('suggestions')}</Brand>
          <Text style={ui.sub}>{t('suggestionsSub')}</Text>
        </View>
        <Hit onPress={() => setOpen(true)} style={local.addBtn}>
          <Text style={local.addBtnText}>{t('suggestMeal')}</Text>
        </Hit>
      </View>
      {ranked.length === 0 ? (
        <Text style={ui.empty}>{t('noSuggestionsUser')}</Text>
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
                    {slotLabel(s.slot, t)} · {s.userName}
                  </Text>
                </View>
              </View>
              <View style={local.voteRow}>
                <VoteButton
                  label={t('like')}
                  kind="like"
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
                  label={t('dislike')}
                  kind="dislike"
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
            <Hit onPress={closeModal} style={ui.back}>
              <Text>←</Text>
            </Hit>
            <Brand size={22}>{t('suggestMeal')}</Brand>
          </View>
          <Text style={ui.muted}>{t('suggestLead')}</Text>
          <Text style={[ui.fieldLabel, { marginTop: 18 }]}>{t('slot')}</Text>
          <View style={{ height: 8 }} />
          <SlotPicker value={slot} onChange={setSlot} />
          <Field label={t('mealName')} value={text} onChangeText={setText} placeholder={t('mealNameExample')} />
          <View style={{ height: 16 }} />
          <PrimaryButton
            title={t('sendSuggestion')}
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
  const { t } = useI18n()
  const { suggestions, markSuggestion, deleteSuggestion } = useStore()
  const fresh = suggestions.filter((s) => s.status === 'yeni')

  return (
    <>
      <View style={ui.topbar}>
        <View style={{ flex: 1 }}>
          <Brand>{t('suggestions')}</Brand>
          <Text style={ui.sub}>{t('adminSuggestionsSub')}</Text>
        </View>
        {fresh.length > 0 ? <Text style={ui.badge}>{t('newCount', { n: fresh.length })}</Text> : null}
      </View>
      {suggestions.length === 0 ? (
        <Text style={ui.empty}>{t('noSuggestionsAdmin')}</Text>
      ) : (
        suggestions.map((s) => (
          <Card key={s.id}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>
              {s.userName} · {slotLabel(s.slot, t)} · {t('likesCount', { n: likesOf(s) })}
            </Text>
            <Text style={ui.muted}>{s.text}</Text>
            <View style={ui.row}>
              {s.status === 'yeni' ? (
                <GhostButton
                  title={t('reviewed')}
                  onPress={() =>
                    void markSuggestion(s.id).catch((err) =>
                      notify(t('actionFailed'), err instanceof Error ? err.message : t('tryAgain')),
                    )
                  }
                />
              ) : null}
              <DangerButton
                title={t('delete')}
                onPress={() =>
                  void deleteSuggestion(s.id).catch((err) =>
                    notify(t('deleteFailed'), err instanceof Error ? err.message : t('tryAgain')),
                  )
                }
              />
            </View>
          </Card>
        ))
      )}
    </>
  )
}

export function AdminPanel({ onOpen }: { onOpen: (id: string) => void }) {
  const { t, lang } = useI18n()
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
          <Brand>{t('weeklyMenu')}</Brand>
          <Text style={ui.sub}>{t('weeklyMenuSub')}</Text>
        </View>
      </View>
      <Card>
        <View style={local.weekNav}>
          <GhostButton title="←" onPress={() => goWeek(-7)} />
          <Text style={{ fontWeight: '700', color: colors.ink }}>
            {shortDateLabel(week, lang)} – {shortDateLabel(addDays(week, 6), lang)}
          </Text>
          <GhostButton title="→" onPress={() => goWeek(7)} />
        </View>
        <Text style={ui.muted}>{live ? t('weekPublished') : t('weekUnpublished')}</Text>
        <View style={{ height: 10 }} />
        {live ? (
          <GhostButton title={t('unpublish')} onPress={() => void publishWeek(week, false)} />
        ) : (
          <PrimaryButton title={t('publishWeek')} onPress={() => void publishWeek(week, true)} />
        )}
      </Card>
      <View style={local.seven}>
        {days.map((date) => {
          const on = selectedDate === date
          const tone = isPastDate(date) ? 'past' : date === today ? 'today' : 'future'
          return (
            <Hit
              key={date}
              onPress={() => {
                setSelectedDate(date)
                setForm((f) => ({ ...f, date }))
              }}
              style={[local.day, local[tone], on && local[`${tone}On` as const]]}
            >
              <Text style={[local.dayText, on && { color: '#fff' }]}>{weekdayShort(date, lang)}</Text>
              <Text style={[local.daySmall, on && { color: '#fff' }]}>{shortDateLabel(date, lang)}</Text>
            </Hit>
          )
        })}
      </View>
      <Card>
        <Text style={local.h3}>{editingId ? t('editMeal') : t('newMeal')}</Text>
        <Text style={[ui.fieldLabel, { marginTop: 12 }]}>{t('slot')}</Text>
        <View style={{ height: 8 }} />
        <SlotPicker value={form.slot} onChange={(slot) => setForm({ ...form, slot })} />
        <Field
          label={t('mealName')}
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
          placeholder={t('mealExample')}
        />
        <Field
          label={t('shortDesc')}
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
        />
        <Field
          label={t('ingredients')}
          value={form.ingredients}
          onChangeText={(ingredients) => setForm({ ...form, ingredients })}
        />
        <Field
          label={t('recipe')}
          value={form.recipe}
          multiline
          onChangeText={(recipe) => setForm({ ...form, recipe })}
          placeholder={t('recipePlaceholder')}
        />
        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title={editingId ? t('save') : t('addToList')} onPress={() => void submit()} />
          </View>
          {editingId ? (
            <View style={{ flex: 1 }}>
              <GhostButton
                title={t('cancel')}
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
          <Hit onPress={() => onOpen(meal.id)}>
            <Text style={local.h3}>{meal.name}</Text>
            <Text style={ui.muted}>{meal.description}</Text>
          </Hit>
          <View style={ui.row}>
            <GhostButton title={t('edit')} onPress={() => startEdit(meal)} />
            <DangerButton title={t('delete')} onPress={() => void deleteMeal(meal.id)} />
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
  const { t, lang } = useI18n()
  const { username, isAdmin, logout, deleteAccount, resetDemo, meals, ratings, comments, mealVotes, users } =
    useStore()
  const liked = votedMeals(mealVotes, meals, username, 'like')
  const accounts = [...users].sort((a, b) => a.username.localeCompare(b.username, lang))
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
            b.total - a.total || b.likes - a.likes || a.meal.name.localeCompare(b.meal.name, lang),
        ),
    [meals, mealVotes, lang],
  )

  return (
    <>
      <View style={ui.topbar}>
        <View style={{ flex: 1 }}>
          <Brand>{t('profile')}</Brand>
          <Text style={ui.sub}>
            @{username} · {isAdmin ? t('adminRole') : t('userRole')}
          </Text>
        </View>
        <Hit onPress={() => void logout()} style={local.logout}>
          <Text style={local.logoutText}>{t('logout')}</Text>
        </Hit>
      </View>
      {isAdmin ? (
        <>
          <View style={[local.dayNav, { justifyContent: 'center' }]}>
            <Pill label={t('users')} on={adminView === 'users'} onPress={() => setAdminView('users')} />
            <Pill label={t('meals')} on={adminView === 'meals'} onPress={() => setAdminView('meals')} />
          </View>
          {adminView === 'users' ? (
            accounts.length === 0 ? (
              <Text style={ui.muted}>{t('noUsers')}</Text>
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
                    <Hit onPress={() => setOpenUser(open ? '' : u.id)} style={local.accHead}>
                      <Text style={local.h3}>{u.username}</Text>
                      <Text style={local.chev}>{open ? '▴' : '▾'}</Text>
                    </Hit>
                    {open ? (
                      <View style={local.accBody}>
                        {rows.length === 0 ? (
                          <Text style={ui.muted}>{t('noVotesUser')}</Text>
                        ) : (
                          rows.map(({ meal, vote }) => (
                            <View key={`${u.id}-${meal.id}-${vote}`} style={local.weekLine}>
                              <View style={{ flex: 1 }}>
                                <Text style={local.h3}>{meal.name}</Text>
                                <Text style={ui.muted}>
                                  {slotLabel(meal.slot, t)} · {shortDateLabel(meal.date, lang)}
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
            <Text style={ui.muted}>{t('noMealsYet')}</Text>
          ) : (
            rankedMeals.map(({ meal, likes, dislikes }) => (
              <Card key={meal.id} style={local.rank}>
                <View style={{ flex: 1 }}>
                  <Text style={local.h3}>{meal.name}</Text>
                  <Text style={ui.muted}>
                    {slotLabel(meal.slot, t)} · {shortDateLabel(meal.date, lang)}
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
              {t('stats', { meals: meals.length, ratings: ratings.length, comments: comments.length })}
            </Text>
            <View style={{ height: 10 }} />
            <DangerButton title={t('resetDemo')} onPress={() => void resetDemo()} />
          </Card>
        </>
      ) : (
        <>
          <Text style={local.likedTitle}>{t('likedTitle')}</Text>
          {liked.length === 0 ? (
            <Text style={ui.muted}>{t('noLiked')}</Text>
          ) : (
            liked.map((meal) => (
              <Card key={meal.id}>
                <Text style={local.h3}>{meal.name}</Text>
                <Text style={ui.muted}>
                  {slotLabel(meal.slot, t)} · {shortDateLabel(meal.date, lang)}
                </Text>
              </Card>
            ))
          )}
          <Card>
            <Text style={ui.muted}>{t('deleteAccountLead')}</Text>
            {deleteError ? <Text style={ui.error}>{deleteError}</Text> : null}
            <View style={{ height: 10 }} />
            <DangerButton
              title={t('deleteAccount')}
              onPress={() => {
                const go = () =>
                  void deleteAccount().then((err) => {
                    if (err) setDeleteError(err)
                  })
                if (Platform.OS === 'web') {
                  if (window.confirm(t('deleteConfirm'))) go()
                  return
                }
                Alert.alert(t('deleteAccount'), t('deleteConfirm'), [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('delete'), style: 'destructive', onPress: go },
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
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    gap: 20,
  },
  welcomeBrand: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeHead: {
    width: '100%',
    height: 112,
    alignItems: 'center',
  },
  welcomeTitle: {
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeLead: {
    marginTop: 8,
    height: 58,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  welcomeForm: {
    width: '100%',
  },
  logoWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 220,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 4,
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
    height: 40,
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
