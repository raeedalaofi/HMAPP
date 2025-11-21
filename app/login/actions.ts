'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // استلام البيانات من الواجهة
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('🔐 Login attempt for:', email)

  // محاولة تسجيل الدخول
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('❌ Login Error:', error)
    // عرض رسالة خطأ أكثر تفصيلاً
    const errorMessage = error.message === 'Invalid login credentials' 
      ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      : error.message === 'Email not confirmed'
      ? 'يرجى تأكيد بريدك الإلكتروني أولاً'
      : error.message.includes('Email')
      ? 'خطأ في البريد الإلكتروني: ' + error.message
      : 'فشل تسجيل الدخول: ' + error.message
    
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  console.log('✅ Login successful for:', data.user?.email)
  console.log('🔑 Session:', data.session?.access_token ? 'Created' : 'Missing')

  // في حال النجاح، تحديث الكاش والتوجيه للرئيسية
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.log('Signup Error:', error.message)
    return redirect('/login?error=Could not create user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signupCustomer(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  // 1. إنشاء مستخدم Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    console.error(authError)
    return redirect('/signup?error=auth_failed')
  }

  if (authData && authData.user) {
    const user = authData.user
    // 2. إنشاء ملف العميل فوراً في جدول customers
    const { data: created, error: profileError } = await supabase.from('customers').insert({
      user_id: user.id,
      full_name: fullName,
      phone: phone,
      is_active: true
    }).select('id').single()

    if (profileError) console.error('Profile Error:', profileError)

    // 3. إنشاء محفظة فارغة له (محاولة استخدام owner_type/owner_id)
    try {
      const ownerId = created?.id
      if (ownerId) {
        await supabase.from('wallets').insert({
          owner_type: 'customer',
          owner_id: ownerId
        })
      }
    } catch (err) {
      console.error('Failed to create wallet during signup:', err)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
