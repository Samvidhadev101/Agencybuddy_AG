import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { seedDatabase } from '../lib/seedData';

// ─── Google Sign-In helper ──────────────────────────────────────────────────
// Replace VITE_GOOGLE_CLIENT_ID in .env.local with your actual OAuth client id
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [googleReady, setGoogleReady]   = useState(false);
  const navigate = useNavigate();
  const { setUser } = useApp();

  // ── Load Google Identity Services SDK ──────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setGoogleReady(true);
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // ── Render Google button after SDK is ready ─────────────────────────────
  useEffect(() => {
    if (googleReady && window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        }
      );
    }
  }, [googleReady]);

  // ── Handle Google credential response ──────────────────────────────────
  const handleGoogleResponse = async (response) => {
    setError('');
    setLoading(true);
    try {
      const payload = parseJwt(response.credential);
      if (!payload) throw new Error('Invalid Google token');

      const { email: gEmail, name, sub, picture } = payload;

      // Check if user already exists in local DB
      let users = JSON.parse(localStorage.getItem('db_users') || '[]');
      let matched = users.find(u => u.email.toLowerCase() === gEmail.toLowerCase());

      if (!matched) {
        // Auto-register the Google user
        const agencies = JSON.parse(localStorage.getItem('db_agencies') || '[]');
        const agencyId = agencies[0]?.id || 'age_default_id';
        const newUserId = 'usr_' + sub.slice(0, 8);

        const newUser = {
          id: newUserId,
          agency_id: agencyId,
          full_name: name || gEmail.split('@')[0],
          email: gEmail,
          role: 'admin',
          phone: '',
          avatar_url: picture || null,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        users.push(newUser);
        localStorage.setItem('db_users', JSON.stringify(users));
        matched = newUser;
      }

      const sessionUser = {
        id: matched.id,
        email: matched.email,
        user_metadata: { full_name: matched.full_name, avatar_url: matched.avatar_url }
      };
      localStorage.setItem('auth_user', JSON.stringify(sessionUser));
      localStorage.setItem('auth_session', JSON.stringify({ user: sessionUser }));
      setUser(sessionUser);
      navigate('/dashboard');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

          {/* ── Credentials info box ───────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} className="text-primary-cyan" />
              <span className="font-mono text-[10px] font-bold text-primary-cyan uppercase tracking-wider">Your Admin Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-mono text-[9px] text-text-muted uppercase block">Email</span>
                <span className="font-semibold text-text-primary font-mono">admin@agencybuddy.io</span>
              </div>
              <div>
                <span className="font-mono text-[9px] text-text-muted uppercase block">Password</span>
                <span className="font-semibold text-text-primary font-mono">Admin@123</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-error-red text-xs rounded-lg leading-relaxed">
              {error}
            </div>
          )}

          {/* ── Google Sign In ─────────────────────────────────────────────── */}
          {GOOGLE_CLIENT_ID ? (
            <div>
              <div id="google-signin-btn" className="w-full" />
            </div>
          ) : (
            <div className="w-full py-2.5 px-4 border-2 border-dashed border-border-light rounded-lg text-xs text-text-muted text-center font-mono">
              Google Sign In — paste <code className="font-bold">VITE_GOOGLE_CLIENT_ID</code> in .env.local to activate
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-[10px] font-mono text-text-muted uppercase">or sign in with email</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

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
                Create workspace
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-muted mt-4 font-mono">
          Agency Buddy © {new Date().getFullYear()} · All data stored locally in your browser
        </p>
      </div>
    </div>
  );
}
