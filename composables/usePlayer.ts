import { ref } from 'vue'

export interface SeekEvent {
  seconds: number
  id: number
}

const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const playbackRate = ref(1.0)
const seekTarget = ref<SeekEvent | null>(null)
let seekEventCounter = 0

const playToggleTrigger = ref(0)

export function usePlayer() {
  function seekTo(seconds: number) {
    const safeSeconds = Math.max(0, seconds)
    currentTime.value = safeSeconds
    seekEventCounter++
    seekTarget.value = {
      seconds: safeSeconds,
      id: seekEventCounter
    }
  }

  function skipSeconds(delta: number) {
    // Always skip relative to current active playback time
    const newTime = Math.max(0, currentTime.value + delta)
    seekTo(newTime)
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
    seekTarget,
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
