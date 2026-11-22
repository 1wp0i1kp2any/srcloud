"use client";

/**
 * CollapsingHeader — React port of the three-row, Google-Images-style header.
 *
 * Behaviour mirrors `../CollapsingHeader.svelte` 1:1:
 *  - the header stays in the flex flow (shrink-0, no fixed/absolute);
 *  - row heights are measured with ResizeObserver, never hardcoded;
 *  - `middle` is sticky via CSS (top: 0 / bottom: 0);
 *  - `top` and `bottom` are collapsed by JS, synchronously with scrolling:
 *    scroll is consumed 1:1 by the header while its height shrinks;
 *  - `dock='top'` hides on scroll down, `dock='bottom'` does the opposite;
 *  - empty rows take no space, a completely empty header is `hidden`.
 *
 * Types below are the React counterparts of `../page.svelte` (Snippet -> ReactNode).
 */
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'

/* -------------------------------------------------------------------------- */
/* Types / helpers (React equivalent of page.svelte)                          */
/* -------------------------------------------------------------------------- */

export type HeaderRow = 'top' | 'middle' | 'bottom'
export type HeaderSide = 'start' | 'center' | 'end'

export interface SlotItem {
  id: number
  /** React equivalent of a Svelte Snippet. */
  content: ReactNode
  offset?: number
}

export type RowSlots = Record<HeaderSide, SlotItem[]>
export type HeaderRows = Record<HeaderRow, RowSlots>

export const HEADER_ROWS: readonly HeaderRow[] = ['top', 'middle', 'bottom']

export function emptyRowSlots(): RowSlots {
  return { start: [], center: [], end: [] }
}

export function rowHasSlots(row: RowSlots | undefined): boolean {
  if (!row) return false
  return row.start.length > 0 || row.center.length > 0 || row.end.length > 0
}

