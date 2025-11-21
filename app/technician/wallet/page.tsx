import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TechnicianWalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Get technician info
  const { data: technician } = await supabase
    .from('technicians')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!technician) redirect('/signup-technician')

  // Get wallet info
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance, hold_balance, currency')
    .eq('owner_type', 'technician')
    .eq('owner_id', technician.id)
    .eq('is_deleted', false)
    .maybeSingle()

  const currentBalance = wallet?.balance || 0
  const holdBalance = wallet?.hold_balance || 0
  const availableBalance = currentBalance - holdBalance

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select(`
      id,
      direction,
      amount,
      balance_after,
      tx_type,
      metadata,
      created_at,
      job_id,
      jobs (
        id,
        title
      )
    `)
    .eq('wallet_id', wallet?.id || '')
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/technician/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← العودة للوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">محفظتي</h1>
          <p className="text-gray-600 mt-2">إدارة أرباحك ومعاملاتك المالية</p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-2">الرصيد الإجمالي</p>
            <p className="text-4xl font-bold mb-4">{currentBalance.toFixed(2)} <span className="text-xl">ريال</span></p>
            <button 
              className="inline-block bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition opacity-50 cursor-not-allowed"
              disabled
              title="قريباً: سحب الأرباح"
            >
              💸 سحب الأرباح (قريباً)
            </button>
          </div>

          {/* Available Balance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">المتاح للسحب</p>
                <p className="text-3xl font-bold text-green-600">{availableBalance.toFixed(2)} <span className="text-lg">ريال</span></p>
              </div>
              {holdBalance > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">المبلغ المحجوز</p>
                  <p className="text-xl font-semibold text-orange-600">{holdBalance.toFixed(2)} ريال</p>
                  <p className="text-xs text-gray-500 mt-1">في وظائف جارية</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 ملخص الأرباح</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">أرباح هذا الشهر</p>
              <p className="text-2xl font-bold text-blue-600">
                {transactions
                  ?.filter((tx: any) => {
                    const txDate = new Date(tx.created_at)
                    const now = new Date()
                    return tx.direction === 'credit' && 
                           tx.tx_type === 'job_completion_payment' &&
                           txDate.getMonth() === now.getMonth() &&
                           txDate.getFullYear() === now.getFullYear()
                  })
                  .reduce((sum: number, tx: any) => sum + tx.amount, 0)
                  .toFixed(2)
                } ريال
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">إجمالي الأرباح</p>
              <p className="text-2xl font-bold text-green-600">
                {transactions
                  ?.filter((tx: any) => tx.direction === 'credit' && tx.tx_type === 'job_completion_payment')
                  .reduce((sum: number, tx: any) => sum + tx.amount, 0)
                  .toFixed(2)
                } ريال
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">عدد الوظائف المكتملة</p>
              <p className="text-2xl font-bold text-purple-600">
                {transactions?.filter((tx: any) => tx.tx_type === 'job_completion_payment').length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">المعاملات الأخيرة</h2>
          
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">لا توجد معاملات بعد</p>
              <p className="text-sm text-gray-400 mt-2">ابدأ بتقديم عروض على الوظائف المتاحة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isCredit = tx.direction === 'credit'
                const txTypeLabels: Record<string, string> = {
                  job_completion_payment: 'دفع إتمام وظيفة',
                  withdrawal: 'سحب أرباح',
                  admin_adjustment: 'تعديل إداري',
                  bonus: 'مكافأة',
                  penalty: 'غرامة'
                }
                
                return (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {isCredit ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {txTypeLabels[tx.tx_type] || tx.tx_type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {tx.job_id && tx.jobs && (
                          <Link 
                            href={`/technician/jobs/${tx.job_id}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {tx.jobs.title || `وظيفة #${tx.job_id.slice(0, 8)}`}
                          </Link>
                        )}
                        {/* Show commission info for job completion payments */}
                        {tx.tx_type === 'job_completion_payment' && tx.metadata?.total && (
                          <p className="text-xs text-gray-500 mt-1">
                            إجمالي الوظيفة: {tx.metadata.total} ريال | 
                            عمولة المنصة: {tx.metadata.commission} ريال (15%)
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        isCredit ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isCredit ? '+' : '-'}{tx.amount.toFixed(2)} ريال
                      </p>
                      <p className="text-xs text-gray-500">
                        الرصيد: {tx.balance_after.toFixed(2)} ريال
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">💡 كيف تعمل الأرباح؟</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• تحصل على 85% من قيمة كل وظيفة تنجزها</li>
            <li>• يتم تحويل المبلغ مباشرة لمحفظتك عند اكتمال الوظيفة</li>
            <li>• 15% عمولة المنصة تذهب لإدارة النظام والدعم</li>
            <li>• يمكنك سحب أرباحك في أي وقت (الخدمة قريباً)</li>
            <li>• جميع المعاملات موثقة ويمكنك مراجعتها في أي وقت</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
