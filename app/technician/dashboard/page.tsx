import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TechnicianDashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get technician info
  const { data: technician } = await supabase
    .from('technicians')
    .select('id, full_name, phone, rating, jobs_done, company_id, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!technician) redirect('/signup-technician')

  // Get wallet balance
  const { data: wallet } = await supabase
    .from('technician_wallets')
    .select('balance, currency')
    .eq('technician_id', technician.id)
    .maybeSingle()

  const balance = wallet?.balance || 0

  // Get my offers (with job details)
  const { data: myOffers } = await supabase
    .from('price_offers')
    .select(`
      id,
      price,
      message,
      status,
      created_at,
      jobs (
        id,
        title,
        status,
        service_categories (name)
      )
    `)
    .eq('technician_id', technician.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get assigned jobs
  const { data: assignedJobs } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      status,
      total_price,
      requested_time,
      service_categories (name),
      customers (full_name),
      customer_addresses (label, address_text)
    `)
    .eq('assigned_technician_id', technician.id)
    .in('status', ['assigned', 'completed'])
    .order('requested_time', { ascending: false })
    .limit(10)

  // Get available jobs for bidding
  const { data: availableJobs } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      description,
      status,
      requested_time,
      service_categories (name),
      customer_addresses (label)
    `)
    .eq('status', 'waiting_for_offers')
    .order('requested_time', { ascending: false })
    .limit(5)

  // Calculate stats
  const pendingOffers = myOffers?.filter(o => o.status === 'pending').length || 0
  const acceptedOffers = myOffers?.filter(o => o.status === 'accepted').length || 0
  const activeJobs = assignedJobs?.filter(j => j.status === 'assigned').length || 0
  const completedJobs = assignedJobs?.filter(j => j.status === 'completed').length || 0

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🔧 لوحة تحكم الفني</h1>
            <p className="text-gray-600">مرحباً، {technician.full_name}</p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← الرئيسية
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">رصيد المحفظة</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{balance.toFixed(2)} ريال</p>
          </div>

          {/* Jobs Done */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">الأعمال المنجزة</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{technician.jobs_done || 0}</p>
          </div>

          {/* Rating */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">التقييم</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{technician.rating ? technician.rating.toFixed(1) : 'جديد'} ⭐</p>
          </div>

          {/* Active Jobs */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">الأعمال الحالية</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{activeJobs}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Assigned Jobs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assigned Jobs */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📋 أعمالي المكلف بها</h2>
              {assignedJobs && assignedJobs.length > 0 ? (
                <div className="space-y-4">
                  {assignedJobs.map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/technician/jobs/${job.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.service_categories?.name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'assigned' 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {job.status === 'assigned' ? '⏳ قيد التنفيذ' : '✓ مكتمل'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>💰 {job.total_price} ريال</span>
                        <span>👤 {job.customers?.full_name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد أعمال مكلف بها حالياً</p>
                </div>
              )}
            </div>

            {/* Available Jobs */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 أعمال متاحة للتقديم</h2>
              {availableJobs && availableJobs.length > 0 ? (
                <div className="space-y-4">
                  {availableJobs.map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/technician/jobs/${job.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.service_categories?.name}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          جديد
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{job.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>📍 {job.customer_addresses?.label}</span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/"
                    className="block text-center text-blue-600 hover:text-blue-700 font-medium text-sm pt-2"
                  >
                    عرض جميع الأعمال المتاحة ←
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد أعمال متاحة حالياً</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Offers Status */}
          <div className="space-y-6">
            {/* Offers Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📊 ملخص العروض</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">قيد الانتظار</span>
                  <span className="text-xl font-bold text-yellow-700">{pendingOffers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">مقبولة</span>
                  <span className="text-xl font-bold text-green-700">{acceptedOffers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">مكتملة</span>
                  <span className="text-xl font-bold text-blue-700">{completedJobs}</span>
                </div>
              </div>
            </div>

            {/* Recent Offers */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📝 آخر عروضي</h2>
              {myOffers && myOffers.length > 0 ? (
                <div className="space-y-3">
                  {myOffers.slice(0, 5).map((offer: any) => (
                    <div key={offer.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                          {offer.jobs?.title}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          offer.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-700'
                            : offer.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {offer.status === 'pending' ? '⏳' : offer.status === 'accepted' ? '✓' : '✗'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{offer.price} ريال</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <p>لم تقدم عروضاً بعد</p>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">👤 معلومات الحساب</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">الاسم</p>
                  <p className="font-semibold text-gray-800">{technician.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">الجوال</p>
                  <p className="font-semibold text-gray-800">{technician.phone}</p>
                </div>
                <div>
                  <p className="text-gray-600">الحالة</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    technician.is_active 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {technician.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                {technician.company_id && (
                  <div>
                    <p className="text-gray-600">التابعية</p>
                    <p className="font-semibold text-gray-800">موظف شركة</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
