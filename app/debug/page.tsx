import { createClient } from '@/utils/supabase/server'

export default async function DebugPage() {
  const supabase = await createClient()
  
  const output: {
    timestamp: string
    checks: Record<string, unknown>
    errors: string[]
  } = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: []
  }

  try {
    // 1. Get ALL customers (no filter)
    const { data: allCustomers, error: err1 } = await supabase
      .from('customers')
      .select('id, full_name, user_id, created_at')
      .limit(5)
    
    output.checks.all_customers = { count: allCustomers?.length || 0, data: allCustomers, error: err1?.message }

    // 2. Get ALL jobs (no filter)
    const { data: allJobs, error: err2 } = await supabase
      .from('jobs')
      .select('*')
      .limit(10)
    
    output.checks.all_jobs = { count: allJobs?.length || 0, data: allJobs?.slice(0, 3), error: err2?.message }

    // 3. Get ALL wallets
    const { data: allWallets, error: err3 } = await supabase
      .from('wallets')
      .select('*')
      .limit(5)
    
    output.checks.all_wallets = { count: allWallets?.length || 0, data: allWallets, error: err3?.message }

    // 4. Get addresses
    const { data: allAddresses, error: err4 } = await supabase
      .from('customer_addresses')
      .select('*')
      .limit(5)
    
    output.checks.all_addresses = { count: allAddresses?.length || 0, data: allAddresses?.slice(0, 2), error: err4?.message }

    // 5. Get service categories
    const { data: categories, error: err5 } = await supabase
      .from('service_categories')
      .select('*')
    
    output.checks.service_categories = { count: categories?.length || 0, error: err5?.message }

  } catch (err) {
    output.errors.push(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">🔍 Debug Panel - Database Inspection</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  )
}
