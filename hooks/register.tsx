// Seasons: a pixel-art night under the Claude Code logo, themed by the month.
//
// The logo block has no render site of its own, but the dim notice line right
// under it does (InfoNotice). Setting CLAUDE_CODE_TMUX_SESSION=seasons in
// settings.json env makes the engine raise its "tmux session: seasons" notice
// on every start, and this mod draws the night in that row instead.
//
// October is Halloween (halloween.ts): a moonlit graveyard where Clawd, in a witch
// hat, sits by the jack-o'-lanterns watching the moon. While a turn runs Clawd
// patrols the graves with a lantern; every tool call lets a bat go; when the turn
// ends Clawd hops. The spinner and the turn's closing line speak Halloween too.
// /halloween turns it off and on, remembered across sessions.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { Scene, isHalloweenSeason, spookyPast, spookyWord } from './halloween'

const FPS = 12
const ROWS = 8
const GUTTER = 2 // the notice's own mark at the left of the row
const SENTINEL = 'tmux session: seasons'
const RASTER = 'night'
const enabled = atom({ plugin: 'seasons', key: 'enabled' } as const, true)

export const register: Register = on => {
  const scene = new Scene()
  let site: { requestId: string; columns: number; rows: number } | null = null
  let inSeason = false
  let isOn = true
  let isBusy = false

  on('session.start', async ($, e, next) => {
    inSeason = isHalloweenSeason(await $.clock.now())
    const saved = await $.store.get('enabled')
    if (saved === false) await update($, enabled, () => false)
    isOn = await read($, enabled)
    await $.command.register({
      name: 'halloween',
      description: 'Turn the Halloween night under the logo off or on',
    })

    $.clock.every(Math.round(1000 / FPS), () => {
      scene.step(1 / FPS)
      if (!site || isBusy) return
      const { requestId, columns, rows } = site
      isBusy = true
      void $.ui
        .blit({ requestId, key: RASTER, cells: scene.render(columns, rows) })
        .then(r => {
          // not mounted any more (hidden, a survey, a resize): wait for the next draw
          if ('deny' in r && r.deny) site = null
        })
        .catch(() => { site = null })
        .finally(() => { isBusy = false })
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
    inSeason = isHalloweenSeason(await $.clock.now())
    if (!inSeason) return { text: 'Halloween is an October thing; it will be back next October.' }
    return { text: value ? 'The moon is up. Happy Halloween.' : 'The graveyard sleeps. /halloween wakes it.' }
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
    scene.releaseBat()
    return next(e)
  })

  on('ui.render', { component: 'InfoNotice' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || !e.props.text.startsWith(SENTINEL)) return next(e)
    const { Box, Raster } = $.ui.resolve(e)
    inSeason = isHalloweenSeason(await $.clock.now())
    if (!inSeason || !(await read($, enabled))) {
      site = null
      return <Box />
    }
    const columns = Math.max(1, Math.min(512, (e.viewport?.columns ?? 100) - GUTTER))
    site = { requestId: e.requestId, columns, rows: ROWS }
    return <Raster key={RASTER} columns={columns} rows={ROWS} cells={scene.render(columns, ROWS)} />
  })

  on('ui.render', { component: 'Spinner' }, ($, e, next) =>
    inSeason && isOn && e.props.message === null
      ? next({ ...e, props: { ...e.props, word: spookyWord(e.props.word) } })
      : next(e),
  )

  on('ui.render', { component: 'TurnDuration' }, ($, e, next) =>
    inSeason && isOn ? next({ ...e, props: { ...e.props, word: spookyPast(e.props.word) } }) : next(e),
  )
}
