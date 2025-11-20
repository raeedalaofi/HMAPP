import { createClient } from '@/utils/supabase/server'
import { approveCompany, rejectCompany } from './actions'

interface Company {
  id: number
  name: string
  legal_name: string | null
  cr_number: string | null
  contact_person_name: string | null
  contact_person_role: string | null
  is_active: boolean
  created_at: string
}

function ApproveButton({ companyId }: { companyId: number }) {
  return (
    <form action={approveCompany.bind(null, companyId)}>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
      >
        ✅ قبول
      </button>
    </form>
  )
}

function RejectButton({ companyId }: { companyId: number }) {
  return (
    <form action={rejectCompany.bind(null, companyId)}>
      <button
        type="submit"
        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
      >
        ❌ رفض
      </button>
    </form>
  )
}

export default async function CompanyApprovalsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string }
}) {
  const supabase = await createClient()

  // Fetch companies pending approval (is_active = false or legal_name is null)
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .or('is_active.eq.false,legal_name.is.null')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">توثيق الشركات</h1>
        <p className="text-gray-500">مراجعة وقبول الشركات الجديدة</p>
      </div>

      {/* Success/Error Messages */}
      {searchParams.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 text-sm">
            {searchParams.success === 'company_approved' && '✅ تم قبول الشركة بنجاح'}
            {searchParams.success === 'company_rejected' && '✅ تم رفض الشركة بنجاح'}
          </p>
        </div>
      )}

      {searchParams.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{searchParams.error}</p>
        </div>
      )}

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-600">
            <p>حدث خطأ أثناء تحميل البيانات</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        ) : !companies || companies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">✅ لا توجد شركات تحتاج للمراجعة</p>
            <p className="text-sm mt-2">جميع الشركات تم توثيقها</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الشركة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    السجل التجاري
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الشخص المسؤول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنصب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ التسجيل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company: Company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {company.legal_name || company.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {company.cr_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {company.contact_person_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {company.contact_person_role || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(company.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.legal_name ? (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          company.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {company.is_active ? 'موثق' : 'قيد المراجعة'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          غير مكتمل
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {company.legal_name && !company.is_active ? (
                          <>
                            <ApproveButton companyId={company.id} />
                            <RejectButton companyId={company.id} />
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            {company.legal_name ? 'تم التوثيق' : 'في انتظار إكمال البيانات'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
