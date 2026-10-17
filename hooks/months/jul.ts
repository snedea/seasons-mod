// July: summer nights. Clawd in a party hat with a sparkler, fireworks that
// open and fade slowly, fireflies, a picnic, a puppy, bunting in the corners.
import { garland, mix } from '../canvas'
import { moon } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

const FLAGS = [0xe0303a, 0xf4f4f4, 0x3a5ad8]

export const july: Theme = {
  month: 6,
  key: 'jul',
  words: WORDS[6],
  colors: {
    title: 0xff5a5a, version: 0x8a8fb0, tagline: 0x8fb0ff,
    borderA: 0xe0303a, borderB: 0x3a5ad8,
    corner: 0x9a9ab8, cornerDim: 0x5c5c78,
    critter: 0xf7f06a, drifter: 0xffe08a, knot: 0xffe08a, ground: 0x2f4a2f,
  },
  hat: { rows: ['....Y....', '...RRR...', '...WWW...', '..BBBBB..', '..RRRRR..'], colors: { Y: 0xffd34a, R: 0xe0303a, W: 0xf4f4f4, B: 0x3a5ad8 } },
  prop: {
    rows: ['S', 'K', 'K'],
    colors: { S: t => mix(0xffb04a, 0xfff6c0, 0.5 + 0.5 * Math.sin(t * 2)), K: 0x777777 },
  },
  sky: (cv, cx, t) => moon(cv, cx, t, { moon: 0xf6eecf, shade: 0xc9bd96, crater: 0xdcd0aa, cloud: 0x26304a }),
  ambient: { kind: 'fireflies', colors: [0xf7f06a, 0xd8f05a], count: 10 },
  flyer: { kind: 'firework', colors: [0xff5a5a, 0xf4f4f4, 0x6a8aff, 0xffd34a] },
  yard: {
    feet: [
      { rows: ['RRR', 'WRW', 'GGG'], colors: { R: 0xe0303a, W: 0x111111, G: 0x3f8f46 } },
      { rows: ['...', 'RWR', 'WRW'], colors: { R: 0xe0303a, W: 0xf4f4f4 } },
    ],
    props: [
      { rows: ['RRRRR', '.W.W.'], colors: { R: 0xe0303a, W: 0xf4f4f4 } },
      { rows: ['.F.', '.K.', 'KKK'], colors: { F: 0xff9a3a, K: 0x555555 } },
      { rows: ['RRR', 'GGG'], colors: { R: 0xff5a6a, G: 0x3f8f46 } },
    ],
    wanderer: [
      { rows: ['B..B', 'BBBB', 'BBBK', 'B..B'], colors: { B: 0xc8975a, K: 0x222222 } },
      { rows: ['B..B', 'BBBB', 'BBBK', '.BB.'], colors: { B: 0xc8975a, K: 0x222222 } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) => garland(cv, ax, ay, rx, ry, -1, 1, 0x9a9ab8, '▼', i => FLAGS[i % FLAGS.length]),
  critter: { glyphs: ['•', '·'], speed: 1 },
  knot: '·',
  drifter: '✦',
  greet: { glyph: '✦', color: 0xffe08a, thread: null },
}
