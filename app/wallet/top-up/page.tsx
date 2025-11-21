import { topUpWallet } from './actions'
import SubmitButton from '@/app/components/SubmitButton'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TopUpWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const params = await searchParams

  // Get customer and wallet info
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!customer) redirect('/signup')

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, currency')
    .eq('customer_id', customer.id)
    .maybeSingle()

  const currentBalance = wallet?.balance || 0

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">شحن المحفظة</h1>
          <p className="text-gray-600 mt-2">أضف رصيد إلى محفظتك لطلب الخدمات</p>
        </div>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <p className="text-sm opacity-90 mb-2">رصيدك الحالي</p>
          <p className="text-5xl font-bold">{currentBalance.toFixed(2)} <span className="text-2xl">ريال</span></p>
        </div>

        {/* Success Message */}
        {params.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              ✓ تم شحن المحفظة بنجاح! الرصيد الجديد: {params.success} ريال
            </p>
          </div>
        )}

        {/* Error Message */}
        {params.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">
              {params.error === 'invalid_amount' 
                ? '⚠️ المبلغ غير صحيح. يجب أن يكون بين 50 و 10,000 ريال'
                : params.error === 'payment_failed'
                ? '⚠️ فشلت عملية الدفع. يرجى المحاولة مرة أخرى'
                : '⚠️ حدث خطأ. يرجى المحاولة مرة أخرى'}
            </p>
          </div>
        )}

        {/* Top-Up Form */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">اختر المبلغ</h2>

          <form action={topUpWallet} className="space-y-6">
            {/* Preset Amounts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[50, 100, 200, 500].map((amount) => (
                <label
                  key={amount}
                  className="relative cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="amount"
                    value={amount}
                    className="peer sr-only"
                    required
                  />
                  <div className="border-2 border-gray-200 rounded-lg p-4 text-center transition-all peer-checked:border-blue-600 peer-checked:bg-blue-50 group-hover:border-blue-300">
                    <p className="text-2xl font-bold text-gray-800">{amount}</p>
                    <p className="text-sm text-gray-600">ريال</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                أو أدخل مبلغاً مخصصاً (50 - 10,000 ريال)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="customAmount"
                  min="50"
                  max="10000"
                  step="10"
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="أدخل المبلغ"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ريال
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * المبلغ المخصص سيتجاوز الاختيار المسبق
              </p>
            </div>

            {/* Payment Method Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">💳 طريقة الدفع</h3>
              <p className="text-sm text-gray-700 mb-3">
                سيتم تحويلك لبوابة الدفع الآمنة لإتمام العملية
              </p>
              <div className="flex gap-2 items-center text-xs text-gray-600">
                <span>✓ مدعوم:</span>
                <span className="px-2 py-1 bg-white rounded">مدى</span>
                <span className="px-2 py-1 bg-white rounded">Visa</span>
                <span className="px-2 py-1 bg-white rounded">Mastercard</span>
                <span className="px-2 py-1 bg-white rounded">Apple Pay</span>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="acceptTerms"
                required
                className="mt-1"
              />
              <label className="text-sm text-gray-600">
                أوافق على{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  الشروط والأحكام
                </Link>
                {' '}وسياسة{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  الخصوصية
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <SubmitButton 
              text="💳 متابعة للدفع" 
              loadingText="جاري التحويل..." 
            />
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>جميع المعاملات مشفرة ومؤمنة بأعلى معايير الحماية</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
