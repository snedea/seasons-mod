// What a month is made of. The engine (scene.ts) does all the moving and the
// placing; a month (months/*.ts) only says what things look like.

import type { Canvas } from './canvas'

/** A color, or one that changes slowly with time in seconds (a candle, a bulb). */
export type Paint = number | ((t: number) => number)

/** Pixel art: one string a pixel row, '.' transparent, other letters by `colors`. */
export type Sprite = { rows: readonly string[]; colors: Record<string, Paint> }

/** Where a corner decoration hangs from and which way it opens, in braille dots. */
export type Corner = { cv: Canvas; ax: number; ay: number; rx: number; ry: number; t: number }

/** What the header's tool-call flyers are. */
export type Flyer =
  | { kind: 'sprite'; frames: readonly (readonly string[])[]; color: number; flock?: number }
  | { kind: 'firework'; colors: readonly number[] }
  | { kind: 'shooting'; color: number }

/** What drifts through the header the whole time. */
export type Ambient =
  | { kind: 'snow' | 'petals' | 'leaves' | 'rain'; colors: readonly number[]; count: number }
  | { kind: 'fireflies' | 'stars'; colors: readonly number[]; count: number }
  | { kind: 'hearts'; colors: readonly number[]; count: number }

export type Words = {
  /** The spinner's present participles: "Conjuring". */
  verbs: readonly string[]
  /** The closing line's past tense: "Brewed" for 12s. */
  past: readonly string[]
  /** Shown after the title, one at a time. */
  taglines: readonly string[]
}

export type Theme = {
  /** 0 for January. */
  month: number
  /** Three-letter key for /seasons: `jan`. */
  key: string
  words: Words
  colors: {
    title: number
    version: number
    tagline: number
    /** The prompt box's border runs from `borderA` at its left to `borderB`. */
    borderA: number
    borderB: number
    /** The thin lines of the corner decorations. */
    corner: number
    cornerDim: number
    critter: number
    drifter: number
    knot: number
    ground: number
  }
  /** Clawd's hat: up to five pixel rows over the head, nine wide. */
  hat: Sprite
  /** Drawn over Clawd's eyes (sunglasses); the eyes still blink beneath. */
  face?: Sprite
  /** Held out while Claude works: three pixel rows, at Clawd's right hand. */
  prop: Sprite
  /** The thing in the sky at the header's right, drawn around column `cx`. */
  sky: (cv: Canvas, cx: number, t: number) => void
  ambient?: Ambient
  flyer: Flyer
  /** The ground row: two things at Clawd's feet, props scattered right, one wanderer. */
  yard: {
    feet: readonly Sprite[]
    props: readonly Sprite[]
    /** One or two frames, four pixel rows tall. */
    wanderer: readonly Sprite[]
  }
  /** Draws the decoration hung in a top right corner (header and prompt box). */
  corner: (c: Corner) => void
  /** What hangs on a thread from the header's corner, if anything. */
  dangle?: { glyph: string; color: number }
  /** What lives on the prompt box's top border: [moving, still] glyphs. */
  critter: { glyphs: readonly [string, string]; speed: number }
  /** Left on the top border at each tool call, tidied up after. */
  knot: string
  /** Drifts along the bottom border while Claude works. */
  drifter: string
  /** Before the first prompt: comes down into the empty screen, on `thread` or falling free. */
  greet: { glyph: string; color: number; thread: string | null }
}

export function paint(p: Paint, t: number): number {
  return typeof p === 'function' ? p(t) : p
}
