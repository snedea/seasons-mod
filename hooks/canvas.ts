// A grid of terminal cells that mixes three kinds of drawing: glyphs (text),
// half-block pixels (two stacked pixels a cell, U+2580/U+2584/U+2588) and braille
// dots (2x4 dots a cell, U+2800..). The last kind drawn into a cell wins; pixels
// merge with pixels and dots with dots. Cells nothing drew stay blank, so a slice
// can be packed as a Raster (blank = a space on the terminal's own background) or
// read back as sparse runs that leave whatever is underneath alone.

export const DEFAULT = 0x01000000 // the terminal's own color, as a Raster takes it

const BLANK = 0
const GLYPH = 1
const PIXEL = 2
const DOTS = 3

const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

export function mix(a: number, b: number, t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k
  const bl = (a & 255) + ((b & 255) - (a & 255)) * k
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl)
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function base64(bytes: Uint8Array): string {
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

export type Run = { x: number; y: number; text: string; color: number }

export class Canvas {
  readonly kind: Uint8Array
  readonly code: Uint32Array
  readonly fg: Uint32Array
  readonly bg: Uint32Array
  private readonly top: Int32Array
  private readonly bottom: Int32Array

  constructor(readonly W: number, readonly H: number) {
    const n = W * H
    this.kind = new Uint8Array(n)
    this.code = new Uint32Array(n)
    this.fg = new Uint32Array(n)
    this.bg = new Uint32Array(n)
    this.top = new Int32Array(n).fill(-1)
    this.bottom = new Int32Array(n).fill(-1)
  }

  private at(x: number, y: number): number {
    return x < 0 || y < 0 || x >= this.W || y >= this.H ? -1 : y * this.W + x
  }

  /** Text, one code point a cell; a space in it paints a blank cell. */
  text(x: number, y: number, s: string, color: number): void {
    let i = 0
    for (const ch of s) {
      const c = this.at(x + i++, y)
      if (c < 0) continue
      this.kind[c] = GLYPH
      this.code[c] = ch.codePointAt(0) ?? 0x20
      this.fg[c] = color
      this.bg[c] = DEFAULT
    }
  }

  /** One half-block pixel; `py` counts two pixels a row. */
  px(x: number, py: number, color: number): void {
    const c = this.at(x, Math.floor(py / 2))
    if (c < 0 || py < 0) return
    if (this.kind[c] !== PIXEL) {
      this.kind[c] = PIXEL
      this.top[c] = -1
      this.bottom[c] = -1
    }
    if (py % 2 === 0) this.top[c] = color
    else this.bottom[c] = color
    const t = this.top[c]
    const b = this.bottom[c]
    if (t >= 0 && b >= 0) {
      this.code[c] = t === b ? 0x2588 : 0x2580
      this.fg[c] = t
      this.bg[c] = t === b ? DEFAULT : b
    } else {
      this.code[c] = t >= 0 ? 0x2580 : 0x2584
      this.fg[c] = t >= 0 ? t : b
      this.bg[c] = DEFAULT
    }
  }

  /** A sprite: one string a pixel row, '.' transparent, other letters by `colors`. */
  sprite(x: number, py: number, rows: readonly string[], colors: Record<string, number>): void {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const color = colors[row[i]]
        if (color !== undefined) this.px(x + i, py + j, color)
      }
    })
  }

  /** One braille dot; `dx` counts two a column, `dy` four a row. */
  dot(dx: number, dy: number, color: number): void {
    const x = Math.floor(dx / 2)
    const y = Math.floor(dy / 4)
    const c = this.at(x, y)
    if (c < 0 || dx < 0 || dy < 0) return
    if (this.kind[c] !== DOTS) {
      this.kind[c] = DOTS
      this.code[c] = 0x2800
      this.bg[c] = DEFAULT
    }
    this.code[c] |= DOT_BITS[dy % 4][dx % 2]
    this.fg[c] = color
  }

  line(x0: number, y0: number, x1: number, y1: number, color: number): void {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      this.dot(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color)
    }
  }

  /** Packs a block of cells for a Raster; blank cells are spaces. */
  pack(x0: number, y0: number, w: number, h: number): string {
    const words = new Uint32Array(w * h * 3)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 3
        const c = this.at(x0 + x, y0 + y)
        if (c < 0 || this.kind[c] === BLANK) {
          words[o] = 0x20
          words[o + 1] = DEFAULT
          words[o + 2] = DEFAULT
        } else {
          words[o] = this.code[c]
          words[o + 1] = this.fg[c]
          words[o + 2] = this.bg[c]
        }
      }
    }
    return base64(new Uint8Array(words.buffer))
  }

  /**
   * The drawn cells of one row as runs of one color, for drawing over rows the
   * engine owns without blanking what lies between. Pixels lose their second
   * color here, so keep them out of rows read this way.
   */
  runs(y: number, x0 = 0, x1 = this.W): Run[] {
    const out: Run[] = []
    let run: Run | null = null
    for (let x = Math.max(0, x0); x < Math.min(this.W, x1); x++) {
      const c = this.at(x, y)
      if (this.kind[c] === BLANK) {
        run = null
        continue
      }
      const ch = String.fromCodePoint(this.code[c])
      if (run && run.color === this.fg[c] && run.x + [...run.text].length === x) run.text += ch
      else out.push((run = { x, y, text: ch, color: this.fg[c] }))
    }
    return out
  }
}

