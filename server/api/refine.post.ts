import { defineEventHandler, readBody, createError } from 'h3'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateRefineRequest, buildRefinementPrompt } from '../utils/prompt'

export default defineEventHandler(async (event) => {
  try {
    const rawBody = await readBody(event)
    const { notes, videoTitle } = validateRefineRequest(rawBody)

    const config = useRuntimeConfig()
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

    // If API key is available, call Google Gemini
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const prompt = buildRefinementPrompt(notes, videoTitle)

        const result = await model.generateContent(prompt)
        const response = await result.response
        const refinedText = response.text()

        if (refinedText && refinedText.trim()) {
          return { refinedNotes: refinedText.trim() }
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to local formatter:', geminiError?.message || geminiError)
      }
    }

    // Fallback: Local structural formatter when API key is missing or network unavailable
    const lines = notes.split('\n').filter(l => l.trim().length > 0)
    const formattedBullets = lines.map(line => {
      const trimmed = line.trim().replace(/^[-*•]\s*/, '')
      return `- ${trimmed}`
    }).join('\n')

    const mockRefined = `## Ringkasan Eksekutif
Rangkuman catatan dari sesi menyimak video ${videoTitle ? `**${videoTitle}**` : ''}.

## Poin Utama & Catatan Waktu
${formattedBullets}

## Catatan Tambahan
> Disusun dari catatan asli pengguna. Hubungkan API Key Gemini di \`.env\` untuk penyempurnaan AI otomatis tingkat lanjut.`

    return {
      refinedNotes: mockRefined
    }
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message || 'Invalid request'
    })
  }
})
