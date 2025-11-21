'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function sendResetLink(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    redirect('/forgot-password?error=invalid_email')
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    console.error('Reset password error:', error)
    redirect('/forgot-password?error=reset_failed')
  }

  redirect('/forgot-password?success=true')
}
