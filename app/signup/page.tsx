import { signupCustomer } from '@/app/login/actions'
import SubmitButton from '@/app/components/SubmitButton'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">إنشاء حساب عميل جديد</h1>
        
        {/* رسائل الخطأ أو النجاح */}
        {params.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            <span className="block sm:inline">{decodeURIComponent(params.error)}</span>
          </div>
        )}
        {params.success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center">
            <span className="block sm:inline">{decodeURIComponent(params.success)}</span>
          </div>
        )}

        <form action={signupCustomer} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">الاسم الكامل</label>
            <input name="fullName" type="text" required className="w-full p-2 border rounded text-black" placeholder="محمد أحمد" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">رقم الجوال</label>
            <input 
              name="phone" 
              type="tel" 
              required 
              pattern="05[0-9]{8}" 
              title="رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" 
              className="w-full p-2 border rounded text-black" 
              placeholder="05xxxxxxxx" 
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
            <input name="email" type="email" required className="w-full p-2 border rounded text-black" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
            <input name="password" type="password" required className="w-full p-2 border rounded text-black" />
          </div>

          <SubmitButton text="تسجيل حساب جديد" loadingText="جاري إنشاء الحساب..." />
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-500">
          لديك حساب بالفعل؟ <a href="/login" className="text-blue-600 underline">سجل دخول</a>
        </p>
      </div>
    </div>
  )
}
