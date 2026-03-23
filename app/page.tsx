import Image from 'next/image'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'

const advantages = [
  {
    title: 'Instant listing campaigns',
    description:
      'Generate MLS descriptions, social captions, email copy, and ad headlines from one listing form.',
  },
  {
    title: 'Luxury brand consistency',
    description:
      'Match tone, style, and compliance across every listing with templates tuned for premium brokers.',
  },
  {
    title: 'Live property pages',
    description:
      'Publish polished public pages and share them with buyers in seconds.',
  },
  {
    title: 'AI property concierge',
    description:
      'Answer buyer questions with a listing trained chat that stays on brand and on policy.',
  },
]

const innovationTracks = [
  'Craftsmanship',
  'Ownership',
  'Net zero',
  'Marketplace',
  'Affordable pricing',
]

const projectGallery = [
  { src: '/landing/cabin.jpg', alt: 'Modern cabin at dusk' },
  { src: '/landing/detail.jpg', alt: 'Warm interior detail' },
  { src: '/landing/city.jpg', alt: 'City skyline lights' },
  { src: '/landing/night.jpg', alt: 'Evening architecture detail' },
]

const addressList = [
  { label: 'Sunset Plaza Drive', number: '02' },
  { label: 'High-End Villa Overlook', number: '03' },
  { label: 'Cliffwood Avenue', number: '04' },
]

