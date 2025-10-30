import Link from "next/link"

async function fetchProviderReviews() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/provider/reviews`, {
    cache: 'no-store',
    // Next.js automatically forwards cookies on server-side fetch
  })

  if (!res.ok) {
    return { reviews: [], totalReviews: 0, averageRating: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
  }

  return res.json()
}

export default async function ProviderReviewsPage() {
  const data = await fetchProviderReviews()

  const { reviews = [], totalReviews = 0, averageRating = 0, ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } = data || {}

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Reviews</h1>
        <Link href="/provider" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border bg-white">
          <p className="text-sm text-gray-600">Average Rating</p>
          <p className="text-3xl font-bold mt-1">{averageRating.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Based on {totalReviews} review{totalReviews === 1 ? '' : 's'}</p>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <p className="text-sm text-gray-600 mb-2">Rating Distribution</p>
          <div className="space-y-1 text-sm">
            {[5,4,3,2,1].map(star => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-10 text-gray-700">{star}★</span>
                <div className="flex-1 h-2 bg-gray-100 rounded">
                  <div
                    className="h-2 bg-yellow-400 rounded"
                    style={{ width: `${ratingDistribution[star as 1|2|3|4|5] || 0}%` }}
                  />
                </div>
                <span className="w-12 text-right text-gray-600">{Math.round(ratingDistribution[star as 1|2|3|4|5] || 0)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <p className="text-sm text-gray-600">Total Reviews</p>
          <p className="text-3xl font-bold mt-1">{totalReviews}</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="p-6 text-center text-gray-600 border rounded-lg bg-white">No reviews yet.</div>
        )}

        {reviews.map((r: any) => (
          <div key={r.id} className="p-4 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">{'★'.repeat(r.rating)}</span>
                <span className="text-sm text-gray-600">{r.rating}/5</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            {r.comment && (
              <p className="mt-2 text-sm text-gray-800">{r.comment}</p>
            )}
            <div className="mt-3 text-xs text-gray-600">
              <p>Service: {r.booking?.service?.name || 'N/A'}</p>
              <p>Client: {r.booking?.client?.name || r.booking?.client?.email || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



