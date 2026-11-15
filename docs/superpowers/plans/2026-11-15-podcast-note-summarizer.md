# Podcast & Video Note Summarizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullstack Nuxt 3 web workspace for active listening and note-taking from YouTube video podcasts, featuring synchronized interactive timestamps, playback keyboard shortcuts, dark mode minimalist UI, and in-place AI note refinement via Google Gemini.

**Architecture:** Nuxt 3 App with Vue 3 and Tailwind CSS. The workspace features a split-screen layout with a YouTube IFrame Player on the left and a rich Markdown note editor on the right. A reactive player composable manages playback and time-sync. A Nitro server endpoint (`/api/refine`) interfaces with the Gemini API to polish rough notes in-place while strictly preserving user timestamps. Sessions and note revisions auto-persist in browser LocalStorage.

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Tailwind CSS, Lucide Vue Next, Vitest, `@google/genai` (Gemini API).

**Spec:** `docs/superpowers/specs/2026-11-15-podcast-note-summarizer-design.md`

## Global Constraints

- **Framework:** Nuxt 3 (Vue 3, Nitro server engine, TypeScript).
- **Styling:** Dark mode minimalist aesthetic adhering to `design-taste-frontend` (deep dark neutral backgrounds `#0a0a0c`/`#121216`, no tacky gradients or violet tints, crisp typography, equal margins, quiet hover micro-interactions).
- **Player:** YouTube IFrame Player API for video embed and time-sync.
- **AI Behavior:** Refinement overwrites/updates the editor text in-place while keeping an undo snapshot, strictly preserving user timestamps `[mm:ss]`.
- **Testing:** Unit & integration tests written with Vitest.

## Review Focus

1. **Malformed & Varied YouTube URLs:** Handling URLs like `youtu.be/ID`, `youtube.com/watch?v=ID&t=90s`, `youtube.com/shorts/ID`, or invalid URLs without throwing unhandled exceptions.
2. **Notes Without Timestamps:** AI refinement when user notes contain zero timestamps must preserve content and structure cleanly without fabricating fake timestamps.
3. **AI Error & Timeout Handling:** If Gemini API fails, times out, or has no API key set, the user's raw notes must never be lost or replaced with empty content, and a clear error notification must appear.
4. **Rapid Timestamp Shortcut Presses:** Pressing `Ctrl+T` repeatedly at the same second must not corrupt the cursor position or textarea history.
5. **Timestamp Edge Cases in Video Playback:** Seeking to timestamps with hours `[01:15:30]` vs minutes `[04:20]` vs beginning `[00:00]` must calculate seconds accurately and navigate player.

---

### Task 1: Project Scaffolding & Dark Minimalist Setup

**Files:**
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `assets/css/main.css`
- Create: `vitest.config.ts`
- Test: `tests/setup.spec.ts`

**Interfaces:**
- Consumes: None
- Produces: Runnable Nuxt 3 project with Tailwind CSS, Lucide icons, and Vitest test runner.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/setup.spec.ts
import { describe, it, expect } from 'vitest'

