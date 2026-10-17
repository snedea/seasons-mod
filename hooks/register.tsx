// Seasons: Halloween in the chrome Claude Code already draws, not in a band of
// its own.
//
// The logo block has no render site, but the dim notice line right under it does
// (InfoNotice). Setting CLAUDE_CODE_TMUX_SESSION=seasons in settings.json env makes
// the engine raise its "tmux session: seasons" notice on every start; this mod
// draws a one-row graveyard there and, from it, paints absolutely placed Rasters
// up over the logo: Clawd in a witch hat, the title in pumpkin orange, a moon, a
// corner cobweb and its spider. The prompt's hint line (PromptHint) is drawn by
// the engine as ever, with Rasters placed over the box's borders: a corner web
// at the box's right end (away from the draft and the newest text), a spider that
// walks to the caret while you type and patrols while Claude works, a ghost on
// the bottom border. Before the first prompt a spider lets itself down into the
// empty transcript to say hello.
//
// /halloween turns it off and on, remembered across sessions.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Canvas, Run } from './canvas'
import { HEADER_ROWS, Haunt, WEB_COLUMNS, isHalloweenSeason, promptShape, spookyPast, spookyWord } from './halloween'
import type { PromptLayout } from '../types'

const FPS = 10
const GUTTER = 2 // both sites start two columns in: the notice's mark, the hint's indent
const SENTINEL = 'tmux session: seasons'
const CLAWD_COLUMNS = 11 // Clawd and the gap before the logo's text
const MODEL_LINE = 34 // room left for the logo's model and plan line, which no API names

const enabled = atom({ plugin: 'seasons', key: 'enabled' } as const, true)
const promptLayout = atom({ plugin: 'seasons', key: 'prompt' } as const, {
  rows: 1,
  bash: false,
  status: 1,
  wide: false,
} as PromptLayout)

