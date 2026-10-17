// The engine every month runs on: it places and moves things, and asks the
// month's Theme what they look like. Drawn into the chrome Claude Code already
// has: the logo block (Clawd in the month's hat, the title, the sky, a corner
// decoration), one ground row under it, and the prompt box (a corner decoration
// at its right end, a critter on the top border, something drifting along the
// bottom one). Nothing flashes: every light change is a slow fade.

import { Canvas, mix } from './canvas'
import { paint, type Sprite, type Theme } from './theme'
import type { Mood } from '../types'

const CLAWD_BODY = ['.XXXXXXX.', '.XXXXXXX.', 'XXXXXXXXX', '.SSSSSSS.']
const CLAWD_LEGS = '.X.X.X.X.'
const CLAWD = { clawd: 0xd97757, shade: 0xb45e44, eye: 0x1a0f1e }
const NIGHT = 0x141018 // what fading lights fade toward

export function seeded(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** The header's six rows: the blank row over the logo, its three, the blank under, the notice. */
export const HEADER_ROWS = 6

/** Columns at the right of the prompt box the corner decoration takes. */
export const WEB_COLUMNS = 22

export type HeaderInfo = { columns: number; version: string; cwd: string }

type Flight = { x: number; py: number; age: number; vx: number; seed: number }

function sprite(cv: Canvas, x: number, py: number, s: Sprite, t: number): void {
  const colors: Record<string, number> = {}
  for (const [k, v] of Object.entries(s.colors)) colors[k] = paint(v, t)
  cv.sprite(x, py, s.rows, colors)
}

/** Where the prompt's critter rests: on the top border, over the corner decoration. */
function critterHome(W: number): number {
  return W - WEB_COLUMNS / 2
}

/**
 * Everything that moves. One clock drives both drawings, so a tool call can
 * send a flyer across the header and leave a knot on the prompt at once.
 */
export class Scene {
  t = 0
  mood: Mood = 'idle'
  /** How far the greeting has come down, 0..1; null once it is home. */
  greet: number | null = 0
  private greetDir = 1
  private hopAt = -99
  private flights: Flight[] = []
  private seq = 0

  // prompt
  private critterX = -1
  private stride = 0
  private typedAt = -99
  private caret = 4
  private wanderTo: number | null = null
  private nextWander = 25
  private patrolDir = 1
  private knots: number[] = []
  private drifterX = -1
  private drifterSeen = 0

  constructor(public theme: Theme) {}

  step(dt: number, promptColumns: number): void {
    this.t += dt
    for (const f of this.flights) {
      f.age += dt
      f.x += f.vx * dt
    }
    this.flights = this.flights.filter(f => f.age < 12)

    if (this.greet !== null) {
      this.greet = this.greet + this.greetDir * dt * (this.greetDir > 0 ? 0.3 : 1.2)
      if (this.greet >= 1) this.greet = 1
      if (this.greet <= 0 && this.greetDir < 0) this.greet = null
    }

    const W = promptColumns
    if (W > 0) {
      if (this.critterX < 0) this.critterX = critterHome(W)
      this.walk(dt, W)
    }
  }

  private walk(dt: number, W: number): void {
    const lo = 3
    const hi = W - 6
    let target: number
    const chasing = this.t - this.typedAt < 4
    if (chasing) {
      target = this.caret
    } else if (this.mood === 'working') {
      target = this.patrolDir > 0 ? hi : lo + 5
      if (Math.abs(this.critterX - target) < 0.5) this.patrolDir = -this.patrolDir
    } else {
      if (this.wanderTo === null && this.t > this.nextWander) {
        this.wanderTo = lo + seeded(Math.floor(this.t)) * (hi - lo - WEB_COLUMNS)
      }
      target = this.wanderTo ?? critterHome(W)
      if (this.wanderTo !== null && Math.abs(this.critterX - this.wanderTo) < 0.5) {
        this.wanderTo = null
        this.nextWander = this.t + 20 + seeded(Math.floor(this.t) + 3) * 20
      }
    }
    target = Math.max(lo, Math.min(hi, target))
    // quick to the caret, an easy patrol, a slow wander; scaled by the critter
    const speed = (chasing ? 45 : this.mood === 'working' ? 9 : 6) * this.theme.critter.speed
    const before = this.critterX
    const d = target - this.critterX
    this.critterX += Math.sign(d) * Math.min(Math.abs(d), speed * dt)
    this.stride += Math.abs(this.critterX - before)
    // at rest the critter tidies up what it left
    if (this.mood === 'idle') {
      const x = Math.round(this.critterX)
      this.knots = this.knots.filter(k => k !== x)
    }

    if (this.mood === 'working') {
      this.drifterSeen = Math.min(1, this.drifterSeen + dt / 1.5)
      if (this.drifterX < 0) this.drifterX = W - 10
      this.drifterX -= dt * 2.2
      if (this.drifterX < 8) this.drifterX = W - 10
    } else {
      this.drifterSeen = Math.max(0, this.drifterSeen - dt / 2.5)
      if (this.drifterSeen === 0) this.drifterX = -1
    }
  }

  /** A turn finished: Clawd hops. */
  cheer(): void {
    this.hopAt = this.t
  }

  /** A tool call: a flyer leaves Clawd's hat and the critter leaves a knot. */
  toolCall(): void {
    const flyer = this.theme.flyer
    const flock = flyer.kind === 'sprite' ? flyer.flock ?? 1 : 1
    for (let k = 0; k < flock; k++) {
      if (this.flights.length >= 8) this.flights.shift()
      const s = ++this.seq
      const vx = flyer.kind === 'firework' ? 0 : flyer.kind === 'shooting' ? 28 : 9 + seeded(s * 37) * 7
      const x = flyer.kind === 'firework' ? 24 + seeded(s * 13) * 40 : flyer.kind === 'shooting' ? 30 + seeded(s * 17) * 30 : 6 - k * 6
      this.flights.push({ x, py: 0, age: -k * 0.12, vx: flock > 1 ? 11 : vx, seed: s })
    }
    const x = Math.round(this.critterX)
    if (!this.knots.includes(x) && this.knots.length < 24) this.knots.push(x)
  }

  /** The person typed; the critter comes over to see. `column` is the caret's. */
  typed(column: number): void {
    this.typedAt = this.t
    this.caret = column
  }

  /** The first prompt went in: the greeting goes home. */
  dismissGreeting(): void {
    if (this.greet !== null) this.greetDir = -1
  }

  // ------------------------------------------------------------------ header

  /** The header's cells, HEADER_ROWS tall and `columns` wide. */
  header({ columns: W, version, cwd }: HeaderInfo): Canvas {
    const th = this.theme
    const cv = new Canvas(W, HEADER_ROWS)
    const t = this.t

    this.ambient(cv, W)
    this.yard(cv, W, cwd)

    // Clawd in the month's hat, where the logo's Clawd sits
    const since = t - this.hopAt
    const hop = since < 0.9 ? Math.round(Math.abs(Math.sin((since / 0.9) * Math.PI * 2)) * 1.4) : 0
    const y0 = 0 - hop
    sprite(cv, 0, y0 + 5 - th.hat.rows.length, th.hat, t)
    cv.sprite(0, y0 + 5, CLAWD_BODY, { X: CLAWD.clawd, S: CLAWD.shade })
    const step = this.mood === 'working' && Math.floor(t * 3) % 2 === 1
    cv.sprite(0, y0 + 9, [step ? '..X.X.X.X' : CLAWD_LEGS], { X: CLAWD.clawd })
    const blink = t % 6.3 < 0.16
    const look = this.mood === 'working' ? Math.round(Math.sin(t * 1.3)) : t % 14 < 9 ? 1 : 0
    if (!blink) {
      cv.px(2 + look, y0 + 6, CLAWD.eye)
      cv.px(6 + look, y0 + 6, CLAWD.eye)
    }
    if (th.face) sprite(cv, 0, y0 + 6, th.face, t)
    if (this.mood === 'working') {
      cv.px(9, y0 + 7, CLAWD.clawd)
      sprite(cv, 10, y0 + 6, th.prop, t)
    }

    // the title line, in the month's colors, and a tagline now and then
    const title = 'Claude Code'
    const ver = ` v${version}`
    cv.text(11, 1, title, th.colors.title)
    cv.text(11 + title.length, 1, ver, th.colors.version)
    const tags = th.words.taglines
    const tag = tags[Math.floor(t / 40) % tags.length]
    const tagX = 11 + title.length + ver.length + 3
    const room = skyX(W) - 5 - tagX
    if (room >= tag.length + 4) cv.text(tagX, 1, `~ ${tag} ~`, th.colors.tagline)

    // the corner decoration, then the sky in front of it, and what hangs from it
    th.corner({ cv, ax: W * 2 - 1, ay: 0, rx: 30, ry: 19, t })
    if (W >= 70) th.sky(cv, skyX(W) + 4, t)

    this.flyers(cv)

    if (th.dangle) {
      const sx = W - 9
      const rest = 11 + Math.sin(t * 1.1) * 1.2
      const low = this.mood === 'working' ? 17 + Math.sin(t * 0.8) * 1.5 : rest
      const greeting = this.greet !== null && th.greet.thread !== null
      const sy = greeting ? HEADER_ROWS * 4 : Math.round(low)
      for (let dy = 1; dy < sy; dy++) cv.dot(sx * 2, dy, th.colors.cornerDim)
      if (!greeting) cv.text(sx, Math.min(HEADER_ROWS - 1, Math.floor(sy / 4)), th.dangle.glyph, th.dangle.color)
    }
    return cv
  }

  private ambient(cv: Canvas, W: number): void {
    const a = this.theme.ambient
    if (!a) return
    const t = this.t
    const H = HEADER_ROWS * 2
    for (let i = 0; i < a.count; i++) {
      const r1 = seeded(i * 7 + 1)
      const r2 = seeded(i * 13 + 5)
      const color = a.colors[i % a.colors.length]
      switch (a.kind) {
        case 'snow':
        case 'petals':
        case 'leaves': {
          const fall = a.kind === 'snow' ? 1.6 : a.kind === 'petals' ? 1.1 : 0.8
          const sway = a.kind === 'snow' ? 1.5 : 3
          const py = (r2 * H + t * fall * (0.7 + r1 * 0.6)) % H
          const x = Math.round(r1 * W + Math.sin(t * 0.6 + i) * sway)
          // snow is fine dots; petals and leaves a pixel each
          if (a.kind === 'snow') cv.dot(((x % W) + W) % W * 2 + (i % 2), Math.floor(py * 2), color)
          else cv.px(((x % W) + W) % W, Math.floor(py), color)
          break
        }
        case 'rain': {
          const dy = (r2 * H * 2 + t * 22 * (0.8 + r1 * 0.4)) % (H * 2)
          const dx = Math.round(r1 * W * 2)
          cv.dot(dx, Math.floor(dy), color)
          cv.dot(dx, Math.floor(dy) + 1, color)
          break
        }
        case 'hearts': {
          const y = HEADER_ROWS - 1 - ((r2 * HEADER_ROWS + t * 0.35 * (0.7 + r1 * 0.6)) % HEADER_ROWS)
          const x = Math.round(r1 * (W - 30) + 20 + Math.sin(t * 0.7 + i) * 1.5)
          cv.text(x, Math.floor(y), '♥', color)
          break
        }
        case 'fireflies': {
          const x = Math.round(r1 * W + Math.sin(t * 0.3 + i * 2) * 4)
          const py = Math.round(4 + r2 * 7 + Math.sin(t * 0.5 + i) * 1.5)
          const glow = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.7)
          cv.px(((x % W) + W) % W, py, mix(NIGHT, color, 0.25 + 0.75 * glow))
          break
        }
        case 'stars': {
          const x = Math.round(r1 * W)
          const py = Math.floor(r2 * 4)
          const glow = 0.5 + 0.5 * Math.sin(t * 0.5 + i * 2.3)
          cv.px(x, py, mix(NIGHT, color, 0.3 + 0.7 * glow))
          break
        }
      }
    }
  }

  private flyers(cv: Canvas): void {
    const f = this.theme.flyer
    for (const b of this.flights) {
      if (b.age < 0) continue
      if (f.kind === 'sprite') {
        const frame = f.frames[Math.floor(b.age * 7) % f.frames.length]
        cv.sprite(Math.round(b.x), 0, frame, { X: f.color })
      } else if (f.kind === 'shooting') {
        // a streak down and across, its tail fading
        const x = b.x + b.age * 28
        const py = b.age * 5
        for (let k = 0; k < 6; k++) {
          const c = mix(f.color, NIGHT, k / 6)
          cv.px(Math.round(x - k * 2), Math.round(py - k * 0.4), c)
        }
      } else {
        // a rocket climbs from the ground, then opens and fades slowly
        const color = f.colors[b.seed % f.colors.length]
        const rise = 0.8
        if (b.age < rise) {
          cv.px(Math.round(b.x), Math.round(11 - (b.age / rise) * 8), mix(color, 0xffffff, 0.5))
        } else {
          const k = Math.min(1, (b.age - rise) / 2.4)
          const r = 1 + k * 3.2
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2
            cv.px(Math.round(b.x + Math.cos(a) * r * 1.6), Math.round(3 + Math.sin(a) * r), mix(color, NIGHT, k))
          }
        }
      }
    }
  }

  private yard(cv: Canvas, W: number, cwd: string): void {
    const th = this.theme
    const t = this.t
    const g = HEADER_ROWS * 2 - 1 // the bottom pixel row
    for (let x = 0; x < W; x++) if (seeded(x * 13) > 0.82) cv.px(x, g, th.colors.ground)
    th.yard.feet.forEach((s, i) => sprite(cv, 11 + i * 4, g - s.rows.length + 1, s, t + i * 2.1))
    // props scattered right of the path line
    const from = Math.min(W - 10, 11 + cwd.length + 4)
    let x = from
    let i = 0
    while (x < W - 26) {
      const s = th.yard.props[Math.floor(seeded(i * 7 + 1) * th.yard.props.length)]
      sprite(cv, x, g - s.rows.length + 1, s, t + i)
      x += 7 + Math.floor(seeded(i * 11 + 5) * 14)
      i++
    }
    // the one that lives here wanders up and down the yard
    const span = Math.max(1, W - 32 - 20)
    const gx = 20 + Math.round(span / 2 + (Math.sin(t * 0.11) * span) / 2)
    const frames = th.yard.wanderer
    const s = frames[Math.floor(t * 2.5) % frames.length]
    sprite(cv, gx, g - s.rows.length + 1, s, t)
  }

  /** The greeting under the header, `rows` tall: its thread (if any) and, at its end, itself. */
  greeting(rows: number): Canvas {
    const cv = new Canvas(1, rows)
    const g = this.theme.greet
    if (this.greet === null) return cv
    const eased = 1 - Math.pow(1 - Math.max(0, this.greet), 3)
    const len = Math.round(eased * (rows - 1))
    if (g.thread) for (let y = 0; y < len; y++) cv.text(0, y, g.thread, this.theme.colors.cornerDim)
    if (this.greet > 0) cv.text(0, len, g.glyph, g.color)
    return cv
  }

  // ------------------------------------------------------------------ prompt

  /**
   * The prompt box's decorations, one canvas row per screen row from the row
   * over the box down to the hint line: 0 over the box, 1 its top border, then
   * `rows` of draft, its bottom border, `status` rows of status line, the hint.
   * The decoration hangs at the right, away from the draft and the newest text.
   */
  prompt(W: number, paintBorder: boolean, rows: number, status: number): Canvas {
    const th = this.theme
    const cv = new Canvas(W, 4 + rows + status)
    const t = this.t
    const top = 1
    const bottom = 2 + rows
    if (paintBorder) {
      for (let x = 0; x < W; x++) {
        const k = x / Math.max(1, W - 1)
        cv.text(x, top, '─', mix(th.colors.borderA, th.colors.borderB, k))
        cv.text(x, bottom, '─', mix(th.colors.borderB, th.colors.borderA, k))
      }
    }
    const reach = (rows + status + 2) * 4 - 1
    th.corner({ cv, ax: W * 2 - 1, ay: top * 4 + 1, rx: WEB_COLUMNS * 2 - 4, ry: Math.min(reach, 24), t })

    for (const k of this.knots) cv.text(k, top, th.knot, th.colors.knot)

    const sx = Math.round(this.critterX < 0 ? critterHome(W) : this.critterX)
    const moving = Math.abs(this.stride % 2) < 1
    const [walk, still] = th.critter.glyphs
    cv.text(sx, top, moving ? walk : still, th.colors.critter)

    if (this.drifterSeen > 0 && this.drifterX >= 0) {
      const color = mix(th.colors.borderB, th.colors.drifter, this.drifterSeen)
      cv.text(Math.round(this.drifterX), bottom, th.drifter, color)
    }
    return cv
  }

  /** The spinner's word for this turn, picked by the engine's own so it holds still. */
  verb(word: string): string {
    const v = this.theme.words.verbs
    return v[hash(word) % v.length]
  }

  past(word: string): string {
    const p = this.theme.words.past
    return p[hash(word) % p.length]
  }
}

