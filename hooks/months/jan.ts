// January: a snowy night. Clawd in a knit beanie with a mug of cocoa, snow
// falling, snowmen, a penguin, frost in the corners, a snowflake on the border.
import { frost, mix } from '../canvas'
import { moon } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

export const january: Theme = {
  month: 0,
  key: 'jan',
  words: WORDS[0],
  colors: {
    title: 0x9fd4ff, version: 0x7d8fb0, tagline: 0xc6dcf2,
    borderA: 0x5a7fb8, borderB: 0xcfe6ff,
    corner: 0xa9c8e8, cornerDim: 0x6d86a6,
    critter: 0xf2f8ff, drifter: 0xe6f2ff, knot: 0xa9c8e8, ground: 0xdfe9f5,
  },
  hat: { rows: ['....W....', '...RRR...', '..RRRRR..', '.WRWRWRW.', 'RRRRRRRRR'], colors: { W: 0xf4f4f4, R: 0xc0392b } },
  prop: {
    rows: ['S', 'M', 'M'],
    colors: { S: t => mix(0x141018, 0xb8b8c8, 0.5 + 0.5 * Math.sin(t * 1.2)), M: 0x8b5a3c },
  },
  sky: (cv, cx, t) => moon(cv, cx, t, { moon: 0xe8f1ff, shade: 0xb5c6de, crater: 0xcfdcee, cloud: 0x2c3550 }),
  ambient: { kind: 'snow', colors: [0xf4f8ff, 0xd8e4f4], count: 70 },
  flyer: { kind: 'sprite', frames: [['.X.X.', 'X.X.X'], ['X.X.X', '.X.X.']], color: 0xe6f2ff },
  yard: {
    feet: [
      { rows: ['.W.', 'WKW', 'WWW'], colors: { W: 0xf4f8ff, K: 0x222222 } },
      { rows: ['.R.', 'WOW', 'WWW'], colors: { W: 0xf4f8ff, O: 0xff8c2a, R: 0xc0392b } },
    ],
    props: [
      { rows: ['..W..', '.WWW.', 'WWWWW'], colors: { W: 0xe8f0fa } },
      { rows: ['.K.', '.W.', 'WOW', 'WWW'], colors: { W: 0xf4f8ff, K: 0x222222, O: 0xff8c2a } },
      { rows: ['.WW.', 'WWWW'], colors: { W: 0xdfe9f5 } },
    ],
    wanderer: [
      { rows: ['.KK.', 'KWWK', 'KWWK', '.YY.'], colors: { K: 0x1c1c28, W: 0xf4f4f4, Y: 0xf2a33a } },
      { rows: ['.KK.', 'KWWK', 'KWWK', 'Y..Y'], colors: { K: 0x1c1c28, W: 0xf4f4f4, Y: 0xf2a33a } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) => frost(cv, ax, ay, rx, ry, -1, 1, 0xa9c8e8),
  critter: { glyphs: ['✶', '✻'], speed: 0.8 },
  knot: '·',
  drifter: '*',
  greet: { glyph: '✻', color: 0xf2f8ff, thread: null },
}
