#!/usr/bin/env bash
# Screenshots of every month, mid-turn, into docs/screenshots/.
#
#   scripts/shoot.sh            all twelve
#   scripts/shoot.sh 3 12       just March and December
#
# Each month runs in its own tmux session (socket "seasons-shots"; watch with
# `tmux -L seasons-shots attach -t seasons-<n>`), started on that month with
# SEASONS_MONTH, and is asked for pi to 1000 digits so the spinner shows. The
# capture is rendered by scripts/ansi2png.py. Needs tmux, claude, Pillow, and
# CLAUDE_CODE_TMUX_SESSION=seasons in ~/.claude/settings.json env.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/screenshots"
WORK="$(mktemp -d)"
COLS=120
ROWS=34
NAMES=(january february march april may june july august september october november december)
PROMPT="Count pi to 1000 digits"

mkdir -p "$OUT"
cat > "$WORK/tmux.conf" <<'EOF'
set -g mouse on
set -g focus-events on
set -g status off
set -g default-terminal "xterm-256color"
set -as terminal-features ",*:RGB"
EOF
T() { tmux -L seasons-shots -f "$WORK/tmux.conf" "$@"; }
pause() { perl -e "select(undef,undef,undef,$1)"; }
spinning() { T capture-pane -p -t "$1" | grep -qE '… \([0-9]+s'; }

months=("$@")
[ ${#months[@]} -eq 0 ] && months=(1 2 3 4 5 6 7 8 9 10 11 12)

for m in "${months[@]}"; do
  s="seasons-$m"
  name="$(printf '%02d' "$m")-${NAMES[$((m - 1))]}"
  T kill-session -t "$s" 2>/dev/null || true
  T new -d -s "$s" -x "$COLS" -y "$ROWS" "cd '$ROOT' && SEASONS_MONTH=$m claude --model haiku"
  for _ in $(seq 1 60); do T capture-pane -p -t "$s" | grep -q 'Claude Code v' && break; pause 0.5; done
  pause 4
  T send-keys -t "$s" -l "$PROMPT"
  T send-keys -t "$s" Enter
  for _ in $(seq 1 100); do spinning "$s" && break; pause 0.3; done
  T capture-pane -e -p -t "$s" > "$WORK/$name.txt"
  pause 2.5
  # keep the later frame if the spinner is still up in it
  if spinning "$s"; then T capture-pane -e -p -t "$s" > "$WORK/$name.txt"; fi
  python3 "$ROOT/scripts/ansi2png.py" "$WORK/$name.txt" "$OUT/$name.png" "$COLS"
  T kill-session -t "$s"
  echo "$name.png"
done
rm -rf "$WORK"
