# seasons

A Claude Code mod that draws an animated pixel-art night at the top of the session, right under the Claude Code logo,
themed by the month.

**October: Halloween.** A moonlit graveyard drawn in half-block pixels: a harvest moon with drifting
clouds, a haunted house with slow-lit windows, a dead tree with an owl, a ghost, tombstones,
jack-o'-lanterns, ground fog, and a witch who crosses the moon now and then. Clawd sits by the
pumpkins in a witch hat watching the moon; while a turn runs Clawd patrols the graves with a lantern,
each tool call lets a bat go, and Clawd hops when the turn ends. The spinner says things like
"Conjuring..." and the closing line "Brewed for 12s".

Nothing flashes: every light change is a slow fade.

Outside October the row stays blank. `/halloween` turns it off and on, remembered across sessions.
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

### Turn on the row under the logo

Claude Code has no render site for the logo block itself, but the notice line under it is one.
The mod draws into the `tmux session: seasons` notice, which the engine shows whenever
`CLAUDE_CODE_TMUX_SESSION` is set. Add it to `~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_CODE_TMUX_SESSION": "seasons" } }
```

A real `claude --tmux` session sets its own name there, and the mod leaves that notice alone.

## Credits

Scene style follows the pixel-art header engine in [floweyes](https://github.com/floweyes/floweyes).