/**
 * A corner cobweb in braille: spokes from the anchor fanning across a quarter
 * turn, and rings of slack thread strung between them. `sx` and `sy` (each
 * 1 or -1) say which way the web opens from its corner.
 */
export function cobweb(
  cv: Canvas,
  ax: number,
  ay: number,
  rx: number,
  ry: number,
  sx: 1 | -1,
  sy: 1 | -1,
  color: number,
  sway = 0,
  spokes = 4,
  rings: readonly number[] = [0.45, 1],
): void {
  const ends: [number, number][][] = []
  for (let i = 0; i < spokes; i++) {
    const a = (i / (spokes - 1)) * (Math.PI / 2)
    const ex = ax + sx * Math.cos(a) * rx
    const ey = ay + sy * Math.sin(a) * ry
    cv.line(ax, ay, ex, ey, color)
    ends.push(rings.map(k => [ax + sx * Math.cos(a) * rx * k, ay + sy * Math.sin(a) * ry * k] as [number, number]))
  }
  // the rings sag a little toward the corner, and sway a hair in the draft
  for (let ring = 0; ring < rings.length; ring++) {
    for (let i = 0; i + 1 < spokes; i++) {
      const [x0, y0] = ends[i][ring]
      const [x1, y1] = ends[i + 1][ring]
      const mx = (x0 + x1) / 2 - sx * (0.6 + ring * 0.5) + sway
      const my = (y0 + y1) / 2 - sy * (0.6 + ring * 0.5)
      cv.line(x0, y0, mx, my, color)
      cv.line(mx, my, x1, y1, color)
    }
  }
}


/**
 * Frost creeping out of a corner: spokes like a cobweb's, each feathered with
 * short side branches the way ice grows on a window.
 */
export function frost(cv: Canvas, ax: number, ay: number, rx: number, ry: number, sx: 1 | -1, sy: 1 | -1, color: number): void {
  const SPOKES = 4
  for (let i = 0; i < SPOKES; i++) {
    const a = ((i + 0.5) / SPOKES) * (Math.PI / 2)
    const dx = sx * Math.cos(a)
    const dy = sy * Math.sin(a)
    cv.line(ax, ay, ax + dx * rx, ay + dy * ry, color)
    for (const k of [0.35, 0.6, 0.85]) {
      const px = ax + dx * rx * k
      const py = ay + dy * ry * k
      const len = 0.22 * (1.1 - k)
      for (const turn of [0.9, -0.9]) {
        const b = Math.atan2(dy * ry, dx * rx) + turn
        cv.line(px, py, px + Math.cos(b) * rx * len, py + Math.sin(b) * ry * len, color)
      }
    }
  }
}

export type Bloom = { glyph: string; color: number }

