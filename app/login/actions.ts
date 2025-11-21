'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // استلام البيانات من الواجهة
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?error=' + encodeURIComponent('يرجى إدخال البريد الإلكتروني وكلمة المرور'))
  }

  console.log('🔐 Login attempt for:', email)

  // محاولة تسجيل الدخول
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  })

  if (error) {
    console.error('❌ Login Error:', {
      message: error.message,
      status: error.status,
      name: error.name
    })
    
    // عرض رسالة خطأ أكثر تفصيلاً
    let errorMessage = 'فشل تسجيل الدخول'
    
    if (error.message === 'Invalid login credentials') {
      errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    } else if (error.message === 'Email not confirmed' || error.message.includes('email_not_confirmed')) {
      errorMessage = '⚠️ يجب تأكيد بريدك الإلكتروني أولاً. تحقق من بريدك الإلكتروني أو تواصل مع الإدارة'
    } else if (error.message.includes('Email')) {
      errorMessage = 'خطأ في البريد الإلكتروني: ' + error.message
    } else if (error.status === 400) {
      errorMessage = 'البيانات المدخلة غير صحيحة'
    } else {
      errorMessage = error.message
    }
    
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  if (!data.session) {
    console.error('❌ No session created after login')
    return redirect('/login?error=' + encodeURIComponent('فشل إنشاء الجلسة، حاول مرة أخرى'))
  }

  console.log('✅ Login successful for:', data.user?.email)
  console.log('🔑 Session created:', !!data.session.access_token)

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
  const { createAdminClient } = await import('@/utils/supabase/server')
  const adminClient = await createAdminClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  // تحقق من البيانات المطلوبة
  if (!email || !password || !fullName || !phone) {
    return redirect('/signup?error=' + encodeURIComponent('جميع الحقول مطلوبة'))
  }

  // 1. إنشاء مستخدم Auth مع تأكيد تلقائي باستخدام Admin API
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true,  // ✅ تأكيد تلقائي
    user_metadata: {
      full_name: fullName,
      phone: phone,
      role: 'customer'
    }
  })

  if (authError) {
    console.error('Signup Auth Error:', authError)
    const errorMessage = authError.message === 'User already registered'
      ? 'البريد الإلكتروني مسجل مسبقاً'
      : authError.message === 'Password should be at least 6 characters'
      ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      : 'فشل التسجيل: ' + authError.message
    
    return redirect('/signup?error=' + encodeURIComponent(errorMessage))
  }

  if (authData && authData.user) {
    const user = authData.user
    console.log('✅ User created and confirmed:', user.email)
    
    // 2. إنشاء ملف العميل فوراً في جدول customers باستخدام admin client
    const { data: created, error: profileError } = await adminClient.from('customers').insert({
      user_id: user.id,
      full_name: fullName,
      phone: phone,
      is_active: true
    }).select('id').single()

    if (profileError) {
      console.error('Profile Creation Error:', profileError)
      return redirect('/signup?error=' + encodeURIComponent('فشل إنشاء ملف العميل'))
    }

    console.log('Customer profile created:', created.id)

    // 3. إنشاء محفظة فارغة له
    try {
      const ownerId = created?.id
      if (ownerId) {
        const { error: walletError } = await adminClient.from('wallets').insert({
          owner_type: 'customer',
          owner_id: ownerId,
          balance: 0,
          currency: 'SAR'
        })
        
        if (walletError) {
          console.error('Wallet creation error:', walletError)
          // لا نوقف العملية، المحفظة يمكن إنشاؤها لاحقاً
        } else {
          console.log('Wallet created for customer:', ownerId)
        }
      }
    } catch (err) {
      console.error('Failed to create wallet during signup:', err)
    }
  }

  console.log('✅ Customer signup completed - user can login immediately')
  return redirect('/login?message=' + encodeURIComponent('تم إنشاء حسابك بنجاح! يمكنك تسجيل الدخول الآن'))
}
