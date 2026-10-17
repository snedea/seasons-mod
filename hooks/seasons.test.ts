import { expect, mock, test } from 'claude-code/testing'

const OCTOBER = Date.parse('2026-10-16T21:00:00')
const JULY = Date.parse('2026-07-04T21:00:00')
// the notice row under the logo, as the engine raises it for
// CLAUDE_CODE_TMUX_SESSION=seasons (or for a real tmux session)
const BAND = (columns: number, session = 'seasons') => ({
  plugin: 'seasons',
  surface: 'terminal',
  component: 'InfoNotice',
  requestId: `notice:tmux session: ${session}`,
  viewport: { columns, rows: 40 },
  props: { text: `tmux session: ${session} · detach with ctrl+b d`, command: null },
}) as any

// stands in for the engine's own notice, drawn when the plugin passes
const engineBand = (on: any) =>
  on('ui.render', async ($: any, e: any) => h($.ui.resolve(e).Text, {}, 'engine notice'))

function decode(b64: string): Uint32Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Uint32Array(bytes.buffer)
}

test('in October the band is a Raster of the night, 8 rows of half-block pixels under the logo', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  const ui = await $.ui.mount(BAND(120))
  const raster = await ui.find({ type: 'Raster' } as any)
  expect(raster).toBeDefined()
  const { columns, rows, cells } = (raster as any).props
  expect(columns).toBe(118) // less the notice's gutter
  expect(rows).toBe(8)
  const words = decode(cells)
  expect(words.length).toBe(118 * 8 * 3)
  // every cell is the upper-half block, and Clawd's orange is somewhere in it
  let hasClawd = false
  for (let i = 0; i < words.length; i += 3) {
    expect(words[i]).toBe(0x2580)
    if (words[i + 1] === 0xd87858 || words[i + 2] === 0xd87858) hasClawd = true
  }
  expect(hasClawd).toBe(true)
})

test('the band fits the witch hat', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  const ui = await $.ui.mount(BAND(120))
  const words = decode(((await ui.find({ type: 'Raster' } as any)) as any).props.cells)
  const HAT_LIT = 0x7040a8 // C.hatLit 0x6c42aa on the dither grid
  let hasHat = false
  for (let i = 0; i < words.length; i += 3) {
    if (words[i + 1] === HAT_LIT || words[i + 2] === HAT_LIT) hasHat = true
  }
  expect(hasHat).toBe(true)
})

test('outside October the row is blank, not a stray tmux notice', async ($, on) => {
  mock.clock(on, { now: JULY })
  engineBand(on)
  const ui = await $.ui.mount(BAND(120))
  expect(await ui.find({ type: 'Raster' } as any)).toBeUndefined()
  expect(await ui.find({ text: 'engine notice' } as any)).toBeUndefined()
})

test('a real tmux session notice is left to the engine', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  engineBand(on)
  const ui = await $.ui.mount(BAND(120, 'work'))
  expect(await ui.find({ type: 'Raster' } as any)).toBeUndefined()
  expect(await ui.find({ text: 'engine notice' } as any)).toBeDefined()
})

test('/halloween puts the graveyard to sleep and wakes it', async ($, on) => {
  mock.clock(on, { now: OCTOBER })
  engineBand(on)
  mock.store(on)
  const off = await $.command.run({ command: 'halloween', args: '' } as any)
  expect((off as any).text).toContain('sleeps')
  const ui = await $.ui.mount(BAND(100))
  expect(await ui.find({ type: 'Raster' } as any)).toBeUndefined()
  await ui.unmount()
  const back = await $.command.run({ command: 'halloween', args: '' } as any)
  expect((back as any).text).toContain('moon is up')
  const again = await $.ui.mount(BAND(100))
  expect(await again.find({ type: 'Raster' } as any)).toBeDefined()
})
