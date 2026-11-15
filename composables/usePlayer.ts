import { ref } from 'vue'

const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const playbackRate = ref(1.0)
const targetSeekTime = ref<number | null>(null)
const playToggleTrigger = ref(0)

export function usePlayer() {
  function seekTo(seconds: number) {
    const safeSeconds = Math.max(0, seconds)
    currentTime.value = safeSeconds
    targetSeekTime.value = safeSeconds
  }

  function skipSeconds(delta: number) {
    const base = targetSeekTime.value !== null ? targetSeekTime.value : currentTime.value
    seekTo(base + delta)
  }

  function togglePlay() {
    playToggleTrigger.value++
  }

  function setPlaybackRate(rate: number) {
    playbackRate.value = rate
  }

  function setPlayingState(playing: boolean) {
    isPlaying.value = playing
  }

  function setCurrentTime(time: number) {
    currentTime.value = time
  }

  function setDuration(dur: number) {
    duration.value = dur
  }

  return {
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    targetSeekTime,
    playToggleTrigger,
    seekTo,
    skipSeconds,
    togglePlay,
    setPlaybackRate,
    setPlayingState,
    setCurrentTime,
    setDuration
  }
}
