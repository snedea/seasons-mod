// Halloween night in half-block pixels. Each terminal cell holds two square-ish
// pixels stacked (glyph U+2580, foreground = top pixel, background = bottom), so a
// band of 8 rows is a 16 pixel tall canvas as wide as the terminal.
//
// The look follows floweyes' scene engine (src/floweyes/web/frontend/scenes.js):
// seeded placement, slow oscillators, silhouettes against a moonlit sky. Nothing
// flashes: every change of brightness is a slow fade.
//
// Layers, back to front: sky, stars, moon, witch, clouds, hills and the haunted
// house, the dead tree and its owl, the cobweb, bats, ground, fence, ghost,
// tombstones, jack-o'-lanterns, Clawd, the bats Clawd's tool calls release, fog.

import type { Mood } from '../types'

type Bat = { x: number; y: number; vx: number; vy: number; age: number; seed: number }

type Layout = {
  W: number
  H: number
  gY: number
  horizon: number
  moon: { x: number; y: number; r: number }
  tree: number
  house: number
  stones: { x: number; kind: StoneKind }[]
  fence: [number, number]
  pumpkins: { x: number; big: boolean; phase: number }[]
  rest: number
  walk: [number, number]
}

type StoneKind = 'round' | 'cross' | 'small' | 'tall'

// -------------------------------------------------------------------- color

const LEVEL = 8 // 32 levels a channel (0..248): what the final ordered dither lands on

function snap(c: number): number {
  const q = (v: number) => Math.min(31, Math.round(v / LEVEL)) * LEVEL
  return (q((c >> 16) & 255) << 16) | (q((c >> 8) & 255) << 8) | q(c & 255)
}

function mix(a: number, b: number, t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k
  const bl = (a & 255) + ((b & 255) - (a & 255)) * k
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl)
}

// Flat sprite colors sit on the dither grid so they come out exact, with no
// pattern on them; gradients and blends between them dither.
const C = Object.fromEntries(
  Object.entries({
    skyTop: 0x0d0820, skyMid: 0x241340, skyLow: 0x47214e, ember: 0x7c3242, moonGlow: 0x9c8cc4,
    star: 0xf4eedc, starWarm: 0xffcf96, starCool: 0xbab4ff,
    moon: 0xf6e8b6, moonShade: 0xc9b07a, crater: 0xd8c18a,
    cloud: 0x3f3059, cloudRim: 0xbcaad4,
    hillFar: 0x2c1a3c, hillNear: 0x1e1230, house: 0x0b0614,
    windowLit: 0xf8a742, windowDim: 0x3f1f16, windowGhost: 0x8fe3a6,
    ground: 0x191024, grass: 0x2c1e3c, tree: 0x0a0610,
    owl: 0x2c2136, owlEye: 0xf8b94c,
    web: 0x9a92b4, spider: 0x07040b,
    bat: 0x07040c, witch: 0x050309, bristle: 0x1c1222,
    stone: 0x5e576e, stoneLit: 0x9088a6, stoneDark: 0x37314a, carve: 0x2a2436,
    fence: 0x0b0712,
    pumpkin: 0xe8741f, ridge: 0xb3531a, stem: 0x55762f, candle: 0xffd760, candleHot: 0xff9f38,
    glow: 0xff9433,
    bone: 0xd9d0bb, cornTip: 0xf6f1e2, cornMid: 0xf39a2b, cornBase: 0xf7d34a,
    ghost: 0xeae6f6, ghostEye: 0x281f3f,
    fog: 0x8f84ae,
    clawd: 0xd97757, clawdShade: 0xb45e44, eye: 0x1a0f1e,
    hat: 0x3d2368, hatLit: 0x6c42aa, band: 0xf38c28,
    lantern: 0xfff0a8, lanternFrame: 0x2b1e24, lanternGlow: 0xffb04a,
  }).map(([k, v]) => [k, snap(v)]),
) as Record<string, number>

// ------------------------------------------------------------------ helpers

function seeded(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const TAU = Math.PI * 2

// 4x4 Bayer thresholds, 0..1
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64(bytes: Uint8Array): string {
  const native = (bytes as Uint8Array & { toBase64?: () => string }).toBase64
  if (typeof native === 'function') return native.call(bytes)
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63]
  }
  const left = bytes.length - i
  if (left === 1) {
    const n = bytes[i] << 16
    out += B64[n >> 18] + B64[(n >> 12) & 63] + '=='
  } else if (left === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + '='
  }
  return out
}

