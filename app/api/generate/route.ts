import { NextRequest, NextResponse } from 'next/server'
import { generateListingContent } from '@/lib/gemini'
import { generateListingRequestSchema } from '@/lib/schemas'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = generateListingRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      )
    }

    const body = parsed.data

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', body.agent_id)
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

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
        description: body.description ?? null,
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

    const content = await generateListingContent({
      address: body.address,
      price: body.price,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      square_footage: body.square_footage,
      features: body.features,
      description: body.description ?? null,
    })

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
      return NextResponse.json({ error: contentError.message }, { status: 500 })
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
