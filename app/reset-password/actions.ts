'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validate passwords match
  if (password !== confirmPassword) {
    redirect('/reset-password?error=passwords_mismatch')
  }

  // Validate password strength
  if (password.length < 6) {
    redirect('/reset-password?error=weak_password')
  }

  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error('Update password error:', error)
    redirect('/reset-password?error=update_failed')
  }

  // Success - redirect to home with success message
  redirect('/?success=password_updated')
}
