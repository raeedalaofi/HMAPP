'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelJobAction } from '@/app/actions'

interface CancelButtonProps {
  jobId: string
  currentStatus: string
  userId: string
}

export default function CancelButton({ jobId, currentStatus, userId }: CancelButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Only show button if job is pending
  if (currentStatus !== 'pending') {
    return null
  }

  const handleCancel = async () => {
    // Confirm with user
    const confirmed = window.confirm(
      'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم استرجاع المبلغ إلى محفظتك.'
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      try {
        // Pass jobId as string to server action (DB uses UUID)
        const result = await cancelJobAction(jobId, userId)

        if (result.success) {
          alert(result.message)
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/')
          }, 500)
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error('Error cancelling job:', error)
        alert('حدث خطأ أثناء إلغاء الطلب')
      }
    })
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {isPending ? 'جاري الإلغاء...' : 'إلغاء الطلب واسترداد المبلغ'}
    </button>
  )
}
