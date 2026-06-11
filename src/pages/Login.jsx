import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { seedDatabase } from '../lib/seedData';

// Cleaned up unused Google OAuth imports/helpers

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();
  const { setUser } = useApp();

  // ── Email / password login ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      // Ensure seed data exists
      seedDatabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
      } else {
        setUser(data.user);
        navigate('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-100 flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="w-full max-w-[420px]">

        {/* Card */}
        <div className="bg-panel-white border border-border-light rounded-2xl shadow-xl p-8 flex flex-col gap-5">

          {/* Logo + heading */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <img src="/logo.png" alt="Agency Buddy" className="h-14 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">Welcome back</h1>
              <p className="text-xs text-text-secondary mt-0.5">Sign in to your Agency Buddy workspace</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-error-red text-xs rounded-lg leading-relaxed mb-4">
              {error}
            </div>
          )}

          {/* ── Email / Password form ──────────────────────────────────────── */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@agencybuddy.io"
                className="w-full h-10 border border-border-light rounded-lg px-3 text-sm focus:outline-none focus:border-primary-cyan focus:ring-2 focus:ring-primary-cyan/15 placeholder-text-muted transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block font-mono text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-secondary hover:text-text-primary text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showPassword ? 'HIDE' : 'SHOW'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 border border-border-light rounded-lg px-3 text-sm focus:outline-none focus:border-primary-cyan focus:ring-2 focus:ring-primary-cyan/15 placeholder-text-muted transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-border-light pt-4 text-center">
            <p className="text-xs text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-cyan font-bold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-muted mt-4 font-mono">
          Samvidha.ai © 2026 · All rights reserved
        </p>
      </div>
    </div>
  );
}
