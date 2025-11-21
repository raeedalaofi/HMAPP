import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Get customer info
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!customer) redirect('/signup')

  // Get wallet info
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance, hold_balance, currency')
    .eq('owner_type', 'customer')
    .eq('owner_id', customer.id)
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
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">محفظتي</h1>
          <p className="text-gray-600 mt-2">إدارة رصيدك ومعاملاتك المالية</p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-2">الرصيد الإجمالي</p>
            <p className="text-4xl font-bold mb-4">{currentBalance.toFixed(2)} <span className="text-xl">ريال</span></p>
            <Link 
              href="/wallet/top-up"
              className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
            >
              + شحن المحفظة
            </Link>
          </div>

          {/* Available Balance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">المتاح للاستخدام</p>
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

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">المعاملات الأخيرة</h2>
          
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">لا توجد معاملات بعد</p>
              <p className="text-sm text-gray-400 mt-2">قم بشحن محفظتك أو اطلب خدمة للبدء</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isCredit = tx.direction === 'credit'
                const txTypeLabels: Record<string, string> = {
                  top_up: 'شحن محفظة',
                  job_payment_hold: 'حجز دفعة وظيفة',
                  job_completion_payment: 'دفع إتمام وظيفة',
                  job_cancellation_refund: 'استرداد إلغاء وظيفة',
                  withdrawal: 'سحب رصيد',
                  admin_adjustment: 'تعديل إداري'
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
                            href={`/jobs/${tx.job_id}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {tx.jobs.title || `وظيفة #${tx.job_id.slice(0, 8)}`}
                          </Link>
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
                        الرصيد بعدها: {tx.balance_after.toFixed(2)} ريال
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">💡 نصائح استخدام المحفظة</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• يتم خصم المبلغ من محفظتك عند قبول عرض سعر من فني</li>
            <li>• المبلغ يُحجز حتى إتمام الوظيفة أو إلغائها</li>
            <li>• في حالة الإلغاء، يتم إرجاع المبلغ كاملاً لمحفظتك</li>
            <li>• تأكد من وجود رصيد كافٍ قبل قبول عرض السعر</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
