import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { completeCompanyProfile } from '@/app/actions'
import Link from 'next/link'

export default async function CompleteCompanyProfilePage({
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

  // Check if company exists and profile is incomplete
  const { data: company } = await supabase
    .from('companies')
    .select('id, legal_name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!company) {
    redirect('/signup-company')
  }

  // If profile already complete, redirect to dashboard
  if (company.legal_name) {
    redirect('/company/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📋 إكمال بيانات الشركة</h1>
          <p className="text-gray-600">أدخل البيانات القانونية والمصرفية للشركة</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {params.error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{params.error}</p>
            </div>
          )}

          <form action={completeCompanyProfile} className="space-y-6">
            {/* Legal Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم القانوني للشركة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="legalName"
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="مثال: شركة الصيانة المتقدمة"
              />
            </div>

            {/* CR Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم السجل التجاري <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="crNumber"
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="مثال: 1234567890"
              />
            </div>

            {/* Contact Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الشخص المسؤول <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="أحمد محمد"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الصفة <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">اختر الصفة</option>
                  <option value="owner">مالك</option>
                  <option value="employee">موظف</option>
                </select>
              </div>
            </div>

            {/* Bank Details (Optional) */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">البيانات المصرفية (اختياري)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم البنك
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="مثال: البنك الأهلي"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الآيبان (IBAN)
                  </label>
                  <input
                    type="text"
                    name="iban"
                    className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="SA0000000000000000000000"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
              >
                ✓ حفظ والانتقال للوحة التحكم
              </button>
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
