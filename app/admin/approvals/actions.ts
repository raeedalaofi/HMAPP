'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function approveCompany(companyId: number) {
  'use server'
  const adminClient = await createAdminClient()

  let errorMessage: string | null = null

  try {
    const { error } = await adminClient
      .from('companies')
      .update({ is_active: true })
      .eq('id', companyId)

    if (error) {
      console.error('Failed to approve company:', error)
      throw new Error('فشل في قبول الشركة')
    }
  } catch (err) {
    console.error('Error in approveCompany:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء قبول الشركة'
  }

  revalidatePath('/admin/approvals')

  if (errorMessage) {
    redirect(`/admin/approvals?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect('/admin/approvals?success=company_approved')
}

export async function rejectCompany(companyId: number) {
  'use server'
  const adminClient = await createAdminClient()

  let errorMessage: string | null = null

  try {
    // Option 1: Delete the company (harsh)
    // const { error } = await adminClient
    //   .from('companies')
    //   .delete()
    //   .eq('id', companyId)

    // Option 2: Suspend/Deactivate (recommended)
    const { error } = await adminClient
      .from('companies')
      .update({ is_active: false })
      .eq('id', companyId)

    if (error) {
      console.error('Failed to reject company:', error)
      throw new Error('فشل في رفض الشركة')
    }
  } catch (err) {
    console.error('Error in rejectCompany:', err)
    errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء رفض الشركة'
  }

  revalidatePath('/admin/approvals')

  if (errorMessage) {
    redirect(`/admin/approvals?error=${encodeURIComponent(errorMessage)}`)
  }

  redirect('/admin/approvals?success=company_rejected')
}
