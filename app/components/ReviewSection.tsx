'use client'

import { useState } from 'react'
import { submitReview } from '@/app/actions'

interface Review {
  id: number
  rating: number
  comment: string | null
}

interface ReviewSectionProps {
  jobId: string
  currentUserRole: 'customer' | 'technician'
  existingReview: Review | null
}

function Star({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <span onClick={onClick} className="cursor-pointer text-4xl">
      {filled ? (
        <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ) : (
        <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
    </span>
  )
}

export default function ReviewSection({ jobId, currentUserRole, existingReview }: ReviewSectionProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [isLoading, setIsLoading] = useState(false)

  const targetUser = currentUserRole === 'customer' ? 'الفني' : 'العميل'

  if (existingReview) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-green-500">
        <h3 className="text-lg font-bold text-gray-800 mb-2">تقييمك</h3>
        <p className="text-gray-600 mb-2">لقد قمت بتقييم {targetUser} بالفعل.</p>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star key={i} filled={i < existingReview.rating} onClick={() => {}} />
          ))}
          <span className="mr-2 text-gray-700 font-bold">({existingReview.rating} من 5)</span>
        </div>
        {existingReview.comment && (
          <p className="mt-4 text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
            {existingReview.comment}
          </p>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      alert('الرجاء تحديد تقييم (من 1 إلى 5 نجوم).')
      return
    }
    
    setIsLoading(true)
    const formData = new FormData()
    formData.append('jobId', jobId)
    formData.append('rating', String(rating))
    formData.append('comment', comment)

    try {
      await submitReview(formData)
      // The page will be revalidated by the server action
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert('حدث خطأ أثناء إرسال التقييم.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        قيم تجربتك مع {targetUser}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">تقييمك (من 1 إلى 5)</label>
          <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
            {[...Array(5)].map((_, i) => (
              <div key={i} onMouseEnter={() => setHoverRating(i + 1)}>
                <Star
                  filled={(hoverRating || rating) > i}
                  onClick={() => setRating(i + 1)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            أضف تعليقاً (اختياري)
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder={`صف تجربتك مع ${targetUser}...`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || rating === 0}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري الإرسال...' : 'إرسال التقييم'}
        </button>
      </form>
    </div>
  )
}
