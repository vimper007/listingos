import NewListingForm from '@/components/NewListingForm'

export default function NewListingPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            color: 'var(--text-primary)',
            fontWeight: 700,
          }}
        >
          New Listing
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Fill in the details and we&apos;ll generate all your marketing content instantly.
        </p>
      </div>
      <NewListingForm />
    </div>
  )
}
