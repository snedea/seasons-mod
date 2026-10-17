// June: the beach. Clawd in sunglasses with an ice cream, a big sun, seagulls,
// sandcastles, a crab, beach bunting in the corners.
import { garland } from '../canvas'
import { sun } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

const FLAGS = [0xff6a5a, 0xffd34a, 0x3fb8e0, 0xf4f4f4]

export const june: Theme = {
  month: 5,
  key: 'jun',
  words: WORDS[5],
  colors: {
    title: 0xffc24a, version: 0x8aa8b0, tagline: 0x5fd0e8,
    borderA: 0x2fa8d8, borderB: 0xf2d29a,
    corner: 0xc8b48a, cornerDim: 0x8a7a5a,
    critter: 0xff5a4a, drifter: 0x6fd0f0, knot: 0xf2e6d0, ground: 0xe8cf8f,
  },
  hat: { rows: ['..RRRRR..', 'RRRRRRRRR'], colors: { R: 0xff6a5a } },
  face: { rows: ['.KKKKKKK.'], colors: { K: 0x111111 } },
  prop: { rows: ['P', 'W', 'C'], colors: { P: 0xffa8c8, W: 0xfff4e0, C: 0xd8a060 } },
  sky: (cv, cx, t) => sun(cv, cx, t, { sun: 0xffc83a, core: 0xfff3b0, ray: 0xff9a3a }),
  flyer: { kind: 'sprite', frames: [['X...X', '.X.X.'], ['.....', 'XX.XX']], color: 0xf4f4f4 },
  yard: {
    feet: [
      { rows: ['R..', 'BB.', 'BB.'], colors: { R: 0xc87a3a, B: 0x3fb8e0 } },
      { rows: ['..S', '.S.', 'S..'], colors: { S: 0x9a9a9a } },
    ],
    props: [
      { rows: ['T.T.T', 'TTTTT', 'TTKTT'], colors: { T: 0xe8c77a, K: 0x8a6a3a } },
      { rows: ['.S.', 'SSS', '.S.'], colors: { S: 0xff9a7a } },
      { rows: ['F..', 'T.T', 'TTT'], colors: { T: 0xe8c77a, F: 0xff6a5a } },
    ],
    wanderer: [
      { rows: ['R..R', '.RR.', 'RRRR', 'R..R'], colors: { R: 0xff5a4a } },
      { rows: ['R..R', 'RRRR', 'RRRR', '.RR.'], colors: { R: 0xff5a4a } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) => garland(cv, ax, ay, rx, ry, -1, 1, 0xc8b48a, '▼', i => FLAGS[i % FLAGS.length]),
  critter: { glyphs: ['¤', '¤'], speed: 1.1 },
  knot: '◦',
  drifter: '≈',
  greet: { glyph: '●', color: 0xff6a5a, thread: null },
}
