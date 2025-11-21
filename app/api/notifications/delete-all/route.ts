import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete all user notifications
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/notifications', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
