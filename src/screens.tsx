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
import { SLOTS, likesOf, dislikesOf, slotOf, type Comment, type Meal, type MealSlot, type PublicUser } from './types'
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

function voteActiveBg(kind: 'like' | 'dislike' | 'comment') {
  if (kind === 'like') return '#d7ebe2'
  if (kind === 'dislike') return '#f3d6d0'
  return '#efe4d4'
}

function voteActiveStyle(kind: 'like' | 'dislike' | 'comment') {
  if (kind === 'like') return ui.voteOnLike
  if (kind === 'dislike') return ui.voteOnDislike
  return ui.voteOnComment
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
  kind: 'like' | 'dislike' | 'comment'
  locked: boolean
  active?: boolean
  onPress: () => void
  children: ReactNode
}) {
  const handle = () => {
    if (locked) return
    onPress()
  }

  if (Platform.OS === 'web') {
    return createElement(
      'button',
      {
        type: 'button',
        disabled: locked,
        onClick: handle,
        'aria-label': label,
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '6px',
          background: active ? voteActiveBg(kind) : '#fff',
          borderRadius: 14,
          padding: '8px 10px',
          minWidth: 52,
          border: '1px solid #eadfd2',
          cursor: locked ? 'default' : 'pointer',
          opacity: locked ? 0.45 : 1,
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
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={handle}
      style={[ui.vote, active && voteActiveStyle(kind), locked && { opacity: 0.45 }]}
    >
      {children}
    </Pressable>
  )
}

function adminNamesOf(users: { username: string; role: string }[]) {
  return new Set(users.filter((u) => u.role === 'admin').map((u) => u.username).concat('admin'))
}

function votersOf(
  votes: { mealId: string; userName: string; value: string }[],
  mealId: string,
  value: 'like' | 'dislike',
  skip: Set<string>,
) {
  return votes
    .filter((v) => v.mealId === mealId && v.value === value && !skip.has(v.userName))
    .map((v) => v.userName)
}

export function MealVotes({
  mealId,
  locked,
  onComment,
  commentOpen,
  compact,
  iconLabels,
}: {
  mealId: string
  locked: boolean
  onComment?: () => void
  commentOpen?: boolean
  compact?: boolean
  iconLabels?: boolean
}) {
  const { t } = useI18n()
  const { mealVotes, userName, voteMeal, commentsFor, isAdmin, users } = useStore()
  const skip = adminNamesOf(users)
  const likers = votersOf(mealVotes, mealId, 'like', skip)
  const dislikers = votersOf(mealVotes, mealId, 'dislike', skip)
  const mine = mealVotes.find((v) => v.mealId === mealId && v.userName === userName)?.value
  const commentCount = commentsFor(mealId).length

  const commentBtn = onComment ? (
    <VoteButton
      label={t('comments')}
      kind="comment"
      locked={false}
      active={commentOpen}
      onPress={onComment}
    >
      <Text pointerEvents="none" style={{ fontSize: 16 }}>
        💬
      </Text>
      <Text pointerEvents="none" style={ui.voteCount}>
        {commentCount}
      </Text>
    </VoteButton>
  ) : null

  if (isAdmin) {
    return (
      <View>
        {commentBtn ? (
          <View style={[local.voteRow, compact && { marginTop: 4 }]}>{commentBtn}</View>
        ) : null}
        {compact && commentOpen ? null : iconLabels ? (
          <View style={[local.voterIcons, commentBtn && { marginTop: compact ? 4 : 10 }]}>
            <View style={local.voterIconRow}>
              <ThumbUp size={14} />
              <Text numberOfLines={2} style={[ui.muted, { flex: 1 }]}>
                {likers.length ? likers.join(', ') : t('nobodyYet')}
              </Text>
            </View>
            <View style={local.voterIconRow}>
              <ThumbDown size={14} />
              <Text numberOfLines={2} style={[ui.muted, { flex: 1 }]}>
                {dislikers.length ? dislikers.join(', ') : t('nobodyYet')}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <Text
              numberOfLines={compact ? 1 : undefined}
              style={[ui.muted, { marginTop: commentBtn ? (compact ? 4 : 10) : 0 }]}
            >
              {t('likedBy', { names: likers.length ? likers.join(', ') : t('nobodyYet') })}
            </Text>
            <Text numberOfLines={compact ? 1 : undefined} style={ui.muted}>
              {t('dislikedBy', { names: dislikers.length ? dislikers.join(', ') : t('nobodyYet') })}
            </Text>
          </>
        )}
      </View>
    )
  }

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
          {likers.length}
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
          {dislikers.length}
        </Text>
      </VoteButton>
      {commentBtn}
    </View>
  )
}

function MealComments({ mealId, interactive }: { mealId: string; interactive: boolean }) {
  const { t, lang } = useI18n()
  const { commentsFor, addComment, isAdmin } = useStore()
  const comments = commentsFor(mealId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const canWrite = interactive && !isAdmin

  return (
    <View>
      {comments.length === 0 ? (
        <Text style={ui.muted}>{canWrite ? t('firstComment') : t('noComments')}</Text>
      ) : (
        comments.map((c) => (
          <View key={c.id} style={local.comment}>
            <View style={local.commentHead}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>{c.userName}</Text>
              {c.createdAt ? <Text style={ui.muted}>{dateTimeName(c.createdAt, lang)}</Text> : null}
            </View>
            <Text style={ui.muted}>{c.text}</Text>
          </View>
        ))
      )}
      {canWrite ? (
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
              void addComment(mealId, trimmed)
                .then(() => setText(''))
                .catch((err) => {
                  notify(msg('actionFailed'), err instanceof Error ? err.message : msg('tryAgain'))
                })
                .finally(() => setSending(false))
            }}
          />
        </>
      ) : null}
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
    <View style={local.welcome}>
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
    </View>
  )
}

