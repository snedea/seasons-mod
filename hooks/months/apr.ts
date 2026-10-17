// April: showers. Clawd in bunny ears under an umbrella, rain, a cloud with
// the sun peeking out, tulips, painted eggs, a bunny, a flowering vine.
import { vine } from '../canvas'
import { cloudy } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

export const april: Theme = {
  month: 3,
  key: 'apr',
  words: WORDS[3],
  colors: {
    title: 0xb59cff, version: 0x8a8fb0, tagline: 0x9fe0c8,
    borderA: 0x7f9cf5, borderB: 0xf5b8e0,
    corner: 0x6fae7a, cornerDim: 0x4c7a56,
    critter: 0xffc0e8, drifter: 0x8fb8ff, knot: 0xfff0a0, ground: 0x3f7a4a,
  },
  hat: { rows: ['.WW...WW.', '.WP...PW.', '.WP...PW.', '.WW...WW.', '..W...W..'], colors: { W: 0xf4f4f4, P: 0xffb3d0 } },
  prop: { rows: ['U', 'K', 'K'], colors: { U: 0x5b8def, K: 0x444444 } },
  sky: (cv, cx, t) => cloudy(cv, cx, t, { cloud: 0x8a92a8, under: 0x6a7288, sun: 0xffd760 }),
  ambient: { kind: 'rain', colors: [0x6f8fd8, 0x8fb0f0], count: 40 },
  flyer: { kind: 'sprite', frames: [['X.X', 'XXX'], ['.X.', 'XXX']], color: 0xffa8e0 },
  yard: {
    feet: [
      { rows: ['.P.', 'PYP', '.P.'], colors: { P: 0xb59cff, Y: 0xfff0a0 } },
      { rows: ['.B.', 'BWB', '.B.'], colors: { B: 0x7fd4f5, W: 0xffc0e8 } },
    ],
    props: [
      { rows: ['R.R', 'RRR', '.G.', '.G.'], colors: { R: 0xff6a8a, G: 0x3f8f46 } },
      { rows: ['Y.Y', 'YYY', '.G.'], colors: { Y: 0xffd34a, G: 0x3f8f46 } },
      { rows: ['P.P', 'PPP', '.G.'], colors: { P: 0xc08aff, G: 0x3f8f46 } },
    ],
    wanderer: [
      { rows: ['W.W.', 'W.W.', 'WWWW', 'WW.W'], colors: { W: 0xf0eee8 } },
      { rows: ['.W.W', '.W.W', 'WWWW', 'W.WW'], colors: { W: 0xf0eee8 } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) =>
    vine(cv, ax, ay, rx, ry, -1, 1, 0x4f9a5c, [{ glyph: '✿', color: 0xffb3d0 }, { glyph: '❀', color: 0xfff0a0 }]),
  critter: { glyphs: ['ʚ', 'ɞ'], speed: 1 },
  knot: 'o',
  drifter: '☂',
  greet: { glyph: 'ʚ', color: 0xffc0e8, thread: null },
}
