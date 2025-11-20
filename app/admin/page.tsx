import { createClient } from '@/utils/supabase/server'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch statistics
  const [
    { count: customersCount },
    { count: techniciansCount },
    { count: pendingCompaniesCount },
    { data: completedJobs }
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('technicians').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('jobs').select('total_price').eq('status', 'completed')
  ])

  // Calculate total revenue from completed jobs
  const totalRevenue = completedJobs?.reduce((sum, job) => sum + (job.total_price || 0), 0) || 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">نظرة عامة</h1>
        <p className="text-gray-500">إحصائيات المنصة والأداء العام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي العملاء"
          value={customersCount ?? 0}
          icon="👥"
          color="bg-blue-100"
        />

        <StatCard
          title="إجمالي الفنيين"
          value={techniciansCount ?? 0}
          icon="🔧"
          color="bg-orange-100"
        />

        <StatCard
          title="طلبات شركات معلقة"
          value={pendingCompaniesCount ?? 0}
          icon="🏢"
          color="bg-yellow-100"
        />

        <StatCard
          title="إجمالي الإيرادات (ريال)"
          value={totalRevenue.toFixed(2)}
          icon="💰"
          color="bg-green-100"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">النشاط الأخير</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500 text-center py-8">
            سيتم عرض النشاط الأخير هنا قريباً...
          </p>
        </div>
      </div>
    </div>
  )
}