// ------------------------------------------------------------------ sprites
// One character a pixel; '.' is transparent. Letters name colors per sprite.

const CLAWD_HAT = [
  '.....K...',
  '....KL...',
  '...KKL...',
  '..BBBBB..',
  'KKKKKKKKK',
]
const CLAWD_BODY = [
  '.XXXXXXX.',
  '.XXXXXXX.', // eyes are placed by look and blink
  'XXXXXXXXX',
  '.SSSSSSS.',
]
const LEGS_STAND = '.X.X.X.X.'
const LEGS_STEP_A = '..X.X.X.X'
const LEGS_STEP_B = 'X.X.X.X..'

const BAT_FRAMES = [
  ['K...K', '.KKK.', '.....'],
  ['.....', 'KKKKK', '.....'],
  ['.....', '.KKK.', 'K...K'],
  ['.....', 'KKKKK', '.....'],
]

const WITCH = [
  '......K...',
  '.....KK...',
  '....KKK...',
  '..KKKKKKK.',
  '....KK....',
  '...KKKK...',
  'KKKKKKKKbb',
  '......K.bb',
]

const HOUSE = [
  '...^.........',
  '..###....^...',
  '..#1#...###..',
  '..###..#####.',
  '.#####.#2#3#.',
  '#############',
  '#4#5##6##7#8#',
  '#############',
]

const GHOST = [
  '.WWW.',
  'WEWEW',
  'WWWWW',
  'WWWWW',
  'WWWWW',
]

const STONES: Record<StoneKind, string[]> = {
  round: ['.SSS.', 'SSSSS', 'S...S', 'SSSSS', 'SSSSS', 'SSSSS'],
  tall: ['.SSS.', 'SSSSS', 'S...S', 'SSSSS', 'S...S', 'SSSSS', 'SSSSS'],
  cross: ['..S..', '..S..', 'SSSSS', '..S..', '..S..', '..S..', '.SSS.'],
  small: ['.S.', 'SSS', 'SSS', 'SSS'],
}

const PUMPKIN_BIG = ['...G...', '.OOrOO.', 'OyOrOyO', 'OOyyyOO', '.OOrOO.']
const PUMPKIN_SMALL = ['..G..', '.OrO.', 'OyOyO', '.OOO.']

// -------------------------------------------------------------------- scene

export class Scene {
  t = 12 // seconds; starts where the first witch is a few seconds off
  mood: Mood = 'idle'

  private W = 0
  private H = 0
  private fb = new Uint32Array(0)
  private cover = new Float32Array(0)
  private L: Layout | null = null

  private x = -1
  private dir = 1
  private stride = 0
  private moved = false
  private pauseUntil = 0
  private nextPause = 0
  private cheerAt = -99
  private bats: Bat[] = []
  private seq = 0

  /** A turn finished: Clawd hops twice. */
  cheer(): void {
    this.cheerAt = this.t
  }

  /** A tool call: Clawd lets a bat go. */
  releaseBat(): void {
    if (this.bats.length >= 14) this.bats.shift()
    const s = ++this.seq
    const side = seeded(s * 31) > 0.5 ? 1 : -1
    const L = this.L
    const x = this.x >= 0 ? this.x + 4 : L ? L.rest : 20
    const y = L ? L.gY - 7 : 6
    this.bats.push({
      x, y, seed: s,
      vx: side * (9 + seeded(s * 37) * 8),
      vy: -(2.5 + seeded(s * 41) * 2.5),
      age: 0,
    })
  }

