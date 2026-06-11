import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Github, Chrome, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginProps {
  onNavigateToRegister: () => void;
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister, onSuccess }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleGoogleSignIn = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1';
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden px-4">
      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-pink-600/10 blur-[100px] pointer-events-none" />

      {/* Card container */}
      <div className="w-full max-w-[460px] glass-panel glass-card-glow rounded-2xl p-8 md:p-10 z-10 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <span className="text-xl font-black text-white">FG</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-gray-400 text-center">
            Power up your automations with <span className="text-indigo-400 font-semibold">FlowGenius AI</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Password
              </label>
              <a href="#" className="text-xs text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#101014] px-3 text-gray-500 font-semibold tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all mb-6 disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-indigo-400" />
          <span>Sign in with Google</span>
        </button>

        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={onNavigateToRegister}
            className="text-indigo-400 font-semibold hover:underline"
          >
            Create one for free
          </button>
        </p>
      </div>
    </div>
  );
};