/** Where the left edge of the sky object falls; the tagline stops short of it. */
function skyX(W: number): number {
  return W - 22
}

/** The rows the prompt box's text takes at `columns`, and the caret's column. */
export function promptShape(
  text: string,
  cursor: number,
  columns: number,
): { rows: number; caret: number; wide: boolean } {
  const width = Math.max(10, columns - 4)
  let rows = 0
  let widest = 0
  for (const line of text.split('\n')) {
    const n = [...line].length
    rows += Math.max(1, Math.ceil(n / width))
    widest = Math.max(widest, Math.min(n, width))
  }
  const before = text.slice(0, cursor)
  const lineStart = before.lastIndexOf('\n') + 1
  const col = [...before.slice(lineStart)].length % width
  return { rows: Math.max(1, rows), caret: 2 + col, wide: 2 + widest >= columns - WEB_COLUMNS - 1 }
}

// ---------------------------------------------------------------- skies

/** A round moon with its shaded side, and a cloud drifting past. */
export function moon(cv: Canvas, cx: number, t: number, c: { moon: number; shade: number; crater: number; cloud: number }): void {
  const cy = 4.5
  const r = 3.6
  for (let py = 0; py < 10; py++) {
    for (let x = cx - 5; x <= cx + 5; x++) {
      const dx = x - cx
      const dy = py - cy
      if (dx * dx + dy * dy > r * r) continue
      cv.px(x, py, dx < -1.8 ? c.shade : (x * 7 + py * 3) % 11 === 0 ? c.crater : c.moon)
    }
  }
  const cloudX = cx - 14 + ((t * 0.6) % 30)
  for (let i = 0; i < 8; i++) {
    const x = Math.round(cloudX) + i
    if (Math.abs(x - cx) <= 5) cv.px(x, i < 2 || i > 5 ? 6 : 5, c.cloud)
  }
}