  /** Advances the world by `dt` seconds. */
  step(dt: number): void {
    this.t += dt
    const L = this.L
    for (const b of this.bats) {
      b.age += dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.vy += 0.9 * dt // they level off as they get away
    }
    this.bats = this.bats.filter(b => b.age < 9 && b.x > -8 && b.x < this.W + 8 && b.y > -4)
    if (!L) return
    if (this.x < 0) this.x = L.rest

    const speed = 7
    const before = this.x
    if (this.mood === 'working') {
      if (this.t >= this.nextPause && this.t >= this.pauseUntil) {
        this.pauseUntil = this.t + 1.2 + seeded(Math.floor(this.t)) * 1.2
        this.nextPause = this.pauseUntil + 4 + seeded(Math.floor(this.t) + 7) * 6
      }
      if (this.t >= this.pauseUntil) {
        this.x += this.dir * speed * dt
        if (this.x >= L.walk[1]) { this.x = L.walk[1]; this.dir = -1 }
        if (this.x <= L.walk[0]) { this.x = L.walk[0]; this.dir = 1 }
      }
    } else if (Math.abs(this.x - L.rest) > 0.4) {
      this.dir = L.rest > this.x ? 1 : -1
      this.x += this.dir * Math.min(speed * 1.3 * dt, Math.abs(L.rest - this.x))
    } else {
      this.x = L.rest
      this.dir = L.moon.x > this.x ? 1 : -1 // at rest, Clawd watches the moon
    }
    this.moved = this.x !== before
    this.stride += Math.abs(this.x - before)
  }

  /** The band's cells for `columns` x `rows`, packed as RasterProps.cells. */
  render(columns: number, rows: number): string {
    const W = columns
    const H = rows * 2
    if (W !== this.W || H !== this.H) {
      this.W = W
      this.H = H
      this.fb = new Uint32Array(W * H)
      this.cover = new Float32Array(W * H)
      this.L = layout(W, H)
      if (this.x >= 0) this.x = Math.min(Math.max(this.x, this.L.walk[0]), this.L.walk[1])
    }
    this.draw()
    return this.pack(columns, rows)
  }

  // ---------------------------------------------------------------- drawing

  private px(x: number, y: number, c: number): void {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return
    this.fb[y * this.W + x] = c
  }

  private blend(x: number, y: number, c: number, a: number): void {
    x = Math.round(x)
    y = Math.round(y)
    if (a <= 0 || x < 0 || y < 0 || x >= this.W || y >= this.H) return
    const i = y * this.W + x
    this.fb[i] = mix(this.fb[i], c, a)
  }

  private get(x: number, y: number): number {
    return this.fb[y * this.W + x]
  }

