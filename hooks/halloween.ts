// Halloween, drawn into the chrome Claude Code already has instead of a band of its
// own: the logo block (Clawd in a witch hat, the title in pumpkin orange, a moon
// and a corner cobweb with its spider), one row of graveyard under it, and the
// prompt box (a corner web at its right end, a spider on the top border, a ghost on
// the bottom one). Nothing flashes: every light change is a slow fade.

import { Canvas, cobweb, mix, type Run } from './canvas'
import type { Mood } from '../types'

export const C = {
  clawd: 0xd97757, clawdShade: 0xb45e44, eye: 0x1a0f1e,
  hat: 0x3d2368, hatLit: 0x6c42aa, band: 0xf38c28,
  lantern: 0xfff0a8, lanternFrame: 0x5a4250, lanternGlow: 0xffb04a,
  pumpkin: 0xe8741f, ridge: 0xb3531a, stem: 0x55762f, candle: 0xffd760, candleHot: 0xff9f38,
  moon: 0xf6e8b6, moonShade: 0xc9b07a, crater: 0xd8c18a, cloud: 0x3f3059,
  web: 0x8a83a6, webDim: 0x5c5674, spider: 0xd8d0ec,
  bat: 0x7a68a0,
  stone: 0x5e576e, stoneDark: 0x37314a, grass: 0x3a2a4e,
  ghost: 0xeae6f6, ghostEye: 0x281f3f,
  title: 0xf0883a, version: 0x8f84ae, tagline: 0xa08cd0,
  borderCool: 0x6c42aa, borderWarm: 0xd06a28,
}

