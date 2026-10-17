import { expect, mock, test } from 'claude-code/testing'

import { MONTHS } from './months'
import { promptShape } from './scene'
import { WORDS } from './words'

const OCTOBER = Date.parse('2026-10-16T21:00:00')
// the notice row under the logo, as the engine raises it for
// CLAUDE_CODE_TMUX_SESSION=seasons (or for a real tmux session)
const NOTICE = (columns: number, session = 'seasons') => ({
  plugin: 'seasons',
  surface: 'terminal',
  component: 'InfoNotice',
  requestId: `notice:tmux session: ${session}`,
  viewport: { columns, rows: 40 },
  props: { text: `tmux session: ${session} · detach with ctrl+b d`, command: null },
}) as any
const HINT = (columns: number) => ({
  plugin: 'seasons',
  surface: 'terminal',
  component: 'PromptHint',
  requestId: 'prompt-hint',
  viewport: { columns, rows: 40 },
  props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
}) as any

// stands in for the engine's own drawing, drawn when the plugin passes
const engine = (on: any) =>
  on('ui.render', async ($: any, e: any) => h($.ui.resolve(e).Text, {}, `engine ${e.component}`))

function decode(b64: string): Uint32Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Uint32Array(bytes.buffer)
}

// the placed Box with this key, anywhere in the drawing
async function placed(ui: any, key: string): Promise<any> {
  const walk = (n: any): any => {
    if (!n || typeof n !== 'object') return undefined
    if (n.type === 'Box' && n.props?.key === key) return n
    for (const c of n.children ?? []) {
      const hit = walk(c)
      if (hit) return hit
    }
    return undefined
  }
  return walk(await ui.find({ type: 'Box' } as any))
}

const text = (words: Uint32Array) => {
  let s = ''
  for (let i = 0; i < words.length; i += 3) s += String.fromCodePoint(words[i])
  return s
}

test('in October the logo block is painted over, not a band added under it', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  const ui = await $.ui.mount(NOTICE(120))
  for (const key of ['top', 'clawd', 'right', 'yard', 'greet']) {
    expect(await ui.find({ type: 'Raster', props: { key } } as any)).toBeDefined()
  }
  // the title line is the header's second row, in the block over the logo
  const top = (await ui.find({ type: 'Raster', props: { key: 'top' } } as any)) as any
  expect(top.props.rows).toBe(2)
  expect(text(decode(top.props.cells))).toContain('Claude Code v')
  // the yard is placed over the blank row and the notice row itself, from the far left
  const at = await placed(ui, 'at-yard')
  expect(at.props.top).toBe(-1)
  expect(at.props.left).toBe(-2)
})

test('a real tmux session notice is left to the engine', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  engine(on)
  const ui = await $.ui.mount(NOTICE(120, 'work'))
  expect(await ui.find({ type: 'Raster' } as any)).toBeUndefined()
  expect(await ui.find({ text: 'engine InfoNotice' } as any)).toBeDefined()
})

test('the prompt keeps its hint line and gets a web at its right end', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  engine(on)
  const ui = await $.ui.mount(HINT(100))
  expect(await ui.find({ text: 'engine PromptHint' } as any)).toBeDefined()
  const top = await placed(ui, 'at-top')
  const bottom = await placed(ui, 'at-bottom')
  // hint row -1, status line -2, bottom border -3, one draft row -4, top border -5
  expect(bottom.props.top).toBe(-3)
  expect(top.props.top).toBe(-5)
  const cells = text(decode(((await ui.find({ type: 'Raster', props: { key: 'top' } } as any)) as any).props.cells))
  expect(cells).toContain('─')
  expect(cells).toMatch(/[⠁-⣿]/) // the corner webs, in braille
  expect(cells).toMatch(/[жЖ]/) // and the spider on the border
})

test('every month draws over the logo and the prompt box', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  engine(on)
  for (let m = 0; m < 12; m++) {
    await $.command.run({ command: 'seasons', args: String(m + 1) } as any)
    const header = await $.ui.mount(NOTICE(120))
    const top = (await header.find({ type: 'Raster', props: { key: 'top' } } as any)) as any
    expect(text(decode(top.props.cells))).toContain('Claude Code v')
    await header.unmount()
    const hint = await $.ui.mount(HINT(100))
    expect(await hint.find({ text: 'engine PromptHint' } as any)).toBeDefined()
    const border = text(decode(((await hint.find({ type: 'Raster', props: { key: 'top' } } as any)) as any).props.cells))
    expect(border).toContain(MONTHS[m].critter.glyphs[0])
    await hint.unmount()
  }
})

test('/seasons previews a month for the session, and auto goes back', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  engine(on)
  const shown = await $.command.run({ command: 'seasons', args: 'mar' } as any)
  expect((shown as any).text).toContain('march')
  const ui = await $.ui.mount(HINT(100))
  const border = text(decode(((await ui.find({ type: 'Raster', props: { key: 'top' } } as any)) as any).props.cells))
  expect(border).toContain('☘')
  await ui.unmount()
  const back = await $.command.run({ command: 'seasons', args: 'auto' } as any)
  expect((back as any).text).toContain('october')
  const bad = await $.command.run({ command: 'seasons', args: 'smarch' } as any)
  expect((bad as any).text).toContain('Try')
})

test('each month has its own words, none naming a holiday', async () => {
  const names = /halloween|christmas|valentine|easter|thanksgiving|patrick|independence|new year's/i
  expect(WORDS.length).toBe(12)
  for (const w of WORDS) {
    expect(w.verbs.length).toBeGreaterThan(10)
    expect(w.past.length).toBeGreaterThan(5)
    for (const s of [...w.verbs, ...w.past, ...w.taglines]) expect(names.test(s)).toBe(false)
  }
})

test('the draft\'s rows and the caret column follow wrapping and newlines', async () => {
  expect(promptShape('', 0, 100)).toEqual({ rows: 1, caret: 2, wide: false })
  expect(promptShape('abc', 3, 100)).toEqual({ rows: 1, caret: 5, wide: false })
  expect(promptShape('a\nbcd', 5, 100)).toEqual({ rows: 2, caret: 5, wide: false })
  expect(promptShape('x'.repeat(150), 150, 100).rows).toBe(2)
})

test('the web keeps off the left of the box, and off a draft that reaches it', async () => {
  expect(promptShape('short', 5, 100).wide).toBe(false)
  expect(promptShape('x'.repeat(90), 90, 100).wide).toBe(true)
  expect(promptShape('x'.repeat(300), 300, 100).wide).toBe(true)
})
