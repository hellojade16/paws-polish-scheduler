// src/components/LoginPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/admin'); 
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen bg-white">
      
      {/* LEFT SIDE: FORM PANEL */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-between px-8 sm:px-16 lg:px-20 py-12 relative z-10 bg-white">
        
        {/* Left-aligned Branding Header matching image_7fb28d.png */}
        <div className="flex items-center select-none">
          <span className="text-xl font-black text-slate-900 tracking-tight">
            Paws <span className="text-teal-600">&</span> Polish
          </span>
        </div>

        {/* Center Form Area */}
        <div className="w-full max-w-sm mx-auto my-auto py-10">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 text-sm mt-2">Enter your credentials to access the management panel.</p>
          </div>

          {/* Inline Error State */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <svg className="w-4 h-4 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Email Address</label>
              <input 
                type="email" 
                placeholder="admin@pawsandpolish.com" 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-300" 
                required 
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-300" 
                required 
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-teal-600/10 hover:shadow-teal-600/20 active:scale-[0.99] flex items-center justify-center text-sm mt-8 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>
        </div>

        {/* Bottom Spacer Component */}
        <div className="text-xs text-slate-400 hidden lg:block select-none">
          Admin Access Workspace
        </div>
      </div>

      {/* RIGHT SIDE: HERO DESIGN PANEL */}
      <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-950 p-16 flex-col justify-between relative overflow-hidden">
        
        {/* Subtle geometric background blur elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.03] rounded-full translate-x-20 -translate-y-20 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-teal-600/[0.1] rounded-full -translate-x-32 translate-y-32 blur-3xl pointer-events-none"></div>

        {/* Top Left-Aligned Brand Header (High Contrast variant) */}
        <div className="relative z-10 select-none">
          <span className="text-2xl font-black text-white tracking-tight">
            Paws <span className="text-teal-300">&</span> Polish
          </span>
        </div>

        {/* Main Center Callout */}
        <div className="max-w-xl my-auto relative z-10">
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            Pamper your pet.<br />
            <span className="text-teal-300">Stress-free booking.</span>
          </h1>
          <p className="text-teal-100/70 mt-4 text-base max-w-md font-medium leading-relaxed">
            The standard hub workspace designed to control schedules, update active groomer databases, and maintain flawless appointments seamlessly.
          </p>
        </div>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between text-xs font-semibold text-teal-200/40 relative z-10 select-none">
          <span>© Paws & Polish Workspace</span>
          <span>v2.4.0</span>
        </div>

      </div>

    </div>
  );
}