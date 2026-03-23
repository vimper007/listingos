import NewListingForm from '@/components/NewListingForm'

export default function NewListingPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">New Listing</h2>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the details and we&apos;ll generate all your marketing content.
        </p>
      </div>
      <NewListingForm />
    </div>
  )
}
