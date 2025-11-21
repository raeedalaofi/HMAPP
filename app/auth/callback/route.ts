import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
    }
    
    // ✅ نجح تبديل الكود، التوجيه للصفحة المطلوبة
    return NextResponse.redirect(`${origin}${next}`)
  }

  // في حال عدم وجود كود، التوجيه للصفحة المطلوبة مباشرة
  return NextResponse.redirect(`${origin}${next}`)
}
