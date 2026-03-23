import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  generateListingContent,
  generateSingleField,
  type ContentFieldKey,
} from '@/lib/gemini'
import type { Listing } from '@/lib/types'

interface RegenerateRequest {
  listing_id: string
  field?: ContentFieldKey
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

    const { listing_id, field } = (await request.json()) as RegenerateRequest

    // Verify ownership
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

    const listingFields = {
      address: typedListing.address,
      price: typedListing.price,
      bedrooms: typedListing.bedrooms,
      bathrooms: typedListing.bathrooms,
      square_footage: typedListing.square_footage,
      features: typedListing.features,
      description: typedListing.description,
    }

    // Check if a content record already exists (determines insert vs update)
    const { data: existing } = await supabase
      .from('generated_content')
      .select('id')
      .eq('listing_id', listing_id)
      .single()

    if (field) {
      // Single-field regeneration
      const value = await generateSingleField(listingFields, field)

      const patch = { [field]: value, generated_at: new Date().toISOString() }

      const { data, error } = existing
        ? await supabase
            .from('generated_content')
            .update(patch)
            .eq('id', existing.id)
            .select()
            .single()
        : await supabase
            .from('generated_content')
            .insert({ listing_id, ...patch })
            .select()
            .single()

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? 'Failed to save content' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    } else {
      // Full regeneration
      const content = await generateListingContent(listingFields)

      const payload = {
        mls_description: content.mls_description,
        instagram_post: content.instagram_post,
        facebook_post: content.facebook_post,
        email_template: content.email_template,
        whatsapp_message: content.whatsapp_message,
        tiktok_script: content.tiktok_script,
        generated_at: new Date().toISOString(),
      }

      const { data, error } = existing
        ? await supabase
            .from('generated_content')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single()
        : await supabase
            .from('generated_content')
            .insert({ listing_id, ...payload })
            .select()
            .single()

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? 'Failed to save content' },
          { status: 500 }
        )
      }

      return NextResponse.json(data)
    }
  } catch (err) {
    console.error('[/api/generate/regenerate]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
