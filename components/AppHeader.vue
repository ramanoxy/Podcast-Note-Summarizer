<template>
  <header class="border-b border-monomax-800 bg-black text-monomax-100 font-mono text-xs select-none sticky top-0 z-40">
    <div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      <!-- Left: Brand / Title & History Trigger -->
      <div class="flex items-center space-x-3">
        <button
          type="button"
          @click="$emit('toggle-history')"
          class="px-2.5 py-1.5 border border-monomax-700 bg-monomax-900 text-white hover:bg-white hover:text-black transition-colors flex items-center space-x-2 text-[11px] font-bold"
          title="Buka daftar riwayat sesi catatan"
        >
          <span class="inline-block w-3 h-0.5 bg-current"></span>
          <span>HISTORY [{{ pastSessions.length }}]</span>
        </button>

        <div class="flex items-center space-x-2">
          <span class="font-bold text-white tracking-widest text-sm">SYNTH</span>
          <span class="text-monomax-600">//</span>
          <span class="text-[10px] text-monomax-400 tracking-wider hidden sm:inline-block">PODCAST ACTIVE NOTE</span>
        </div>
      </div>

      <!-- Center: YouTube Link Input Bar -->
      <form @submit.prevent="handleLoadUrl" class="flex-1 max-w-xl flex items-center min-w-[280px]">
        <div class="relative flex-1 flex items-center">
          <span class="absolute left-2.5 text-monomax-600 text-[10px]">URL:</span>
          <input
            v-model="inputUrl"
            type="text"
            placeholder="Tempel link video YouTube (cth: https://youtu.be/...)"
            class="w-full pl-12 pr-3 py-1.5 bg-monomax-950 border border-monomax-800 text-white placeholder-monomax-600 text-xs font-mono outline-none focus:border-white transition-colors"
          />
        </div>
        <button
          type="submit"
          class="px-3 py-1.5 bg-white text-black font-bold border border-white hover:bg-monomax-200 transition-colors text-[11px] uppercase tracking-wider shrink-0"
        >
          LOAD VIDEO
        </button>
      </form>

      <!-- Right: New Session & Status -->
      <div class="flex items-center space-x-2">
        <button
          type="button"
          @click="handleNewSession"
          class="px-2.5 py-1.5 border border-monomax-800 text-monomax-300 hover:border-white hover:text-white transition-colors text-[11px] uppercase"
          title="Buat sesi catatan baru"
        >
          + NEW NOTE
        </button>

        <div class="hidden lg:flex items-center space-x-1.5 text-[10px] text-monomax-500 border border-monomax-900 px-2 py-1">
          <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span>AUTOSAVE ON</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSessions } from '~/composables/useSessions'
import { extractYouTubeId } from '~/utils/youtube'

const emit = defineEmits<{
  (e: 'toggle-history'): void
}>()

const { currentSession, pastSessions, saveCurrentSession, createNewSession } = useSessions()

const inputUrl = ref(currentSession.value.videoUrl || '')

watch(() => currentSession.value.videoUrl, (newUrl) => {
  inputUrl.value = newUrl || ''
})

async function handleLoadUrl() {
  const url = inputUrl.value.trim()
  if (!url) return

  const videoId = extractYouTubeId(url)
  if (!videoId) {
    alert('URL YouTube tidak valid. Harap masukkan format yang sesuai.')
    return
  }

  currentSession.value.videoUrl = url
  currentSession.value.videoId = videoId

  // Attempt to fetch title via free YouTube oEmbed API
  try {
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`
    const data: any = await $fetch(oembedUrl)
    if (data && data.title) {
      currentSession.value.title = data.title
    }
  } catch (e) {
    if (!currentSession.value.title || currentSession.value.title === 'Catatan Baru Tanpa Judul') {
      currentSession.value.title = `Video ${videoId}`
    }
  }

  saveCurrentSession()
}

function handleNewSession() {
  if (currentSession.value.notes && currentSession.value.notes.trim()) {
    saveCurrentSession()
  }
  createNewSession()
  inputUrl.value = ''
}
</script>
