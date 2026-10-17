export type Mood = 'idle' | 'working'

/** What decides where the prompt box's decorations sit. */
export type PromptLayout = {
  /** Rows the draft takes in the box. */
  rows: number
  /** Bash mode: the engine colors the border, so it is left alone. */
  bash: boolean
  /** The draft reaches the web at the box's right end, which keeps off its rows. */
  wide: boolean
  /** Rows the status line takes under the box. */
  status: number
}

declare module 'claude-code' {
  interface PluginState {
    seasons: { enabled: boolean; prompt: PromptLayout }
  }
}
