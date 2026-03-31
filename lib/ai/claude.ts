import Anthropic from '@anthropic-ai/sdk'
import type { MemoAnalysis } from '@/types'
import { MEMO_ANALYSIS_SYSTEM } from './prompts'

const MODEL = 'claude-sonnet-4-6'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

/**
 * 미팅 메모를 Claude로 구조화 분석
 */
export async function analyzeMemo(text: string): Promise<MemoAnalysis> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: MEMO_ANALYSIS_SYSTEM,
    messages: [{ role: 'user', content: `다음 미팅 메모를 분석하세요:\n\n${text}` }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  // JSON 파싱 (마크다운 코드블록 제거 후)
  const raw = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(raw) as MemoAnalysis
}

/**
 * AI 코치 스트리밍 — ReadableStream 반환
 */
export function streamCoach(systemPrompt: string, userContent: string): ReadableStream {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await getClient().messages.stream({
          model: MODEL,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        })

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

/**
 * 제안서 초안 생성 (non-streaming)
 */
export async function generateProposal(systemPrompt: string, userContent: string): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}

/**
 * 오늘 할 일 생성 (non-streaming)
 */
export async function generateTodayActions(systemPrompt: string, userContent: string): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
