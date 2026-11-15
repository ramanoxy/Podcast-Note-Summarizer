<template>
  <div class="min-h-screen bg-black text-monomax-100 flex flex-col font-sans selection:bg-white selection:text-black grid-bg">
    <!-- Top Navigation Header -->
    <AppHeader @toggle-history="isHistoryOpen = !isHistoryOpen" />

    <!-- Session History Drawer -->
    <HistoryDrawer :is-open="isHistoryOpen" @close="isHistoryOpen = false" />

    <!-- Main Active Workspace (Split Screen) -->
    <main class="flex-1 p-3 sm:p-4 lg:p-6 flex flex-col">
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full min-h-[calc(100vh-120px)]">
        <!-- Left Column: Video Player -->
        <section class="h-[360px] lg:h-full flex flex-col">
          <YouTubePlayer :video-id="currentSession.videoId" />
        </section>

        <!-- Right Column: Interactive Notes Editor & AI -->
        <section class="h-[520px] lg:h-full flex flex-col">
          <NotesEditor />
        </section>
      </div>
    </main>

    <!-- Bottom Experimental Minimalist Status Bar -->
    <footer class="border-t border-monomax-800 bg-monomax-950 px-4 py-2 font-mono text-[10px] text-monomax-500 flex flex-wrap items-center justify-between gap-2 select-none">
      <div class="flex items-center space-x-4">
        <span class="text-white font-bold tracking-widest">SYNTH v1.0</span>
        <span class="text-monomax-600">//</span>
        <span>ACTIVE NOTE-TAKING & AI COMPANION</span>
      </div>
      <div class="flex items-center space-x-3 text-monomax-400">
        <span>[Ctrl+T]: Timestamp</span>
        <span>&bull;</span>
        <span>[Alt+Space]: Play/Pause</span>
        <span>&bull;</span>
        <span>[Alt+&larr;/&rarr;]: &plusmn;5s</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSessions } from '~/composables/useSessions'
import AppHeader from '~/components/AppHeader.vue'
import HistoryDrawer from '~/components/HistoryDrawer.vue'
import YouTubePlayer from '~/components/YouTubePlayer.vue'
import NotesEditor from '~/components/NotesEditor.vue'

const isHistoryOpen = ref(false)
const { currentSession } = useSessions()
</script>
