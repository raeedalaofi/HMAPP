import { sendResetLink } from './actions'
import Link from 'next/link'

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">نسيت كلمة المرور؟</h1>
        <p className="text-center text-gray-600 mb-6 text-sm">
          أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
        </p>

        {/* Success Message */}
        {(async () => {
          const params = await searchParams
          if (params.success) {
            return (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700 text-sm">
                  ✓ تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.
                </p>
              </div>
            )
          }
          return null
        })()}

        {/* Error Message */}
        {(async () => {
          const params = await searchParams
          if (params.error) {
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">
                  {params.error === 'invalid_email' 
                    ? '⚠️ البريد الإلكتروني غير صحيح' 
                    : '⚠️ حدث خطأ. يرجى المحاولة مرة أخرى'}
                </p>
              </div>
            )
          }
          return null
        })()}

        <form action={sendResetLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="example@email.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
          >
            📧 إرسال رابط إعادة التعيين
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link href="/login" className="block text-sm text-blue-600 hover:underline">
            ← العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}
