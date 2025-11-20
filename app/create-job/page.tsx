"use client" // يجب تحويلها لـ Client Component للتعامل مع رفع الملفات وتفاعل الواجهة

import { createJob } from '@/app/actions'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function CreateJobPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('categoryId')
  const categoryName = searchParams.get('categoryName')
  
  const [loading, setLoading] = useState(false)

  // التعامل مع الإرسال لضمان ظهور حالة التحميل
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    // استدعاء السيرفر أكشن
    try {
      await createJob(formData)
      // (التوجيه يتم داخل الأكشن، لكن في حالة الخطأ نوقف التحميل)
    } catch (err) {
      // خطأ: إيقاف حالة التحميل وسيترك الرسائل على السيرفر
      console.error('createJob failed', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 mt-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">طلب خدمة جديدة</h1>
        <p className="text-gray-500 mb-6">
          القسم: <span className="font-bold text-blue-600">{categoryName || 'عام'}</span>
        </p>

        {/* Address Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            📍 سيتم إرسال الفني إلى عنوانك المسجل. يمكنك تحديثه من <a href="/profile" className="font-bold underline text-yellow-900 hover:text-yellow-700">ملفك الشخصي</a>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="categoryId" value={categoryId || ''} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المشكلة</label>
            <input name="title" type="text" required className="w-full p-3 border rounded-lg text-black" placeholder="مثال: تسريب مياه" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف التفصيلي</label>
            <textarea name="description" rows={3} className="w-full p-3 border rounded-lg text-black" placeholder="اشرح المشكلة..." />
          </div>

          {/* خانة الصور الجديدة */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">صور المشكلة (اختياري - بحد أقصى 3)</label>
            <input 
              type="file" 
              name="images" 
              accept="image/*" 
              multiple 
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            <p className="text-xs text-gray-400 mt-1">يساعد الفني على فهم المشكلة وتقدير السعر بدقة.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'جاري إرسال الطلب...' : '📤 إرسال وانتظار العروض'}
          </button>
          
          <Link href="/" className="block text-center text-gray-500 mt-4 text-sm hover:underline">إلغاء</Link>
        </form>
      </div>
    </div>
  )
}
