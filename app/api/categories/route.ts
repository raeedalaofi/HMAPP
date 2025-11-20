import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    return Response.json(categories || [])
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