export function Home({
  dayView,
  setDayView,
}: {
  dayView: DayView
  setDayView: (d: DayView) => void
}) {
  const { t, lang } = useI18n()
  const { meals, userName, publishedWeeks, isAdmin } = useStore()
  const chrome = isAdmin
  const compact = isAdmin && dayView !== 'hafta'
  const today = isoDate()
  const [openDay, setOpenDay] = useState(today)
  const [openComments, setOpenComments] = useState<string | null>(null)
  const selectDay = (next: DayView) => {
    setOpenComments(null)
    setDayView(next)
  }
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

  const mealsBody =
    dayView === 'hafta'
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
                          <View key={meal.id}>
                            <View style={local.weekLine}>
                              <View style={{ flex: 1 }}>
                                <Text style={local.h3}>{meal.name}</Text>
                                <Text style={ui.muted}>
                                  {slotOf(meal.slot).icon} {slotLabel(meal.slot, t)}
                                </Text>
                              </View>
                              <MealVotes
                                mealId={meal.id}
                                locked={past}
                                iconLabels={isAdmin}
                                commentOpen={isAdmin ? undefined : openComments === meal.id}
                                onComment={
                                  isAdmin
                                    ? undefined
                                    : () => setOpenComments((id) => (id === meal.id ? null : meal.id))
                                }
                              />
                            </View>
                            {!isAdmin && openComments === meal.id ? (
                              <View style={local.inlineComments}>
                                <MealComments mealId={meal.id} interactive={!past} />
                              </View>
                            ) : null}
                          </View>
                        ))
                      : null}
                  </View>
                ) : null}
              </Card>
            )
          })
        : (
          <View style={compact ? { flex: 1, gap: 8, minHeight: 0 } : undefined}>
            {SLOTS.map((s) => {
            const dayMeals = meals.filter((m) => m.slot === s.id && m.date === focusDate)
            const commentsHere = compact && dayMeals.some((m) => m.id === openComments)
            return (
              <Card
                key={s.id}
                style={[
                  { padding: compact ? 10 : 12 },
                  compact && {
                    flex: commentsHere ? 2.2 : openComments ? 0.75 : 1,
                    marginBottom: 0,
                    minHeight: 0,
                    overflow: 'hidden',
                  },
                ]}
              >
                <View style={[local.slotBar, compact && local.slotBarCompact, { backgroundColor: slotBar[s.id] }]}>
                  <Text style={local.slotBarIco}>{s.icon}</Text>
                  <Text numberOfLines={1} style={local.slotBarStrong}>
                    {slotLabel(s.id, t)}
                  </Text>
                  <Text numberOfLines={1} style={local.slotBarSmall}>
                    {slotHint(s.id, t)}
                  </Text>
                </View>
                {dayMeals.length === 0 ? (
                  <Text style={[ui.muted, { marginTop: 6 }]}>{t('noMealsSlot')}</Text>
                ) : (
                  dayMeals.map((meal) => {
                    const commentsOpen = openComments === meal.id
                    return (
                    <View
                      key={meal.id}
                      style={[
                        local.mealBlock,
                        compact && local.mealBlockCompact,
                        compact && commentsOpen && { flex: 1, minHeight: 0 },
                      ]}
                    >
                      <View style={[local.mealItem, compact && local.mealItemCompact]}>
                        <View style={{ flex: 1 }}>
                          <Text style={local.h3} numberOfLines={compact ? 1 : undefined}>
                            {meal.name}
                          </Text>
                          {compact && commentsOpen ? null : (
                            <Text style={ui.muted} numberOfLines={compact ? 1 : undefined}>
                              {meal.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <MealVotes
                        mealId={meal.id}
                        locked={locked || isPastDate(meal.date)}
                        compact={compact}
                        commentOpen={commentsOpen}
                        onComment={() => setOpenComments((id) => (id === meal.id ? null : meal.id))}
                      />
                      {commentsOpen ? (
                        compact ? (
                          <ScrollView
                            style={local.inlineCommentsCompact}
                            contentContainerStyle={{ paddingBottom: 4 }}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                          >
                            <MealComments mealId={meal.id} interactive={!locked && !isPastDate(meal.date)} />
                          </ScrollView>
                        ) : (
                          <View style={local.inlineComments}>
                            <MealComments mealId={meal.id} interactive={!locked && !isPastDate(meal.date)} />
                          </View>
                        )
                      ) : null}
                    </View>
                    )
                  })
                )}
              </Card>
            )
          })}
          </View>
        )

  return (
    <View style={chrome ? { flex: 1, minHeight: 0 } : undefined}>
      <View style={[ui.topbar, { marginBottom: chrome ? 8 : 14 }]}>
        <View style={{ flex: 1 }}>
          <Brand size={chrome ? 24 : 28}>{t('brand')}</Brand>
          <Text numberOfLines={1} style={[ui.sub, chrome && { minHeight: 18 }]}>
            {hello}
          </Text>
        </View>
      </View>
      <View style={[local.dayNav, chrome && { marginBottom: 6 }]}>
        <View style={local.dayNavLeft}>
          {DAY_VIEWS.filter((d) => d.id !== 'hafta').map((d) => (
            <Pill
              key={d.id}
              compact
              label={dayViewLabel[d.id]}
              on={dayView === d.id}
              onPress={() => selectDay(d.id)}
            />
          ))}
        </View>
        {DAY_VIEWS.filter((d) => d.id === 'hafta').map((d) => (
          <Pill
            key={d.id}
            compact
            label={dayViewLabel[d.id]}
            on={dayView === d.id}
            onPress={() => selectDay(d.id)}
          />
        ))}
      </View>
      {chrome && !compact ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mealsBody}
        </ScrollView>
      ) : (
        mealsBody
      )}
    </View>
  )
}

