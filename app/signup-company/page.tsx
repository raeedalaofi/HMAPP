'use client'

import { signupCompanyInitial } from '@/app/actions'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { Suspense } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'جاري التسجيل...' : '📝 التالي: إكمال البيانات'}
    </button>
  )
}

function SignupCompanyContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏢 تسجيل شركة</h1>
          <p className="text-gray-600">سجل شركتك للبدء في إدارة الفنيين والطلبات</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form action={signupCompanyInitial} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="company@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">6 أحرف على الأقل</p>
            </div>

            {/* Submit Button */}
            <SubmitButton />
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              لديك حساب؟{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                تسجيل الدخول
              </Link>
            </p>
            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
              ← العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SignupCompanyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center text-gray-600">جاري التحميل...</div>
      </main>
    }>
      <SignupCompanyContent />
    </Suspense>
  )
}
