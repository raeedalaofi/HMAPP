import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  
  // Security Check
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !adminUser) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 fixed h-screen right-0 top-16">
        <nav className="p-6 space-y-2">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800">لوحة الإدارة</h2>
            <p className="text-sm text-gray-500">مرحباً، {user.email}</p>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
          >
            <span className="text-xl">📊</span>
            نظرة عامة
          </Link>

          <Link
            href="/admin/approvals"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
          >
            <span className="text-xl">🏢</span>
            توثيق الشركات
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
          >
            <span className="text-xl">👥</span>
            المستخدمين
          </Link>

          <Link
            href="/admin/transactions"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
          >
            <span className="text-xl">💰</span>
            العمليات المالية
          </Link>

          <div className="pt-6 mt-6 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-700 rounded-lg transition-colors text-sm"
            >
              <span className="text-lg">←</span>
              العودة للموقع
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-64 p-8">
        {children}
      </main>
    </div>
  )
}
