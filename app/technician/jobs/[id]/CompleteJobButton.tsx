'use client'

import { completeJobAction } from '@/app/actions'
import { useState } from 'react'

interface CompleteJobButtonProps {
  jobId: string
  totalPrice: number
}

export default function CompleteJobButton({ jobId, totalPrice }: CompleteJobButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const confirmed = window.confirm(
      `هل أنت متأكد من إنهاء العمل؟\n\nسيتم تحويل ${(totalPrice * 0.85).toFixed(2)} ريال إلى محفظتك.`
    )
    
    if (!confirmed) return
    
    setIsLoading(true)
    const formData = new FormData()
    formData.append('jobId', jobId)
    
    try {
      await completeJobAction(formData)
    } catch (err) {
      console.error('Error completing job:', err)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoading ? 'جاري التأكيد...' : '✅ تأكيد إنهاء العمل'}
      </button>
    </form>
  )
}
