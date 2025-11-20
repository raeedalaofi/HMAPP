import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AddTechnicianForm from './AddTechnicianForm'

export default async function CompanyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get company info
  const { data: company } = await supabase
    .from('companies')
    .select('id, legal_name, cr_number, contact_person_name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!company) {
    redirect('/signup-company')
  }

  // If profile not complete, redirect to complete profile
  if (!company.legal_name) {
    redirect('/company/complete-profile')
  }

  // Fetch company technicians
  const { data: technicians } = await supabase
    .from('technicians')
    .select(`
      id,
      full_name,
      phone,
      is_active,
      created_at,
      technician_skills (
        service_categories (name)
      )
    `)
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  // Fetch categories for add form
  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🏢 لوحة تحكم الشركة</h1>
            <p className="text-gray-600">{company.legal_name}</p>
            <p className="text-sm text-gray-500">س.ت: {company.cr_number}</p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← الرئيسية
          </Link>
        </div>

        {/* Messages */}
        {params.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{params.error}</p>
          </div>
        )}
        {params.success === 'technician_added' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm">✓ تم إضافة الفني بنجاح</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Technicians List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Info Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📊 معلومات الشركة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الاسم القانوني</p>
                  <p className="font-semibold text-gray-800">{company.legal_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">رقم السجل التجاري</p>
                  <p className="font-semibold text-gray-800">{company.cr_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الشخص المسؤول</p>
                  <p className="font-semibold text-gray-800">{company.contact_person_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">عدد الفنيين</p>
                  <p className="font-semibold text-gray-800">{technicians?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Technicians List */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">👷 الفنيون</h2>
              
              {!technicians || technicians.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">لا يوجد فنيون بعد</p>
                  <p className="text-sm text-gray-400">استخدم النموذج لإضافة فني جديد ←</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {technicians.map((tech) => {
                    const skillData = tech.technician_skills?.[0] as { service_categories?: { name?: string } } | undefined
                    const specialty = skillData?.service_categories?.name || 'غير محدد'
                    return (
                      <div
                        key={tech.id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 mb-1">{tech.full_name}</h3>
                            <p className="text-sm text-gray-600 mb-2">📱 {tech.phone}</p>
                            <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                              {specialty}
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                tech.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {tech.is_active ? '✓ نشط' : '✗ غير نشط'}
                            </span>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(tech.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Add Technician Form */}
          <div>
            <AddTechnicianForm categories={categories || []} />
          </div>
        </div>
      </div>
    </main>
  )
}
