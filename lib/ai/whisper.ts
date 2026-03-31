import { GoogleGenerativeAI } from '@google/generative-ai'

const ALLOWED_EXTS = ['.mp3', '.mp4', '.m4a', '.wav', '.webm', '.ogg']
const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20MB (Gemini inline 제한)

const MIME_MAP: Record<string, string> = {
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: '파일 크기는 20MB 이하여야 합니다' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTS.includes('.' + ext)) {
    return { valid: false, error: `지원 형식: ${ALLOWED_EXTS.join(', ')}` }
  }

  return { valid: true }
}

export async function transcribeAudio(file: File): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
  const mimeType = MIME_MAP[ext] ?? file.type ?? 'audio/mp4'

  // File → base64 변환
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
    '이 음성 파일의 내용을 한국어로 그대로 전사(transcription)해주세요. 말한 내용만 텍스트로 출력하고 다른 설명은 하지 마세요.',
  ])

  return result.response.text()
}
