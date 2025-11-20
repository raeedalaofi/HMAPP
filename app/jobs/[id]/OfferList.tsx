'use client'

import { useState } from 'react'
import { acceptOfferAction } from '@/app/actions'

interface Technician {
  full_name: string
  rating: number | null
  jobs_done: number | null
}

interface Offer {
  id: string
  price: number
  message: string
  status: string
  technicians: Technician
}

interface OfferListProps {
  offers: Offer[]
  jobStatus: string
}

export default function OfferList({ offers, jobStatus }: OfferListProps) {
  const [isAccepting, setIsAccepting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // If job is not waiting for offers, don't show the list
  if (jobStatus !== 'waiting_for_offers') {
    const acceptedOffer = offers.find(o => o.status === 'accepted')
    if (!acceptedOffer) {
      return null
    }

    // Show only accepted offer
    return (
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-900 mb-4">✓ العرض المقبول</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-green-700">اسم الفني</label>
            <p className="text-lg font-semibold text-green-900">
              {acceptedOffer.technicians?.full_name || 'غير متوفر'}
            </p>
          </div>
          <div>
            <label className="block text-sm text-green-700">التقييم</label>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < Math.round(acceptedOffer.technicians?.rating || 0)
                        ? 'text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-green-700">
                ({acceptedOffer.technicians?.rating || 0}/5)
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-green-700">السعر</label>
            <p className="text-2xl font-bold text-green-900">
              {acceptedOffer.price} ريال
            </p>
          </div>
          <div>
            <label className="block text-sm text-green-700">الرسالة</label>
            <p className="text-green-800">{acceptedOffer.message || 'لا توجد رسالة'}</p>
          </div>
        </div>
      </div>
    )
  }

  // If empty, show waiting message
  if (!offers || offers.length === 0) {
    return (
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-700 font-semibold">
          ⏳ جاري انتظار العروض من الفنيين...
        </p>
      </div>
    )
  }

  // Render offers list
  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">العروض المتاحة</h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {offers.map(offer => (
          <div
            key={offer.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Technician Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  اسم الفني
                </label>
                <p className="text-lg font-semibold text-gray-800">
                  {offer.technicians?.full_name || 'غير متوفر'}
                </p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  التقييم
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < Math.round(offer.technicians?.rating || 0)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({offer.technicians?.rating || 0}/5)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  السعر المقترح
                </label>
                <p className="text-2xl font-bold text-green-600">
                  {offer.price} ريال
                </p>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  الأعمال المنجزة
                </label>
                <p className="text-lg font-semibold text-gray-800">
                  {offer.technicians?.jobs_done || 0} عملية
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                رسالة الفني
              </label>
              <p className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                {offer.message || 'لا توجد رسالة'}
              </p>
            </div>

            {/* Accept Button */}
            <button
              onClick={() => {
                if (
                  confirm('هل تريد قبول هذا العرض؟ لا يمكن تغييره لاحقاً.')
                ) {
                  setIsAccepting(offer.id)
                  setError(null)

                  acceptOfferAction(offer.id).then(result => {
                    setIsAccepting(null)
                    if (!result.success) {
                      setError(result.message)
                    }
                  })
                }
              }}
              disabled={isAccepting === offer.id}
              className={`w-full py-3 rounded-lg font-bold transition ${
                isAccepting === offer.id
                  ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isAccepting === offer.id ? '⏳ جاري القبول...' : '✓ قبول العرض'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