/** A sun with short rays turning slowly round it. */
export function sun(cv: Canvas, cx: number, t: number, c: { sun: number; core: number; ray: number }): void {
  const cy = 4.5
  for (let py = 0; py < 10; py++) {
    for (let x = cx - 4; x <= cx + 4; x++) {
      const d = Math.hypot(x - cx, py - cy)
      if (d <= 3) cv.px(x, py, d < 1.6 ? c.core : c.sun)
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.15
    cv.px(Math.round(cx + Math.cos(a) * 5.2), Math.round(cy + Math.sin(a) * 4.6), c.ray)
  }
}

/** A rainbow arcing over the sky spot, with a pot of gold where it lands. */
export function rainbow(cv: Canvas, cx: number, t: number, bands: readonly number[], gold: number): void {
  bands.forEach((color, i) => {
    const r = 7 - i
    for (let a = 0; a <= Math.PI; a += 0.04) {
      cv.px(Math.round(cx + Math.cos(a) * r * 1.4), Math.round(10 - Math.sin(a) * r * 1.2), color)
    }
  })
  const shine = mix(gold, 0xfff6c0, 0.5 + 0.5 * Math.sin(t * 1.2))
  cv.sprite(cx + 8, 8, ['.Y.', 'KKK', 'KKK'], { Y: shine, K: 0x2a2a2a })
}

/** A big pixel heart that swells and settles, slowly. */
export function heart(cv: Canvas, cx: number, t: number, c: { heart: number; shine: number }): void {
  const rows = ['.HH...HH.', 'HHHH.HHHH', 'HSHHHHHHH', 'HHHHHHHHH', '.HHHHHHH.', '..HHHHH..', '...HHH...', '....H....']
  const beat = 0.5 + 0.5 * Math.sin(t * 1.1)
  cv.sprite(cx - 4, 1, rows, { H: mix(c.heart, 0xff9cc0, beat * 0.35), S: c.shine })
}

/** A rain cloud, a little sun peeking from behind it. */
export function cloudy(cv: Canvas, cx: number, t: number, c: { cloud: number; under: number; sun: number }): void {
  for (let py = 1; py < 6; py++) {
    for (let x = cx - 1; x <= cx + 5; x++) if (Math.hypot(x - cx - 3, (py - 3) * 1.4) < 3.2) cv.px(x, py, c.sun)
  }
  const puffs: [number, number, number][] = [[cx - 3, 5, 2.4], [cx, 4, 3], [cx + 3, 5.5, 2.2], [cx - 5, 6.5, 1.6]]
  for (let py = 1; py < 10; py++) {
    for (let x = cx - 8; x <= cx + 6; x++) {
      const inside = puffs.some(([px, pyc, r]) => Math.hypot(x - px, py - pyc) < r)
      if (inside) cv.px(x, py, py >= 7 ? c.under : c.cloud)
    }
  }
  void t
}
