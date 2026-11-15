<template>
  <div class="flex flex-col h-full bg-monomax-900 border border-monomax-800 rounded-none overflow-hidden font-mono">
    <!-- Action Toolbar (Monochrome Brutalist) -->
    <div class="flex flex-wrap items-center justify-between p-2.5 bg-monomax-950 border-b border-monomax-800 gap-2 text-xs">
      <!-- Left Actions: Timestamp & AI -->
      <div class="flex items-center space-x-2">
        <button
          type="button"
          @click="insertCurrentTimestamp"
          class="px-2.5 py-1.5 bg-white text-black border border-white font-bold hover:bg-monomax-200 transition-colors flex items-center space-x-1.5 text-[11px] uppercase tracking-wider"
          title="Sisipkan penanda waktu video saat ini (Ctrl + T)"
        >
          <span class="inline-block w-1.5 h-1.5 bg-black rounded-full"></span>
          <span>+ TIMESTAMP [Ctrl+T]</span>
        </button>

        <button
          type="button"
          @click="refineWithAI"
          :disabled="isRefining || !notesContent.trim()"
          class="px-2.5 py-1.5 bg-monomax-900 text-white border border-monomax-700 hover:border-white transition-colors flex items-center space-x-1.5 text-[11px] uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none"
        >
          <span v-if="isRefining" class="animate-spin inline-block">/</span>
          <span v-else>✨</span>
          <span>{{ isRefining ? 'MEMPROSES...' : 'RAPIKAN DENGAN AI' }}</span>
        </button>

        <button
          v-if="canUndo"
          type="button"
          @click="undoLastRefinement"
          class="px-2 py-1.5 border border-monomax-700 text-monomax-300 hover:text-white hover:border-white transition-colors text-[10px] uppercase"
          title="Kembalikan ke catatan sebelum AI"
        >
          ↺ UNDO AI
        </button>
      </div>

      <!-- Right Actions: View Mode, Export, Copy -->
      <div class="flex items-center space-x-2">
        <!-- View Mode Toggle -->
        <div class="flex border border-monomax-800 p-0.5 bg-black text-[10px]">
          <button
            type="button"
            @click="viewMode = 'edit'"
            :class="[
              'px-2 py-1 transition-colors uppercase',
              viewMode === 'edit' ? 'bg-monomax-800 text-white font-bold' : 'text-monomax-400 hover:text-monomax-200'
            ]"
          >
            EDIT
          </button>
          <button
            type="button"
            @click="viewMode = 'preview'"
            :class="[
              'px-2 py-1 transition-colors uppercase',
              viewMode === 'preview' ? 'bg-monomax-800 text-white font-bold' : 'text-monomax-400 hover:text-monomax-200'
            ]"
          >
            PREVIEW
          </button>
          <button
            type="button"
            @click="viewMode = 'split'"
            :class="[
              'px-2 py-1 transition-colors uppercase hidden md:inline-block',
              viewMode === 'split' ? 'bg-monomax-800 text-white font-bold' : 'text-monomax-400 hover:text-monomax-200'
            ]"
          >
            SPLIT
          </button>
        </div>

        <button
          type="button"
          @click="copyNotes"
          class="px-2 py-1.5 border border-monomax-800 text-monomax-300 hover:text-white hover:border-white transition-colors text-[11px] uppercase tracking-wider"
          title="Salin semua catatan ke clipboard"
        >
          {{ copyStatus ? 'COPIED!' : 'COPY' }}
        </button>

        <button
          type="button"
          @click="exportMarkdown"
          class="px-2 py-1.5 border border-monomax-800 text-monomax-300 hover:text-white hover:border-white transition-colors text-[11px] uppercase tracking-wider"
          title="Unduh catatan sebagai file .md"
        >
          EXPORT .MD
        </button>
      </div>
    </div>

    <!-- Error / Success Notification Alert -->
    <div v-if="alertMessage" class="px-3 py-1.5 bg-monomax-850 border-b border-monomax-700 text-monomax-200 text-xs flex items-center justify-between">
      <span>{{ alertMessage }}</span>
      <button @click="alertMessage = ''" class="text-monomax-500 hover:text-white">&times;</button>
    </div>

    <!-- Main Workspace Area -->
    <div class="flex-1 relative flex overflow-hidden">
      <!-- Edit Mode Textarea -->
      <div 
        v-show="viewMode === 'edit' || viewMode === 'split'" 
        :class="['h-full flex flex-col', viewMode === 'split' ? 'w-1/2 border-r border-monomax-800' : 'w-full']"
      >
        <textarea
          ref="textareaRef"
          v-model="notesContent"
          placeholder="Mulai ketik rangkuman atau catatan dari podcast di sini...&#10;&#10;Gunakan shortcut:&#10;- Ctrl+T : Sisipkan waktu video [mm:ss]&#10;- Alt+Space : Play/Pause video&#10;- Alt+Left/Right : Mundur/Maju 5 detik"
          class="flex-1 w-full h-full p-4 bg-transparent text-monomax-100 placeholder-monomax-700 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-white selection:text-black"
          @keydown="handleKeydown"
        ></textarea>
      </div>

      <!-- Preview Mode Component -->
      <div 
        v-show="viewMode === 'preview' || viewMode === 'split'" 
        :class="['h-full overflow-y-auto bg-black', viewMode === 'split' ? 'w-1/2' : 'w-full']"
      >
        <MarkdownPreview :markdown="notesContent" />
      </div>
    </div>

    <!-- Bottom Status Info Bar -->
    <div class="px-3 py-1.5 bg-monomax-950 border-t border-monomax-800 flex items-center justify-between text-[10px] text-monomax-500">
      <div class="flex items-center space-x-3">
        <span>WORDS: {{ wordCount }}</span>
        <span>TIMESTAMPS: {{ timestampCount }}</span>
      </div>
      <div>
        <span>AUTO-SAVED IN LOCAL STORAGE</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSessions } from '~/composables/useSessions'
