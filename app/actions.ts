'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function saveCustomerAddress(formData: FormData) {
  'use server'
  const supabase = await createClient()
  
  // 1. Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let errorMessage: string | null = null

  try {
    // 2. Get customer record
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (custErr || !customer) {
      console.error('Failed to fetch customer:', custErr)
      throw new Error('فشل في العثور على ملف العميل')
    }

    // 3. Extract address data
    const latitude = parseFloat(formData.get('latitude') as string)
    const longitude = parseFloat(formData.get('longitude') as string)
    const label = formData.get('label') as string

    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      throw new Error('يجب تحديد الموقع على الخريطة')
    }

    // 4. Convert to PostGIS POINT format: POINT(lng lat)
    const geoPoint = `POINT(${longitude} ${latitude})`

    // 5. Upsert address (update if exists with is_default=true, else insert)
    const { error: upsertErr } = await supabase
      .from('customer_addresses')
      .upsert(
        {
          customer_id: customer.id,
          label: label || 'المنزل',
          address_text: label || 'المنزل',
          location: geoPoint,
          is_default: true
        },
        {
          onConflict: 'customer_id,is_default'
        }
      )

    if (upsertErr) {
      console.error('Failed to save address:', upsertErr)
      throw new Error('فشل في حفظ العنوان')
    }
  } catch (err) {
    console.error('Error in saveCustomerAddress:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ العنوان'
  }

  // ✅ خارج try/catch: redirect و revalidatePath يعملان بشكل صحيح
  revalidatePath('/profile')
  revalidatePath('/create-job')
  
  if (errorMessage) {
    redirect(`/profile?error=${encodeURIComponent(errorMessage)}`)
  }
  
  redirect('/profile?success=address_saved')
}

export async function updateCustomerProfile(formData: FormData) {
  'use server'
  const supabase = await createClient()

  // 1. Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let errorMessage: string | null = null

  try {
    // 2. Extract form data
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string

    if (!fullName || !fullName.trim()) {
      throw new Error('الاسم الكامل مطلوب')
    }

    if (!phone || !phone.trim()) {
      throw new Error('رقم الجوال مطلوب')
    }

    // 3. Get customer record
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (custErr || !customer) {
      console.error('Failed to fetch customer:', custErr)
      throw new Error('فشل في العثور على ملف العميل')
    }

    // 4. Update customer profile
    const { error: updateErr } = await supabase
      .from('customers')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim()
      })
      .eq('id', customer.id)

    if (updateErr) {
      console.error('Failed to update customer:', updateErr)
      throw new Error('فشل في تحديث البيانات الشخصية')
    }
  } catch (err) {
    console.error('Error in updateCustomerProfile:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث البيانات'
  }

  // ✅ خارج try/catch: redirect و revalidatePath يعملان بشكل صحيح
  revalidatePath('/profile')
  
  if (errorMessage) {
    redirect(`/profile?error=${encodeURIComponent(errorMessage)}`)
  }
  
  redirect('/profile?success=profile_updated')
}

