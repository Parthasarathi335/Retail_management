'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cake, Lock, Mail, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email/admin username and password.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid administrator email or password. Access is restricted.')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      if (data?.session) {
        router.push(redirectTo)
        router.refresh()
      } else {
        setError('Authentication session could not be established.')
        setLoading(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected authentication error occurred.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-gray-800">Administrator Login</h2>
        <p className="text-xs text-gray-500 mt-1">
          Authorized management access only. Public registration is disabled.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Supabase is not configured yet. Add{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to this
            deployment&apos;s environment variables.
          </span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email / Admin Username */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Admin Email / Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/60">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cakezone.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/60">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-amber-800 hover:bg-amber-900 text-amber-50 font-medium text-sm rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Bakery Dashboard</span>
          )}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-amber-100 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-amber-900 text-amber-50 p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 bg-amber-800/80 rounded-full flex items-center justify-center mb-3 shadow-inner border border-amber-700/50">
                <Cake className="w-8 h-8 text-amber-300" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-amber-100 font-serif">
                CakeZone
              </h1>
              <p className="text-xs text-amber-300 font-medium tracking-wide uppercase mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Private Admin Portal
              </p>
            </div>
          </div>

          {/* Form wrapped in Suspense boundary */}
          <Suspense fallback={
            <div className="p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>Loading secure login...</span>
            </div>
          }>
            <LoginForm />
          </Suspense>

          {/* Footer Info */}
          <div className="px-6 py-4 bg-amber-50/50 border-t border-amber-100 text-center text-xs text-amber-900/70 flex items-center justify-center gap-1.5">
            <span>🍰 CakeZone Business Order Management</span>
          </div>
        </div>
      </div>
    </div>
  )
}
