# seasons

A Claude Code mod that dresses the terminal itself for the month, instead of adding a banner.

**October: Halloween.**

- **The logo block** is painted over: Clawd wears a witch hat, the title line turns pumpkin orange
  with a tagline that changes now and then, a moon sits on the right with a cloud drifting past,
  and a cobweb hangs in the top right corner with its spider on a thread. Under the logo, one row
  of graveyard: jack-o'-lanterns at Clawd's feet, tombstones, and a ghost drifting about.
- **The prompt box** gets a purple-to-orange border and a corner web hanging from its top right
  corner, on the right where it stays clear of your draft and the newest text (and steps off the
  draft's row when a long line reaches it). A spider lives on the top border: it scuttles over to your caret while you type, patrols while Claude works, ties
  a knot of silk at every tool call, and takes the silk back in once the turn is done. A ghost
  drifts along the bottom border while a turn runs.
- **Before your first prompt** a spider lets itself down into the empty screen on a silk thread to
  say hello, and climbs home when you send something.
- While Claude works, Clawd holds out a lantern and every tool call lets a bat fly out of the hat.
  Clawd hops when the turn ends. The spinner says things like "Conjuring..." and the closing line
  "Brewed for 12s".

Nothing flashes: every light change is a slow fade. Bash mode keeps the engine's own border color.

Outside October nothing is drawn. `/halloween` turns it off and on, remembered across sessions.
Terminal only.

## Install

At the prompt of a terminal session:

```
/plugin install seasons --marketplace snedea/seasons-mod
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install seasons --marketplace snedea/seasons-mod
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with
`snedea/seasons-mod`, then Add plugin.

### Turn on the logo decorations

Claude Code has no render site for the logo block itself, but the notice line under it is one.
The mod draws from the `tmux session: seasons` notice (up over the logo, with absolutely placed
cells), which the engine shows whenever `CLAUDE_CODE_TMUX_SESSION` is set. Add it to
`~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_CODE_TMUX_SESSION": "seasons" } }
```

A real `claude --tmux` session sets its own name there, and the mod leaves that notice alone.
If the engine has more notices than it shows ("1 more notice hidden", as under `--debug`), the
logo decorations wait for a start without them; the prompt box is decorated regardless.

The prompt decorations assume the fullscreen layout (`"tui": "fullscreen"`) and a status line of
at most one row.

## Credits

Scene style follows the pixel-art header engine in [floweyes](https://github.com/floweyes/floweyes).
