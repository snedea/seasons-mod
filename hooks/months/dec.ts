// December: a snowy night. Clawd in a red hat with a candy cane, snow falling,
// stars flying out, trees with lights and presents, a reindeer, a string of
// lights in the corners that change color slowly.
import { garland, mix } from '../canvas'
import { moon } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

const BULBS = [0xff4a4a, 0x4ad86a, 0xffd34a, 0x4a9aff]
const bulb = (i: number, t: number) => mix(BULBS[i % 4], BULBS[(i + 1) % 4], 0.5 + 0.5 * Math.sin(t * 0.4 + i * 1.3))
const lights = (t: number) => mix(0xffd34a, 0xff4a4a, 0.5 + 0.5 * Math.sin(t * 0.5))

export const december: Theme = {
  month: 11,
  key: 'dec',
  words: WORDS[11],
  colors: {
    title: 0xff5a5a, version: 0x8a9aa0, tagline: 0x6ad88a,
    borderA: 0xc0302a, borderB: 0x2f9a4a,
    corner: 0x3a6a3a, cornerDim: 0x2a4a2a,
    critter: 0xa8784a, drifter: 0xf4f8ff, knot: 0xff4a4a, ground: 0xdfe9f5,
  },
  hat: { rows: ['.......W.', '.....RR..', '...RRRR..', '..RRRRR..', 'WWWWWWWWW'], colors: { R: 0xd0302a, W: 0xf4f4f4 } },
  prop: { rows: ['R', 'W', 'R'], colors: { R: 0xe0303a, W: 0xf4f4f4 } },
  sky: (cv, cx, t) => moon(cv, cx, t, { moon: 0xf0f4ff, shade: 0xbcc6de, crater: 0xd4dcee, cloud: 0x26304a }),
  ambient: { kind: 'snow', colors: [0xf4f8ff, 0xd8e4f4], count: 60 },
  flyer: { kind: 'sprite', frames: [['.X.', 'XXX'], ['X.X', '.X.']], color: 0xffd34a },
  yard: {
    feet: [
      { rows: ['RYR', 'RYR'], colors: { R: 0xd0302a, Y: 0xffd34a } },
      { rows: ['GWG', 'GWG'], colors: { G: 0x2f9a4a, W: 0xf4f4f4 } },
    ],
    props: [
      { rows: ['..Y..', '.GLG.', 'GGGLG', '..B..'], colors: { Y: 0xffd34a, G: 0x2f7a3a, L: lights, B: 0x6a4a2a } },
      { rows: ['.W.', 'WWW'], colors: { W: 0xe8f0fa } },
      { rows: ['.G.', 'GLG', '.B.'], colors: { G: 0x2f7a3a, L: lights, B: 0x6a4a2a } },
    ],
    wanderer: [
      { rows: ['B...B', '.BBBR', '.BBB.', '.B.B.'], colors: { B: 0xa8784a, R: 0xff3a3a } },
      { rows: ['B...B', '.BBBR', '.BBB.', 'B...B'], colors: { B: 0xa8784a, R: 0xff3a3a } },
    ],
  },
  corner: ({ cv, ax, ay, rx, ry, t }) => garland(cv, ax, ay, rx, ry, -1, 1, 0x3a6a3a, '●', i => bulb(i, t)),
  dangle: { glyph: '●', color: 0xff4a4a },
  critter: { glyphs: ['Ѱ', 'Ѱ'], speed: 1 },
  knot: '▪',
  drifter: '✻',
  greet: { glyph: '●', color: 0xff4a4a, thread: '│' },
}
