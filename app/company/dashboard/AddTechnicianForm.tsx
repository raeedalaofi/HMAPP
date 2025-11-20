'use client'

import { addCompanyTechnician } from '@/app/actions'
import { useState } from 'react'

interface Category {
  id: number
  name: string
}

export default function AddTechnicianForm({ categories }: { categories: Category[] }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    await addCompanyTechnician(formData)
    // Note: If successful, the server action will redirect, so code won't reach here
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">➕ إضافة فني جديد</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            اسم الفني <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="أحمد محمد"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            رقم الجوال <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="05XXXXXXXX"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            البريد الإلكتروني <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="technician@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            كلمة المرور <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-500 mt-1">6 أحرف على الأقل</p>
        </div>

        {/* Specialty (Single Select) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            التخصص <span className="text-red-500">*</span>
          </label>
          <select
            name="categoryId"
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="">اختر التخصص</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            ⚠️ تخصص واحد فقط لكل فني
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'جاري الإضافة...' : '✓ إضافة الفني'}
        </button>
      </form>
    </div>
  )
}
