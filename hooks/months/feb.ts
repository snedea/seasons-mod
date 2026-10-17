// February: a pink night. Clawd under a floating heart holding a rose, hearts
// rising, roses, a teddy bear, a ribbon of hearts in the corners.
import { garland, mix } from '../canvas'
import { heart } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

const HEARTS = [0xff5c8a, 0xffb3c8, 0xe0245e]

export const february: Theme = {
  month: 1,
  key: 'feb',
  words: WORDS[1],
  colors: {
    title: 0xff7aa2, version: 0xb08398, tagline: 0xffb3c8,
    borderA: 0xb0306a, borderB: 0xffb3c8,
    corner: 0xd88aa6, cornerDim: 0x8e5a70,
    critter: 0xff5c8a, drifter: 0xffc2d4, knot: 0xff8fb0, ground: 0x5a2a40,
  },
  hat: { rows: ['..HH.HH..', '.HHHHHHH.', '..HHHHH..', '...HHH...', '....H....'], colors: { H: 0xff5c8a } },
  prop: { rows: ['R', 'G', 'G'], colors: { R: 0xe0245e, G: 0x3f8f46 } },
  sky: (cv, cx, t) => heart(cv, cx, t, { heart: 0xe0245e, shine: 0xffd6e2 }),
  ambient: { kind: 'hearts', colors: [0x8e3a5c, 0xb04a74], count: 7 },
  flyer: { kind: 'sprite', frames: [['XX.XX', '.XXX.'], ['.X.X.', '.XXX.']], color: 0xff7aa2 },
  yard: {
    feet: [
      { rows: ['H.H', 'HHH', '.H.'], colors: { H: 0xe0245e } },
      { rows: ['RRR', 'RGR', 'RRR'], colors: { R: 0x7a3b2e, G: 0xffd760 } },
    ],
    props: [
      { rows: ['.R.', 'RRR', '.G.'], colors: { R: 0xe0245e, G: 0x3f8f46 } },
      { rows: ['.P.', 'PPP', '.G.', '.G.'], colors: { P: 0xff9cc0, G: 0x3f8f46 } },
      { rows: ['R.R', '.G.'], colors: { R: 0xd0306a, G: 0x3f8f46 } },
    ],
    wanderer: [{ rows: ['B..B', 'BBBB', 'BHBB', 'B..B'], colors: { B: 0xa0703f, H: 0xff5c8a } }],
  },
  corner: ({ cv, ax, ay, rx, ry, t }) =>
    garland(cv, ax, ay, rx, ry, -1, 1, 0xd88aa6, '♥', i => mix(HEARTS[i % 3], HEARTS[(i + 1) % 3], 0.5 + 0.5 * Math.sin(t * 0.5 + i))),
  dangle: { glyph: '♥', color: 0xff5c8a },
  critter: { glyphs: ['♥', '♡'], speed: 0.9 },
  knot: '·',
  drifter: '♡',
  greet: { glyph: '♥', color: 0xff5c8a, thread: '│' },
}
