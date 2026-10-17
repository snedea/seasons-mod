// November: autumn. Clawd in a pilgrim hat holding a slice of pie, leaves
// falling, geese flying south, hay bales and corn, a turkey, a branch of
// leaves in the corners, a squirrel stashing acorns on the border.
import { vine } from '../canvas'
import { moon } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

export const november: Theme = {
  month: 10,
  key: 'nov',
  words: WORDS[10],
  colors: {
    title: 0xe8823a, version: 0x9a8a78, tagline: 0xd8b060,
    borderA: 0x8a4a2a, borderB: 0xe8a23a,
    corner: 0x7a5a3a, cornerDim: 0x5a4030,
    critter: 0xc87a3a, drifter: 0xd8603a, knot: 0x8a5a2a, ground: 0x6a4a2a,
  },
  hat: { rows: ['..KKKKK..', '..KKKKK..', '..KYYYK..', '..KKKKK..', 'KKKKKKKKK'], colors: { K: 0x1c1c1c, Y: 0xd8b060 } },
  prop: { rows: ['C', 'O', 'O'], colors: { C: 0xf4ead8, O: 0xd88a3a } },
  sky: (cv, cx, t) => moon(cv, cx, t, { moon: 0xf8d89a, shade: 0xd0a868, crater: 0xe8c47e, cloud: 0x3a2a24 }),
  ambient: { kind: 'leaves', colors: [0xd8603a, 0xe8a23a, 0xa83a2a, 0x8a5a2a], count: 26 },
  flyer: { kind: 'sprite', frames: [['X...X', '.XKX.'], ['.....', 'XXKXX']], color: 0x6a5a4a, flock: 3 },
  yard: {
    feet: [
      { rows: ['.WWW.', 'OOOOO'], colors: { W: 0xf4ead8, O: 0xd88a3a } },
      { rows: ['.g.', 'OOO', 'OOO'], colors: { g: 0x55762f, O: 0xe8741f } },
    ],
    props: [
      { rows: ['YYYY', 'YyYy', 'YYYY'], colors: { Y: 0xd8b060, y: 0xb08a40 } },
      { rows: ['.Y.', 'YGY', '.G.', '.G.'], colors: { Y: 0xf2c230, G: 0x9a8a3a } },
      { rows: ['R.O', '.B.'], colors: { R: 0xa83a2a, O: 0xe8a23a, B: 0x6a4a2a } },
    ],
    wanderer: [
      { rows: ['R.BB.', 'RBBBB', '.BBB.', '.Y.Y.'], colors: { R: 0xd0302a, B: 0x7a4a2a, Y: 0xe8a23a } },
      { rows: ['R.BB.', 'RBBBB', '.BBB.', 'Y...Y'], colors: { R: 0xd0302a, B: 0x7a4a2a, Y: 0xe8a23a } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) =>
    vine(cv, ax, ay, rx, ry, -1, 1, 0x6a4a2a, [{ glyph: '❦', color: 0xd8603a }, { glyph: '❦', color: 0xe8a23a }, { glyph: '❦', color: 0xa83a2a }]),
  critter: { glyphs: ['§', '§'], speed: 1.2 },
  knot: '•',
  drifter: '❦',
  greet: { glyph: '❦', color: 0xe8823a, thread: null },
}
