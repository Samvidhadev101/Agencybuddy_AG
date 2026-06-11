import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useApp();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !agencyName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            agency_name: agencyName,
            phone
          }
        }
      });

      if (authError) {
        setError(authError.message);
      } else {
        setUser(data.user);
        navigate('/onboarding');
      }
    } catch (err) {
      setError('An error occurred during sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg bg-grid-pattern flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="w-full max-w-[760px] max-h-[95vh] overflow-y-auto scrollbar-thin bg-panel-white border border-border-light rounded-lg shadow-lg p-8 flex flex-col gap-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2 flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Agency Buddy Logo" className="h-16 w-auto object-contain" />
          <p className="font-mono text-[11px] font-semibold text-text-muted tracking-wider uppercase">
            Create your new workspace
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-error-red text-xs rounded leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div className="space-y-1">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">
              Full Name *
            </label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aravind Kumar"
              className="w-full h-9 border border-border-light rounded px-3 text-xs focus:outline-none focus:border-primary-cyan"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">
              Agency Name *
            </label>
            <input 
              type="text" 
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Alpha Digital"
              className="w-full h-9 border border-border-light rounded px-3 text-xs focus:outline-none focus:border-primary-cyan"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">
              Email *
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aravind@alphadigital.in"
              className="w-full h-9 border border-border-light rounded px-3 text-xs focus:outline-none focus:border-primary-cyan"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">
              Phone Number
            </label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 00112 (optional)"
              className="w-full h-9 border border-border-light rounded px-3 text-xs focus:outline-none focus:border-primary-cyan"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">
              Password *
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full h-9 border border-border-light rounded px-3 text-xs focus:outline-none focus:border-primary-cyan"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[11px] font-bold text-text-secondary uppercase">
              Confirm *
            </label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              className="w-full h-9 border border-border-light rounded px-3 text-xs focus:outline-none focus:border-primary-cyan"
            />
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 pt-1 cursor-pointer sm:col-span-2">
            <input 
              type="checkbox" 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 text-primary-cyan"
            />
            <span className="text-[11px] text-text-secondary leading-normal">
              I agree to the Terms of Service & Privacy Policy of Agency Buddy.
            </span>
          </label>

          <button 
            type="submit" 
            disabled={loading}
            className="sm:col-span-2 w-full h-10 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Start Free Trial'}
          </button>
        </form>

        {/* Footer Subtitle */}
        <div className="text-center space-y-3 border-t border-border-light pt-4">
          <p className="font-mono text-[11px] font-semibold text-text-secondary leading-none">
            14-DAY FREE TRIAL · 20 AI TOKENS · 3 CLIENT SLOTS
          </p>
          <p className="text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-cyan font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>

      </div>

      <p className="text-center text-[10px] text-text-muted mt-4 font-mono">
        Samvidha.ai © 2026 · All rights reserved
      </p>
    </div>
  );
}
