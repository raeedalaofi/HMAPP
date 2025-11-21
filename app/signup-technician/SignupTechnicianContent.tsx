'use client'

import { useState } from 'react'
import { signupTechnician } from '@/app/actions'
import { useSearchParams } from 'next/navigation'
import SubmitButton from '@/app/components/SubmitButton'

interface Category {
  id: number
  name: string
}

interface SignupTechnicianContentProps {
  categories: Category[]
}

export default function SignupTechnicianContent({ categories }: SignupTechnicianContentProps) {
  const searchParams = useSearchParams()
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [error, setError] = useState<string | null>(searchParams.get('error') || null)

  const handleSkillToggle = (categoryId: number) => {
    setSelectedSkills(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validate at least one skill selected
    if (selectedSkills.length === 0) {
      setError('يجب اختيار مهارة واحدة على الأقل')
      return
    }

    const formData = new FormData(e.currentTarget)
    // Add selected skills to formData
    selectedSkills.forEach(skillId => {
      formData.append('skills', skillId.toString())
    })

    await signupTechnician(formData)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔧 انضم كفني</h1>
          <p className="text-gray-600">سجل حسابك كفني واحصل على فرص عمل</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                name="fullName"
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الجوال
              </label>
              <input
                type="tel"
                name="phone"
                required
                pattern="05[0-9]{8}"
                title="رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="05xxxxxxxx"
              />
            </div>

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
                placeholder="example@email.com"
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
                placeholder="أدخل كلمة مرور قوية"
              />
            </div>

            {/* Skills Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                المهارات والخدمات (اختر واحدة على الأقل)
              </label>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {categories.length === 0 ? (
                  <p className="text-gray-500">لا توجد فئات متاحة</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(category.id)}
                          onChange={() => handleSkillToggle(category.id)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <span className="text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedSkills.length > 0 && (
                  <p className="text-sm text-green-600 mt-3">
                    ✓ تم اختيار {selectedSkills.length} مهارة
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <SubmitButton text="✓ إنشاء حسابي" loadingText="⏳ جاري التسجيل..." />

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              لديك حساب بالفعل؟{' '}
              <a href="/login?role=technician" className="text-blue-600 hover:underline font-medium">
                تسجيل الدخول
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