type Block = { key: string; x: number; y: number; w: number; h: number }
type Site = { requestId: string; blocks: Block[]; canvas: () => Canvas }

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`

// Repaints a site's Rasters whose cells changed since last sent; false once the
// site is gone (hidden, resized, redrawn without them).
async function blit($: EngineInterface, site: Site, sent: Map<string, string>): Promise<boolean> {
  const cv = site.canvas()
  for (const b of site.blocks) {
    const cells = cv.pack(b.x, b.y, b.w, b.h)
    const id = `${site.requestId}/${b.key}`
    if (sent.get(id) === cells) continue
    const r = await $.ui.blit({ requestId: site.requestId, key: b.key, cells })
    if ('deny' in r && r.deny) return false
    sent.set(id, cells)
  }
  return true
}

// The draft decides where the box's top border is, and where the caret is.
async function track($: EngineInterface, haunt: Haunt, columns: number, typed: boolean): Promise<void> {
  const { text, cursor } = await $.prompt.read()
  const { rows, caret, wide } = promptShape(text, cursor, columns)
  if (typed) haunt.typed(caret)
  const bash = text.startsWith('!')
  const now = await read($, promptLayout)
  if (now.rows !== rows || now.bash !== bash || now.wide !== wide) {
    await update($, promptLayout, p => ({ ...p, rows, bash, wide }))
  }
}

export const register: Register = on => {
  const haunt = new Haunt()
  let header: Site | null = null
  let greeting: Site | null = null
  let prompt: Site | null = null
  let promptColumns = 0
  let inSeason = false
  let isOn = true
  let isBusy = false
  let version = ''
  let cwd = ''
  const sent = new Map<string, string>()

  const live = () => inSeason && isOn

  on('session.start', async ($, e, next) => {
    inSeason = isHalloweenSeason(await $.clock.now())
    const saved = await $.store.get('enabled')
    if (saved === false) await update($, enabled, () => false)
    isOn = await read($, enabled)
    version = (await $.session.version()).version
    cwd = e.cwd
    const settings = (await $.settings.read()) as Record<string, unknown>
    const status = settings.statusLine ? 1 : 0
    await update($, promptLayout, p => ({ ...p, status }))
    await $.command.register({
      name: 'halloween',
      description: 'Turn the Halloween decorations off or on',
    })

    let wasGreeting = true
    $.clock.every(Math.round(1000 / FPS), () => {
      haunt.step(1 / FPS, promptColumns)
      if (wasGreeting && haunt.greet === null) {
        wasGreeting = false
        greeting = null
        $.ui.invalidate('ui.render') // the thread is home: drop its Raster
      }
      if (isBusy || !live()) return
      isBusy = true
      void (async () => {
        for (const which of ['header', 'greeting', 'prompt'] as const) {
          const site = which === 'header' ? header : which === 'greeting' ? greeting : prompt
          if (!site) continue
          const ok = await blit($, site, sent).catch(() => false)
          if (ok) continue
          // not mounted any more (hidden, a resize): wait for the next draw
          if (which === 'header') header = null
          else if (which === 'greeting') greeting = null
          else prompt = null
        }
      })().finally(() => { isBusy = false })
    })
    // the month can turn over in a long session
    $.clock.every(60_000, () => {
      void $.clock.now().then(ms => {
        const now = isHalloweenSeason(ms)
        if (now !== inSeason) { inSeason = now; $.ui.invalidate('ui.render') }
      })
    })

    return next(e)
  })

  on('command.run', { command: 'halloween' }, async $ => {
    const value = !(await read($, enabled))
    await update($, enabled, () => value)
    await $.store.set('enabled', value)
    isOn = value
    sent.clear()
    inSeason = isHalloweenSeason(await $.clock.now())
    if (!inSeason) return { text: 'Halloween is an October thing; it will be back next October.' }
    return { text: value ? 'The moon is up. Happy Halloween.' : 'The cobwebs are swept away. /halloween brings them back.' }
  })

  on('turn.start', ($, e, next) => {
    haunt.mood = 'working'
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (haunt.mood === 'working') haunt.cheer()
    haunt.mood = 'idle'
    return next(e)
  })

  on('tool.call', ($, e, next) => {
    haunt.toolCall()
    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    haunt.dismissGreeting()
    return next(e)
  })

  on('prompt.edit', async ($, e, next) => {
    const r = await next(e)
    if (live() && promptColumns > 0) await track($, haunt, promptColumns, true)
    return r
  })

  on('prompt.change', async ($, e, next) => {
    const r = await next(e)
    if (live() && promptColumns > 0) await track($, haunt, promptColumns, false)
    return r
  })

  // a message in the transcript (a resumed session, say): no greeting
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    haunt.dismissGreeting()
    return next(e)
  })

  on('ui.render', { component: 'InfoNotice' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || !e.props.text.startsWith(SENTINEL)) return next(e)
    const { Box, Raster } = $.ui.resolve(e)
    inSeason = isHalloweenSeason(await $.clock.now())
    if (!inSeason || !(await read($, enabled))) {
      header = null
      greeting = null
      return <Box />
    }
    const W = Math.max(20, Math.min(512, e.viewport?.columns ?? 100))
    const info = { columns: W, version, cwd }
    // around the logo's text: the rows above and below it, Clawd, the title
    // line, and right of the model and path lines
    const right = CLAWD_COLUMNS + Math.max(MODEL_LINE, cwd.length) + 2
    const blocks: Block[] = [
      { key: 'top', x: 0, y: 0, w: W, h: 2 },
      { key: 'clawd', x: 0, y: 2, w: CLAWD_COLUMNS, h: 2 },
      ...(right < W - 6 ? [{ key: 'right', x: right, y: 2, w: W - right, h: 2 }] : []),
      { key: 'yard', x: 0, y: 4, w: W, h: 2 },
    ]
    header = { requestId: e.requestId, blocks, canvas: () => haunt.header(info) }
    const cv = haunt.header(info)
    const place = (b: Block, top: number, left: number) => (
      <Box key={`at-${b.key}`} position="absolute" top={top} left={left}>
        <Raster key={b.key} columns={b.w} rows={b.h} cells={cv.pack(b.x, b.y, b.w, b.h)} />
      </Box>
    )
    for (const b of blocks) sent.set(`${e.requestId}/${b.key}`, '')

    let thread = null
    if (haunt.greet !== null) {
      const rows = Math.max(3, Math.min(12, Math.floor((e.viewport?.rows ?? 40) * 0.3)))
      const g: Block = { key: 'greet', x: 0, y: 0, w: 1, h: rows }
      greeting = { requestId: e.requestId, blocks: [g], canvas: () => haunt.greeting(rows) }
      sent.set(`${e.requestId}/greet`, '')
      thread = (
        <Box key="at-greet" position="absolute" top={1} left={W - 9 - GUTTER}>
          <Raster key="greet" columns={1} rows={rows} cells={haunt.greeting(rows).pack(0, 0, 1, rows)} />
        </Box>
      )
    }
    const notice = HEADER_ROWS - 1 // the notice row is the header's last
    return (
      <Box height={1}>
        {blocks.map(b => place(b, b.y - notice, b.x - GUTTER))}
        {thread}
      </Box>
    )
  })

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    inSeason = isHalloweenSeason(await $.clock.now())
    isOn = await read($, enabled)
    if (e.surface !== 'terminal' || !live()) {
      prompt = null
      return next(e)
    }
    const { Box, Text, Raster } = $.ui.resolve(e)
    const engine = await next(e)
    const W = Math.max(20, Math.min(512, e.viewport?.columns ?? 100))
    promptColumns = W
    const { rows, bash, status, wide } = await read($, promptLayout)
    // canvas rows from the row over the box to the hint line; as offsets from
    // the hint line's box the hint row is -1, the status line above it, then
    // the bottom border, the draft, the top border
    const hintRow = 3 + rows + status
    const at = (y: number) => y - hintRow - 1
    const topRow = 1
    const bottomRow = 2 + rows
    const paint = !bash
    const blocks: Block[] = paint
      ? [
          { key: 'top', x: 0, y: topRow, w: W, h: 1 },
          { key: 'bottom', x: 0, y: bottomRow, w: W, h: 1 },
        ]
      : []
    const draw = () => haunt.prompt(W, paint, rows, status)
    prompt = paint ? { requestId: e.requestId, blocks, canvas: draw } : null
    for (const b of blocks) sent.set(`${e.requestId}/${b.key}`, '')
    const cv = draw()

    const runs = (list: Run[], y: number) =>
      list.map(r => (
        <Box key={`r${y}-${r.x}`} position="absolute" top={at(y)} left={r.x - GUTTER}>
          <Text color={hex(r.color)}>{r.text}</Text>
        </Box>
      ))
    // the web's rows other than the borders, in its own columns: the draft's
    // only while the draft stays clear of it; never the row over the box,
    // where the engine's effort label sits at the right
    const zone = W - WEB_COLUMNS - 2
    const strands = []
    for (let y = topRow + 1; y <= hintRow; y++) {
      if (y === bottomRow || (y < bottomRow && wide)) continue
      strands.push(...runs(cv.runs(y, zone, W), y))
    }
    return (
      <Box>
        {engine}
        {paint
          ? [
              <Box key="at-top" position="absolute" top={at(topRow)} left={-GUTTER}>
                <Raster key="top" columns={W} rows={1} cells={cv.pack(0, topRow, W, 1)} />
              </Box>,
              <Box key="at-bottom" position="absolute" top={at(bottomRow)} left={-GUTTER}>
                <Raster key="bottom" columns={W} rows={1} cells={cv.pack(0, bottomRow, W, 1)} />
              </Box>,
            ]
          : [...runs(cv.runs(topRow), topRow), ...runs(cv.runs(bottomRow), bottomRow)]}
        {strands}
      </Box>
    )
  })

  on('ui.render', { component: 'Spinner' }, ($, e, next) =>
    live() && e.props.message === null
      ? next({ ...e, props: { ...e.props, word: spookyWord(e.props.word) } })
      : next(e),
  )

  on('ui.render', { component: 'TurnDuration' }, ($, e, next) =>
    live() ? next({ ...e, props: { ...e.props, word: spookyPast(e.props.word) } }) : next(e),
  )
}
