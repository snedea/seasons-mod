// March: a green spring day. Clawd in a green top hat with a gold coin, a
// rainbow and its pot of gold, clovers, a lamb, a clover vine in the corners.
import { vine } from '../canvas'
import { rainbow } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

export const march: Theme = {
  month: 2,
  key: 'mar',
  words: WORDS[2],
  colors: {
    title: 0x4cc46a, version: 0x7aa486, tagline: 0xf2d24a,
    borderA: 0x2f8f4e, borderB: 0xf2d24a,
    corner: 0x4f9a5c, cornerDim: 0x3a6e45,
    critter: 0x5fd47a, drifter: 0xe8eef2, knot: 0xf2c230, ground: 0x2f6b3a,
  },
  hat: { rows: ['..GGGGG..', '..GGGGG..', '..YYKYY..', '..GGGGG..', 'GGGGGGGGG'], colors: { G: 0x1f7a3a, Y: 0x111111, K: 0xf2c230 } },
  prop: { rows: ['.', 'Y', 'Y'], colors: { Y: 0xf2c230 } },
  sky: (cv, cx, t) => rainbow(cv, cx, t, [0xe74c3c, 0xf39c12, 0xf1c40f, 0x2ecc71, 0x3498db, 0x8e44ad], 0xf2c230),
  flyer: { kind: 'sprite', frames: [['.X.', 'X.X'], ['X.X', '.X.']], color: 0xf2c230 },
  yard: {
    feet: [
      { rows: ['YYY', 'KKK', '.K.'], colors: { Y: 0xf2c230, K: 0x2a2a2a } },
      { rows: ['G.G', '.G.', '.g.'], colors: { G: 0x3fbf5a, g: 0x2f6b3a } },
    ],
    props: [
      { rows: ['G.G', '.G.', '.g.'], colors: { G: 0x3fbf5a, g: 0x2f6b3a } },
      { rows: ['GG.GG', '.GGG.', '..g..'], colors: { G: 0x2fa84f, g: 0x2f6b3a } },
      { rows: ['.Y.', 'G.G'], colors: { Y: 0xf7e26b, G: 0x3fbf5a } },
    ],
    wanderer: [
      { rows: ['.WWW', 'WWWW', 'WWWW', 'K..K'], colors: { W: 0xf2efe6, K: 0x2a2a2a } },
      { rows: ['.WWW', 'WWWW', 'WWWW', '.KK.'], colors: { W: 0xf2efe6, K: 0x2a2a2a } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) =>
    vine(cv, ax, ay, rx, ry, -1, 1, 0x3a8a4a, [{ glyph: '☘', color: 0x4cc46a }, { glyph: '·', color: 0x7ad48a }]),
  critter: { glyphs: ['☘', '♣'], speed: 0.9 },
  knot: '•',
  drifter: '☁',
  greet: { glyph: '◆', color: 0xe74c3c, thread: '│' },
}
