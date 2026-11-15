<template>
  <div class="flex flex-col h-full bg-monomax-900 border border-monomax-800 rounded-none overflow-hidden font-mono">
    <!-- Top Player Status Bar -->
    <div class="flex items-center justify-between px-3 py-2 bg-monomax-950 border-b border-monomax-800 text-xs">
      <div class="flex items-center space-x-2">
        <span class="inline-block w-2 h-2 rounded-full" :class="isPlaying ? 'bg-white animate-pulse' : 'bg-monomax-600'"></span>
        <span class="text-monomax-400 uppercase tracking-widest text-[10px]">VIDEO SOURCE</span>
        <span v-if="videoId" class="text-monomax-200">ID: {{ videoId }}</span>
        <span v-else class="text-monomax-600">NO MEDIA LOADED</span>
      </div>
      <div class="flex items-center space-x-3 text-xs">
        <span class="text-white font-bold">{{ formattedCurrentTime }}</span>
        <span class="text-monomax-600">/</span>
        <span class="text-monomax-400">{{ formattedDuration }}</span>
      </div>
    </div>

    <!-- Video Canvas Container -->
    <div class="relative flex-1 bg-black flex items-center justify-center min-h-[240px] md:min-h-[320px]">
      <div v-show="videoId" class="w-full h-full">
        <div id="youtube-iframe-container" class="w-full h-full"></div>
      </div>

      <!-- Empty State Placeholder (Monochrome Experimental) -->
      <div v-if="!videoId" class="flex flex-col items-center justify-center text-center p-8 max-w-sm">
        <div class="w-12 h-12 border border-monomax-700 flex items-center justify-center mb-4 text-monomax-400">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-xs uppercase tracking-wider text-monomax-300 mb-2 font-bold">READY TO LISTEN</p>
        <p class="text-[11px] text-monomax-600 leading-relaxed font-sans">
          Tempelkan link video YouTube podcast di header atas untuk memulai sesi menyimak dan mencatat.
        </p>
      </div>
    </div>

    <!-- Bottom Playback Controls Bar -->
    <div class="p-3 bg-monomax-950 border-t border-monomax-800 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center space-x-2">
        <button
          type="button"
          @click="togglePlay"
          :disabled="!videoId"
          class="px-3 py-1.5 border border-monomax-700 bg-monomax-900 text-white hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase text-[11px] font-bold tracking-wider"
        >
          {{ isPlaying ? 'PAUSE [ALT+SPACE]' : 'PLAY [ALT+SPACE]' }}
        </button>

        <button
          type="button"
          @click="skipSeconds(-5)"
          :disabled="!videoId"
          class="px-2.5 py-1.5 border border-monomax-800 text-monomax-300 hover:border-white hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none text-[11px]"
          title="Mundur 5 detik (Alt + ArrowLeft)"
        >
          -5s
        </button>

        <button
          type="button"
          @click="skipSeconds(5)"
          :disabled="!videoId"
          class="px-2.5 py-1.5 border border-monomax-800 text-monomax-300 hover:border-white hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none text-[11px]"
          title="Maju 5 detik (Alt + ArrowRight)"
        >
          +5s
        </button>
      </div>

      <!-- Playback Speed Controls -->
      <div class="flex items-center space-x-1">
        <span class="text-[10px] text-monomax-500 uppercase mr-1">SPEED</span>
        <button
          v-for="rate in [0.75, 1.0, 1.25, 1.5, 2.0]"
          :key="rate"
          type="button"
          @click="changePlaybackRate(rate)"
          :disabled="!videoId"
          :class="[
            'px-1.5 py-0.5 border text-[10px] transition-colors',
            playbackRate === rate 
              ? 'border-white bg-white text-black font-bold' 
              : 'border-monomax-800 text-monomax-400 hover:border-monomax-600'
          ]"
        >
          {{ rate }}x
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePlayer } from '~/composables/usePlayer'
import { formatSecondsToTimestamp } from '~/utils/timestamp'

