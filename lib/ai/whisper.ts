import OpenAI from 'openai'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/ogg', 'video/mp4']
const ALLOWED_EXTS = ['.mp3', '.mp4', '.m4a', '.wav', '.webm', '.ogg']
const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: '파일 크기는 25MB 이하여야 합니다' }
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTS.includes(ext)) {
    return { valid: false, error: `지원 형식: ${ALLOWED_EXTS.join(', ')}` }
  }

  if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
    return { valid: false, error: '지원하지 않는 파일 형식입니다' }
  }

  return { valid: true }
}

export async function transcribeAudio(file: File): Promise<string> {
  const response = await getClient().audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'ko',
  })
  return response.text
}
