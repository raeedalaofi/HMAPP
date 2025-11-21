import { login, signup } from './actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        
        {/* الشعار والعنوان */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            أهلاً بك في منصة HMAPP للخدمات
          </p>
        </div>

        {/* رسالة الخطأ إن وجدت */}
        {params.error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded relative">
            <div className="flex items-start">
              <svg className="w-5 h-5 ml-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-sm">خطأ في تسجيل الدخول</p>
                <p className="text-sm mt-1">{decodeURIComponent(params.error)}</p>
                {params.error.includes('تأكيد بريدك') && (
                  <p className="text-xs mt-2 text-red-700">
                    💡 تحقق من بريدك الإلكتروني أو تواصل مع الإدارة لتفعيل حسابك
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* رسالة نجاح إن وجدت */}
        {params.message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center">
            <span className="block sm:inline">{params.message}</span>
          </div>
        )}

        {/* النموذج */}
        <form className="mt-8 space-y-6">
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                البريد الإلكتروني
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="البريد الإلكتروني (مثال: test@customer.com)"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-b-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="كلمة المرور"
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={login}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              دخول
            </button>
            
            <Link
              href="/signup"
              className="group relative flex w-full justify-center rounded-md bg-white px-3 py-3 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              حساب جديد
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
