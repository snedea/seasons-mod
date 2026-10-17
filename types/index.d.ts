export type Mood = 'idle' | 'working'

declare module 'claude-code' {
  interface PluginState {
    seasons: { enabled: boolean }
  }
}
