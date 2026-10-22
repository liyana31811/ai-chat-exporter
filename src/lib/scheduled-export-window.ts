import type { PlatformScheduleConfig, ScheduledExportSettings } from './types'
import { getNextScheduledRunAt, isDueForSchedule, isValidScheduleTime } from './scheduled-export'

type ActiveWindow = Pick<ScheduledExportSettings, 'allowedDays' | 'dailyWindow'>

export function getScheduleWindowError(settings: ActiveWindow): 'days' | 'time' | null {
  if (settings.allowedDays != null && !settings.allowedDays.some(day => Number.isInteger(day) && day >= 0 && day <= 6)) return 'days'
  const window = settings.dailyWindow
  if (window && (!isValidScheduleTime(window.start) || !isValidScheduleTime(window.end) || window.start === window.end)) return 'time'
  return null
}

/** Local wall-clock restrictions. Overnight hours belong to the start weekday. */
export function canStartScheduledWork(settings: ActiveWindow, now: number, force = false): boolean {
  if (force) return true // The explicitly labelled Run now action bypasses all timing restrictions.
  if (!Number.isFinite(now) || getScheduleWindowError(settings)) return false
  const date = new Date(now)
  let day = date.getDay()
  const window = settings.dailyWindow
  if (window) {
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    if (window.start < window.end) {
      if (time < window.start || time >= window.end) return false
    } else if (time < window.end) {
      day = (day + 6) % 7
    } else if (time < window.start) {
      return false
    }
  }
  return settings.allowedDays == null || settings.allowedDays.includes(day)
}

/** Minute-precision windows: walk real minutes so DST gaps and repeated hours are not skipped. */
function nextAllowedAt(settings: ActiveWindow, now: number): number | null {
  if (getScheduleWindowError(settings)) return null
  if (canStartScheduledWork(settings, now)) return now
  const limit = new Date(now)
  limit.setDate(limit.getDate() + 8) // A full local week, including a DST transition.
  for (let candidate = Math.ceil(now / 60_000) * 60_000; candidate <= limit.getTime(); candidate += 60_000) {
    if (canStartScheduledWork(settings, candidate)) return candidate
  }
  return null
}

/** Intersect the existing frequency rules with allowed days/hours; do not invent catch-up runs. */
export function getNextWindowedScheduledRunAt(
  config: PlatformScheduleConfig,
  lastRun: number,
  now: number,
  settings: ActiveWindow,
): number | null {
  let due = getNextScheduledRunAt(config, lastRun, now)
  if (settings.allowedDays == null && settings.dailyWindow == null) return due
  // Two weekly cycles cover recurring combinations plus a local DST transition.
  const horizon = new Date(due)
  horizon.setDate(horizon.getDate() + 15)
  while (due <= horizon.getTime()) {
    const allowed = nextAllowedAt(settings, due)
    if (allowed === null) return null
    if (isDueForSchedule(config, lastRun, allowed)) return allowed
    const next = getNextScheduledRunAt(config, lastRun, allowed)
    if (next <= due) return null
    due = next
  }
  return null // For example, a daily 18:00 target with a 09:00–17:00 window.
}
