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

  it('saves, loads, and deletes past sessions in localStorage', () => {
    const { currentSession, saveCurrentSession, pastSessions, loadSession, deleteSession, createNewSession } = useSessions()
    currentSession.value = {
      id: 'session-1',
      videoUrl: 'https://www.youtube.com/watch?v=abc12345678',
      videoId: 'abc12345678',
      title: 'Podcast Episode 1',
      notes: 'Notes content [01:00]',
      updatedAt: Date.now()
    }
    saveCurrentSession()
    expect(pastSessions.value.length).toBe(1)
    expect(pastSessions.value[0].title).toBe('Podcast Episode 1')

    createNewSession()
    expect(currentSession.value.videoUrl).toBe('')
    expect(currentSession.value.notes).toBe('')

    loadSession('session-1')
    expect(currentSession.value.id).toBe('session-1')
    expect(currentSession.value.title).toBe('Podcast Episode 1')

    deleteSession('session-1')
    expect(pastSessions.value.length).toBe(0)
  })
})
