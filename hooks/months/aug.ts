// August: camping under the stars. Clawd in a ranger hat toasting a
// marshmallow, shooting stars, tents and a campfire, a raccoon, a
// constellation in the corners, a cricket on the border.
import { constellation, mix } from '../canvas'
import { moon } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

const fire = (t: number) => mix(0xff7a2a, 0xffd34a, 0.5 + 0.5 * Math.sin(t * 1.7))

export const august: Theme = {
  month: 7,
  key: 'aug',
  words: WORDS[7],
  colors: {
    title: 0xffb05a, version: 0x8a90a8, tagline: 0xb8c8ff,
    borderA: 0x2c3a6a, borderB: 0xff9a4a,
    corner: 0x6a78a8, cornerDim: 0x4a5478,
    critter: 0x9ad06a, drifter: 0xe8ecff, knot: 0x9ad06a, ground: 0x2a3a2a,
  },
  hat: { rows: ['...KKK...', '..KKKKK..', '..BBBBB..', 'KKKKKKKKK'], colors: { K: 0x8a6a3a, B: 0x3f6b3a } },
  prop: { rows: ['W', 'K', 'K'], colors: { W: t => mix(0xf4ead8, 0xd8a060, 0.5 + 0.5 * Math.sin(t * 0.8)), K: 0x8a6a3a } },
  sky: (cv, cx, t) => moon(cv, cx, t, { moon: 0xeef0ff, shade: 0xb8bcd8, crater: 0xd0d4ee, cloud: 0x1e2440 }),
  ambient: { kind: 'stars', colors: [0xf4f4ff, 0xc8d4ff, 0xfff0c8], count: 30 },
  flyer: { kind: 'shooting', color: 0xf4f6ff },
  yard: {
    feet: [
      { rows: ['.F.', 'FYF', 'KKK'], colors: { F: fire, Y: 0xfff0a0, K: 0x6a4a2a } },
      { rows: ['...', 'WKW', '.K.'], colors: { W: 0xf4ead8, K: 0x8a6a3a } },
    ],
    props: [
      { rows: ['..T..', '.TTT.', 'TTKTT'], colors: { T: 0x3f7a4a, K: 0x1a1a1a } },
      { rows: ['..G..', '.GGG.', 'GGGGG', '..B..'], colors: { G: 0x1f4a2a, B: 0x5a3a1a } },
      { rows: ['.T.', 'TTT'], colors: { T: 0xc8823a } },
    ],
    wanderer: [
      { rows: ['K.K.', 'GKGG', 'GGGG', 'G..G'], colors: { K: 0x222222, G: 0x8a8a8a } },
      { rows: ['K.K.', 'GKGG', 'GGGG', '.GG.'], colors: { K: 0x222222, G: 0x8a8a8a } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) => constellation(cv, ax, ay, rx, ry, -1, 1, 0x4a5478, 0xf4f4ff),
  critter: { glyphs: ['♪', '♫'], speed: 1 },
  knot: '♪',
  drifter: '✧',
  greet: { glyph: '★', color: 0xfff0c8, thread: null },
}