export function MealDetail({ mealId, onBack }: { mealId: string; onBack: () => void }) {
  const { t, lang } = useI18n()
  const { meals } = useStore()
  const meal = meals.find((m) => m.id === mealId)

  if (!meal) {
    return <GhostButton title={t('back')} onPress={onBack} />
  }

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
        <MealComments mealId={meal.id} interactive={interactive} />
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

function SuggestionsHeader({
  subtitle,
  extra,
  onSuggest,
}: {
  subtitle: string
  extra?: ReactNode
  onSuggest?: () => void
}) {
  const { t } = useI18n()
  return (
    <View style={local.suggestBlock}>
      <View style={local.suggestTitleRow}>
        <Brand>{t('suggestions')}</Brand>
        {extra}
        {onSuggest ? (
          <Hit onPress={onSuggest} style={local.addBtn}>
            <Text numberOfLines={1} style={local.addBtnText}>
              {t('suggestMeal')}
            </Text>
          </Hit>
        ) : null}
      </View>
      <Text numberOfLines={2} style={ui.sub}>
        {subtitle}
      </Text>
    </View>
  )
}

function SuggestMealModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const { addSuggestion } = useStore()
  const [slot, setSlot] = useState<MealSlot>('ogle')
  const [text, setText] = useState('')

  function close() {
    onClose()
    setText('')
    setSlot('ogle')
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={[ui.screen, ui.screenPad, { paddingTop: 56 }]}>
        <View style={[ui.topbar, { alignItems: 'center' }]}>
          <Hit onPress={close} style={ui.back}>
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
              .then(close)
              .catch(() => undefined)
          }}
        />
      </View>
    </Modal>
  )
}

