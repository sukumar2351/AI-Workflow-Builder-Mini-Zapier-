import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, User as UserIcon, Save, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfileKeys } = useAuth();
  const [geminiApiKey, setGeminiApiKey] = useState(user?.apiKeys?.geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      await updateProfileKeys(geminiApiKey);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Update key error:', err);
      setError(err.response?.data?.message || 'Failed to update API key configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-900 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Profile & Keys Settings</h1>
        <p className="text-sm text-gray-400">Manage your identity credentials and AI integration keys.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Card Info */}
        <div className="md:col-span-1 glass-panel border border-neutral-800 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border border-neutral-850 p-1 mb-4 shadow-lg">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
              alt={user?.name}
              className="w-full h-full rounded-full bg-neutral-900 object-cover"
            />
          </div>
          <h3 className="text-md font-bold text-white mb-0.5">{user?.name}</h3>
          <p className="text-xs text-gray-400 mb-4">{user?.email}</p>
          <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded-full">
            Free Developer Tier
          </span>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 glass-panel border border-neutral-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Identity Info */}
            <div className="space-y-4 border-b border-neutral-900 pb-6">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-indigo-400" />
                Account Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    User Display Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name || ''}
                    className="w-full bg-neutral-900/40 border border-neutral-850/80 rounded-xl px-3.5 py-2.5 text-xs text-gray-500 outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full bg-neutral-900/40 border border-neutral-850/80 rounded-xl px-3.5 py-2.5 text-xs text-gray-500 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* API Keys configuration */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-400" />
                Integration Keys
              </h4>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Gemini API Key updated and saved successfully.</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder-gray-650 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  If left blank, FlowGenius AI uses a global fallback key. Providing your own key ensures higher rate-limits and access to direct model calls. Get keys from the{' '}
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-3 text-xs font-semibold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Keys'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
