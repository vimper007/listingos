import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import type { Listing } from './types'

export interface GeneratedContentResult {
  mls_description: string
  instagram_post: string
  facebook_post: string
  email_template: string
  whatsapp_message: string
  tiktok_script: string
}

type ModelListItem = {
  name?: string
  baseModelId?: string
  supportedGenerationMethods?: string[]
}

let cachedModels: { at: number; models: string[] } | null = null
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000

const SYSTEM_PROMPT =
  'You are an expert real estate copywriter. Generate marketing content for the property listing provided. Be professional, compelling, and Fair Housing compliant. Never mention race, religion, nationality, family status or disability. Return ONLY a raw JSON object with no markdown formatting.'

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

function buildUserPrompt(
  listing: Pick<
    Listing,
    'address' | 'price' | 'bedrooms' | 'bathrooms' | 'square_footage' | 'features' | 'description'
  >
): string {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(listing.price)

  const features = listing.features.length > 0 ? listing.features.join(', ') : 'None'
  const notes = listing.description ?? 'None provided'

  return `Generate marketing content for this property:
Address: ${listing.address}
Price: ${formattedPrice}
Bedrooms: ${listing.bedrooms} | Bathrooms: ${listing.bathrooms} | Size: ${listing.square_footage} sqft
Features: ${features}
Agent notes: ${notes}

Return JSON with these exact keys:
mls_description (200-250 words, professional MLS style),
instagram_post (punchy, max 150 chars + 10 hashtags),
facebook_post (friendly neighborhood-focused, 100-150 words),
email_template (subject line + body, ready to send to buyer list),
whatsapp_message (brief, max 3 lines, includes price and address),
tiktok_script (30-second spoken walkthrough script for the agent)`
}

function parseJsonResponse(text: string): GeneratedContentResult {
  const cleaned = text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()
  return JSON.parse(cleaned) as GeneratedContentResult
}

function cleanJson(text: string): string {
  return text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()
}

async function listGenerateContentModels(apiKey: string): Promise<string[]> {
  if (cachedModels && Date.now() - cachedModels.at < MODEL_CACHE_TTL_MS) {
    return cachedModels.models
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  )

  if (!res.ok) {
    throw new Error(`Gemini models.list failed: ${res.status}`)
  }

  const data = (await res.json()) as { models?: ModelListItem[] }
  const models = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.baseModelId ?? m.name?.replace(/^models\//, ''))
    .filter((m): m is string => Boolean(m))

  cachedModels = { at: Date.now(), models }
  return models
}

async function resolveModelName(apiKey: string): Promise<string> {
  const preferred = [
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
  ].filter(Boolean) as string[]

  try {
    const available = await listGenerateContentModels(apiKey)
    for (const name of preferred) {
      if (available.includes(name)) return name
    }
    if (available.length > 0) return available[0]
  } catch {
    // Fall back to a safe default if model listing fails
  }

  return preferred[0] ?? 'gemini-2.0-flash'
}

export type ContentFieldKey = keyof GeneratedContentResult

const FIELD_INSTRUCTIONS: Record<ContentFieldKey, string> = {
  mls_description: '200-250 word professional MLS listing description',
  instagram_post: 'punchy Instagram caption (max 150 chars) followed by 10 relevant hashtags',
  facebook_post: 'friendly neighborhood-focused Facebook post (100-150 words)',
  email_template: 'email template with a subject line and body ready to send to a buyer list',
  whatsapp_message: 'brief WhatsApp message (max 3 lines) that includes the price and address',
  tiktok_script: '30-second spoken TikTok video walkthrough script for the agent',
}

function isQuotaError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  const lower = message.toLowerCase()
  return (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('429') ||
    lower.includes('quotafailure')
  )
}

async function generateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY missing; set it to enable Groq fallback')
  }

  const groq = new Groq({ apiKey })
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  })

  const text = response.choices[0]?.message?.content ?? ''
  if (!text) throw new Error('Groq returned an empty response')
  return text
}

async function generateWithGroqJson<T>(prompt: string, parser: (text: string) => T): Promise<T> {
  try {
    const text = await generateWithGroq(prompt)
    return parser(cleanJson(text))
  } catch (err) {
    const strictPrompt =
      `${prompt}\n\nIMPORTANT: Your response must be ONLY the raw JSON object. ` +
      'Do not include any text before or after. Do not use markdown. ' +
      'Start your response with { and end with }.'
    const retryText = await generateWithGroq(strictPrompt)
    return parser(cleanJson(retryText))
  }
}

export async function generateSingleField(
  listing: Pick<
    Listing,
  'address' | 'price' | 'bedrooms' | 'bathrooms' | 'square_footage' | 'features' | 'description'
  >,
  field: ContentFieldKey
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  let model:
    | ReturnType<GoogleGenerativeAI['getGenerativeModel']>
    | null = null
  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey)
    const modelName = await resolveModelName(apiKey)
    model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    })
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(listing.price)

  const features = listing.features.length > 0 ? listing.features.join(', ') : 'None'
  const notes = listing.description ?? 'None provided'

  const prompt = `Write a ${FIELD_INSTRUCTIONS[field]} for this property:
Address: ${listing.address}
Price: ${formattedPrice}
Bedrooms: ${listing.bedrooms} | Bathrooms: ${listing.bathrooms} | Size: ${listing.square_footage} sqft
Features: ${features}
Agent notes: ${notes}

Return ONLY a JSON object with a single key "${field}" and the content as its string value. Do not include any other text or formatting.`

  const parseField = (text: string) => {
    const parsed = JSON.parse(text) as Record<string, string>
    const value = parsed[field]
    if (typeof value !== 'string') throw new Error(`Unexpected response for field ${field}`)
    return value
  }

  if (!model) {
    return generateWithGroqJson(prompt, parseField)
  }

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseField(cleanJson(text))
  } catch (err) {
    if (!isQuotaError(err)) throw err
    return generateWithGroqJson(prompt, parseField)
  }
}

export async function generateListingContent(
  listing: Pick<
    Listing,
    'address' | 'price' | 'bedrooms' | 'bathrooms' | 'square_footage' | 'features' | 'description'
  >
): Promise<GeneratedContentResult> {
  const apiKey = process.env.GEMINI_API_KEY
  let model:
    | ReturnType<GoogleGenerativeAI['getGenerativeModel']>
    | null = null
  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey)
    const modelName = await resolveModelName(apiKey)
    model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    })
  }

  const userPrompt = buildUserPrompt(listing)

  if (!model) {
    return generateWithGroqJson(userPrompt, (text) => parseJsonResponse(text))
  }

  try {
    const result = await model.generateContent(userPrompt)
    const text = result.response.text()
    return parseJsonResponse(text)
  } catch (err) {
    if (!isQuotaError(err)) throw err
    return generateWithGroqJson(userPrompt, (text) => parseJsonResponse(text))
  }
}
