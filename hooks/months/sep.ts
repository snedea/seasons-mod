// September: back to school. Clawd in a graduation cap holding a pencil, a
// harvest moon, paper airplanes, apples and books, a school bus, school
// pennants in the corners, a pencil on the border.
import { garland } from '../canvas'
import { moon } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

const PENNANTS = [0xc0392b, 0xf2c230, 0x2a5aa8]

export const september: Theme = {
  month: 8,
  key: 'sep',
  words: WORDS[8],
  colors: {
    title: 0xf2c230, version: 0x9a9080, tagline: 0xe0a080,
    borderA: 0x2a5aa8, borderB: 0xc0392b,
    corner: 0xa89a80, cornerDim: 0x6a6050,
    critter: 0xf2c230, drifter: 0xd8823a, knot: 0xd8d0c0, ground: 0x4a6a3a,
  },
  hat: { rows: ['.........', 'KKKKKKKKY', '..KKKKK.Y', '..KKKKK..'], colors: { K: 0x1c1c24, Y: 0xf2c230 } },
  prop: { rows: ['P', 'Y', 'Y'], colors: { P: 0xff9ab0, Y: 0xf2c230 } },
  sky: (cv, cx, t) => moon(cv, cx, t, { moon: 0xffcf7a, shade: 0xd89a4a, crater: 0xf0b860, cloud: 0x3a2a3a }),
  ambient: { kind: 'leaves', colors: [0xd8823a, 0xc0392b], count: 6 },
  flyer: { kind: 'sprite', frames: [['XXX..', '.XXXX'], ['.XXX.', 'XXXX.']], color: 0xf4f4f4 },
  yard: {
    feet: [
      { rows: ['.g.', 'RRR', 'RRR'], colors: { g: 0x55762f, R: 0xd02a2a } },
      { rows: ['RRR', 'BBB', 'GGG'], colors: { R: 0xc0392b, B: 0x2a5aa8, G: 0x3f8f46 } },
    ],
    props: [
      { rows: ['RRRR', 'YYYY', 'BBBB'], colors: { R: 0xc0392b, Y: 0xf2c230, B: 0x2a5aa8 } },
      { rows: ['.GGG.', 'GRGRG', '..K..', '..K..'], colors: { G: 0x3f8f46, R: 0xd02a2a, K: 0x6a4a2a } },
      { rows: ['.g.', 'RRR'], colors: { g: 0x55762f, R: 0xd02a2a } },
    ],
    wanderer: [
      { rows: ['YYYYY', 'YKYKY', 'YYYYY', '.K.K.'], colors: { Y: 0xf2c230, K: 0x222222 } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry }) => garland(cv, ax, ay, rx, ry, -1, 1, 0xa89a80, '▼', i => PENNANTS[i % PENNANTS.length]),
  critter: { glyphs: ['✎', '✎'], speed: 1 },
  knot: '–',
  drifter: '❧',
  greet: { glyph: '●', color: 0xd02a2a, thread: null },
}
