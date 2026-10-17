// Seasons: the month, drawn into the chrome Claude Code already draws, not in a
// band of its own.
//
// The logo block has no render site, but the dim notice line right under it does
// (InfoNotice). Setting CLAUDE_CODE_TMUX_SESSION=seasons in settings.json env makes
// the engine raise its "tmux session: seasons" notice on every start; this mod
// draws a one-row yard there and, from it, paints absolutely placed Rasters up
// over the logo: Clawd in the month's hat, the title in the month's colors, the
// sky, a corner decoration. The prompt's hint line (PromptHint) is drawn by the
// engine as ever, with Rasters placed over the box's borders: a decoration at
// the box's right end (away from the draft and the newest text), a critter that
// walks to the caret while you type and patrols while Claude works, something
// drifting on the bottom border. Before the first prompt something comes down
// into the empty transcript to say hello. What each month looks like is in
// months/; scene.ts moves it all.
//
// /seasons turns it off and on, and previews any month for the session.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Canvas, Run } from './canvas'
import { MONTHS } from './months'
import { HEADER_ROWS, Scene, WEB_COLUMNS, promptShape } from './scene'
import type { PromptLayout } from '../types'

const FPS = 10
const GUTTER = 2 // both sites start two columns in: the notice's mark, the hint's indent
const SENTINEL = 'tmux session: seasons'
const CLAWD_COLUMNS = 11 // Clawd and the gap before the logo's text
const MODEL_LINE = 34 // room left for the logo's model and plan line, which no API names

const enabled = atom({ plugin: 'seasons', key: 'enabled' } as const, true)
// a month shown in place of the calendar's, for this session only
const preview = atom({ plugin: 'seasons', key: 'preview' } as const, -1)
const NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
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
async function track($: EngineInterface, scene: Scene, columns: number, typed: boolean): Promise<void> {
  const { text, cursor } = await $.prompt.read()
  const { rows, caret, wide } = promptShape(text, cursor, columns)
  if (typed) scene.typed(caret)
  const bash = text.startsWith('!')
  const now = await read($, promptLayout)
  if (now.rows !== rows || now.bash !== bash || now.wide !== wide) {
    await update($, promptLayout, p => ({ ...p, rows, bash, wide }))
  }
}

// The month to show: the preview if one is set, else the calendar's.
async function monthNow($: EngineInterface): Promise<number> {
  const p = await read($, preview)
  return p >= 0 ? p : new Date(await $.clock.now()).getMonth()
}

// "mar", "March", "3": the month index, or -1.
function parseMonth(arg: string): number {
  const a = arg.trim().toLowerCase()
  const n = Number(a)
  if (Number.isInteger(n) && n >= 1 && n <= 12) return n - 1
  return a.length >= 3 ? NAMES.findIndex(m => m.startsWith(a)) : -1
}

type Shown = { month: number }

// Follows the calendar or the preview; a new month swaps the theme and redraws.
async function follow($: EngineInterface, scene: Scene, shown: Shown, sent: Map<string, string>): Promise<void> {
  const m = await monthNow($)
  if (m === shown.month) return
  shown.month = m
  scene.theme = MONTHS[m]
  sent.clear()
  $.ui.invalidate('ui.render')
}

