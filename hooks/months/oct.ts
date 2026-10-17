// October: a moonlit graveyard. Clawd in a witch hat with a lantern, bats,
// jack-o'-lanterns, tombstones, a ghost, and a spider in its web.
import { cobweb, mix } from '../canvas'
import { moon } from '../scene'
import type { Theme } from '../theme'
import { WORDS } from '../words'

const candle = (t: number) => mix(0xff9f38, 0xffd760, 0.5 + 0.5 * Math.sin(t * 1.4))

export const october: Theme = {
  month: 9,
  key: 'oct',
  words: WORDS[9],
  colors: {
    title: 0xf0883a, version: 0x8f84ae, tagline: 0xa08cd0,
    borderA: 0x6c42aa, borderB: 0xd06a28,
    corner: 0x8a83a6, cornerDim: 0x5c5674,
    critter: 0xd8d0ec, drifter: 0xeae6f6, knot: 0x8a83a6, ground: 0x3a2a4e,
  },
  hat: { rows: ['.....K...', '....KL...', '...KKL...', '..BBBBB..', 'KKKKKKKKK'], colors: { K: 0x3d2368, L: 0x6c42aa, B: 0xf38c28 } },
  prop: {
    rows: ['F', 'G', 'F'],
    colors: { F: 0x5a4250, G: t => mix(0xffb04a, 0xfff0a8, 0.5 + 0.5 * Math.sin(t * 1.6)) },
  },
  sky: (cv, cx, t) => moon(cv, cx, t, { moon: 0xf6e8b6, shade: 0xc9b07a, crater: 0xd8c18a, cloud: 0x3f3059 }),
  flyer: { kind: 'sprite', frames: [['X..X..X', '.XX.XX.'], ['...X...', 'XXX.XXX']], color: 0x7a68a0 },
  yard: {
    feet: [
      { rows: ['.g.', 'OyO', 'OOO'], colors: { g: 0x55762f, O: 0xe8741f, y: candle } },
      { rows: ['.g.', 'OyO', 'OOO'], colors: { g: 0x55762f, O: 0xe8741f, y: candle } },
    ],
    props: [
      { rows: ['.S.', 'SSS', 'SDS'], colors: { S: 0x5e576e, D: 0x37314a } },
      { rows: ['.S.', 'SSS', '.S.'], colors: { S: 0x5e576e } },
      { rows: ['SS', 'SD'], colors: { S: 0x5e576e, D: 0x37314a } },
    ],
    wanderer: [{ rows: ['.WWW.', 'WEWEW', 'WWWWW', 'W.W.W'], colors: { W: 0xeae6f6, E: 0x281f3f } }],
  },
  corner: ({ cv, ax, ay, rx, ry }) => cobweb(cv, ax, ay, rx, ry, -1, 1, 0x8a83a6, 0, 5, [0.3, 0.62, 1]),
  dangle: { glyph: 'ж', color: 0xd8d0ec },
  critter: { glyphs: ['ж', 'Ж'], speed: 1 },
  knot: '⁘',
  drifter: 'ᗣ',
  greet: { glyph: 'ж', color: 0xd8d0ec, thread: '⡇' },
}
