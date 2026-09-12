import { createElement, type ReactNode } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { useI18n, slotLabel } from './i18n'
import { SLOTS, type MealSlot } from './types'
import { colors } from './theme'

export function Hit({
  onPress,
  disabled,
  style,
  children,
  label,
  quiet,
}: {
  onPress: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  children: ReactNode
  label?: string
  quiet?: boolean
}) {
  const run = () => {
    if (!disabled) onPress()
  }
  if (Platform.OS === 'web') {
    const flat = StyleSheet.flatten(style) || {}
    return createElement(
      'button',
      {
        type: 'button',
        disabled,
        onClick: run,
        onMouseDown: quiet
          ? (e: { preventDefault: () => void }) => {
              e.preventDefault()
            }
          : undefined,
        'aria-label': label,
        style: {
          display: 'flex',
          flexDirection: (flat.flexDirection as 'row' | 'column') || 'column',
          alignItems: (flat.alignItems as string) || 'center',
          justifyContent: (flat.justifyContent as string) || 'center',
          gap: typeof flat.gap === 'number' ? `${flat.gap}px` : undefined,
          background: (flat.backgroundColor as string) || 'transparent',
          borderRadius: flat.borderRadius,
          padding: flat.padding,
          paddingTop: flat.paddingVertical ?? flat.paddingTop,
          paddingBottom: flat.paddingVertical ?? flat.paddingBottom,
          paddingLeft: flat.paddingHorizontal ?? flat.paddingLeft,
          paddingRight: flat.paddingHorizontal ?? flat.paddingRight,
          margin: 0,
          borderWidth: flat.borderWidth ?? 0,
          borderStyle: 'solid',
          borderColor: (flat.borderColor as string) || 'transparent',
          boxSizing: 'border-box',
          outline: 'none',
          width: flat.width === '100%' || flat.flex === 1 ? '100%' : flat.width,
          height: flat.height,
          minWidth: flat.minWidth,
          minHeight: flat.minHeight,
          flex: flat.flex,
          flexShrink: flat.flexShrink ?? 0,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.65 : 1,
          font: 'inherit',
          color: 'inherit',
        },
      },
      children,
    )
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={run}
      disabled={disabled}
      style={[style, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  )
}

export function ThumbUp({ size = 18 }: { size?: number }) {
  return (
    <Text pointerEvents="none" style={{ fontSize: size }}>
      👍
    </Text>
  )
}

export function ThumbDown({ size = 18 }: { size?: number }) {
  return (
    <Text pointerEvents="none" style={{ fontSize: size }}>
      👎
    </Text>
  )
}

export function Brand({ children, size = 28 }: { children: ReactNode; size?: number }) {
  return <Text style={[styles.brand, { fontSize: size }]}>{children}</Text>
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#a89888"
        style={[styles.input, props.multiline && styles.textarea]}
        {...props}
      />
    </View>
  )
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Hit onPress={onPress} disabled={disabled} style={styles.primary}>
      <Text style={styles.primaryText}>{title}</Text>
    </Hit>
  )
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Hit onPress={onPress} style={styles.ghost}>
      <Text style={styles.ghostText}>{title}</Text>
    </Hit>
  )
}

export function DangerButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Hit onPress={onPress} style={styles.danger}>
      <Text style={styles.dangerText}>{title}</Text>
    </Hit>
  )
}

export function SlotPicker({
  value,
  onChange,
  counts,
}: {
  value: MealSlot
  onChange: (slot: MealSlot) => void
  counts?: Partial<Record<MealSlot, number>>
}) {
  const { t } = useI18n()
  return (
    <View style={styles.slots}>
      {SLOTS.map((s) => (
        <Hit key={s.id} onPress={() => onChange(s.id)} style={[styles.slot, s.id === value && styles.slotOn]}>
          <Text style={styles.slotIco}>{s.icon}</Text>
          <Text style={styles.slotLabel}>{slotLabel(s.id, t)}</Text>
          {counts ? <Text style={styles.slotHint}>{t('mealCountShort', { n: counts[s.id] ?? 0 })}</Text> : null}
        </Hit>
      ))}
    </View>
  )
}

