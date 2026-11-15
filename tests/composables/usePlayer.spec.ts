import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayer } from '~/composables/usePlayer'

describe('usePlayer Composable', () => {
  beforeEach(() => {
    const player = usePlayer()
    player.setCurrentTime(0)
  })

  it('manages playback state and seek commands accurately', () => {
    const player = usePlayer()
    expect(player.currentTime.value).toBe(0)
    expect(player.playbackRate.value).toBe(1.0)
    
    player.seekTo(120)
    expect(player.seekTarget.value?.seconds).toBe(120)

    player.setCurrentTime(300)
    // skipSeconds should skip from current playback time (300 + 5 = 305), not stale target (120)
    player.skipSeconds(5)
    expect(player.seekTarget.value?.seconds).toBe(305)

    player.skipSeconds(-10)
    expect(player.seekTarget.value?.seconds).toBe(295)

    // Cannot seek negative
    player.seekTo(-5)
    expect(player.seekTarget.value?.seconds).toBe(0)

    player.setPlaybackRate(1.5)
    expect(player.playbackRate.value).toBe(1.5)
  })

  it('generates a new unique seek event when seeking to the same timestamp multiple times', () => {
    const player = usePlayer()
    player.seekTo(0)
    const firstId = player.seekTarget.value?.id

    player.seekTo(0)
    const secondId = player.seekTarget.value?.id

    expect(firstId).toBeDefined()
    expect(secondId).toBeDefined()
    expect(secondId).toBeGreaterThan(firstId!)
  })
})