const faqs = [
  {
    question: 'Can the listing content be customized?',
    answer:
      'Yes. Every output is editable, and you can regenerate variations without rebuilding the listing.',
  },
  {
    question: 'How does the content generation work?',
    answer:
      'You provide property details, photos, and highlights. ListingOS generates copy tuned for buyers and MLS.',
  },
  {
    question: 'Do I need a marketing team to use this?',
    answer:
      'No. The platform is built for solo agents and teams who want premium output with minimal effort.',
  },
  {
    question: 'When do I get charged?',
    answer:
      'Plans bill monthly. You can start with the free trial and upgrade only when you are ready.',
  },
  {
    question: 'Is it compliant with real estate guidelines?',
    answer:
      'Yes. Generated copy follows fair housing best practices and avoids protected-class language.',
  },
]

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const logoHref = user ? '/dashboard' : '/'

  return (
    <main className="bg-[#f4f1ec] text-[#141414]">
      <section className="px-6 pt-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#0f0f0f] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0">
            <Image
              src="/landing/hero.jpg"
              alt="Modern home exterior"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          </div>

          <header className="relative z-20 flex flex-col items-start gap-4 px-8 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <details className="relative group z-30">
              <summary className="list-none text-xs tracking-[0.3em] uppercase border border-white/40 px-4 py-2 rounded-full cursor-pointer [&::-webkit-details-marker]:hidden">
                Menu
              </summary>
              <div className="absolute left-0 mt-3 w-52 rounded-2xl border border-white/20 bg-black/70 p-4 text-xs uppercase tracking-[0.2em] text-white backdrop-blur shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
                <Link className="block py-2 text-white/70 hover:text-white" href="#advantages">
                  Advantages
                </Link>
                <Link className="block py-2 text-white/70 hover:text-white" href="#innovation">
                  Innovation
                </Link>
                <Link className="block py-2 text-white/70 hover:text-white" href="#projects">
                  Projects
                </Link>
                <Link className="block py-2 text-white/70 hover:text-white" href="#faq">
                  FAQ
                </Link>
                <Link className="block py-2 text-white/70 hover:text-white" href="#contact">
                  Contact
                </Link>
              </div>
            </details>
            <Link href={logoHref} className="text-sm tracking-[0.35em] uppercase">ListingOS</Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-[#e2572f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            >
              Get Started
            </Link>
          </header>

          <div className="relative z-10 grid gap-8 px-8 pb-16 pt-10 text-white sm:pt-8 md:grid-cols-[1.2fr_0.8fr] md:pt-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Premium marketing platform</p>
              <h1 className="mt-6 text-4xl font-[var(--font-display)] uppercase tracking-tight sm:text-5xl lg:text-6xl">
                The Future of
                <br />
                Listing Marketing
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                Build irresistible listings in minutes. Generate copy, showcase pages, and buyer messaging
                without outsourcing your brand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#141414]"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-full border border-white/50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div className="max-w-xs rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Trusted by</p>
                <p className="mt-3 text-lg font-semibold">Top brokers and boutique agencies</p>
                <p className="mt-4 text-sm text-white/70">
                  Deliver polished campaigns with the same team, no extra headcount.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="#advantages"
            aria-label="Jump to advantages"
            className="absolute bottom-6 right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm text-white hover:bg-white/20 transition-colors"
          >
            -&gt;
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center" id="advantages">
        <p className="text-xs uppercase tracking-[0.4em] text-[#e2572f]">Fully aligned</p>
        <blockquote className="mt-6 text-2xl font-[var(--font-display)] leading-snug text-[#1b1b1b] sm:text-3xl">
          ListingOS is committed to delivering premium marketing that matches the ambition of every
          luxury listing.
        </blockquote>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[#6f6f6f]">Operations lead</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#e2572f]">What makes it premium</p>
          <h2 className="mt-4 text-3xl font-[var(--font-display)] uppercase tracking-tight">
            Your advantage
            <br />
            in every market
          </h2>
          <div className="mt-8 space-y-6">
            {advantages.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 border-b border-[#d8d2c9] pb-6 text-sm"
              >
                <span className="text-xs font-semibold text-[#9d9487]">0{index + 1}</span>
                <div>
                  <p className="font-semibold text-[#1b1b1b]">{item.title}</p>
                  <p className="mt-2 text-[#6b6b6b]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src="/landing/cabin.jpg"
            alt="Luxury cabin"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Designed for luxury</p>
            <p className="mt-2 text-2xl font-[var(--font-display)] uppercase">
              Take a bold step
              <br />
              into modern living
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#151515] text-white" id="innovation">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_1.4fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#e2572f]">Innovation in every level</p>
            <h2 className="mt-4 text-3xl font-[var(--font-display)] uppercase tracking-tight">
              Comfort
              <br />
              and space
            </h2>
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <Image
                src="/landing/interior.jpg"
                alt="Warm interior"
                width={640}
                height={520}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-4 text-sm text-white/70">
              Premium layouts that showcase the story behind every listing.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-6">
            {innovationTracks.map((item, index) => (
              <div
                key={item}
                className="flex flex-col items-center justify-between rounded-2xl border border-white/10 px-3 py-6"
              >
                <span className="text-xs text-white/50">0{index + 2}</span>
                <span
                  className="text-xs uppercase tracking-[0.4em]"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {item}
                </span>
                <span className="h-10 w-px bg-white/15" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20" id="projects">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#e2572f]">Our projects</p>
            <h2 className="mt-3 text-3xl font-[var(--font-display)] uppercase tracking-tight">
              Pedro Residence
            </h2>
          </div>
          <p className="max-w-xl text-sm text-[#6b6b6b]">
            A modern coastal estate campaign delivered across listings, social, and buyer outreach in
            under one day.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {projectGallery.map((item) => (
            <div key={item.src} className="relative h-40 overflow-hidden rounded-2xl">
              <Image src={item.src} alt={item.alt} fill className="object-cover" />
            </div>
          ))}
        </div>

        <div className="relative mt-12 overflow-hidden rounded-3xl border border-[#e3ddd4] bg-white px-10 py-12">
          <div className="absolute -left-6 top-1/2 hidden -translate-y-1/2 text-[140px] font-[var(--font-display)] text-[#f0ece6] lg:block">
            OS
          </div>
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#a59b8c]">Signature street</p>
            <h3 className="mt-4 text-2xl font-[var(--font-display)] uppercase text-[#1b1b1b]">
              Sunset Plaza Drive
            </h3>
            <p className="mt-3 text-sm text-[#6b6b6b]">
              High-end villa overlooking the bay with a full-funnel marketing rollout.
            </p>
          </div>
        </div>

        <div className="mt-10 divide-y divide-[#e0d9cf] rounded-3xl border border-[#e0d9cf] bg-white/70">
          {addressList.map((item) => (
            <div key={item.label} className="flex items-center justify-between px-8 py-6">
              <p className="text-sm uppercase tracking-[0.2em] text-[#1b1b1b]">{item.label}</p>
              <span className="text-xs text-[#9a9184]">{item.number}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24" id="faq">
        <p className="text-xs uppercase tracking-[0.4em] text-[#e2572f]">FAQ</p>
        <h2 className="mt-4 text-3xl font-[var(--font-display)] uppercase">Common questions</h2>
        <div className="mt-8 divide-y divide-[#ddd5ca] rounded-3xl border border-[#ddd5ca] bg-white/70">
          {faqs.map((item) => (
            <details key={item.question} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.2em] text-[#1b1b1b] [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="ml-4 text-[#e2572f] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm text-[#6b6b6b]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-[#141414] text-white" id="contact">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#e2572f]">Lets talk</p>
              <h2 className="mt-4 text-4xl font-[var(--font-display)] uppercase tracking-tight">
                Build your next
                <br />
                listing campaign
              </h2>
              <p className="mt-6 max-w-lg text-sm text-white/70">
                Start your free trial or book a quick call to see how ListingOS upgrades your marketing
                workflow.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className="rounded-full bg-[#e2572f] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-full border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Sign In
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {projectGallery.map((item) => (
                <div key={`footer-${item.src}`} className="relative h-28 overflow-hidden rounded-2xl">
                  <Image src={item.src} alt={item.alt} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.3em] text-white/50">
            <span>ListingOS</span>
            <span>The future of listing marketing</span>
            <span>hello@listingos.com</span>
          </div>
        </div>
      </section>
    </main>
  )
}





