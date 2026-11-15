import { describe, it, expect } from 'vitest'
import { usePlayer } from '~/composables/usePlayer'

describe('usePlayer Composable', () => {
  it('manages playback state and seek commands accurately', () => {
    const player = usePlayer()
    expect(player.currentTime.value).toBe(0)
    expect(player.playbackRate.value).toBe(1.0)
    
    player.seekTo(120)
    expect(player.targetSeekTime.value).toBe(120)

    player.skipSeconds(5)
    expect(player.targetSeekTime.value).toBe(125)

    player.skipSeconds(-10)
    expect(player.targetSeekTime.value).toBe(115)

    // Cannot seek negative
    player.seekTo(-5)
    expect(player.targetSeekTime.value).toBe(0)

    player.setPlaybackRate(1.5)
    expect(player.playbackRate.value).toBe(1.5)
  })
})
