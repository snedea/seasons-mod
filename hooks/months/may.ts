// May: a garden in bloom. Clawd in a sun hat with a watering can, the sun,
// petals drifting, flowers, a duckling, a snail on the border that never
// quite catches up.
import { vine } from '../canvas'
import { sun } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

export const may: Theme = {
  month: 4,
  key: 'may',
  words: WORDS[4],
  colors: {
    title: 0xffb347, version: 0x9a9a7a, tagline: 0xf7a8c8,
    borderA: 0x6fbf5a, borderB: 0xffd166,
    corner: 0x5fa85a, cornerDim: 0x47804a,
    critter: 0xd9b08c, drifter: 0xffb3d0, knot: 0xbfc8cf, ground: 0x4f8f3f,
  },
  hat: { rows: ['...SSS...', '..SSSFS..', '..BBBBB..', 'SSSSSSSSS'], colors: { S: 0xe8c77a, F: 0xff6a8a, B: 0x5fa8d8 } },
  prop: { rows: ['B', 'C', 'C'], colors: { B: 0x6fb0ff, C: 0x7fa0b0 } },
  sky: (cv, cx, t) => sun(cv, cx, t, { sun: 0xffd34a, core: 0xfff0a0, ray: 0xffb347 }),
  ambient: { kind: 'petals', colors: [0xffc0d8, 0xfff0f5, 0xffa8c8], count: 22 },
  flyer: { kind: 'sprite', frames: [['.W.', 'YKY'], ['W.W', 'YKY']], color: 0xffd34a },
  yard: {
    feet: [
      { rows: ['.CC', 'CCC', 'CC.'], colors: { C: 0x7fa0b0 } },
      { rows: ['.R.', 'RYR', '.G.'], colors: { R: 0xff6a8a, Y: 0xffe066, G: 0x3f8f46 } },
    ],
    props: [
      { rows: ['.R.', 'RYR', '.G.', '.G.'], colors: { R: 0xff6a8a, Y: 0xffe066, G: 0x3f8f46 } },
      { rows: ['.P.', 'PYP', '.G.'], colors: { P: 0xb38aff, Y: 0xffe066, G: 0x3f8f46 } },
      { rows: ['W.W', '.Y.', '.G.'], colors: { W: 0xf4f4f4, Y: 0xffd34a, G: 0x3f8f46 } },
    ],
    wanderer: [
      { rows: ['.YY.', 'YYYO', 'YYY.', '.O..'], colors: { Y: 0xffe066, O: 0xff9a3a } },
      { rows: ['.YY.', 'YYYO', 'YYY.', '..O.'], colors: { Y: 0xffe066, O: 0xff9a3a } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) =>
    vine(cv, ax, ay, rx, ry, -1, 1, 0x4f9a4a, [{ glyph: '✿', color: 0xff8fb0 }, { glyph: '❀', color: 0xffe066 }, { glyph: '✿', color: 0xb38aff }]),
  critter: { glyphs: ['@', '@'], speed: 0.18 },
  knot: '·',
  drifter: '✿',
  greet: { glyph: '✿', color: 0xffb3d0, thread: null },
}