export function headerHasSlots(header: HeaderRows | undefined): boolean {
  if (!header) return false
  return rowHasSlots(header.top) || rowHasSlots(header.middle) || rowHasSlots(header.bottom)
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/* -------------------------------------------------------------------------- */
/* HeaderRowView (React equivalent of HeaderRowView.svelte)                    */
/* -------------------------------------------------------------------------- */

interface HeaderRowViewProps {
  slots: RowSlots
  leading?: ReactNode
  className?: string
}

function HeaderRowView({ slots, leading, className = '' }: HeaderRowViewProps) {
  const start = slots?.start ?? []
  const center = slots?.center ?? []
  const end = slots?.end ?? []

  return (
    <div className={`mx-auto flex w-full max-w-5xl flex-wrap items-center gap-y-1 px-4 ${className}`}>
      {leading != null || start.length > 0 ? (
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none]">
          {leading != null ? <Fragment key="leading">{leading}</Fragment> : null}
          {start.map((item) => (
            <Fragment key={item.id}>{item.content}</Fragment>
          ))}
        </div>
      ) : null}

      {center.length > 0 ? (
        <div className="flex min-w-0 flex-1 items-center justify-start gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
          {center.map((item) => (
            <Fragment key={item.id}>{item.content}</Fragment>
          ))}
        </div>
      ) : null}

      {end.length > 0 ? (
        <div className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap sm:gap-1.5 [scrollbar-width:none]">
          {end.map((item) => (
            <Fragment key={item.id}>{item.content}</Fragment>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* CollapsingHeader                                                            */
/* -------------------------------------------------------------------------- */

export interface CollapsingHeaderProps {
  /** Header rows, normally supplied by a page/context provider. */
  rows: HeaderRows
  /** Where the header sits relative to <main>. */
  dock?: 'top' | 'bottom'
  /**
   * Scroll owner. `'window'` means the document. A ref object is accepted too —
   * React refs are populated after mount, so passing `mainRef` directly is the
   * idiomatic replacement for Svelte's reactive `bind:this` binding.
   */
  scrollContainer?: HTMLElement | 'window' | RefObject<HTMLElement | null>
  /** Disable JS hiding and keep only the sticky middle row. */
  disabled?: boolean
  /** Snap to 0/1 after scrolling stops. */
  snap?: boolean
  /** Element rendered before `start` in a row (e.g. the ☰ button). */
  leading?: (row: HeaderRow) => ReactNode
  /** Custom row markup; defaults to HeaderRowView. */
  renderRow?: (row: HeaderRow, slots: RowSlots) => ReactNode
  onProgress?: (p: number) => void
  className?: string
}

export default function CollapsingHeader({
  rows,
  dock = 'top',
  scrollContainer,
  disabled = false,
  snap = true,
  leading,
  renderRow,
  onProgress,
  className = '',
}: CollapsingHeaderProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const outer = useRef<Partial<Record<'top' | 'bottom', HTMLDivElement>>>({})
  const inner = useRef<Partial<Record<'top' | 'bottom', HTMLDivElement>>>({})

  // Mutable, non-reactive values — the equivalent of plain `let` in the Svelte version.
  const progressRef = useRef(0)
  const heightRef = useRef({ top: 0, bottom: 0 })
  const lastScrollRef = useRef<number | null>(null)
  const idleTimerRef = useRef<number | null>(null)

  // "Hot" props live in refs so that changing them does not resubscribe scroll
  // listeners or recreate the ResizeObserver (Svelte's untrack()).
  const dockRef = useRef(dock)
  dockRef.current = dock
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  const applyProgress = useCallback((p: number, animate = false) => {
    const progress = clamp01(p)
    progressRef.current = progress

    const paint = (o: HTMLDivElement | undefined, full: number) => {
      if (!o) return
      const h = Math.max(0, full * (1 - progress))
      o.style.transition = animate
        ? 'height 0.28s cubic-bezier(0.32,0.72,0,1), opacity 0.22s ease'
        : 'none'
      o.style.height = `${h}px`
      o.style.opacity = full <= 0 ? '1' : `${1 - progress * 0.15}`
      o.style.visibility = h < 0.6 && full > 0 ? 'hidden' : 'visible'
      const i = o.firstElementChild as HTMLElement | null
      if (i) {
        i.style.transform =
          dockRef.current === 'top'
            ? `translateY(${-progress * 10}px)`
            : `translateY(${progress * 10}px)`
        i.style.willChange = 'transform'
      }
    }

    paint(outer.current.top, heightRef.current.top)
    paint(outer.current.bottom, heightRef.current.bottom)
    rootRef.current?.setAttribute('data-progress', progress.toFixed(3))
    onProgressRef.current?.(progress)
  }, [])

  const measure = useCallback(() => {
    heightRef.current = {
      top: inner.current.top?.offsetHeight ?? 0,
      bottom: inner.current.bottom?.offsetHeight ?? 0,
    }
    applyProgress(progressRef.current, false)
  }, [applyProgress])

  // Row heights are observed directly: fonts, wrapping, content changes,
  // resizes and a row becoming hidden all report themselves — no timers.
  // The first ResizeObserver notification is the initial measurement.
  useEffect(() => {
    const rowsEls = [inner.current.top, inner.current.bottom].filter(
      (el): el is HTMLDivElement => !!el,
    )
    if (!rowsEls.length) return
    if (typeof ResizeObserver === 'undefined') {
      measure()
      return
    }
    const ro = new ResizeObserver(measure)
    for (const el of rowsEls) ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  // `dock` changes the shift direction and `disabled` resets progress: repaint.
  useEffect(() => {
    applyProgress(disabled ? 0 : progressRef.current, false)
  }, [applyProgress, disabled, dock])

  const resolveContainer = useCallback((): HTMLElement | 'window' | null => {
    if (scrollContainer === 'window') return 'window'
    if (!scrollContainer) return null
    if ('current' in scrollContainer) return scrollContainer.current ?? null
    return scrollContainer
  }, [scrollContainer])

  const [container, setContainer] = useState<HTMLElement | 'window' | null>(resolveContainer)

  // A ref-based container is filled in after mount; pick it up without any
  // manual re-rendering from the caller.
  useEffect(() => {
    setContainer((prev) => {
      const next = resolveContainer()
      return Object.is(prev, next) ? prev : next
    })
  })

  // Scroll synchronisation.
  useEffect(() => {
    if (disabled) {
      applyProgress(0, false)
      return
    }

    const sc = container
    if (!sc) return
    const el = sc === 'window' ? null : sc
    const currentDock = dock
    const shouldSnap = snap

    const getST = () => (el ? el.scrollTop : window.scrollY)
    const setST = (v: number) => {
      if (el) el.scrollTop = v
      else window.scrollTo(0, v)
    }
    lastScrollRef.current = getST()

    const clearIdle = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }

    const scheduleSnap = () => {
      clearIdle()
      if (!shouldSnap) return
      idleTimerRef.current = window.setTimeout(() => {
        const p = progressRef.current
        if (p > 0.02 && p < 0.98) applyProgress(p > 0.5 ? 1 : 0, true)
      }, 260)
    }

    /** Consume `amount` of scroll pixels with the header in hide (+1) / show (-1) direction. */
    const consume = (st: number, amount: number, dir: 1 | -1, sign: 1 | -1) => {
      const total = heightRef.current.top + heightRef.current.bottom
      if (total <= 0) return
      const p = progressRef.current
      const need = dir === 1 ? (1 - p) * total : p * total
      const c = Math.min(amount, need)
      applyProgress(p + (dir * c) / total, false)
      const reverted = st - sign * c
      lastScrollRef.current = reverted
      if (c > 0.5) setST(reverted)
      else lastScrollRef.current = st
      scheduleSnap()
    }

    const onScroll = () => {
      const st = getST()
      const last = lastScrollRef.current
      if (last === null) {
        lastScrollRef.current = st
        return
      }
      const delta = st - last
      if (delta === 0) return

      const total = heightRef.current.top + heightRef.current.bottom
      if (total <= 2) {
        lastScrollRef.current = st
        return
      }

      const p = progressRef.current
      if (currentDock === 'top') {
        if (delta > 0 && p < 1) return consume(st, delta, 1, 1)
        if (delta < 0 && p > 0) return consume(st, -delta, -1, -1)
      } else {
        if (delta < 0 && p < 1) return consume(st, -delta, 1, -1)
        if (delta > 0 && p > 0) return consume(st, delta, -1, 1)
      }
      lastScrollRef.current = st
      scheduleSnap()
    }

    const target: EventTarget = el ?? window
    target.addEventListener('scroll', onScroll, { passive: true })

    const revealIfIdle = () => {
      const st = getST()
      const canScroll = el
        ? el.scrollHeight - el.clientHeight > 2
        : document.documentElement.scrollHeight - window.innerHeight > 2
      if ((st <= 0 || !canScroll) && progressRef.current > 0) {
        lastScrollRef.current = st
        applyProgress(0, true)
      }
    }

    let raf = 0
    const scheduleReveal = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        revealIfIdle()
      })
    }

    const mo =
      typeof MutationObserver !== 'undefined' ? new MutationObserver(scheduleReveal) : null
    mo?.observe(el ?? document.body, { childList: true, subtree: true })

    return () => {
      target.removeEventListener('scroll', onScroll)
      mo?.disconnect()
      if (raf) cancelAnimationFrame(raf)
      clearIdle()
    }
  }, [applyProgress, container, disabled, dock, snap])

  const rowSlots = (row: HeaderRow): RowSlots => rows?.[row] ?? emptyRowSlots()
  const has = (row: HeaderRow) => rowHasSlots(rows?.[row]) || Boolean(leading?.(row))
  const order: readonly HeaderRow[] = dock === 'top' ? HEADER_ROWS : [...HEADER_ROWS].reverse()

  const renderContent = (row: HeaderRow) =>
    renderRow
      ? (renderRow(row, rowSlots(row)) ?? null)
      : <HeaderRowView slots={rowSlots(row)} leading={leading?.(row) ?? undefined} />

  const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

  return (
    <header
      ref={rootRef}
      data-fe-header=""
      data-dock={dock}
      data-progress="0.000"
      className={cx(
        'relative z-30 w-full shrink-0 border-border/70 bg-background/85 backdrop-blur',
        dock === 'top' ? 'border-b' : 'border-t',
        className,
        headerHasSlots(rows) ? undefined : 'hidden',
      )}
      style={{ contain: 'layout' } as CSSProperties}
    >
      {order.map((row) => {
        if (row === 'middle') {
          return (
            <div
              key="middle"
              data-slot="middle"
              className={cx(
                'sticky z-10',
                dock === 'top' ? 'top-0' : 'bottom-0',
                has('middle') ? undefined : 'hidden',
              )}
            >
              <div className="py-2">{renderContent('middle')}</div>
            </div>
          )
        }

        if (row === 'top') {
          return (
            <div
              key="top"
              ref={(el) => {
                outer.current.top = el ?? undefined
              }}
              data-slot="top"
              className={cx('shrink-0 overflow-hidden', has('top') ? undefined : 'hidden')}
            >
              <div
                ref={(el) => {
                  inner.current.top = el ?? undefined
                }}
                className="py-2"
              >
                {renderContent('top')}
              </div>
            </div>
          )
        }

        return (
          <div
            key="bottom"
            ref={(el) => {
              outer.current.bottom = el ?? undefined
            }}
            data-slot="bottom"
            className={cx('shrink-0 overflow-hidden', has('bottom') ? undefined : 'hidden')}
          >
            <div
              ref={(el) => {
                inner.current.bottom = el ?? undefined
              }}
              className="py-2"
            >
              {renderContent('bottom')}
            </div>
          </div>
        )
      })}
    </header>
  )
}