describe('Environment & Config Test', () => {
  it('should verify vitest is properly configured', () => {
    const isConfigured = true
    expect(isConfigured).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/setup.spec.ts`  
Expected: FAIL (vitest not installed or configured yet)

- [ ] **Step 3: Implement minimal configuration & dependencies**

Install dependencies in `package.json` (`nuxt`, `vue`, `tailwindcss`, `@nuxtjs/tailwindcss`, `lucide-vue-next`, `vitest`, `@vue/test-utils`, `happy-dom`, `@google/genai`).  
Configure `nuxt.config.ts` with Tailwind and runtimeConfig for `geminiApiKey`.  
Configure `assets/css/main.css` with dark minimalist tokens (`bg-[#0a0a0c]`, `text-[#ededed]`, border tokens).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/setup.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json nuxt.config.ts tsconfig.json tailwind.config.ts assets/css/main.css vitest.config.ts tests/setup.spec.ts
git commit -m "chore: scaffold nuxt 3 project with dark minimalist tailwind and vitest"
```

---

### Task 2: YouTube URL & Timestamp Utilities (TDD)

**Files:**
- Create: `utils/youtube.ts`
- Create: `utils/timestamp.ts`
- Test: `tests/utils/youtube.spec.ts`
- Test: `tests/utils/timestamp.spec.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `extractYouTubeId(url: string): string | null`
  - `parseTimestampToSeconds(ts: string): number`
  - `formatSecondsToTimestamp(sec: number): string`
  - `extractTimestamps(text: string): Array<{ raw: string; seconds: number; index: number }>`

- [ ] **Step 1: Write failing tests for YouTube and Timestamp utilities**

```typescript
// tests/utils/youtube.spec.ts
import { describe, it, expect } from 'vitest'
import { extractYouTubeId } from '~/utils/youtube'

describe('extractYouTubeId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts ID from short youtu.be URL with timestamp param', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ')
  })
  it('extracts ID from shorts URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('returns null for invalid URLs', () => {
    expect(extractYouTubeId('https://google.com')).toBeNull()
  })
})

// tests/utils/timestamp.spec.ts
import { describe, it, expect } from 'vitest'
import { parseTimestampToSeconds, formatSecondsToTimestamp, extractTimestamps } from '~/utils/timestamp'

describe('Timestamp Utils', () => {
  it('converts mm:ss to seconds', () => {
    expect(parseTimestampToSeconds('04:20')).toBe(260)
  })
  it('converts hh:mm:ss to seconds', () => {
    expect(parseTimestampToSeconds('01:15:30')).toBe(4530)
  })
  it('formats seconds to mm:ss', () => {
    expect(formatSecondsToTimestamp(260)).toBe('04:20')
  })
  it('formats >1hr seconds to hh:mm:ss', () => {
    expect(formatSecondsToTimestamp(4530)).toBe('01:15:30')
  })
  it('extracts all timestamp patterns from markdown text', () => {
    const text = 'Opening [00:10], key point [04:20], long discussion [01:05:00]'
    const res = extractTimestamps(text)
    expect(res).toHaveLength(3)
    expect(res[1].seconds).toBe(260)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/`  
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `utils/youtube.ts` and `utils/timestamp.ts`**

Implement regex matching for YouTube video IDs and timestamp conversion functions handling both `[mm:ss]` and `[hh:mm:ss]` formats safely.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add utils/youtube.ts utils/timestamp.ts tests/utils/youtube.spec.ts tests/utils/timestamp.spec.ts
git commit -m "feat: add robust youtube id extraction and timestamp parsing utilities"
```

---

### Task 3: Session State & Undo History Composable (TDD)

**Files:**
- Create: `types/session.ts`
- Create: `composables/useSessions.ts`
- Test: `tests/composables/useSessions.spec.ts`

**Interfaces:**
- Consumes: `types/session.ts`
- Produces:
  - `useSessions(): { currentSession, pastSessions, saveCurrentSession, loadSession, deleteSession, updateNotes, undoLastRefinement, canUndo }`

- [ ] **Step 1: Write failing tests for session management and undo history**

```typescript
// tests/composables/useSessions.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSessions } from '~/composables/useSessions'

describe('useSessions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with default empty session', () => {
    const { currentSession } = useSessions()
    expect(currentSession.value.videoUrl).toBe('')
    expect(currentSession.value.notes).toBe('')
  })

  it('updates notes and supports undo history after AI refinement', () => {
    const { currentSession, updateNotesWithSnapshot, undoLastRefinement, canUndo } = useSessions()
    currentSession.value.notes = 'Catatan kasar'
    updateNotesWithSnapshot('Catatan rapi AI')
    expect(currentSession.value.notes).toBe('Catatan rapi AI')
    expect(canUndo.value).toBe(true)

    undoLastRefinement()
    expect(currentSession.value.notes).toBe('Catatan kasar')
    expect(canUndo.value).toBe(false)
  })

  it('saves and lists past sessions in localStorage', () => {
    const { currentSession, saveCurrentSession, pastSessions } = useSessions()
    currentSession.value = {
      id: 'session-1',
      videoUrl: 'https://www.youtube.com/watch?v=abc',
      videoId: 'abc',
      title: 'Podcast Episode 1',
      notes: 'Notes content',
      updatedAt: Date.now()
    }
    saveCurrentSession()
    expect(pastSessions.value.length).toBe(1)
    expect(pastSessions.value[0].title).toBe('Podcast Episode 1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/composables/useSessions.spec.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `types/session.ts` and `composables/useSessions.ts`**

Define `Session` interface and implement reactive composable with `localStorage` persistence, snapshot history stack for undo, and session CRUD operations.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/composables/useSessions.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types/session.ts composables/useSessions.ts tests/composables/useSessions.spec.ts
git commit -m "feat: implement session management composable with local persistence and undo"
```

---

### Task 4: Player Controller Composable & YouTube Player Component

**Files:**
- Create: `composables/usePlayer.ts`
- Create: `components/YouTubePlayer.vue`
- Test: `tests/composables/usePlayer.spec.ts`

**Interfaces:**
- Consumes: `utils/timestamp.ts`, `utils/youtube.ts`
- Produces:
  - `usePlayer(): { currentTime, duration, isPlaying, playbackRate, seekTo, togglePlay, skipSeconds, setPlaybackRate }`
  - `<YouTubePlayer :videoId="videoId" />`

- [ ] **Step 1: Write failing test for player controller state and commands**

```typescript
// tests/composables/usePlayer.spec.ts
import { describe, it, expect } from 'vitest'
import { usePlayer } from '~/composables/usePlayer'

describe('usePlayer Composable', () => {
  it('manages playback state and seek commands', () => {
    const player = usePlayer()
    expect(player.currentTime.value).toBe(0)
    expect(player.playbackRate.value).toBe(1.0)
    
    player.seekTo(120)
    expect(player.targetSeekTime.value).toBe(120)

    player.skipSeconds(5)
    expect(player.targetSeekTime.value).toBe(125)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/composables/usePlayer.spec.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `composables/usePlayer.ts` and `components/YouTubePlayer.vue`**

Implement `usePlayer.ts` with reactive state for playback tracking and command dispatches.  
Implement `YouTubePlayer.vue`:
- Dynamically injects YouTube IFrame API script tag safely.
- Initializes `YT.Player` on mounted.
- Listens to `onStateChange` and polls `player.getCurrentTime()` when playing.
- Handles `targetSeekTime` watcher to trigger `player.seekTo(seconds, true)`.
- Fallback placeholder if no video is loaded.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/composables/usePlayer.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add composables/usePlayer.ts components/YouTubePlayer.vue tests/composables/usePlayer.spec.ts
git commit -m "feat: add player composable and youtube iframe player component"
```

---

### Task 5: AI Refinement Nitro Server Route (`/api/refine`) (TDD)

**Files:**
- Create: `server/api/refine.post.ts`
- Create: `server/utils/prompt.ts`
- Test: `tests/server/refine.spec.ts`

**Interfaces:**
- Consumes: `GEMINI_API_KEY` from runtime config or env.
- Produces: `POST /api/refine` endpoint accepting `{ notes: string, videoTitle?: string }` returning `{ refinedNotes: string }`.

- [ ] **Step 1: Write failing test for prompt construction and validation**

```typescript
// tests/server/refine.spec.ts
import { describe, it, expect } from 'vitest'
import { buildRefinementPrompt, validateRefineRequest } from '~/server/utils/prompt'

describe('Refine Route Logic', () => {
  it('rejects empty notes payload', () => {
    expect(() => validateRefineRequest({ notes: '   ' })).toThrow('Notes cannot be empty')
  })

  it('constructs prompt containing user notes and strict timestamp preservation instruction', () => {
    const prompt = buildRefinementPrompt('Catatan kasar [02:15] poin penting', 'Podcast Episode')
    expect(prompt).toContain('Catatan kasar [02:15] poin penting')
    expect(prompt).toContain('[mm:ss]')
    expect(prompt).toContain('Podcast Episode')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/refine.spec.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `server/utils/prompt.ts` and `server/api/refine.post.ts`**

Implement validation and system prompt instructing Gemini to:
1. Preserve all timestamp tags `[mm:ss]` and `[hh:mm:ss]`.
2. Format into clean Markdown headings, bullet points, and key takeaways.
3. Fix typos, grammar, and sentence structure without inventing facts.  
Call Google Gemini API via SDK or direct REST with error handling and fallback mock if no API key is set in local environment.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/server/refine.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/utils/prompt.ts server/api/refine.post.ts tests/server/refine.spec.ts
git commit -m "feat: add server route for ai note refinement with gemini api"
```

---

### Task 6: Interactive Notes Editor, Toolbar & Shortcuts (TDD)

**Files:**
- Create: `components/NotesEditor.vue`
- Create: `components/MarkdownPreview.vue`
- Test: `tests/components/NotesEditor.spec.ts`

**Interfaces:**
- Consumes: `usePlayer`, `useSessions`, `utils/timestamp`
- Produces: `<NotesEditor />` component with active editor, timestamp insert, AI refine action with loading state, undo button, markdown preview toggle, and global playback keyboard shortcuts.

- [ ] **Step 1: Write failing test for timestamp insertion at cursor**

```typescript
// tests/components/NotesEditor.spec.ts
import { describe, it, expect } from 'vitest'
import { insertTimestampAtCursor } from '~/utils/editor'

describe('insertTimestampAtCursor', () => {
  it('inserts formatted timestamp badge at cursor position', () => {
    const text = 'Halo dunia'
    const res = insertTimestampAtCursor(text, 4, '02:30')
    expect(res.newText).toBe('Halo [02:30] dunia')
    expect(res.newCursor).toBe(12)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/NotesEditor.spec.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `utils/editor.ts`, `components/MarkdownPreview.vue`, and `components/NotesEditor.vue`**

Implement:
- `insertTimestampAtCursor(text, cursor, ts)` utility.
- `MarkdownPreview.vue`: Renders Markdown with `[mm:ss]` tokens converted to clickable badges that call `player.seekTo(seconds)`.
- `NotesEditor.vue`:
  - Split/toggle between Edit and Preview mode.
  - Shortcut listener: `Ctrl+T` (insert timestamp), `Alt+Space` (play/pause), `Alt+Left/Right` (seek -5/+5s).
  - "✨ Rapikan Catatan" button with loading spinner, error toast, and undo banner.
  - Export to `.md` download and copy to clipboard.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/NotesEditor.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add utils/editor.ts components/MarkdownPreview.vue components/NotesEditor.vue tests/components/NotesEditor.spec.ts
git commit -m "feat: implement interactive notes editor with keyboard shortcuts and markdown preview"
```

---

### Task 7: History Drawer & Header Bar

**Files:**
- Create: `components/HistoryDrawer.vue`
- Create: `components/AppHeader.vue`
- Test: `tests/components/AppHeader.spec.ts`

**Interfaces:**
- Consumes: `useSessions`, `utils/youtube`
- Produces: `<AppHeader />` with URL input, load action, and history toggle; `<HistoryDrawer />` with saved video sessions list.

- [ ] **Step 1: Write failing test for header URL submission and validation**

```typescript
// tests/components/AppHeader.spec.ts
import { describe, it, expect } from 'vitest'
import { isValidYouTubeInput } from '~/utils/youtube'

describe('AppHeader URL validation', () => {
  it('validates correct youtube links', () => {
    expect(isValidYouTubeInput('https://youtube.com/watch?v=test1234567')).toBe(true)
    expect(isValidYouTubeInput('https://invalid.com/test')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/AppHeader.spec.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `components/AppHeader.vue` and `components/HistoryDrawer.vue`**

Implement:
- `AppHeader.vue`: Top bar with clean branding, YouTube URL input field, quick paste/load button, auto-save status badge, and history drawer trigger button.
- `HistoryDrawer.vue`: Collapsible slide-out drawer on the left with dark neutral styling, displaying past sessions with YouTube thumbnail, title, last edited date, and delete action.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/AppHeader.spec.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/AppHeader.vue components/HistoryDrawer.vue tests/components/AppHeader.spec.ts
git commit -m "feat: add app header with youtube loader and session history drawer"
```

---

### Task 8: Layout Integration, Design-Taste Polish & Final Verification

**Files:**
- Create/Modify: `app.vue`
- Modify: `assets/css/main.css`
- Create: `.env.example`
- Test: Full Vitest test suite (`npm run test`) and Nuxt build (`npm run build`)

**Interfaces:**
- Consumes: All components from Tasks 1-7
- Produces: Complete, responsive, dark-mode minimalist split-screen web application.

- [ ] **Step 1: Integrate components into `app.vue`**

Wire up `AppHeader`, `HistoryDrawer`, `YouTubePlayer`, and `NotesEditor` in a split-screen container (`grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(100vh-64px)]`).

- [ ] **Step 2: Apply `design-taste-frontend` minimalist aesthetic**

Verify styling:
- Palette: `#0a0a0c` base background, `#121216` cards, `#1e1e26` borders, `#ededed` typography, `#9494a0` muted labels.
- Micro-interactions: subtle button hover lifts (`translate-y-[-1px]`), smooth focus rings without layout jumps, clean font rendering (`antialiased`).
- Responsive: stacks gracefully on mobile/tablet viewports.

- [ ] **Step 3: Run full test suite and verify all pass**

Run: `npx vitest run`  
Expected: All tests PASS.

- [ ] **Step 4: Run build check to verify zero compilation errors**

Run: `npx nuxi typecheck && npx nuxi build`  
Expected: Build succeeds with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app.vue assets/css/main.css .env.example
git commit -m "feat: complete app integration with dark minimalist layout and full verification"
```