export const register: Register = on => {
  const scene = new Scene(MONTHS[new Date().getMonth()])
  let header: Site | null = null
  let greeting: Site | null = null
  let prompt: Site | null = null
  let promptColumns = 0
  const shown: Shown = { month: -1 }
  let isOn = true
  let isBusy = false
  let version = ''
  let cwd = ''
  const sent = new Map<string, string>()

  const live = () => isOn && shown.month >= 0


  on('session.start', async ($, e, next) => {
    // SEASONS_MONTH=mar (or 3) starts the session on that month, as /seasons mar would
    const forced = parseMonth((await $.env.get('SEASONS_MONTH')) ?? '')
    if (forced >= 0) await update($, preview, () => forced)
    await follow($, scene, shown, sent)
    const saved = await $.store.get('enabled')
    if (saved === false) await update($, enabled, () => false)
    isOn = await read($, enabled)
    version = (await $.session.version()).version
    cwd = e.cwd
    const settings = (await $.settings.read()) as Record<string, unknown>
    const status = settings.statusLine ? 1 : 0
    await update($, promptLayout, p => ({ ...p, status }))
    await $.command.register({
      name: 'seasons',
      description: 'Turn the decorations off or on, or preview a month: /seasons mar, /seasons auto',
    })

    let wasGreeting = true
    $.clock.every(Math.round(1000 / FPS), () => {
      scene.step(1 / FPS, promptColumns)
      if (wasGreeting && scene.greet === null) {
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
    $.clock.every(60_000, () => void follow($, scene, shown, sent))

    return next(e)
  })

  on('command.run', { command: 'seasons' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === '' || arg === 'on' || arg === 'off') {
      const value = arg === '' ? !(await read($, enabled)) : arg === 'on'
      await update($, enabled, () => value)
      await $.store.set('enabled', value)
      isOn = value
      sent.clear()
      $.ui.invalidate('ui.render')
      return { text: value ? 'Decorations are up.' : 'Decorations are packed away. /seasons brings them back.' }
    }
    if (arg === 'auto') {
      await update($, preview, () => -1)
      await follow($, scene, shown, sent)
      return { text: `Back to the calendar: ${NAMES[shown.month]}.` }
    }
    const m = parseMonth(arg)
    if (m < 0) return { text: 'Try /seasons mar, /seasons 12, /seasons auto, or /seasons off.' }
    await update($, preview, () => m)
    await follow($, scene, shown, sent)
    return { text: `Showing ${NAMES[m]} for this session. /seasons auto goes back to the calendar.` }
  })

  on('turn.start', ($, e, next) => {
    scene.mood = 'working'
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (scene.mood === 'working') scene.cheer()
    scene.mood = 'idle'
    return next(e)
  })

  on('tool.call', ($, e, next) => {
    scene.toolCall()
    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    scene.dismissGreeting()
    return next(e)
  })

  on('prompt.edit', async ($, e, next) => {
    const r = await next(e)
    if (live() && promptColumns > 0) await track($, scene, promptColumns, true)
    return r
  })

  on('prompt.change', async ($, e, next) => {
    const r = await next(e)
    if (live() && promptColumns > 0) await track($, scene, promptColumns, false)
    return r
  })

  // a message in the transcript (a resumed session, say): no greeting
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    scene.dismissGreeting()
    return next(e)
  })

  on('ui.render', { component: 'InfoNotice' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || !e.props.text.startsWith(SENTINEL)) return next(e)
    const { Box, Raster } = $.ui.resolve(e)
    await follow($, scene, shown, sent)
    if (!(await read($, enabled))) {
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
    header = { requestId: e.requestId, blocks, canvas: () => scene.header(info) }
    const cv = scene.header(info)
    const place = (b: Block, top: number, left: number) => (
      <Box key={`at-${b.key}`} position="absolute" top={top} left={left}>
        <Raster key={b.key} columns={b.w} rows={b.h} cells={cv.pack(b.x, b.y, b.w, b.h)} />
      </Box>
    )
    for (const b of blocks) sent.set(`${e.requestId}/${b.key}`, '')

    let thread = null
    if (scene.greet !== null) {
      const rows = Math.max(3, Math.min(12, Math.floor((e.viewport?.rows ?? 40) * 0.3)))
      const g: Block = { key: 'greet', x: 0, y: 0, w: 1, h: rows }
      greeting = { requestId: e.requestId, blocks: [g], canvas: () => scene.greeting(rows) }
      sent.set(`${e.requestId}/greet`, '')
      thread = (
        <Box key="at-greet" position="absolute" top={1} left={W - 9 - GUTTER}>
          <Raster key="greet" columns={1} rows={rows} cells={scene.greeting(rows).pack(0, 0, 1, rows)} />
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
    await follow($, scene, shown, sent)
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
    const draw = () => scene.prompt(W, paint, rows, status)
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
      ? next({ ...e, props: { ...e.props, word: scene.verb(e.props.word) } })
      : next(e),
  )

  on('ui.render', { component: 'TurnDuration' }, ($, e, next) =>
    live() ? next({ ...e, props: { ...e.props, word: scene.past(e.props.word) } }) : next(e),
  )
}
