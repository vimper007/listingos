import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase'
import type { Listing, GeneratedContent } from '@/lib/types'

interface ChatRequest {
  message: string
  listing_id: string
}

export async function POST(request: NextRequest) {
  const { message, listing_id } = (await request.json()) as ChatRequest

  const supabase = createAdminClient()

  const [listingResult, contentResult] = await Promise.all([
    supabase.from('listings').select('*').eq('id', listing_id).eq('status', 'active').single(),
    supabase
      .from('generated_content')
      .select('mls_description')
      .eq('listing_id', listing_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (!listingResult.data) {
    return new Response(JSON.stringify({ error: 'Listing not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const listing = listingResult.data as Listing
  const content = contentResult.data as Pick<GeneratedContent, 'mls_description'> | null

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(listing.price)

  const systemPrompt = `You are a helpful property assistant for the following listing:
Address: ${listing.address}
Price: ${formattedPrice}
Bedrooms: ${listing.bedrooms} | Bathrooms: ${listing.bathrooms} | Size: ${listing.square_footage} sqft
Features: ${listing.features.join(', ') || 'None listed'}
Description: ${content?.mls_description ?? 'Not available'}

Answer buyer questions about this property concisely and professionally. If asked something you don't know (like specific legal or structural details), say: 'Great question — I'd recommend asking the agent directly for that one.'
Do not make up facts not provided above. Keep responses to a maximum of 3 sentences.`

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      stream: true,
      max_tokens: 256,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[/api/chat]', err)
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