  private sprite(rows: string[], x0: number, y0: number, pal: Record<string, number>, flip = false): void {
    const w = rows[0].length
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < w; c++) {
        const ch = rows[r][flip ? w - 1 - c : c]
        const color = pal[ch]
        if (ch !== '.' && color !== undefined) this.px(x0 + c, y0 + r, color)
      }
    }
  }

  private line(x0: number, y0: number, x1: number, y1: number, c: number, a = 1): void {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      if (a >= 1) this.px(x0, y0, c)
      else this.blend(x0, y0, c, a)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) { err += dy; x0 += sx }
      if (e2 <= dx) { err += dx; y0 += sy }
    }
  }

  /** Soft light: a warm falloff blended over whatever is already there. */
  private glow(cx: number, cy: number, r: number, c: number, a: number): void {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const d = Math.hypot(x - cx, y - cy) / r
        if (d < 1) this.blend(x, y, c, a * (1 - d) * (1 - d))
      }
    }
  }

  private draw(): void {
    const L = this.L!
    const { W, H, t } = { W: this.W, H: this.H, t: this.t }

    this.drawSky(L)
    this.drawStars(L)
    this.drawMoon(L)
    this.drawWitch(L)
    this.drawClouds(L)
    this.drawLand(L)
    if (W >= 70) this.drawHouse(L)
    this.drawTree(L)
    if (W >= 50) this.drawCobweb(L)

    // three bats that live here, looping the sky
    for (let i = 0; i < 3; i++) {
      const span = W + 24
      const bx = ((t * (5 + i * 2.3) + i * span * 0.37) % span) - 12
      const by = 2 + i * 2.2 + Math.sin(t * 1.1 + i * 2) * 1.6
      const frame = BAT_FRAMES[Math.floor(t * 7 + i * 1.7) % 4]
      this.sprite(frame, bx - 2, by - 1, { K: C.bat })
    }

    this.drawGround(L)
    if (W >= 50) this.drawFence(L)
    if (W >= 50) this.drawGhost(L)
    for (const s of L.stones) this.drawStone(s.x, L.gY, s.kind)
    for (const p of L.pumpkins) this.drawPumpkin(L, p)
    this.drawClawd(L)

    for (const b of this.bats) {
      const frame = BAT_FRAMES[Math.floor(b.age * 9 + b.seed) % 4]
      this.sprite(frame, b.x - 2, b.y - 1 + Math.sin(b.age * 5 + b.seed) * 0.7, { K: C.bat })
    }

    this.drawFog(L)
    void H
  }

  private drawSky(L: Layout): void {
    const stops: [number, number][] = [[0, C.skyTop], [0.45, C.skyMid], [0.82, C.skyLow], [1, C.ember]]
    for (let y = 0; y < L.horizon + 1; y++) {
      const f = y / L.horizon
      let k = 0
      while (k < stops.length - 2 && f > stops[k + 1][0]) k++
      const [f0, c0] = stops[k]
      const [f1, c1] = stops[k + 1]
      const base = mix(c0, c1, (f - f0) / (f1 - f0))
      for (let x = 0; x < this.W; x++) {
        // the last of the sunset lingers low on the left
        const warm = Math.max(0, 1 - Math.abs(x / this.W - 0.2) * 2.2) * Math.max(0, f - 0.55) * 0.5
        this.fb[y * this.W + x] = mix(base, C.ember, warm)
      }
    }
  }

  private drawStars(L: Layout): void {
    const n = Math.round(this.W * 0.22)
    const { moon } = L
    for (let i = 0; i < n; i++) {
      const sx = Math.floor(seeded(i * 7 + 1) * this.W)
      const sy = Math.floor(seeded(i * 7 + 2) * (L.horizon - 3))
      if (Math.hypot(sx - moon.x, sy - moon.y) < moon.r + 3.5) continue
      const kind = seeded(i * 7 + 4)
      const color = kind > 0.9 ? C.starWarm : kind > 0.8 ? C.starCool : C.star
      const period = 3 + seeded(i * 7 + 3) * 5
      // a slow breath, never off: dim stars stay dim, bright ones swell
      const depth = 0.25 + seeded(i * 7 + 5) * 0.55
      const b = depth + (1 - depth) * (0.5 + 0.5 * Math.sin((this.t / period + i * 0.37) * TAU))
      const sky = this.get(sx, sy)
      this.px(sx, sy, mix(sky, color, b * (0.55 + 0.45 * depth)))
    }
  }

  private drawMoon(L: Layout): void {
    const { x: cx, y: cy, r } = L.moon
    const craters: [number, number, number][] = [[-1.4, -1.2, 0.95], [1.3, 0.8, 1.1], [-0.6, 1.9, 0.7], [1.6, -1.9, 0.55]]
    // moonlight in the sky around it, wide and faint: what the silhouettes stand against
    const reach = r * 6
    for (let y = 0; y <= L.horizon; y++) {
      for (let x = Math.max(0, Math.floor(cx - reach)); x <= Math.min(this.W - 1, Math.ceil(cx + reach)); x++) {
        const f = 1 - Math.hypot((x - cx) * 0.8, y - cy) / reach
        if (f > 0) this.blend(x, y, C.moonGlow, 0.16 * f * f)
      }
    }
    for (let y = Math.floor(cy - r - 4); y <= Math.ceil(cy + r + 4); y++) {
      for (let x = Math.floor(cx - r - 4); x <= Math.ceil(cx + r + 4); x++) {
        if (x < 0 || y < 0 || x >= this.W || y > L.horizon) continue
        const d = Math.hypot(x - cx, y - cy)
        if (d <= r) {
          // lit from the upper left, a soft terminator to the lower right
          const k = ((x - cx) * 0.55 + (y - cy) * 0.45) / r
          let c = mix(C.moon, C.moonShade, Math.max(0, k * 0.75 + 0.15))
          for (const [ox, oy, cr] of craters) {
            if (Math.hypot(x - cx - ox * (r / 4.3), y - cy - oy * (r / 4.3)) <= cr * (r / 4.3)) {
              c = mix(c, C.crater, 0.85)
            }
          }
          this.px(x, y, c)
        } else if (d <= r + 4) {
          const f = 1 - (d - r) / 4
          this.blend(x, y, C.moon, 0.2 * f * f)
        }
      }
    }
  }

  private drawWitch(L: Layout): void {
    const period = 53
    const cross = 10
    const p = (this.t % period) / cross
    if (p >= 1) return
    const x = this.W + 10 - p * (this.W + 22)
    const y = L.moon.y - 5 + Math.sin(p * TAU * 1.5) * 1.5
    this.sprite(WITCH, x, y, { K: C.witch, b: C.bristle })
  }

  private drawClouds(L: Layout): void {
    const { W, cover } = this
    const top = L.horizon - 1
    cover.fill(0, 0, W * (top + 1))
    const n = W >= 90 ? 4 : 3
    for (let i = 0; i < n; i++) {
      const span = W + 36
      const speed = 0.7 + seeded(i * 13 + 1) * 0.7
      const cx = ((this.t * speed + seeded(i * 13 + 2) * span) % span) - 18
      const cy = 1.5 + i * (L.horizon - 5) / n + seeded(i * 13 + 3) * 1.2
      const puffs = 4 + Math.floor(seeded(i * 13 + 4) * 3)
      for (let p = 0; p < puffs; p++) {
        const px = cx + (p - puffs / 2) * 3.2 + seeded(i * 97 + p) * 1.5
        const py = cy + (seeded(i * 89 + p) - 0.5) * 1.6
        const rx = 2.6 + seeded(i * 83 + p) * 2.4
        const ry = 1.1 + seeded(i * 79 + p) * 0.9
        for (let y = Math.max(0, Math.floor(py - ry)); y <= Math.min(top, Math.ceil(py + ry)); y++) {
          for (let x = Math.max(0, Math.floor(px - rx)); x <= Math.min(W - 1, Math.ceil(px + rx)); x++) {
            const v = 1 - ((x - px) / rx) ** 2 - ((y - py) / ry) ** 2
            if (v > 0) cover[y * W + x] = Math.max(cover[y * W + x], Math.min(1, v * 2.2))
          }
        }
      }
    }
    const { moon } = L
    for (let y = 0; y <= top; y++) {
      for (let x = 0; x < W; x++) {
        const v = cover[y * W + x]
        if (v <= 0) continue
        // the moon silvers the top edge of a cloud near it
        const above = y > 0 ? cover[(y - 1) * W + x] : 0
        const near = Math.max(0, 1 - Math.hypot(x - moon.x, y - moon.y) / (moon.r * 5))
        const rim = above < v * 0.5 ? near * 0.9 : near * 0.25
        this.blend(x, y, mix(C.cloud, C.cloudRim, rim), 0.62 * v)
      }
    }
  }

  private skyline(L: Layout, x: number): number {
    const far = 1.6 + Math.sin(x * 0.045 + 1) * 1.1 + Math.sin(x * 0.11 + 4) * 0.6
    const hillX = (x - L.house - 6) / 12
    const near = this.W >= 70 ? Math.max(0, 3.2 - hillX * hillX * 3.2) : 0
    return L.horizon - Math.max(far, near)
  }

  private drawLand(L: Layout): void {
    for (let x = 0; x < this.W; x++) {
      const top = Math.round(this.skyline(L, x))
      for (let y = Math.max(0, top); y < L.gY; y++) {
        const f = (y - top) / Math.max(1, L.gY - top)
        this.px(x, y, mix(C.hillFar, C.hillNear, f))
      }
    }
  }

  private drawHouse(L: Layout): void {
    const x0 = L.house
    const y0 = Math.round(this.skyline(L, x0 + 6)) - HOUSE.length + 2
    const pal: Record<string, number> = { '#': C.house, '^': C.house }
    for (let k = 1; k <= 8; k++) {
      // each window keeps its own slow hours; window 2 is the one nobody lives in
      const phase = seeded(k * 23) * TAU
      const lit = 0.5 + 0.5 * Math.sin(this.t / (9 + k * 2.3) * TAU + phase)
      const on = seeded(k * 29) > 0.3
      pal[String(k)] = k === 2
        ? mix(C.house, C.windowGhost, 0.15 + 0.6 * lit * lit)
        : on ? mix(C.windowDim, C.windowLit, 0.55 + 0.45 * lit) : mix(C.house, C.windowDim, 0.6 * lit)
    }
    this.sprite(HOUSE, x0, y0, pal)
  }

  private drawTree(L: Layout): void {
    const tx = L.tree
    const c = C.tree
    for (let y = 3; y < L.gY; y++) { this.px(tx, y, c); this.px(tx + 1, y, c) }
    this.px(tx - 1, L.gY - 1, c); this.px(tx + 2, L.gY - 1, c); this.px(tx + 3, L.gY - 1, c)
    this.line(tx + 1, 6, tx + 7, 3, c)
    this.line(tx + 7, 3, tx + 9, 1, c)
    this.line(tx + 7, 3, tx + 10, 4, c)
    this.line(tx, 7, tx - 3, 4, c)
    this.line(tx - 3, 4, tx - 4, 1, c)
    this.line(tx - 3, 4, tx - 5, 5, c)
    this.line(tx + 1, 9, tx + 5, 8, c)
    this.line(tx + 1, 3, tx + 2, 0, c)
    this.line(tx, 3, tx - 1, 1, c)
    // the owl, on the long branch
    const ox = tx + 4
    const oy = 1
    const blink = (this.t % 6.3) < 0.2
    const look = Math.floor(this.t / 4.1) % 3 === 2 ? 1 : 0
    this.sprite(['O.O', 'OOO', 'OOO'], ox, oy, { O: C.owl })
    if (!blink) { this.px(ox + look, oy + 1, C.owlEye); this.px(ox + 1 + look, oy + 1, C.owlEye) }
  }

  private drawCobweb(L: Layout): void {
    const x0 = this.W - 1
    const ends: [number, number][] = [[x0 - 7, 0], [x0 - 6, 3], [x0 - 3, 5], [x0, 6]]
    for (const [ex, ey] of ends) this.line(x0, 0, ex, ey, C.web, 0.3)
    for (const f of [0.45, 0.8]) {
      for (let i = 0; i < ends.length - 1; i++) {
        const [ax, ay] = ends[i], [bx, by] = ends[i + 1]
        this.line(Math.round(x0 + (ax - x0) * f), Math.round(ay * f), Math.round(x0 + (bx - x0) * f), Math.round(by * f), C.web, 0.22)
      }
    }
    // a spider, letting itself down and climbing back
    const sx = x0 - 9
    const drop = 2 + Math.round((0.5 - 0.5 * Math.cos(this.t / 11 * TAU)) * (L.horizon - 5))
    this.line(sx, 0, sx, drop - 1, C.web, 0.28)
    this.px(sx, drop, C.spider); this.px(sx + 1, drop, C.spider)
    this.blend(sx - 1, drop, C.spider, 0.6); this.blend(sx + 2, drop, C.spider, 0.6)
    void L
  }

  private drawGround(L: Layout): void {
    for (let y = L.gY; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        const tuft = y === L.gY && seeded(x * 3 + 900) > 0.55
        this.px(x, y, tuft ? C.grass : mix(C.ground, C.grass, 0.25 * seeded(x * 5 + y * 101)))
      }
    }
    for (let x = 0; x < this.W; x++) {
      if (seeded(x * 11 + 300) > 0.8) this.px(x, L.gY - 1, C.grass)
    }
    // a bone, and two pieces of candy corn somebody dropped
    const bx = Math.round(this.W * 0.42)
    this.px(bx, L.gY, C.bone); this.px(bx + 1, L.gY, C.bone); this.px(bx + 2, L.gY, C.bone)
    this.px(bx - 1, L.gY - 1, C.bone); this.px(bx + 3, L.gY - 1, C.bone)
    const p = L.pumpkins[0]
    for (const cx of [p.x - 3, p.x + 17]) {
      this.px(cx, L.gY - 3, C.cornTip); this.px(cx, L.gY - 2, C.cornMid); this.px(cx, L.gY - 1, C.cornBase)
    }
  }

  private drawFence(L: Layout): void {
    const [a, b] = L.fence
    for (let x = a; x <= b; x++) {
      const post = (x - a) % 3 === 0
      const missing = post && seeded(x * 17 + 5) > 0.82
      if (post && !missing) {
        for (let y = L.gY - 4; y < L.gY; y++) this.px(x, y, C.fence)
        this.px(x, L.gY - 5, C.fence)
      }
      if (seeded(Math.floor(x / 3) * 19) > 0.12) {
        this.px(x, L.gY - 2, C.fence)
        this.px(x, L.gY - 4, C.fence)
      }
    }
  }

  private drawGhost(L: Layout): void {
    const home = L.stones[1] ?? L.stones[0]
    if (!home) return
    // it drifts out from behind its stone, wanders, and goes back in
    const roam = 0.5 - 0.5 * Math.cos(this.t / 26 * TAU)
    const x = home.x + 1 + Math.sin(this.t / 9 * TAU) * 6 * roam
    const y = L.gY - 7 - roam * 3 + Math.sin(this.t * 1.7) * 0.8
    const a = 0.35 + 0.45 * roam
    const hem = Math.floor(this.t * 3) % 2 === 0 ? 'W.W.W' : '.W.W.'
    const rows = [...GHOST, hem]
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < 5; c++) {
        const ch = rows[r][c]
        if (ch === 'W') this.blend(x + c, y + r, C.ghost, a)
        if (ch === 'E') this.blend(x + c, y + r, C.ghostEye, a)
      }
    }
  }

  private drawStone(x0: number, gY: number, kind: StoneKind): void {
    const rows = STONES[kind]
    const y0 = gY - rows.length
    const w = rows[0].length
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < w; c++) {
        const ch = rows[r][c]
        if (ch === '.') {
          // the carving: dark only where it sits inside the stone
          if (r > 0 && c > 0 && c < w - 1 && rows[r][0] === 'S' && rows[r][w - 1] === 'S') this.px(x0 + c, y0 + r, C.carve)
          continue
        }
        const lastS = rows[r].lastIndexOf('S')
        const firstS = rows[r].indexOf('S')
        // moonlight from the right: lit right edge, shaded left
        const color = c === lastS ? C.stoneLit : c === firstS ? C.stoneDark : C.stone
        this.px(x0 + c, y0 + r, color)
      }
    }
  }

  private drawPumpkin(L: Layout, p: { x: number; big: boolean; phase: number }): void {
    const rows = p.big ? PUMPKIN_BIG : PUMPKIN_SMALL
    const y0 = L.gY - rows.length + 1
    // a candle breathes: three slow sines, never a hard cut
    const t = this.t + p.phase
    const flick = 0.78 + 0.1 * Math.sin(t * 2.1) + 0.07 * Math.sin(t * 5.3 + 1) + 0.05 * Math.sin(t * 8.9 + 2)
    const w = rows[0].length
    this.glow(p.x + w / 2, y0 + 2, p.big ? 6 : 4, C.glow, 0.22 * flick)
    this.sprite(rows, p.x, y0, {
      O: C.pumpkin, r: C.ridge, G: C.stem, y: mix(C.candleHot, C.candle, flick),
    })
  }

  private drawClawd(L: Layout): void {
    const x0 = Math.round(this.x)
    const t = this.t
    const working = this.mood === 'working'
    const hopP = (t - this.cheerAt) / 1.2
    const hop = hopP >= 0 && hopP < 1 ? Math.round(3 * Math.abs(Math.sin(hopP * TAU))) : 0
    const feet = L.gY - 1 - hop
    const top = feet - CLAWD_BODY.length
    const flip = this.dir < 0

    // lantern light first, so it falls on the ground and the stones behind
    const lx = this.dir > 0 ? x0 + 9 : x0 - 1
    const flick = 0.85 + 0.1 * Math.sin(t * 2.7) + 0.05 * Math.sin(t * 7.1)
    if (working) this.glow(lx, top + 3, 7, C.lanternGlow, 0.45 * flick)

    if (this.H >= 12) { // at 12 the tip clips; the brim and crown still read
      // the hat's tip droops one way at rest and trails behind on the move
      const hat = CLAWD_HAT.slice()
      const sway = this.moved ? 0 : Math.floor(t / 1.7) % 2
      if (sway) hat[0] = '......K..'
      this.sprite(hat, x0, top - hat.length, { K: C.hat, L: C.hatLit, B: C.band }, flip)
    }

    const cheering = hop > 0
    const body = CLAWD_BODY.map(r => r)
    if (cheering) {
      body[1] = 'XXXXXXXXX' // arms up
      body[2] = '.XXXXXXX.'
    }
    this.sprite(body, x0, top, { X: C.clawd, S: C.clawdShade })

    // a blink every few seconds, and every other time a double blink
    const b = t % 9.4
    const blink = b % 4.7 < 0.14 || (b > 5.05 && b < 5.19)
    if (!blink) {
      const look = this.dir > 0 ? 1 : 0
      this.px(x0 + 1 + look, top + 1, C.eye)
      this.px(x0 + 5 + look, top + 1, C.eye)
    }

    const stepping = this.moved && hop === 0
    const legs = stepping ? (Math.floor(this.stride) % 2 ? LEGS_STEP_A : LEGS_STEP_B) : LEGS_STAND
    this.sprite([legs], x0, feet, { X: C.clawd })

    if (working) {
      this.px(lx, top + 2, C.lanternFrame)
      this.px(lx, top + 3, mix(C.lanternGlow, C.lantern, flick))
      this.px(lx, top + 4, C.lanternFrame)
    }
  }

  private drawFog(L: Layout): void {
    const band = 5
    const y0 = this.H - band
    for (let y = y0; y < this.H; y++) {
      const fall = (y - y0 + 1) / band
      for (let x = 0; x < this.W; x++) {
        const a = Math.sin(x * 0.13 + this.t * 0.35) * 0.5 + 0.5
        const b = Math.sin(x * 0.051 - this.t * 0.21 + 1.3) * 0.5 + 0.5
        this.blend(x, y, C.fog, 0.3 * a * b * fall)
      }
    }
    void L
  }

  // ---------------------------------------------------------------- packing

  private pack(columns: number, rows: number): string {
    const W = this.W
    const words = new Uint32Array(columns * rows * 3)
    const q = (v: number, d: number) => {
      const n = Math.floor((v + (d - 0.5) * LEVEL) / LEVEL + 0.5)
      return (n < 0 ? 0 : n > 31 ? 31 : n) * LEVEL
    }
    const dither = (c: number, x: number, y: number) => {
      const d = BAYER[(y & 3) * 4 + (x & 3)]
      return (q((c >> 16) & 255, d) << 16) | (q((c >> 8) & 255, d) << 8) | q(c & 255, d)
    }
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < columns; cx++) {
        const i = (cy * columns + cx) * 3
        words[i] = 0x2580
        words[i + 1] = dither(this.fb[cy * 2 * W + cx], cx, cy * 2)
        words[i + 2] = dither(this.fb[(cy * 2 + 1) * W + cx], cx, cy * 2 + 1)
      }
    }
    return base64(new Uint8Array(words.buffer))
  }
}

