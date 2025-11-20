import { signupCustomer } from '@/app/login/actions'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">إنشاء حساب عميل جديد</h1>
        
        <form action={signupCustomer} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">الاسم الكامل</label>
            <input name="fullName" type="text" required className="w-full p-2 border rounded text-black" placeholder="محمد أحمد" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">رقم الجوال</label>
            <input name="phone" type="tel" required className="w-full p-2 border rounded text-black" placeholder="05xxxxxxxx" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني</label>
            <input name="email" type="email" required className="w-full p-2 border rounded text-black" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
            <input name="password" type="password" required className="w-full p-2 border rounded text-black" />
          </div>

          <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
            تسجيل حساب
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-500">
          لديك حساب بالفعل؟ <a href="/login" className="text-blue-600 underline">سجل دخول</a>
        </p>
      </div>
    </div>
  )
}
