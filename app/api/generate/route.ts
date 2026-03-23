import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateListingContent } from '@/lib/gemini'

interface GenerateRequest {
  agent_id: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  square_footage: number
  features: string[]
  description: string | null
  photo_urls: string[]
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

    const body = (await request.json()) as GenerateRequest

    // Verify the agent belongs to the authenticated user
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', body.agent_id)
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Create the listing record
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        agent_id: body.agent_id,
        address: body.address,
        price: body.price,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        square_footage: body.square_footage,
        features: body.features,
        description: body.description,
        photo_urls: body.photo_urls,
        status: 'active',
      })
      .select()
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: listingError?.message ?? 'Failed to create listing' },
        { status: 500 }
      )
    }

    // Generate content with Gemini
    const content = await generateListingContent({
      address: body.address,
      price: body.price,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      square_footage: body.square_footage,
      features: body.features,
      description: body.description,
    })

    // Save generated content
    const { error: contentError } = await supabase.from('generated_content').insert({
      listing_id: listing.id,
      mls_description: content.mls_description,
      instagram_post: content.instagram_post,
      facebook_post: content.facebook_post,
      email_template: content.email_template,
      whatsapp_message: content.whatsapp_message,
      tiktok_script: content.tiktok_script,
    })

    if (contentError) {
      return NextResponse.json(
        { error: contentError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ listing_id: listing.id }, { status: 201 })
  } catch (err) {
    console.error('[/api/generate]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
