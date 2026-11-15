import { c as defineEventHandler, r as readBody, u as useRuntimeConfig, e as createError } from '../../_/nitro.mjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

function validateRefineRequest(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Notes cannot be empty");
  }
  const notes = body.notes;
  if (!notes || typeof notes !== "string" || !notes.trim()) {
    throw new Error("Notes cannot be empty");
  }
  return {
    notes: notes.trim(),
    videoTitle: typeof body.videoTitle === "string" ? body.videoTitle.trim() : void 0
  };
}
function buildRefinementPrompt(notes, videoTitle) {
  const titleContext = videoTitle ? `Judul Video/Podcast: "${videoTitle}"` : "Podcast / Video Note";
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
`.trim();
}

const refine_post = defineEventHandler(async (event) => {
  try {
    const rawBody = await readBody(event);
    const { notes, videoTitle } = validateRefineRequest(rawBody);
    const config = useRuntimeConfig();
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = buildRefinementPrompt(notes, videoTitle);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const refinedText = response.text();
        if (refinedText && refinedText.trim()) {
          return { refinedNotes: refinedText.trim() };
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to local formatter:", (geminiError == null ? void 0 : geminiError.message) || geminiError);
      }
    }
    const lines = notes.split("\n").filter((l) => l.trim().length > 0);
    const formattedBullets = lines.map((line) => {
      const trimmed = line.trim().replace(/^[-*•]\s*/, "");
      return `- ${trimmed}`;
    }).join("\n");
    const mockRefined = `## Ringkasan Eksekutif
Rangkuman catatan dari sesi menyimak video ${videoTitle ? `**${videoTitle}**` : ""}.

## Poin Utama & Catatan Waktu
${formattedBullets}

## Catatan Tambahan
> Disusun dari catatan asli pengguna. Hubungkan API Key Gemini di \`.env\` untuk penyempurnaan AI otomatis tingkat lanjut.`;
    return {
      refinedNotes: mockRefined
    };
  } catch (err) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message || "Invalid request"
    });
  }
});

export { refine_post as default };
//# sourceMappingURL=refine.post.mjs.map