function seeded(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const CLAWD_HAT = ['.....K...', '....KL...', '...KKL...', '..BBBBB..', 'KKKKKKKKK']
const CLAWD_BODY = ['.XXXXXXX.', '.XXXXXXX.', 'XXXXXXXXX', '.SSSSSSS.']
const CLAWD_LEGS = '.X.X.X.X.'
const BAT = [
  ['X..X..X', '.XX.XX.'],
  ['...X...', 'XXX.XXX'],
]
const GHOST = ['.WWW.', 'WEWEW', 'WWWWW', 'W.W.W']
const PUMPKIN = ['.g.', 'OyO', 'OOO']
const STONES = [
  ['.S.', 'SSS', 'SDS'],
  ['.S.', 'SSS', '.S.'],
  ['SS', 'SD'],
]

const TAGLINES = [
  'happy haunting', 'trick or treat', 'the build is haunted', 'boo.',
  'something wicked this way compiles', 'no bugs, only ghosts',
]

const SPIDER = 'ж'
const KNOT = '⁘'
const GHOST_GLYPH = 'ᗣ'

/** The header's six rows: the blank row over the logo, its three, the blank under, the notice. */
export const HEADER_ROWS = 6

export type HeaderInfo = { columns: number; version: string; cwd: string }

type Bat = { x: number; age: number; vx: number; seed: number }

/**
 * Everything that moves. One clock drives both drawings, so a tool call can
 * send a bat across the header and leave a knot of silk on the prompt at once.
 */
export class Haunt {
  t = 0
  mood: Mood = 'idle'
  /** How far the greeting spider has let itself down, 0..1; null once it is home. */
  greet: number | null = 0
  private greetDir = 1
  private hopAt = -99
  private bats: Bat[] = []
  private seq = 0

  // prompt
  private spiderX = -1
  private stride = 0
  private typedAt = -99
  private caret = 4
  private wanderTo: number | null = null
  private nextWander = 25
  private patrolDir = 1
  private knots: number[] = []
  private ghostX = -1
  private ghostSeen = 0

  step(dt: number, promptColumns: number): void {
    this.t += dt
    for (const b of this.bats) {
      b.age += dt
      b.x += b.vx * dt
    }
    this.bats = this.bats.filter(b => b.age < 12)

    if (this.greet !== null) {
      this.greet = this.greet + this.greetDir * dt * (this.greetDir > 0 ? 0.3 : 1.2)
      if (this.greet >= 1) this.greet = 1
      if (this.greet <= 0 && this.greetDir < 0) this.greet = null
    }

    const W = promptColumns
    if (W > 0) {
      if (this.spiderX < 0) this.spiderX = spiderHome(W)
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
      if (Math.abs(this.spiderX - target) < 0.5) this.patrolDir = -this.patrolDir
    } else {
      if (this.wanderTo === null && this.t > this.nextWander) {
        this.wanderTo = lo + seeded(Math.floor(this.t)) * (hi - lo - WEB_COLUMNS)
      }
      target = this.wanderTo ?? spiderHome(W)
      if (this.wanderTo !== null && Math.abs(this.spiderX - this.wanderTo) < 0.5) {
        this.wanderTo = null
        this.nextWander = this.t + 20 + seeded(Math.floor(this.t) + 3) * 20
      }
    }
    target = Math.max(lo, Math.min(hi, target))
    // spiders scuttle: quick to the caret, an easy patrol, a slow wander
    const speed = chasing ? 45 : this.mood === 'working' ? 9 : 6
    const before = this.spiderX
    const d = target - this.spiderX
    this.spiderX += Math.sign(d) * Math.min(Math.abs(d), speed * dt)
    this.stride += Math.abs(this.spiderX - before)
    // at rest the spider tidies up: silk it walks over is taken back in
    if (this.mood === 'idle') {
      const x = Math.round(this.spiderX)
      this.knots = this.knots.filter(k => k !== x)
    }

    if (this.mood === 'working') {
      this.ghostSeen = Math.min(1, this.ghostSeen + dt / 1.5)
      if (this.ghostX < 0) this.ghostX = W - 10
      this.ghostX -= dt * 2.2
      if (this.ghostX < 8) this.ghostX = W - 10
    } else {
      this.ghostSeen = Math.max(0, this.ghostSeen - dt / 2.5)
      if (this.ghostSeen === 0) this.ghostX = -1
    }
  }

  /** A turn finished: Clawd hops. */
  cheer(): void {
    this.hopAt = this.t
  }

  /** A tool call: a bat leaves Clawd's hat and the spider ties a knot. */
  toolCall(): void {
    if (this.bats.length >= 6) this.bats.shift()
    const s = ++this.seq
    this.bats.push({ x: 6, age: 0, vx: 9 + seeded(s * 37) * 7, seed: s })
    const x = Math.round(this.spiderX)
    if (!this.knots.includes(x) && this.knots.length < 24) this.knots.push(x)
  }

  /** The person typed; the spider comes over to see. `column` is the caret's. */
  typed(column: number): void {
    this.typedAt = this.t
    this.caret = column
  }

  /** The first prompt went in: the greeting spider climbs home. */
  dismissGreeting(): void {
    if (this.greet !== null) this.greetDir = -1
  }

  // ------------------------------------------------------------------ header

  /** The header's cells, HEADER_ROWS tall and `columns` wide. */
  header({ columns: W, version, cwd }: HeaderInfo): Canvas {
    const cv = new Canvas(W, HEADER_ROWS)
    const t = this.t

    this.graveyard(cv, W, cwd)

    // Clawd, in a witch hat, where the logo's Clawd sits
    const since = t - this.hopAt
    const hop = since < 0.9 ? Math.round(Math.abs(Math.sin((since / 0.9) * Math.PI * 2)) * 1.4) : 0
    const y0 = 0 - hop
    cv.sprite(0, y0, CLAWD_HAT, { K: C.hat, L: C.hatLit, B: C.band })
    cv.sprite(0, y0 + 5, CLAWD_BODY, { X: C.clawd, S: C.clawdShade })
    const step = this.mood === 'working' && Math.floor(t * 3) % 2 === 1
    cv.sprite(0, y0 + 9, [step ? '..X.X.X.X' : CLAWD_LEGS], { X: C.clawd })
    const blink = t % 6.3 < 0.16
    const look = this.mood === 'working' ? Math.round(Math.sin(t * 1.3)) : t % 14 < 9 ? 1 : 0
    if (!blink) {
      cv.px(2 + look, y0 + 6, C.eye)
      cv.px(6 + look, y0 + 6, C.eye)
    }
    if (this.mood === 'working') {
      // a lantern held out, breathing slowly
      const glow = mix(C.lanternGlow, C.lantern, 0.5 + 0.5 * Math.sin(t * 1.6))
      cv.px(9, y0 + 7, C.clawd)
      cv.px(10, y0 + 6, C.lanternFrame)
      cv.px(10, y0 + 7, glow)
      cv.px(10, y0 + 8, C.lanternFrame)
    }

    // the title line, Halloween colors and a tagline that changes now and then
    const title = 'Claude Code'
    const ver = ` v${version}`
    cv.text(11, 1, title, C.title)
    cv.text(11 + title.length, 1, ver, C.version)
    const tag = TAGLINES[Math.floor(t / 40) % TAGLINES.length]
    const tagX = 11 + title.length + ver.length + 3
    const room = this.moonX(W) - 5 - tagX
    if (room >= tag.length + 4) cv.text(tagX, 1, `~ ${tag} ~`, C.tagline)

    this.moon(cv, W)

    // bats from Clawd's hat, across the blank row above the logo
    for (const b of this.bats) {
      const frame = BAT[Math.floor(b.age * 7) % 2]
      cv.sprite(Math.round(b.x), 0, frame, { X: C.bat })
    }

    // the cobweb in the top right corner, and its spider on a thread
    const ax = W * 2 - 1
    cobweb(cv, ax, 0, 30, 19, -1, 1, C.webDim, Math.sin(t * 0.7) * 0.4)
    const sx = W - 9
    const rest = 11 + Math.sin(t * 1.1) * 1.2
    const low = this.mood === 'working' ? 17 + Math.sin(t * 0.8) * 1.5 : rest
    const sy = this.greet !== null ? HEADER_ROWS * 4 : Math.round(low)
    for (let dy = 1; dy < sy; dy++) cv.dot(sx * 2, dy, C.webDim)
    if (this.greet === null) cv.text(sx, Math.min(HEADER_ROWS - 1, Math.floor(sy / 4)), SPIDER, C.spider)
    return cv
  }

  /** Where the left edge of the moon falls; the tagline stops short of it. */
  moonX(W: number): number {
    return W - 22
  }

  private moon(cv: Canvas, W: number): void {
    if (W < 70) return
    const cx = this.moonX(W) + 4
    const cy = 4.5
    const r = 3.6
    for (let py = 0; py < 10; py++) {
      for (let x = cx - 5; x <= cx + 5; x++) {
        const dx = x - cx
        const dy = py - cy
        if (dx * dx + dy * dy > r * r) continue
        const shade = dx < -1.8 ? C.moonShade : (x * 7 + py * 3) % 11 === 0 ? C.crater : C.moon
        cv.px(x, py, shade)
      }
    }
    // one cloud drifting past, slowly
    const cloudX = cx - 14 + ((this.t * 0.6) % 30)
    for (let i = 0; i < 8; i++) {
      const x = Math.round(cloudX) + i
      if (Math.abs(x - cx) <= 5) cv.px(x, i < 2 || i > 5 ? 6 : 5, C.cloud)
    }
  }

  private graveyard(cv: Canvas, W: number, cwd: string): void {
    const t = this.t
    const g = HEADER_ROWS * 2 - 1 // the bottom pixel row
    for (let x = 0; x < W; x++) if (seeded(x * 13) > 0.82) cv.px(x, g, C.grass)
    // two jack-o'-lanterns at Clawd's feet, candles breathing
    for (const [x, phase] of [[11, 0], [15, 2.1]] as const) {
      const lit = mix(C.candleHot, C.candle, 0.5 + 0.5 * Math.sin(t * 1.4 + phase))
      cv.sprite(x, g - 2, PUMPKIN, { g: C.stem, O: C.pumpkin, y: lit })
    }
    // tombstones scattered right of the path line
    const from = Math.min(W - 10, 11 + cwd.length + 4)
    let x = from
    let i = 0
    while (x < W - 26) {
      const stone = STONES[Math.floor(seeded(i * 7 + 1) * STONES.length)]
      cv.sprite(x, g - stone.length + 1, stone, { S: C.stone, D: C.stoneDark })
      x += 7 + Math.floor(seeded(i * 11 + 5) * 14)
      i++
    }
    // the ghost that lives here drifts up and down the yard
    const span = Math.max(1, W - 32 - 20)
    const gx = 20 + Math.round(span / 2 + (Math.sin(t * 0.11) * span) / 2)
    const eyes = t % 9 < 0.2 ? C.ghost : C.ghostEye
    cv.sprite(gx, g - 3, GHOST, { W: C.ghost, E: eyes })
  }

  /** The greeting thread under the header, `rows` tall: silk and, at its end, the spider. */
  greeting(rows: number): Canvas {
    const cv = new Canvas(1, rows)
    if (this.greet === null) return cv
    const eased = 1 - Math.pow(1 - Math.max(0, this.greet), 3)
    const len = Math.round(eased * (rows - 1))
    for (let y = 0; y < len; y++) cv.text(0, y, '⡇', C.webDim)
    if (this.greet > 0) cv.text(0, len, SPIDER, C.spider)
    return cv
  }

  // ------------------------------------------------------------------ prompt

  /**
   * The prompt box's decorations, one canvas row per screen row from the row
   * over the box down to the hint line: 0 over the box, 1 its top border, then
   * `rows` of draft, its bottom border, `status` rows of status line, the hint.
   * The web hangs at the right, away from the draft and the newest text.
   */
  prompt(W: number, paintBorder: boolean, rows: number, status: number): Canvas {
    const cv = new Canvas(W, 4 + rows + status)
    const t = this.t
    const top = 1
    const bottom = 2 + rows
    if (paintBorder) {
      for (let x = 0; x < W; x++) {
        const k = x / Math.max(1, W - 1)
        cv.text(x, top, '─', mix(C.borderCool, C.borderWarm, k))
        cv.text(x, bottom, '─', mix(C.borderWarm, C.borderCool, k))
      }
    }
    // a corner web strung from the box's top right corner down the right edge
    const reach = (rows + status + 2) * 4 - 1
    cobweb(cv, W * 2 - 1, top * 4 + 1, WEB_COLUMNS * 2 - 4, Math.min(reach, 24), -1, 1, C.web, 0, 5, [0.3, 0.62, 1])

    for (const k of this.knots) cv.text(k, top, KNOT, C.web)

    const sx = Math.round(this.spiderX < 0 ? spiderHome(W) : this.spiderX)
    const moving = Math.abs(this.stride % 2) < 1
    cv.text(sx, top, moving ? SPIDER : 'Ж', C.spider)

    if (this.ghostSeen > 0 && this.ghostX >= 0) {
      const color = mix(C.borderWarm, C.ghost, this.ghostSeen)
      cv.text(Math.round(this.ghostX), bottom, GHOST_GLYPH, color)
    }
    return cv
  }
}

/** Columns at the right of the prompt box the web takes. */
export const WEB_COLUMNS = 22

/** Where the prompt's spider rests: on the top border, at the web's hub. */
function spiderHome(W: number): number {
  return W - WEB_COLUMNS / 2
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

/** Sparse runs of one canvas row, between two columns. */
export function sparse(cv: Canvas, y: number, x0: number, x1: number): Run[] {
  return cv.runs(y, x0, x1)
}

// -------------------------------------------------------------------- words

const VERBS = [
  'Conjuring', 'Brewing', 'Haunting', 'Summoning', 'Bewitching', 'Hexing', 'Cackling',
  'Lurking', 'Scheming', 'Spellcasting', 'Moonlighting', 'Carving', 'Creeping', 'Skulking',
  'Divining', 'Enchanting', 'Stirring the cauldron', 'Rattling bones', 'Consulting the spirits',
  'Raising the dead', 'Reading the tea leaves', 'Trick-or-treating', 'Spinning webs',
]
const PAST = [
  'Conjured', 'Brewed', 'Haunted', 'Summoned', 'Bewitched', 'Hexed', 'Cackled', 'Lurked',
  'Schemed', 'Spellcast', 'Carved', 'Crept', 'Skulked', 'Divined', 'Enchanted', 'Spun',
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** The spinner's word for this turn, picked by the engine's own so it holds still. */
export function spookyWord(word: string): string {
  return VERBS[hash(word) % VERBS.length]
}

export function spookyPast(word: string): string {
  return PAST[hash(word) % PAST.length]
}

/** October, in the person's local time. */
export function isHalloweenSeason(ms: number): boolean {
  return new Date(ms).getMonth() === 9
}
