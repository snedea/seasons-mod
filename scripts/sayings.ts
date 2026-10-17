// Writes docs/SAYINGS.md from hooks/words.ts: every month's spinner words,
// closing words and taglines.
//
//   node scripts/sayings.ts
import { writeFileSync } from 'node:fs'

import { WORDS } from '../hooks/words.ts'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const out: string[] = [
  '# Sayings',
  '',
  'Every word the mod puts on screen, by month. Generated from `hooks/words.ts` by',
  '`node scripts/sayings.ts`; edit that file, not this one.',
  '',
  '- **Spinner**: replaces the word Claude Code shows while it works (`Conjuring…`). One is picked',
  '  per turn from the engine\'s own word, so it holds still for the turn.',
  '- **Closing**: replaces the word in the line a turn ends with (`Brewed for 12s`).',
  '- **Taglines**: shown after the title in the logo block, a new one every 40 seconds.',
  '',
]
WORDS.forEach((w, i) => {
  out.push(`## ${MONTHS[i]}`, '')
  out.push(`![${MONTHS[i]}](screenshots/${String(i + 1).padStart(2, '0')}-${MONTHS[i].toLowerCase()}.png)`, '')
  out.push(`**Spinner** (${w.verbs.length}): ${w.verbs.map(v => `${v}…`).join(', ')}`, '')
  out.push(`**Closing** (${w.past.length}): ${w.past.map(p => `${p} for 12s`).join(', ')}`, '')
  out.push(`**Taglines** (${w.taglines.length}): ${w.taglines.map(t => `~ ${t} ~`).join(', ')}`, '')
})
writeFileSync(new URL('../docs/SAYINGS.md', import.meta.url), out.join('\n'))
console.log('wrote docs/SAYINGS.md')