function layout(W: number, H: number): Layout {
  const gY = H - 3
  const horizon = H - 6
  const tree = Math.max(5, Math.round(W * 0.04))
  const p0 = Math.max(tree + 12, Math.round(W * 0.13))
  const pumpkins = [
    { x: p0, big: true, phase: 0 },
    { x: p0 + 8, big: false, phase: 1.7 },
    { x: Math.round(W * 0.9) - 4, big: true, phase: 3.1 },
  ]
  const kinds: StoneKind[] = ['round', 'cross', 'small', 'tall', 'round', 'small']
  const g0 = Math.round(W * 0.46)
  const g1 = Math.round(W * 0.7)
  const count = Math.max(2, Math.min(kinds.length, Math.floor((g1 - g0) / 7)))
  const stones = Array.from({ length: count }, (_, i) => ({
    x: Math.round(g0 + 2 + (i * (g1 - g0 - 8)) / Math.max(1, count - 1)),
    kind: kinds[i],
  }))
  return {
    W, H, gY, horizon,
    moon: { x: Math.round(W * 0.76), y: Math.round(H * 0.3), r: H >= 14 ? 4.3 : 3.2 },
    tree,
    house: Math.round(W * 0.3),
    stones,
    fence: [g0 - 2, g1 + 2],
    pumpkins,
    rest: p0 + 14,
    walk: [p0 + 13, Math.round(W * 0.9) - 15],
  }
}

// -------------------------------------------------------------------- words

const VERBS = [
  'Conjuring', 'Brewing', 'Haunting', 'Summoning', 'Bewitching', 'Hexing', 'Cackling',
  'Lurking', 'Scheming', 'Spellcasting', 'Moonlighting', 'Carving', 'Creeping', 'Skulking',
  'Divining', 'Enchanting', 'Stirring the cauldron', 'Rattling bones', 'Consulting the spirits',
  'Raising the dead', 'Reading the tea leaves', 'Trick-or-treating',
]
const PAST = [
  'Conjured', 'Brewed', 'Haunted', 'Summoned', 'Bewitched', 'Hexed', 'Cackled', 'Lurked',
  'Schemed', 'Spellcast', 'Carved', 'Crept', 'Skulked', 'Divined', 'Enchanted',
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
