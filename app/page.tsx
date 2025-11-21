import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LandingPage from '@/app/components/LandingPage'

export default async function Home() {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  // If NOT logged in, show landing page
  if (!user) {
    return <LandingPage />
  }

  // 2. Check user role and redirect accordingly
  // FIRST: Check if user is an admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminUser) {
    // User is an admin, redirect to admin dashboard
    redirect('/admin')
  }

  // Check if user is a company owner
  const { data: company } = await supabase
    .from('companies')
    .select('id, legal_name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (company) {
    // User is a company owner
    if (!company.legal_name) {
      // Profile incomplete, redirect to complete profile
      redirect('/company/complete-profile')
    }
    // Profile complete, redirect to company dashboard
    redirect('/company/dashboard')
  }

  // Check if user is a technician (freelance or company employee)
  const { data: technician } = await supabase
    .from('technicians')
    .select('id, company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (technician) {
    // User is a technician (either freelance or company employee)
    // Show technician dashboard (jobs available to bid on)
    // For now, keep the current customer view as fallback
    // TODO: Create dedicated technician dashboard
  }

  // 3. User is a regular customer - show customer dashboard
  let jobs: Array<{
    id: string
    title: string
    status: string
    total_price?: number | null
    [key: string]: unknown
  }> = []
  let wallet: { balance: number; currency: string } | null = null
  let customerName = 'مستخدم جديد'

  try {
    // Get the user's customer record
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('user_id', user.id)

    if (customerError) throw customerError

    if (customers && customers.length > 0) {
      const customerId = customers[0].id
      customerName = customers[0].full_name || 'مستخدم جديد'

      // Get wallet balance
      try {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance, currency')
          .eq('customer_id', customerId)
          .single()
        wallet = walletData
      } catch {
        // Wallet might not exist
      }

      // Get jobs for this customer
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', customerId)
        .order('id', { ascending: false })

      if (jobsError) throw jobsError
      
      jobs = jobsData || []
    }
  } catch {
    // If there's an error, just render empty state
    // This prevents page crashes
  }

  // 3. Fetch service categories
  const { data: categories } = await supabase.from('service_categories').select('*')

  // Sign out function
  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      
      {/* 1. الهيدر: الترحيب وزر الخروج */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">مرحباً، {customerName} 👋</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition">
            تسجيل خروج
          </button>
        </form>
      </header>

      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
        
        {/* 2. بطاقة المحفظة (أهم جزء) */}
        <div className="md:col-span-1">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-lg">
            <p className="text-blue-100 mb-2">رصيد المحفظة</p>
            <div className="text-4xl font-bold mb-1">
              {wallet ? wallet.balance : '0.00'} <span className="text-lg font-normal">{wallet?.currency || 'SAR'}</span>
            </div>
            <p className="text-xs text-blue-200 mt-4">
              * هذا الرصيد آمن ومحمي بقواعد البيانات
            </p>
          </div>

          {/* قائمة الخدمات السريعة */}
          <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">طلب خدمة جديدة</h3>
            <div className="space-y-2">
              {categories?.map((cat) => (
                <Link 
                  key={cat.id} 
                  href={`/create-job?categoryId=${cat.id}&categoryName=${cat.name}`}
                  className="w-full text-right px-4 py-3 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition flex justify-between items-center block border border-transparent hover:border-blue-200"
                >
                  <span>{cat.name}</span>
                  <span className="text-gray-400">←</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 3. قائمة طلباتي */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-6">طلباتي الحالية</h2>
            
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                <p>لا توجد طلبات نشطة حالياً</p>
                <p className="text-sm mt-2">اختر خدمة من القائمة لإنشاء طلبك الأول</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex justify-between items-center p-4 border rounded-xl hover:border-blue-300 hover:bg-blue-50 transition group block"
                  >
                    <div>
                      <h4 className="font-bold text-gray-800 group-hover:text-blue-600">{job.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block 
                        ${job.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          job.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{job.total_price || '--'} SAR</p>
                      <span className="text-xs text-blue-600 mt-1 block">التفاصيل →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}