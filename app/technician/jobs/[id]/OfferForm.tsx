'use client'

import { useState } from 'react'
import { submitOffer } from '@/app/actions'

export default function OfferForm({ jobId }: { jobId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append('jobId', jobId)

      const result = await submitOffer(formData)

      if (!result.success) {
        setError(result.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ ما')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl shadow-sm p-6">
        <p className="text-green-700 font-semibold mb-2">✓ تم إرسال العرض بنجاح!</p>
        <p className="text-green-600 text-sm">سيتم إخطارك عندما يقبل العميل عرضك</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">💼 أرسل عرضك</h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            السعر المقترح (بالريال)
          </label>
          <input
            type="number"
            name="amount"
            required
            min="1"
            step="0.01"
            placeholder="500"
            className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظاتك (اختياري)
          </label>
          <textarea
            name="message"
            placeholder="مثال: يمكنني الحضور في غضون ساعتين"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-bold text-white transition ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLoading ? '⏳ جاري الإرسال...' : '📤 إرسال العرض'}
        </button>
      </form>
    </div>
  )
}
