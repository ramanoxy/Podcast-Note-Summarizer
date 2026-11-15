<template>
  <div 
    class="prose prose-invert prose-zinc max-w-none font-sans text-xs leading-relaxed overflow-y-auto p-4 select-text"
    @click="handleContainerClick"
    v-html="renderedHtml"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { replaceTimestampsWithBadges } from '~/utils/timestamp'
import { usePlayer } from '~/composables/usePlayer'

const props = defineProps<{
  markdown: string
}>()

const player = usePlayer()

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const renderedHtml = computed(() => {
  if (!props.markdown) {
    return '<p class="text-monomax-600 italic">Belum ada catatan. Mulai ketik catatan atau tekan shortcut Ctrl+T untuk menyisipkan waktu video.</p>'
  }

  // Simple Markdown parser for headings, lists, quotes, and bold text
  const lines = props.markdown.split('\n')
  const htmlLines: string[] = []

  let inList = false

  for (const rawLine of lines) {
    let line = escapeHtml(rawLine)

    // Heading 3
    if (line.startsWith('### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false }
      htmlLines.push(`<h4 class="text-xs uppercase tracking-wider font-bold text-monomax-200 mt-4 mb-2 font-mono">${line.substring(4)}</h4>`)
      continue
    }
    // Heading 2
    if (line.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false }
      htmlLines.push(`<h3 class="text-sm font-bold text-white mt-6 mb-3 font-mono border-b border-monomax-800 pb-1">${line.substring(3)}</h3>`)
      continue
    }
    // Heading 1
    if (line.startsWith('# ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false }
      htmlLines.push(`<h2 class="text-base font-bold text-white mt-6 mb-3 font-mono">${line.substring(2)}</h2>`)
      continue
    }
    // Blockquote
    if (line.startsWith('&gt; ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false }
      htmlLines.push(`<blockquote class="border-l-2 border-white pl-3 text-monomax-300 italic my-2">${line.substring(5)}</blockquote>`)
      continue
    }
    // Unordered List item
    if (line.match(/^[-*•]\s+/)) {
      if (!inList) {
        htmlLines.push('<ul class="space-y-1.5 my-2">')
        inList = true
      }
      const itemText = line.replace(/^[-*•]\s+/, '')
      htmlLines.push(`<li class="text-monomax-200">${itemText}</li>`)
      continue
    }

    if (inList) {
      htmlLines.push('</ul>')
      inList = false
    }

    if (!line.trim()) {
      htmlLines.push('<div class="h-2"></div>')
    } else {
      htmlLines.push(`<p class="my-1 text-monomax-200">${line}</p>`)
    }
  }

  if (inList) {
    htmlLines.push('</ul>')
  }

  const rawHtml = htmlLines.join('\n')
  return replaceTimestampsWithBadges(rawHtml)
})

function handleContainerClick(event: MouseEvent) {
  const target = (event.target as HTMLElement)?.closest('.timestamp-badge') as HTMLElement
  if (target && target.dataset.timestamp) {
    const seconds = parseInt(target.dataset.timestamp, 10)
    if (!isNaN(seconds)) {
      player.seekTo(seconds)
    }
  }
}
</script>