const props = defineProps<{
  videoId?: string
}>()

const playerStore = usePlayer()
const { currentTime, duration, isPlaying, playbackRate, seekTarget, playToggleTrigger } = playerStore

const formattedCurrentTime = computed(() => formatSecondsToTimestamp(currentTime.value))
const formattedDuration = computed(() => formatSecondsToTimestamp(duration.value))

let ytPlayer: any = null
let pollInterval: any = null
let isApiLoading = false

function initYouTubeAPI() {
  if (typeof window === 'undefined') return

  if ((window as any).YT && (window as any).YT.Player) {
    if (props.videoId) createPlayer()
    return
  }

  if (isApiLoading) return
  isApiLoading = true

  const existingTag = document.querySelector('script[src*="youtube.com/iframe_api"]')
  if (!existingTag) {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScript = document.getElementsByTagName('script')[0]
    firstScript?.parentNode?.insertBefore(tag, firstScript)
  }

  const prevReady = (window as any).onYouTubeIframeAPIReady
  ;(window as any).onYouTubeIframeAPIReady = () => {
    if (prevReady) prevReady()
    isApiLoading = false
    if (props.videoId) {
      createPlayer()
    }
  }
}

async function createPlayer() {
  if (!props.videoId || typeof window === 'undefined') return

  await nextTick()

  const YT = (window as any).YT
  if (!YT || !YT.Player) {
    initYouTubeAPI()
    return
  }

  // If player already exists, load video directly
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(props.videoId)
    return
  }

  const container = document.getElementById('youtube-iframe-container')
  if (!container) return

  ytPlayer = new YT.Player('youtube-iframe-container', {
    videoId: props.videoId,
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  })
}

function onPlayerReady(event: any) {
  if (ytPlayer && ytPlayer.getDuration) {
    playerStore.setDuration(ytPlayer.getDuration())
  }
  startPolling()
}

function onPlayerStateChange(event: any) {
  const YT = (window as any).YT
  if (!YT) return

  if (event.data === YT.PlayerState.PLAYING) {
    playerStore.setPlayingState(true)
    startPolling()
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    playerStore.setPlayingState(false)
  }
}

function startPolling() {
  stopPolling()
  pollInterval = setInterval(() => {
    if (ytPlayer && ytPlayer.getCurrentTime) {
      playerStore.setCurrentTime(ytPlayer.getCurrentTime())
      if (!duration.value && ytPlayer.getDuration) {
        playerStore.setDuration(ytPlayer.getDuration())
      }
    }
  }, 250)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

function togglePlay() {
  if (!ytPlayer) return
  if (isPlaying.value) {
    ytPlayer.pauseVideo?.()
  } else {
    ytPlayer.playVideo?.()
  }
}

function skipSeconds(delta: number) {
  playerStore.skipSeconds(delta)
}

function changePlaybackRate(rate: number) {
  playerStore.setPlaybackRate(rate)
  if (ytPlayer && ytPlayer.setPlaybackRate) {
    ytPlayer.setPlaybackRate(rate)
  }
}

// Watch seekTarget to execute player seek
watch(seekTarget, (target) => {
  if (target && ytPlayer && ytPlayer.seekTo) {
    ytPlayer.seekTo(target.seconds, true)
  }
})

// Watch play toggle trigger from global shortcut
watch(playToggleTrigger, () => {
  togglePlay()
})

// Watch videoId changes to load or create player
watch(() => props.videoId, async (newId) => {
  if (newId) {
    await nextTick()
    createPlayer()
  }
})

onMounted(() => {
  // Always initialize YouTube API regardless of whether videoId is present yet
  initYouTubeAPI()
})

onUnmounted(() => {
  stopPolling()
  if (ytPlayer && ytPlayer.destroy) {
    ytPlayer.destroy()
  }
})
</script>
