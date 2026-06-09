import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) {
        setError(loginError.message)
      } else {
        // Redirect to calculator on successful login
        navigate('/')
      }
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (signupError) {
        setError(signupError.message)
      } else {
        setError(null)
        // Show success message
        alert('Check your email for confirmation link!')
        setFormData({ email: '', password: '' })
        setIsLogin(true)
      }
    } catch (err) {
      setError('An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = isLogin ? handleLogin : handleSignup

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(224,58%,33%)] to-[hsl(224,58%,20%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[hsl(45,93%,47%)] rounded-lg flex items-center justify-center font-bold text-[hsl(222,47%,11%)] mx-auto mb-4">
              Cp
            </div>
            <h1 className="text-3xl font-bold text-slate-900">CreditPro</h1>
            <p className="text-slate-500 text-sm mt-1">Underwriting engine</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(224,58%,33%)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(224,58%,33%)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(224,58%,33%)] hover:bg-[hsl(224,58%,28%)] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          {/* Toggle Login/Signup */}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
              setFormData({ email: '', password: '' })
            }}
            className="w-full text-center py-2.5 text-sm font-medium text-[hsl(224,58%,33%)] hover:text-[hsl(224,58%,28%)]"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-white text-sm">
          <p>Secure authentication powered by Supabase</p>
        </div>
      </div>
    </div>
  )
}