function FlagTR() {
  return (
    <View style={[styles.flag, { backgroundColor: '#E30A17' }]}>
      <View style={styles.flagTrMoonOuter} />
      <View style={styles.flagTrMoonCut} />
      <Text style={styles.flagTrStar}>★</Text>
    </View>
  )
}

function FlagDE() {
  return (
    <View style={styles.flag}>
      <View style={{ flex: 1, backgroundColor: '#000' }} />
      <View style={{ flex: 1, backgroundColor: '#DD0000' }} />
      <View style={{ flex: 1, backgroundColor: '#FFCC00' }} />
    </View>
  )
}

export function LanguageSwitcher({ top = 8, right = 12 }: { top?: number; right?: number }) {
  const { lang, setLang } = useI18n()
  return (
    <View pointerEvents="box-none" style={[styles.langDock, { top, right }]}>
      <Hit
        quiet
        label="Türkçe"
        onPress={() => {
          if (lang !== 'tr') setLang('tr')
        }}
        style={[styles.langBtn, lang === 'tr' && styles.langBtnOn]}
      >
        <FlagTR />
      </Hit>
      <Hit
        quiet
        label="Deutsch"
        onPress={() => {
          if (lang !== 'de') setLang('de')
        }}
        style={[styles.langBtn, lang === 'de' && styles.langBtnOn]}
      >
        <FlagDE />
      </Hit>
    </View>
  )
}

export function Pill({
  label,
  on,
  onPress,
}: {
  label: string
  on?: boolean
  onPress: () => void
}) {
  return (
    <Hit onPress={onPress} style={[styles.pill, on && styles.pillOn]}>
      <Text style={[styles.pillText, on && styles.pillTextOn]}>{label}</Text>
    </Hit>
  )
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenPad: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  brand: {
    fontFamily: 'Georgia',
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  sub: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  field: {
    marginTop: 18,
    gap: 8,
  },
  fieldLabel: {
    height: 16,
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 16,
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  ghost: {
    backgroundColor: colors.ghost,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ghostText: {
    color: colors.ink,
    fontWeight: '600',
    fontSize: 15,
  },
  danger: {
    backgroundColor: colors.dangerBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dangerText: {
    color: colors.danger,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
  slots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  slot: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  slotOn: {
    backgroundColor: colors.slotOn,
  },
  slotIco: {
    fontSize: 22,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  slotHint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  pill: {
    backgroundColor: '#efc93a',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 72,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4ae5a',
  },
  pillOn: {
    backgroundColor: '#d9a400',
  },
  pillText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#6e5208',
  },
  pillTextOn: {
    color: '#3d3000',
    fontWeight: '800',
  },
  topbar: {
    flexDirection: 'row',
    paddingRight: 88,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  vote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 52,
    flexShrink: 0,
    cursor: 'pointer',
  },
  voteOnLike: {
    backgroundColor: '#d7ebe2',
  },
  voteOnDislike: {
    backgroundColor: '#f3d6d0',
  },
  voteCount: {
    fontWeight: '700',
    color: colors.ink,
  },
  nav: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navIco: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  navOn: {
    color: colors.accent,
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
  },
  error: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.ghost,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: 'hidden',
    color: colors.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  langDock: {
    position: 'absolute',
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langBtn: {
    width: 36,
    height: 36,
    minWidth: 36,
    minHeight: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langBtnOn: {
    borderColor: colors.accent,
  },
  flag: {
    width: 22,
    height: 15,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61, 42, 28, 0.2)',
  },
  flagTrMoonOuter: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fff',
    top: 3,
    left: 4,
  },
  flagTrMoonCut: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E30A17',
    top: 4,
    left: 6,
  },
  flagTrStar: {
    position: 'absolute',
    right: 3,
    top: 2,
    color: '#fff',
    fontSize: 7,
    lineHeight: 11,
  },
})
