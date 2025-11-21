import { createClient } from '@/utils/supabase/server'
import { Suspense } from 'react'
import SignupTechnicianContent from './SignupTechnicianContent'

interface Category {
  id: number
  name: string
}

export default async function SignupTechnicianPage() {
  const supabase = await createClient()
  
  // Fetch categories from database
  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name')
    .order('name')
  
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </main>
    }>
      <SignupTechnicianContent categories={categories || []} />
    </Suspense>
  )
}
