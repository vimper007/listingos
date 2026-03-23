export interface Agent {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  bio: string | null
  logo_url: string | null
  brand_color: string
  slug: string
  stripe_customer_id: string | null
  plan: 'trial' | 'starter' | 'pro' | 'agency'
  trial_ends_at: string | null
  created_at: string
}

export interface Listing {
  id: string
  agent_id: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  square_footage: number
  features: string[]
  description: string | null
  photo_urls: string[]
  status: 'active' | 'sold' | 'archived'
  created_at: string
}

export interface GeneratedContent {
  id: string
  listing_id: string
  mls_description: string
  instagram_post: string
  facebook_post: string
  email_template: string
  whatsapp_message: string
  tiktok_script: string
  generated_at: string
}

export type ListingWithContent = Listing & {
  generated_content: GeneratedContent | null
}

export type ListingWithAgent = Listing & {
  agents: Agent
  generated_content: GeneratedContent | null
}

export const LISTING_FEATURES = [
  'Pool',
  'Garage',
  'Garden',
  'Sea View',
  'Mountain View',
  'Modern Kitchen',
  'Open Plan Living',
  'Home Office',
  'Pet Friendly',
  'Solar Panels',
  'Fireplace',
  'Gym',
] as const

export type ListingFeature = (typeof LISTING_FEATURES)[number]