import { usePlayer } from '~/composables/usePlayer'
import { formatSecondsToTimestamp, extractTimestamps } from '~/utils/timestamp'
import { insertTimestampAtCursor } from '~/utils/editor'
import MarkdownPreview from './MarkdownPreview.vue'

const { currentSession, updateNotesWithSnapshot, undoLastRefinement, canUndo, saveCurrentSession } = useSessions()
const player = usePlayer()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const viewMode = ref<'edit' | 'preview' | 'split'>('edit')
const isRefining = ref(false)
const copyStatus = ref(false)
const alertMessage = ref('')

const notesContent = computed({
  get: () => currentSession.value.notes || '',
  set: (val: string) => {
    currentSession.value.notes = val
    saveCurrentSession()
  }
})

const wordCount = computed(() => {
  const text = notesContent.value.trim()
  return text ? text.split(/\s+/).length : 0
})

const timestampCount = computed(() => {
  return extractTimestamps(notesContent.value).length
})

function insertCurrentTimestamp() {
  const formatted = formatSecondsToTimestamp(player.currentTime.value)
  const el = textareaRef.value

  const currentText = notesContent.value
  const cursorPos = el ? el.selectionStart : currentText.length

  const { newText, newCursor } = insertTimestampAtCursor(currentText, cursorPos, formatted)
  notesContent.value = newText

  if (el) {
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
    }, 0)
  }
}

async function refineWithAI() {
  if (!notesContent.value.trim() || isRefining.value) return

  isRefining.value = true
  alertMessage.value = ''

  try {
    const res = await $fetch<{ refinedNotes: string }>('/api/refine', {
      method: 'POST',
      body: {
        notes: notesContent.value,
        videoTitle: currentSession.value.title
      }
    })

    if (res && res.refinedNotes) {
      updateNotesWithSnapshot(res.refinedNotes)
      alertMessage.value = 'Catatan berhasil dirapikan dengan AI. Kamu bisa klik "UNDO AI" jika ingin membatalkan.'
    }
  } catch (err: any) {
    alertMessage.value = 'Gagal merapikan catatan: ' + (err.data?.statusMessage || err.message || 'Terjadi kesalahan')
  } finally {
    isRefining.value = false
  }
}

async function copyNotes() {
  if (!notesContent.value) return
  try {
    await navigator.clipboard.writeText(notesContent.value)
    copyStatus.value = true
    setTimeout(() => {
      copyStatus.value = false
    }, 2000)
  } catch (e) {
    alertMessage.value = 'Gagal menyalin teks ke clipboard.'
  }
}

function exportMarkdown() {
  if (!notesContent.value) return
  const blob = new Blob([notesContent.value], { type: 'text/markdown;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const cleanTitle = (currentSession.value.title || 'podcast-notes')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
  link.href = url
  link.download = `${cleanTitle}.md`
  link.click()
  URL.revokeObjectURL(url)
}

function handleKeydown(event: KeyboardEvent) {
  // Ctrl+T to insert timestamp
  if (event.ctrlKey && event.key.toLowerCase() === 't') {
    event.preventDefault()
    insertCurrentTimestamp()
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  // Alt+Space for toggle play/pause
  if (event.altKey && event.code === 'Space') {
    event.preventDefault()
    player.togglePlay()
  }
  // Alt+Left for -5s
  if (event.altKey && event.key === 'ArrowLeft') {
    event.preventDefault()
    player.skipSeconds(-5)
  }
  // Alt+Right for +5s
  if (event.altKey && event.key === 'ArrowRight') {
    event.preventDefault()
    player.skipSeconds(5)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
