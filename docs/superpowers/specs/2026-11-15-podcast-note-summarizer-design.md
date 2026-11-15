# Podcast & Video Active Note-Taking & AI Summarizer (Design Document)

**Date:** 2026-11-15  
**Topic:** Podcast & Video Note Summarizer  
**Status:** Approved  
**Framework:** Fullstack Nuxt.js (Nuxt 3, Vue 3, Nitro, Tailwind CSS, TypeScript)  
**Theme:** Dark Mode Minimalist (Anti-slop, clean typography, quiet micro-interactions)

---

## 1. Intent and The Why

Kebanyakan AI video summarizer di internet bekerja secara pasif: pengguna menempelkan link video, menunggu beberapa detik, lalu mendapatkan rangkuman teks. Pendekatan ini memiliki tingkat retensi memori dan pemahaman yang sangat rendah bagi pengguna karena tidak ada proses menyimak aktif (*active listening*).

Aplikasi ini dirancang sebagai **personal productivity workspace** untuk menyimak podcast/video secara aktif. Pengguna mendengarkan video podcast YouTube secara langsung dan mencatat pemahaman atau poin penting mereka sendiri ke dalam editor. AI bertindak sebagai asisten yang tugasnya adalah merapikan, menstrukturkan, dan menyempurnakan catatan kasar tersebut langsung ke dalam editor (*in-place overwrite*) dengan tetap mempertahankan timestamp asli.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Split-Screen Workspace:** Tampilan kerja optimal dengan YouTube player di sisi kiri dan editor catatan interaktif di sisi kanan.
2. **Online YouTube Media Player:** Integrasi YouTube IFrame Player API dengan kontrol sinkronisasi waktu dan status pemutaran yang mulus.
3. **Interactive Timestamping:** Tombol dan shortcut keyboard (`Ctrl+T`) untuk menyisipkan penanda waktu `[mm:ss]` langsung ke posisi kursor saat mengetik. Mengklik badge timestamp akan melompatkan pemutar YouTube ke detik tersebut.
4. **Seamless Playback Shortcuts:** Pintasan keyboard untuk mengontrol media (Play/Pause dengan `Alt+Space`, Mundur 5s `Alt+Left`, Maju 5s `Alt+Right`, Kecepatan putar) tanpa harus memindahkan kursor mouse keluar dari editor catatan.
5. **AI Refinement (Merapikan Catatan Kasar):** Integrasi Google Gemini API di server endpoint Nuxt (`/api/refine`) untuk merapikan coretan kasar pengguna menjadi dokumen terstruktur (Ringkasan Eksekutif, Poin Kunci per Topik dengan referensi timestamp, dan Action Items/Takeaways) langsung memperbarui (*overwrite*) isi editor.
6. **Dark Mode Minimalist UI:** Tampilan bergaya anti-slop modern, palet warna gelap elegan (monochrome dark neutrals, no tacky gradients/violet, crisp contrast, typography terstruktur rapi, equal edges, micro-interactions halus).
7. **Persistence & Export:** Autosave lokal (LocalStorage) per video URL sehingga catatan tidak hilang saat browser dimuat ulang, serta fitur ekspor instan ke file Markdown (`.md`) dan salin ke clipboard.
8. **Session History Drawer:** Drawer samping yang menampilkan daftar riwayat sesi video sebelumnya (judul otomatis via YouTube oEmbed API, tanggal, dan cuplikan catatan).

### Non-Goals
1. **100% Automated Speech-to-Text Transcriber:** Tidak menggantikan peran pengguna dalam menyimak. Pengguna adalah pencatat utama.
2. **Offline File Uploads / Spotify / Apple Podcasts:** Fokus eksklusif pada sumber media online YouTube.
3. **Multi-User SaaS Auth & Billing:** Penggunaan pribadi (*personal tool*), tidak membutuhkan login/database akun berbayar.
4. **Dual Tab Storing:** Tidak memisahkan tab draft vs AI; catatan kasar langsung dirapikan di tempat (*overwrite/refine in-place*), dengan undo history sederhana jika ingin membatalkan.

### Anti-Goals
1. **Cluttered & Slop UI:** Menghindari template generik, warna norak, atau animasi berlebih yang mendistraksi kegiatan mendengarkan dan mencatat.
2. **AI Hallucination & Timestamp Corruption:** AI tidak boleh mengarang fakta baru yang bertolak belakang dengan catatan pengguna, dan tidak boleh menghapus atau merusak format timestamp `[mm:ss]` yang sudah dibuat pengguna.

---

## 3. Architecture & Tech Stack

- **Framework:** Nuxt 3 (Fullstack Vue 3 + Nitro Engine)
- **Language:** TypeScript
- **Styling & Icons:** Tailwind CSS, `@tailwindcss/typography`, Lucide Vue Next
- **Media Player:** YouTube IFrame Player API (client component `YouTubePlayer.vue`)
- **Editor:** Custom Markdown Textarea + Interactive Preview Renderer (mengubah token `[mm:ss]` menjadi clickable timestamp badges)
- **AI Backend:** Nitro Server Route (`/api/refine.post.ts`) memanggil Google Gemini API via `@google/genai` SDK atau direct REST dengan `GEMINI_API_KEY` dari runtime config / `.env`.
- **State & Storage:** Vue Composables (`useSessions.ts`, `usePlayer.ts`) tersinkronisasi dengan browser `localStorage`.

---

## 4. User Workflow & UI Layout (Dark Mode Minimalist)

```text
+---------------------------------------------------------------------------------+
| [= History]  [Input Link YouTube ...] [Load]        [Status: Saved] [Export .md]|
+----------------------------------------+----------------------------------------+
| KIRI: YouTube Player (16:9)            | KANAN: Smart Notes Workspace           |
|                                        |                                        |
| +------------------------------------+ | Toolbar:                               |
| |                                    | | [+ Timestamp (Ctrl+T)] [✨ Rapikan AI] |
| |        [ YouTube IFrame ]          | | [Preview Toggle] [Undo] [Copy]       |
| |                                    | | -----------------------------------  |
| +------------------------------------+ | Textarea / Markdown View:              |
| Playback Status: Playing (05:24)       | - [01:15] Pembicara bahas arsitektur   |
| Shortcuts:                             | - [04:30] Masalah utama: bottleneck... |
| - Alt+Space: Play/Pause                | - [08:12] Solusinya pakai strategi X   |
| - Alt+Left/Right: Seek -/+ 5s          |                                        |
| (Klik timestamp di notes -> lompat)    | (Tombol "Rapikan AI" langsung update)  |
+----------------------------------------+----------------------------------------+
```

---

## 5. Implementation Decisions
- **Nuxt 3 Project Scaffolding:** Dibuat langsung di direktori root dengan struktur bersih: `app.vue`, `components/`, `server/api/`, `composables/`, `assets/css/main.css`.
- **Dark Theme Palette:** Neutral deep slate/zinc background (`#0a0a0c`, `#121216`, `#1a1a22`), soft white text (`#ededed`), muted secondary text (`#9494a0`), subtle border accents (`#262630`), crisp emerald/teal or clean monochrome action badges.
- **Timestamp Parsing:** Regex `\[(\d{1,2}:\d{2}(?::\d{2})?)\]` menangkap format menit:detik dan jam:menit:detik, dirender sebagai badge interaktif dengan hover effect.
