export interface RefinePayload {
  notes: string
  videoTitle?: string
}

export function validateRefineRequest(body: any): RefinePayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Notes cannot be empty')
  }
  const notes = body.notes
  if (!notes || typeof notes !== 'string' || !notes.trim()) {
    throw new Error('Notes cannot be empty')
  }
  return {
    notes: notes.trim(),
    videoTitle: typeof body.videoTitle === 'string' ? body.videoTitle.trim() : undefined
  }
}

export function buildRefinementPrompt(notes: string, videoTitle?: string): string {
  const titleContext = videoTitle ? `Judul Video/Podcast: "${videoTitle}"` : 'Podcast / Video Note'

  return `
Anda adalah seorang asisten editor dan perangkum profesional. Tugas Anda adalah merapikan catatan kasar yang ditulis oleh pengguna saat sedang menyimak podcast/video.

${titleContext}

ATURAN UTAMA (SANGAT KETAT):
1. PERTAHANKAN SEMUA TAG TIMESTAMP: Format timestamp [mm:ss] atau [hh:mm:ss] yang ada pada catatan pengguna WAJIB dipertahankan tepat di depan atau di dalam poin yang bersangkutan. JANGAN mengubah angka menit/detiknya, JANGAN menghapus tanda kurung siku, dan JANGAN membuat timestamp palsu baru jika tidak ada di catatan asli.
2. PERBAIKI STRUKTUR & TATA BAHASA: Ubah coretan kasar, singkatan, dan kalimat tidak lengkap menjadi kalimat bahasa Indonesia yang rapi, ringkas, jelas, dan profesional.
3. KELOMPOKKAN DENGAN MARKDOWN ELEGAN:
   - Berikan subjudul tematik yang relevan (## Topik...)
   - Gunakan bullet points (-) untuk poin-poin penting
   - Bila relevan, sertakan bagian singkat "## Ringkasan Eksekutif" di awal dan "## Takeaways / Poin Aksi" di akhir.
4. JANGAN MENGARANG FAKTA: Tetap setia pada inti pesan dan informasi yang ditulis dalam catatan kasar pengguna.

CATATAN KASAR PENGGUNA:
---
${notes}
---

Berikan hasil Markdown yang bersih, rapi, dan langsung siap dibaca:
`.trim()
}
