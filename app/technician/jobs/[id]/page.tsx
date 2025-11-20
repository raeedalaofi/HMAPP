import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import OfferForm from './OfferForm'
import CompleteJobButton from './CompleteJobButton'
import ReviewSection from '@/app/components/ReviewSection'

export default async function TechnicianJobDetailsPage({
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

  // Get technician info
  const { data: technician } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!technician) {
    notFound()
  }

  // Fetch job details with relationships
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      customer_addresses (label, address_text, location),
      service_categories (name),
      customers (full_name),
      job_photos (id, url, is_before)
    `)
    .eq('id', id)
    .single()

  if (error || !job) {
    notFound()
  }

  // Check if technician already sent an offer
  const { data: existingOffer } = await supabase
    .from('price_offers')
    .select('id, status, price, message')
    .eq('job_id', id)
    .eq('technician_id', technician.id)
    .maybeSingle()

  // Fetch this technician's review for this job, if it exists
  const { data: existingReview } = await supabase
    .from('job_reviews')
    .select('id, rating, comment')
    .eq('job_id', id)
    .eq('reviewer_role', 'technician') // Technician is reviewing
    .maybeSingle()

  // Format date
  const createdDate = new Date(job.requested_time).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const address = job.customer_addresses
  const category = job.service_categories
  const photos = job.job_photos || []

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Header with back button */}
      <div className="max-w-6xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <span className="mr-2">←</span>
          العودة للطلبات
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Job Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">{job.title}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                {category && (
                  <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
                    {category.name}
                  </span>
                )}

                <span
                  className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
                    job.status === 'waiting_for_offers'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {job.status === 'waiting_for_offers'
                    ? '⏳ بانتظار العروض'
                    : job.status}
                </span>
              </div>
            </div>

            {/* Customer Name */}
            <div className="bg-gray-50 rounded-xl p-4 min-w-fit">
              <p className="text-sm text-gray-600 mb-1">العميل</p>
              <p className="text-lg font-bold text-gray-800">
                {job.customers?.full_name || 'عميل'}
              </p>
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

            {/* Photos Grid */}
            {photos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📸 الصور</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo: { id: string; url: string; is_before: boolean }) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group overflow-hidden rounded-lg"
                    >
                      <Image
                        src={photo.url}
                        alt="job"
                        width={400}
                        height={160}
                        className="w-full h-40 object-cover group-hover:scale-110 transition-transform"
                      />
                      {photo.is_before && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          قبل
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

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
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Complete Job Section (if assigned to this technician) */}
            {job.status === 'assigned' && job.assigned_technician_id === technician.id && job.total_price !== null && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm p-6 border-2 border-green-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  إنهاء العمل
                </h3>
                
                {/* Financial Breakdown */}
                <div className="bg-white rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">السعر الإجمالي:</span>
                    <span className="font-bold text-gray-900">{job.total_price.toFixed(2)} ريال</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">عمولة المنصة (15%):</span>
                    <span className="font-semibold text-red-600">-{(job.total_price * 0.15).toFixed(2)} ريال</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">صافي ربحك:</span>
                      <span className="text-2xl font-bold text-green-600">{(job.total_price * 0.85).toFixed(2)} ريال</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    ⚠️ عند الضغط على "تأكيد الإنهاء"، سيتم تحويل المبلغ إلى محفظتك تلقائياً.
                  </p>
                </div>

                <CompleteJobButton jobId={id} totalPrice={job.total_price} />
              </div>
            )}

            {/* Offer Status or Form */}
            {existingOffer ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-gray-800 mb-4">✓ عرضك المرسل</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">السعر المقترح</p>
                    <p className="text-2xl font-bold text-blue-600">{existingOffer.price} ريال</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">الحالة</p>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                      existingOffer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      existingOffer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {existingOffer.status === 'pending' ? '⏳ قيد الانتظار' :
                       existingOffer.status === 'accepted' ? '✓ مقبول' : '✗ مرفوض'}
                    </div>
                  </div>
                  {existingOffer.message && (
                    <div>
                      <p className="text-sm text-gray-600">ملاحظاتك</p>
                      <p className="text-gray-700 mt-1 bg-gray-50 p-2 rounded">{existingOffer.message}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : job.status === 'waiting_for_offers' ? (
              <OfferForm jobId={id} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <p className="text-gray-600 text-center">
                  لا يمكن إرسال عرض للطلب في الوقت الحالي
                </p>
              </div>
            )}

            {/* Review Section (if job is completed) */}
            {job.status === 'completed' && (
              <ReviewSection 
                jobId={id} 
                currentUserRole="technician" 
                existingReview={existingReview} 
              />
            )}

            {/* Job Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4">📊 ملخص الطلب</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">معرف الطلب:</span>
                  <span className="font-mono text-sm text-gray-800">{job.id}</span>
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
          </div>
        </div>
      </div>
    </main>
  )
}