export async function createJob(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Extract form data
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const categoryId = formData.get('categoryId') as string

  let errorMessage: string | null = null

  try {
    // 3. Get or create customer
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!customer) {
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({ user_id: user.id, full_name: 'عميل جديد' })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Failed to create customer:', createError)
        throw new Error('فشل في إنشاء ملف العميل')
      }
      customer = newCustomer
    }

    // 4. Fetch existing default address (must already exist)
    const { data: address, error: addrErr } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customer!.id)
      .eq('is_default', true)
      .maybeSingle()

    if (addrErr) {
      console.error('Error fetching address:', addrErr)
      throw new Error('فشل في جلب العنوان')
    }

    if (!address) {
      console.error('No default address found for customer')
      return redirect('/profile?error=no_address')
    }

    // 5. Create the job using the default address
    const { data: job, error: jobError } = await supabase.from('jobs').insert({
      customer_id: customer!.id,
      category_id: parseInt(categoryId),
      address_id: address.id,
      title: title,
      description: description,
      total_price: null,
      status: 'waiting_for_offers',
      requested_time: new Date().toISOString()
    })
    .select('id')
    .single()

    if (jobError) {
      console.error('Failed to create job:', jobError)
      throw new Error('فشل في إنشاء الطلب')
    }

    // 6. Process images (up to 3)
    const images = formData.getAll('images') as File[]
    if (images && images.length > 0) {
      let count = 0
      for (const img of images) {
        if (!img || !img.size) continue
        if (count >= 3) break
        count++

        const fileExt = img.name.split('.').pop() || 'jpg'
        const fileName = `${job!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

        // upload to bucket 'job-photos'
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(fileName, img)

        if (uploadError) {
          console.error('Failed to upload image:', uploadError)
          continue
        }

        // get public url
        const { data: { publicUrl } } = supabase.storage
          .from('job-photos')
          .getPublicUrl(fileName)

        // save photo record
        const { error: photoErr } = await supabase.from('job_photos').insert({
          job_id: job!.id,
          url: publicUrl,
          is_before: true
        })

        if (photoErr) console.error('Failed to save job_photo row:', photoErr)
      }
    }
  } catch (err) {
    console.error('Error in createJob:', err)
    errorMessage = 'job_creation_failed'
  }

  // ✅ Move revalidate and redirect outside try/catch
  revalidatePath('/')
  
  if (errorMessage) {
    redirect(`/?error=${errorMessage}`)
  }
  
  redirect('/')
}

export async function cancelJobAction(jobId: string, userId: string) {
  'use server'

  const supabase = await createClient()

  try {
    // Verify job exists and belongs to the requesting user (as customer)
    const { data: existingJob, error: jobErr } = await supabase
      .from('jobs')
      .select('id, customer_id, status')
      .eq('id', jobId)
      .maybeSingle()

    if (jobErr) {
      console.error('Error checking job existence:', jobErr)
      throw new Error('فشل في التحقق من حالة الطلب')
    }

    if (!existingJob) {
      console.error('Failed to cancel job: job not found', { jobId })
      return { success: false, message: 'لم يتم العثور على الطلب' }
    }

    // Ensure the user is the owner of the job (customer_id)
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (custErr) {
      console.error('Error fetching customer record:', custErr)
      throw new Error('فشل في التحقق من صاحب الطلب')
    }

    if (!customer || customer.id !== existingJob.customer_id) {
      console.error('Unauthorized cancel attempt', { userId, jobId, jobCustomer: existingJob.customer_id })
      return { success: false, message: 'غير مصرح لك بإلغاء هذا الطلب' }
    }

    // Job must be cancelable (e.g., pending)
    if (existingJob.status !== 'pending') {
      return { success: false, message: 'لا يمكن إلغاء الطلب حالياً' }
    }

    // Ensure wallet exists for this customer (RPC expects a wallet)
    const { data: walletData, error: walletErr } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('customer_id', customer.id)
      .maybeSingle()

    if (walletErr) {
      // Log full error for debugging (could be RLS/permission issue)
      console.error('Error checking wallet:', walletErr)
      return { success: false, message: 'فشل في التحقق من المحفظة', details: walletErr }
    }

    if (!walletData) {
      // Create an empty wallet so the refund RPC can find it
      const { error: createWalletErr } = await supabase
        .from('wallets')
        .insert({ customer_id: customer.id, balance: 0, currency: 'SAR' })
        .select('id')
        .maybeSingle()

      if (createWalletErr) {
        console.error('Failed to create wallet for refund:', createWalletErr)
        return { success: false, message: 'فشل في إعداد المحفظة لاسترجاع المبلغ', details: createWalletErr }
      }
    }

    // Call the RPC function to cancel job and refund
    const { error } = await supabase.rpc('cancel_job_and_refund', {
      p_job_id: jobId,
      p_user_id: userId
    })

    if (error) {
      console.error('Failed to cancel job:', error)
      return { success: false, message: error.message || 'فشل في إلغاء الطلب' }
    }

    // Revalidate the dashboard and job details pages
    revalidatePath('/')
    revalidatePath(`/jobs/${jobId}`)

    return { success: true, message: 'تم إلغاء الطلب بنجاح' }
  } catch (err) {
    console.error('Error in cancelJobAction:', err)
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'حدث خطأ أثناء إلغاء الطلب' 
    }
  }
}

export async function acceptOfferAction(offerId: string) {
  'use server'
  const supabase = await createClient()

  try {
    // 1. Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً' }
    }

    // 2. Call the RPC function accept_price_offer
    const { error } = await supabase.rpc('accept_price_offer', {
      p_offer_id: offerId,
      p_customer_user_id: user.id
    })

    if (error) {
      console.error('Failed to accept offer:', error)
      return { 
        success: false, 
        message: error.message || 'فشل في قبول العرض' 
      }
    }

    // 3. Revalidate paths
    revalidatePath('/')
    revalidatePath('/jobs')
    
    return { success: true, message: 'تم قبول العرض بنجاح' }
  } catch (err) {
    console.error('Error in acceptOfferAction:', err)
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'حدث خطأ أثناء قبول العرض' 
    }
  }
}

export async function signupTechnician(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  let errorMessage: string | null = null

  try {
    // 1. Extract form data
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const skillsArray = formData.getAll('skills') as string[]

    // Validate required fields
    if (!fullName || !phone || !email || !password) {
      throw new Error('جميع الحقول مطلوبة')
    }

    if (skillsArray.length === 0) {
      throw new Error('يجب اختيار مهارة واحدة على الأقل')
    }

    // 2. Create auth user via admin client to guarantee availability before inserts
    const { data: adminUser, error: adminError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        role: 'technician',
        full_name: fullName.trim(),
        phone: phone.trim()
      }
    })

    if (adminError) {
      console.error('Failed to create auth user:', adminError)
      throw new Error(adminError.message || 'فشل إنشاء حساب المستخدم')
    }

    const userId = adminUser.user?.id

    if (!userId) {
      throw new Error('فشل إنشاء حساب المستخدم')
    }

    // 3. Sign in the new user so their session cookie is set for the browser
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim()
    })

    if (signInError) {
      console.error('Auto sign-in failed:', signInError)
      throw new Error('تم إنشاء الحساب لكن فشل تسجيل الدخول التلقائي، حاول تسجيل الدخول يدوياً')
    }

    // 4. Create technician profile using admin client (to bypass RLS)
    let technicianData: { id: string } | null = null
    
    const { data: insertData, error: techError } = await adminClient
      .from('technicians')
      .insert({
        user_id: userId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        is_active: true
      })
      .select('id')
      .single()

    if (techError) {
      console.error('Failed to create technician profile:', techError)
      console.error('Error details:', JSON.stringify(techError))
      
      // Try to fetch if it was created despite error
      const { data: fetchedTech } = await adminClient
        .from('technicians')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (!fetchedTech) {
        throw new Error(`فشل في إنشاء ملف الفني: ${techError.message || 'خطأ غير معروف'}`)
      }
      technicianData = fetchedTech
    } else {
      technicianData = insertData
    }

    const technicianId = technicianData.id

    // 5. Create wallet for technician using admin client
    const { error: walletError } = await adminClient.from('wallets').insert({
      owner_type: 'technician',
      owner_id: technicianId,
      balance: 0,
      currency: 'SAR'
    })

    if (walletError) {
      console.error('Failed to create wallet:', walletError)
      console.error('Wallet error details:', JSON.stringify(walletError))
      throw new Error(`فشل في إنشاء المحفظة: ${walletError.message}`)
    }

    // 6. Insert technician skills using admin client
    const skillIds = skillsArray.map(s => parseInt(s, 10)).filter(id => !isNaN(id))
    
    if (skillIds.length > 0) {
      const skillRecords = skillIds.map(categoryId => ({
        technician_id: technicianId,
        category_id: categoryId
      }))

      const { error: skillError } = await adminClient
        .from('technician_skills')
        .insert(skillRecords)

      if (skillError) {
        console.error('Failed to insert skills:', skillError)
        console.error('Skill error details:', JSON.stringify(skillError))
        throw new Error(`فشل في حفظ المهارات: ${skillError.message}`)
      }
    }
  } catch (err) {
    console.error('Error in signupTechnician:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء التسجيل'
  }

  // ✅ نقل redirect و revalidate خارج try/catch لتجنب خطأ NEXT_REDIRECT
  revalidatePath('/')
  
  if (errorMessage) {
    redirect(`/signup-technician?error=${encodeURIComponent(errorMessage)}`)
  }
  
  redirect('/?success=technician_registered')
}

export async function submitOffer(formData: FormData) {
  'use server'
  const supabase = await createClient()

  try {
    // 1. Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }

    // 2. Get technician ID
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (techError || !technician) {
      throw new Error('لم يتم العثور على ملف الفني')
    }

    // 3. Extract form data
    const jobId = formData.get('jobId') as string
    const amount = parseFloat(formData.get('amount') as string)
    const message = formData.get('message') as string

    if (!jobId || isNaN(amount) || amount <= 0) {
      throw new Error('البيانات غير صحيحة')
    }

    // 4. Check if offer already exists
    const { data: existingOffer } = await supabase
      .from('price_offers')
      .select('id')
      .eq('job_id', jobId)
      .eq('technician_id', technician.id)
      .maybeSingle()

    if (existingOffer) {
      throw new Error('لقد أرسلت عرضاً لهذا الطلب بالفعل')
    }

    // 5. Insert offer
    const { error: offerError } = await supabase.from('price_offers').insert({
      job_id: jobId,
      technician_id: technician.id,
      price: amount,
      message: message || '',
      status: 'pending'
    })

    if (offerError) {
      console.error('Failed to submit offer:', offerError)
      throw new Error('فشل في إرسال العرض')
    }

    // 6. Revalidate job page
    revalidatePath(`/technician/jobs/${jobId}`)
    revalidatePath('/')

    return { success: true, message: 'تم إرسال العرض بنجاح' }
  } catch (err) {
    console.error('Error in submitOffer:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال العرض'
    }
  }
}

// ============================================
// COMPANY WORKFLOW ACTIONS
// ============================================

export async function signupCompanyInitial(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  let errorMessage: string | null = null

  try {
    if (!email || !password) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان')
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          role: 'company'
        }
      }
    })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('فشل إنشاء الحساب')
    }

    // Create empty company record (legal_name will be null until profile completion)
    const adminClient = await createAdminClient()
    const { error: companyError } = await adminClient
      .from('companies')
      .insert({
        owner_id: authData.user.id,
        name: 'شركة جديدة', // Temporary name until profile completion
        legal_name: null,
        is_active: true
      })

    if (companyError) {
      console.error('Failed to create company record:', companyError)
      throw new Error('فشل في إنشاء ملف الشركة')
    }
  } catch (err) {
    console.error('Error in signupCompanyInitial:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء التسجيل'
  }

  revalidatePath('/')

  if (errorMessage) {
    redirect(`/signup-company?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect('/company/complete-profile')
}

export async function completeCompanyProfile(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  let errorMessage: string | null = null

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }

    // Extract form data
    const legalName = formData.get('legalName') as string
    const crNumber = formData.get('crNumber') as string
    const contactPersonName = formData.get('contactPersonName') as string
    const role = formData.get('role') as string
    const bankName = formData.get('bankName') as string
    const iban = formData.get('iban') as string

    if (!legalName || !crNumber || !contactPersonName || !role) {
      throw new Error('جميع الحقول المطلوبة يجب تعبئتها')
    }

    // Get company record
    const { data: company, error: companyFetchError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (companyFetchError || !company) {
      throw new Error('فشل في العثور على ملف الشركة')
    }

    // Update company profile using admin client
    const { error: updateError } = await adminClient
      .from('companies')
      .update({
        name: legalName.trim(), // Update name with legal name
        legal_name: legalName.trim(),
        cr_number: crNumber.trim(),
        contact_person_name: contactPersonName.trim(),
        contact_person_role: role.trim(),
        bank_name: bankName?.trim() || null,
        iban: iban?.trim() || null
      })
      .eq('id', company.id)

    if (updateError) {
      console.error('Failed to update company:', updateError)
      throw new Error('فشل في تحديث بيانات الشركة')
    }

    // Create wallet if not exists
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('owner_type', 'company')
      .eq('owner_id', company.id)
      .maybeSingle()

    if (!existingWallet) {
      const { error: walletError } = await adminClient
        .from('wallets')
        .insert({
          owner_type: 'company',
          owner_id: company.id,
          balance: 0,
          currency: 'SAR'
        })

      if (walletError) {
        console.error('Failed to create wallet:', walletError)
        throw new Error('فشل في إنشاء المحفظة')
      }
    }
  } catch (err) {
    console.error('Error in completeCompanyProfile:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إكمال الملف'
  }

  revalidatePath('/')
  revalidatePath('/company/complete-profile')

  if (errorMessage) {
    redirect(`/company/complete-profile?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect('/company/dashboard')
}

export async function addCompanyTechnician(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  let errorMessage: string | null = null

  try {
    // Get current user (company owner)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }

    // Get company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, legal_name')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (companyError || !company || !company.legal_name) {
      throw new Error('يجب إكمال ملف الشركة أولاً')
    }

    // Extract form data
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const categoryId = formData.get('categoryId') as string

    if (!fullName || !phone || !email || !password || !categoryId) {
      throw new Error('جميع الحقول مطلوبة')
    }

    // Create auth user for the technician with admin client
    const { data: techUser, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        role: 'company_technician',
        full_name: fullName.trim(),
        phone: phone.trim(),
        company_id: company.id
      }
    })

    if (authError || !techUser.user) {
      console.error('Failed to create auth user:', authError)
      throw new Error(authError?.message || 'فشل في إنشاء حساب الفني')
    }

    // Create technician record with company_id
    const { data: technician, error: techError } = await adminClient
      .from('technicians')
      .insert({
        user_id: techUser.user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        company_id: company.id,
        is_active: true
      })
      .select('id')
      .single()

    if (techError || !technician) {
      console.error('Failed to create technician:', techError)
      throw new Error('فشل في إنشاء ملف الفني')
    }

    // Create wallet for technician
    const { error: walletError } = await adminClient
      .from('wallets')
      .insert({
        owner_type: 'technician',
        owner_id: technician.id,
        balance: 0,
        currency: 'SAR'
      })

    if (walletError) {
      console.error('Failed to create wallet:', walletError)
      throw new Error('فشل في إنشاء محفظة الفني')
    }

    // Insert SINGLE skill record
    const { error: skillError } = await adminClient
      .from('technician_skills')
      .insert({
        technician_id: technician.id,
        category_id: parseInt(categoryId, 10)
      })

    if (skillError) {
      console.error('Failed to insert skill:', skillError)
      throw new Error('فشل في حفظ مهارة الفني')
    }
  } catch (err) {
    console.error('Error in addCompanyTechnician:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة الفني'
  }

  revalidatePath('/company/dashboard')

  if (errorMessage) {
    redirect(`/company/dashboard?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect('/company/dashboard?success=technician_added')
}

// COMPLETE JOB ACTION (Technician completes work & triggers commission split)
// ============================================

export async function completeJobAction(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const jobId = formData.get('jobId') as string

  let errorMessage: string | null = null

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }

    // Get technician
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (techError || !technician) {
      throw new Error('لم يتم العثور على ملف الفني')
    }

    // Verify job is assigned to this technician
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, assigned_technician_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new Error('لم يتم العثور على الطلب')
    }

    if (job.status !== 'assigned') {
      throw new Error('لا يمكن إنهاء هذا الطلب في حالته الحالية')
    }

    if (job.assigned_technician_id !== technician.id) {
      throw new Error('هذا الطلب ليس مسنداً لك')
    }

    // Call the database RPC function to handle completion + transfer
    const { data, error: rpcError } = await supabase.rpc('complete_job_and_transfer', {
      p_job_id: parseInt(jobId, 10),
      p_technician_user_id: user.id
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error(rpcError.message || 'فشل في إنهاء الطلب')
    }

    console.log('Job completed successfully:', data)
  } catch (err) {
    console.error('Error in completeJobAction:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إنهاء الطلب'
  }

  revalidatePath(`/technician/jobs/${jobId}`)
  revalidatePath('/')

  if (errorMessage) {
    redirect(`/technician/jobs/${jobId}?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect(`/?success=${encodeURIComponent('تم إنهاء العمل وتحويل الأموال بنجاح! 🎉')}`)
}

// SUBMIT REVIEW ACTION
// ============================================

export async function submitReview(formData: FormData) {
  'use server'
  const supabase = await createClient()

  const jobId = formData.get('jobId') as string
  const rating = parseInt(formData.get('rating') as string, 10)
  const comment = formData.get('comment') as string

  let errorMessage: string | null = null
  let revalidationPath: string | null = null

  try {
    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }

    // 2. Determine user role
    const { data: customer } = await supabase.from('customers').select('id').eq('user_id', user.id).maybeSingle()
    const { data: technician } = await supabase.from('technicians').select('id').eq('user_id', user.id).maybeSingle()

    let reviewer_role: 'customer' | 'technician' | null = null
    let reviewer_id: number | null = null

    if (customer) {
      reviewer_role = 'customer'
      reviewer_id = customer.id
      revalidationPath = `/jobs/${jobId}`
    } else if (technician) {
      reviewer_role = 'technician'
      reviewer_id = technician.id
      revalidationPath = `/technician/jobs/${jobId}`
    } else {
      throw new Error('لا يمكن تحديد دور المستخدم')
    }

    // 3. Validate input
    if (!jobId || !rating || rating < 1 || rating > 5) {
      throw new Error('بيانات التقييم غير صالحة')
    }

    // 4. Insert into job_reviews
    const { error: reviewError } = await supabase.from('job_reviews').insert({
      job_id: parseInt(jobId, 10),
      reviewer_id,
      reviewer_role,
      rating,
      comment: comment || null,
    })

    if (reviewError) {
      // Handle case where review already exists
      if (reviewError.code === '23505') { // unique_violation
        throw new Error('لقد قمت بتقييم هذا الطلب مسبقاً')
      }
      console.error('Failed to insert review:', reviewError)
      throw new Error('فشل في حفظ التقييم')
    }

  } catch (err) {
    console.error('Error in submitReview:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال التقييم'
  }

  // 5. Revalidate and Redirect
  if (revalidationPath) {
    revalidatePath(revalidationPath)
    if (errorMessage) {
      redirect(`${revalidationPath}?error=${encodeURIComponent(errorMessage)}`)
    }
    redirect(`${revalidationPath}?success=review_submitted`)
  } else {
    // Fallback redirect
    redirect(`/?error=${encodeURIComponent(errorMessage || 'حدث خطأ غير متوقع')}`)
  }
}
