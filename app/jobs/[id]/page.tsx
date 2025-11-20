import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CancelButton from './CancelButton'
import OfferList from './OfferList'
import ReviewSection from '@/app/components/ReviewSection'

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Fetch job with relationships
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      customer_addresses (label, address_text),
      service_categories (name),
      price_offers (
        id,
        price,
        message,
        status,
        technicians (full_name, rating, jobs_done, company_id)
      )
    `)
    .eq('id', id)
    .in('price_offers.status', ['pending', 'accepted'])
    .single()

  if (error || !job) {
    notFound()
  }

  // Fetch this user's review for this job, if it exists
  const { data: existingReview } = await supabase
    .from('job_reviews')
    .select('id, rating, comment')
    .eq('job_id', id)
    .eq('reviewer_role', 'customer') // Customer is reviewing
    .maybeSingle()

  // Format date
  const createdDate = new Date(job.requested_time).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Get address details
  const address = job.customer_addresses
  const category = job.service_categories

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Header with back button */}
      <div className="max-w-4xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <span className="mr-2">←</span>
          العودة للطلبات
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Job Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">{job.title}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category Badge */}
                {category && (
                  <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
                    {category.name}
                  </span>
                )}

                {/* Status Badge */}
                <span
                  className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                    job.status === 'waiting_for_offers'
                      ? 'bg-yellow-100 text-yellow-700'
                      : job.status === 'pending'
                      ? 'bg-blue-100 text-blue-700'
                      : job.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {job.status === 'waiting_for_offers'
                    ? '⏳ بانتظار العروض'
                    : job.status === 'pending'
                    ? '⏳ قيد الانتظار'
                    : job.status === 'completed'
                    ? '✅ مكتمل'
                    : job.status}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 min-w-fit">
              <p className="text-sm text-gray-600 mb-1">الميزانية المتوقعة</p>
              {job.total_price === null ? (
                <p className="text-2xl font-bold text-yellow-600">-- بانتظار العروض --</p>
              ) : (
                <p className="text-3xl font-bold text-blue-600">
                  {job.total_price} <span className="text-lg font-normal">ريال</span>
                </p>
              )}
            </div>
          </div>

          {/* Meta Information */}
          <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
            <p>📅 {createdDate}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📝 الوصف التفصيلي</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {job.description || 'لم يتم إضافة وصف'}
              </p>
            </div>

            {/* Address Card */}
            {address && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📍 موقع الخدمة</h2>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📌</span>
                    <div>
                      <p className="font-semibold text-gray-800">{address.label}</p>
                      <p className="text-gray-600 mt-1">{address.address_text}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Offers Section */}
            <OfferList offers={job.price_offers || []} jobStatus={job.status} />

            {/* Review Section (if job is completed) */}
            {job.status === 'completed' && (
              <ReviewSection 
                jobId={id} 
                currentUserRole="customer" 
                existingReview={existingReview} 
              />
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Job Status Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4">📊 ملخص الطلب</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">معرف الطلب:</span>
                  <span className="font-mono text-sm text-gray-800">{job.id}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">الحالة:</span>
                  <span className="font-semibold text-gray-800">
                    {job.status === 'waiting_for_offers'
                      ? '⏳ بانتظار العروض'
                      : job.status === 'pending'
                      ? '⏳ قيد الانتظار'
                      : job.status === 'completed'
                      ? '✅ مكتمل'
                      : job.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">الخدمة:</span>
                  <span className="font-semibold text-gray-800">{category?.name || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">الميزانية:</span>
                  <span className="font-semibold">
                    {job.total_price === null ? (
                      <span className="text-yellow-600">-- بانتظار العروض --</span>
                    ) : (
                      <span className="text-blue-600">{job.total_price} ريال</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mb-3">
                تحديث الطلب
              </button>
              <CancelButton jobId={job.id} currentStatus={job.status} userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