/**
 * A vine climbing out of a corner: one tendril along the top edge and one down
 * the side, curling as they go, with leaves and flowers (glyphs) along them.
 */
export function vine(
  cv: Canvas,
  ax: number,
  ay: number,
  rx: number,
  ry: number,
  sx: 1 | -1,
  sy: 1 | -1,
  color: number,
  blooms: readonly Bloom[],
): void {
  const along = (s: number): [number, number] => [ax + sx * rx * s, ay + sy * ry * (0.12 + 0.18 * Math.sin(s * Math.PI * 2.2)) * s * 2]
  const down = (s: number): [number, number] => [ax + sx * rx * 0.22 * (0.5 + 0.5 * Math.sin(s * Math.PI * 2.6)) * s, ay + sy * ry * s]
  let n = 0
  for (const curve of [along, down]) {
    let [x0, y0] = curve(0)
    for (let i = 1; i <= 24; i++) {
      const [x1, y1] = curve(i / 24)
      cv.line(x0, y0, x1, y1, color)
      ;[x0, y0] = [x1, y1]
    }
    for (const s of [0.3, 0.55, 0.8, 0.98]) {
      const [x, y] = curve(s)
      const b = blooms[n++ % blooms.length]
      cv.text(Math.floor(x / 2), Math.floor(y / 4), b.glyph, b.color)
    }
  }
}

/**
 * A garland strung from a corner: swags of wire sagging between hooks along
 * the top edge and down the side, a glyph hung at each swag's low point and
 * between (fairy lights, flags, hearts). `colorAt` colors the i-th one.
 */
export function garland(
  cv: Canvas,
  ax: number,
  ay: number,
  rx: number,
  ry: number,
  sx: 1 | -1,
  sy: 1 | -1,
  color: number,
  glyph: string,
  colorAt: (i: number) => number,
): void {
  let n = 0
  const hang = (x: number, y: number) => cv.text(Math.floor(x / 2), Math.floor(y / 4), glyph, colorAt(n++))
  // along the top: two swags
  for (let k = 0; k < 2; k++) {
    const x0 = ax + sx * rx * (k / 2)
    const x1 = ax + sx * rx * ((k + 1) / 2)
    const sag = Math.min(ry * 0.45, 7)
    let px = x0
    let py = ay
    for (let i = 1; i <= 16; i++) {
      const s = i / 16
      const x = x0 + (x1 - x0) * s
      const y = ay + sy * sag * Math.sin(s * Math.PI)
      cv.line(px, py, x, y, color)
      px = x
      py = y
      if (i === 5 || i === 11) hang(x, y + sy * 2)
    }
  }
  // down the side: one longer swag curving in
  let px = ax
  let py = ay
  for (let i = 1; i <= 16; i++) {
    const s = i / 16
    const x = ax + sx * Math.min(rx * 0.4, 10) * Math.sin(s * Math.PI)
    const y = ay + sy * ry * s
    cv.line(px, py, x, y, color)
    px = x
    py = y
    if (i === 6 || i === 12) hang(x + sx * 2, y)
  }
}

/** A constellation in a corner: a few stars and the faint lines that join them. */
export function constellation(cv: Canvas, ax: number, ay: number, rx: number, ry: number, sx: 1 | -1, sy: 1 | -1, color: number, star: number): void {
  // the Big Dipper, roughly, flipped to open from the corner
  const pts: [number, number][] = [[0.06, 0.1], [0.28, 0.22], [0.46, 0.3], [0.62, 0.48], [0.6, 0.85], [0.9, 0.92], [0.94, 0.55]]
  const at = ([u, v]: [number, number]): [number, number] => [ax + sx * rx * u, ay + sy * ry * v]
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = at(pts[i])
    const [x1, y1] = at(pts[i + 1])
    cv.line(x0, y0, x1, y1, color)
  }
  const [qx, qy] = at(pts[3])
  const [ex, ey] = at(pts[6])
  cv.line(qx, qy, ex, ey, color)
  for (const p of pts) {
    const [x, y] = at(p)
    cv.text(Math.floor(x / 2), Math.floor(y / 4), '✦', star)
  }
}
