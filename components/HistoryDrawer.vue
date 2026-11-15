<template>
  <div>
    <!-- Backdrop overlay -->
    <div 
      v-if="isOpen" 
      class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
      @click="$emit('close')"
    ></div>

    <!-- Drawer Panel (Monochrome Brutalist) -->
    <div 
      :class="[
        'fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-monomax-950 border-r border-monomax-800 z-50 flex flex-col font-mono text-xs transition-transform duration-200 ease-out shadow-2xl',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Drawer Header -->
      <div class="p-4 border-b border-monomax-800 flex items-center justify-between bg-black">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-white tracking-wider uppercase text-sm">RIWAYAT CATATAN</span>
          <span class="text-monomax-500 text-[10px]">({{ pastSessions.length }})</span>
        </div>
        <button 
          type="button" 
          @click="$emit('close')"
          class="p-1 border border-monomax-800 text-monomax-400 hover:text-white hover:border-white transition-colors"
        >
          [ESC / X]
        </button>
      </div>

      <!-- Drawer Body / Session List -->
      <div class="flex-1 overflow-y-auto divide-y divide-monomax-850 p-2 space-y-2">
        <div v-if="pastSessions.length === 0" class="p-8 text-center text-monomax-600 font-sans text-xs">
          Belum ada riwayat sesi yang tersimpan. Catatanmu akan otomatis disimpan saat kamu mengetik.
        </div>

        <div
          v-for="session in pastSessions"
          :key="session.id"
          :class="[
            'p-3 border transition-colors cursor-pointer flex flex-col space-y-2 group',
            currentSession.id === session.id 
              ? 'border-white bg-monomax-900' 
              : 'border-monomax-850 bg-black hover:border-monomax-700'
          ]"
          @click="selectSession(session.id)"
        >
          <div class="flex items-start space-x-3">
            <!-- Thumbnail if YouTube -->
            <div class="w-16 h-10 bg-monomax-900 border border-monomax-800 overflow-hidden shrink-0 relative">
              <img 
                v-if="session.videoId" 
                :src="`https://img.youtube.com/vi/${session.videoId}/mqdefault.jpg`" 
                alt="Thumbnail"
                class="w-full h-full object-cover filter grayscale contrast-125"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-[9px] text-monomax-600">
                NO IMG
              </div>
            </div>

            <!-- Title & Metadata -->
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-white text-[11px] truncate leading-tight group-hover:underline">
                {{ session.title || 'Catatan Tanpa Judul' }}
              </h4>
              <p class="text-[10px] text-monomax-500 mt-1">
                {{ formatDate(session.updatedAt) }}
              </p>
            </div>
          </div>

          <!-- Notes Snippet Preview -->
          <p class="text-[10px] text-monomax-400 font-sans line-clamp-2 bg-monomax-950 p-1.5 border border-monomax-900">
            {{ session.notes ? session.notes.substring(0, 120) : '(Belum ada teks catatan)' }}
          </p>

          <!-- Session Actions -->
          <div class="flex items-center justify-between pt-1 text-[10px]">
            <span v-if="currentSession.id === session.id" class="text-white font-bold flex items-center space-x-1">
              <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
              <span>SEDANG AKTIF</span>
            </span>
            <span v-else class="text-monomax-600">KLIK UNTUK BUKA</span>

            <button
              type="button"
              @click.stop="confirmDelete(session.id)"
              class="text-monomax-600 hover:text-white transition-colors"
              title="Hapus sesi ini"
            >
              [HAPUS]
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useSessions } from '~/composables/useSessions'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { pastSessions, currentSession, loadSession, deleteSession } = useSessions()

function selectSession(id: string) {
  loadSession(id)
  emit('close')
}

function confirmDelete(id: string) {
  if (confirm('Yakin ingin menghapus catatan sesi ini?')) {
    deleteSession(id)
  }
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '-'
  const d = new Date(timestamp)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
