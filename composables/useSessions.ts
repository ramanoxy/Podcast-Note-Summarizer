import { ref, computed } from 'vue'
import type { Session } from '~/types/session'
import { extractYouTubeId } from '~/utils/youtube'

const STORAGE_KEY = 'synth_podcast_sessions_v1'
const CURRENT_SESSION_KEY = 'synth_current_session_v1'

const pastSessions = ref<Session[]>([])
const currentSession = ref<Session>({
  id: '',
  videoUrl: '',
  videoId: '',
  title: '',
  notes: '',
  updatedAt: Date.now()
})

const undoStack = ref<string[]>([])
let saveTimeout: any = null

export function useSessions() {
  function initStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return

    try {
      const storedList = localStorage.getItem(STORAGE_KEY)
      if (storedList) {
        pastSessions.value = JSON.parse(storedList)
      }
      const storedCurrent = localStorage.getItem(CURRENT_SESSION_KEY)
      if (storedCurrent) {
        currentSession.value = JSON.parse(storedCurrent)
      } else if (!currentSession.value.id) {
        createNewSession()
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e)
    }
  }

  // Auto-init on first call if in browser
  initStorage()

  function createNewSession() {
    const newId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    currentSession.value = {
      id: newId,
      videoUrl: '',
      videoId: '',
      title: 'Catatan Baru Tanpa Judul',
      notes: '',
      updatedAt: Date.now()
    }
    undoStack.value = []
    persistCurrentDirect()
  }

  function persistCurrentDirect() {
    if (typeof window === 'undefined' || !window.localStorage) return
    currentSession.value.updatedAt = Date.now()
    try {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(currentSession.value))
    } catch (e) {
      console.warn('Failed to persist current session', e)
    }
  }

  function persistListDirect() {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pastSessions.value))
    } catch (e) {
      console.warn('Failed to persist session list', e)
    }
  }

  function saveCurrentSession(immediate = false) {
    if (!currentSession.value.id) {
      currentSession.value.id = 'session_' + Date.now()
    }
    currentSession.value.updatedAt = Date.now()

    if (!currentSession.value.videoId && currentSession.value.videoUrl) {
      currentSession.value.videoId = extractYouTubeId(currentSession.value.videoUrl) || ''
    }

    const idx = pastSessions.value.findIndex(s => s.id === currentSession.value.id)
    if (idx >= 0) {
      pastSessions.value[idx] = { ...currentSession.value }
    } else {
      pastSessions.value.unshift({ ...currentSession.value })
    }

    if (immediate) {
      if (saveTimeout) clearTimeout(saveTimeout)
      persistCurrentDirect()
      persistListDirect()
    } else {
      // Debounce storage writes during typing
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        persistCurrentDirect()
        persistListDirect()
      }, 300)
    }
  }

  function loadSession(id: string) {
    const found = pastSessions.value.find(s => s.id === id)
    if (found) {
      currentSession.value = { ...found }
      undoStack.value = []
      persistCurrentDirect()
    }
  }

  function deleteSession(id: string) {
    pastSessions.value = pastSessions.value.filter(s => s.id !== id)
    persistListDirect()
    if (currentSession.value.id === id) {
      createNewSession()
    }
  }

  function updateNotesWithSnapshot(newNotes: string) {
    // Push previous version into undo stack before overwriting
    undoStack.value.push(currentSession.value.notes)
    currentSession.value.notes = newNotes
    saveCurrentSession(true)
  }

  function undoLastRefinement() {
    if (undoStack.value.length > 0) {
      const prev = undoStack.value.pop()!
      currentSession.value.notes = prev
      saveCurrentSession(true)
    }
  }

  const canUndo = computed(() => undoStack.value.length > 0)

  return {
    currentSession,
    pastSessions,
    saveCurrentSession,
    loadSession,
    deleteSession,
    createNewSession,
    updateNotesWithSnapshot,
    undoLastRefinement,
    canUndo
  }
}
