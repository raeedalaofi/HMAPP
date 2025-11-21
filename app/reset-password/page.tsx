import { resetPassword } from './actions'
import Link from 'next/link'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">إعادة تعيين كلمة المرور</h1>
        <p className="text-center text-gray-600 mb-6 text-sm">
          أدخل كلمة المرور الجديدة لحسابك
        </p>

        {/* Error Message */}
        {(async () => {
          const params = await searchParams
          if (params.error) {
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">
                  {params.error === 'passwords_mismatch'
                    ? '⚠️ كلمات المرور غير متطابقة'
                    : params.error === 'weak_password'
                    ? '⚠️ كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل'
                    : '⚠️ حدث خطأ. يرجى المحاولة مرة أخرى'}
                </p>
              </div>
            )
          }
          return null
        })()}

        <form action={resetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md"
          >
            ✓ تحديث كلمة المرور
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-800">
            ← العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}