export function Suggest() {
  const { t } = useI18n()
  const { voteSuggestion, suggestions, userName } = useStore()
  const [open, setOpen] = useState(false)
  const ranked = [...suggestions].sort((a, b) => {
    const likeDiff = likesOf(b) - likesOf(a)
    if (likeDiff !== 0) return likeDiff
    return dislikesOf(a) - dislikesOf(b)
  })

  return (
    <>
      <SuggestionsHeader subtitle={t('suggestionsSub')} onSuggest={() => setOpen(true)} />
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
      <SuggestMealModal visible={open} onClose={() => setOpen(false)} />
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
      <SuggestionsHeader
        subtitle={t('adminSuggestionsSub')}
        extra={fresh.length > 0 ? <Text style={ui.badge}>{t('newCount', { n: fresh.length })}</Text> : null}
      />
      {suggestions.length === 0 ? (
        <Text style={ui.empty}>{t('noSuggestionsAdmin')}</Text>
      ) : (
        suggestions.map((s) => (
          <Card key={s.id}>
            <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.ink }}>
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

function userAliases(user: Pick<PublicUser, 'username' | 'displayName'>) {
  return [user.username, user.displayName]
    .filter((name): name is string => Boolean(name && name.trim()))
    .map((name) => name.trim().toLocaleLowerCase('tr'))
}

function isSameUser(userName: string, user: Pick<PublicUser, 'username' | 'displayName'>) {
  return userAliases(user).includes(userName.trim().toLocaleLowerCase('tr'))
}

function votedMeals(
  votes: { mealId: string; userName: string; value: string }[],
  meals: Meal[],
  who: string | Pick<PublicUser, 'username' | 'displayName'>,
  value: 'like' | 'dislike',
) {
  return votes
    .filter((v) => (typeof who === 'string' ? v.userName === who : isSameUser(v.userName, who)) && v.value === value)
    .map((v) => meals.find((m) => m.id === v.mealId))
    .filter((m): m is Meal => Boolean(m))
}

function commentsOfUser(comments: Comment[], user: Pick<PublicUser, 'username' | 'displayName'>) {
  return comments
    .filter((c) => isSameUser(c.userName, user))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function Profile() {
  const { t, lang } = useI18n()
  const { username, isAdmin, logout, deleteAccount, deleteUser, meals, ratings, comments, mealVotes, users } =
    useStore()
  const liked = votedMeals(mealVotes, meals, username, 'like')
  const accounts = [...users]
    .filter((u) => u.role !== 'admin' && u.username !== 'admin')
    .sort((a, b) => a.username.localeCompare(b.username, lang))
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
          <View style={local.profileTitleRow}>
            <Brand>{t('profile')}</Brand>
            <Hit onPress={() => void logout()} style={local.logout}>
              <Text style={local.logoutText}>{t('logout')}</Text>
            </Hit>
          </View>
          <Text style={ui.sub}>
            @{username} · {isAdmin ? t('adminRole') : t('userRole')}
          </Text>
        </View>
      </View>
      {isAdmin ? (
        <>
          <View style={[local.dayNav, { justifyContent: 'center' }]}>
            <Pill fill label={t('users')} on={adminView === 'users'} onPress={() => setAdminView('users')} />
            <Pill fill label={t('meals')} on={adminView === 'meals'} onPress={() => setAdminView('meals')} />
          </View>
          {adminView === 'users' ? (
            accounts.length === 0 ? (
              <Text style={ui.muted}>{t('noUsers')}</Text>
            ) : (
              <>
              {deleteError ? <Text style={ui.error}>{deleteError}</Text> : null}
              {accounts.map((u) => {
                const likes = votedMeals(mealVotes, meals, u, 'like')
                const dislikes = votedMeals(mealVotes, meals, u, 'dislike')
                const rows = [
                  ...likes.map((meal) => ({ meal, vote: 'like' as const })),
                  ...dislikes.map((meal) => ({ meal, vote: 'dislike' as const })),
                ]
                const userComments = commentsOfUser(comments, u)
                const open = openUser === u.id
                const canRemove = u.role !== 'admin' && u.username !== 'admin'
                const askDelete = () => {
                  const go = () =>
                    void deleteUser(u.id).then((err) => {
                      if (err) setDeleteError(err)
                      else {
                        setDeleteError('')
                        setOpenUser((id) => (id === u.id ? '' : id))
                      }
                    })
                  if (Platform.OS === 'web') {
                    if (window.confirm(t('deleteUserConfirm', { name: u.username }))) go()
                    return
                  }
                  Alert.alert(t('delete'), t('deleteUserConfirm', { name: u.username }), [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('delete'), style: 'destructive', onPress: go },
                  ])
                }
                return (
                  <Card key={u.id}>
                    <View style={local.accHead}>
                      <Hit onPress={() => setOpenUser(open ? '' : u.id)} style={{ flex: 1 }}>
                        <Text style={local.h3}>{u.username}</Text>
                        <Text numberOfLines={1} style={ui.muted}>
                          {t('userActivity', { votes: rows.length, comments: userComments.length })}
                        </Text>
                      </Hit>
                      {canRemove ? (
                        <Hit onPress={askDelete} style={local.userDelete}>
                          <Text style={local.userDeleteText}>{t('delete')}</Text>
                        </Hit>
                      ) : null}
                      <Hit onPress={() => setOpenUser(open ? '' : u.id)}>
                        <Text style={local.chev}>{open ? '▴' : '▾'}</Text>
                      </Hit>
                    </View>
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
                        <Text style={local.userSection}>{t('comments')}</Text>
                        {userComments.length === 0 ? (
                          <Text style={ui.muted}>{t('noCommentsUser')}</Text>
                        ) : (
                          userComments.map((c) => {
                            const meal = meals.find((m) => m.id === c.mealId)
                            return (
                              <View key={c.id} style={local.comment}>
                                <View style={local.commentHead}>
                                  <Text style={[local.h3, { flex: 1, marginBottom: 0 }]}>
                                    {meal?.name ?? t('comments')}
                                  </Text>
                                  {c.createdAt ? (
                                    <Text style={ui.muted}>{dateTimeName(c.createdAt, lang)}</Text>
                                  ) : null}
                                </View>
                                {meal ? (
                                  <Text style={ui.muted}>
                                    {slotLabel(meal.slot, t)} · {shortDateLabel(meal.date, lang)}
                                  </Text>
                                ) : null}
                                <Text style={local.commentText}>{c.text}</Text>
                              </View>
                            )
                          })
                        )}
                      </View>
                    ) : null}
                  </Card>
                )
              })}
              </>
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
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 16,
    gap: 16,
  },
  welcomeBrand: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeHead: {
    width: '100%',
    height: 100,
    alignItems: 'center',
  },
  welcomeTitle: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeLead: {
    marginTop: 6,
    height: 50,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 2,
    shadowColor: '#3d2a1c',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  logo: {
    width: '100%',
    height: 128,
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
    marginBottom: 8,
    gap: 8,
  },
  dayNavLeft: { flexDirection: 'row', flexShrink: 1, gap: 4 },
  h3: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  accHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  accBody: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.line },
  userSection: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  commentText: { color: colors.ink, marginTop: 4, lineHeight: 20 },
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
  voterIcons: {
    gap: 4,
    minWidth: 140,
    flexShrink: 1,
  },
  voterIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  slotBarCompact: {
    paddingVertical: 5,
    marginBottom: 4,
  },
  slotBarIco: {
    width: 28,
    textAlign: 'center',
    fontSize: 16,
  },
  slotBarStrong: { color: '#fff', fontWeight: '700', fontSize: 14, flexShrink: 1 },
  slotBarSmall: { color: '#fff', opacity: 0.88, fontSize: 12, flexShrink: 1 },
  mealBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  mealBlockCompact: {
    paddingVertical: 2,
    borderBottomWidth: 0,
  },
  mealItem: {
    paddingVertical: 10,
  },
  mealItemCompact: {
    paddingVertical: 2,
  },
  comment: { marginTop: 12 },
  commentHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  voteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  inlineComments: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  inlineCommentsCompact: {
    flex: 1,
    minHeight: 0,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  suggestBlock: {
    paddingRight: 88,
    marginBottom: 20,
  },
  suggestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
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
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 10,
  },
  logout: {
    backgroundColor: colors.logoutBg,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  logoutText: { color: colors.logout, fontWeight: '700', fontSize: 13 },
  userDelete: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  userDeleteText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
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
