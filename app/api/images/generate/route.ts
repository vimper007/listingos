import { InferenceClient } from '@huggingface/inference'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Listing } from '@/lib/types'

const HF_IMAGE_MODEL = process.env.HF_IMAGE_MODEL
const HF_INFERENCE_PROVIDER = process.env.HF_INFERENCE_PROVIDER || 'hf-inference'
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000
let cachedModels: { at: number; models: string[] } | null = null

function buildPrompt(listing: Listing) {
  const base = `Photorealistic real estate listing photo.`
  const details = [
    `Address: ${listing.address}`,
    `Price: ${listing.price}`,
    `Bedrooms: ${listing.bedrooms}`,
    `Bathrooms: ${listing.bathrooms}`,
    `Size: ${listing.square_footage} sqft`,
    listing.features.length > 0 ? `Features: ${listing.features.join(', ')}` : null,
    listing.description ? `Notes: ${listing.description}` : null,
  ]
    .filter(Boolean)
    .join('. ')

  return `${base} ${details}. Wide-angle, natural lighting, no people, no text, no watermark.`
}

async function listImageModels(): Promise<string[]> {
  if (cachedModels && Date.now() - cachedModels.at < MODEL_CACHE_TTL_MS) {
    return cachedModels.models
  }

  const res = await fetch(
    `https://huggingface.co/api/models?inference_provider=${encodeURIComponent(
      HF_INFERENCE_PROVIDER
    )}&pipeline_tag=text-to-image&sort=downloads&direction=-1&limit=10`
  )

  if (!res.ok) {
    cachedModels = { at: Date.now(), models: [] }
    return []
  }

  const data = (await res.json()) as { id?: string }[]
  const models = data.map((m) => m.id).filter((id): id is string => Boolean(id))
  cachedModels = { at: Date.now(), models }
  return models
}

function isModelNotFoundError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  const lower = message.toLowerCase()
  return (
    lower.includes('not found') ||
    lower.includes('unknown model') ||
    lower.includes('does not exist') ||
    lower.includes('404')
  )
}

async function generateImageWithModel(prompt: string, modelId: string) {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY missing; set it to enable image generation')
  }

  const client = new InferenceClient(apiKey)
  const imageBlob = await client.textToImage({
    model: modelId,
    inputs: prompt,
    provider: HF_INFERENCE_PROVIDER,
  })

  const buffer = Buffer.from(await imageBlob.arrayBuffer())
  const contentType = imageBlob.type || 'image/png'
  return { buffer, contentType }
}

async function generateImage(prompt: string) {
  const models = [
    ...(HF_IMAGE_MODEL ? [HF_IMAGE_MODEL] : []),
    ...(await listImageModels()),
  ]

  if (models.length === 0) {
    throw new Error('No text-to-image models available for Hugging Face inference')
  }

  let lastError: unknown = null

  for (const modelId of models) {
    try {
      return await generateImageWithModel(prompt, modelId)
    } catch (err) {
      lastError = err
      if (isModelNotFoundError(err)) {
        continue
      }
      throw err
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No valid Hugging Face image model found')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listing_id, count } = (await request.json()) as {
      listing_id?: string
      count?: number
    }

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('*, agents!inner(user_id)')
      .eq('id', listing_id)
      .eq('agents.user_id', user.id)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const typedListing = listing as Listing
    const existingUrls = typedListing.photo_urls ?? []
    if (existingUrls.length >= 10) {
      return NextResponse.json({ error: 'Photo limit reached (10 max)' }, { status: 400 })
    }

    const requested = Math.max(1, Math.min(count ?? 1, 3))
    const remaining = Math.min(requested, 10 - existingUrls.length)
    const newUrls: string[] = []

    for (let i = 0; i < remaining; i += 1) {
      const prompt = buildPrompt(typedListing)
      const { buffer, contentType } = await generateImage(prompt)
      const path = `${typedListing.agent_id}/ai-${Date.now()}-${i}.png`

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(path, buffer, { contentType })

      if (uploadError) {
        return NextResponse.json(
          { error: `Photo upload failed: ${uploadError.message}` },
          { status: 500 }
        )
      }

      const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
      newUrls.push(urlData.publicUrl)
    }

    const updatedUrls = [...existingUrls, ...newUrls]
    const { error: updateError } = await supabase
      .from('listings')
      .update({ photo_urls: updatedUrls })
      .eq('id', typedListing.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ added: newUrls, photo_urls: updatedUrls }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
