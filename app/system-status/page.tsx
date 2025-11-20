'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

interface CheckResult {
  name: string
  status: 'success' | 'error'
  latency: number
  message: string
  details?: string
}

async function runDiagnostics(): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  
  try {
    const supabase = createClient()

    // Check 1: Service Categories
    try {
      const start1 = Date.now()
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, name_ar')
        .limit(5)
      const latency1 = Date.now() - start1

      if (error) {
        results.push({
          name: 'Service Categories',
          status: 'error',
          latency: latency1,
          message: error.message,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        results.push({
          name: 'Service Categories',
          status: 'success',
          latency: latency1,
          message: `✅ Fetched ${data?.length || 0} categories`,
          details: data ? JSON.stringify(data.slice(0, 2), null, 2) : undefined
        })
      }
    } catch (err) {
      results.push({
        name: 'Service Categories',
        status: 'error',
        latency: 0,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: String(err)
      })
    }

    // Check 2: Companies Count
    try {
      const start2 = Date.now()
      const { count, error } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
      const latency2 = Date.now() - start2

      if (error) {
        results.push({
          name: 'Companies Table',
          status: 'error',
          latency: latency2,
          message: error.message,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        results.push({
          name: 'Companies Table',
          status: 'success',
          latency: latency2,
          message: `✅ Count: ${count ?? 0} companies`,
          details: `RLS Policy: ${count !== null ? 'Accessible' : 'Blocked or Empty'}`
        })
      }
    } catch (err) {
      results.push({
        name: 'Companies Table',
        status: 'error',
        latency: 0,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: String(err)
      })
    }

    // Check 3: Wallets Connection
    try {
      const start3 = Date.now()
      const { count, error } = await supabase
        .from('wallets')
        .select('*', { count: 'exact', head: true })
      const latency3 = Date.now() - start3

      if (error) {
        results.push({
          name: 'Wallets Table',
          status: 'error',
          latency: latency3,
          message: error.message,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        results.push({
          name: 'Wallets Table',
          status: 'success',
          latency: latency3,
          message: `✅ Count: ${count ?? 0} wallets`,
          details: `RLS Policy: ${count !== null ? 'Accessible' : 'Blocked or Empty'}`
        })
      }
    } catch (err) {
      results.push({
        name: 'Wallets Table',
        status: 'error',
        latency: 0,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: String(err)
      })
    }

    // Check 4: Auth Status
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error && error.message !== 'Auth session missing!') {
        results.push({
          name: 'Auth Status',
          status: 'error',
          latency: 0,
          message: error.message,
          details: JSON.stringify(error, null, 2)
        })
      } else {
        results.push({
          name: 'Auth Status',
          status: 'success',
          latency: 0,
          message: user ? `✅ Logged in as: ${user.email}` : '⚠️ Not authenticated (guest)',
          details: user ? `User ID: ${user.id}\nRole: ${user.user_metadata?.role || 'N/A'}` : 'No active session'
        })
      }
    } catch (err) {
      results.push({
        name: 'Auth Status',
        status: 'error',
        latency: 0,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: String(err)
      })
    }
  } catch (err) {
    results.push({
      name: 'Critical Error',
      status: 'error',
      latency: 0,
      message: err instanceof Error ? err.message : 'Failed to create Supabase client',
      details: String(err)
    })
  }

  return results
}

export default function SystemStatusPage() {
  const [results, setResults] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics().then(data => {
      setResults(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Running diagnostics...</p>
        </div>
      </main>
    )
  }

  const allPassed = results.every(r => r.status === 'success' || r.name === 'Auth Status')

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔍 System Status Dashboard
          </h1>
          <p className="text-slate-400">
            Supabase Connection & RLS Policy Health Check
          </p>
          <div className={`inline-block mt-4 px-6 py-2 rounded-full text-sm font-semibold ${
            allPassed 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {allPassed ? '✅ All Systems Operational' : '⚠️ Some Issues Detected'}
          </div>
        </div>

        {/* Diagnostic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((result, index) => (
            <div
              key={index}
              className={`rounded-xl p-6 border-2 transition-all hover:scale-105 ${
                result.status === 'success'
                  ? 'bg-slate-800/50 border-green-500/30'
                  : 'bg-slate-800/50 border-red-500/30'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {result.name}
                </h3>
                <span className={`text-3xl ${
                  result.status === 'success' ? 'animate-pulse' : ''
                }`}>
                  {result.status === 'success' ? '✅' : '❌'}
                </span>
              </div>

              {/* Status Message */}
              <p className={`text-sm mb-3 ${
                result.status === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.message}
              </p>

              {/* Latency */}
              {result.latency > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-slate-500 text-xs">⏱️ Latency:</span>
                  <span className={`text-xs font-mono px-2 py-1 rounded ${
                    result.latency < 100 
                      ? 'bg-green-500/20 text-green-400'
                      : result.latency < 500
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {result.latency}ms
                  </span>
                </div>
              )}

              {/* Details */}
              {result.details && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                    Show Details
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-900/80 rounded text-xs text-slate-300 overflow-x-auto border border-slate-700">
                    {result.details}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">📋 Notes</h3>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>• This page is for <strong className="text-yellow-400">diagnostic purposes only</strong>. Remove before production.</li>
            <li>• If you see RLS errors, ensure your policies allow SELECT for anonymous or authenticated roles.</li>
            <li>• Latency under 100ms is excellent, 100-500ms is acceptable, over 500ms may indicate network issues.</li>
            <li>• Auth Status shows whether you&apos;re logged in. Guest access is normal for this diagnostic page.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            ← Back to Home
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition"
          >
            🔄 Refresh Diagnostics
          </button>
        </div>
      </div>
    </main>
  )
}
